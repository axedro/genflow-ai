import { Request, Response } from 'express'
import { authService } from '../services/auth.service'
import { logger } from '../utils/logger'
import { AuthRequest, APIResponse, AuthResponse } from '../types'

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body)
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully'
      } as APIResponse<AuthResponse>)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Registration controller error', { error: error.message })
        res.status(400).json({
          success: false,
          error: error.message || 'Registration failed'
        } as APIResponse)
      } else {
        logger.error('Registration controller error', { error })
        res.status(400).json({
          success: false,
          error: 'Registration failed'
        } as APIResponse)
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      } as APIResponse<AuthResponse>)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Login controller error', { error: error.message })
        res.status(401).json({
          success: false,
          error: error.message || 'Login failed'
        } as APIResponse)
      } else {
        logger.error('Login controller error', { error })
        res.status(401).json({
          success: false,
          error: 'Login failed'
        } as APIResponse)
      }
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.substring(7)
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No token provided'
        } as APIResponse)
        return
      }

      await authService.logout(token)
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Logout controller error', { error: error.message })
        res.status(400).json({
          success: false,
          error: error.message || 'Logout failed'
        } as APIResponse)
      } else {
        logger.error('Logout controller error', { error })
        res.status(400).json({
          success: false,
          error: 'Logout failed'
        } as APIResponse)
      }
    }
  }

  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.substring(7)
      
      if (!token) {
        res.status(400).json({
          success: false,
          error: 'No token provided'
        } as APIResponse)
        return
      }

      const result = await authService.refreshToken(token)
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      } as APIResponse<AuthResponse>)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Token refresh controller error', { error: error.message })
        res.status(401).json({
          success: false,
          error: error.message || 'Token refresh failed'
        } as APIResponse)
      } else {
        logger.error('Token refresh controller error', { error })
        res.status(401).json({
          success: false,
          error: 'Token refresh failed'
        } as APIResponse)
      }
    }
  }

  async me(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
          workspace: req.workspace
        },
        message: 'User data retrieved successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Get user data controller error', { error: error.message })
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user data'
        } as APIResponse)
      } else {
        logger.error('Get user data controller error', { error })
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve user data'
        } as APIResponse)
      }
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body
      const resetToken = await authService.generatePasswordResetToken(email)
      
      // In production, send email with reset link
      // For MVP, we'll return the token directly (remove in production)
      logger.info('Password reset token generated', { email, resetToken })
      
      res.status(200).json({
        success: true,
        message: 'Password reset instructions sent to your email',
        data: { resetToken } // Remove this in production
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Forgot password controller error', { error: error.message })
      } else {
        logger.error('Forgot password controller error', { error })
      }
      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent'
      } as APIResponse)
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement password reset logic
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Reset password controller error', { error: error.message })
      } else {
        logger.error('Reset password controller error', { error })
      }
      res.status(400).json({
        success: false,
        error: 'Password reset failed'
      } as APIResponse)
    }
  }
}

export const authController = new AuthController();