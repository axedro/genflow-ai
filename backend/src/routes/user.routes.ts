import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validation.middleware'
import { z } from 'zod'

const router = Router()

// All user routes require authentication
router.use(authenticate)

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
  language: z.enum(['es', 'en']).optional(),
  timezone: z.string().optional()
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number')
})

const deleteAccountSchema = z.object({
  password: z.string().min(1)
})

router.get('/profile', userController.getProfile)
router.put('/profile', 
  validate({ body: updateProfileSchema }),
  userController.updateProfile
)
router.post('/change-password',
  validate({ body: changePasswordSchema }),
  userController.changePassword
)
router.delete('/account',
  validate({ body: deleteAccountSchema }),
  userController.deleteAccount
)

export { router as userRoutes }