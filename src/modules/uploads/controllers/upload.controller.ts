import type {Request, Response} from 'express'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import { uploadFileFromPath } from '../services/s3.service'


function buildPublicUrl(key: string) {
    const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return base ? `${base}/${key}`: null;
}

export async function uploadSingleToS3(req: Request, res: Response){
    if(!req.file){
        return res.status(400).json({
            type: "validation_error",
            detail: "Missing file field: file"
        })
    }

    const ext = path.extname(req.file.originalname || "").slice(0, 10)
    const key = `uploads/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}${ext}`

    try {
        const result = await uploadFileFromPath({
            key,
            filePath: req.file.path,
            contentType: req.file.mimetype
        })

        return res.status(201).json({
            ok: true,
            file: {
                bucket: result.bucket,
                key: result.key,
                etag: result.etag,
                contentType: req.file.mimetype,
                size: req.file.size,
                url: buildPublicUrl(result.key)
            }
        });

    } finally {
        await fs.unlink(req.file.path).catch(() => undefined)
    }
}