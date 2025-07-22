import { Router } from 'express'
import { aiWorkflowController } from '../controllers/ai-workflow.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validation.middleware'
import { workflowSchemas } from '../middleware/workflow.validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// AI workflow generation routes
router.post('/generate',
  validate({ body: workflowSchemas.generateWorkflow }),
  aiWorkflowController.generateWorkflow
)

router.post('/explain',
  validate({ body: workflowSchemas.explainWorkflow }),
  aiWorkflowController.explainWorkflow
)

router.post('/optimize',
  validate({ body: workflowSchemas.optimizeWorkflow }),
  aiWorkflowController.optimizeWorkflow
)

router.post('/variations',
  validate({ body: workflowSchemas.generateVariations }),
  aiWorkflowController.generateVariations
)

// AI usage statistics
router.get('/usage', aiWorkflowController.getAIUsage)

export { router as aiWorkflowRoutes }