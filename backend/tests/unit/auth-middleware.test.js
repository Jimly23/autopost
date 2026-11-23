import { describe, it, expect, vi } from 'vitest';
import { requireAuth } from '../../src/middlewares/auth.middleware.js';

describe('Auth Middleware', () => {
  function createMockReqResNext(sessionData = {}) {
    const req = { session: sessionData };
    const res = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    const next = vi.fn();
    return { req, res, next };
  }

  describe('requireAuth', () => {
    it('should call next when session has userId', () => {
      const { req, res, next } = createMockReqResNext({ userId: 'user-123' });

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no session', () => {
      const { req, res, next } = createMockReqResNext();
      req.session = null;

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 when session has no userId', () => {
      const { req, res, next } = createMockReqResNext({});

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });
});
