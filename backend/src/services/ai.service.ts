import OpenAI from 'openai'
import { redis } from '../config/redis'
import { prisma } from '../config/database'
import { logger } from '../utils/logger'
import { env } from '../config/environment'
import { 
  AIWorkflowRequest, 
  BusinessContext, 
  GeneratedWorkflow 
} from '../types'
import crypto from 'crypto'

export class AIService {
  private openai: OpenAI
  private readonly CACHE_TTL = 3600 // 1 hour cache

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    })
  }

  async generateWorkflow(request: AIWorkflowRequest): Promise<GeneratedWorkflow> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request.prompt, request.context)
      const cached = await redis.get(cacheKey)
      
      if (cached) {
        logger.info('AI workflow cache hit', { cacheKey })
        return JSON.parse(cached)
      }

      // Generate workflow using GPT-4
      const systemPrompt = this.buildSystemPrompt(request.context)
      const userPrompt = this.enhancePrompt(request.prompt, request.context)

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0].message.content
      if (!response) {
        throw new Error('No response from AI service')
      }

      const result = this.parseAndValidateResponse(response)
      
      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result))

      // Track AI usage (for Sprint 1)
      await this.trackAIUsage(request, result, completion.usage?.total_tokens || 0)

      logger.info('AI workflow generated successfully', { 
        prompt: request.prompt.substring(0, 100),
        tokens: completion.usage?.total_tokens 
      })

      return result
    } catch (error) {
      if (error instanceof Error) {
        logger.error('AI workflow generation failed', { 
          error: error.message,
          prompt: request.prompt.substring(0, 100)
        })
        throw new Error(`AI workflow generation failed: ${error.message}`)
      } else {
        logger.error('AI workflow generation failed', { error, prompt: request.prompt.substring(0, 100) })
        throw new Error('AI workflow generation failed')
      }
    }
  }

  private buildSystemPrompt(context: BusinessContext): string {
    return `You are an expert business process automation consultant specializing in Spanish SMEs.

BUSINESS CONTEXT:
- Industry: ${context.industry}
- Company Size: ${context.companySize}
- Current Tools: ${context.currentTools.join(', ')}
- Language: ${context.language}

INSTRUCTIONS:
1. Generate workflows that are practical and immediately actionable
2. Use simple, business-friendly language in ${context.language === 'es' ? 'Spanish' : 'English'}
3. Focus on common SME pain points: time-saving, error reduction, cost optimization
4. Include specific integration suggestions from available tools
5. Provide realistic time and cost savings estimates

RESPONSE FORMAT (JSON):
{
  "workflow": {
    "name": "Clear workflow name",
    "description": "Brief description",
    "steps": [
      {
        "id": "step_1",
        "name": "Step name",
        "description": "What this step does",
        "type": "trigger|action|condition",
        "integration": "service_name",
        "config": {}
      }
    ],
    "triggers": ["manual", "scheduled", "webhook"],
    "estimatedDuration": "execution time in minutes"
  },
  "explanation": "Clear explanation of what the workflow does and why it's useful",
  "estimatedSavings": "estimated time saved per week in minutes",
  "confidence": "confidence score 0-1",
  "tags": ["relevant", "business", "tags"]
}`
  }

  private enhancePrompt(prompt: string, context: BusinessContext): string {
    return `Create an automation workflow for: "${prompt}"

Please consider:
- Our industry: ${context.industry}
- Company size: ${context.companySize} 
- Current tools we use: ${context.currentTools.join(', ')}
- We prefer solutions in ${context.language === 'es' ? 'Spanish' : 'English'}

Focus on practical, implementable automation that will save time and reduce manual work.`
  }

  private parseAndValidateResponse(response: string): GeneratedWorkflow {
    try {
      const parsed = JSON.parse(response)
      
      // Basic validation
      if (!parsed.workflow || !parsed.explanation || !parsed.confidence) {
        throw new Error('Invalid AI response structure')
      }

      if (!parsed.workflow.name || !parsed.workflow.steps || !Array.isArray(parsed.workflow.steps)) {
        throw new Error('Invalid workflow structure')
      }

      // Ensure confidence is a number between 0 and 1
      const confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5))

      return {
        workflow: parsed.workflow,
        explanation: parsed.explanation,
        estimatedSavings: parseInt(parsed.estimatedSavings) || 60, // Default 1 hour/week
        confidence
      }
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to parse AI response', { error: error.message, response })
      } else {
        logger.error('Failed to parse AI response', { error, response })
      }
      throw new Error('Failed to parse AI response')
    }
  }

  private generateCacheKey(prompt: string, context: BusinessContext): string {
    const data = JSON.stringify({ prompt, context })
    return `ai_workflow:${crypto.createHash('md5').update(data).digest('hex')}`
  }

  private async trackAIUsage(
    request: AIWorkflowRequest, 
    result: GeneratedWorkflow, 
    tokens: number
  ): Promise<void> {
    try {
      // Estimate cost (rough calculation for GPT-4)
      const costPerToken = 0.00003 // $0.03 per 1K tokens for GPT-4
      const estimatedCost = tokens * costPerToken

      // This will be enhanced in later sprints with workspace tracking
      logger.info('AI usage tracked', {
        tokens,
        estimatedCost,
        confidence: result.confidence
      })
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to track AI usage', { error: error.message })
      } else {
        logger.error('Failed to track AI usage', { error })
      }
      // Don't throw - usage tracking shouldn't break workflow generation
    }
  }

  async explainWorkflow(workflow: any): Promise<string> {
    try {
      const prompt = `Explain this workflow in simple terms for a non-technical business owner:

${JSON.stringify(workflow, null, 2)}

Provide a clear, friendly explanation of:
1. What this workflow does
2. How it will help their business
3. What they need to set it up
4. Expected benefits

Respond in Spanish if the workflow contains Spanish text, otherwise in English.`

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo', // Use cheaper model for explanations
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      })

      return completion.choices[0].message.content || 'Unable to generate explanation'
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Workflow explanation failed', { error: error.message })
      } else {
        logger.error('Workflow explanation failed', { error })
      }
      return 'Unable to generate explanation at this time'
    }
  }
}

export const aiService = new AIService()