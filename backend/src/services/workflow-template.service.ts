import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { WorkflowDefinition } from '../types/workflow'

export class WorkflowTemplateService {
  async getTemplates(
    category?: string,
    industry?: string,
    limit: number = 50
  ) {
    try {
      const where = {
        isPublic: true,
        ...(category && { category }),
        ...(industry && { industry })
      }

      const templates = await prisma.workflowTemplate.findMany({
        where,
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      })

      return templates
    } catch (error) {
      logger.error('Failed to get workflow templates', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async createTemplate(
    name: string,
    description: string,
    category: string,
    definition: WorkflowDefinition,
    industry?: string,
    tags: string[] = [],
    createdBy?: string
  ) {
    try {
      const template = await prisma.workflowTemplate.create({
        data: {
          name,
          description,
          category,
          definition: JSON.parse(JSON.stringify(definition)),
          industry,
          tags,
          createdBy
        }
      })

      logger.info('Workflow template created', { templateId: template.id, name })
      return template
    } catch (error) {
      logger.error('Failed to create workflow template', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async installTemplate(templateId: string, workspaceId: string, customName?: string) {
    try {
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId }
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Create workflow from template
      const workflow = await prisma.workflow.create({
        data: {
          workspaceId,
          name: customName || template.name,
          description: template.description,
          definition: JSON.parse(JSON.stringify(template.definition)),
          category: template.category,
          tags: template.tags,
          isActive: false, // Start inactive
          templateCategory: template.category,
          industry: template.industry
        }
      })

      // Increment usage count
      await prisma.workflowTemplate.update({
        where: { id: templateId },
        data: { usageCount: { increment: 1 } }
      })

      logger.info('Template installed as workflow', { 
        templateId, 
        workflowId: workflow.id,
        workspaceId 
      })

      return workflow
    } catch (error) {
      logger.error('Failed to install template', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async rateTemplate(templateId: string, rating: number) {
    try {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5')
      }

      // Get current template data
      const template = await prisma.workflowTemplate.findUnique({
        where: { id: templateId }
      })

      if (!template) {
        throw new Error('Template not found')
      }

      // Simple rating calculation (in production, you'd want more sophisticated rating system)
      const currentRating = template.rating || 0
      const newRating = currentRating > 0 ? (currentRating + rating) / 2 : rating

      await prisma.workflowTemplate.update({
        where: { id: templateId },
        data: { rating: newRating }
      })

      return newRating
    } catch (error) {
      logger.error('Failed to rate template', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async getPopularTemplates(limit: number = 10) {
    return this.getTemplates(undefined, undefined, limit)
  }

  async getTemplatesByCategory(category: string, limit: number = 20) {
    return this.getTemplates(category, undefined, limit)
  }

  async searchTemplates(query: string, limit: number = 20) {
    try {
      const templates = await prisma.workflowTemplate.findMany({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { has: query } }
          ]
        },
        orderBy: [
          { usageCount: 'desc' },
          { rating: 'desc' }
        ],
        take: limit
      })

      return templates
    } catch (error) {
      logger.error('Failed to search templates', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }
}
  
  export const workflowTemplateService = new WorkflowTemplateService()