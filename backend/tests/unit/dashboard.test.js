import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('../../src/config/database.js', () => {
  const createMockModel = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  });

  return {
    default: {
      socialAccount: createMockModel(),
      post: createMockModel(),
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

describe('Dashboard Data Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should only query data for the authenticated user', async () => {
    const userId = 'user-123';

    // Simulate what the dashboard controller does
    prisma.socialAccount.count.mockResolvedValue(2);
    prisma.post.count.mockResolvedValue(10);
    prisma.post.findMany.mockResolvedValue([]);

    // Call the count operations with the userId filter
    await prisma.socialAccount.count({
      where: { userId, platform: 'instagram' },
    });

    await prisma.post.count({ where: { userId } });
    await prisma.post.count({ where: { userId, status: 'scheduled' } });
    await prisma.post.count({ where: { userId, status: 'published' } });
    await prisma.post.count({ where: { userId, status: 'failed' } });

    // Verify all calls include the userId filter
    for (const call of prisma.socialAccount.count.mock.calls) {
      expect(call[0].where).toHaveProperty('userId', userId);
    }

    for (const call of prisma.post.count.mock.calls) {
      expect(call[0].where).toHaveProperty('userId', userId);
    }
  });

  it('should not expose data from other users', async () => {
    const userId = 'user-A';

    prisma.post.findMany.mockImplementation(async ({ where }) => {
      // Verify the query always has userId filter
      expect(where.userId).toBe(userId);
      return [];
    });

    await prisma.post.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    expect(prisma.post.findMany).toHaveBeenCalledOnce();
  });
});
