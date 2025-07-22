import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { WorkflowNode } from '../../services/workflow.types'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader } from '../ui/Card'
import { 
  X, 
  Save, 
  Play,
  Zap,
  GitBranch,
  Clock,
  Mail,
  FileSpreadsheet,
  MessageCircle,
  Folder
} from 'lucide-react'

interface NodeConfigPanelProps {
  node: WorkflowNode | null
  onSave: (node: WorkflowNode) => void
  onClose: () => void
}

const nodeTypes = [
  { id: 'trigger', label: 'Disparador', icon: Play, description: 'Inicia el workflow' },
  { id: 'action', label: 'Acción', icon: Zap, description: 'Ejecuta una tarea' },
  { id: 'condition', label: 'Condición', icon: GitBranch, description: 'Evalúa una condición' },
  { id: 'delay', label: 'Espera', icon: Clock, description: 'Pausa la ejecución' }
]

const integrations = [
  { id: 'gmail', label: 'Gmail', icon: Mail, description: 'Envío y gestión de emails' },
  { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet, description: 'Hojas de cálculo' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Mensajería' },
  { id: 'drive', label: 'Google Drive', icon: Folder, description: 'Gestión de archivos' }
]

const triggerConfigs = {
  manual: {
    label: 'Manual',
    description: 'Se ejecuta manualmente',
    fields: []
  },
  schedule: {
    label: 'Programado',
    description: 'Se ejecuta en horarios específicos',
    fields: [
      { name: 'cron', label: 'Expresión Cron', placeholder: '0 9 * * *', required: true }
    ]
  },
  webhook: {
    label: 'Webhook',
    description: 'Se ejecuta cuando recibe una llamada HTTP',
    fields: [
      { name: 'endpoint', label: 'Endpoint', placeholder: '/webhook/new-order', required: true }
    ]
  }
}

const actionConfigs = {
  gmail: {
    send_email: {
      label: 'Enviar Email',
      fields: [
        { name: 'to', label: 'Para', placeholder: 'cliente@email.com', required: true },
        { name: 'subject', label: 'Asunto', placeholder: 'Asunto del email', required: true },
        { name: 'body', label: 'Contenido', type: 'textarea', placeholder: 'Contenido del email', required: true }
      ]
    }
  },
  sheets: {
    update_range: {
      label: 'Actualizar Rango',
      fields: [
        { name: 'spreadsheetId', label: 'ID de Hoja', placeholder: 'ID de Google Sheets', required: true },
        { name: 'range', label: 'Rango', placeholder: 'A1:C10', required: true },
        { name: 'values', label: 'Valores', type: 'textarea', placeholder: 'Valores a insertar' }
      ]
    }
  },
  whatsapp: {
    send_message: {
      label: 'Enviar Mensaje',
      fields: [
        { name: 'to', label: 'Número', placeholder: '+34600000000', required: true },
        { name: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Mensaje a enviar', required: true }
      ]
    }
  },
  drive: {
    create_file: {
      label: 'Crear Archivo',
      fields: [
        { name: 'name', label: 'Nombre', placeholder: 'documento.txt', required: true },
        { name: 'content', label: 'Contenido', type: 'textarea', placeholder: 'Contenido del archivo' },
        { name: 'folderId', label: 'ID Carpeta', placeholder: 'ID de carpeta de destino' }
      ]
    }
  }
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  onSave,
  onClose
}) => {
  const [selectedType, setSelectedType] = useState(node?.type || 'action')
  const [selectedIntegration, setSelectedIntegration] = useState(node?.integration || '')
  const [selectedAction, setSelectedAction] = useState('')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Record<string, any>>({
    defaultValues: {
      name: node?.name || '',
      description: node?.description || '',
      ...node?.config || {}
    }
  })

  useEffect(() => {
    if (node) {
      setSelectedType(node.type)
      setSelectedIntegration(node.integration || '')
      // Try to determine the action from config
      if (node.integration && node.config) {
        const actions = actionConfigs[node.integration as keyof typeof actionConfigs]
        if (actions) {
          const actionKey = Object.keys(actions)[0] // Default to first action
          setSelectedAction(actionKey)
        }
      }
    }
  }, [node])

  const onSubmit = (data: any) => {
    const updatedNode: WorkflowNode = {
      id: node?.id || `node_${Date.now()}`,
      type: selectedType as WorkflowNode['type'],
      name: data.name,
      description: data.description,
      integration: selectedIntegration || undefined,
      config: {
        ...data,
        name: undefined,
        description: undefined,
        ...(selectedType === 'trigger' && selectedIntegration === 'schedule' && {
          type: 'schedule'
        }),
        ...(selectedType === 'action' && selectedAction && {
          action: selectedAction
        })
      },
      position: node?.position || { x: 0, y: 0 }
    }

    onSave(updatedNode)
  }

  const getCurrentFields = () => {
    if (selectedType === 'trigger' && selectedIntegration === 'schedule') {
      return triggerConfigs.schedule.fields
    }
    
    if (selectedType === 'trigger' && selectedIntegration === 'webhook') {
      return triggerConfigs.webhook.fields
    }

    if (selectedType === 'action' && selectedIntegration && selectedAction) {
      const integrationActions = actionConfigs[selectedIntegration as keyof typeof actionConfigs]
      if (
        integrationActions &&
        selectedAction &&
        selectedAction in integrationActions
      ) {
        const action = integrationActions[selectedAction as keyof typeof integrationActions] as { fields: any[] }
        return action.fields
      }
    }

    if (selectedType === 'delay') {
      return [
        { name: 'duration', label: 'Duración (ms)', placeholder: '60000', required: true, type: 'number' }
      ]
    }

    if (selectedType === 'condition') {
      return [
        { name: 'condition', label: 'Condición', placeholder: 'variable > 10', required: true },
        { name: 'operator', label: 'Operador', type: 'select', options: ['>', '<', '==', '!=', 'contains'] }
      ]
    }

    return []
  }

  const getAvailableActions = () => {
    if (!selectedIntegration || selectedType !== 'action') return []
    
    const integrationActions = actionConfigs[selectedIntegration as keyof typeof actionConfigs]
    if (!integrationActions) return []

    return Object.entries(integrationActions).map(([key, value]) => ({
      id: key,
      label: value.label
    }))
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <Card padding={false} className="h-full rounded-none border-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {node ? 'Editar Nodo' : 'Nuevo Nodo'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <Input
              label="Nombre del Nodo"
              placeholder="Ej: Enviar email de bienvenida"
              {...register('name', { required: 'El nombre es requerido' })}
              error={errors.name?.message as string}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (Opcional)
              </label>
              <textarea
                {...register('description')}
                className="input min-h-[60px] resize-none"
                placeholder="Describe qué hace este nodo..."
                rows={3}
              />
            </div>
          </div>

          {/* Node Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Nodo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id as "trigger" | "action" | "condition" | "delay")}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedType === type.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{type.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Integration Selection */}
          {(selectedType === 'action' || selectedType === 'trigger') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Integración
              </label>
              <div className="space-y-2">
                {selectedType === 'trigger' && (
                  <button
                    type="button"
                    onClick={() => setSelectedIntegration('manual')}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      selectedIntegration === 'manual'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Play className="h-4 w-4" />
                      <span className="text-sm font-medium">Manual</span>
                    </div>
                    <p className="text-xs text-gray-600">Se ejecuta manualmente</p>
                  </button>
                )}
                
                {selectedType === 'trigger' && (
                  <button
                    type="button"
                    onClick={() => setSelectedIntegration('schedule')}
                    className={`w-full p-3 border rounded-lg text-left transition-colors ${
                      selectedIntegration === 'schedule'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Programado</span>
                    </div>
                    <p className="text-xs text-gray-600">Se ejecuta automáticamente</p>
                  </button>
                )}

                {integrations.map((integration) => {
                  const Icon = integration.icon
                  return (
                    <button
                      key={integration.id}
                      type="button"
                      onClick={() => setSelectedIntegration(integration.id)}
                      className={`w-full p-3 border rounded-lg text-left transition-colors ${
                        selectedIntegration === integration.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{integration.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{integration.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Selection */}
          {selectedType === 'action' && selectedIntegration && getAvailableActions().length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acción
              </label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="input"
              >
                <option value="">Selecciona una acción</option>
                {getAvailableActions().map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Configuration Fields */}
          {getCurrentFields().length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700">Configuración</h4>
              {getCurrentFields().map((field) => (
                <div key={field.name}>
                  {field.type === 'textarea' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <textarea
                        {...register(field.name, { required: field.required })}
                        className="input min-h-[80px] resize-none"
                        placeholder={field.placeholder}
                        rows={4}
                      />
                    </div>
                  ) : field.type === 'select' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                      </label>
                      <select
                        {...register(field.name, { required: field.required })}
                        className="input"
                      >
                        <option value="">Selecciona...</option>
                        {field.options?.map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <Input
                      label={field.label}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      {...register(field.name, { required: field.required })}
                      error={errors?.[field.name as string]?.message as string}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {node ? 'Actualizar' : 'Crear'} Nodo
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}