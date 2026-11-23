import prisma from '../../config/database.js';
import { encrypt, decrypt } from '../../utils/encryption.js';
import logger from '../../utils/logger.js';

/**
 * Store or update encrypted access token for a social account.
 */
export async function storeToken(socialAccountId, { accessToken, tokenType, expiresIn, scopes }) {
  const encryptedToken = encrypt(accessToken);

  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : null;

  const token = await prisma.socialToken.upsert({
    where: { socialAccountId },
    create: {
      socialAccountId,
      accessToken: encryptedToken,
      tokenType: tokenType || 'bearer',
      expiresAt,
      scopes: scopes || null,
    },
    update: {
      accessToken: encryptedToken,
      tokenType: tokenType || 'bearer',
      expiresAt,
      scopes: scopes || null,
    },
  });

  return token;
}

/**
 * Get the decrypted access token for a social account.
 */
export async function getDecryptedToken(socialAccountId) {
  const token = await prisma.socialToken.findUnique({
    where: { socialAccountId },
  });

  if (!token) {
    const error = new Error('No token found for this account');
    error.statusCode = 404;
    throw error;
  }

  // Check expiry
  if (token.expiresAt && new Date() > token.expiresAt) {
    const error = new Error('Access token has expired. Please reconnect your Instagram account.');
    error.statusCode = 401;
    throw error;
  }

  return {
    accessToken: decrypt(token.accessToken),
    tokenType: token.tokenType,
    expiresAt: token.expiresAt,
    scopes: token.scopes,
  };
}

/**
 * Delete token for a social account.
 */
export async function deleteToken(socialAccountId) {
  await prisma.socialToken.deleteMany({
    where: { socialAccountId },
  });
}

/**
 * Check if a token is nearing expiry (within 7 days).
 */
export function isTokenNearExpiry(expiresAt) {
  if (!expiresAt) return false;
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  return new Date(expiresAt).getTime() - Date.now() < sevenDaysMs;
}
