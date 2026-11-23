import instagramConfig from '../../config/instagram.js';
import logger from '../../utils/logger.js';

/**
 * Get the Instagram user profile using the Graph API.
 * Supports Unified Login (assigned_instagram_accounts, me/accounts) and direct IG nodes.
 */
export async function getUserProfile(accessToken, igUserId) {
  const isFbToken = (accessToken && typeof accessToken === 'string' && accessToken.startsWith('EAA')) || !!instagramConfig.configId;

  if (isFbToken) {
    const baseUrl = instagramConfig.graphFbApiBaseUrl;

    // 1. If specific igUserId is provided, fetch its profile directly
    if (igUserId) {
      const url = `${baseUrl}/${igUserId}?fields=id,username,name,profile_picture_url&access_token=${accessToken}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.id) {
        return {
          platformUserId: String(data.id),
          username: data.username,
          name: data.name || null,
          accountType: 'BUSINESS',
          profilePicture: data.profile_picture_url || null,
        };
      }
      logger.warn(`Could not fetch profile directly for ID ${igUserId}, falling back to discovery:`, data.error?.message);
    }

    // 2. Unified Login Discovery: Check assigned_instagram_accounts edge
    try {
      const assignedUrl = `${baseUrl}/me/assigned_instagram_accounts?fields=id,username,name,profile_picture_url&access_token=${accessToken}`;
      const assignedRes = await fetch(assignedUrl);
      const assignedData = await assignedRes.json();

      if (assignedData.data && assignedData.data.length > 0) {
        const account = assignedData.data[0];
        return {
          platformUserId: String(account.id),
          username: account.username,
          name: account.name || null,
          accountType: 'BUSINESS',
          profilePicture: account.profile_picture_url || null,
        };
      }
    } catch (err) {
      logger.warn('Failed to query assigned_instagram_accounts:', err.message);
    }

    // 3. Fallback Discovery: Check me/accounts (Facebook Pages with linked Instagram accounts)
    try {
      const pagesUrl = `${baseUrl}/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url}&access_token=${accessToken}`;
      const pagesRes = await fetch(pagesUrl);
      const pagesData = await pagesRes.json();

      if (pagesData.data && pagesData.data.length > 0) {
        for (const page of pagesData.data) {
          if (page.instagram_business_account) {
            const igAccount = page.instagram_business_account;
            return {
              platformUserId: String(igAccount.id),
              username: igAccount.username,
              name: igAccount.name || page.name || null,
              accountType: 'BUSINESS',
              profilePicture: igAccount.profile_picture_url || null,
            };
          }
        }
      }
    } catch (err) {
      logger.warn('Failed to query me/accounts:', err.message);
    }

    // 4. Fallback to /me
    try {
      const meUrl = `${baseUrl}/me?fields=id,name,username&access_token=${accessToken}`;
      const meRes = await fetch(meUrl);
      const meData = await meRes.json();

      if (meData.id) {
        return {
          platformUserId: String(meData.id),
          username: meData.username || meData.name || 'instagram_user',
          name: meData.name || null,
          accountType: 'BUSINESS',
          profilePicture: null,
        };
      }
    } catch (err) {
      logger.warn('Failed to query /me:', err.message);
    }

    throw new Error('No Instagram Professional accounts found for this authenticated user.');
  }

  // Legacy IG Basic Display
  const url = `https://graph.instagram.com/me?fields=user_id,username,account_type,profile_picture_url&access_token=${accessToken}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    logger.error('Failed to fetch Instagram profile:', data.error);
    const error = new Error(data.error.message || 'Failed to fetch Instagram profile');
    error.statusCode = data.error.code === 190 ? 401 : 400;
    throw error;
  }

  return {
    platformUserId: String(data.user_id || data.id),
    username: data.username,
    accountType: data.account_type || null,
    profilePicture: data.profile_picture_url || null,
  };
}

/**
 * Refresh profile data for an existing connected account.
 */
export async function refreshProfile(accessToken, igUserId) {
  return getUserProfile(accessToken, igUserId);
}
