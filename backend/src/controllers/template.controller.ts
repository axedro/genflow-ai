import { Response } from 'express'
import { workflowTemplateService } from '../services/workflow-template.service'
import { logger } from '../utils/logger'
import { AuthRequest, APIResponse } from '../types'

export class TemplateController {
  async getTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const category = req.query.category as string
      const industry = req.query.industry as string
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)

      const templates = await workflowTemplateService.getTemplates(category, industry, limit)

      res.status(200).json({
        success: true,
        data: templates,
        message: 'Templates retrieved successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Get templates controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve templates'
      } as APIResponse)
    }
  }

  async getPopularTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 20)
      const templates = await workflowTemplateService.getPopularTemplates(limit)

      res.status(200).json({
        success: true,
        data: templates,
        message: 'Popular templates retrieved successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Get popular templates controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve popular templates'
      } as APIResponse)
    }
  }

  async searchTemplates(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query.q as string
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

      if (!query || query.length < 2) {
        res.status(400).json({
          success: false,
          error: 'Search query must be at least 2 characters long'
        } as APIResponse)
        return
      }

      const templates = await workflowTemplateService.searchTemplates(query, limit)

      res.status(200).json({
        success: true,
        data: templates,
        message: 'Template search completed successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Search templates controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to search templates'
      } as APIResponse)
    }
  }

  async installTemplate(req: AuthRequest, res: Response): Promise<void> {
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

      const workflow = await workflowTemplateService.installTemplate(
        id, 
        req.workspace.id, 
        name
      )

      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Template installed successfully as workflow'
      } as APIResponse)

    } catch (error) {
      logger.error('Install template controller error', { error: error instanceof Error ? error.message : String(error) })
      
      if (error instanceof Error && error.message === 'Template not found') {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        } as APIResponse)
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to install template'
        } as APIResponse)
      }
    }
  }

  async rateTemplate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const { rating } = req.body

      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        } as APIResponse)
        return
      }

      const newRating = await workflowTemplateService.rateTemplate(id, rating)

      res.status(200).json({
        success: true,
        data: { rating: newRating },
        message: 'Template rated successfully'
      } as APIResponse)

    } catch (error) {
      logger.error('Rate template controller error', { error: error instanceof Error ? error.message : String(error) })
      
      if (error instanceof Error && error.message === 'Template not found') {
        res.status(404).json({
          success: false,
          error: 'Template not found'
        } as APIResponse)
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to rate template'
        } as APIResponse)
      }
    }
  }

  async getTemplatesByCategory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { category } = req.params
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

      const templates = await workflowTemplateService.getTemplatesByCategory(category, limit)

      res.status(200).json({
        success: true,
        data: templates,
        message: `Templates for category '${category}' retrieved successfully`
      } as APIResponse)

    } catch (error) {
      logger.error('Get templates by category controller error', { error: error instanceof Error ? error.message : String(error) })
      
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve templates by category'
      } as APIResponse)
    }
  }
}

export const templateController = new TemplateController()