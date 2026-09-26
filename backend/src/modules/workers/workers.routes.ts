import { Router } from 'express';
import { createWorker, getWorker, listWorkers, updateWorker } from './workers.controller';
import { validate } from '../../middleware/validate.middleware';
import { createWorkerSchema, getWorkerSchema, listWorkersSchema, updateWorkerSchema } from './workers.schema';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Worker CRUD routes are Admin-only
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.post('/', validate(createWorkerSchema), createWorker);
router.get('/', validate(listWorkersSchema), listWorkers);
router.get('/:id', validate(getWorkerSchema), getWorker);
router.patch('/:id', validate(updateWorkerSchema), updateWorker);

export const workersRouter = router;
