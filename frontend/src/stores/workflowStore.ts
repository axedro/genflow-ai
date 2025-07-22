import { create } from 'zustand'
import { workflowService } from '../services/workflow.service'
import type { 
  Workflow, 
  WorkflowDefinition, 
  WorkflowNode, 
  WorkflowEdge,
  AIGeneratedWorkflow 
} from '../services/workflow.types'

interface WorkflowState {
  // Current workflow being edited
  currentWorkflow: Workflow | null
  workflowDefinition: WorkflowDefinition | null
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Workflow list
  workflows: Workflow[]
  isLoadingList: boolean

  // Actions
  setCurrentWorkflow: (workflow: Workflow | null) => void
  setWorkflowDefinition: (definition: WorkflowDefinition) => void
  updateNode: (nodeId: string, updates: Partial<WorkflowNode>) => void
  addNode: (node: WorkflowNode) => void
  removeNode: (nodeId: string) => void
  updateEdge: (edgeId: string, updates: Partial<WorkflowEdge>) => void
  addEdge: (edge: WorkflowEdge) => void
  removeEdge: (edgeId: string) => void
  saveWorkflow: () => Promise<void>
  loadWorkflows: () => Promise<void>
  createFromAI: (aiWorkflow: AIGeneratedWorkflow) => void
  clearError: () => void
  resetWorkflow: () => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  currentWorkflow: null,
  workflowDefinition: null,
  isDirty: false,
  isLoading: false,
  isSaving: false,
  error: null,
  workflows: [],
  isLoadingList: false,

  setCurrentWorkflow: (workflow) => {
    set({ 
      currentWorkflow: workflow,
      workflowDefinition: workflow?.definition || null,
      isDirty: false,
      error: null
    })
  },

  setWorkflowDefinition: (definition) => {
    set({ 
      workflowDefinition: definition,
      isDirty: true
    })
  },

  updateNode: (nodeId, updates) => {
    const { workflowDefinition } = get()
    if (!workflowDefinition) return

    const updatedNodes = workflowDefinition.nodes.map(node =>
      node.id === nodeId ? { ...node, ...updates } : node
    )

    set({
      workflowDefinition: {
        ...workflowDefinition,
        nodes: updatedNodes
      },
      isDirty: true
    })
  },

  addNode: (node) => {
    const { workflowDefinition } = get()
    if (!workflowDefinition) return

    set({
      workflowDefinition: {
        ...workflowDefinition,
        nodes: [...workflowDefinition.nodes, node]
      },
      isDirty: true
    })
  },

  removeNode: (nodeId) => {
    const { workflowDefinition } = get()
    if (!workflowDefinition) return

    // Remove node and any connected edges
    const updatedNodes = workflowDefinition.nodes.filter(node => node.id !== nodeId)
    const updatedEdges = workflowDefinition.edges.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    )

    set({
      workflowDefinition: {
        ...workflowDefinition,
        nodes: updatedNodes,
        edges: updatedEdges
      },
      isDirty: true
    })
  },

  updateEdge: (edgeId, updates) => {
    const { workflowDefinition } = get()
    if (!workflowDefinition) return

    const updatedEdges = workflowDefinition.edges.map(edge =>
      edge.id === edgeId ? { ...edge, ...updates } : edge
    )

    set({
      workflowDefinition: {
        ...workflowDefinition,
        edges: updatedEdges
      },
      isDirty: true
    })
  },

  addEdge: (edge) => {
    const { workflowDefinition } = get()
    if (!workflowDefinition) return

    // Check if edge already exists
    const existingEdge = workflowDefinition.edges.find(e => 
      e.source === edge.source && e.target === edge.target
    )

    if (existingEdge) return

    set({
      workflowDefinition: {
        ...workflowDefinition,
        edges: [...workflowDefinition.edges, edge]
      },
      isDirty: true
    })
  },

  removeEdge: (edgeId) => {
    const { workflowDefinition } = get()
    if (!workflowDefinition) return

    const updatedEdges = workflowDefinition.edges.filter(edge => edge.id !== edgeId)

    set({
      workflowDefinition: {
        ...workflowDefinition,
        edges: updatedEdges
      },
      isDirty: true
    })
  },

  saveWorkflow: async () => {
    const { currentWorkflow, workflowDefinition } = get()
    if (!workflowDefinition) return

    set({ isSaving: true, error: null })

    try {
      if (currentWorkflow) {
        // Update existing workflow
        const updated = await workflowService.updateWorkflow(currentWorkflow.id, {
          definition: workflowDefinition
        })
        set({ 
          currentWorkflow: updated,
          isDirty: false
        })
      } else {
        // Create new workflow - this should be handled by the parent component
        throw new Error('Cannot save workflow without basic information')
      }
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isSaving: false })
    }
  },

  loadWorkflows: async () => {
    set({ isLoadingList: true, error: null })
    try {
      const result = await workflowService.getWorkflows({ limit: 100 })
      set({ workflows: result.data })
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoadingList: false })
    }
  },

  createFromAI: (aiWorkflow) => {
    set({
      workflowDefinition: aiWorkflow.workflow,
      currentWorkflow: {
        id: 'new',
        name: aiWorkflow.metadata.name,
        description: aiWorkflow.metadata.description,
        definition: aiWorkflow.workflow,
        isActive: false,
        category: aiWorkflow.metadata.category,
        tags: aiWorkflow.metadata.tags,
        aiGenerated: true,
        aiConfidence: aiWorkflow.confidence,
        totalExecutions: 0,
        successfulExecutions: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Workflow,
      isDirty: true
    })
  },

  clearError: () => set({ error: null }),

  resetWorkflow: () => {
    set({
      currentWorkflow: null,
      workflowDefinition: null,
      isDirty: false,
      error: null
    })
  }
}))