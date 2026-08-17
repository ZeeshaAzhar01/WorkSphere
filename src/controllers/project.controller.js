const projectService = require('../services/project.service');
const catchAsync = require('../utils/catchAsync');

const createProject = catchAsync(async (req, res, next) => {
  const project = await projectService.createProject(req.organizationId, req.user.id, req.body);

  res.status(201).json({
    status: 'success',
    data: { project },
  });
});

const getProjects = catchAsync(async (req, res, next) => {
  const result = await projectService.getProjects(req.organizationId, req.query);

  res.status(200).json({
    status: 'success',
    results: result.projects.length,
    data: result,
  });
});

const getProjectById = catchAsync(async (req, res, next) => {
  const project = await projectService.getProjectById(req.organizationId, req.params.id);

  res.status(200).json({
    status: 'success',
    data: { project },
  });
});

const updateProject = catchAsync(async (req, res, next) => {
  const project = await projectService.updateProject(req.organizationId, req.params.id, req.body);

  res.status(200).json({
    status: 'success',
    data: { project },
  });
});

const deleteProject = catchAsync(async (req, res, next) => {
  await projectService.deleteProject(req.organizationId, req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
