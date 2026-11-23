import crypto from 'crypto';
import instagramConfig from '../../config/instagram.js';
import logger from '../../utils/logger.js';

/**
 * Generate the Instagram OAuth authorization URL.
 * Uses Unified Login (Facebook Login for Business with config_id) when configured,
 * or falls back to legacy Instagram Login.
 */
export function generateAuthorizationUrl(sessionState) {
  if (!instagramConfig.isConfigured()) {
    throw new Error('Instagram API is not configured. Set META_APP_ID, META_APP_SECRET, and META_REDIRECT_URI.');
  }

  const state = sessionState || crypto.randomBytes(32).toString('hex');

  // Unified Login (Instagram API with Unified Login / config_id)
  if (instagramConfig.configId) {
    const params = new URLSearchParams({
      client_id: instagramConfig.appId,
      config_id: instagramConfig.configId,
      display: 'popup',
      override_default_response_type: 'true',
      prompt: 'login',
      redirect_uri: instagramConfig.redirectUri,
      response_type: 'code',
      state,
    });

    const url = `${instagramConfig.authorizationUrl}?${params.toString()}`;
    return { url, state };
  }

  // Legacy fallback (raw scopes)
  const params = new URLSearchParams({
    client_id: instagramConfig.appId,
    redirect_uri: instagramConfig.redirectUri,
    response_type: 'code',
    scope: instagramConfig.scopes.join(','),
    state,
  });

  const url = `${instagramConfig.authorizationUrl}?${params.toString()}`;
  return { url, state };
}

/**
 * Exchange authorization code for an access token.
 * In Unified Login, calls graph.facebook.com/oauth/access_token.
 */
export async function exchangeCodeForToken(code) {
  const isUnified = !!instagramConfig.configId;

  if (isUnified) {
    // Unified Login uses graph.facebook.com oauth/access_token
    const params = new URLSearchParams({
      client_id: instagramConfig.appId,
      client_secret: instagramConfig.appSecret,
      redirect_uri: instagramConfig.redirectUri,
      code,
    });

    const url = `${instagramConfig.tokenUrl}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
    });

    const data = await response.json();

    if (data.error) {
      logger.error('Unified login token exchange failed:', data.error);
      const error = new Error(data.error.message || 'Token exchange failed');
      error.statusCode = 400;
      error.igError = data.error;
      throw error;
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type || 'bearer',
      expiresIn: data.expires_in,
      userId: data.user_id ? String(data.user_id) : undefined,
    };
  }

  // Legacy Instagram Login
  const body = new URLSearchParams({
    client_id: instagramConfig.appId,
    client_secret: instagramConfig.appSecret,
    grant_type: 'authorization_code',
    redirect_uri: instagramConfig.redirectUri,
    code,
  });

  const response = await fetch(instagramConfig.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await response.json();

  if (data.error_type || data.error_message || data.error) {
    logger.error('Token exchange failed:', data);
    const error = new Error(data.error_message || data.error?.message || 'Token exchange failed');
    error.statusCode = 400;
    throw error;
  }

  const res = {
    accessToken: data.access_token,
    userId: data.user_id ? String(data.user_id) : undefined,
  };
  if (data.token_type) res.tokenType = data.token_type;
  if (data.expires_in !== undefined) res.expiresIn = data.expires_in;
  return res;
}

/**
 * Exchange a short-lived token for a long-lived token.
 * In Unified Login (or EAA tokens), uses fb_exchange_token or preserves the Business System User token.
 */
export async function exchangeForLongLivedToken(shortLivedToken) {
  const isFbToken = (shortLivedToken && shortLivedToken.startsWith('EAA')) || !!instagramConfig.configId;

  if (isFbToken) {
    try {
      const params = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: instagramConfig.appId,
        client_secret: instagramConfig.appSecret,
        fb_exchange_token: shortLivedToken,
      });

      const versionPrefix = instagramConfig.apiVersion ? `/${instagramConfig.apiVersion}` : '';
      const url = `https://graph.facebook.com${versionPrefix}/oauth/access_token?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.access_token) {
        return {
          accessToken: data.access_token,
          tokenType: data.token_type || 'bearer',
          expiresIn: data.expires_in,
        };
      }

      // If token is already a Business Integration System User token, fb_exchange_token might return an error
      // In that case, the original token is already permanent or long-lived
      logger.info('Token already valid or non-exchangeable, using original token:', data.error?.message || 'OK');
      return {
        accessToken: shortLivedToken,
        tokenType: 'bearer',
        expiresIn: null,
      };
    } catch (err) {
      logger.warn('Could not exchange FB token, using original token:', err.message);
      return {
        accessToken: shortLivedToken,
        tokenType: 'bearer',
        expiresIn: null,
      };
    }
  }

  // Legacy IG Basic Display
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: instagramConfig.appSecret,
    access_token: shortLivedToken,
  });

  const response = await fetch(`${instagramConfig.longLivedTokenUrl}?${params.toString()}`);
  const data = await response.json();

  if (data.error) {
    logger.error('Long-lived token exchange failed:', data);
    const error = new Error(data.error?.message || 'Failed to get long-lived token');
    error.statusCode = 400;
    throw error;
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type || 'bearer',
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh a long-lived token.
 */
export async function refreshLongLivedToken(longLivedToken) {
  const isFbToken = (longLivedToken && longLivedToken.startsWith('EAA')) || !!instagramConfig.configId;

  if (isFbToken) {
    // For Facebook / Unified Login tokens, use fb_exchange_token
    return exchangeForLongLivedToken(longLivedToken);
  }

  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: longLivedToken,
  });

  const response = await fetch(`${instagramConfig.longLivedTokenUrl}?${params.toString()}`);
  const data = await response.json();

  if (data.error) {
    logger.error('Token refresh failed:', data);
    const error = new Error(data.error?.message || 'Token refresh failed');
    error.statusCode = 400;
    throw error;
  }

  return {
    accessToken: data.access_token,
    tokenType: data.token_type || 'bearer',
    expiresIn: data.expires_in,
  };
}
