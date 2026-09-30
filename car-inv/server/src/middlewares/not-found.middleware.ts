import type { RequestHandler } from 'express';
import { NotFoundAppError } from '../errors/app-error.js';

export const notFoundMiddleware: RequestHandler = (request, _response, next) => {
  next(new NotFoundAppError(`Route ${request.method} ${request.path} was not found.`));
};
