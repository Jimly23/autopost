import instagramConfig from '../../config/instagram.js';
import logger from '../../utils/logger.js';

// Supported media types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];

/**
 * Create a media container for a single image or video.
 *
 * @param {string} accessToken - User access token
 * @param {string} igUserId - Instagram user ID (platform_user_id)
 * @param {object} params
 * @param {string} params.mediaType - 'IMAGE' or 'VIDEO'
 * @param {string} params.mediaUrl - Public HTTPS URL of the media
 * @param {string} [params.caption] - Post caption
 * @returns {{ containerId: string }}
 */
export async function createMediaContainer(accessToken, igUserId, { mediaType, mediaUrl, caption }) {
  const body = {};

  if (mediaType === 'IMAGE') {
    body.image_url = mediaUrl;
  } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
    body.video_url = mediaUrl;
    body.media_type = 'REELS';
    body.share_to_feed = 'true';
  } else {
    throw new Error(`Unsupported media type: ${mediaType}`);
  }

  if (caption) {
    body.caption = caption;
  }

  body.access_token = accessToken;

  const baseUrl = typeof instagramConfig.getBaseUrl === 'function'
    ? instagramConfig.getBaseUrl(accessToken)
    : instagramConfig.graphApiBaseUrl;
  const url = `${baseUrl}/${igUserId}/media`;

  const params = new URLSearchParams(body);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();

  if (data.error) {
    logger.error('Failed to create media container:', data.error);
    const error = new Error(data.error.message || 'Failed to create media container');
    error.statusCode = response.status;
    error.igError = data.error;
    throw error;
  }

  return { containerId: data.id };
}

/**
 * Check the status of a media container.
 * For videos, the container may need processing time.
 *
 * @returns {{ status: string, id: string }}
 *   status: 'FINISHED', 'IN_PROGRESS', 'ERROR'
 */
export async function checkContainerStatus(accessToken, containerId) {
  const fields = 'status_code,status';
  const baseUrl = typeof instagramConfig.getBaseUrl === 'function'
    ? instagramConfig.getBaseUrl(accessToken)
    : instagramConfig.graphApiBaseUrl;
  const url = `${baseUrl}/${containerId}?fields=${fields}&access_token=${accessToken}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.error) {
    logger.error('Failed to check container status:', data.error);
    const error = new Error(data.error.message || 'Failed to check container status');
    error.statusCode = response.status;
    throw error;
  }

  return {
    id: containerId,
    statusCode: data.status_code, // FINISHED, IN_PROGRESS, ERROR, EXPIRED
    status: data.status,
  };
}

/**
 * Wait for a media container to finish processing.
 * Polls the status endpoint at intervals.
 *
 * @param {string} accessToken
 * @param {string} containerId
 * @param {number} [maxAttempts=30] - Max polling attempts
 * @param {number} [intervalMs=5000] - Interval between polls in ms
 */
export async function waitForContainerReady(accessToken, containerId, maxAttempts = 30, intervalMs = 5000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await checkContainerStatus(accessToken, containerId);

    if (result.statusCode === 'FINISHED') {
      return result;
    }

    if (result.statusCode === 'ERROR' || result.statusCode === 'EXPIRED') {
      const error = new Error(`Media container ${result.statusCode}: ${result.status || 'Unknown error'}`);
      error.statusCode = 400;
      throw error;
    }

    // IN_PROGRESS — wait and try again
    logger.debug(`Container ${containerId} status: ${result.statusCode} (attempt ${attempt + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Media container processing timed out');
}

/**
 * Publish a media container.
 *
 * @param {string} accessToken
 * @param {string} igUserId - Instagram user ID
 * @param {string} containerId - The container to publish
 * @returns {{ mediaId: string }}
 */
export async function publishMedia(accessToken, igUserId, containerId) {
  const baseUrl = typeof instagramConfig.getBaseUrl === 'function'
    ? instagramConfig.getBaseUrl(accessToken)
    : instagramConfig.graphApiBaseUrl;
  const url = `${baseUrl}/${igUserId}/media_publish`;

  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await response.json();

  if (data.error) {
    logger.error('Failed to publish media:', data.error);
    const error = new Error(data.error.message || 'Failed to publish media');
    error.statusCode = response.status;
    error.igError = data.error;
    throw error;
  }

  return { mediaId: data.id };
}

/**
 * Full publish flow: create container → wait → publish.
 */
export async function publishContent(accessToken, igUserId, { mediaType, mediaUrl, caption }) {
  // Step 1: Create container
  const { containerId } = await createMediaContainer(accessToken, igUserId, {
    mediaType,
    mediaUrl,
    caption,
  });

  // Step 2: For video, wait for processing
  if (mediaType === 'VIDEO' || mediaType === 'REELS') {
    await waitForContainerReady(accessToken, containerId);
  } else {
    // Even for images, brief wait can be needed
    // Check status once
    const status = await checkContainerStatus(accessToken, containerId);
    if (status.statusCode !== 'FINISHED') {
      await waitForContainerReady(accessToken, containerId, 10, 3000);
    }
  }

  // Step 3: Publish
  const { mediaId } = await publishMedia(accessToken, igUserId, containerId);

  return { containerId, mediaId };
}
