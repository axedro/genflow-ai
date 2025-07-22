import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiService } from '../../services/api'

export const ApiDebug: React.FC = () => {
  const [healthResult, setHealthResult] = useState<any>(null)
  const [statsResult, setStatsResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  const testHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/health')
      const data = await response.json()
      setHealthResult({ success: true, data })
    } catch (error: any) {
      setHealthResult({ success: false, error: error.message })
    }
    setLoading(false)
  }

  const testStats = async () => {
    setLoading(true)
    try {
      const response = await apiService.get('/workspace/stats')
      setStatsResult({ success: true, data: response })
    } catch (error: any) {
      setStatsResult({ 
        success: false, 
        error: error.message,
        code: error.code,
        status: error.response?.status,
        responseData: error.response?.data
      })
    }
    setLoading(false)
  }

  const checkLocalStorage = () => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    const workspaceData = localStorage.getItem('workspace_data')
    
    console.log('=== LocalStorage Debug ===')
    console.log('Token:', token?.substring(0, 50) + '...')
    console.log('User data:', userData)
    console.log('Workspace data:', workspaceData)
    
    setStatsResult({
      success: true,
      data: {
        hasToken: !!token,
        tokenPreview: token?.substring(0, 50) + '...',
        hasUserData: !!userData,
        hasWorkspaceData: !!workspaceData,
        userDataParsed: userData ? JSON.parse(userData) : null,
        workspaceDataParsed: workspaceData ? JSON.parse(workspaceData) : null
      },
      method: 'localStorage check'
    })
  }

  const testDirectFetch = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:3000/api/workspace/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      })
      const data = await response.json()
      setStatsResult({ 
        success: response.ok, 
        status: response.status,
        data,
        method: 'direct fetch'
      })
    } catch (error: any) {
      setStatsResult({ 
        success: false, 
        error: error.message,
        method: 'direct fetch'
      })
    }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Debug Tool</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Status */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Auth Status</h3>
          <pre className="text-sm">
{JSON.stringify({
  isAuthenticated,
  hasUser: !!user,
  userId: user?.id,
  token: localStorage.getItem('auth_token')?.substring(0, 50) + '...',
  tokenExists: !!localStorage.getItem('auth_token')
}, null, 2)}
          </pre>
        </div>

        {/* Environment */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Environment</h3>
          <pre className="text-sm">
{JSON.stringify({
  apiUrl: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  currentUrl: window.location.href
}, null, 2)}
          </pre>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="mt-6 space-x-4">
        <button
          onClick={testHealth}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Endpoint
        </button>
        
        <button
          onClick={testStats}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Stats (via apiService)
        </button>
        
        <button
          onClick={checkLocalStorage}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Check LocalStorage
        </button>
        
        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Stats (direct fetch)
        </button>
      </div>

      {/* Results */}
      <div className="mt-6 space-y-4">
        {healthResult && (
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Health Test Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(healthResult, null, 2)}
            </pre>
          </div>
        )}

        {statsResult && (
          <div className="bg-white p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Stats Test Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(statsResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}