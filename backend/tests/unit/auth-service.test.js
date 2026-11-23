import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma before importing anything that uses it
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

  return {
    default: {
      user: createMockModel(),
      socialAccount: createMockModel(),
      socialToken: createMockModel(),
      post: createMockModel(),
      publishingLog: createMockModel(),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn((fn) => {
        // If fn is a function (interactive transaction), call it with the mock
        if (typeof fn === 'function') {
          return fn({
            user: createMockModel(),
            socialAccount: createMockModel(),
            socialToken: createMockModel(),
            post: createMockModel(),
            publishingLog: createMockModel(),
          });
        }
        return Promise.resolve(fn);
      }),
      $on: vi.fn(),
    },
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn(),
  };
});

import prisma from '../../src/config/database.js';
import * as authService from '../../src/services/auth.service.js';
import bcrypt from 'bcryptjs';

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
      });

      const result = await authService.registerUser({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'John Doe');
      expect(result).toHaveProperty('email', 'john@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(prisma.user.create).toHaveBeenCalledOnce();
    });

    it('should throw 409 if email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(authService.registerUser({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      })).rejects.toThrow('A user with this email already exists');
    });

    it('should hash the password before storing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => {
        // Verify the password was hashed
        expect(data.passwordHash).toBeDefined();
        expect(data.passwordHash).not.toBe('password123');
        expect(data.passwordHash.startsWith('$2')).toBe(true); // bcrypt hash
        return Promise.resolve({
          id: 'user-1',
          name: data.name,
          email: data.email,
          createdAt: new Date(),
        });
      });

      await authService.registerUser({
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
      });
    });
  });

  describe('loginUser', () => {
    it('should login successfully with correct credentials', async () => {
      const hash = await bcrypt.hash('password123', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'John',
        email: 'john@example.com',
        passwordHash: hash,
        createdAt: new Date(),
      });

      const result = await authService.loginUser({
        email: 'john@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('id', 'user-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw 401 for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.loginUser({
        email: 'nonexist@example.com',
        password: 'password123',
      })).rejects.toThrow('Invalid email or password');
    });

    it('should throw 401 for wrong password', async () => {
      const hash = await bcrypt.hash('correct-password', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: hash,
      });

      await expect(authService.loginUser({
        email: 'john@example.com',
        password: 'wrong-password',
      })).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getUserById', () => {
    it('should return user without sensitive data', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'John',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.getUserById('user-1');
      expect(result).toHaveProperty('id', 'user-1');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw 404 for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.getUserById('nonexist')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.update.mockResolvedValue({
        id: 'user-1',
        name: 'Jane Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.updateProfile('user-1', { name: 'Jane Doe' });
      expect(result.name).toBe('Jane Doe');
    });

    it('should throw 409 if new email is taken', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(authService.updateProfile('user-1', {
        email: 'taken@example.com',
      })).rejects.toThrow('Email is already in use');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hash = await bcrypt.hash('old-password', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: hash,
      });
      prisma.user.update.mockResolvedValue({});

      const result = await authService.changePassword('user-1', {
        currentPassword: 'old-password',
        newPassword: 'new-password-123',
      });

      expect(result).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledOnce();
    });

    it('should throw 400 for incorrect current password', async () => {
      const hash = await bcrypt.hash('correct', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        passwordHash: hash,
      });

      await expect(authService.changePassword('user-1', {
        currentPassword: 'wrong',
        newPassword: 'new-pass',
      })).rejects.toThrow('Current password is incorrect');
    });
  });
});
