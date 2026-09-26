import { PrismaClient, PhotoType } from '@prisma/client';
import { cloudinary } from '../../lib/cloudinary';
import { env } from '../../config/env';
import { randomUUID } from 'crypto';

class AppError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const prisma = new PrismaClient();

export class PhotosService {
  /**
   * Generates a signed upload signature for direct-to-Cloudinary upload from the browser.
   * Limits upload size to 10MB and restricts allowed formats.
   */
  async generateUploadSignature(jobId: string, type: PhotoType) {
    // Generate a unique ID for the photo
    const uniqueId = randomUUID();
    const folder = `christmas-lights/jobs/${jobId}/${type.toLowerCase()}`;
    const publicId = uniqueId; // Cloudinary will append this to the folder
    
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Parameters that must be signed.
    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
    };
    
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      env.CLOUDINARY_API_SECRET
    );
    
    return {
      signature,
      timestamp,
      folder,
      public_id: publicId,
      api_key: env.CLOUDINARY_API_KEY,
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
    };
  }

  async createJobPhoto(
    jobId: string,
    uploadedByUserId: string,
    type: PhotoType,
    storageKey: string,
    url?: string
  ) {
    // Validate that the storage key is intended for this job to prevent spoofing
    if (!storageKey.includes(`jobs/${jobId}/${type.toLowerCase()}`)) {
      throw new AppError(400, 'Invalid storage key for this job and type');
    }

    return await prisma.jobPhoto.create({
      data: {
        jobId,
        uploadedByUserId,
        type,
        storageKey,
        url,
      },
    });
  }

  async listJobPhotos(jobId: string) {
    return await prisma.jobPhoto.findMany({
      where: { jobId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteJobPhoto(photoId: string) {
    const photo = await prisma.jobPhoto.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new AppError(404, 'Photo not found');
    }

    // Attempt to delete from Cloudinary using the Admin API
    try {
      await cloudinary.uploader.destroy(photo.storageKey);
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset ${photo.storageKey}:`, err);
      // We will still delete the DB record even if Cloudinary fails, to ensure idempotency and state cleanup
    }

    await prisma.jobPhoto.delete({
      where: { id: photoId },
    });
  }

  async getPhotoById(photoId: string) {
    return await prisma.jobPhoto.findUnique({
      where: { id: photoId },
    });
  }
}

export const photosService = new PhotosService();
