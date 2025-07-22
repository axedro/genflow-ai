import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { LogOut, User, Settings } from 'lucide-react'

export const Header: React.FC = () => {
  const { user, workspace, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary-600">GenFlow AI</h1>
          {workspace && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{workspace.name}</span>
              <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                {workspace.plan}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            <div className="text-xs text-gray-500">{user?.email}</div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}