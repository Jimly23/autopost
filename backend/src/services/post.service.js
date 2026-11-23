import prisma from '../config/database.js';
import { getDecryptedToken } from './instagram/token.service.js';
import * as publishingService from './instagram/publishing.service.js';
import logger from '../utils/logger.js';

/**
 * Create a new post.
 */
export async function createPost(userId, data) {
  // Verify social account belongs to user
  const account = await prisma.socialAccount.findFirst({
    where: { id: data.socialAccountId, userId },
  });
  if (!account) {
    const error = new Error('Social account not found or does not belong to you');
    error.statusCode = 404;
    throw error;
  }

  const post = await prisma.post.create({
    data: {
      userId,
      socialAccountId: data.socialAccountId,
      caption: data.caption || null,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.scheduledAt ? 'scheduled' : 'draft',
    },
    include: {
      socialAccount: {
        select: { id: true, username: true, platform: true },
      },
    },
  });

  return post;
}

/**
 * Get all posts for a user with optional filters.
 */
export async function getUserPosts(userId, { status, page = 1, limit = 20 } = {}) {
  const where = { userId };
  if (status) {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        socialAccount: {
          select: { id: true, username: true, platform: true },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single post by ID, ensuring ownership.
 */
export async function getPostById(userId, postId) {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
    include: {
      socialAccount: {
        select: { id: true, username: true, platform: true },
      },
      publishingLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  return post;
}

/**
 * Update a post. Only draft and scheduled posts can be edited.
 */
export async function updatePost(userId, postId, data) {
  const existing = await prisma.post.findFirst({
    where: { id: postId, userId },
  });

  if (!existing) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  if (!['draft', 'scheduled'].includes(existing.status)) {
    const error = new Error(`Cannot edit a post with status "${existing.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const updateData = {};
  if (data.caption !== undefined) updateData.caption = data.caption;
  if (data.mediaType !== undefined) updateData.mediaType = data.mediaType;
  if (data.mediaUrl !== undefined) updateData.mediaUrl = data.mediaUrl;
  if (data.scheduledAt !== undefined) {
    updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    updateData.status = data.scheduledAt ? 'scheduled' : 'draft';
  }

  // If changing social account, verify ownership
  if (data.socialAccountId) {
    const account = await prisma.socialAccount.findFirst({
      where: { id: data.socialAccountId, userId },
    });
    if (!account) {
      const error = new Error('Social account not found');
      error.statusCode = 404;
      throw error;
    }
    updateData.socialAccountId = data.socialAccountId;
  }

  const post = await prisma.post.update({
    where: { id: postId },
    data: updateData,
    include: {
      socialAccount: {
        select: { id: true, username: true, platform: true },
      },
    },
  });

  return post;
}

/**
 * Delete a post. Only draft, scheduled, failed, and cancelled posts can be deleted.
 */
export async function deletePost(userId, postId) {
  const existing = await prisma.post.findFirst({
    where: { id: postId, userId },
  });

  if (!existing) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  if (['processing'].includes(existing.status)) {
    const error = new Error('Cannot delete a post that is currently being processed');
    error.statusCode = 400;
    throw error;
  }

  await prisma.post.delete({ where: { id: postId } });
  return true;
}

/**
 * Publish a post immediately.
 */
export async function publishPost(userId, postId) {
  // Use a transaction to prevent duplicate publishing
  return await prisma.$transaction(async (tx) => {
    const post = await tx.post.findFirst({
      where: { id: postId, userId },
      include: {
        socialAccount: true,
      },
    });

    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }

    if (post.status === 'published') {
      const error = new Error('Post is already published');
      error.statusCode = 400;
      throw error;
    }

    if (post.status === 'processing') {
      const error = new Error('Post is currently being processed');
      error.statusCode = 400;
      throw error;
    }

    if (!['draft', 'scheduled', 'failed'].includes(post.status)) {
      const error = new Error(`Cannot publish a post with status "${post.status}"`);
      error.statusCode = 400;
      throw error;
    }

    // Mark as processing
    await tx.post.update({
      where: { id: postId },
      data: { status: 'processing' },
    });

    // Log the attempt
    await tx.publishingLog.create({
      data: {
        postId,
        action: 'publish_start',
        status: 'processing',
      },
    });

    return post;
  }).then(async (post) => {
    // Now do the actual publishing outside the transaction
    try {
      const { accessToken } = await getDecryptedToken(post.socialAccountId);

      const result = await publishingService.publishContent(
        accessToken,
        post.socialAccount.platformUserId,
        {
          mediaType: post.mediaType,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
        }
      );

      // Update post as published
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'published',
          publishedAt: new Date(),
          platformPostId: result.mediaId,
          errorMessage: null,
        },
        include: {
          socialAccount: {
            select: { id: true, username: true, platform: true },
          },
        },
      });

      // Log success
      await prisma.publishingLog.create({
        data: {
          postId,
          action: 'publish_complete',
          status: 'success',
          responseData: JSON.stringify({ containerId: result.containerId, mediaId: result.mediaId }),
        },
      });

      return updatedPost;
    } catch (error) {
      logger.error(`Publishing failed for post ${postId}:`, error.message);

      // Update post as failed
      await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      // Log failure
      await prisma.publishingLog.create({
        data: {
          postId,
          action: 'publish_failed',
          status: 'failed',
          errorMessage: error.message,
          responseData: error.igError ? JSON.stringify(error.igError) : null,
        },
      });

      throw error;
    }
  });
}

/**
 * Get the publishing status of a post.
 */
export async function getPostStatus(userId, postId) {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
    select: {
      id: true,
      status: true,
      publishedAt: true,
      platformPostId: true,
      errorMessage: true,
      scheduledAt: true,
      publishingLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          action: true,
          status: true,
          errorMessage: true,
          createdAt: true,
        },
      },
    },
  });

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  return post;
}

/**
 * Cancel a scheduled post.
 */
export async function cancelPost(userId, postId) {
  const post = await prisma.post.findFirst({
    where: { id: postId, userId },
  });

  if (!post) {
    const error = new Error('Post not found');
    error.statusCode = 404;
    throw error;
  }

  if (post.status !== 'scheduled') {
    const error = new Error('Only scheduled posts can be cancelled');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: 'cancelled' },
  });

  return updated;
}
