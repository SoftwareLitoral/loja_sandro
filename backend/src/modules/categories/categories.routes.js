
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireAuth, requireAdmin } from '../../middlewares/auth.js';
import * as controller from './categories.controller.js';

export const categoriesRouter = Router();

// Listagem pública para a loja
categoriesRouter.get('/', asyncHandler(controller.list));

// Cadastro exclusivo para administradores
categoriesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(controller.create),
);
