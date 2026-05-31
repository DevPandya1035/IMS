export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err instanceof AppError ? err.message : 'Internal server error';

  logger.error(err.message, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode,
  });

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({ success: false, error: message });
  } else {
    res.status(statusCode).json({
      success: false,
      error: message,
      stack: err.stack,
    });
  }
}
