import React from 'react'
import { Handle, Position } from 'reactflow'
import type { WorkflowNode } from '../../../services/workflow.types'
import { 
  Play, 
  Zap, 
  GitBranch, 
  Clock,
  Settings,
  Trash2
} from 'lucide-react'

interface BaseNodeProps {
  data: WorkflowNode & {
    onEdit?: () => void
    onDelete?: () => void
    isSelected?: boolean
  }
}

const nodeIcons = {
  trigger: Play,
  action: Zap,
  condition: GitBranch,
  delay: Clock
}

const nodeColors = {
  trigger: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-600',
    header: 'bg-green-100'
  },
  action: {
    bg: 'bg-blue-50',
    border: 'border-blue-200', 
    icon: 'text-blue-600',
    header: 'bg-blue-100'
  },
  condition: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-600',
    header: 'bg-yellow-100'
  },
  delay: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'text-purple-600',
    header: 'bg-purple-100'
  }
}

export const BaseNode: React.FC<BaseNodeProps> = ({ data }) => {
  const Icon = nodeIcons[data.type]
  const colors = nodeColors[data.type]

  return (
    <div className={`
      min-w-[200px] max-w-[280px] border-2 rounded-lg shadow-sm 
      ${colors.bg} ${colors.border}
      ${data.isSelected ? 'ring-2 ring-primary-500' : ''}
    `}>
      {/* Input Handle */}
      {data.type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400 border-2 border-white"
        />
      )}

      {/* Header */}
      <div className={`px-3 py-2 ${colors.header} rounded-t-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={`h-4 w-4 ${colors.icon}`} />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {data.type}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {data.onEdit && (
              <button
                onClick={data.onEdit}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="Configurar"
              >
                <Settings className="h-3 w-3 text-gray-600" />
              </button>
            )}
            {data.onDelete && (
              <button
                onClick={data.onDelete}
                className="p-1 hover:bg-white/50 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3">
        <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
          {data.name}
        </h4>
        {data.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {data.description}
          </p>
        )}
        
        {/* Integration Badge */}
        {data.integration && (
          <div className="mt-2">
            <span className="px-2 py-1 bg-white/70 text-gray-700 text-xs rounded-full">
              {data.integration}
            </span>
          </div>
        )}

        {/* Config Preview */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            {Object.keys(data.config).length} configuración(es)
          </div>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-gray-400 border-2 border-white"
      />
    </div>
  )
}