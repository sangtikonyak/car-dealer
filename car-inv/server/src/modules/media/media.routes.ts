import multer from 'multer';
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { MediaController } from './media.controller.js';
import { MediaRepository } from './media.repository.js';
import { MediaService } from './media.service.js';

export const createMediaRoutes = (prisma: PrismaClient, environment: Environment): Router => {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: environment.MAX_UPLOAD_BYTES, files: 1 },
    fileFilter: (_request, file, callback) => {
      callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
    },
  });
  const service = new MediaService(new MediaRepository(prisma), environment.UPLOAD_DIR);
  const controller = new MediaController(service);

  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/', asyncHandler(controller.list));
  router.post('/', upload.single('image'), asyncHandler(controller.upload));
  router.delete('/:id', asyncHandler(controller.delete));
  return router;
};
