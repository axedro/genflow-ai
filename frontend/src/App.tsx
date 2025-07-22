import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'

// Components
import { AuthGuard } from './components/auth/AuthGuard'
import { Layout } from './components/layout/Layout'

// Placeholder pages for navigation
const WorkflowsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Workflows</h2>
    <p className="text-gray-600">Esta página se implementará en el Sprint 2</p>
  </div>
)

const IntegrationsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Integraciones</h2>
    <p className="text-gray-600">Esta página se implementará en el Sprint 2</p>
  </div>
)

const AnalyticsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics</h2>
    <p className="text-gray-600">Esta página se implementará en el Sprint 3</p>
  </div>
)

const SettingsPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuración</h2>
    <p className="text-gray-600">Esta página se implementará en el Sprint 2</p>
  </div>
)

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Layout>
                  <DashboardPage />
                </Layout>
              </AuthGuard>
            }
          />
          
          <Route
            path="/workflows"
            element={
              <AuthGuard>
                <Layout>
                  <WorkflowsPage />
                </Layout>
              </AuthGuard>
            }
          />
          
          <Route
            path="/integrations"
            element={
              <AuthGuard>
                <Layout>
                  <IntegrationsPage />
                </Layout>
              </AuthGuard>
            }
          />
          
          <Route
            path="/analytics"
            element={
              <AuthGuard>
                <Layout>
                  <AnalyticsPage />
                </Layout>
              </AuthGuard>
            }
          />
          
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <Layout>
                  <SettingsPage />
                </Layout>
              </AuthGuard>
            }
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App