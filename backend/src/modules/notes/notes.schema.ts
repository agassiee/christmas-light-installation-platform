import { z } from 'zod';

export const createNoteSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
  body: z.object({
    body: z.string().min(1, 'Note body is required'),
  }),
});

export const getNotesSchema = z.object({
  params: z.object({
    jobId: z.string().uuid(),
  }),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>['body'];
