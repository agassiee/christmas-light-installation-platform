import { Request, Response, NextFunction } from 'express';
import { WorkersService } from './workers.service';

export const createWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await WorkersService.createWorker(req.body);
    res.status(201).json(worker);
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
};

export const getWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await WorkersService.getWorker(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    next(error);
  }
};

export const updateWorker = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const worker = await WorkersService.updateWorker(req.params.id, req.body);
    res.json(worker);
  } catch (error: any) {
    if (error.message === 'Worker not found' || (error && typeof error === 'object' && 'code' in error && error.code === 'P2025')) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    next(error);
  }
};

export const listWorkers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;

    const result = await WorkersService.listWorkers(page, limit, search);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
