const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const createProject = async (organizationId, userId, data) => {
  return prisma.project.create({
    data: {
      ...data,
      organizationId,
      createdById: userId,
    },
  });
};

const getProjects = async (organizationId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.project.count({ where: { organizationId } })
  ]);

  return { projects, total, page, limit };
};

const getProjectById = async (organizationId, projectId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      organizationId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true }
      }
    }
  });

  if (!project) {
    throw new AppError('Project not found in this organization', 404);
  }

  return project;
};

const updateProject = async (organizationId, projectId, data) => {
  // First ensure project exists in this org
  await getProjectById(organizationId, projectId);

  return prisma.project.update({
    where: { id: projectId },
    data,
  });
};

const deleteProject = async (organizationId, projectId) => {
  await getProjectById(organizationId, projectId);

  return prisma.project.delete({
    where: { id: projectId },
  });
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
