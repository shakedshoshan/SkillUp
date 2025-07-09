import { Request, Response, NextFunction } from 'express';
import { envConfig } from '../config/env.config';

// Custom Error Classes
export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode.toString().startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, originalError?: any) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

// Supabase Error Handler
const handleSupabaseError = (error: any): AppError => {
  console.log('Handling Supabase error:', { code: error.code, message: error.message, details: error.details });
  
  // Handle Supabase specific errors
  if (error.code === 'PGRST116') {
    return new NotFoundError('Resource');
  }
  
  if (error.code === '23505') {
    return new ValidationError('Duplicate entry found');
  }
  
  if (error.code === '23503') {
    return new ValidationError('Invalid reference to related resource');
  }
  
  if (error.code === '42P01') {
    return new DatabaseError('Table or view does not exist');
  }

  // Generic database error
  return new DatabaseError(`Database operation failed: ${error.message}`);
};

// Cast Error to AppError
const castErrorToAppError = (err: any): AppError => {
  let error = err;

  // Mongoose CastError (if you ever use MongoDB)
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new ValidationError(message);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    error = new ValidationError(message);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new ValidationError(message);
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    error = new UnauthorizedError(message);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    error = new UnauthorizedError(message);
  }

  // Supabase Errors - check multiple ways Supabase errors can appear
  if (err.code && typeof err.code === 'string') {
    error = handleSupabaseError(err);
  } else if (err.error && err.error.code) {
    // Sometimes Supabase wraps errors in an error property
    error = handleSupabaseError(err.error);
  } else if (err.message && err.message.includes('PGRST')) {
    // Parse PGRST errors from message
    if (err.message.includes('PGRST116')) {
      error = new NotFoundError('Resource');
    } else {
      error = new DatabaseError(err.message);
    }
  }

  return error;
};

// Development Error Response
const sendErrorDev = (err: AppError, req: Request, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    status: err.status,
    code: err.code,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// Production Error Response
const sendErrorProd = (err: AppError, req: Request, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Main Error Handling Middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Convert to AppError if not already
  if (!(error instanceof AppError)) {
    error = castErrorToAppError(err);
  }

  // Log error
  console.error(`${error.statusCode || 500} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (envConfig.nodeEnv === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// Async Error Handler Wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Handler for undefined routes
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
}; 