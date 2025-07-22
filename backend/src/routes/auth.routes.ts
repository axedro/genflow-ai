import { Router } from 'express'
import { authController } from '../controllers/auth.controller'
import { validate, authSchemas } from '../middleware/validation.middleware'
import { authenticate, authRateLimit } from '../middleware/auth.middleware'

const router = Router()

// Public routes with rate limiting
const isTestEnv = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

router.post('/register', 
  (isTestEnv || isDevelopment) ? (req, res, next) => next() : authRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  validate({ body: authSchemas.register }),
  authController.register
)

router.post('/login',
  (isTestEnv || isDevelopment) ? (req, res, next) => next() : authRateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  validate({ body: authSchemas.login }),
  authController.login
)

router.post('/forgot-password',
  isTestEnv ? (req, res, next) => next() : authRateLimit(60 * 60 * 1000, 3), // 3 attempts per hour
  validate({ body: authSchemas.forgotPassword }),
  authController.forgotPassword
)

router.post('/reset-password',
  isTestEnv ? (req, res, next) => next() : authRateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  validate({ body: authSchemas.resetPassword }),
  authController.resetPassword
)

// Protected routes
router.post('/logout', authenticate, authController.logout)
router.post('/refresh-token', authenticate, authController.refreshToken)
router.get('/me', authenticate, authController.me)

export { router as authRoutes }