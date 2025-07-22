// Workflow types matching backend
export interface WorkflowNode {
    id: string
    type: 'trigger' | 'action' | 'condition' | 'delay'
    name: string
    description: string
    integration?: string
    config: Record<string, any>
    position: { x: number; y: number }
  }
  
  export interface WorkflowEdge {
    id: string
    source: string
    target: string
    type?: 'default' | 'conditional'
    condition?: string
  }
  
  export interface WorkflowDefinition {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    variables: Record<string, any>
    settings: {
      timeout?: number
      retryCount?: number
      errorHandling?: 'stop' | 'continue' | 'retry'
    }
  }
  
  export interface Workflow {
    id: string
    name: string
    description?: string
    definition: WorkflowDefinition
    isActive: boolean
    category?: string
    tags: string[]
    aiGenerated: boolean
    aiPrompt?: string
    aiConfidence?: number
    totalExecutions: number
    successfulExecutions: number
    averageExecutionTime?: number
    lastExecutedAt?: Date
    createdAt: Date
    updatedAt: Date
  }
  
  export interface AIGeneratedWorkflow {
    workflow: WorkflowDefinition
    metadata: {
      name: string
      description: string
      category: string
      tags: string[]
      estimatedTime: number
      complexity: 'simple' | 'medium' | 'complex'
    }
    explanation: string
    estimatedSavings: number
    confidence: number
    requiredIntegrations: string[]
  }
  
  export interface WorkflowTemplate {
    id: string
    name: string
    description: string
    category: string
    industry?: string
    definition: WorkflowDefinition
    tags: string[]
    usageCount: number
    rating?: number
    isPublic: boolean
    createdAt: Date
    updatedAt: Date
  }