const taskService = require('../services/task.service');
const catchAsync = require('../utils/catchAsync');

const createTask = catchAsync(async (req, res, next) => {
  const task = await taskService.createTask(req.organizationId, req.user.id, req.body);

  res.status(201).json({
    status: 'success',
    data: { task },
  });
});

const getTasks = catchAsync(async (req, res, next) => {
  const result = await taskService.getTasks(req.organizationId, req.query);

  res.status(200).json({
    status: 'success',
    results: result.tasks.length,
    data: result,
  });
});

const getTaskById = catchAsync(async (req, res, next) => {
  const task = await taskService.getTaskById(req.organizationId, req.params.id);

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

const updateTask = catchAsync(async (req, res, next) => {
  const task = await taskService.updateTask(req.organizationId, req.params.id, req.body);

  res.status(200).json({
    status: 'success',
    data: { task },
  });
});

const deleteTask = catchAsync(async (req, res, next) => {
  await taskService.deleteTask(req.organizationId, req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
