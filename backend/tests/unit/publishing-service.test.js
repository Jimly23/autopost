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

import * as publishingService from '../../src/services/instagram/publishing.service.js';

describe('Instagram Publishing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMediaContainer', () => {
    it('should create an image container', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ id: 'container-123' }),
      });

      const result = await publishingService.createMediaContainer(
        'access-token',
        'ig-user-456',
        {
          mediaType: 'IMAGE',
          mediaUrl: 'https://example.com/photo.jpg',
          caption: 'My post!',
        }
      );

      expect(result.containerId).toBe('container-123');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.instagram.com/v21.0/ig-user-456/media',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should create a video/reels container', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ id: 'container-video-789' }),
      });

      const result = await publishingService.createMediaContainer(
        'token',
        'ig-user',
        {
          mediaType: 'VIDEO',
          mediaUrl: 'https://example.com/video.mp4',
          caption: 'My video',
        }
      );

      expect(result.containerId).toBe('container-video-789');
    });

    it('should throw for unsupported media type', async () => {
      await expect(publishingService.createMediaContainer(
        'token', 'ig-user', { mediaType: 'CAROUSEL', mediaUrl: 'url' }
      )).rejects.toThrow('Unsupported media type');
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          error: { message: 'Invalid image URL', type: 'OAuthException' },
        }),
      });

      await expect(publishingService.createMediaContainer(
        'token', 'ig-user', { mediaType: 'IMAGE', mediaUrl: 'bad-url' }
      )).rejects.toThrow('Invalid image URL');
    });
  });

  describe('checkContainerStatus', () => {
    it('should return FINISHED status', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({
          status_code: 'FINISHED',
          status: 'Ready to publish',
        }),
      });

      const result = await publishingService.checkContainerStatus('token', 'container-1');

      expect(result.statusCode).toBe('FINISHED');
    });
  });

  describe('publishMedia', () => {
    it('should publish a container', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ id: 'media-post-999' }),
      });

      const result = await publishingService.publishMedia('token', 'ig-user', 'container-1');

      expect(result.mediaId).toBe('media-post-999');
    });

    it('should throw on publish error', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve({
          error: { message: 'Container not ready' },
        }),
      });

      await expect(publishingService.publishMedia('token', 'ig-user', 'container-1'))
        .rejects.toThrow('Container not ready');
    });
  });
});
