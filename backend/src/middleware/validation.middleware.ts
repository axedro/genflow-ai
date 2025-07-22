import { Request, Response, NextFunction } from 'express'
import { z, ZodSchema } from 'zod'
import { logger } from '../utils/logger'

export const validate = (schema: {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }
      
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }
      
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }
      
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        
        logger.warn('Validation failed', { errors: errorMessages })
        
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errorMessages
        })
      } else {
        if (error instanceof Error) {
          logger.error('Validation middleware error', { error: error.message })
        } else {
          logger.error('Validation middleware error', { error })
        }
        res.status(500).json({
          success: false,
          error: 'Internal validation error'
        })
      }
    }
  }
}

// Validation schemas
export const authSchemas = {
  register: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    companyName: z.string().max(100).optional(),
    industry: z.string().max(50).optional()
  }),
  
  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number')
  }),
  
  forgotPassword: z.object({
    email: z.string().email('Invalid email format')
  })
}

export const workspaceSchemas = {
  create: z.object({
    name: z.string().min(1, 'Workspace name is required').max(100),
    description: z.string().max(500).optional(),
    industry: z.string().max(50).optional(),
    companySize: z.enum(['micro', 'small', 'medium', 'large']).optional()
  }),
  
  update: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    industry: z.string().max(50).optional(),
    companySize: z.enum(['micro', 'small', 'medium', 'large']).optional(),
    settings: z.record(z.any()).optional()
  })
}