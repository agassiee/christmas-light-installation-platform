import { Router } from 'express';
import { createNote, listNotes } from './notes.controller';
import { validate } from '../../middleware/validate.middleware';
import { createNoteSchema, getNotesSchema } from './notes.schema';
import { requireAuth } from '../../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);

router.get('/jobs/:jobId/notes', validate(getNotesSchema), listNotes);
router.post('/jobs/:jobId/notes', validate(createNoteSchema), createNote);

export const notesRouter = router;
