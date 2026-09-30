import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { HomepageController } from './homepage.controller.js';
import { HomepageRepository } from './homepage.repository.js';
import { HomepageService } from './homepage.service.js';

const buildController = (prisma: PrismaClient): HomepageController =>
  new HomepageController(new HomepageService(new HomepageRepository(prisma)));

export const createHomepageRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = buildController(prisma);
  router.get('/', asyncHandler(controller.get));
  return router;
};

export const createAdminHomepageRoutes = (
  prisma: PrismaClient,
  environment: Environment,
): Router => {
  const router = Router();
  const controller = buildController(prisma);
  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/', asyncHandler(controller.get));
  router.put('/', asyncHandler(controller.replace));
  router.put('/identity', asyncHandler(controller.updateIdentity));
  router.put('/site-identity', asyncHandler(controller.updateSiteIdentity));
  router.put('/benefits', asyncHandler(controller.replaceBenefits));
  router.put('/faqs', asyncHandler(controller.replaceFaqs));
  router.put('/how-it-works', asyncHandler(controller.updateHowItWorks));
  router.put('/showroom', asyncHandler(controller.updateShowroom));
  router.put('/about', asyncHandler(controller.updateAbout));
  router.put('/booking-cta', asyncHandler(controller.updateBookingCta));
  router.put('/footer', asyncHandler(controller.updateFooter));
  return router;
};
