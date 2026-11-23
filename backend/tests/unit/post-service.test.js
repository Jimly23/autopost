import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('../../src/config/database.js', () => {
  const createMockModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  });

  const mockPrisma = {
    user: createMockModel(),
    socialAccount: createMockModel(),
    socialToken: createMockModel(),
    post: createMockModel(),
    publishingLog: createMockModel(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(async (fn) => {
      if (typeof fn === 'function') {
        return fn(mockPrisma);
      }
      return fn;
    }),
    $on: vi.fn(),
  };

  return {
    default: mockPrisma,
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn(),
  };
});

// Mock Instagram services
vi.mock('../../src/services/instagram/token.service.js', () => ({
  getDecryptedToken: vi.fn(),
  storeToken: vi.fn(),
  deleteToken: vi.fn(),
  isTokenNearExpiry: vi.fn(),
}));

vi.mock('../../src/services/instagram/publishing.service.js', () => ({
  publishContent: vi.fn(),
  createMediaContainer: vi.fn(),
  checkContainerStatus: vi.fn(),
  waitForContainerReady: vi.fn(),
  publishMedia: vi.fn(),
}));

import prisma from '../../src/config/database.js';
import * as postService from '../../src/services/post.service.js';
import { getDecryptedToken } from '../../src/services/instagram/token.service.js';
import * as publishingService from '../../src/services/instagram/publishing.service.js';

describe('Post Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a draft post', async () => {
      const userId = 'user-1';
      const postData = {
        socialAccountId: 'account-1',
        caption: 'Hello Instagram!',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
      };

      prisma.socialAccount.findFirst.mockResolvedValue({ id: 'account-1', userId });
      prisma.post.create.mockResolvedValue({
        id: 'post-1',
        userId,
        status: 'draft',
        ...postData,
        socialAccount: { id: 'account-1', username: 'testuser', platform: 'instagram' },
      });

      const result = await postService.createPost(userId, postData);

      expect(result).toHaveProperty('id', 'post-1');
      expect(result.status).toBe('draft');
      expect(prisma.post.create).toHaveBeenCalledOnce();
    });

    it('should create a scheduled post', async () => {
      const userId = 'user-1';
      const scheduledAt = new Date(Date.now() + 86400000).toISOString();
      const postData = {
        socialAccountId: 'account-1',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
        scheduledAt,
      };

      prisma.socialAccount.findFirst.mockResolvedValue({ id: 'account-1', userId });
      prisma.post.create.mockResolvedValue({
        id: 'post-1',
        userId,
        status: 'scheduled',
        ...postData,
        socialAccount: { id: 'account-1', username: 'testuser', platform: 'instagram' },
      });

      const result = await postService.createPost(userId, postData);

      expect(result.status).toBe('scheduled');
    });

    it('should throw 404 if social account does not belong to user', async () => {
      prisma.socialAccount.findFirst.mockResolvedValue(null);

      await expect(postService.createPost('user-1', {
        socialAccountId: 'other-account',
        mediaType: 'IMAGE',
        mediaUrl: 'https://example.com/image.jpg',
      })).rejects.toThrow('Social account not found');
    });
  });

  describe('getUserPosts', () => {
    it('should return paginated posts', async () => {
      prisma.post.findMany.mockResolvedValue([
        { id: 'post-1', status: 'draft', socialAccount: { id: 'a1', username: 'u1', platform: 'instagram' } },
      ]);
      prisma.post.count.mockResolvedValue(1);

      const result = await postService.getUserPosts('user-1', { page: 1, limit: 20 });

      expect(result.posts).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter by status', async () => {
      prisma.post.findMany.mockResolvedValue([]);
      prisma.post.count.mockResolvedValue(0);

      await postService.getUserPosts('user-1', { status: 'published' });

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', status: 'published' },
        })
      );
    });
  });

  describe('getPostById', () => {
    it('should return post with logs', async () => {
      prisma.post.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        socialAccount: { id: 'a1', username: 'u1', platform: 'instagram' },
        publishingLogs: [],
      });

      const result = await postService.getPostById('user-1', 'post-1');
      expect(result.id).toBe('post-1');
    });

    it('should throw 404 for other users post', async () => {
      prisma.post.findFirst.mockResolvedValue(null);

      await expect(postService.getPostById('user-1', 'post-999'))
        .rejects.toThrow('Post not found');
    });
  });

  describe('updatePost', () => {
    it('should update a draft post', async () => {
      prisma.post.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'draft',
      });
      prisma.post.update.mockResolvedValue({
        id: 'post-1',
        caption: 'Updated caption',
        socialAccount: { id: 'a1', username: 'u1', platform: 'instagram' },
      });

      const result = await postService.updatePost('user-1', 'post-1', {
        caption: 'Updated caption',
      });

      expect(result.caption).toBe('Updated caption');
    });

    it('should not allow editing a published post', async () => {
      prisma.post.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'published',
      });

      await expect(postService.updatePost('user-1', 'post-1', {
        caption: 'Try to edit',
      })).rejects.toThrow('Cannot edit a post with status "published"');
    });
  });

  describe('deletePost', () => {
    it('should delete a draft post', async () => {
      prisma.post.findFirst.mockResolvedValue({
        id: 'post-1',
        userId: 'user-1',
        status: 'draft',
      });
      prisma.post.delete.mockResolvedValue({});

      const result = await postService.deletePost('user-1', 'post-1');
      expect(result).toBe(true);
    });

    it('should not delete a processing post', async () => {
      prisma.post.findFirst.mockResolvedValue({
        id: 'post-1',
        status: 'processing',
      });

      await expect(postService.deletePost('user-1', 'post-1'))
        .rejects.toThrow('Cannot delete a post that is currently being processed');
    });
  });

  describe('publishPost - duplicate prevention', () => {
    it('should not publish an already published post', async () => {
      // The $transaction mock will call the function with the mock prisma
      const mockPost = {
        id: 'post-1',
        userId: 'user-1',
        status: 'published',
        socialAccount: { platformUserId: 'ig-123' },
      };

      prisma.$transaction.mockImplementation(async (fn) => {
        const txPrisma = {
          post: {
            findFirst: vi.fn().mockResolvedValue(mockPost),
            update: vi.fn(),
          },
          publishingLog: { create: vi.fn() },
        };
        return fn(txPrisma);
      });

      await expect(postService.publishPost('user-1', 'post-1'))
        .rejects.toThrow('Post is already published');
    });
  });
});
