import { Request, Response, NextFunction } from 'express';
import { JobsService } from './jobs.service';
import { WorkersService } from '../workers/workers.service';
import { JobStatus, JobType } from '@prisma/client';

export const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await JobsService.createJob(req.body, req.user!.id);
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

export const getJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await JobsService.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // IDOR Protection: If worker, check assignment
    if (req.user!.role === 'WORKER') {
      const worker = await WorkersService.getWorkerByUserId(req.user!.id);
      if (!worker) {
        return res.status(403).json({ message: 'Worker profile not found' });
      }
      const isAssigned = job.Assignments.some(a => a.workerId === worker.id);
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied: You are not assigned to this job' });
      }
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic updates (instructions etc.)
    const job = await JobsService.updateJob(req.params.id, req.body);
    res.json(job);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Job not found' });
    }
    next(error);
  }
};

export const transitionJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // IDOR Protection: Worker can only transition jobs they are assigned to
    if (req.user!.role === 'WORKER') {
      const job = await JobsService.getJob(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      const worker = await WorkersService.getWorkerByUserId(req.user!.id);
      const isAssigned = job.Assignments.some(a => a.workerId === worker?.id);
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const job = await JobsService.transitionJob(req.params.id, req.body, req.user!.id);
    res.json(job);
  } catch (error: any) {
    if (error.message?.includes('Invalid status transition') || error.message?.includes('requires a reason')) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

export const rescheduleJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await JobsService.rescheduleJob(req.params.id, req.body, req.user!.id);
    res.json(job);
  } catch (error) {
    next(error);
  }
};

export const listJobs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    const filters: any = {
      propertyId: req.query.propertyId,
      status: req.query.status,
      type: req.query.type,
    };

    // IDOR Protection: Force workerId filter if user is WORKER
    if (req.user!.role === 'WORKER') {
      const worker = await WorkersService.getWorkerByUserId(req.user!.id);
      if (!worker) {
        return res.status(403).json({ message: 'Worker profile not found' });
      }
      filters.workerId = worker.id;
    }

    const result = await JobsService.listJobs(page, limit, filters);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getJobHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const history = await JobsService.getJobHistory(req.params.id);
    res.json(history);
  } catch (error) {
    next(error);
  }
};
