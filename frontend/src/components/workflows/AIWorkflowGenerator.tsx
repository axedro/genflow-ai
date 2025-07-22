import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { workflowService } from '../../services/workflow.service'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card, CardHeader } from '../ui/Card'
import { 
  Bot, 
  Sparkles, 
  Clock, 
  TrendingUp,
  Lightbulb,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { AIGeneratedWorkflow } from '../../services/workflow.types'

const generateSchema = z.object({
  prompt: z.string()
    .min(10, 'Describe tu proceso con al menos 10 caracteres')
    .max(1000, 'Máximo 1000 caracteres'),
  industry: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).optional()
})

type GenerateFormData = z.infer<typeof generateSchema>

interface AIWorkflowGeneratorProps {
  onWorkflowGenerated: (workflow: AIGeneratedWorkflow) => void
  onClose?: () => void
}

const industries = [
  'Consultoría',
  'Comercio',
  'Servicios',
  'Tecnología',
  'Salud',
  'Educación',
  'Hostelería',
  'Construcción',
  'Otros'
]

const examplePrompts = [
  'Enviar recordatorios automáticos a clientes con facturas vencidas',
  'Hacer backup semanal de documentos importantes en Drive',
  'Secuencia de bienvenida para nuevos clientes con emails y WhatsApp',
  'Notificar al equipo cuando llegue un nuevo pedido online',
  'Programar citas automáticamente según disponibilidad del calendario'
]

export const AIWorkflowGenerator: React.FC<AIWorkflowGeneratorProps> = ({
  onWorkflowGenerated,
  onClose
}) => {
  const { workspace } = useAuth()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWorkflow, setGeneratedWorkflow] = useState<AIGeneratedWorkflow | null>(null)
  const [aiUsage, setAiUsage] = useState<{
    currentUsage: number
    limit: number
    remaining: number
  } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<GenerateFormData>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      industry: workspace?.industry || '',
      complexity: 'medium'
    }
  })

  const promptValue = watch('prompt')

  React.useEffect(() => {
    // Load AI usage on component mount
    const loadAIUsage = async () => {
      try {
        const usage = await workflowService.getAIUsage()
        setAiUsage(usage)
      } catch (error) {
        console.error('Failed to load AI usage:', error)
      }
    }

    loadAIUsage()
  }, [])

  const onSubmit = async (data: GenerateFormData) => {
    if (aiUsage && aiUsage.remaining <= 0) {
      toast.error('Has alcanzado tu límite de generaciones de IA este mes')
      return
    }

    setIsGenerating(true)
    try {
      const result = await workflowService.generateWorkflow({
        prompt: data.prompt,
        industry: data.industry,
        complexity: data.complexity,
        currentTools: ['gmail', 'sheets', 'whatsapp', 'drive'] // Default tools
      })

      setGeneratedWorkflow(result)
      
      // Update AI usage
      if (aiUsage) {
        setAiUsage({
          ...aiUsage,
          currentUsage: aiUsage.currentUsage + 1,
          remaining: aiUsage.remaining - 1
        })
      }

      toast.success('¡Workflow generado exitosamente!')
    } catch (error: any) {
      toast.error(error.message || 'Error al generar el workflow')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseWorkflow = () => {
    if (generatedWorkflow) {
      onWorkflowGenerated(generatedWorkflow)
      setGeneratedWorkflow(null)
    }
  }

  const handleGenerateVariation = async () => {
    if (!generatedWorkflow) return

    setIsGenerating(true)
    try {
      const variations = await workflowService.generateVariations(generatedWorkflow, 1)
      if (variations.length > 0) {
        setGeneratedWorkflow(variations[0])
        toast.success('Nueva variación generada')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al generar variación')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-primary-100 rounded-full">
            <Bot className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generador de Workflows con IA
        </h1>
        <p className="text-lg text-gray-600">
          Describe tu proceso en español y la IA creará el workflow automáticamente
        </p>
        
        {/* AI Usage Indicator */}
        {aiUsage && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
              <Sparkles className="h-4 w-4" />
              <span>
                {aiUsage.remaining} generaciones restantes este mes 
                ({aiUsage.currentUsage}/{aiUsage.limit})
              </span>
            </div>
          </div>
        )}
      </div>

      {!generatedWorkflow ? (
        /* Generation Form */
        <Card className="mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe el proceso que quieres automatizar
              </label>
              <textarea
                {...register('prompt')}
                className="input min-h-[120px] resize-none"
                placeholder="Ejemplo: Quiero enviar un email automático a clientes cuando no han pagado una factura después de 30 días..."
                rows={5}
              />
              {errors.prompt && (
                <p className="text-sm text-red-600 mt-1">{errors.prompt.message}</p>
              )}
              <div className="mt-2 text-sm text-gray-500">
                {promptValue?.length || 0}/1000 caracteres
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sector (Opcional)
                </label>
                <select
                  {...register('industry')}
                  className="input"
                >
                  <option value="">Selecciona tu sector</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complejidad
                </label>
                <select
                  {...register('complexity')}
                  className="input"
                >
                  <option value="simple">Simple (1-3 pasos)</option>
                  <option value="medium">Medio (4-7 pasos)</option>
                  <option value="complex">Complejo (8+ pasos)</option>
                </select>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isGenerating}
              className="w-full"
              disabled={aiUsage?.remaining === 0}
            >
              <Bot className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando Workflow...' : 'Generar con IA'}
            </Button>
          </form>
        </Card>
      ) : (
        /* Generated Workflow Display */
        <div className="space-y-6">
          <Card>
            <CardHeader 
              title={generatedWorkflow.metadata.name}
              subtitle={`Confianza de IA: ${Math.round(generatedWorkflow.confidence * 100)}%`}
            />
            
            <div className="space-y-4">
              <p className="text-gray-700">{generatedWorkflow.metadata.description}</p>
              
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium text-green-800">Tiempo Estimado</div>
                    <div className="text-sm text-green-600">{generatedWorkflow.metadata.estimatedTime}s</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium text-blue-800">Ahorro Semanal</div>
                    <div className="text-sm text-blue-600">{generatedWorkflow.estimatedSavings} min</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-sm font-medium text-purple-800">Complejidad</div>
                    <div className="text-sm text-purple-600 capitalize">{generatedWorkflow.metadata.complexity}</div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">¿Cómo funciona?</h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {generatedWorkflow.explanation}
                </p>
              </div>

              {/* Required Integrations */}
              {generatedWorkflow.requiredIntegrations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Integraciones Necesarias:</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedWorkflow.requiredIntegrations.map((integration) => (
                      <span
                        key={integration}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Categorías:</h4>
                <div className="flex flex-wrap gap-2">
                  {generatedWorkflow.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleUseWorkflow}
              className="flex-1"
            >
              <ArrowRight className="h-5 w-5 mr-2" />
              Usar este Workflow
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleGenerateVariation}
              loading={isGenerating}
              className="flex-1"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Generar Variación
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setGeneratedWorkflow(null)}
            >
              Generar Nuevo
            </Button>
          </div>
        </div>
      )}

      {/* Example Prompts */}
      {!generatedWorkflow && (
        <Card>
          <CardHeader 
            title="Ideas para empezar"
            subtitle="Haz clic en cualquier ejemplo para usarlo"
          />
          <div className="space-y-2">
            {examplePrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setValue('prompt', prompt)}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-700">{prompt}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}