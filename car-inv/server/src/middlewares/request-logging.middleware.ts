import type { RequestHandler } from 'express';
import { logger } from '../utils/logger.js';

export const requestLoggingMiddleware: RequestHandler = (request, response, next) => {
  const startedAt = Date.now();
  response.on('finish', () => {
    logger.info('HTTP request completed', {
      requestId: response.locals.requestId,
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      latencyMs: Date.now() - startedAt,
    });
  });
  next();
};
