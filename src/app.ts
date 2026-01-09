import express from "express"
import cors from "cors"
import helmet from "helmet"
import compression from "compression"
import morgan from "morgan"
import {notFoundHandler, errorHandler} from "@/middleware/error.middleware";
import { sessionMiddleware } from "./middleware/session.middleware"

import {healthRouter} from "@/routes/health.routes";
import {readyRouter} from "@/routes/ready.routes";

import {authRouter} from "@/modules/auth/routes/auth.routes"
import { uploadsRouter } from "./modules/uploads/routes/upload.routes"

import { enqueueExampleJob } from "@/modules/jobs/queues/example.queue";


export function createApp() {
    const app = express()
    // Trust proxy if running behind load balancers / reverse proxies (common in prod)
    // Set via env if you prefer; this is safe default for cloud deployments.
    app.set("trust proxy", 1);

    // security headers
    app.use(helmet())

    // CORS
    // In production, lock down origin(s) via CORS_ORIGIN env: "https://a.com,https://b.com"
    const corsOrigin = process.env.CORS_ORIGIN?.split(",").map(
        s =>s.trim()
    ).filter(Boolean);

    app.use(cors({
        origin: corsOrigin?.length ? corsOrigin : true,
        credentials: true
    }));

    app.use(express.json({limit: "10mb"}));
    app.use(express.urlencoded({ extended: true }));

    app.use(sessionMiddleware());

    // compression
    app.use(compression());

    // HTTP request logging
    // use "combined" in production for richer logs
    app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

    // routes
    app.use("/health", healthRouter);
    app.use("/health/ready", readyRouter);
    app.use("/auth", authRouter);
    app.use("/uploads", uploadsRouter);


    // 404 + error handler
    app.use(notFoundHandler)
    app.use(errorHandler);


    return app;

}