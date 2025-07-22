import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service'
import { logger } from '../utils/logger'
import { AuthRequest } from '../types'
import { prisma } from '../config/database'
import { redis } from '../config/redis'

export const authenticate = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No valid authorization token provided'
      })
      return
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    const { user, workspace } = await authService.validateToken(token)
    
    req.user = user
    req.workspace = workspace
    
    next()
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Authentication failed', { error: error.message })
    } else {
      logger.error('Authentication failed', { error })
    }
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    })
  }
}

export const requireRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user || !req.workspace) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
      return
    }

    // Get user's role in current workspace
    const userWorkspace = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: req.workspace.id,
          userId: req.user.id
        }
      }
    })

    if (!userWorkspace || !roles.includes(userWorkspace.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
      return
    }

    next()
  }
}

// Rate limiting middleware for auth endpoints
export const authRateLimit = (windowMs: number, maxAttempts: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `auth_rate_limit:${req.ip}`
    
    try {
      const current = await redis.get(key)
      const attempts = current ? parseInt(current) : 0
      
      if (attempts >= maxAttempts) {
        res.status(429).json({
          success: false,
          error: 'Too many authentication attempts. Please try again later.'
        })
        return
      }
      
      // Increment counter
      await redis.multi()
        .incr(key)
        .expire(key, Math.ceil(windowMs / 1000))
        .exec()
      
      next()
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Rate limiting error', { error: error.message })
      } else {
        logger.error('Rate limiting error', { error })
      }
      next() // Don't block on rate limiting errors
    }
  }
}