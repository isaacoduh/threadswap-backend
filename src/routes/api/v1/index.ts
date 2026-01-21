import { Router } from 'express'
import { authRouter } from '@/modules/auth/routes/auth.routes'
import { uploadsRouter } from '@/modules/uploads/routes/uploads.routes'
import { emailTestRouter } from './email.test.routes'
export const apiV1Router = Router()

apiV1Router.use('/email', emailTestRouter)
apiV1Router.use('/auth', authRouter)
apiV1Router.use('/uploads', uploadsRouter)
