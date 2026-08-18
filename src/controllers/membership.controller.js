const membershipService = require('../services/membership.service');
const catchAsync = require('../utils/catchAsync');

const getMemberships = catchAsync(async (req, res, next) => {
  const memberships = await membershipService.getMemberships(req.organizationId);

  res.status(200).json({
    status: 'success',
    results: memberships.length,
    data: { memberships },
  });
});

const updateMembershipRole = catchAsync(async (req, res, next) => {
  const membership = await membershipService.updateMembershipRole(
    req.organizationId,
    req.membership.role, // Requester's role
    req.params.userId,
    req.body.role
  );

  res.status(200).json({
    status: 'success',
    data: { membership },
  });
});

const removeMember = catchAsync(async (req, res, next) => {
  await membershipService.removeMember(
    req.organizationId,
    req.membership.role, // Requester's role
    req.params.userId
  );

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  getMemberships,
  updateMembershipRole,
  removeMember,
};
