import { z } from 'zod';
import { AssignmentStatus } from '@prisma/client';

export const createAssignmentSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  body: z.object({
    workerId: z.string().uuid(),
    isLead: z.boolean().optional().default(false),
  }),
});

export const updateAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(AssignmentStatus).optional(),
    isLead: z.boolean().optional(),
  }),
});

export const getAssignmentsSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
});

export const deleteAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>['body'];
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>['body'];
