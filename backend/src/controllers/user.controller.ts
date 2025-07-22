import { Response } from 'express'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { AuthRequest, APIResponse } from '../types'
import bcrypt from 'bcrypt'
import { env } from '../config/environment'

export class UserController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
          twoFactorEnabled: true,
          language: true,
          timezone: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Get profile controller error', { error: error.message })
      } else {
        logger.error('Get profile controller error', { error })
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve profile'
      } as APIResponse)
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { firstName, lastName, avatar, language, timezone } = req.body

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(avatar && { avatar }),
          ...(language && { language }),
          ...(timezone && { timezone })
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
          twoFactorEnabled: true,
          language: true,
          timezone: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Update profile controller error', { error: error.message })
      } else {
        logger.error('Update profile controller error', { error })
      }
      
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile'
      } as APIResponse)
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { currentPassword, newPassword } = req.body

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
      })

      if (!user || !user.passwordHash) {
        res.status(400).json({
          success: false,
          error: 'User not found or invalid account'
        } as APIResponse)
        return
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        } as APIResponse)
        return
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS)

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash }
      })

      // Invalidate all existing sessions except current one
      const currentToken = req.headers.authorization?.substring(7)
      await prisma.session.deleteMany({
        where: {
          userId: req.user.id,
          token: { not: currentToken }
        }
      })

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Change password controller error', { error: error.message })
      } else {
        logger.error('Change password controller error', { error })
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      } as APIResponse)
    }
  }

  async deleteAccount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { password } = req.body

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { passwordHash: true }
      })

      if (!user || !user.passwordHash) {
        res.status(400).json({
          success: false,
          error: 'User not found or invalid account'
        } as APIResponse)
        return
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          error: 'Password is incorrect'
        } as APIResponse)
        return
      }

      // Delete user (cascade will handle related data)
      await prisma.user.delete({
        where: { id: req.user.id }
      })

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Delete account controller error', { error: error.message })
      } else {
        logger.error('Delete account controller error', { error })
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      } as APIResponse)
    }
  }
}

export const userController = new UserController()