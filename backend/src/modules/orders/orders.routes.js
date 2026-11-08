import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/error-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import * as controller from './orders.controller.js';
import { createOrderSchema, listOrdersSchema } from './orders.schema.js';

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

ordersRouter.post('/', validate(createOrderSchema), asyncHandler(controller.create));
ordersRouter.get('/', validate(listOrdersSchema, 'query'), asyncHandler(controller.list));
ordersRouter.get('/:id', asyncHandler(controller.get));
ordersRouter.post('/:id/pay', asyncHandler(controller.pay));
ordersRouter.post('/:id/cancel', asyncHandler(controller.cancel));
