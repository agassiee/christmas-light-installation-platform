import { z } from 'zod';

export const createWorkerSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'), // Needed for User login
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(5, 'Valid phone number is required'),
    skills: z.string().optional(),
  }),
});

export const updateWorkerSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    fullName: z.string().min(1).optional(),
    phone: z.string().min(5).optional(),
    skills: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

export const getWorkerSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listWorkersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
  }),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>['body'];
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>['body'];
