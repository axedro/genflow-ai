import { Request } from 'express'
import type { User, Workspace, Role } from '@prisma/client'

// Auth types
export interface AuthRequest extends Request {
  user?: User
  workspace?: Workspace
}

export interface JWTPayload {
  userId: string
  workspaceId?: string
  role?: Role
  sessionId?: string
  exp: number
  iat: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName?: string
  industry?: string
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'>
  token: string
  workspace?: Workspace
  expiresAt: Date
}

// AI types
export interface AIWorkflowRequest {
  prompt: string
  context: BusinessContext
}

export interface BusinessContext {
  industry: string
  companySize: string
  currentTools: string[]
  language: 'es' | 'en'
}

export interface GeneratedWorkflow {
  workflow: any
  explanation: string
  estimatedSavings: number
  confidence: number
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  responseTime?: number
  error?: string
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    database: HealthStatus
    redis: HealthStatus
    aiService?: HealthStatus
  }
  timestamp: string
}