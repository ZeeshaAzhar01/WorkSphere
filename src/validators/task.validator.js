const { z } = require('zod');

const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title must be at least 2 characters').max(100),
    description: z.string().max(1000).optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    projectId: z.string().uuid('Invalid project ID'),
    assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
});

const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(2, 'Task title must be at least 2 characters').max(100).optional(),
    description: z.string().max(1000).optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

const getTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
});

const getTasksSchema = z.object({
  query: z.object({
    projectId: z.string().uuid('Invalid project ID').optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    assigneeId: z.string().uuid('Invalid assignee ID').optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  getTaskSchema,
  getTasksSchema,
};
