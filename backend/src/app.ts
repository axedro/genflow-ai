import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { env } from './config/environment'
import { logger } from './utils/logger'

// Import routes
import { authRoutes } from './routes/auth.routes'
import { userRoutes } from './routes/user.routes'
import { workspaceRoutes } from './routes/workspace.routes'
import { healthRoutes } from './routes/health.routes'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error.middleware'

const app = express()

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? ['https://genflow.ai', 'https://app.genflow.ai'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}))

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }))
}

// Health check routes (should be first)
app.use('/', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/workspace', workspaceRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'GenFlow AI API',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString()
  })
})

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'GenFlow AI API v1',
    documentation: '/api/docs',
    health: '/health',
    version: '1.0.0'
  })
})

// 404 handler
app.use(notFoundHandler)

// Global error handler (must be last)
app.use(errorHandler)

export { app }