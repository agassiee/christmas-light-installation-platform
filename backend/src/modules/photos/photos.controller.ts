import { Request, Response, NextFunction } from 'express';
import { photosService } from './photos.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkersService } from '../workers/workers.service';
import { uploadSignatureSchema, createPhotoSchema } from './photos.schema';

async function checkWorkerJobAccess(userId: string, jobId: string): Promise<boolean> {
  const job = await JobsService.getJob(jobId);
  if (!job) return false;

  const worker = await WorkersService.getWorkerByUserId(userId);
  if (!worker) return false;

  return job.Assignments.some(a => a.workerId === worker.id);
}

export const generateUploadSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const validated = uploadSignatureSchema.parse(req.body);

    if (req.user!.role === 'WORKER') {
      const hasAccess = await checkWorkerJobAccess(req.user!.id, jobId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this job' });
      }
    }

    const signatureData = await photosService.generateUploadSignature(jobId, validated.type);
    res.json(signatureData);
  } catch (error) {
    next(error);
  }
};

export const createJobPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const validated = createPhotoSchema.parse(req.body);

    if (req.user!.role === 'WORKER') {
      const hasAccess = await checkWorkerJobAccess(req.user!.id, jobId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this job' });
      }
    }

    const photo = await photosService.createJobPhoto(
      jobId,
      req.user!.id,
      validated.type,
      validated.storageKey,
      validated.url
    );

    res.status(201).json(photo);
  } catch (error) {
    next(error);
  }
};

export const listJobPhotos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;

    if (req.user!.role === 'WORKER') {
      const hasAccess = await checkWorkerJobAccess(req.user!.id, jobId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this job' });
      }
    }

    const photos = await photosService.listJobPhotos(jobId);
    res.json(photos);
  } catch (error) {
    next(error);
  }
};

export const deleteJobPhoto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId, photoId } = req.params;

    const photo = await photosService.getPhotoById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    if (photo.jobId !== jobId) {
      return res.status(400).json({ message: 'Photo does not belong to this job' });
    }

    if (req.user!.role === 'WORKER') {
      const hasAccess = await checkWorkerJobAccess(req.user!.id, jobId);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this job' });
      }
      
      // Even if assigned, a worker can only delete their own uploaded photos
      if (photo.uploadedByUserId !== req.user!.id) {
         return res.status(403).json({ message: 'Access denied: You can only delete your own photos' });
      }
    }

    await photosService.deleteJobPhoto(photoId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
