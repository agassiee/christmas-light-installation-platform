import { z } from 'zod';
import { JobType, JobStatus } from '@prisma/client';

export const createJobSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid(),
    type: z.nativeEnum(JobType),
    scheduledDate: z.string().datetime(), // ISO 8601
    scheduledStartTime: z.string().optional(),
    estimatedDurationMinutes: z.number().optional(),
    instructions: z.string().optional(),
    equipmentNotes: z.string().optional(),
  }),
});

export const updateJobSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    instructions: z.string().optional(),
    equipmentNotes: z.string().optional(),
  }),
});

export const transitionJobSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(JobStatus),
    cancellationReason: z.string().optional(),
  }),
});

export const rescheduleJobSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    scheduledDate: z.string().datetime(),
    scheduledStartTime: z.string().optional(),
    reason: z.string().optional(),
  }),
});

export const getJobSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listJobsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    propertyId: z.string().uuid().optional(),
    status: z.nativeEnum(JobStatus).optional(),
    type: z.nativeEnum(JobType).optional(),
  }),
});

export type CreateJobInput = z.infer<typeof createJobSchema>['body'];
export type UpdateJobInput = z.infer<typeof updateJobSchema>['body'];
export type TransitionJobInput = z.infer<typeof transitionJobSchema>['body'];
export type RescheduleJobInput = z.infer<typeof rescheduleJobSchema>['body'];
