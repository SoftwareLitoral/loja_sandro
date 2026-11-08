import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/error-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import * as controller from './addresses.controller.js';
import { addressSchema, updateAddressSchema } from './addresses.schema.js';

export const addressesRouter = Router();

addressesRouter.use(requireAuth);

addressesRouter.get('/', asyncHandler(controller.list));
addressesRouter.post('/', validate(addressSchema), asyncHandler(controller.create));
addressesRouter.get('/:id', asyncHandler(controller.get));
addressesRouter.patch('/:id', validate(updateAddressSchema), asyncHandler(controller.update));
addressesRouter.delete('/:id', asyncHandler(controller.remove));
addressesRouter.post('/:id/default', asyncHandler(controller.setDefault));
