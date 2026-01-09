import { Router } from 'express'
import { authRouter } from '@/modules/auth/routes/auth.routes'
import { uploadsRouter } from '@/modules/uploads/routes/uploads.routes'

export const apiV1Router = Router()

apiV1Router.use('/auth', authRouter)
apiV1Router.use('/uploads', uploadsRouter)
