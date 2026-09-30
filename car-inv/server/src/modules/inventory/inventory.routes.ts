import multer from 'multer';
import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../../config/env.js';
import { createAdminAuthMiddleware } from '../../middlewares/admin-auth.middleware.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryRepository } from './inventory.repository.js';
import { InventoryService } from './inventory.service.js';

const createController = (prisma: PrismaClient, environment: Environment): InventoryController =>
  new InventoryController(new InventoryService(new InventoryRepository(prisma), environment));

export const createInventoryRoutes = (prisma: PrismaClient, environment: Environment): Router => {
  const router = Router();
  const controller = createController(prisma, environment);
  router.get('/options', asyncHandler(controller.options));
  router.get('/', asyncHandler(controller.list));
  router.get('/:slug', asyncHandler(controller.get));
  return router;
};

export const createAdminInventoryRoutes = (prisma: PrismaClient, environment: Environment): Router => {
  const router = Router();
  const controller = createController(prisma, environment);
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: environment.MAX_UPLOAD_BYTES, files: 20 },
    fileFilter: (_request, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
  });
  router.use(createAdminAuthMiddleware(prisma, environment));
  router.get('/vehicles', asyncHandler(controller.adminList));
  router.post('/vehicles', asyncHandler(controller.create));
  router.get('/vehicles/:id', asyncHandler(controller.adminGet));
  router.put('/vehicles/:id', asyncHandler(controller.update));
  router.delete('/vehicles/:id', asyncHandler(controller.delete));
  router.post('/vehicles/:id/photos', upload.array('images', 20), asyncHandler(controller.uploadPhotos));
  router.put('/vehicles/:id/photos/order', asyncHandler(controller.reorderPhotos));
  router.delete('/vehicles/:id/photos/:photoId', asyncHandler(controller.deletePhoto));
  router.get('/makes', asyncHandler(controller.makes));
  router.post('/makes', asyncHandler(controller.createMake));
  router.put('/makes/:id', asyncHandler(controller.updateMake));
  router.delete('/makes/:id', asyncHandler(controller.deleteMake));
  router.get('/fuel-types', asyncHandler(controller.fuelTypes));
  router.post('/fuel-types', asyncHandler(controller.createFuelType));
  router.put('/fuel-types/:id', asyncHandler(controller.updateFuelType));
  router.delete('/fuel-types/:id', asyncHandler(controller.deleteFuelType));
  return router;
};
