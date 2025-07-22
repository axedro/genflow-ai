import { Response } from 'express'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { AuthRequest, APIResponse } from '../types'

export class WorkspaceController {
  async getWorkspace(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Workspace access required'
        } as APIResponse)
        return
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace.id },
        include: {
          users: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  lastLoginAt: true
                }
              }
            }
          },
          _count: {
            select: {
              workflows: true,
              executions: true,
              integrations: true
            }
          }
        }
      })

      res.status(200).json({
        success: true,
        data: workspace,
        message: 'Workspace retrieved successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Get workspace controller error', { error: error.message })
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve workspace'
        } as APIResponse)
      } else {
        logger.error('Get workspace controller error', { error })
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve workspace'
        } as APIResponse)
      }
    }
  }

  async updateWorkspace(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Workspace access required'
        } as APIResponse)
        return
      }

      const { name, description, industry, companySize, settings } = req.body

      const updatedWorkspace = await prisma.workspace.update({
        where: { id: req.workspace.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(industry && { industry }),
          ...(companySize && { companySize }),
          ...(settings && { settings })
        }
      })

      res.status(200).json({
        success: true,
        data: updatedWorkspace,
        message: 'Workspace updated successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Update workspace controller error', { error: error.message })
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to update workspace'
        } as APIResponse)
      } else {
        logger.error('Update workspace controller error', { error })
        res.status(400).json({
          success: false,
          error: 'Failed to update workspace'
        } as APIResponse)
      }
    }
  }

  async getWorkspaceStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Workspace access required'
        } as APIResponse)
        return
      }

      const stats = await prisma.workspace.findUnique({
        where: { id: req.workspace.id },
        select: {
          aiUsage: true,
          aiLimit: true,
          plan: true,
          _count: {
            select: {
              workflows: true,
              executions: true,
              integrations: true,
              users: true
            }
          }
        }
      })

      // Get recent activity
      const recentExecutions = await prisma.execution.findMany({
        where: {
          workspaceId: req.workspace.id,
          startedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          status: true,
          duration: true,
          startedAt: true
        },
        orderBy: { startedAt: 'desc' },
        take: 100
      })

      // Calculate stats
      const totalExecutions = recentExecutions.length
      const successfulExecutions = recentExecutions.filter(e => e.status === 'COMPLETED').length
      const failedExecutions = recentExecutions.filter(e => e.status === 'FAILED').length
      const avgDuration = recentExecutions
        .filter(e => e.duration)
        .reduce((sum, e) => sum + (e.duration || 0), 0) / Math.max(1, recentExecutions.filter(e => e.duration).length)

      const dashboardStats = {
        ...stats,
        recentActivity: {
          totalExecutions,
          successfulExecutions,
          failedExecutions,
          successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
          avgDuration: Math.round(avgDuration || 0)
        }
      }

      res.status(200).json({
        success: true,
        data: dashboardStats,
        message: 'Workspace stats retrieved successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Get workspace stats controller error', { error: error.message })
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve workspace stats'
        } as APIResponse)
      } else {
        logger.error('Get workspace stats controller error', { error })
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve workspace stats'
        } as APIResponse)
      }
    }
  }

  async inviteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.workspace || !req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { email, role = 'USER' } = req.body

      // Check if user exists
      let invitedUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      })

      // If user doesn't exist, create a placeholder
      if (!invitedUser) {
        invitedUser = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            firstName: '',
            lastName: '',
            emailVerified: null // Will be verified when they complete registration
          }
        })
      }

      // Check if user is already in workspace
      const existingMembership = await prisma.workspaceUser.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: req.workspace.id,
            userId: invitedUser.id
          }
        }
      })

      if (existingMembership) {
        res.status(400).json({
          success: false,
          error: 'User is already a member of this workspace'
        } as APIResponse)
        return
      }

      // Create workspace membership
      const membership = await prisma.workspaceUser.create({
        data: {
          workspaceId: req.workspace.id,
          userId: invitedUser.id,
          role,
          invitedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        }
      })

      // TODO: Send invitation email in production

      res.status(201).json({
        success: true,
        data: membership,
        message: 'User invited successfully'
      } as APIResponse)
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Invite user controller error', { error: error.message })
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to invite user'
        } as APIResponse)
      } else {
        logger.error('Invite user controller error', { error })
        res.status(400).json({
          success: false,
          error: 'Failed to invite user'
        } as APIResponse)
      }
    }
  }
}

export const workspaceController = new WorkspaceController()