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
  
  export interface AIWorkflowPrompt {
    userPrompt: string
    context: BusinessContext
    industry?: string
    currentTools?: string[]
    complexity?: 'simple' | 'medium' | 'complex'
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

export interface BusinessContext {
  industry: string
  companySize: string
  currentTools: string[]
  language: string
}
  
export interface WorkflowExecutionContext {
    workflowId: string
    triggeredBy: 'manual' | 'schedule' | 'webhook' | 'api'
    variables: Record<string, any>
    metadata: Record<string, any>
  }