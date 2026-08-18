const crypto = require('crypto');
const prisma = require('../config/database');
const AppError = require('../utils/AppError');

const createInvitation = async (organizationId, inviterId, data) => {
  const { email, role = 'MEMBER' } = data;

  // 1. Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const membership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId,
        }
      }
    });
    if (membership) {
      throw new AppError('User is already a member of this organization', 400);
    }
  }

  // 2. Check if a pending invite already exists
  const existingInvite = await prisma.invitation.findFirst({
    where: {
      organizationId,
      email,
      status: 'PENDING'
    }
  });

  if (existingInvite) {
    // We could resend the email here, but for now we just return the existing token
    return existingInvite;
  }

  // 3. Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  // 4. Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      organizationId,
      invitedBy: inviterId,
      email,
      role,
      token,
      expiresAt,
    }
  });

  // TODO: Send email with token link here

  return invitation;
};

const getPendingInvitations = async (organizationId) => {
  return prisma.invitation.findMany({
    where: {
      organizationId,
      status: 'PENDING',
    },
    include: {
      inviter: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

const revokeInvitation = async (organizationId, invitationId) => {
  const invitation = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId }
  });

  if (!invitation) {
    throw new AppError('Invitation not found in this organization', 404);
  }

  if (invitation.status !== 'PENDING') {
    throw new AppError(`Cannot revoke invitation with status: ${invitation.status}`, 400);
  }

  return prisma.invitation.update({
    where: { id: invitationId },
    data: { status: 'REVOKED' }
  });
};

const acceptInvitation = async (userId, token) => {
  // 1. Find invitation
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { organization: true }
  });

  if (!invitation) {
    throw new AppError('Invalid or expired invitation token', 400);
  }

  if (invitation.status !== 'PENDING') {
    throw new AppError('Invitation is no longer valid', 400);
  }

  if (new Date() > invitation.expiresAt) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'EXPIRED' }
    });
    throw new AppError('Invitation has expired', 400);
  }

  // 2. Verify email matches the logged in user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.email !== invitation.email) {
    throw new AppError('This invitation was sent to a different email address', 403);
  }

  // 3. Process acceptance in a transaction
  return prisma.$transaction(async (tx) => {
    // Mark as accepted
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED' }
    });

    // Create membership (if it doesn't already exist via some edge case)
    const membership = await tx.membership.upsert({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invitation.organizationId
        }
      },
      update: {
        role: invitation.role
      },
      create: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role
      }
    });

    return {
      organization: invitation.organization,
      membership
    };
  });
};

module.exports = {
  createInvitation,
  getPendingInvitations,
  revokeInvitation,
  acceptInvitation,
};
