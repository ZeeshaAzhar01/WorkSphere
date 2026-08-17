const express = require('express');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantContext } = require('../middleware/tenant.middleware');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema, getTaskSchema, getTasksSchema } = require('../validators/task.validator');

const router = express.Router();

// Require authentication and tenant context for all routes
router.use(protect);
router.use(tenantContext);

router
  .route('/')
  .post(validate(createTaskSchema), taskController.createTask)
  .get(validate(getTasksSchema), taskController.getTasks);

router
  .route('/:id')
  .get(validate(getTaskSchema), taskController.getTaskById)
  .patch(validate(updateTaskSchema), taskController.updateTask)
  .delete(validate(getTaskSchema), taskController.deleteTask);

module.exports = router;
