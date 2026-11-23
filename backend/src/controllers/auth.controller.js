import { z } from 'zod';
import * as authService from '../services/auth.service.js';
import { successResponse, createdResponse, errorResponse } from '../utils/api-response.js';
import logger from '../utils/logger.js';

// Validation schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().max(255).optional(),
}).refine((data) => data.name || data.email, {
  message: 'At least one field (name or email) must be provided',
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(128),
});

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.validatedBody);

    // Auto-login after registration
    req.session.userId = user.id;

    return createdResponse(res, { user }, 'Registration successful');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const user = await authService.loginUser(req.validatedBody);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) return next(err);
        return successResponse(res, { user }, 'Login successful');
      });
    });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(req, res, next) {
  try {
    req.session.destroy((err) => {
      if (err) {
        logger.error('Session destroy error:', err);
        return errorResponse(res, 'Logout failed', 500);
      }
      res.clearCookie('automation.sid');
      return successResponse(res, null, 'Logged out successfully');
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserById(req.session.userId);
    return successResponse(res, { user });
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 */
export async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.session.userId, req.validatedBody);
    return successResponse(res, { user }, 'Profile updated successfully');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}

/**
 * PUT /api/auth/password
 */
export async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.session.userId, req.validatedBody);
    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
}
