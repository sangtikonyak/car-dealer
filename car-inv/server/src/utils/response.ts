import type { Response } from 'express';

export const sendSuccess = <T>(
  response: Response,
  statusCode: number,
  message: string,
  data: T,
): Response =>
  response.status(statusCode).json({
    success: true,
    statusCode,
    message,
    data,
    meta: { requestId: response.locals.requestId },
  });
