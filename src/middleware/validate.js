const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

/**
 * Middleware to validate request using Zod schemas
 */
const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Map Zod errors to a readable format
      const issues = err.issues || err.errors || [];
      const errors = issues.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      
      const errorMsg = 'Validation failed: ' + errors.map((e) => e.message).join(', ');
      return next(new AppError(errorMsg, 400));
    }
    next(err);
  }
};

module.exports = validate;
