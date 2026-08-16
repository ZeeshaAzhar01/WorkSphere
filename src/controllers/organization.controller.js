const organizationService = require('../services/organization.service');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Create a new organization
 * @route   POST /api/v1/organizations
 * @access  Private (Requires JWT)
 */
const createOrganization = catchAsync(async (req, res, next) => {
  const organization = await organizationService.createOrganization(req.user.id, req.body);

  res.status(201).json({
    status: 'success',
    data: {
      organization,
    },
  });
});

/**
 * @desc    Get all organizations for the logged in user
 * @route   GET /api/v1/organizations
 * @access  Private (Requires JWT)
 */
const getUserOrganizations = catchAsync(async (req, res, next) => {
  const organizations = await organizationService.getUserOrganizations(req.user.id);

  res.status(200).json({
    status: 'success',
    results: organizations.length,
    data: {
      organizations,
    },
  });
});

module.exports = {
  createOrganization,
  getUserOrganizations,
};
