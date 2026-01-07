import type {NextFunction, Request, Response} from "express";
import {verifyAccessToken} from "@modules/auth/services/token.service.";

export type AuthenticatedRequest = Request & {
    user?: {id: string; email: string};
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if(!header || !header.startsWith("Bearer ")) {
        return res.status(401).send({type: "auth_error", detail: "Missing Bearer token"})
    }

    const token = header.slice("Bearer ".length).trim();
    try{
        const payload = verifyAccessToken(token);
        req.user = {id: payload.sub, email: payload.email};
        return next();
    } catch {
        return res.status(401).json({
            type: "auth_error",
            detail: "Invalid or expired token"
        })
    }
}