import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    customerId: z.string().uuid(),
    addressLine1: z.string().min(1, 'Address is required'),
    addressLine2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    notes: z.string().optional(),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    addressLine1: z.string().min(1).optional(),
    addressLine2: z.string().optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    postalCode: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

export const getPropertySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listPropertiesSchema = z.object({
  query: z.object({
    customerId: z.string().uuid().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    search: z.string().optional(),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];
