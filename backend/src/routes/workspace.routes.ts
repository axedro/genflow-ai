import { Router } from 'express'
import { workspaceController } from '../controllers/workspace.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { validate, workspaceSchemas } from '../middleware/validation.middleware'
import { z } from 'zod'

const router = Router()

// All workspace routes require authentication
router.use(authenticate)

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['USER', 'ADMIN']).default('USER')
})

router.get('/', workspaceController.getWorkspace)
router.get('/stats', workspaceController.getWorkspaceStats)

router.put('/',
  requireRole(['OWNER', 'ADMIN']),
  validate({ body: workspaceSchemas.update }),
  workspaceController.updateWorkspace
)

router.post('/invite',
  requireRole(['OWNER', 'ADMIN']),
  validate({ body: inviteUserSchema }),
  workspaceController.inviteUser
)

export { router as workspaceRoutes }