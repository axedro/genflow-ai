import { Response } from 'express'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { AuthRequest, APIResponse, PaginatedResponse } from '../types'
import { WorkflowDefinition } from '../types/workflow'

export class WorkflowController {
  async createWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const {
        name,
        description,
        definition,
        category,
        tags,
        aiGenerated = false,
        aiPrompt,
        aiConfidence,
        aiModel
      } = req.body

      // Validate workflow definition
      if (!definition || !definition.nodes || !Array.isArray(definition.nodes)) {
        res.status(400).json({
          success: false,
          error: 'Invalid workflow definition'
        } as APIResponse)
        return
      }

      const workflow = await prisma.workflow.create({
        data: {
          workspaceId: req.workspace.id,
          name,
          description,
          definition: definition as any,
          category,
          tags: tags || [],
          aiGenerated,
          aiPrompt,
          aiConfidence,
          aiModel
        }
      })

      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Create workflow controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create workflow'
      } as APIResponse)
    }
  }

  async getWorkflows(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const page = parseInt(req.query.page as string) || 1
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100)
      const category = req.query.category as string
      const search = req.query.search as string
      const isActive = req.query.isActive === 'true' ? true : 
                      req.query.isActive === 'false' ? false : undefined

      const skip = (page - 1) * limit

      const where = {
        workspaceId: req.workspace.id,
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        })
      }

      const [workflows, total] = await Promise.all([
        prisma.workflow.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            tags: true,
            isActive: true,
            aiGenerated: true,
            aiConfidence: true,
            totalExecutions: true,
            successfulExecutions: true,
            averageExecutionTime: true,
            lastExecutedAt: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.workflow.count({ where })
      ])

      const totalPages = Math.ceil(total / limit)

      res.status(200).json({
        success: true,
        data: workflows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        message: 'Workflows retrieved successfully'
      } as PaginatedResponse<typeof workflows[0]>)

    } catch (error) {
      logger.error('Get workflows controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflows'
      } as APIResponse)
    }
  }

  async getWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { id } = req.params

      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          workspaceId: req.workspace.id
        },
        include: {
          _count: {
            select: {
              executions: true
            }
          }
        }
      })

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        } as APIResponse)
        return
      }

      res.status(200).json({
        success: true,
        data: workflow,
        message: 'Workflow retrieved successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Get workflow controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflow'
      } as APIResponse)
    }
  }

  async updateWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { id } = req.params
      const {
        name,
        description,
        definition,
        category,
        tags,
        isActive
      } = req.body

      // Verify workflow belongs to workspace
      const existingWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          workspaceId: req.workspace.id
        }
      })

      if (!existingWorkflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        } as APIResponse)
        return
      }

      const updatedWorkflow = await prisma.workflow.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(definition && { definition: definition as any, version: { increment: 1 } }),
          ...(category && { category }),
          ...(tags && { tags }),
          ...(isActive !== undefined && { isActive })
        }
      })

      res.status(200).json({
        success: true,
        data: updatedWorkflow,
        message: 'Workflow updated successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Update workflow controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update workflow'
      } as APIResponse)
    }
  }

  async deleteWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { id } = req.params

      // Verify workflow belongs to workspace
      const workflow = await prisma.workflow.findFirst({
        where: {
          id,
          workspaceId: req.workspace.id
        }
      })

      if (!workflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        } as APIResponse)
        return
      }

      await prisma.workflow.delete({
        where: { id }
      })

      res.status(200).json({
        success: true,
        message: 'Workflow deleted successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Delete workflow controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete workflow'
      } as APIResponse)
    }
  }

  async duplicateWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { id } = req.params
      const { name } = req.body

      const originalWorkflow = await prisma.workflow.findFirst({
        where: {
          id,
          workspaceId: req.workspace.id
        }
      })

      if (!originalWorkflow) {
        res.status(404).json({
          success: false,
          error: 'Workflow not found'
        } as APIResponse)
        return
      }

      const duplicatedWorkflow = await prisma.workflow.create({
        data: {
          workspaceId: req.workspace.id,
          name: name || `${originalWorkflow.name} (Copy)`,
          description: originalWorkflow.description,
          definition: originalWorkflow.definition as any,
          category: originalWorkflow.category,
          tags: originalWorkflow.tags,
          isActive: false, // Start inactive
          aiGenerated: originalWorkflow.aiGenerated,
          aiPrompt: originalWorkflow.aiPrompt,
          aiConfidence: originalWorkflow.aiConfidence,
          aiModel: originalWorkflow.aiModel
        }
      })

      res.status(201).json({
        success: true,
        data: duplicatedWorkflow,
        message: 'Workflow duplicated successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Duplicate workflow controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to duplicate workflow'
      } as APIResponse)
    }
  }

  async getWorkflowStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const stats = await prisma.workflow.aggregate({
        where: { workspaceId: req.workspace.id },
        _count: {
          id: true
        },
        _sum: {
          totalExecutions: true,
          successfulExecutions: true
        },
        _avg: {
          averageExecutionTime: true,
          aiConfidence: true
        }
      })

      const categoryStats = await prisma.workflow.groupBy({
        by: ['category'],
        where: { workspaceId: req.workspace.id },
        _count: {
          id: true
        }
      })

      const activeWorkflows = await prisma.workflow.count({
        where: {
          workspaceId: req.workspace.id,
          isActive: true
        }
      })

      const aiGeneratedCount = await prisma.workflow.count({
        where: {
          workspaceId: req.workspace.id,
          aiGenerated: true
        }
      })

      const workflowStats = {
        total: stats._count.id || 0,
        active: activeWorkflows,
        aiGenerated: aiGeneratedCount,
        totalExecutions: stats._sum.totalExecutions || 0,
        successfulExecutions: stats._sum.successfulExecutions || 0,
        successRate: stats._sum.totalExecutions ? 
          ((stats._sum.successfulExecutions || 0) / stats._sum.totalExecutions) * 100 : 0,
        averageExecutionTime: stats._avg.averageExecutionTime || 0,
        averageAIConfidence: stats._avg.aiConfidence || 0,
        byCategory: categoryStats.reduce((acc, cat) => {
          acc[cat.category || 'uncategorized'] = cat._count.id
          return acc
        }, {} as Record<string, number>)
      }

      res.status(200).json({
        success: true,
        data: workflowStats,
        message: 'Workflow statistics retrieved successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Get workflow stats controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve workflow statistics'
      } as APIResponse)
    }
  }
}

export const workflowController = new WorkflowController()