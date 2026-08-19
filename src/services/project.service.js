const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const createProject = async (organizationId, userId, data) => {
  // Use a transaction to ensure accurate counting and creation
  return prisma.$transaction(async (tx) => {
    // 1. Get the organization's subscription and plan limits
    const subscription = await tx.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new AppError('No active subscription found for this organization.', 400);
    }

    // 2. Count current projects
    const currentProjectCount = await tx.project.count({
      where: { organizationId },
    });

    // 3. Check against the plan limit
    if (currentProjectCount >= subscription.plan.maxProjects) {
      throw new AppError(
        `Upgrade required. Your ${subscription.plan.name} plan only allows up to ${subscription.plan.maxProjects} projects.`,
        403 
      );
    }

    // 4. Create the project if limits are not reached
    return tx.project.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
      },
    });
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
        creator: {
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
      creator: {
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
