import React, { useState, useCallback, useEffect } from 'react'
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MarkerType,
  Panel,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useWorkflowStore } from '../../stores/workflowStore'
import { BaseNode } from './nodes/BaseNode'
import { NodeConfigPanel } from './NodeConfigPanel'
import { Button } from '../ui/Button'
import { 
  type WorkflowNode as WorkflowNodeType, 
  type WorkflowDefinition 
} from '../../services/workflow.types'
import { 
  Save, 
  Play, 
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'

// Custom node types for React Flow
const nodeTypes: NodeTypes = {
  workflowNode: BaseNode
}

interface VisualWorkflowBuilderProps {
  workflowId?: string
  initialDefinition?: WorkflowDefinition
  onSave?: (definition: WorkflowDefinition) => void
  onClose?: () => void
}

export const VisualWorkflowBuilder: React.FC<VisualWorkflowBuilderProps> = ({
  initialDefinition,
  onSave,
  onClose
}) => {
  const {
    workflowDefinition,
    setWorkflowDefinition,
    updateNode,
    addNode,
    removeNode,
    addEdge: addWorkflowEdge,
    removeEdge,
    isDirty,
    isSaving,
    saveWorkflow
  } = useWorkflowStore()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNodeType | null>(null)
  const [showConfigPanel, setShowConfigPanel] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Convert workflow definition to React Flow format
  const convertToReactFlowFormat = useCallback((definition: WorkflowDefinition) => {
    const reactFlowNodes: Node[] = definition.nodes.map((node) => ({
      id: node.id,
      type: 'workflowNode',
      position: node.position,
      data: {
        ...node,
        onEdit: () => {
          setSelectedNode(node)
          setShowConfigPanel(true)
        },
        onDelete: () => {
          if (confirm(`¿Eliminar el nodo "${node.name}"?`)) {
            removeNode(node.id)
          }
        }
      }
    }))

    const reactFlowEdges: Edge[] = definition.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type === 'conditional' ? 'smoothstep' : 'default',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20
      },
      style: {
        strokeWidth: 2,
        stroke: edge.type === 'conditional' ? '#f59e0b' : '#6b7280'
      },
      label: edge.condition,
      labelStyle: { 
        fontSize: 12, 
        fontWeight: 600,
        fill: '#374151'
      },
      labelBgStyle: { 
        fill: '#ffffff',
        fillOpacity: 0.9
      }
    }))

    return { nodes: reactFlowNodes, edges: reactFlowEdges }
  }, [removeNode])


  // Initialize workflow definition
  useEffect(() => {
    if (initialDefinition && !workflowDefinition) {
      setWorkflowDefinition(initialDefinition)
    }
  }, [initialDefinition, workflowDefinition, setWorkflowDefinition])

  // Update React Flow when workflow definition changes
  useEffect(() => {
    if (workflowDefinition) {
      const { nodes: reactFlowNodes, edges: reactFlowEdges } = convertToReactFlowFormat(workflowDefinition)
      setNodes(reactFlowNodes)
      setEdges(reactFlowEdges)
    }
  }, [workflowDefinition, convertToReactFlowFormat, setNodes, setEdges])

  // Handle node position changes
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes)
    
    // Update positions in workflow definition
    const positionChanges = changes.filter(change => change.type === 'position' && change.position)
    if (positionChanges.length > 0 && workflowDefinition) {
      const updatedDefinition = { ...workflowDefinition }
      positionChanges.forEach(change => {
        const nodeIndex = updatedDefinition.nodes.findIndex(n => n.id === change.id)
        if (nodeIndex !== -1) {
          updatedDefinition.nodes[nodeIndex].position = change.position
        }
      })
      setWorkflowDefinition(updatedDefinition)
    }
  }, [onNodesChange, workflowDefinition, setWorkflowDefinition])

  // Handle edge connections
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return

    const newEdge = {
      id: `edge_${connection.source}_${connection.target}`,
      source: connection.source,
      target: connection.target,
      type: 'default' as const
    }

    addWorkflowEdge(newEdge)
  }, [addWorkflowEdge])

  // Handle edge deletions
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes)
    
    const deletedEdges = changes.filter(change => change.type === 'remove')
    deletedEdges.forEach(change => {
      removeEdge(change.id)
    })
  }, [onEdgesChange, removeEdge])

  // Add new node
  const handleAddNode = () => {
    setSelectedNode(null)
    setShowConfigPanel(true)
  }

  // Save node configuration
  const handleSaveNode = (node: WorkflowNodeType) => {
    if (selectedNode) {
      // Update existing node
      updateNode(node.id, node)
    } else {
      // Add new node
      const newPosition = {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100
      }
      addNode({ ...node, position: newPosition })
    }
    setShowConfigPanel(false)
    setSelectedNode(null)
  }

  // Execute workflow (mock implementation)
  const handleExecuteWorkflow = async () => {
    if (!workflowDefinition || workflowDefinition.nodes.length === 0) {
      toast.error('El workflow debe tener al menos un nodo')
      return
    }

    setIsExecuting(true)
    try {
      // Mock execution - in real implementation, this would call the execution API
      await new Promise(resolve => setTimeout(resolve, 2000))
      toast.success('Workflow ejecutado exitosamente')
    } catch (error) {
      toast.error('Error al ejecutar el workflow')
    } finally {
      setIsExecuting(false)
    }
  }

  // Save workflow
  const handleSave = async () => {
    if (!workflowDefinition) return

    try {
      if (onSave) {
        onSave(workflowDefinition)
      } else {
        await saveWorkflow()
      }
      toast.success('Workflow guardado exitosamente')
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el workflow')
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-50"
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls showInteractive={false} />
          
          {/* Top Panel */}
          <Panel position="top-left" className="m-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddNode}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir Nodo
                </Button>

                <div className="border-l border-gray-200 h-6 mx-2" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  loading={isSaving}
                  disabled={!isDirty}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExecuteWorkflow}
                  loading={isExecuting}
                  disabled={!workflowDefinition || workflowDefinition.nodes.length === 0}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Probar
                </Button>

                <div className="border-l border-gray-200 h-6 mx-2" />

                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            </div>
          </Panel>

          {/* Status Panel */}
          <Panel position="top-right" className="m-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>{nodes.length} nodos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{edges.length} conexiones</span>
                </div>
                {isDirty && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span>Sin guardar</span>
                  </div>
                )}
              </div>
            </div>
          </Panel>

          {/* Help Panel */}
          <Panel position="bottom-right" className="m-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Arrastrar:</strong> Mover nodos</div>
                <div><strong>Shift + Arrastrar:</strong> Selección múltiple</div>
                <div><strong>Ctrl + Rueda:</strong> Zoom</div>
                <div><strong>Conectar:</strong> Arrastrar desde los puntos de conexión</div>
              </div>
            </div>
          </Panel>
        </ReactFlow>

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Workflow vacío
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Comienza añadiendo tu primer nodo para construir el workflow
              </p>
              <Button
                variant="primary"
                onClick={handleAddNode}
                className="pointer-events-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir Primer Nodo
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      {showConfigPanel && (
        <NodeConfigPanel
          node={selectedNode}
          onSave={handleSaveNode}
          onClose={() => {
            setShowConfigPanel(false)
            setSelectedNode(null)
          }}
        />
      )}
    </div>
  )
}