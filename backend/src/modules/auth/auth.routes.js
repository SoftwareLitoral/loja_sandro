import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/error-handler.js';
import { requireAuth } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rate-limit.js';
import * as controller from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from './auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(controller.login));

authRouter.get('/me', requireAuth, asyncHandler(controller.me));
authRouter.patch('/me', requireAuth, validate(updateProfileSchema), asyncHandler(controller.updateProfile));
authRouter.post(
  '/me/password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword),
);
