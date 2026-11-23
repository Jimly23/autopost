import { validationErrorResponse } from '../utils/api-response.js';

/**
 * Extract errors from a Zod result.
 * Handles both old (.errors) and new (.issues) Zod API.
 */
function extractErrors(zodError) {
  const items = zodError.issues || zodError.errors || [];
  return items.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
}

/**
 * Creates a middleware that validates request body against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return validationErrorResponse(res, extractErrors(result.error));
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Creates a middleware that validates request query params against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return validationErrorResponse(res, extractErrors(result.error));
    }
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Creates a middleware that validates request params against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return validationErrorResponse(res, extractErrors(result.error));
    }
    req.validatedParams = result.data;
    next();
  };
}
