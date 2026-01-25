import multer from 'multer'
import os from 'os'
import path from 'path'
import type { Request } from 'express'

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024) // 10MB default
const LISTING_MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default

const LISTING_MAX_FILES = Number(process.env.MAX_FILES_PER_LISTING) || 8

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10)
    const safeExt = ext && ext.startsWith('.') ? ext : ''
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`)
  },
})

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['image/', 'application/pdf', 'video/']
  const ok = allowed.some((p) => file.mimetype.startsWith(p)) || file.mimetype === 'application/pdf'

  if (!ok) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`))
  }

  cb(null, true)
}

const listingImageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (allowed.includes(file.mimetype)) return cb(null, true)
  cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'))
}

export const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
}).single('file')

export const uploadListingImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: LISTING_MAX_FILE_SIZE,
    files: LISTING_MAX_FILES,
  },
  fileFilter: listingImageFileFilter,
}).array('images', LISTING_MAX_FILES)
