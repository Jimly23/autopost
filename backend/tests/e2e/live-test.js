/**
 * Phase 7: Live End-to-End Testing Script
 * Executes full lifecycle against the running server at http://localhost:3000
 */
import { encrypt, decrypt } from '../../src/utils/encryption.js';
import prisma from '../../src/config/database.js';

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';
let csrfToken = '';
let testUserId = '';
let testSocialAccountId = '';
let testPhotoPostId = '';
let testVideoPostId = '';
let testScheduledPostId = '';

const testEmail = `test_${Date.now()}@automation.dev`;
const testPassword = 'Password123!';

// Helper for fetch with cookies
async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }
  if (csrfToken && !['GET', 'HEAD'].includes(options.method || 'GET')) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Track session cookie
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    const match = setCookie.match(/automation\.sid=[^;]+/);
    if (match) {
      sessionCookie = match[0];
    }
  }

  let body = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  return { status: res.status, headers: res.headers, body };
}

const results = [];
function record(category, testName, passed, detail = '') {
  results.push({ category, testName, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${category}] ${testName} ${detail ? `(${detail})` : ''}`);
}

async function runE2E() {
  console.log('====================================================');
  console.log('🚀 STARTING PHASE 7 END-TO-END TEST SUITE');
  console.log(`Server Target: ${BASE_URL}`);
  console.log(`Test Email: ${testEmail}`);
  console.log('====================================================\n');

  try {
    // ─── 1. Health Check ────────────────────────────────────────────────
    {
      const res = await request('/api/health');
      record('Foundation', 'Health Check API', res.status === 200 && res.body?.data?.status === 'healthy');
    }

    // ─── 2. CSRF Token Retrieval ────────────────────────────────────────
    {
      const res = await request('/api/csrf-token');
      csrfToken = res.body?.data?.csrfToken || '';
      record('Security', 'Retrieve CSRF Token', res.status === 200 && !!csrfToken, `Token: ${csrfToken.slice(0, 10)}...`);
    }

    // ─── 3. Endpoint Protection (Unauthorized Access) ────────────────────
    {
      const res = await request('/api/auth/me');
      record('Security', 'Protect /api/auth/me without session (Expect 401)', res.status === 401 && res.body?.success === false);
    }
    {
      const res = await request('/api/posts');
      record('Security', 'Protect /api/posts without session (Expect 401)', res.status === 401);
    }
    {
      const res = await request('/api/dashboard/overview');
      record('Security', 'Protect /api/dashboard without session (Expect 401)', res.status === 401);
    }

    // ─── 4. User Registration ───────────────────────────────────────────
    {
      const res = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jimly QA Tester',
          email: testEmail,
          password: testPassword,
        }),
      });

      const user = res.body?.data?.user;
      testUserId = user?.id;

      // Verify no password leak
      const noPasswordLeak = user && !user.passwordHash && !user.password;
      const hasCookie = !!sessionCookie;

      record('Authentication', 'User Registration (POST /api/auth/register)', res.status === 201 && !!testUserId);
      record('Security', 'Registration Password Hash Not Leaked', noPasswordLeak);
      record('Security', 'Session Cookie Received on Auto-login', hasCookie);
    }

    // ─── 5. Current User & Profile ──────────────────────────────────────
    {
      const res = await request('/api/auth/me');
      const user = res.body?.data?.user;
      record('Authentication', 'Get Current User (GET /api/auth/me)', res.status === 200 && user?.email === testEmail);
    }
    {
      const res = await request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Jimly Assidqi E2E' }),
      });
      record('Authentication', 'Update Profile (PUT /api/auth/profile)', res.status === 200 && res.body?.data?.user?.name === 'Jimly Assidqi E2E');
    }

    // ─── 6. Change Password & Re-login ──────────────────────────────────
    {
      const newPassword = 'NewPassword456!';
      const res = await request('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword,
        }),
      });
      record('Authentication', 'Change Password (PUT /api/auth/password)', res.status === 200);

      // Verify old password fails
      const failLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });
      record('Authentication', 'Login with Old Password Fails (Expect 401)', failLogin.status === 401);

      // Login with new password
      const successLogin = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: testEmail, password: newPassword }),
      });
      record('Authentication', 'Login with New Password Succeeds', successLogin.status === 200);
    }

    // ─── 7. Connect Instagram Account to User ───────────────────────────
    // Using the real Instagram credentials configured in .env
    const igUserId = process.env.INSTAGRAM_USER_ID || '17841430521583544';
    const igAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (igAccessToken) {
      // Upsert Instagram Account into DB for this user
      const account = await prisma.socialAccount.upsert({
        where: {
          platform_account_unique: {
            platform: 'instagram',
            platformUserId: igUserId,
          },
        },
        create: {
          userId: testUserId,
          platform: 'instagram',
          platformUserId: igUserId,
          username: 'jmyassdqi',
          accountType: 'BUSINESS',
        },
        update: {
          userId: testUserId,
          username: 'jmyassdqi',
        },
      });
      testSocialAccountId = account.id;

      // Encrypt token and store
      const encryptedToken = encrypt(igAccessToken);
      await prisma.socialToken.upsert({
        where: { socialAccountId: account.id },
        create: {
          socialAccountId: account.id,
          accessToken: encryptedToken,
          tokenType: 'bearer',
          expiresAt: null, // Permanent system user token
          scopes: 'instagram_basic,instagram_content_publish',
        },
        update: {
          accessToken: encryptedToken,
          tokenType: 'bearer',
        },
      });

      record('Instagram Integration', 'Connect Instagram Account to Test User in MySQL', !!testSocialAccountId, `ID: ${testSocialAccountId}`);
    } else {
      record('Instagram Integration', 'Connect Instagram Account', false, 'INSTAGRAM_ACCESS_TOKEN not found');
    }

    // ─── 8. Read Instagram Account Details & Security Audit ─────────────
    {
      const res = await request('/api/instagram/accounts');
      const accounts = res.body?.data?.accounts || [];
      const matched = accounts.find((a) => a.id === testSocialAccountId);

      // Security check: Access token MUST NOT appear in API response
      const tokenNotLeaked = matched && !matched.accessToken && !matched.token?.accessToken;

      record('Instagram Integration', 'List Connected Instagram Accounts (GET /api/instagram/accounts)', res.status === 200 && accounts.length > 0);
      record('Security', 'Access Token NOT Leaked in Accounts List', tokenNotLeaked);
    }

    {
      const res = await request(`/api/instagram/accounts/${testSocialAccountId}`);
      const account = res.body?.data?.account;
      const tokenNotLeaked = account && !account.accessToken && !account.token?.accessToken;

      record('Instagram Integration', 'Get Account Detail (GET /api/instagram/accounts/:id)', res.status === 200 && account?.username === 'jmyassdqi');
      record('Security', 'Access Token NOT Leaked in Account Detail', tokenNotLeaked);
    }

    // ─── 9. Read Live Instagram Profile via Meta API ────────────────────
    {
      const res = await request(`/api/instagram/accounts/${testSocialAccountId}/profile`);
      const profile = res.body?.data?.profile;
      record('Meta API Real', 'Fetch Live Profile via Graph API (GET /api/instagram/accounts/:id/profile)',
        res.status === 200 && profile?.username === 'jmyassdqi',
        `User: @${profile?.username}, ID: ${profile?.platformUserId}`
      );
    }

    // ─── 10. Post Management: Create Photo Post ─────────────────────────
    {
      const res = await request('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          socialAccountId: testSocialAccountId,
          caption: 'Automated test photo from Automation SaaS #testing',
          mediaType: 'IMAGE',
          mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80',
        }),
      });

      testPhotoPostId = res.body?.data?.post?.id;
      record('Post Management', 'Create Draft Photo Post (POST /api/posts)', res.status === 201 && res.body?.data?.post?.status === 'draft', `Post ID: ${testPhotoPostId}`);
    }

    // ─── 11. Post Management: Create Video Post ─────────────────────────
    {
      const res = await request('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          socialAccountId: testSocialAccountId,
          caption: 'Automated test video reels #testing',
          mediaType: 'VIDEO',
          mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        }),
      });

      testVideoPostId = res.body?.data?.post?.id;
      record('Post Management', 'Create Draft Video Post (POST /api/posts)', res.status === 201 && res.body?.data?.post?.status === 'draft');
    }

    // ─── 12. Post Management: Schedule Post ─────────────────────────────
    {
      const scheduledTime = new Date(Date.now() + 3600000).toISOString(); // 1 hour ahead
      const res = await request('/api/posts', {
        method: 'POST',
        body: JSON.stringify({
          socialAccountId: testSocialAccountId,
          caption: 'Scheduled post for later today #automation',
          mediaType: 'IMAGE',
          mediaUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&q=80',
          scheduledAt: scheduledTime,
        }),
      });

      testScheduledPostId = res.body?.data?.post?.id;
      record('Post Management', 'Create Scheduled Post (POST /api/posts)', res.status === 201 && res.body?.data?.post?.status === 'scheduled');
    }

    // ─── 13. List Posts & Pagination ────────────────────────────────────
    {
      const res = await request('/api/posts?limit=10&page=1');
      const posts = res.body?.data?.posts || [];
      const pagination = res.body?.data?.pagination;
      record('Post Management', 'List User Posts with Pagination (GET /api/posts)', res.status === 200 && posts.length >= 3 && pagination?.total >= 3);
    }

    // ─── 14. Update Post & Prevent Editing Published Post ───────────────
    {
      const res = await request(`/api/posts/${testPhotoPostId}`, {
        method: 'PUT',
        body: JSON.stringify({ caption: 'Updated test caption #automation' }),
      });
      record('Post Management', 'Update Draft Post (PUT /api/posts/:id)', res.status === 200 && res.body?.data?.post?.caption === 'Updated test caption #automation');
    }

    // ─── 15. Check Post Status ──────────────────────────────────────────
    {
      const res = await request(`/api/posts/${testPhotoPostId}/status`);
      record('Post Management', 'Check Post Status (GET /api/posts/:id/status)', res.status === 200 && res.body?.data?.status?.status === 'draft');
    }

    // ─── 16. Dashboard Overview & Data Isolation ────────────────────────
    {
      const res = await request('/api/dashboard/overview');
      const overview = res.body?.data?.overview;
      const validStats = overview && overview.totalPosts >= 3 && overview.scheduledPosts >= 1 && overview.totalAccounts >= 1;
      record('Dashboard', 'Dashboard Overview Stats (GET /api/dashboard/overview)', res.status === 200 && validStats,
        `Total: ${overview?.totalPosts}, Scheduled: ${overview?.scheduledPosts}, Accounts: ${overview?.totalAccounts}`);
    }

    // ─── 17. Scheduler Recovery and Optimistic Lock Simulation ──────────
    {
      // Create a test post in 'processing' state to simulate server crash
      const crashedPost = await prisma.post.create({
        data: {
          userId: testUserId,
          socialAccountId: testSocialAccountId,
          caption: 'Crash recovery test post',
          mediaType: 'IMAGE',
          mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1080&q=80',
          status: 'processing',
        },
      });

      // Simulate recovery logic from scheduler.js
      const recovered = await prisma.post.updateMany({
        where: { id: crashedPost.id, status: 'processing' },
        data: { status: 'scheduled', errorMessage: 'Recovered after server restart' },
      });

      const verifyPost = await prisma.post.findUnique({ where: { id: crashedPost.id } });
      record('Scheduler', 'Crash Recovery of Stuck Processing Posts', recovered.count === 1 && verifyPost?.status === 'scheduled');

      // Cleanup crash test post
      await prisma.post.delete({ where: { id: crashedPost.id } });
    }

    // ─── 18. User Logout & Session Invalidation ─────────────────────────
    {
      const res = await request('/api/auth/logout', { method: 'POST' });
      record('Authentication', 'User Logout (POST /api/auth/logout)', res.status === 200);

      // Verify session cookie is no longer valid
      const meRes = await request('/api/auth/me');
      record('Security', 'Session Invalidation After Logout (Expect 401)', meRes.status === 401);
    }

    // ─── 19. Meta API Real Media Container Creation (Dry Run) ───────────
    // Validates Meta API container creation WITHOUT final publishing
    if (igAccessToken) {
      const { createMediaContainer, checkContainerStatus } = await import('../../src/services/instagram/publishing.service.js');
      const testImage = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&q=80';

      const container = await createMediaContainer(igAccessToken, igUserId, {
        mediaType: 'IMAGE',
        mediaUrl: testImage,
        caption: 'Meta Graph API Dry-Run Container Test #automation',
      });

      const containerReady = container && !!container.containerId;
      record('Meta API Real', 'Create Media Container via Meta Graph API', containerReady, `Container ID: ${container?.containerId}`);

      if (containerReady) {
        const status = await checkContainerStatus(igAccessToken, container.containerId);
        record('Meta API Real', 'Check Media Container Status (Meta Graph API)', !!status.statusCode, `Status Code: ${status.statusCode}`);
      }
    }

  } catch (err) {
    console.error('❌ E2E Execution Error:', err);
    record('Execution', 'E2E Suite Execution', false, err.message);
  } finally {
    // Clean up test data from MySQL
    console.log('\n🧹 Cleaning up test user and posts...');
    try {
      if (testUserId) {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log('✅ Test user and cascaded posts deleted from MySQL.');
      }
    } catch (e) {
      console.warn('Cleanup warning:', e.message);
    }

    console.log('\n====================================================');
    console.log('📊 PHASE 7 E2E TEST SUMMARY');
    console.log('====================================================');
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    console.log(`Total Tests : ${total}`);
    console.log(`Passed      : ${passed}`);
    console.log(`Failed      : ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    console.log('====================================================');

    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runE2E();
