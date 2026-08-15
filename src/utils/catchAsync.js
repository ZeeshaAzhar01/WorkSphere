/**
 * Wraps an async route handler to catch rejected promises
 * and forward them to Express's error-handling middleware.
 *
 * Without this, every async controller would need its own try/catch.
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
