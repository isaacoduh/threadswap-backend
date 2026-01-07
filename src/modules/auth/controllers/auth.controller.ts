import type {Request, Response} from 'express'
import * as AuthService from '../services/auth.service'
import {prisma} from "@db/prisma"
import type {AuthenticatedRequest} from "@/middleware/auth.middleware"

export async function register(req: Request, res: Response) {
    const email = String(req.body?.email ?? "")
    const password = String(req.body?.password ?? "")

    const result = await AuthService.register(email, password);
    return res.status(result.status).json(result.body)
}

export async function login(req: Request, res: Response) {
    const email = String(req.body?.email ?? "");
    const password = String(req.body?.password ?? "");

    const result = await AuthService.login(email, password)
    return res.status(result.status).json(result.body)
}

export async function me(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
        where: {id: userId},
        select: {id: true, email: true, createdAt: true}
    })

    return res.json({user})
}