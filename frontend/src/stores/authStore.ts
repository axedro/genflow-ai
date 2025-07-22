import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '../services/auth.service'
import type { User, Workspace, LoginRequest, RegisterRequest } from '../services/types'

// Global flag to prevent multiple initializations across all instances
let globalInitFlag = false

interface AuthState {
  user: User | null
  workspace: Workspace | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  isInitializing: boolean
  hasInitialized: boolean
  
  // Actions
  login: (data: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  clearError: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitializing: false,
      hasInitialized: false,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          console.log('AuthStore: Calling authService.login...')
          const response = await authService.login(data)
          console.log('AuthStore: Login successful, setting state...', {
            hasUser: !!response.user,
            hasWorkspace: !!response.workspace,
            userId: response.user?.id
          })
          set({
            user: response.user,
            workspace: response.workspace,
            isAuthenticated: true,
            isLoading: false
          })
          console.log('AuthStore: State set successfully')
        } catch (error: any) {
          console.error('AuthStore: Login failed:', error)
          set({
            error: error.message || 'Login failed',
            isLoading: false,
            isAuthenticated: false
          })
          throw error
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.register(data)
          set({
            user: response.user,
            workspace: response.workspace,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false,
            isAuthenticated: false
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await authService.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Reset global flag to allow re-initialization
          globalInitFlag = false
          set({
            user: null,
            workspace: null,
            isAuthenticated: false,
            isLoading: false,
            isInitializing: false,
            hasInitialized: false,
            error: null
          })
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.getCurrentUser()
          set({
            user: response.user,
            workspace: response.workspace,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error: any) {
          // Clear localStorage when token validation fails to prevent redirect loop
          authService.clearAuthData()
          
          // Reset global flag to allow re-initialization
          globalInitFlag = false
          
          set({
            error: error.message || 'Failed to get user data',
            isLoading: false,
            isAuthenticated: false,
            isInitializing: false,
            hasInitialized: false,
            user: null,
            workspace: null
          })
        }
      },

      clearError: () => set({ error: null }),

      initializeAuth: () => {
        const state = get()
        
        // Use global flag to prevent initialization across all instances
        if (globalInitFlag || state.hasInitialized || state.isInitializing || state.isLoading) {
          return
        }

        // Set global flag and local state
        globalInitFlag = true
        set({ isInitializing: true })

        const token = authService.getStoredToken()
        const user = authService.getStoredUser()
        const workspace = authService.getStoredWorkspace()

        if (token && user && workspace) {
          set({
            user,
            workspace,
            isAuthenticated: true,
            isLoading: true, // Set loading to true during validation
            isInitializing: false,
            hasInitialized: true
          })
          // Validate token by fetching current user (but only once)
          get().getCurrentUser().catch(() => {
            // If validation fails, it will clear the state
          }).finally(() => {
            set({ isLoading: false })
          })
        } else {
          // If any auth data is missing, ensure clean state
          authService.clearAuthData()
          set({
            user: null,
            workspace: null,
            isAuthenticated: false,
            isLoading: false,
            isInitializing: false,
            hasInitialized: true
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace,
        isAuthenticated: state.isAuthenticated
        // Exclude isInitializing and isLoading from persistence
      })
    }
  )
)