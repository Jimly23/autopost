import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the config
vi.mock('../../src/config/instagram.js', () => ({
  default: {
    appId: 'test-app-id',
    appSecret: 'test-app-secret',
    redirectUri: 'http://localhost:3000/api/instagram/callback',
    apiVersion: 'v21.0',
    authorizationUrl: 'https://www.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    longLivedTokenUrl: 'https://graph.instagram.com/access_token',
    graphApiBaseUrl: 'https://graph.instagram.com/v21.0',
    scopes: ['instagram_business_basic', 'instagram_business_content_publish'],
    isConfigured: () => true,
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import * as oauthService from '../../src/services/instagram/oauth.service.js';

describe('Instagram OAuth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAuthorizationUrl', () => {
    it('should generate a valid authorization URL', () => {
      const { url, state } = oauthService.generateAuthorizationUrl();

      expect(url).toContain('https://www.instagram.com/oauth/authorize');
      expect(url).toContain('client_id=test-app-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=');
      expect(state).toBeDefined();
      expect(state.length).toBe(64); // 32 bytes hex
    });

    it('should use provided state', () => {
      const customState = 'my-custom-state-123';
      const { url, state } = oauthService.generateAuthorizationUrl(customState);

      expect(state).toBe(customState);
      expect(url).toContain(`state=${customState}`);
    });

    it('should include correct scopes', () => {
      const { url } = oauthService.generateAuthorizationUrl();

      expect(url).toContain('instagram_business_basic');
      expect(url).toContain('instagram_business_content_publish');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for token successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          access_token: 'short-lived-token-123',
          user_id: 12345,
        }),
      });

      const result = await oauthService.exchangeCodeForToken('auth-code-abc');

      expect(result).toEqual({
        accessToken: 'short-lived-token-123',
        userId: '12345',
      });

      // Verify correct endpoint and body
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.instagram.com/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
      );
    });

    it('should throw on token exchange error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          error_type: 'OAuthException',
          error_message: 'Invalid authorization code',
        }),
      });

      await expect(oauthService.exchangeCodeForToken('bad-code'))
        .rejects.toThrow('Invalid authorization code');
    });
  });

  describe('exchangeForLongLivedToken', () => {
    it('should exchange for long-lived token', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          access_token: 'long-lived-token-456',
          token_type: 'bearer',
          expires_in: 5184000,
        }),
      });

      const result = await oauthService.exchangeForLongLivedToken('short-token');

      expect(result).toEqual({
        accessToken: 'long-lived-token-456',
        tokenType: 'bearer',
        expiresIn: 5184000,
      });

      // Verify it uses GET with query params
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('grant_type=ig_exchange_token');
      expect(callUrl).toContain('client_secret=test-app-secret');
    });

    it('should throw on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          error: { message: 'Invalid token' },
        }),
      });

      await expect(oauthService.exchangeForLongLivedToken('bad-token'))
        .rejects.toThrow('Invalid token');
    });
  });

  describe('refreshLongLivedToken', () => {
    it('should refresh a long-lived token', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          access_token: 'refreshed-token-789',
          token_type: 'bearer',
          expires_in: 5184000,
        }),
      });

      const result = await oauthService.refreshLongLivedToken('old-long-token');

      expect(result.accessToken).toBe('refreshed-token-789');
      expect(result.expiresIn).toBe(5184000);
    });
  });
});
