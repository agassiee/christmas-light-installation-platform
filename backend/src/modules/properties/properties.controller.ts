import { Request, Response, NextFunction } from 'express';
import { PropertiesService } from './properties.service';

export const createProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await PropertiesService.createProperty(req.body);
    res.status(201).json(property);
  } catch (error) {
    // Handle foreign key constraint failure
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    next(error);
  }
};

export const getProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await PropertiesService.getProperty(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const property = await PropertiesService.updateProperty(req.params.id, req.body);
    res.json(property);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Property not found' });
    }
    next(error);
  }
};

export const listProperties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;
    const customerId = req.query.customerId as string | undefined;

    const result = await PropertiesService.listProperties(page, limit, search, customerId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
