import { z } from 'zod';
import { PhotoType } from '@prisma/client';

export const createPhotoSchema = z.object({
  type: z.nativeEnum(PhotoType),
  storageKey: z.string().min(1),
  url: z.string().url().optional(),
});

export const uploadSignatureSchema = z.object({
  type: z.nativeEnum(PhotoType),
});

export type CreatePhotoInput = z.infer<typeof createPhotoSchema>;
export type UploadSignatureInput = z.infer<typeof uploadSignatureSchema>;
