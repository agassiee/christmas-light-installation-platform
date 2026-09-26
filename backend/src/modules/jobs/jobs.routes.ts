import { Router } from 'express';
import {
  createJob,
  getJob,
  updateJob,
  transitionJob,
  rescheduleJob,
  listJobs,
  getJobHistory,
} from './jobs.controller';
import { validate } from '../../middleware/validate.middleware';
import {
  createJobSchema,
  getJobSchema,
  listJobsSchema,
  updateJobSchema,
  transitionJobSchema,
  rescheduleJobSchema,
} from './jobs.schema';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// All job routes require auth
router.use(requireAuth);

// Admin & Worker can list jobs (Worker only sees their own)
router.get('/', validate(listJobsSchema), listJobs);

// Admin & Worker can get job details (Worker only sees their own)
router.get('/:id', validate(getJobSchema), getJob);

// Admin & Worker can transition status (Worker only on their own)
router.patch('/:id/status', validate(transitionJobSchema), transitionJob);

// Photos sub-router (Admin & Worker)
import photosRouter from '../photos/photos.routes';
router.use('/:jobId/photos', photosRouter);

// The rest are Admin-only
router.use(requireRole('ADMIN'));

router.post('/', validate(createJobSchema), createJob);
router.patch('/:id', validate(updateJobSchema), updateJob);
router.patch('/:id/reschedule', validate(rescheduleJobSchema), rescheduleJob);
router.get('/:id/history', validate(getJobSchema), getJobHistory);

export const jobsRouter = router;
