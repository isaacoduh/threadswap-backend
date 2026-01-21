import type { Response, Request, NextFunction } from 'express';
import { Router } from 'express'
import { sendEmail } from '@/common/email/email.service'

export const emailTestRouter = Router()

emailTestRouter.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const to = String(req.body?.to ?? '')
    if (!to) return res.status(400).json({ message: '`to` is required' })

    const result = await sendEmail({
      to,
      subject: 'Mailtrap test',
      text: 'If you see this in Mailtrap, SMTP is wired correctly',
    })

    return res.json({ ok: true, result })
  } catch (err) {
    return next
  }
})
