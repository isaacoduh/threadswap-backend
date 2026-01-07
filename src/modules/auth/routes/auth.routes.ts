import {Router} from 'express'
import * as AuthController from '../controllers/auth.controller'
import {requireAuth} from '@/middleware/auth.middleware'

export const authRouter = Router();

authRouter.post("/register", AuthController.register);
authRouter.post("/login", AuthController.login);
authRouter.get('/me', requireAuth, AuthController.me);