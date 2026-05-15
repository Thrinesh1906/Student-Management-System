import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction) => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  }

  logger.error('Request error', {
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: config.env === 'development' ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  });
};
