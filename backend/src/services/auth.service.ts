import bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { prisma } from '../config/database'
import { redis } from '../config/redis'
import { env } from '../config/environment'
import { logger } from '../utils/logger'
import { User, Workspace } from '@prisma/client'
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  JWTPayload 
} from '../types'

export class AuthService {
  private readonly JWT_SECRET = env.JWT_SECRET
  private readonly JWT_EXPIRES_IN = env.JWT_EXPIRES_IN
  private readonly BCRYPT_ROUNDS = env.BCRYPT_ROUNDS

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      })

      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, this.BCRYPT_ROUNDS)

      // Create user and workspace in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email.toLowerCase(),
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            emailVerified: new Date() // Auto-verify for MVP
          }
        })

        // Create default workspace
        const workspace = await tx.workspace.create({
          data: {
            name: data.companyName || `${data.firstName}'s Workspace`,
            industry: data.industry,
            companySize: 'small', // Default for MVP
            users: {
              create: {
                userId: user.id,
                role: 'OWNER',
                joinedAt: new Date()
              }
            }
          }
        })

        return { user, workspace }
      })

      // Generate JWT token
      const token = this.generateToken({
        userId: result.user.id,
        workspaceId: result.workspace.id,
        role: 'OWNER'
      })

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      await prisma.session.create({
        data: {
          token,
          userId: result.user.id,
          expiresAt
        }
      })

      logger.info('User registered successfully', { 
        userId: result.user.id, 
        email: data.email 
      })

      return {
        user: this.sanitizeUser(result.user),
        token,
        workspace: result.workspace,
        expiresAt
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Registration failed', { error: error.message, email: data.email })
      } else {
        logger.error('Registration failed', { error, email: data.email })
      }
      throw error
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user with workspace
      const user = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
        include: {
          workspaces: {
            include: {
              workspace: true
            },
            where: {
              role: { in: ['OWNER', 'ADMIN'] }
            },
            take: 1
          }
        }
      })

      if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password')
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.passwordHash)
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Get primary workspace
      const workspace = user.workspaces[0]?.workspace
      if (!workspace) {
        throw new Error('No workspace found for user')
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        workspaceId: workspace.id,
        role: user.workspaces[0].role
      })

      // Create session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await prisma.session.create({
        data: {
          token,
          userId: user.id,
          expiresAt
        }
      })

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      logger.info('User logged in successfully', { 
        userId: user.id, 
        email: data.email 
      })

      return {
        user: this.sanitizeUser(user),
        token,
        workspace,
        expiresAt
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Login failed', { error: error.message, email: data.email })
      } else {
        logger.error('Login failed', { error, email: data.email })
      }
      throw error
    }
  }

  async logout(token: string): Promise<void> {
    try {
      // Remove session from database
      await prisma.session.delete({
        where: { token }
      })

      // Add token to blacklist in Redis (expires when JWT would expire)
      const decoded = jwt.decode(token) as JWTPayload
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000)
        if (ttl > 0) {
          await redis.setex(`blacklist:${token}`, ttl, '1')
        }
      }

      logger.info('User logged out successfully')
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Logout failed', { error: error.message })
      } else {
        logger.error('Logout failed', { error })
      }
      throw error
    }
  }

  async validateToken(token: string): Promise<{ user: User; workspace: Workspace }> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await redis.get(`blacklist:${token}`)
      if (isBlacklisted) {
        throw new Error('Token has been revoked')
      }

      // Verify JWT
      const payload = jwt.verify(token, this.JWT_SECRET) as JWTPayload

      // Check if session exists
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              workspaces: {
                include: {
                  workspace: true
                }
              }
            }
          }
        }
      })

      if (!session || session.expiresAt < new Date()) {
        throw new Error('Session expired or invalid')
      }

      const workspace = session.user.workspaces.find(
        w => w.workspaceId === payload.workspaceId
      )?.workspace

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      return {
        user: session.user,
        workspace
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Token validation failed', { error: error.message })
      } else {
        logger.error('Token validation failed', { error })
      }
      throw error
    }
  }

  async refreshToken(oldToken: string): Promise<AuthResponse> {
    try {
      const { user, workspace } = await this.validateToken(oldToken)

      const userWithWorkspaces = await prisma.user.findUnique({
        where: { id: user.id },
        include: { workspaces: true }
      });
      if (!userWithWorkspaces) throw new Error('User not found');

      const userWorkspace = userWithWorkspaces.workspaces.find(w => w.workspaceId === workspace.id);

      // Generate new token
      const newToken = this.generateToken({
        userId: user.id,
        workspaceId: workspace.id,
        role: userWorkspace?.role || 'USER'
      })

      // Create new session
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await prisma.session.create({
        data: {
          token: newToken,
          userId: user.id,
          expiresAt
        }
      })

      // Remove old session
      await this.logout(oldToken)

      return {
        user: this.sanitizeUser(user),
        token: newToken,
        workspace,
        expiresAt
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Token refresh failed', { error: error.message })
      } else {
        logger.error('Token refresh failed', { error })
      }
      throw error
    }
  }

  private generateToken(payload: Omit<JWTPayload, 'exp' | 'iat' | 'sessionId'>): string {
    // Include current timestamp and random value to ensure token uniqueness
    const tokenPayload = {
      ...payload,
      sessionId: `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    }
    
    return jwt.sign(tokenPayload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    } as jwt.SignOptions)
  }

  private sanitizeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash, ...sanitizedUser } = user
    return sanitizedUser
  }

  // Generate secure password reset token
  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    )

    // Store in Redis with 1 hour expiration
    await redis.setex(`password_reset:${user.id}`, 3600, resetToken)

    return resetToken
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as any

      if (payload.type !== 'password_reset') {
        throw new Error('Invalid reset token')
      }

      // Check if token exists in Redis
      const storedToken = await redis.get(`password_reset:${payload.userId}`)
      if (storedToken !== token) {
        throw new Error('Reset token expired or invalid')
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS)

      // Update password
      await prisma.user.update({
        where: { id: payload.userId },
        data: { passwordHash }
      })

      // Remove reset token
      await redis.del(`password_reset:${payload.userId}`)

      // Invalidate all existing sessions
      await prisma.session.deleteMany({
        where: { userId: payload.userId }
      })

      logger.info('Password reset successfully', { userId: payload.userId })
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Password reset failed', { error: error.message })
      } else {
        logger.error('Password reset failed', { error })
      }
      throw error
    }
  }
}

export const authService = new AuthService()