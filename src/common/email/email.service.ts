import nodemailer from 'nodemailer'
import { logger } from '../logging/logger'

type SendEmailInput = {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST ?? ''
  const port = Number(process.env.SMTP_PORT ?? 2525)
  const secure = (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true'
  const user = process.env.SMTP_USER ?? ''
  const pass = process.env.SMTP_PASS ?? ''

  if (!host || !user || !pass) {
    throw new Error('SMTP config incomplete: set SMTP_HOST/SMTP_USER/SMTP_PASS')
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
  return transporter
}

export async function sendEmail(input: SendEmailInput) {
  const enabled = (process.env.EMAIL_ENABLED ?? 'false').toLowerCase() === 'true'
  if (!enabled) {
    logger.warn('email_send_skipped_disabled', { to: input.to, subject: input.subject })
    return { messageId: 'disabled' }
  }

  const from = process.env.EMAIL_FROM ?? ''
  if (!from) throw new Error('EMAIL_FROM is required')

  const t = getTransporter()
  const to = Array.isArray(input.to) ? input.to.join(',') : input.to

  const info = await t.sendMail({
    from,
    to,
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  })

  logger.info('email_sent', {
    messageId: info.messageId,
    to,
    subject: input.subject,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  })
  return { messageId: info.messageId }
}
