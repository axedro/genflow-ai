import { Router } from 'express'
import { workflowController } from '../controllers/workflow.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validation.middleware'
import { workflowSchemas } from '../middleware/workflow.validation'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Workflow CRUD routes
router.get('/',
  validate({ query: workflowSchemas.listWorkflows }),
  workflowController.getWorkflows
)

router.post('/',
  validate({ body: workflowSchemas.createWorkflow }),
  workflowController.createWorkflow
)

router.get('/stats', workflowController.getWorkflowStats)

router.get('/:id', workflowController.getWorkflow)

router.put('/:id',
  validate({ body: workflowSchemas.updateWorkflow }),
  workflowController.updateWorkflow
)

router.delete('/:id',
  requireRole(['OWNER', 'ADMIN']),
  workflowController.deleteWorkflow
)

router.post('/:id/duplicate',
  validate({ body: workflowSchemas.duplicateWorkflow }),
  workflowController.duplicateWorkflow
)

export { router as workflowRoutes }