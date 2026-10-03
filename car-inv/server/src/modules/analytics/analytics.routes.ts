import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsRepository } from './analytics.repository.js';
import { AnalyticsService } from './analytics.service.js';

const createController = (prisma: PrismaClient): AnalyticsController =>
  new AnalyticsController(new AnalyticsService(new AnalyticsRepository(prisma)));

export const createAnalyticsRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = createController(prisma);
  router.post(
    '/events',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 600,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
    asyncHandler(controller.record),
  );
  return router;
};

export const createAdminAnalyticsRoutes = (
  prisma: PrismaClient,
  environment: Environment,
): Router => {
  const router = Router();
  const controller = createController(prisma);
  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/overview', asyncHandler(controller.overview));
  return router;
};
