import type { RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import type { Environment } from '../config/env.js';
import { UnauthorizedAppError } from '../errors/app-error.js';
import { readCookie } from '../modules/auth/auth.cookies.js';
import { AuthRepository } from '../modules/auth/auth.repository.js';
import { AuthService } from '../modules/auth/auth.service.js';

export const createAdminAuthMiddleware = (
  prisma: PrismaClient,
  environment: Environment,
): RequestHandler => {
  const service = new AuthService(new AuthRepository(prisma), environment.ADMIN_SESSION_TTL_HOURS);

  return (request, response, next) => {
    void (async () => {
      const providedKey = request.header('x-admin-api-key');
      if (providedKey && providedKey === environment.ADMIN_API_KEY) {
        request.adminUser = { id: 'api-key', email: 'api-key', role: 'admin' };
        next();
        return;
      }

      const token = readCookie(request.header('cookie'), environment.ADMIN_SESSION_COOKIE);
      if (!token) throw new UnauthorizedAppError();

      const authenticated = await service.authenticate(token);
      request.adminUser = authenticated.user;
      request.adminSessionId = authenticated.sessionId;
      response.locals.adminSessionExpiresAt = authenticated.expiresAt;
      next();
    })().catch(next);
  };
};
