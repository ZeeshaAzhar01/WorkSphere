const { z } = require('zod');

const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['ADMIN', 'MEMBER']).optional(),
  }),
});

const acceptInvitationSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

const revokeInvitationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invitation ID'),
  }),
});

module.exports = {
  createInvitationSchema,
  acceptInvitationSchema,
  revokeInvitationSchema,
};
