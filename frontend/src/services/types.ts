// Auth types
export interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
    emailVerified?: Date
    language: string
    timezone: string
    createdAt: Date
    updatedAt: Date
  }
  
  export interface Workspace {
    id: string
    name: string
    description?: string
    industry?: string
    companySize?: string
    plan: string
    aiUsage: number
    aiLimit: number
    createdAt: Date
    updatedAt: Date
  }
  
  export interface AuthResponse {
    user: User
    token: string
    workspace: Workspace
    expiresAt: Date
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
  
  // API Response types
  export interface APIResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
  }
  
  export interface APIError {
    success: false
    error: string
    code?: string
  }