import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from './config/env.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/not-found.middleware.js';
import { requestContextMiddleware } from './middlewares/request-context.middleware.js';
import { requestLoggingMiddleware } from './middlewares/request-logging.middleware.js';
import {
  createHomepageRoutes,
  createAdminHomepageRoutes,
} from './modules/homepage/homepage.routes.js';
import { createMediaRoutes } from './modules/media/media.routes.js';
import {
  createAdminNewsletterRoutes,
  createNewsletterRoutes,
} from './modules/newsletter/newsletter.routes.js';
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import {
  createAdminEnquiryRoutes,
  createEnquiryRoutes,
} from './modules/enquiries/enquiry.routes.js';
import { createAdminInventoryRoutes, createInventoryRoutes } from './modules/inventory/inventory.routes.js';

export interface AppDependencies {
  environment: Environment;
  prisma: PrismaClient;
}

export const createApp = ({ environment, prisma }: AppDependencies): Express => {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContextMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(helmet());
  app.use(cors({ origin: environment.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );
  app.use('/uploads', (_request, response, next) => {
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(environment.UPLOAD_DIR, { index: false, fallthrough: true }));

  app.get('/api/v1/health/live', (_request, response) => {
    response.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Live.',
      data: { status: 'ok' },
      meta: { requestId: response.locals.requestId },
    });
  });
  app.get('/api/v1/health/ready', async (_request, response, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.status(200).json({
        success: true,
        statusCode: 200,
        message: 'Ready.',
        data: { status: 'ok' },
        meta: { requestId: response.locals.requestId },
      });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/v1/homepage', createHomepageRoutes(prisma));
  app.use('/api/v1/inventory', createInventoryRoutes(prisma, environment));
  app.use('/api/v1/enquiries', createEnquiryRoutes(prisma));
  app.use('/api/v1/admin/auth', createAuthRoutes(prisma, environment));
  app.use('/api/v1/admin/inventory', createAdminInventoryRoutes(prisma, environment));
  app.use('/api/v1/admin/enquiries', createAdminEnquiryRoutes(prisma, environment));
  app.use('/api/v1/admin/homepage', createAdminHomepageRoutes(prisma, environment));
  app.use('/api/v1/admin/media', createMediaRoutes(prisma, environment));
  app.use('/api/v1/newsletter-subscriptions', createNewsletterRoutes(prisma));
  app.use(
    '/api/v1/admin/newsletter-subscriptions',
    createAdminNewsletterRoutes(prisma, environment),
  );
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
};
