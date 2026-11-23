import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../../src/middlewares/validate.middleware.js';

function createMockReqResNext() {
  const req = { body: {}, query: {}, params: {} };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('Validate Middleware', () => {
  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
    });

    it('should pass validation and attach validatedBody', () => {
      const { req, res, next } = createMockReqResNext();
      req.body = { name: 'John', email: 'john@example.com' };

      validateBody(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedBody).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should return 422 for invalid body', () => {
      const { req, res, next } = createMockReqResNext();
      req.body = { name: 'J', email: 'invalid' };

      validateBody(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should return field-level errors', () => {
      const { req, res, next } = createMockReqResNext();
      req.body = { name: 'J', email: 'bad' };

      validateBody(schema)(req, res, next);

      const fields = res.body.errors.map(e => e.field);
      expect(fields).toContain('name');
      expect(fields).toContain('email');
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    });

    it('should pass with valid query', () => {
      const { req, res, next } = createMockReqResNext();
      req.query = { page: '1', limit: '10' };

      validateQuery(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.validatedQuery).toEqual({ page: '1', limit: '10' });
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    it('should pass with valid uuid param', () => {
      const { req, res, next } = createMockReqResNext();
      req.params = { id: '550e8400-e29b-41d4-a716-446655440000' };

      validateParams(schema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail with invalid uuid', () => {
      const { req, res, next } = createMockReqResNext();
      req.params = { id: 'not-a-uuid' };

      validateParams(schema)(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(422);
    });
  });
});
