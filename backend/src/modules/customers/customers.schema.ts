import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(5, 'Valid phone number is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    notes: z.string().optional(),
    whatsappOptIn: z.boolean().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    fullName: z.string().min(1).optional(),
    phone: z.string().min(5).optional(),
    email: z.string().email().optional().or(z.literal('')),
    notes: z.string().optional(),
    whatsappOptIn: z.boolean().optional(),
    active: z.boolean().optional(),
  }),
});

export const getCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
