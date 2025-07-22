import { Response } from 'express'
import { aiWorkflowService } from '../services/ai-workflow.service'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { AuthRequest, APIResponse } from '../types'
import { AIWorkflowPrompt, AIGeneratedWorkflow } from '../types/workflow'

export class AIWorkflowController {
  async generateWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      // Check AI usage limits
      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace.id },
        select: { aiUsage: true, aiLimit: true, plan: true }
      })

      if (workspace && workspace.aiUsage >= workspace.aiLimit) {
        res.status(429).json({
          success: false,
          error: 'AI usage limit exceeded for this month',
          data: {
            currentUsage: workspace.aiUsage,
            limit: workspace.aiLimit,
            plan: workspace.plan
          }
        } as APIResponse)
        return
      }

      const { prompt, industry, currentTools, complexity } = req.body

      const aiRequest: AIWorkflowPrompt = {
        userPrompt: prompt,
        context: {
          industry: industry || req.workspace.industry || 'general',
          companySize: req.workspace.companySize || 'small',
          currentTools: currentTools || [],
          language: 'es'
        },
        industry,
        currentTools,
        complexity: complexity || 'medium'
      }

      const generatedWorkflow = await aiWorkflowService.generateWorkflow(aiRequest)

      // Track AI usage
      await prisma.workspace.update({
        where: { id: req.workspace.id },
        data: { aiUsage: { increment: 1 } }
      })

      // Log AI interaction
      await prisma.aIInteraction.create({
        data: {
          workspaceId: req.workspace.id,
          type: 'workflow_generation',
          prompt,
          response: generatedWorkflow as any,
          model: 'gpt-4',
          tokens: 0, // Will be updated with actual token count
          confidence: generatedWorkflow.confidence
        }
      })

      res.status(200).json({
        success: true,
        data: generatedWorkflow,
        message: 'Workflow generated successfully'
      } as APIResponse<AIGeneratedWorkflow>)

    } catch (error) {
      logger.error('AI workflow generation controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate workflow'
      } as APIResponse)
    }
  }

  async explainWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { workflow, language = 'es' } = req.body

      const explanation = await aiWorkflowService.explainWorkflow(workflow, language)

      res.status(200).json({
        success: true,
        data: { explanation },
        message: 'Workflow explanation generated'
      } as APIResponse)

    } catch (error) {
      logger.error('Workflow explanation controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to explain workflow'
      } as APIResponse)
    }
  }

  async optimizeWorkflow(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { workflow, optimizationType } = req.body

      if (!['speed', 'cost', 'reliability'].includes(optimizationType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid optimization type. Must be: speed, cost, or reliability'
        } as APIResponse)
        return
      }

      const optimizedWorkflow = await aiWorkflowService.optimizeWorkflow(workflow, optimizationType)

      // Track AI usage
      await prisma.workspace.update({
        where: { id: req.workspace.id },
        data: { aiUsage: { increment: 1 } }
      })

      res.status(200).json({
        success: true,
        data: optimizedWorkflow,
        message: `Workflow optimized for ${optimizationType}`
      } as APIResponse<AIGeneratedWorkflow>)

    } catch (error) {
      logger.error('Workflow optimization controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to optimize workflow'
      } as APIResponse)
    }
  }

  async generateVariations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const { baseWorkflow, count = 3 } = req.body

      if (count > 5) {
        res.status(400).json({
          success: false,
          error: 'Maximum 5 variations allowed per request'
        } as APIResponse)
        return
      }

      const variations = await aiWorkflowService.generateWorkflowVariations(baseWorkflow, count)

      // Track AI usage (one usage per variation)
      await prisma.workspace.update({
        where: { id: req.workspace.id },
        data: { aiUsage: { increment: count } }
      })

      res.status(200).json({
        success: true,
        data: variations,
        message: `${variations.length} workflow variations generated`
      } as APIResponse<AIGeneratedWorkflow[]>)

    } catch (error) {
      logger.error('Workflow variations controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate workflow variations'
      } as APIResponse)
    }
  }

  async getAIUsage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.workspace) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        } as APIResponse)
        return
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: req.workspace.id },
        select: {
          aiUsage: true,
          aiLimit: true,
          plan: true
        }
      })

      const recentInteractions = await prisma.aIInteraction.findMany({
        where: {
          workspaceId: req.workspace.id,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        select: {
          type: true,
          createdAt: true,
          confidence: true,
          tokens: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      const usageStats = {
        currentUsage: workspace?.aiUsage || 0,
        limit: workspace?.aiLimit || 100,
        plan: workspace?.plan || 'freemium',
        remaining: Math.max(0, (workspace?.aiLimit || 100) - (workspace?.aiUsage || 0)),
        percentageUsed: workspace?.aiLimit ? 
          Math.round(((workspace.aiUsage || 0) / workspace.aiLimit) * 100) : 0,
        recentInteractions: recentInteractions.map(interaction => ({
          type: interaction.type,
          date: interaction.createdAt,
          confidence: interaction.confidence,
          tokens: interaction.tokens
        }))
      }

      res.status(200).json({
        success: true,
        data: usageStats,
        message: 'AI usage statistics retrieved'
      } as APIResponse)

    } catch (error) {
      logger.error('Get AI usage controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to get AI usage statistics'
      } as APIResponse)
    }
  }
}

export const aiWorkflowController = new AIWorkflowController()