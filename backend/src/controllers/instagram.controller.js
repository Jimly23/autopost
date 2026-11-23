import crypto from 'crypto';
import prisma from '../config/database.js';
import instagramConfig from '../config/instagram.js';
import env from '../config/env.js';
import * as oauthService from '../services/instagram/oauth.service.js';
import * as tokenService from '../services/instagram/token.service.js';
import * as profileService from '../services/instagram/profile.service.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/api-response.js';
import logger from '../utils/logger.js';

/**
 * GET /api/instagram/connect
 * Initiates Instagram OAuth flow.
 */
export async function connect(req, res, next) {
  try {
    if (!instagramConfig.isConfigured()) {
      return errorResponse(res, 'Instagram API is not configured. Please set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI in your environment.', 503);
    }

    const userId = req.session.userId;
    if (!userId) {
      return errorResponse(res, 'Authentication required to connect social account', 401);
    }

    // Encrypt state containing userId and timestamp (anti-CSRF and cross-domain resilient)
    const statePayload = JSON.stringify({
      userId,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    });
    const state = Buffer.from(encrypt(statePayload)).toString('hex');
    req.session.oauthState = state;

    // Save session before redirect
    req.session.save((err) => {
      if (err) return next(err);

      const { url } = oauthService.generateAuthorizationUrl(state);
      return res.redirect(url);
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/instagram/callback
 * Handles Instagram OAuth callback.
 */
export async function callback(req, res, next) {
  try {
    const { code, state, error: oauthError, error_reason, error_description } = req.query;

    // Handle user denying permission
    if (oauthError) {
      logger.warn('Instagram OAuth denied:', { oauthError, error_reason, error_description });
      return res.redirect(`${env.FRONTEND_URL}/instagram/connect?status=error&message=${encodeURIComponent(error_description || 'Access denied')}`);
    }

    if (!code || !state) {
      return res.redirect(`${env.FRONTEND_URL}/instagram/connect?status=error&message=${encodeURIComponent('No authorization code or state received')}`);
    }

    // Validate state and extract userId
    let targetUserId = req.session?.userId;
    try {
      const decryptedJson = decrypt(Buffer.from(state, 'hex').toString('utf8'));
      const parsed = JSON.parse(decryptedJson);

      // Check expiry (15 minutes)
      if (!parsed.userId || !parsed.timestamp || Date.now() - parsed.timestamp > 15 * 60 * 1000) {
        throw new Error('OAuth state expired');
      }

      targetUserId = parsed.userId;
    } catch (err) {
      // Fallback for raw state matching session (unit tests or same-origin)
      if (req.session?.oauthState && state === req.session.oauthState && req.session?.userId) {
        targetUserId = req.session.userId;
      } else {
        logger.warn('Invalid OAuth state validation failed:', err.message);
        return res.redirect(`${env.FRONTEND_URL}/instagram/connect?status=error&message=${encodeURIComponent('Invalid OAuth state. Please try again.')}`);
      }
    }

    if (!targetUserId) {
      logger.warn('No userId associated with OAuth callback');
      return res.redirect(`${env.FRONTEND_URL}/instagram/connect?status=error&message=${encodeURIComponent('User session not found. Please log in again.')}`);
    }

    // Clear used state if present
    if (req.session) {
      delete req.session.oauthState;
    }

    // Step 1: Exchange code for token
    const tokenResult = await oauthService.exchangeCodeForToken(code);

    // Step 2: Exchange for long-lived token
    const longLived = await oauthService.exchangeForLongLivedToken(tokenResult.accessToken);

    // Step 3: Fetch profile
    const profile = await profileService.getUserProfile(longLived.accessToken, tokenResult.userId);

    // Step 4: Upsert social account
    const socialAccount = await prisma.socialAccount.upsert({
      where: {
        platform_account_unique: {
          platform: 'instagram',
          platformUserId: profile.platformUserId,
        },
      },
      create: {
        userId: targetUserId,
        platform: 'instagram',
        platformUserId: profile.platformUserId,
        username: profile.username,
        accountType: profile.accountType,
        profilePicture: profile.profilePicture,
      },
      update: {
        username: profile.username,
        accountType: profile.accountType,
        profilePicture: profile.profilePicture,
        userId: targetUserId,
      },
    });

    // Step 5: Store encrypted token
    await tokenService.storeToken(socialAccount.id, {
      accessToken: longLived.accessToken,
      tokenType: longLived.tokenType,
      expiresIn: longLived.expiresIn,
      scopes: instagramConfig.scopes.join(','),
    });

    logger.info(`Instagram account connected: @${profile.username} for user ${targetUserId}`);

    // Redirect back to frontend with success
    return res.redirect(`${env.FRONTEND_URL}/instagram/connect?status=success&account=${encodeURIComponent(profile.username)}`);
  } catch (error) {
    logger.error('Instagram callback error:', error.message);
    return res.redirect(`${env.FRONTEND_URL}/instagram/connect?status=error&message=${encodeURIComponent(error.message || 'Connection failed')}`);
  }
}

/**
 * GET /api/instagram/accounts
 * List all connected Instagram accounts for the current user.
 */
export async function listAccounts(req, res, next) {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: req.session.userId,
        platform: 'instagram',
      },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        username: true,
        accountType: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        token: {
          select: {
            expiresAt: true,
            tokenType: true,
            scopes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add token status without exposing the actual token
    const accountsWithStatus = accounts.map((account) => ({
      ...account,
      tokenStatus: account.token
        ? {
            isExpired: account.token.expiresAt ? new Date() > account.token.expiresAt : false,
            isNearExpiry: account.token.expiresAt
              ? tokenService.isTokenNearExpiry(account.token.expiresAt)
              : false,
            expiresAt: account.token.expiresAt,
          }
        : null,
      token: undefined, // Don't send token details
    }));

    return successResponse(res, { accounts: accountsWithStatus });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/instagram/accounts/:id
 * Get a specific connected Instagram account.
 */
export async function getAccount(req, res, next) {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: req.params.id,
        userId: req.session.userId,
        platform: 'instagram',
      },
      select: {
        id: true,
        platform: true,
        platformUserId: true,
        username: true,
        accountType: true,
        profilePicture: true,
        createdAt: true,
        updatedAt: true,
        token: {
          select: {
            expiresAt: true,
            tokenType: true,
            scopes: true,
          },
        },
      },
    });

    if (!account) {
      return notFoundResponse(res, 'Instagram account not found');
    }

    const result = {
      ...account,
      tokenStatus: account.token
        ? {
            isExpired: account.token.expiresAt ? new Date() > account.token.expiresAt : false,
            isNearExpiry: account.token.expiresAt
              ? tokenService.isTokenNearExpiry(account.token.expiresAt)
              : false,
            expiresAt: account.token.expiresAt,
          }
        : null,
      token: undefined,
    };

    return successResponse(res, { account: result });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/instagram/accounts/:id
 * Disconnect an Instagram account.
 */
export async function deleteAccount(req, res, next) {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: req.params.id,
        userId: req.session.userId,
        platform: 'instagram',
      },
    });

    if (!account) {
      return notFoundResponse(res, 'Instagram account not found');
    }

    // Check if there are pending posts
    const pendingPosts = await prisma.post.count({
      where: {
        socialAccountId: account.id,
        status: { in: ['scheduled', 'processing'] },
      },
    });

    if (pendingPosts > 0) {
      return errorResponse(res, `Cannot disconnect account with ${pendingPosts} pending post(s). Cancel or publish them first.`, 400);
    }

    // Delete account (cascades to tokens and posts)
    await prisma.socialAccount.delete({
      where: { id: account.id },
    });

    logger.info(`Instagram account disconnected: @${account.username} by user ${req.session.userId}`);

    return successResponse(res, null, 'Instagram account disconnected successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/instagram/accounts/:id/profile
 * Fetch fresh profile data from Instagram API.
 */
export async function getProfile(req, res, next) {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: req.params.id,
        userId: req.session.userId,
        platform: 'instagram',
      },
    });

    if (!account) {
      return notFoundResponse(res, 'Instagram account not found');
    }

    const { accessToken } = await tokenService.getDecryptedToken(account.id);
    const profile = await profileService.getUserProfile(accessToken, account.platformUserId);

    // Update stored profile data
    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        username: profile.username,
        accountType: profile.accountType,
        profilePicture: profile.profilePicture,
      },
    });

    return successResponse(res, { profile });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}
