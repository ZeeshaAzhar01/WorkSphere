/**
 * Custom application error class.
 * Extends the native Error to include HTTP status codes and operational flags.
 *
 * "Operational" errors are expected errors (bad input, not found, unauthorized).
 * "Programming" errors are bugs (null reference, type error) — these should crash.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace, excluding this constructor from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
