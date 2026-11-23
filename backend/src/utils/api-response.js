/**
 * Standardized API response helpers.
 */

export function successResponse(res, data = null, message = 'Operation successful', statusCode = 200) {
  const response = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
}

export function errorResponse(res, message = 'Something went wrong', statusCode = 500, errors = []) {
  const response = {
    success: false,
    message,
  };
  if (errors.length > 0) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
}

export function createdResponse(res, data, message = 'Resource created successfully') {
  return successResponse(res, data, message, 201);
}

export function notFoundResponse(res, message = 'Resource not found') {
  return errorResponse(res, message, 404);
}

export function unauthorizedResponse(res, message = 'Unauthorized') {
  return errorResponse(res, message, 401);
}

export function forbiddenResponse(res, message = 'Forbidden') {
  return errorResponse(res, message, 403);
}

export function validationErrorResponse(res, errors) {
  return errorResponse(res, 'Validation failed', 422, errors);
}
