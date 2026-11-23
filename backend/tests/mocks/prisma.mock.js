/**
 * Mock Prisma client for testing.
 * Provides a mock implementation that doesn't require a real database.
 */
import { vi } from 'vitest';

// Create mock functions for all Prisma models
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
  $transaction: vi.fn((fn) => fn(mockPrisma)),
  $on: vi.fn(),
};

export default mockPrisma;

// Helper to reset all mocks
export function resetMocks() {
  for (const model of Object.values(mockPrisma)) {
    if (typeof model === 'object' && model !== null) {
      for (const fn of Object.values(model)) {
        if (typeof fn?.mockReset === 'function') {
          fn.mockReset();
        }
      }
    }
  }
}
