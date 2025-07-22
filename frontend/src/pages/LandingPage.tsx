import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { 
  Bot, 
  Zap, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Workflow
} from 'lucide-react'

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: Bot,
      title: 'IA Generativa en Español',
      description: 'Crea workflows automáticamente describiendo tu proceso en español'
    },
    {
      icon: Zap,
      title: 'Integraciones Nativas',
      description: 'Conecta Gmail, WhatsApp, Sheets y herramientas populares en España'
    },
    {
      icon: Clock,
      title: 'Ahorro de Tiempo',
      description: 'Automatiza tareas repetitivas y ahorra 10+ horas semanales'
    },
    {
      icon: TrendingUp,
      title: 'ROI Inmediato',
      description: 'Ve el retorno de inversión desde el primer workflow automatizado'
    }
  ]

  const benefits = [
    'Setup en menos de 5 minutos',
    'Sin conocimientos técnicos requeridos',
    'Soporte en español 24/7',
    'Cumplimiento RGPD automático',
    'Templates específicos para PYMEs españolas',
    'Integraciones con software español'
  ]

  const useCases = [
    {
      title: 'Clínicas Dentales',
      description: 'Automatiza recordatorios de citas, seguimiento post-consulta y gestión de pagos',
      workflows: ['Recordatorio de citas', 'Encuestas de satisfacción', 'Gestión de impagos']
    },
    {
      title: 'Agencias de Marketing',
      description: 'Automatiza reportes de clientes, lead nurturing y facturación',
      workflows: ['Reportes automáticos', 'Seguimiento de leads', 'Onboarding clientes']
    },
    {
      title: 'Comercio Online',
      description: 'Automatiza gestión de pedidos, atención al cliente y marketing',
      workflows: ['Procesamiento pedidos', 'Soporte automático', 'Email marketing']
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">GenFlow AI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="primary">Ir al Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline">Iniciar Sesión</Button>
                  </Link>
                  <Link to="/register">
                    <Button variant="primary">Empezar Gratis</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Automatización con IA para
              <span className="text-primary-600 block">PYMEs Españolas</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              La primera plataforma que habla tu idioma. Crea workflows de automatización 
              simplemente describiendo lo que necesitas en español.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Empezar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Ver Demo
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Sin tarjeta de crédito • Setup en 5 minutos • Soporte en español
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¿Por qué GenFlow AI?
            </h2>
            <p className="text-xl text-gray-600">
              Diseñado específicamente para las necesidades de las PYMEs españolas
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <div className="p-3 bg-primary-100 rounded-lg w-fit mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Casos de Uso Reales
            </h2>
            <p className="text-xl text-gray-600">
              Descubre cómo empresas como la tuya están automatizando sus procesos
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <Card key={index}>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {useCase.description}
                </p>
                <div className="space-y-2">
                  {useCase.workflows.map((workflow, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <Workflow className="h-4 w-4 text-primary-600 mr-2" />
                      {workflow}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Todo lo que necesitas para automatizar tu negocio
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Empieza Hoy Mismo
                </h3>
                <p className="text-gray-600 mb-6">
                  Únete a cientos de PYMEs que ya están automatizando con GenFlow AI
                </p>
                <Link to="/register">
                  <Button variant="primary" size="lg" className="w-full">
                    Crear Cuenta Gratuita
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-3">
                  Plan gratuito para siempre • No se requiere tarjeta
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Listo para automatizar tu negocio?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Crea tu primer workflow con IA en menos de 5 minutos
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Empezar Ahora Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-4">GenFlow AI</h3>
            <p className="text-gray-400 mb-6">
              Automatización inteligente para PYMEs españolas
            </p>
            <div className="flex justify-center space-x-6 text-sm text-gray-400">
              <a href="/terms" className="hover:text-white">Términos de Servicio</a>
              <a href="/privacy" className="hover:text-white">Política de Privacidad</a>
              <a href="/contact" className="hover:text-white">Contacto</a>
            </div>
            <p className="text-gray-500 text-sm mt-6">
              © 2025 GenFlow AI. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}