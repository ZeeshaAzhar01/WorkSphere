const invitationService = require('../services/invitation.service');
const catchAsync = require('../utils/catchAsync');

const createInvitation = catchAsync(async (req, res, next) => {
  const invitation = await invitationService.createInvitation(
    req.organizationId,
    req.user.id,
    req.body
  );

  res.status(201).json({
    status: 'success',
    data: { invitation },
  });
});

const getPendingInvitations = catchAsync(async (req, res, next) => {
  const invitations = await invitationService.getPendingInvitations(req.organizationId);

  res.status(200).json({
    status: 'success',
    results: invitations.length,
    data: { invitations },
  });
});

const revokeInvitation = catchAsync(async (req, res, next) => {
  await invitationService.revokeInvitation(req.organizationId, req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

const acceptInvitation = catchAsync(async (req, res, next) => {
  // Note: No req.organizationId here because they aren't in the org yet!
  const result = await invitationService.acceptInvitation(req.user.id, req.params.token);

  res.status(200).json({
    status: 'success',
    data: result, // { organization, membership }
  });
});

module.exports = {
  createInvitation,
  getPendingInvitations,
  revokeInvitation,
  acceptInvitation,
};
