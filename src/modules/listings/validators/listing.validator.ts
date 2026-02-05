import { z } from 'zod'
import { Category, Condition, ListingStatus } from '@prisma/client'

/**
 * Helpers
 */
const trimOrUndefined = (v: unknown) => {
  if (v === null || v === undefined) return undefined
  const s = String(v).trim()
  return s.length ? s : undefined
}

const toNumberOrUndefined = (v: unknown) => {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/**
 * Create listing (multipart/form-data)
 *
 */
export const createListingSchema = z.object({
  title: z.preprocess((v) => String(v ?? '').trim(), z.string().min(3).max(100)),
  description: z.preprocess((v) => String(v ?? '').trim(), z.string().min(10).max(2000)),
  price: z.preprocess((v) => v ?? '', z.coerce.number().positive().max(100000)),
  category: z.nativeEnum(Category),
  size: z.preprocess((v) => String(v ?? '').trim(), z.string().min(1).max(20)),
  brand: z.preprocess((v) => {
    const s = String(v ?? '').trim()
    return s.length ? s : undefined
  }, z.string().max(30).optional()),
  status: z.nativeEnum(ListingStatus).optional().default(ListingStatus.ACTIVE),
})

export const updateListingSchema = z.object({
  title: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().min(3).max(100).optional()),
  description: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().min(10).max(2000).optional()),
  price: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : v),
    z.coerce.number().positive().max(100000).optional()
  ),
  category: z.nativeEnum(Category).optional(),
  size: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().max(50).optional()),
  condition: z.nativeEnum(Condition).optional(),
  color: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().max(30).optional()),
  status: z.nativeEnum(ListingStatus).optional(),
})

export const listingFiltersSchema = z.object({
  category: z.nativeEnum(Category).optional(),
  condition: z.nativeEnum(Condition).optional(),

  minPrice: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : v),
    z.coerce.number().positive().optional()
  ),
  maxPrice: z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : v),
    z.coerce.number().positive().optional()
  ),
  size: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().optional()),
  brand: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().optional()),
  search: z.preprocess((v) => {
    if (v === undefined) return undefined
    const s = String(v).trim()
    return s.length ? s : undefined
  }, z.string().optional()),
  status: z.nativeEnum(ListingStatus).optional().default(ListingStatus.ACTIVE),

  sortBy: z.enum(['created_at', 'price', 'title']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),

  page: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : v),
      z.coerce.number().int().positive().optional()
    )
    .default(1),

  limit: z
    .preprocess(
      (v) => (v === undefined || v === '' ? undefined : v),
      z.coerce.number().int().positive().optional()
    )
    .default(20),
})

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ListingStatus),
})
