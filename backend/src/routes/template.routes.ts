import { Router } from 'express'
import { templateController } from '../controllers/template.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validation.middleware'
import { z } from 'zod'

const router = Router()

// Template validation schemas
const installTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional()
})

const rateTemplateSchema = z.object({
  rating: z.number().min(1).max(5)
})

const templateQuerySchema = z.object({
  category: z.string().max(50).optional(),
  industry: z.string().max(50).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  q: z.string().min(2).optional()
})

// Public template routes (no auth required for browsing)
router.get('/',
  validate({ query: templateQuerySchema }),
  templateController.getTemplates
)

router.get('/popular',
  validate({ query: templateQuerySchema }),
  templateController.getPopularTemplates
)

router.get('/search',
  validate({ query: templateQuerySchema }),
  templateController.searchTemplates
)

router.get('/category/:category',
  validate({ query: templateQuerySchema }),
  templateController.getTemplatesByCategory
)

// Protected template routes (require authentication)
router.use(authenticate)

router.post('/:id/install',
  validate({ body: installTemplateSchema }),
  templateController.installTemplate
)

router.post('/:id/rate',
  validate({ body: rateTemplateSchema }),
  templateController.rateTemplate
)

export { router as templateRoutes }