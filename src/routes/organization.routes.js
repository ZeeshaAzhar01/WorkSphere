const express = require('express');
const organizationController = require('../controllers/organization.controller');
const { protect } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');
const { createOrganizationSchema } = require('../validators/organization.validator');

const router = express.Router();

// All organization routes require authentication
router.use(protect);

router
  .route('/')
  .post(validate(createOrganizationSchema), organizationController.createOrganization)
  .get(organizationController.getUserOrganizations);

module.exports = router;
