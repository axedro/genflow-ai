import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

export const useAuth = () => {
  const {
    user,
    workspace,
    isAuthenticated,
    isLoading,
    isInitializing,
    hasInitialized,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    clearError,
    initializeAuth
  } = useAuthStore()

  useEffect(() => {
    // Only run initialization once - use hasInitialized flag
    if (!hasInitialized) {
      initializeAuth()
    }
  }, [hasInitialized, initializeAuth])

  return {
    user,
    workspace,
    isAuthenticated,
    isLoading,
    isInitializing,
    hasInitialized,
    error,
    login,
    register,
    logout,
    getCurrentUser,
    clearError
  }
}