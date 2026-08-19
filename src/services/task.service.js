const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const createTask = async (organizationId, userId, data) => {
  // Verify project belongs to org
  const project = await prisma.project.findFirst({
    where: { id: data.projectId, organizationId }
  });

  if (!project) {
    throw new AppError('Project not found in this organization', 404);
  }

  // Verify assignee belongs to org if assigneeId provided
  if (data.assigneeId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: data.assigneeId,
          organizationId
        }
      }
    });

    if (!membership) {
      throw new AppError('Assignee is not a member of this organization', 400);
    }
  }

  // Transaction for limit check
  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new AppError('No active subscription found for this organization.', 400);
    }

    const currentTaskCount = await tx.task.count({
      where: { organizationId },
    });

    if (currentTaskCount >= subscription.plan.maxTasks) {
      throw new AppError(
        `Upgrade required. Your ${subscription.plan.name} plan only allows up to ${subscription.plan.maxTasks} tasks.`,
        403 
      );
    }

    return tx.task.create({
      data: {
        ...data,
        organizationId,
        createdBy: userId,
      },
    });
  });
};

const getTasks = async (organizationId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const where = { organizationId };

  if (query.projectId) where.projectId = query.projectId;
  if (query.status) where.status = query.status;
  if (query.assigneeId) where.assigneeId = query.assigneeId;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.task.count({ where })
  ]);

  return { tasks, total, page, limit };
};

const getTaskById = async (organizationId, taskId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      organizationId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } }
    }
  });

  if (!task) {
    throw new AppError('Task not found in this organization', 404);
  }

  return task;
};

const updateTask = async (organizationId, taskId, data) => {
  // Ensure task exists in org
  await getTaskById(organizationId, taskId);

  // If assigneeId is being updated, verify membership
  if (data.assigneeId) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: data.assigneeId,
          organizationId
        }
      }
    });

    if (!membership) {
      throw new AppError('Assignee is not a member of this organization', 400);
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data,
  });
};

const deleteTask = async (organizationId, taskId) => {
  await getTaskById(organizationId, taskId);

  return prisma.task.delete({
    where: { id: taskId },
  });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
