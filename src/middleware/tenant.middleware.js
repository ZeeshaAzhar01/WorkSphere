const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const prisma = require('../config/database');

/**
 * Ensures the request is scoped to a specific tenant (Organization)
 * Requires `protect` middleware to run first to set `req.user`.
 * 
 * Uses the `x-organization-id` header to determine the tenant context.
 */
const tenantContext = catchAsync(async (req, res, next) => {
  const organizationId = req.headers['x-organization-id'];
  
  if (!organizationId) {
    return next(new AppError('Please specify the organization context via x-organization-id header.', 400));
  }
  
  // Check if user belongs to this organization
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: req.user.id,
        organizationId: organizationId
      }
    },
    include: {
      organization: true
    }
  });
  
  if (!membership) {
    return next(new AppError('You do not belong to this organization or it does not exist.', 403));
  }
  
  // Attach membership and tenant context to request
  req.membership = membership;
  req.organization = membership.organization;
  req.organizationId = organizationId;
  
  next();
});

module.exports = {
  tenantContext
};
