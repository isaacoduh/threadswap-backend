import { Router } from 'express';
import {prisma} from "@db/prisma";

export const readyRouter = Router();

/**
 * Readiness: process + critical dependencies are ready.
 * This checks DB connectivity.
 */
readyRouter.get('/', async (_req, res) => {
    try {
        // minimal, fast db check
        await prisma.$queryRaw`SELECT 1`
        return res.status(200).json({ok: true, db: "up"});
    } catch(err){
        // Don’t leak internals;
        return res.status(503).json({ ok: false, db: "down" });
    }
})