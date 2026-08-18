const { z } = require('zod');

const updateMembershipSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MEMBER']),
  }),
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

const removeMemberSchema = z.object({
  params: z.object({
    userId: z.string().uuid('Invalid user ID'),
  }),
});

module.exports = {
  updateMembershipSchema,
  removeMemberSchema,
};
