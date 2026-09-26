import { Router } from 'express';
import { createProperty, getProperty, listProperties, updateProperty } from './properties.controller';
import { validate } from '../../middleware/validate.middleware';
import { createPropertySchema, getPropertySchema, listPropertiesSchema, updatePropertySchema } from './properties.schema';
import { requireAuth, requireRole } from '../../middleware/auth.middleware';

const router = Router();

// Property routes are Admin-only
router.use(requireAuth);
router.use(requireRole('ADMIN'));

router.post('/', validate(createPropertySchema), createProperty);
router.get('/', validate(listPropertiesSchema), listProperties);
router.get('/:id', validate(getPropertySchema), getProperty);
router.patch('/:id', validate(updatePropertySchema), updateProperty);

export const propertiesRouter = router;
