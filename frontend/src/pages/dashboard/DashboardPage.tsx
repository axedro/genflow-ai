import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  Workflow, 
  Zap, 
  Clock, 
  TrendingUp,
  Plus,
  Bot
} from 'lucide-react'
import { apiService } from '../../services/api'

interface DashboardStats {
  recentActivity: {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    successRate: number
    avgDuration: number
  }
  aiUsage: number
  aiLimit: number
  _count: {
    workflows: number
    executions: number
    integrations: number
    users: number
  }
}

export const DashboardPage: React.FC = () => {
  const { user, workspace, isLoading: authLoading, isInitializing } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiService.get<DashboardStats>('/workspace/stats')
        if (response.success && response.data) {
          setStats(response.data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Wait for auth initialization to complete and user to be available
    if (!isInitializing && !authLoading && user) {
      fetchStats()
    } else if (!isInitializing && !authLoading && !user) {
      setIsLoading(false)
    }
  }, [user, authLoading, isInitializing])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const quickActions = [
    {
      title: 'Crear Workflow con IA',
      description: 'Describe tu proceso y la IA creará el workflow automáticamente',
      icon: Bot,
      action: () => console.log('Create AI workflow'),
      primary: true
    },
    {
      title: 'Crear Workflow Manual',
      description: 'Construye un workflow paso a paso con nuestro editor visual',
      icon: Workflow,
      action: () => console.log('Create manual workflow')
    },
    {
      title: 'Conectar Integración',
      description: 'Conecta Gmail, Sheets, WhatsApp y más servicios',
      icon: Zap,
      action: () => console.log('Add integration')
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          ¡Bienvenido, {user?.firstName}! 👋
        </h1>
        <p className="text-primary-100 mt-2">
          Aquí tienes un resumen de la actividad de {workspace?.name}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Workflow className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Workflows</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?._count.workflows || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ejecuciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.recentActivity.totalExecutions || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.recentActivity.successRate.toFixed(1) || 0}%
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiempo Prom.</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.recentActivity.avgDuration || 0}ms
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Usage */}
      <Card>
        <CardHeader 
          title="Uso de IA este mes"
          subtitle={`${stats?.aiUsage || 0} de ${stats?.aiLimit || 100} generaciones usadas`}
        />
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, ((stats?.aiUsage || 0) / (stats?.aiLimit || 100)) * 100)}%` 
            }}
          />
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {stats?.aiLimit && stats?.aiUsage 
            ? `${stats.aiLimit - stats.aiUsage} generaciones restantes`
            : 'Generaciones ilimitadas en tu plan actual'
          }
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${
                action.primary ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
                <action.icon className={`h-6 w-6 ${
                  action.primary ? 'text-primary-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {action.description}
                </p>
                <Button 
                  variant={action.primary ? 'primary' : 'outline'}
                  size="sm"
                  onClick={action.action}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Comenzar
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      {stats && stats.recentActivity.totalExecutions > 0 && (
        <Card>
          <CardHeader 
            title="Actividad Reciente"
            subtitle="Últimas ejecuciones de workflows"
          />
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Ejecuciones exitosas</span>
              <span className="font-medium text-green-600">
                {stats.recentActivity.successfulExecutions}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Ejecuciones fallidas</span>
              <span className="font-medium text-red-600">
                {stats.recentActivity.failedExecutions}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Tiempo promedio</span>
              <span className="font-medium text-gray-900">
                {stats.recentActivity.avgDuration}ms
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}