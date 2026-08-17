const express = require('express');
const projectController = require('../controllers/project.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantContext } = require('../middleware/tenant.middleware');
const { restrictTo } = require('../middleware/rbac.middleware');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, getProjectSchema } = require('../validators/project.validator');

const router = express.Router();

// Require authentication and tenant context for all routes
router.use(protect);
router.use(tenantContext);

router
  .route('/')
  .post(restrictTo('OWNER', 'ADMIN', 'MEMBER'), validate(createProjectSchema), projectController.createProject)
  .get(projectController.getProjects);

router
  .route('/:id')
  .get(validate(getProjectSchema), projectController.getProjectById)
  .patch(restrictTo('OWNER', 'ADMIN', 'MEMBER'), validate(updateProjectSchema), projectController.updateProject)
  .delete(restrictTo('OWNER', 'ADMIN'), validate(getProjectSchema), projectController.deleteProject);

module.exports = router;
