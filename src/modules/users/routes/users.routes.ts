import { Router } from 'express'
import { requireAuth } from '@/middleware/auth.middleware'
import { validateBody } from '@/common/validation/validation.middleware'

import { patchUserProfileSchema } from '@/modules/users/validators/user.validator'
import { getUserProfile, patchUserProfile } from '@/modules/users/controllers/users.controller'
import { uploadAvatar } from '@/modules/users/controllers/users.controller'
import { uploadAvatarImage, handleMulterError } from '@/modules/uploads/services/multer.service'

const router = Router()

// Public
router.get('/:id', getUserProfile)

// Protected
router.patch('/:id', requireAuth, validateBody(patchUserProfileSchema), patchUserProfile)
router.post('/:id/avatar', requireAuth, uploadAvatarImage, handleMulterError, uploadAvatar)
export default router
