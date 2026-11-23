import { unauthorizedResponse } from '../utils/api-response.js';

/**
 * Middleware to require an authenticated session.
 */
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return unauthorizedResponse(res, 'Authentication required. Please login.');
  }
  next();
}

/**
 * Middleware to optionally attach user info if session exists.
 */
export function optionalAuth(req, res, next) {
  // Session userId is attached by express-session automatically
  next();
}
