const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const getMemberships = async (organizationId) => {
  return prisma.membership.findMany({
    where: { organizationId },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });
};

const updateMembershipRole = async (organizationId, requesterRole, targetUserId, newRole) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId
      }
    }
  });

  if (!membership) {
    throw new AppError('User is not a member of this organization', 404);
  }

  // RBAC Checks
  if (requesterRole !== 'OWNER' && newRole === 'ADMIN') {
    throw new AppError('Only the OWNER can promote members to ADMIN', 403);
  }

  if (requesterRole !== 'OWNER' && membership.role === 'ADMIN') {
    throw new AppError('Only the OWNER can modify ADMIN roles', 403);
  }

  if (membership.role === 'OWNER') {
    throw new AppError('The OWNER role cannot be modified via this endpoint', 403);
  }

  return prisma.membership.update({
    where: { id: membership.id },
    data: { role: newRole }
  });
};

const removeMember = async (organizationId, requesterRole, targetUserId) => {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: targetUserId,
        organizationId
      }
    }
  });

  if (!membership) {
    throw new AppError('User is not a member of this organization', 404);
  }

  // RBAC Checks
  if (requesterRole !== 'OWNER' && membership.role === 'ADMIN') {
    throw new AppError('Only the OWNER can remove an ADMIN', 403);
  }

  if (membership.role === 'OWNER') {
    throw new AppError('The OWNER cannot be removed from the organization', 403);
  }

  return prisma.membership.delete({
    where: { id: membership.id }
  });
};

module.exports = {
  getMemberships,
  updateMembershipRole,
  removeMember,
};
