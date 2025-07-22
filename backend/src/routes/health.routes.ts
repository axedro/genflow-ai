import { Router } from 'express'
import { healthController } from '../controllers/health.controller'

const router = Router()

// Health check endpoints
router.get('/health', healthController.getHealth)
router.get('/ready', healthController.getReadiness)
router.get('/live', healthController.getLiveness)
router.get('/metrics', healthController.getMetrics)

export { router as healthRoutes }