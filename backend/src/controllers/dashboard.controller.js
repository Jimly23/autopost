import prisma from '../config/database.js';
import { successResponse, errorResponse } from '../utils/api-response.js';

/**
 * GET /api/dashboard/overview
 * Returns dashboard statistics for the authenticated user.
 */
export async function getOverview(req, res, next) {
  try {
    const userId = req.session.userId;

    // Run all queries in parallel for performance
    const [
      totalAccounts,
      totalPosts,
      scheduledPosts,
      publishedPosts,
      failedPosts,
      recentPosts,
      upcomingScheduled,
    ] = await Promise.all([
      // Total connected Instagram accounts
      prisma.socialAccount.count({
        where: { userId, platform: 'instagram' },
      }),

      // Total posts
      prisma.post.count({ where: { userId } }),

      // Scheduled posts
      prisma.post.count({ where: { userId, status: 'scheduled' } }),

      // Published posts
      prisma.post.count({ where: { userId, status: 'published' } }),

      // Failed posts
      prisma.post.count({ where: { userId, status: 'failed' } }),

      // Recent posts (last 10)
      prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          caption: true,
          mediaType: true,
          status: true,
          scheduledAt: true,
          publishedAt: true,
          createdAt: true,
          socialAccount: {
            select: { id: true, username: true },
          },
        },
      }),

      // Upcoming scheduled posts (next 10)
      prisma.post.findMany({
        where: {
          userId,
          status: 'scheduled',
          scheduledAt: { gte: new Date() },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
        select: {
          id: true,
          caption: true,
          mediaType: true,
          scheduledAt: true,
          socialAccount: {
            select: { id: true, username: true },
          },
        },
      }),
    ]);

    return successResponse(res, {
      overview: {
        totalAccounts,
        totalPosts,
        scheduledPosts,
        publishedPosts,
        failedPosts,
        recentPosts,
        upcomingScheduled,
      },
    });
  } catch (error) {
    next(error);
  }
}
