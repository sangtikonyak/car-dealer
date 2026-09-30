import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { NewsletterController } from './newsletter.controller.js';
import { NewsletterRepository } from './newsletter.repository.js';
import { NewsletterService } from './newsletter.service.js';

export const createNewsletterRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new NewsletterController(
    new NewsletterService(new NewsletterRepository(prisma)),
  );
  router.post('/', asyncHandler(controller.subscribe));
  return router;
};

export const createAdminNewsletterRoutes = (
  prisma: PrismaClient,
  environment: Environment,
): Router => {
  const router = Router();
  const controller = new NewsletterController(
    new NewsletterService(new NewsletterRepository(prisma)),
  );
  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/', asyncHandler(controller.list));
  return router;
};
