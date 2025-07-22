import { apiService } from './api'
import type { 
  Workflow, 
  WorkflowDefinition, 
  AIGeneratedWorkflow,
  WorkflowTemplate 
} from './workflow.types'

class WorkflowService {
  // AI Workflow Generation
  async generateWorkflow(data: {
    prompt: string
    industry?: string
    currentTools?: string[]
    complexity?: 'simple' | 'medium' | 'complex'
  }): Promise<AIGeneratedWorkflow> {
    const response = await apiService.post<AIGeneratedWorkflow>('/ai/workflows/generate', data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to generate workflow')
  }

  async explainWorkflow(workflow: WorkflowDefinition, language: 'es' | 'en' = 'es'): Promise<string> {
    const response = await apiService.post<{ explanation: string }>('/ai/workflows/explain', {
      workflow,
      language
    })
    
    if (response.success && response.data) {
      return response.data.explanation
    }
    
    throw new Error(response.error || 'Failed to explain workflow')
  }

  async optimizeWorkflow(
    workflow: WorkflowDefinition, 
    optimizationType: 'speed' | 'cost' | 'reliability'
  ): Promise<AIGeneratedWorkflow> {
    const response = await apiService.post<AIGeneratedWorkflow>('/ai/workflows/optimize', {
      workflow,
      optimizationType
    })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to optimize workflow')
  }

  async generateVariations(baseWorkflow: AIGeneratedWorkflow, count: number = 3): Promise<AIGeneratedWorkflow[]> {
    const response = await apiService.post<AIGeneratedWorkflow[]>('/ai/workflows/variations', {
      baseWorkflow,
      count
    })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to generate variations')
  }

  async getAIUsage(): Promise<{
    currentUsage: number
    limit: number
    plan: string
    remaining: number
    percentageUsed: number
    recentInteractions: any[]
  }> {
    const response = await apiService.get<{
      currentUsage: number
      limit: number
      plan: string
      remaining: number
      percentageUsed: number
      recentInteractions: any[]
    }>('/ai/workflows/usage')
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get AI usage')
  }

  // Workflow CRUD
  async createWorkflow(data: {
    name: string
    description?: string
    definition: WorkflowDefinition
    category?: string
    tags?: string[]
    aiGenerated?: boolean
    aiPrompt?: string
    aiConfidence?: number
    aiModel?: string
  }): Promise<Workflow> {
    const response = await apiService.post<Workflow>('/workflows', data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to create workflow')
  }

  async getWorkflows(params?: {
    page?: number
    limit?: number
    category?: string
    search?: string
    isActive?: boolean
  }): Promise<{
    data: Workflow[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.category) queryParams.append('category', params.category)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString())

    const response = await apiService.get<Workflow[]>(`/workflows?${queryParams.toString()}`)
    
    if (response.success && response.data) {
      return {
        data: response.data,
        pagination: response.pagination || {
          page: 1,
          limit: 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
          totalPages: 1
        }
      }
    }
    
    throw new Error(response.error || 'Failed to get workflows')
  }

  async getWorkflow(id: string): Promise<Workflow> {
    const response = await apiService.get<Workflow>(`/workflows/${id}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get workflow')
  }

  async updateWorkflow(id: string, data: Partial<{
    name: string
    description: string
    definition: WorkflowDefinition
    category: string
    tags: string[]
    isActive: boolean
  }>): Promise<Workflow> {
    const response = await apiService.put<Workflow>(`/workflows/${id}`, data)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to update workflow')
  }

  async deleteWorkflow(id: string): Promise<void> {
    const response = await apiService.delete(`/workflows/${id}`)
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete workflow')
    }
  }

  async duplicateWorkflow(id: string, name?: string): Promise<Workflow> {
    const response = await apiService.post<Workflow>(`/workflows/${id}/duplicate`, { name })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to duplicate workflow')
  }

  async getWorkflowStats(): Promise<{
    total: number
    active: number
    aiGenerated: number
    totalExecutions: number
    successfulExecutions: number
    successRate: number
    averageExecutionTime: number
    averageAIConfidence: number
    byCategory: Record<string, number>
  }> {
    const response = await apiService.get<{
      total: number
      active: number
      aiGenerated: number
      totalExecutions: number
      successfulExecutions: number
      successRate: number
      averageExecutionTime: number
      averageAIConfidence: number
      byCategory: Record<string, number>
    }>('/workflows/stats')
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get workflow stats')
  }

  // Templates
  async getTemplates(params?: {
    category?: string
    industry?: string
    limit?: number
  }): Promise<WorkflowTemplate[]> {
    const queryParams = new URLSearchParams()
    if (params?.category) queryParams.append('category', params.category)
    if (params?.industry) queryParams.append('industry', params.industry)
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await apiService.get<WorkflowTemplate[]>(`/templates?${queryParams.toString()}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get templates')
  }

  async getPopularTemplates(limit: number = 10): Promise<WorkflowTemplate[]> {
    const response = await apiService.get<WorkflowTemplate[]>(`/templates/popular?limit=${limit}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get popular templates')
  }

  async searchTemplates(query: string, limit: number = 20): Promise<WorkflowTemplate[]> {
    const response = await apiService.get<WorkflowTemplate[]>(`/templates/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to search templates')
  }

  async installTemplate(templateId: string, name?: string): Promise<Workflow> {
    const response = await apiService.post<Workflow>(`/templates/${templateId}/install`, { name })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to install template')
  }

  async rateTemplate(templateId: string, rating: number): Promise<{ rating: number }> {
    const response = await apiService.post<{ rating: number }>(`/templates/${templateId}/rate`, { rating })
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to rate template')
  }
}

export const workflowService = new WorkflowService()