import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

export const createAuthRoutes = (prisma: PrismaClient, environment: Environment): Router => {
  const router = Router();
  const controller = new AuthController(
    new AuthService(new AuthRepository(prisma), environment.ADMIN_SESSION_TTL_HOURS),
    environment,
  );

  router.post(
    '/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
    asyncHandler(controller.login),
  );
  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/me', asyncHandler(controller.me));
  router.post('/logout', asyncHandler(controller.logout));
  return router;
};
