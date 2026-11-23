import { z } from 'zod';
import * as postService from '../services/post.service.js';
import { successResponse, createdResponse, errorResponse } from '../utils/api-response.js';

// Validation schemas
export const createPostSchema = z.object({
  socialAccountId: z.string().uuid('Invalid social account ID'),
  caption: z.string().max(2200, 'Caption must be 2200 characters or less').optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO'], { message: 'Media type must be IMAGE or VIDEO' }),
  mediaUrl: z.string().url('Invalid media URL').refine(
    (url) => url.startsWith('https://'),
    { message: 'Media URL must use HTTPS' }
  ),
  scheduledAt: z.string().datetime({ offset: true }).optional().refine(
    (val) => {
      if (!val) return true;
      return new Date(val) > new Date();
    },
    { message: 'Scheduled time must be in the future' }
  ),
});

export const updatePostSchema = z.object({
  socialAccountId: z.string().uuid().optional(),
  caption: z.string().max(2200).optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO']).optional(),
  mediaUrl: z.string().url().refine((url) => url.startsWith('https://'), {
    message: 'Media URL must use HTTPS',
  }).optional(),
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
});

/**
 * POST /api/posts
 */
export async function createPost(req, res, next) {
  try {
    const post = await postService.createPost(req.session.userId, req.validatedBody);
    return createdResponse(res, { post }, 'Post created successfully');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * GET /api/posts
 */
export async function listPosts(req, res, next) {
  try {
    const { status, page, limit } = req.query;
    const result = await postService.getUserPosts(req.session.userId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    });
    return successResponse(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/posts/:id
 */
export async function getPost(req, res, next) {
  try {
    const post = await postService.getPostById(req.session.userId, req.params.id);
    return successResponse(res, { post });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * PUT /api/posts/:id
 */
export async function updatePost(req, res, next) {
  try {
    const post = await postService.updatePost(req.session.userId, req.params.id, req.validatedBody);
    return successResponse(res, { post }, 'Post updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * DELETE /api/posts/:id
 */
export async function deletePost(req, res, next) {
  try {
    await postService.deletePost(req.session.userId, req.params.id);
    return successResponse(res, null, 'Post deleted successfully');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * POST /api/posts/:id/publish
 */
export async function publishPost(req, res, next) {
  try {
    const post = await postService.publishPost(req.session.userId, req.params.id);
    return successResponse(res, { post }, 'Post published successfully');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * GET /api/posts/:id/status
 */
export async function getPostStatus(req, res, next) {
  try {
    const status = await postService.getPostStatus(req.session.userId, req.params.id);
    return successResponse(res, { status });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}
