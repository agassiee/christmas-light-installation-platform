import { Router } from 'express';
import {
  createAssignment,
  listAssignments,
  updateAssignment,
  deleteAssignment,
} from './assignments.controller';
import { validate } from '../../middleware/validate.middleware';
import {
  createAssignmentSchema,
  getAssignmentsSchema,
  updateAssignmentSchema,
  deleteAssignmentSchema,
} from './assignments.schema';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

// Admin & Worker can list assignments (Worker only if they belong to the job)
router.get('/jobs/:jobId/assignments', validate(getAssignmentsSchema), listAssignments);

// Admin & Worker can update assignment (Worker can only accept/decline their own)
router.patch('/assignments/:id', validate(updateAssignmentSchema), updateAssignment);

// Admin-only endpoints
router.post('/jobs/:jobId/assignments', requireRole('ADMIN'), validate(createAssignmentSchema), createAssignment);
router.delete('/assignments/:id', requireRole('ADMIN'), validate(deleteAssignmentSchema), deleteAssignment);

export const assignmentsRouter = router;
