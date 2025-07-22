import { z } from 'zod'

// Workflow node validation
const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['trigger', 'action', 'condition', 'delay']),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  integration: z.string().optional(),
  config: z.record(z.any()).default({}),
  position: z.object({
    x: z.number(),
    y: z.number()
  })
})

// Workflow edge validation
const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.enum(['default', 'conditional']).default('default'),
  condition: z.string().optional()
})

// Workflow definition validation
const workflowDefinitionSchema = z.object({
  nodes: z.array(workflowNodeSchema).min(1),
  edges: z.array(workflowEdgeSchema),
  variables: z.record(z.any()).default({}),
  settings: z.object({
    timeout: z.number().min(1000).max(600000).default(300000), // 5 minutes default
    retryCount: z.number().min(0).max(5).default(3),
    errorHandling: z.enum(['stop', 'continue', 'retry']).default('stop')
  }).default({})
})

export const workflowSchemas = {
  // AI workflow generation
  generateWorkflow: z.object({
    prompt: z.string().min(10).max(1000),
    industry: z.string().max(50).optional(),
    currentTools: z.array(z.string()).max(20).optional(),
    complexity: z.enum(['simple', 'medium', 'complex']).optional()
  }),

  // Workflow explanation
  explainWorkflow: z.object({
    workflow: workflowDefinitionSchema,
    language: z.enum(['es', 'en']).default('es')
  }),

  // Workflow optimization
  optimizeWorkflow: z.object({
    workflow: workflowDefinitionSchema,
    optimizationType: z.enum(['speed', 'cost', 'reliability'])
  }),

  // Workflow variations
  generateVariations: z.object({
    baseWorkflow: z.object({
      workflow: workflowDefinitionSchema,
      metadata: z.object({
        name: z.string(),
        description: z.string(),
        category: z.string(),
        tags: z.array(z.string()),
        estimatedTime: z.number(),
        complexity: z.enum(['simple', 'medium', 'complex'])
      }),
      explanation: z.string(),
      estimatedSavings: z.number(),
      confidence: z.number().min(0).max(1),
      requiredIntegrations: z.array(z.string())
    }),
    count: z.number().min(1).max(5).default(3)
  }),

  // Create workflow
  createWorkflow: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    definition: workflowDefinitionSchema,
    category: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    aiGenerated: z.boolean().default(false),
    aiPrompt: z.string().max(1000).optional(),
    aiConfidence: z.number().min(0).max(1).optional(),
    aiModel: z.string().max(50).optional()
  }),

  // Update workflow
  updateWorkflow: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    definition: workflowDefinitionSchema.optional(),
    category: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    isActive: z.boolean().optional()
  }),

  // Duplicate workflow
  duplicateWorkflow: z.object({
    name: z.string().min(1).max(100).optional()
  }),

  // Query parameters for listing workflows
  listWorkflows: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    category: z.string().max(50).optional(),
    search: z.string().max(100).optional(),
    isActive: z.enum(['true', 'false']).optional()
  })
}

// Export individual schemas for specific validation needs
export {
  workflowNodeSchema,
  workflowEdgeSchema,
  workflowDefinitionSchema
}