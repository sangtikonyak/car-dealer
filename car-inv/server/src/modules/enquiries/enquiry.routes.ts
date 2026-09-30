import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { EnquiryController } from './enquiry.controller.js';
import { EnquiryRepository } from './enquiry.repository.js';
import { EnquiryService } from './enquiry.service.js';

const createController = (prisma: PrismaClient): EnquiryController =>
  new EnquiryController(new EnquiryService(new EnquiryRepository(prisma)));

export const createEnquiryRoutes = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = createController(prisma);
  router.post(
    '/',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 20,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
    asyncHandler(controller.create),
  );
  return router;
};

export const createAdminEnquiryRoutes = (
  prisma: PrismaClient,
  environment: Environment,
): Router => {
  const router = Router();
  const controller = createController(prisma);
  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/summary', asyncHandler(controller.summary));
  router.get('/', asyncHandler(controller.listAdmin));
  router.patch('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.delete));
  return router;
};
