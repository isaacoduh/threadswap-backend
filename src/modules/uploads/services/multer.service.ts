import multer from 'multer'
import os from 'os'
import path from 'path'

const MAX_FILE_SIZE_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024) // 10MB default

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').slice(0, 10)
    const safeExt = ext && ext.startsWith('.') ? ext : ''
    cb(null, `${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`)
  },
})

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['image/', 'application/pdf', 'video/']
  const ok = allowed.some((p) => file.mimetype.startsWith(p)) || file.mimetype === 'application/pdf'

  if (!ok) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`))
  }

  cb(null, true)
}

export const uploadSingle = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter,
}).single('file')
