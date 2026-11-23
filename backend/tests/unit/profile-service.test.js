import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('../../src/config/instagram.js', () => ({
  default: {
    graphApiBaseUrl: 'https://graph.instagram.com/v21.0',
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import * as profileService from '../../src/services/instagram/profile.service.js';

describe('Instagram Profile Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile data', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          user_id: '12345',
          username: 'testuser',
          account_type: 'BUSINESS',
          profile_picture_url: 'https://cdn.instagram.com/pic.jpg',
        }),
      });

      const result = await profileService.getUserProfile('valid-token');

      expect(result).toEqual({
        platformUserId: '12345',
        username: 'testuser',
        accountType: 'BUSINESS',
        profilePicture: 'https://cdn.instagram.com/pic.jpg',
      });
    });

    it('should throw on invalid token (error 190)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          error: {
            message: 'Invalid OAuth access token',
            type: 'OAuthException',
            code: 190,
          },
        }),
      });

      await expect(profileService.getUserProfile('bad-token'))
        .rejects.toThrow('Invalid OAuth access token');
    });

    it('should handle missing profile picture', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          user_id: '999',
          username: 'nopic',
          account_type: 'PERSONAL',
        }),
      });

      const result = await profileService.getUserProfile('token');
      expect(result.profilePicture).toBeNull();
    });
  });
});
