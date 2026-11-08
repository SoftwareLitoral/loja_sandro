import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/error-handler.js';
import { optionalAuth, requireAuth } from '../../middlewares/auth.js';
import * as controller from './cart.controller.js';
import { addItemSchema, updateItemSchema, mergeSchema } from './cart.schema.js';

export const cartRouter = Router();

cartRouter.get('/', optionalAuth, asyncHandler(controller.get));
cartRouter.post('/items', optionalAuth, validate(addItemSchema), asyncHandler(controller.addItem));
cartRouter.patch(
  '/items/:productId',
  optionalAuth,
  validate(updateItemSchema),
  asyncHandler(controller.updateItem),
);
cartRouter.delete('/items/:productId', optionalAuth, asyncHandler(controller.removeItem));
cartRouter.delete('/', optionalAuth, asyncHandler(controller.clear));
cartRouter.post('/merge', requireAuth, validate(mergeSchema), asyncHandler(controller.merge));
