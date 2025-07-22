import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { logger } from '../utils/logger'
import { env } from '../config/environment'

export interface AppError extends Error {
  statusCode?: number
  code?: string
  isOperational?: boolean
}

export class CustomError extends Error implements AppError {
  public statusCode: number
  public code: string
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500
  let message = error.message || 'Internal Server Error'
  let code = error.code || 'INTERNAL_ERROR'

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409
        message = 'Resource already exists'
        code = 'CONFLICT'
        break
      case 'P2025':
        statusCode = 404
        message = 'Resource not found'
        code = 'NOT_FOUND'
        break
      case 'P2003':
        statusCode = 400
        message = 'Invalid reference'
        code = 'INVALID_REFERENCE'
        break
      default:
        statusCode = 500
        message = 'Database error'
        code = 'DATABASE_ERROR'
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    message = 'Invalid data provided'
    code = 'VALIDATION_ERROR'
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401
    message = 'Invalid token'
    code = 'INVALID_TOKEN'
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Token expired'
    code = 'TOKEN_EXPIRED'
  }

  // Log error
  logger.error('Application error', {
    error: {
      message: error.message,
      stack: error.stack,
      code,
      statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  })

  // Send error response
  const response: any = {
    success: false,
    error: message,
    code
  }

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = error.stack
  }

  res.status(statusCode).json(response)
}

// Handle async errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  })
}

// Validation error handler
export const validationErrorHandler = (errors: any[]): CustomError => {
  const message = errors.map(err => `${err.field}: ${err.message}`).join(', ')
  return new CustomError(message, 400, 'VALIDATION_ERROR')
}