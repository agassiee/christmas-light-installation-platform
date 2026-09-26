import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  generateUploadSignature,
  createJobPhoto,
  listJobPhotos,
  deleteJobPhoto,
} from './photos.controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/upload-signature', generateUploadSignature);
router.post('/', createJobPhoto);
router.get('/', listJobPhotos);
router.delete('/:photoId', deleteJobPhoto);

export default router;
