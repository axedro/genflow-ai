import axios, { AxiosError } from 'axios'
import type { AxiosInstance } from 'axios'
import type { APIResponse, APIError } from './types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<APIError>) => {
        if (error.response?.status === 401) {
          // Only redirect if we're not already on login page
          if (!window.location.pathname.includes('/login')) {
            // Token expired or invalid - clear auth data
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user_data')
            localStorage.removeItem('workspace_data')
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string): Promise<APIResponse<T>> {
    const response = await this.api.get<APIResponse<T>>(url)
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.api.post<APIResponse<T>>(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.api.put<APIResponse<T>>(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<APIResponse<T>> {
    const response = await this.api.delete<APIResponse<T>>(url)
    return response.data
  }
}

export const apiService = new ApiService()