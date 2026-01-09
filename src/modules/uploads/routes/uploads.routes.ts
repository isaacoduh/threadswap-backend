import { Router } from "express";
import { uploadSingle } from "../services/multer.service";
import { uploadSingleToS3 } from "../controllers/uploads.controller";
import { requireAuth } from "@/middleware/auth.middleware";

export const uploadsRouter = Router()

/**
 * POST /uploads/single
 * multipart/form-data with field name "file"
 */
uploadsRouter.post("/single", uploadSingle, uploadSingleToS3);