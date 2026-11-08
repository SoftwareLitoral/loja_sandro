
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/error-handler.js';
import { requireAuth, requireAdmin } from '../../middlewares/auth.js';
import * as controller from './products.controller.js';

import {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
} from './products.schema.js';

export const productsRouter = Router();

// Rotas administrativas
productsRouter.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(controller.adminList),
);

productsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  validate(createProductSchema),
  asyncHandler(controller.create),
);

productsRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate(updateProductSchema),
  asyncHandler(controller.update),
);

// Desativar produto
productsRouter.patch(
  '/:id/deactivate',
  requireAuth,
  requireAdmin,
  asyncHandler(controller.deactivate),
);

// Excluir produto permanentemente
productsRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(controller.remove),
);

// Rotas públicas
productsRouter.get(
  '/',
  validate(listProductsSchema, 'query'),
  asyncHandler(controller.list),
);

productsRouter.get(
  '/featured',
  asyncHandler(controller.featured),
);

productsRouter.get(
  '/slug/:slug',
  asyncHandler(controller.getBySlug),
);

productsRouter.get(
  '/:id',
  asyncHandler(controller.getById),
);
