import React, { useState } from 'react'
import { WorkflowList } from '../../components/workflows/WorkflowList'
import { AIWorkflowGenerator } from '../../components/workflows/AIWorkflowGenerator'
import { TemplateMarketplace } from '../../components/workflows/TemplateMarketplace'
import { VisualWorkflowBuilder } from '../../components/workflows/VisualWorkflowBuilder'
import { useWorkflowStore } from '../../stores/workflowStore'
import { AIGeneratedWorkflow } from '../../services/workflow.types'

type ViewMode = 'list' | 'ai-generator' | 'templates' | 'builder'

export const WorkflowsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const { createFromAI } = useWorkflowStore()

  const handleCreateWithAI = () => {
    setViewMode('ai-generator')
  }

  const handleCreateManual = () => {
    setViewMode('builder')
  }

  const handleBrowseTemplates = () => {
    setViewMode('templates')
  }

  const handleWorkflowGenerated = (aiWorkflow: AIGeneratedWorkflow) => {
    createFromAI(aiWorkflow)
    setViewMode('builder')
  }

  const handleTemplateInstalled = (workflowId: string) => {
    setViewMode('list')
    // Could navigate to the specific workflow here
  }

  const handleBackToList = () => {
    setViewMode('list')
  }

  const renderCurrentView = () => {
    switch (viewMode) {
      case 'ai-generator':
        return (
          <AIWorkflowGenerator
            onWorkflowGenerated={handleWorkflowGenerated}
            onClose={handleBackToList}
          />
        )

      case 'templates':
        return (
          <TemplateMarketplace
            onTemplateInstalled={handleTemplateInstalled}
            onClose={handleBackToList}
          />
        )

      case 'builder':
        return (
          <VisualWorkflowBuilder
            onClose={handleBackToList}
          />
        )

      default:
        return (
          <WorkflowList
            onCreateNew={handleCreateManual}
            onCreateWithAI={handleCreateWithAI}
          />
        )
    }
  }

  return (
    <div className="min-h-screen">
      {renderCurrentView()}
    </div>
  )
}