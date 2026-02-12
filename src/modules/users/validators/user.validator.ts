import { z } from 'zod'

const usernameSchema = z
  .string()
  .transform((v) => v.trim())
  .refine((v) => v.length >= 3 && v.length <= 30, 'Username must be 3-30 chars')
  .refine((v) => /^[a-z0-9_]+$/i.test(v), 'Username can only contain letters, numbers, underscore')
  .transform((v) => v.toLowerCase())

export const patchUserProfileSchema = z.object({
  username: usernameSchema.optional(),

  displayName: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length >= 1 && v.length <= 80, 'Display name must be 1-80 chars')
    .optional(),

  bio: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length <= 2000, 'Bio must be <= 2000 chars')
    .optional(),

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
