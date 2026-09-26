import { Request, Response, NextFunction } from 'express';
import { CustomersService } from './customers.service';

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await CustomersService.createCustomer(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomersService.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await CustomersService.updateCustomer(req.params.id, req.body);
    res.json(customer);
  } catch (error) {
    // Prisma record not found error
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({ message: 'Customer not found' });
    }
    next(error);
  }
};

export const listCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const search = req.query.search as string | undefined;

    const result = await CustomersService.listCustomers(page, limit, search);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
