const { z } = require('zod');

const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
    description: z.string().max(500).optional().nullable(),
  }),
});

const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Project name must be at least 2 characters').max(100).optional(),
    description: z.string().max(500).optional().nullable(),
    status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
});

const getProjectSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid project ID'),
  }),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  getProjectSchema,
};
