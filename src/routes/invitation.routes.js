const express = require('express');
const invitationController = require('../controllers/invitation.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantContext } = require('../middleware/tenant.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate');
const {
  createInvitationSchema,
  acceptInvitationSchema,
  revokeInvitationSchema,
} = require('../validators/invitation.validator');

const router = express.Router();

// Require authentication for all routes
router.use(protect);

// Special route: accept invitation (no tenantContext needed)
router.post(
  '/:token/accept',
  validate(acceptInvitationSchema),
  invitationController.acceptInvitation
);

// Require tenant context for managing invitations
router.use(tenantContext);
router.use(restrictTo('OWNER', 'ADMIN')); // Only owners and admins can manage invites

router
  .route('/')
  .post(validate(createInvitationSchema), invitationController.createInvitation)
  .get(invitationController.getPendingInvitations);

router
  .route('/:id')
  .delete(validate(revokeInvitationSchema), invitationController.revokeInvitation);

module.exports = router;
