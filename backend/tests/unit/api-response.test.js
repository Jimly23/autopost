import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  createdResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
} from '../../src/utils/api-response.js';

// Mock response object
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('API Response Helpers', () => {
  it('successResponse should return correct format', () => {
    const res = createMockRes();
    successResponse(res, { id: 1 }, 'OK');

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'OK',
      data: { id: 1 },
    });
  });

  it('successResponse without data', () => {
    const res = createMockRes();
    successResponse(res, null, 'Done');

    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeUndefined();
  });

  it('errorResponse should return correct format', () => {
    const res = createMockRes();
    errorResponse(res, 'Something failed', 500, [{ field: 'email', message: 'required' }]);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      message: 'Something failed',
      errors: [{ field: 'email', message: 'required' }],
    });
  });

  it('errorResponse without errors array', () => {
    const res = createMockRes();
    errorResponse(res, 'Oops', 400);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeUndefined();
  });

  it('createdResponse should return 201', () => {
    const res = createMockRes();
    createdResponse(res, { id: 'abc' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('notFoundResponse should return 404', () => {
    const res = createMockRes();
    notFoundResponse(res);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe('Resource not found');
  });

  it('unauthorizedResponse should return 401', () => {
    const res = createMockRes();
    unauthorizedResponse(res);

    expect(res.statusCode).toBe(401);
  });

  it('forbiddenResponse should return 403', () => {
    const res = createMockRes();
    forbiddenResponse(res);

    expect(res.statusCode).toBe(403);
  });

  it('validationErrorResponse should return 422', () => {
    const res = createMockRes();
    const errors = [{ field: 'email', message: 'Invalid format' }];
    validationErrorResponse(res, errors);

    expect(res.statusCode).toBe(422);
    expect(res.body.errors).toEqual(errors);
  });
});
