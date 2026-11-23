import cron from 'node-cron';
import prisma from './config/database.js';
import { getDecryptedToken } from './services/instagram/token.service.js';
import * as publishingService from './services/instagram/publishing.service.js';
import logger from './utils/logger.js';

let schedulerTask = null;
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Process scheduled posts that are due for publishing.
 * Uses optimistic locking to prevent duplicate processing.
 */
async function processScheduledPosts() {
  try {
    const now = new Date();

    // Find posts that are scheduled and due
    const duePosts = await prisma.post.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: { lte: now },
      },
      include: {
        socialAccount: true,
      },
      take: 10, // Process in batches
      orderBy: { scheduledAt: 'asc' },
    });

    if (duePosts.length === 0) return;

    logger.info(`Scheduler: Found ${duePosts.length} post(s) due for publishing`);

    for (const post of duePosts) {
      await processOnePost(post);
    }
  } catch (error) {
    logger.error('Scheduler error:', error.message);
  }
}

/**
 * Process a single scheduled post with optimistic locking.
 */
async function processOnePost(post) {
  try {
    // Atomically set status to 'processing' only if still 'scheduled'
    // This prevents duplicate processing across multiple instances
    const updated = await prisma.post.updateMany({
      where: {
        id: post.id,
        status: 'scheduled', // Only if still scheduled (optimistic lock)
      },
      data: {
        status: 'processing',
      },
    });

    // If no rows updated, another process already picked it up
    if (updated.count === 0) {
      logger.debug(`Scheduler: Post ${post.id} already being processed`);
      return;
    }

    // Log the scheduling attempt
    await prisma.publishingLog.create({
      data: {
        postId: post.id,
        action: 'scheduled_publish_start',
        status: 'processing',
      },
    });

    // Get decrypted token
    const { accessToken } = await getDecryptedToken(post.socialAccountId);

    // Publish
    const result = await publishingService.publishContent(
      accessToken,
      post.socialAccount.platformUserId,
      {
        mediaType: post.mediaType,
        mediaUrl: post.mediaUrl,
        caption: post.caption,
      }
    );

    // Mark as published
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.mediaId,
        errorMessage: null,
      },
    });

    await prisma.publishingLog.create({
      data: {
        postId: post.id,
        action: 'scheduled_publish_complete',
        status: 'success',
        responseData: JSON.stringify({
          containerId: result.containerId,
          mediaId: result.mediaId,
        }),
      },
    });

    logger.info(`Scheduler: Post ${post.id} published successfully to @${post.socialAccount.username}`);
  } catch (error) {
    logger.error(`Scheduler: Failed to publish post ${post.id}:`, error.message);

    // Check retry count from logs
    const retryCount = await prisma.publishingLog.count({
      where: {
        postId: post.id,
        action: 'scheduled_publish_retry',
      },
    });

    if (retryCount < MAX_RETRY_ATTEMPTS) {
      // Reset to scheduled for retry
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'scheduled',
          errorMessage: `Retry ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}: ${error.message}`,
        },
      });

      await prisma.publishingLog.create({
        data: {
          postId: post.id,
          action: 'scheduled_publish_retry',
          status: 'retrying',
          errorMessage: error.message,
        },
      });
    } else {
      // Max retries exceeded, mark as failed
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'failed',
          errorMessage: `Max retries exceeded. Last error: ${error.message}`,
        },
      });

      await prisma.publishingLog.create({
        data: {
          postId: post.id,
          action: 'scheduled_publish_failed',
          status: 'failed',
          errorMessage: `Max retries (${MAX_RETRY_ATTEMPTS}) exceeded: ${error.message}`,
        },
      });
    }
  }
}

/**
 * Start the scheduler.
 * Runs every minute to check for due scheduled posts.
 */
export function startScheduler() {
  if (schedulerTask) {
    logger.warn('Scheduler is already running');
    return;
  }

  // Run every minute
  schedulerTask = cron.schedule('* * * * *', async () => {
    logger.debug('Scheduler: Checking for due scheduled posts...');
    await processScheduledPosts();
  });

  // Also process any posts that were left in 'processing' state
  // (e.g., after a server crash)
  recoverStuckPosts();

  logger.info('📅 Post scheduler started (runs every minute)');
}

/**
 * Stop the scheduler.
 */
export function stopScheduler() {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    logger.info('Post scheduler stopped');
  }
}

/**
 * Recover posts stuck in 'processing' status (e.g., after server restart).
 * Reset them to 'scheduled' so they can be retried.
 */
async function recoverStuckPosts() {
  try {
    const stuckPosts = await prisma.post.updateMany({
      where: {
        status: 'processing',
      },
      data: {
        status: 'scheduled',
        errorMessage: 'Recovered after server restart',
      },
    });

    if (stuckPosts.count > 0) {
      logger.info(`Scheduler: Recovered ${stuckPosts.count} stuck post(s)`);
    }
  } catch (error) {
    logger.error('Failed to recover stuck posts:', error.message);
  }
}
