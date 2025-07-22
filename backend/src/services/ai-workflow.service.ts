import OpenAI from 'openai'
import { redis } from '../config/redis'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { env } from '../config/environment'
import { 
  AIWorkflowPrompt,
  AIGeneratedWorkflow,
  WorkflowDefinition,
  WorkflowNode,
  BusinessContext
} from '../types/workflow'
import crypto from 'crypto'

export class AIWorkflowService {
  private openai: OpenAI
  private readonly CACHE_TTL = 7200 // 2 hours cache

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    })
  }

  async generateWorkflow(request: AIWorkflowPrompt): Promise<AIGeneratedWorkflow> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request)
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        logger.info('AI workflow cache hit', { cacheKey })
        return JSON.parse(cached)
      }

      // Generate workflow using GPT-4
      const systemPrompt = this.buildAdvancedSystemPrompt(request.context)
      const userPrompt = this.enhanceUserPrompt(request)

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from AI service')
      }

      const result = this.parseAndValidateWorkflow(response)
      
      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result))

      // Track AI usage
      await this.trackAIUsage(request, result, completion.usage?.total_tokens || 0)

      logger.info('AI workflow generated successfully', { 
        prompt: request.userPrompt.substring(0, 100),
        tokens: completion.usage?.total_tokens,
        confidence: result.confidence
      })

      return result
    } catch (error) {
      logger.error('AI workflow generation failed', { 
        error: error instanceof Error ? error.message : String(error),
        prompt: request.userPrompt.substring(0, 100)
      })
      throw new Error(`AI workflow generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private buildAdvancedSystemPrompt(context: BusinessContext): string {
    return `You are an expert business process automation consultant specializing in Spanish SMEs.

BUSINESS CONTEXT:
- Industry: ${context.industry}
- Company Size: ${context.companySize}
- Current Tools: ${context.currentTools.join(', ')}
- Language: ${context.language}

AVAILABLE INTEGRATIONS:
- Gmail/Outlook: Send emails, read emails, manage labels
- Google Sheets: Read/write data, create reports, data validation
- WhatsApp Business: Send messages, manage contacts, automated responses
- Google Drive: File management, sharing, organization
- Calendar: Schedule meetings, send invites, manage availability
- Stripe/PayPal: Payment processing, invoicing, subscription management

WORKFLOW STRUCTURE:
Create workflows using these node types:
1. TRIGGERS: 
   - manual: User-initiated
   - schedule: Time-based (cron expressions)
   - webhook: External API calls
   - email: Email received
   - form: Form submission

2. ACTIONS:
   - send_email: Send email via Gmail/Outlook
   - update_sheet: Update Google Sheets
   - send_whatsapp: Send WhatsApp message
   - create_file: Create/update file in Drive
   - schedule_meeting: Create calendar event
   - process_payment: Handle payment via Stripe
   - delay: Wait for specified time
   - http_request: Make API call

3. CONDITIONS:
   - if_condition: Conditional branching
   - filter: Filter data based on criteria
   - validate: Validate data format/content

RESPONSE FORMAT (JSON):
{
  "workflow": {
    "nodes": [
      {
        "id": "unique_id",
        "type": "trigger|action|condition",
        "name": "Node display name",
        "description": "What this node does",
        "integration": "gmail|sheets|whatsapp|drive|calendar|stripe",
        "config": {
          "specific_configuration_for_this_node": "value"
        },
        "position": { "x": number, "y": number }
      }
    ],
    "edges": [
      {
        "id": "edge_id",
        "source": "source_node_id",
        "target": "target_node_id",
        "type": "default|conditional",
        "condition": "optional_condition_expression"
      }
    ],
    "variables": {
      "variable_name": "default_value"
    },
    "settings": {
      "timeout": 300000,
      "retryCount": 3,
      "errorHandling": "stop|continue|retry"
    }
  },
  "metadata": {
    "name": "Clear workflow name in Spanish",
    "description": "Brief description of what this workflow accomplishes",
    "category": "administration|sales|finance|marketing|customer_service",
    "tags": ["relevant", "spanish", "tags"],
    "estimatedTime": "estimated_execution_time_in_seconds",
    "complexity": "simple|medium|complex"
  },
  "explanation": "Clear explanation in Spanish of what the workflow does, how it helps the business, and what benefits it provides",
  "estimatedSavings": "estimated_time_saved_per_week_in_minutes",
  "confidence": "confidence_score_0_to_1",
  "requiredIntegrations": ["list", "of", "required", "integrations"]
}

IMPORTANT GUIDELINES:
- Position nodes logically (trigger at top, actions flowing down)
- Use realistic Spanish business scenarios
- Include proper error handling
- Make workflows immediately actionable
- Focus on common SME pain points
- Ensure all required fields are present
- Use descriptive node names and descriptions`
  }

  private enhanceUserPrompt(request: AIWorkflowPrompt): string {
    let prompt = `Create an automation workflow for: "${request.userPrompt}"`

    if (request.industry) {
      prompt += `\n\nINDUSTRY CONTEXT: ${request.industry}`
    }

    if (request.currentTools && request.currentTools.length > 0) {
      prompt += `\n\nCURRENT TOOLS: ${request.currentTools.join(', ')}`
    }

    if (request.complexity) {
      prompt += `\n\nCOMPLEXITY LEVEL: ${request.complexity}`
    }

    prompt += `\n\nPlease create a practical, immediately implementable workflow that:
1. Solves a real business problem
2. Uses available integrations effectively
3. Provides clear time/cost savings
4. Is appropriate for Spanish SME context
5. Can be explained simply to non-technical users

Focus on creating a workflow that provides immediate value and can be set up quickly.`

    return prompt
  }

  private parseAndValidateWorkflow(response: string): AIGeneratedWorkflow {
    try {
      const parsed = JSON.parse(response)
      
      // Validate required structure
      if (!parsed.workflow || !parsed.metadata || !parsed.explanation) {
        throw new Error('Invalid AI response structure')
      }

      const { workflow, metadata, explanation, estimatedSavings, confidence, requiredIntegrations } = parsed

      // Validate workflow structure
      if (!workflow.nodes || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
        throw new Error('Invalid workflow nodes structure')
      }

      if (!workflow.edges || !Array.isArray(workflow.edges)) {
        throw new Error('Invalid workflow edges structure')
      }

      // Validate metadata
      if (!metadata.name || !metadata.description || !metadata.category) {
        throw new Error('Invalid metadata structure')
      }

      // Add default positions if missing
      workflow.nodes = workflow.nodes.map((node: WorkflowNode, index: number) => ({
        ...node,
        position: node.position || { x: 200, y: 100 + (index * 150) }
      }))

      // Ensure confidence is a valid number
      const validatedConfidence = Math.max(0, Math.min(1, parseFloat(confidence) || 0.7))

      return {
        workflow: workflow as WorkflowDefinition,
        metadata: {
          ...metadata,
          estimatedTime: parseInt(metadata.estimatedTime) || 60,
          complexity: metadata.complexity || 'medium'
        },
        explanation,
        estimatedSavings: parseInt(estimatedSavings) || 120, // Default 2 hours/week
        confidence: validatedConfidence,
        requiredIntegrations: requiredIntegrations || []
      }
    } catch (error) {
      logger.error('Failed to parse AI workflow response', { error: error instanceof Error ? error.message : String(error), response })
      throw new Error('Failed to parse AI response')
    }
  }

  async generateWorkflowVariations(baseWorkflow: AIGeneratedWorkflow, count: number = 3): Promise<AIGeneratedWorkflow[]> {
    try {
      const variations: AIGeneratedWorkflow[] = []

      for (let i = 0; i < count; i++) {
        const variationPrompt = `Create a variation of this workflow with different approach or optimization:

Original workflow: ${baseWorkflow.metadata.name}
Description: ${baseWorkflow.metadata.description}

Create a variation that:
- Uses different integrations or approaches
- Optimizes for different business priorities (speed vs accuracy vs cost)
- Targets different user personas or scenarios
- Provides alternative implementation methods

Maintain the same core business objective but explore different execution paths.`

        const variation = await this.generateWorkflow({
          userPrompt: variationPrompt,
          context: {
            industry: 'general',
            companySize: 'small',
            currentTools: baseWorkflow.requiredIntegrations,
            language: 'es'
          }
        })

        variations.push(variation)
      }

      return variations
    } catch (error) {
      logger.error('Failed to generate workflow variations', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  async explainWorkflow(workflow: WorkflowDefinition, language: 'es' | 'en' = 'es'): Promise<string> {
    try {
      const prompt = `Explain this workflow in simple, business-friendly terms for a non-technical user.

Workflow structure:
${JSON.stringify(workflow, null, 2)}

Provide explanation in ${language === 'es' ? 'Spanish' : 'English'} covering:
1. What this workflow does step by step
2. When it runs and what triggers it
3. What business problem it solves
4. Expected benefits and time savings
5. What the user needs to set up

Use simple language that a business owner can understand easily.`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800
      })

      return completion.choices[0].message.content || 'Unable to generate explanation'
    } catch (error) {
      logger.error('Workflow explanation failed', { error: error instanceof Error ? error.message : String(error) })
      return 'Unable to generate explanation at this time'
    }
  }

  async optimizeWorkflow(workflow: WorkflowDefinition, optimizationType: 'speed' | 'cost' | 'reliability'): Promise<AIGeneratedWorkflow> {
    try {
      const prompt = `Optimize this workflow for ${optimizationType}:

Current workflow:
${JSON.stringify(workflow, null, 2)}

Optimization goals for ${optimizationType}:
- Speed: Minimize execution time, parallel processing, reduce unnecessary steps
- Cost: Use cheaper integrations, batch operations, reduce API calls
- Reliability: Add error handling, validation steps, retry mechanisms

Provide an optimized version that maintains the same business outcome but improves the specified aspect.`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.buildAdvancedSystemPrompt({
            industry: 'general',
            companySize: 'small',
            currentTools: [],
            language: 'es'
          })},
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from AI service')
      }

      return this.parseAndValidateWorkflow(response)
    } catch (error) {
      logger.error('Workflow optimization failed', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  private generateCacheKey(request: AIWorkflowPrompt): string {
    const data = JSON.stringify({
      prompt: request.userPrompt,
      context: request.context,
      industry: request.industry,
      tools: request.currentTools?.sort(),
      complexity: request.complexity
    })
    return `ai_workflow_v2:${crypto.createHash('md5').update(data).digest('hex')}`
  }

  private async trackAIUsage(
    request: AIWorkflowPrompt,
    result: AIGeneratedWorkflow,
    tokens: number
  ): Promise<void> {
    try {
      // Estimate cost (GPT-4 pricing)
      const costPerToken = 0.00003 // $0.03 per 1K tokens
      const estimatedCost = tokens * costPerToken

      logger.info('AI workflow usage tracked', {
        tokens,
        estimatedCost,
        confidence: result.confidence,
        complexity: result.metadata.complexity,
        requiredIntegrations: result.requiredIntegrations.length
      })

      // This will be enhanced in later sprints with workspace tracking
    } catch (error) {
      logger.error('Failed to track AI usage', { error: error instanceof Error ? error.message : String(error) })
    }
  }
}

export const aiWorkflowService = new AIWorkflowService()