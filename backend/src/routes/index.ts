import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { customersRouter } from '../modules/customers/customers.routes';
import { propertiesRouter } from '../modules/properties/properties.routes';
import { workersRouter } from '../modules/workers/workers.routes';
import { jobsRouter } from '../modules/jobs/jobs.routes';
import { assignmentsRouter } from '../modules/assignments/assignments.routes';
import { notesRouter } from '../modules/notes/notes.routes';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use('/auth', authRouter);
router.use('/customers', customersRouter);
router.use('/properties', propertiesRouter);
router.use('/workers', workersRouter);
router.use('/jobs', jobsRouter);
router.use('/', assignmentsRouter);
router.use('/', notesRouter);

// Test routes for RBAC
router.get('/admin-only', requireAuth, requireRole('ADMIN'), (req, res) => {
  res.json({ success: true, message: 'Admin area' });
});

router.get('/worker-only', requireAuth, requireRole('WORKER'), (req, res) => {
  res.json({ success: true, message: 'Worker area' });
});

export { router as rootRouter };
