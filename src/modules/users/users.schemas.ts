import { z } from 'zod'

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
})

export const patchUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/i)
    .optional(),
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(2000).optional(),

  socials: z
    .object({
      website: z.string().url().optional(),
      instagram: z.string().max(80).optional(),
      twitter: z.string().max(80).optional(),
      tiktok: z.string().max(80).optional(),
      youtube: z.string().max(80).optional(),
    })
    .partial()
    .optional(),
})
