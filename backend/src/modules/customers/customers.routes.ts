import { Router } from 'express';
import { createCustomer, getCustomer, listCustomers, updateCustomer } from './customers.controller';
import { validate } from '../../middleware/validate.middleware';
import { createCustomerSchema, getCustomerSchema, listCustomersSchema, updateCustomerSchema } from './customers.schema';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// All customer routes are Admin-only
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.post('/', validate(createCustomerSchema), createCustomer);
router.get('/', validate(listCustomersSchema), listCustomers);
router.get('/:id', validate(getCustomerSchema), getCustomer);
router.patch('/:id', validate(updateCustomerSchema), updateCustomer);

export const customersRouter = router;
