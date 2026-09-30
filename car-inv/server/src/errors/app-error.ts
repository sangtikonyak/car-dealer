export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: unknown[];

  public constructor(statusCode: number, code: string, message: string, details: unknown[] = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationAppError extends AppError {
  public constructor(message: string, details: unknown[] = []) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class UnauthorizedAppError extends AppError {
  public constructor(message = 'Administrative access is required.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class NotFoundAppError extends AppError {
  public constructor(message = 'Resource not found.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictAppError extends AppError {
  public constructor(message = 'The resource already exists.') {
    super(409, 'CONFLICT', message);
  }
}
