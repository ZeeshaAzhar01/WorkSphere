const express = require('express');
const membershipController = require('../controllers/membership.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantContext } = require('../middleware/tenant.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate');
const {
  updateMembershipSchema,
  removeMemberSchema,
} = require('../validators/membership.validator');

const router = express.Router();

// Require authentication and tenant context for all routes
router.use(protect);
router.use(tenantContext);

router
  .route('/')
  .get(membershipController.getMemberships);

router
  .route('/:userId')
  .patch(
    restrictTo('OWNER', 'ADMIN'),
    validate(updateMembershipSchema),
    membershipController.updateMembershipRole
  )
  .delete(
    restrictTo('OWNER', 'ADMIN'),
    validate(removeMemberSchema),
    membershipController.removeMember
  );

module.exports = router;
