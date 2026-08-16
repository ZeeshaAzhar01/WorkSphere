const AppError = require('../utils/AppError');

/**
 * Role-Based Access Control middleware
 * Requires `tenantContext` middleware to run first to set `req.membership`.
 * 
 * @param {...string} roles - allowed roles (e.g., 'OWNER', 'ADMIN', 'MEMBER')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return next(new AppError('Tenant context is missing. Cannot evaluate roles.', 500));
    }
    
    if (!roles.includes(req.membership.role)) {
      return next(new AppError('You do not have permission to perform this action in this organization.', 403));
    }
    
    next();
  };
};

module.exports = {
  restrictTo
};
