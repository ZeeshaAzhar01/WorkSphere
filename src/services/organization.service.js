const prisma = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Creates a new organization and assigns the user as the OWNER.
 * Wrapped in a transaction to ensure both happen or neither happen.
 * 
 * @param {string} userId - ID of the user creating the organization
 * @param {Object} data - { name }
 * @returns {Object} the newly created organization
 */
const createOrganization = async (userId, data) => {
  const { name } = data;
  
  // Generate a basic slug from the name
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 8)}`;

  // Use a transaction
  return prisma.$transaction(async (tx) => {
    // 1. Create Organization
    const organization = await tx.organization.create({
      data: {
        name,
        slug,
      }
    });

    // 2. Create Membership as OWNER
    await tx.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: 'OWNER',
      }
    });

    // 3. Attach FREE subscription
    const freePlan = await tx.plan.findUnique({
      where: { name: 'FREE' }
    });

    if (!freePlan) {
      throw new AppError('Default plan not configured in system.', 500);
    }

    await tx.subscription.create({
      data: {
        organizationId: organization.id,
        planId: freePlan.id,
        status: 'ACTIVE' // Free plans are immediately active
      }
    });

    return organization;
  });
};

/**
 * Retrieves all organizations that a user is a member of.
 * 
 * @param {string} userId 
 * @returns {Array} List of organizations with role
 */
const getUserOrganizations = async (userId) => {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      organization: true,
    }
  });
  
  return memberships.map(m => ({
    role: m.role,
    joinedAt: m.createdAt,
    ...m.organization,
  }));
};

module.exports = {
  createOrganization,
  getUserOrganizations,
};
