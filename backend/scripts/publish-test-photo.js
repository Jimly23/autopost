/**
 * Real Photo Publishing Execution Script
 * Executes publishing of one test photo to Instagram feed (@jmyassdqi)
 * through the complete Automation SaaS pipeline (Database + Encryption + Meta API).
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';
import { encrypt } from '../src/utils/encryption.js';
import * as postService from '../src/services/post.service.js';

async function main() {
  console.log('========================================================');
  console.log('📸 STARTING LIVE INSTAGRAM PHOTO PUBLISHING EXECUTION');
  console.log('========================================================\n');

  try {
    const igUserId = process.env.INSTAGRAM_USER_ID;
    const igAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!igUserId || !igAccessToken) {
      throw new Error('INSTAGRAM_USER_ID or INSTAGRAM_ACCESS_TOKEN is missing in .env');
    }

    // Step 1: Ensure User exists in MySQL
    const userEmail = 'jimly@automation.dev';
    let user = await prisma.user.findUnique({ where: { email: userEmail } });

    if (!user) {
      const passwordHash = await bcrypt.hash('Automation123!', 12);
      user = await prisma.user.create({
        data: {
          name: 'Jimly Assidqi Hardiansyah',
          email: userEmail,
          passwordHash,
        },
      });
      console.log(`✅ User created: ${user.name} (${user.email})`);
    } else {
      console.log(`✅ User found: ${user.name} (${user.email})`);
    }

    // Step 2: Ensure SocialAccount exists
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        platform_account_unique: {
          platform: 'instagram',
          platformUserId: igUserId,
        },
      },
      create: {
        userId: user.id,
        platform: 'instagram',
        platformUserId: igUserId,
        username: 'jmyassdqi',
        accountType: 'BUSINESS',
      },
      update: {
        userId: user.id,
        username: 'jmyassdqi',
      },
    });
    console.log(`✅ Social Account connected: @${socialAccount.username} (ID: ${socialAccount.id})`);

    // Step 3: Encrypt and store SocialToken
    const encryptedToken = encrypt(igAccessToken);
    await prisma.socialToken.upsert({
      where: { socialAccountId: socialAccount.id },
      create: {
        socialAccountId: socialAccount.id,
        accessToken: encryptedToken,
        tokenType: 'bearer',
        scopes: 'instagram_basic,instagram_content_publish',
      },
      update: {
        accessToken: encryptedToken,
      },
    });
    console.log('✅ Social Token encrypted (AES-256-GCM) and saved to MySQL');

    // Step 4: Create Draft Post
    const testImageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1080&q=80';
    const testCaption = 'Automated test post from Automation Backend SaaS #testing';

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        socialAccountId: socialAccount.id,
        caption: testCaption,
        mediaType: 'IMAGE',
        mediaUrl: testImageUrl,
        status: 'draft',
      },
    });
    console.log(`✅ Draft Post created in MySQL (Post ID: ${post.id})`);
    console.log(`   Caption: "${post.caption}"`);
    console.log(`   Media URL: ${post.mediaUrl}`);

    // Step 5: Publish Post through postService.publishPost (handles transaction + Meta API)
    console.log('\n🚀 Calling Meta Content Publishing API...');
    const publishedPost = await postService.publishPost(user.id, post.id);

    console.log('\n🎉 ================= PUBLISH SUCCESS =================');
    console.log(`Post ID            : ${publishedPost.id}`);
    console.log(`Status             : ${publishedPost.status}`);
    console.log(`Instagram Media ID : ${publishedPost.platformPostId}`);
    console.log(`Published At       : ${publishedPost.publishedAt}`);
    console.log(`Target Feed        : @${socialAccount.username}`);
    console.log('========================================================\n');

    // Step 6: Verify publishing logs in MySQL
    const logs = await prisma.publishingLog.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'asc' },
    });

    console.log('📋 Audit Trail (publishing_logs):');
    for (const log of logs) {
      console.log(`- [${log.action}] Status: ${log.status} | Data: ${log.responseData || 'none'}`);
    }

  } catch (err) {
    console.error('❌ LIVE PUBLISHING FAILED:', err.message);
    if (err.igError) {
      console.error('Meta Error Details:', JSON.stringify(err.igError, null, 2));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
