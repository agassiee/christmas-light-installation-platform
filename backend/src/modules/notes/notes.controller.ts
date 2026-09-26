import { Request, Response, NextFunction } from 'express';
import { NotesService } from './notes.service';
import { JobsService } from '../jobs/jobs.service';
import { WorkersService } from '../workers/workers.service';

const checkJobAccess = async (req: Request): Promise<boolean> => {
  if (req.user!.role === 'ADMIN') return true;
  
  if (req.user!.role === 'WORKER') {
    const job = await JobsService.getJob(req.params.jobId);
    if (!job) return false;
    
    const worker = await WorkersService.getWorkerByUserId(req.user!.id);
    if (!worker) return false;
    
    return job.Assignments.some(a => a.workerId === worker.id);
  }
  return false;
};

export const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasAccess = await checkJobAccess(req);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied: You cannot add notes to this job' });
    }

    const note = await NotesService.createNote(req.params.jobId, req.user!.id, req.body);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const listNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hasAccess = await checkJobAccess(req);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notes = await NotesService.listNotes(req.params.jobId);
    res.json(notes);
  } catch (error) {
    next(error);
  }
};
