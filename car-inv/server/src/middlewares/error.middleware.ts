import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;

  if (error instanceof multer.MulterError) {
    response.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid upload.',
      error: { code: 'UPLOAD_ERROR', details: [{ field: error.field, message: error.message }] },
      meta: { requestId: response.locals.requestId },
    });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Validation failed.',
      error: { code: 'VALIDATION_ERROR', details: error.issues },
      meta: { requestId: response.locals.requestId },
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    response.status(409).json({
      success: false,
      statusCode: 409,
      message: 'A resource with the same unique value already exists.',
      error: { code: 'CONFLICT', details: [] },
      meta: { requestId: response.locals.requestId },
    });
    return;
  }

  const appError = error instanceof AppError ? error : undefined;
  if (!appError) {
    logger.error('Unhandled request error', {
      requestId: response.locals.requestId,
      method: request.method,
      path: request.path,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const statusCode = appError?.statusCode ?? 500;
  response.status(statusCode).json({
    success: false,
    statusCode,
    message: appError?.message ?? 'Internal server error.',
    error: {
      code: appError?.code ?? 'INTERNAL_SERVER_ERROR',
      details: appError?.details ?? [],
    },
    meta: { requestId: response.locals.requestId },
  });
};
