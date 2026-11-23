import logger from '../utils/logger.js';
import { errorResponse, validationErrorResponse } from '../utils/api-response.js';
import env from '../config/env.js';

/**
 * Global error handler middleware.
 * Must be registered after all routes.
 */
export function errorHandler(err, req, res, _next) {
  // Log the error
  logger.error('Unhandled error:', {
    message: err.message,
    stack: env.isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // CSRF token error
  if (err.code === 'EBADCSRFTOKEN') {
    return errorResponse(res, 'Invalid or missing CSRF token', 403);
  }

  // Prisma known request errors
  if (err.code === 'P2002') {
    const target = err.meta?.target;
    return errorResponse(res, `A record with this ${target || 'value'} already exists`, 409);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return validationErrorResponse(res, errors);
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, 'Invalid JSON in request body', 400);
  }

  // Default 500
  const message = env.isDevelopment ? err.message : 'Internal server error';
  return errorResponse(res, message, err.statusCode || 500);
}

/**
 * 404 handler for unmatched routes.
 */
export function notFoundHandler(req, res) {
  return errorResponse(res, `Route ${req.method} ${req.path} not found`, 404);
}
