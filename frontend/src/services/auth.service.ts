import { apiService } from './api'
import type { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User, 
  Workspace 
} from './types'

class AuthService {
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', data)
      
      if (response.success && response.data) {
        this.setAuthData(response.data)
        return response.data
      }
      
      throw new Error(response.error || 'Login failed')
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/register', data)
    
    if (response.success && response.data) {
      this.setAuthData(response.data)
      return response.data
    }
    
    throw new Error(response.error || 'Registration failed')
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout')
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API call failed:', error)
    } finally {
      this.clearAuthData()
    }
  }

  async getCurrentUser(): Promise<{ user: User; workspace: Workspace }> {
    const response = await apiService.get<{ user: User; workspace: Workspace }>('/auth/me')
    
    if (response.success && response.data) {
      return response.data
    }
    
    throw new Error(response.error || 'Failed to get user data')
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse>('/auth/refresh-token')
    
    if (response.success && response.data) {
      this.setAuthData(response.data)
      return response.data
    }
    
    throw new Error(response.error || 'Token refresh failed')
  }

  private setAuthData(authData: AuthResponse): void {
    localStorage.setItem('auth_token', authData.token)
    localStorage.setItem('user_data', JSON.stringify(authData.user))
    localStorage.setItem('workspace_data', JSON.stringify(authData.workspace))
  }

  clearAuthData(): void {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
    localStorage.removeItem('workspace_data')
  }

  getStoredToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  getStoredUser(): User | null {
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  }

  getStoredWorkspace(): Workspace | null {
    const workspaceData = localStorage.getItem('workspace_data')
    return workspaceData ? JSON.parse(workspaceData) : null
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken()
  }
}

export const authService = new AuthService()