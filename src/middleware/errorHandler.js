const env = require('../config/env');

/**
 * Centralized error-handling middleware.
 *
 * Express identifies error handlers by their 4-parameter signature: (err, req, res, next).
 *
 * Strategy:
 * - Operational errors (AppError): send the error message to the client.
 * - Programming errors: send a generic message, log the real error server-side.
 * - Never expose stack traces in production.
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error for debugging
  if (err.statusCode >= 500) {
    console.error('ERROR:', err);
  }

  // Prisma known request error (e.g., unique constraint violation)
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    err.statusCode = 409;
    err.message = `A record with this ${field} already exists.`;
    err.isOperational = true;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    err.statusCode = 404;
    err.message = 'The requested resource was not found.';
    err.isOperational = true;
  }

  if (env.nodeEnv === 'development') {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production: only send operational error details
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error — don't leak details
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong. Please try again later.',
  });
};

module.exports = errorHandler;
