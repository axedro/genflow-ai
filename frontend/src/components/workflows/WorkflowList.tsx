import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { workflowService } from '../../services/workflow.service'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { 
  Workflow, 
  Bot, 
  Search, 
  Filter,
  Plus,
  Play,
  Pause,
  Copy,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Workflow as WorkflowType } from '../../services/workflow.types'

interface WorkflowListProps {
  onCreateNew?: () => void
  onCreateWithAI?: () => void
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onCreateNew,
  onCreateWithAI
}) => {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const categories = [
    'administration',
    'sales', 
    'finance',
    'marketing',
    'customer_service'
  ]

  const categoryLabels = {
    administration: 'Administración',
    sales: 'Ventas',
    finance: 'Finanzas', 
    marketing: 'Marketing',
    customer_service: 'Atención al Cliente'
  }

  const loadWorkflows = async (page: number = 1) => {
    setIsLoading(true)
    try {
      const result = await workflowService.getWorkflows({
        page,
        limit: pagination.limit,
        category: selectedCategory || undefined,
        search: searchTerm || undefined,
        isActive: showActiveOnly ? true : undefined
      })

      setWorkflows(result.data)
      setPagination(result.pagination)
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar workflows')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows()
  }, [searchTerm, selectedCategory, showActiveOnly])

  const handleToggleActive = async (workflow: WorkflowType) => {
    try {
      await workflowService.updateWorkflow(workflow.id, {
        isActive: !workflow.isActive
      })

      setWorkflows(workflows.map(w => 
        w.id === workflow.id 
          ? { ...w, isActive: !w.isActive }
          : w
      ))

      toast.success(
        workflow.isActive 
          ? 'Workflow pausado' 
          : 'Workflow activado'
      )
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar workflow')
    }
  }

  const handleDuplicate = async (workflow: WorkflowType) => {
    try {
      const duplicated = await workflowService.duplicateWorkflow(
        workflow.id,
        `${workflow.name} (Copia)`
      )

      setWorkflows([duplicated, ...workflows])
      toast.success('Workflow duplicado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al duplicar workflow')
    }
  }

  const handleDelete = async (workflow: WorkflowType) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${workflow.name}"?`)) {
      return
    }

    try {
      await workflowService.deleteWorkflow(workflow.id)
      setWorkflows(workflows.filter(w => w.id !== workflow.id))
      toast.success('Workflow eliminado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar workflow')
    }
  }

  const getSuccessRate = (workflow: WorkflowType) => {
    if (workflow.totalExecutions === 0) return 0
    return Math.round((workflow.successfulExecutions / workflow.totalExecutions) * 100)
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    return `${Math.round(ms / 60000)}min`
  }

  if (isLoading && workflows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600">Gestiona tus procesos automatizados</p>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Manual
          </Button>
          <Button variant="primary" onClick={onCreateWithAI}>
            <Bot className="h-4 w-4 mr-2" />
            Crear con IA
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryLabels[category] || category}
                </option>
              ))}
            </select>

            {/* Active Filter */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Solo activos</span>
            </label>
          </div>
        </div>
      </Card>
 
      {/* Workflows Grid */}
      {workflows.length === 0 ? (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center">
            <div className="p-4 bg-gray-100 rounded-full mb-4">
              <Workflow className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay workflows
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || selectedCategory ? 
                'No se encontraron workflows con los filtros aplicados' :
                'Comienza creando tu primer workflow automatizado'
              }
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Manual
              </Button>
              <Button variant="primary" onClick={onCreateWithAI}>
                <Bot className="h-4 w-4 mr-2" />
                Crear con IA
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {workflow.name}
                      </h3>
                      {workflow.aiGenerated && (
                        <div className="p-1 bg-purple-100 rounded">
                          <Bot className="h-3 w-3 text-purple-600" />
                        </div>
                      )}
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {workflow.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => handleToggleActive(workflow)}
                      className={`p-1.5 rounded-full transition-colors ${
                        workflow.isActive 
                          ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      title={workflow.isActive ? 'Pausar' : 'Activar'}
                    >
                      {workflow.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
 
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">
                      {workflow.totalExecutions}
                    </div>
                    <div className="text-gray-600">Ejecuciones</div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="font-medium text-gray-900">
                        {getSuccessRate(workflow)}%
                      </span>
                      {getSuccessRate(workflow) >= 90 ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : getSuccessRate(workflow) >= 70 ? (
                        <TrendingUp className="h-3 w-3 text-yellow-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    <div className="text-gray-600">Éxito</div>
                  </div>
                  
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-medium text-gray-900">
                      {formatDuration(workflow.averageExecutionTime)}
                    </div>
                    <div className="text-gray-600">Tiempo</div>
                  </div>
                </div>
 
                {/* Tags */}
                {workflow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {workflow.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {workflow.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{workflow.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
 
                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {workflow.lastExecutedAt ? (
                      `Última: ${new Date(workflow.lastExecutedAt).toLocaleDateString()}`
                    ) : (
                      'Nunca ejecutado'
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Link to={`/workflows/${workflow.id}`}>
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </Link>
                    
                    <button
                      onClick={() => handleDuplicate(workflow)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(workflow)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
 
      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadWorkflows(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Anterior
          </Button>
          
          <span className="text-sm text-gray-600">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadWorkflows(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
 }