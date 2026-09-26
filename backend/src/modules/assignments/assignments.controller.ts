import { Request, Response, NextFunction } from 'express';
import { AssignmentsService } from './assignments.service';
import { WorkersService } from '../workers/workers.service';
import { JobsService } from '../jobs/jobs.service';
import { AssignmentStatus } from '@prisma/client';

export const createAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await AssignmentsService.createAssignment(req.params.jobId, req.body);
    res.status(201).json(assignment);
  } catch (error: any) {
    if (error.message === 'This job already has a lead worker' || 
        (error && typeof error === 'object' && 'code' in error && error.code === 'P2002')) {
      return res.status(409).json({ message: error.message || 'Duplicate assignment or lead constraint violation' });
    }
    next(error);
  }
};

export const listAssignments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // IDOR Protection: If worker, check if they are assigned to this job
    if (req.user!.role === 'WORKER') {
      const job = await JobsService.getJob(req.params.jobId);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      
      const worker = await WorkersService.getWorkerByUserId(req.user!.id);
      const isAssigned = job.Assignments.some(a => a.workerId === worker?.id);
      if (!isAssigned) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const assignments = await AssignmentsService.listAssignments(req.params.jobId);
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

export const updateAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // IDOR Protection: Workers can only update their own assignment (to accept/decline)
    if (req.user!.role === 'WORKER') {
      const assignment = await AssignmentsService.getAssignment(req.params.id);
      if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
      
      const worker = await WorkersService.getWorkerByUserId(req.user!.id);
      if (assignment.workerId !== worker?.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Workers can only change status to ACCEPTED or DECLINED
      if (req.body.isLead !== undefined || 
          (req.body.status && req.body.status !== AssignmentStatus.ACCEPTED && req.body.status !== AssignmentStatus.DECLINED)) {
        return res.status(403).json({ message: 'Workers can only accept or decline assignments' });
      }
    }

    const updated = await AssignmentsService.updateAssignment(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    if (error.message === 'This job already has a lead worker' || error.message === 'Assignment not found') {
      return res.status(error.message === 'Assignment not found' ? 404 : 409).json({ message: error.message });
    }
    next(error);
  }
};

export const deleteAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await AssignmentsService.deleteAssignment(req.params.id);
    res.json(deleted);
  } catch (error) {
    next(error);
  }
};
