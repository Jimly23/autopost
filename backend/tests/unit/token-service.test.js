import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('../../src/config/database.js', () => {
  const createMockModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  });

  return {
    default: {
      socialToken: createMockModel(),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $on: vi.fn(),
    },
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn(),
  };
});

vi.mock('../../src/utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import prisma from '../../src/config/database.js';
import { storeToken, getDecryptedToken, isTokenNearExpiry } from '../../src/services/instagram/token.service.js';
import { encrypt, decrypt } from '../../src/utils/encryption.js';

describe('Token Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('storeToken', () => {
    it('should encrypt and store a token', async () => {
      prisma.socialToken.upsert.mockImplementation(async ({ create }) => {
        // Verify the token is encrypted (not plaintext)
        expect(create.accessToken).not.toBe('my-access-token');
        expect(create.accessToken).toContain(':'); // encrypted format iv:tag:cipher
        return { id: 'token-1', ...create };
      });

      await storeToken('account-1', {
        accessToken: 'my-access-token',
        tokenType: 'bearer',
        expiresIn: 5184000,
      });

      expect(prisma.socialToken.upsert).toHaveBeenCalledOnce();
    });

    it('should calculate expiresAt from expiresIn', async () => {
      prisma.socialToken.upsert.mockImplementation(async ({ create }) => {
        expect(create.expiresAt).toBeInstanceOf(Date);
        const expectedExpiry = Date.now() + 5184000 * 1000;
        // Allow 5 second tolerance
        expect(Math.abs(create.expiresAt.getTime() - expectedExpiry)).toBeLessThan(5000);
        return { id: 'token-1', ...create };
      });

      await storeToken('account-1', {
        accessToken: 'token',
        expiresIn: 5184000,
      });
    });
  });

  describe('getDecryptedToken', () => {
    it('should return decrypted token', async () => {
      const encrypted = encrypt('my-secret-token');
      prisma.socialToken.findUnique.mockResolvedValue({
        accessToken: encrypted,
        tokenType: 'bearer',
        expiresAt: new Date(Date.now() + 86400000), // future
        scopes: 'instagram_business_basic',
      });

      const result = await getDecryptedToken('account-1');

      expect(result.accessToken).toBe('my-secret-token');
      expect(result.tokenType).toBe('bearer');
    });

    it('should throw 404 when no token exists', async () => {
      prisma.socialToken.findUnique.mockResolvedValue(null);

      await expect(getDecryptedToken('nonexistent'))
        .rejects.toThrow('No token found');
    });

    it('should throw 401 for expired token', async () => {
      const encrypted = encrypt('expired-token');
      prisma.socialToken.findUnique.mockResolvedValue({
        accessToken: encrypted,
        expiresAt: new Date(Date.now() - 86400000), // past
      });

      await expect(getDecryptedToken('account-1'))
        .rejects.toThrow('Access token has expired');
    });
  });

  describe('isTokenNearExpiry', () => {
    it('should return true when token expires within 7 days', () => {
      const expiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      expect(isTokenNearExpiry(expiry)).toBe(true);
    });

    it('should return false when token has plenty of time', () => {
      const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      expect(isTokenNearExpiry(expiry)).toBe(false);
    });

    it('should return false for null expiry', () => {
      expect(isTokenNearExpiry(null)).toBe(false);
    });
  });
});
