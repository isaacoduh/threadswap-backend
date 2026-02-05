import type { Request, Response } from 'express'
import type { ListingStatus } from '@prisma/client'

import * as ListingService from '@/modules/listings/services/listings.service'

function getAuthUserId(req: Request): string | null {
  const r = req as Request & { user?: { userId?: string; id?: string } }
  return r.user?.userId ?? r.user?.id ?? null
}

/**
 * POST /api/v1/listings
 */
export const createListing = async (req: Request, res: Response) => {
  const sellerId = getAuthUserId(req)
  if (!sellerId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : []

  try {
    const listing = await ListingService.createListing({
      sellerId,
      title: String(req.body.title ?? ''),
      description: String(req.body.description ?? ''),
      brand: String(req.body.brand ?? ''),
      category: String(req.body.category ?? ''),
      condition: String(req.body.condition ?? ''),
      size: req.body.size ? String(req.body.size) : null,
      price: req.body.price,
      currency: req.body.currency ? String(req.body.currency) : 'GBP',
      status: req.body.status ? (String(req.body.status) as ListingStatus) : null,
      files,
    })

    return res.status(201).json({ ok: true, listing })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type: statusCode === 400 ? 'validation_error' : 'server_error',
      detail: e.message ?? 'failed to create listing',
    })
  }
}

/**
 * GET /api/v1/listings/:id
 */
export const getListing = async (req: Request, res: Response) => {
  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing listing id' })
  }

  try {
    const listing = await ListingService.getListingById(id)
    return res.status(200).json({ ok: true, listing })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type: statusCode === 404 ? 'not_found' : 'server_error',
      detail: e.message ?? 'Failed to fetch listing',
    })
  }
}

export const updateListing = async (req: Request, res: Response) => {
  const sellerId = getAuthUserId(req)
  if (!sellerId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing listing id' })
  }

  // Build payload WITHOUT undefined keys
  const data: {
    title?: string
    description?: string
    brand?: string
    category?: string
    condition?: string
    size?: string | null
    price?: string | number
    currency?: string
    status?: ListingStatus
  } = {}

  if (req.body.title !== undefined) data.title = String(req.body.title)
  if (req.body.description !== undefined) data.description = String(req.body.description)
  if (req.body.brand !== undefined) data.brand = String(req.body.brand)
  if (req.body.category !== undefined) data.category = String(req.body.category)
  if (req.body.condition !== undefined) data.condition = String(req.body.condition)

  if (req.body.size !== undefined) {
    data.size = req.body.size === null ? null : String(req.body.size)
  }

  if (req.body.price !== undefined) data.price = req.body.price
  if (req.body.currency !== undefined) data.currency = String(req.body.currency)

  if (req.body.status !== undefined) {
    data.status = String(req.body.status) as ListingStatus
  }

  try {
    const listing = await ListingService.updateListing({
      listingId: id,
      sellerId,
      data,
    })

    return res.status(200).json({ ok: true, listing })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type:
        statusCode === 400
          ? 'validation_error'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : 'server_error',
      detail: e.message ?? 'Failed to update listing',
    })
  }
}

export const deleteListing = async (req: Request, res: Response) => {
  const sellerId = getAuthUserId(req)
  if (!sellerId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing listing id' })
  }

  try {
    await ListingService.deleteListing({ listingId: id, sellerId })
    return res.status(200).json({ ok: true })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type:
        statusCode === 400
          ? 'validation_error'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : 'server_error',
      detail: e.message ?? 'Failed to delete listing',
    })
  }
}

export const getListings = async (req: Request, res: Response) => {
  try {
    const q: import('@/modules/listings/services/listings.service').GetListingsQuery = {}

    if (req.query.category !== undefined) q.category = String(req.query.category)
    if (req.query.condition !== undefined) q.condition = String(req.query.condition)
    if (req.query.status !== undefined) q.status = String(req.query.status)
    if (req.query.size !== undefined) q.size = String(req.query.size)
    if (req.query.brand !== undefined) q.brand = String(req.query.brand)
    if (req.query.search !== undefined) q.search = String(req.query.search)

    if (req.query.minPrice !== undefined) {
      const n = Number(req.query.minPrice)
      if (Number.isFinite(n)) q.minPrice = n
    }

    if (req.query.maxPrice !== undefined) {
      const n = Number(req.query.maxPrice)
      if (Number.isFinite(n)) q.maxPrice = n
    }

    if (req.query.page !== undefined) {
      const n = Number(req.query.page)
      if (Number.isFinite(n) && n > 0) q.page = n
    }

    if (req.query.limit !== undefined) {
      const n = Number(req.query.limit)
      if (Number.isFinite(n) && n > 0) q.limit = n
    }

    if (req.query.sortBy !== undefined) {
      const v = String(req.query.sortBy)
      if (v === 'createdAt' || v === 'price' || v === 'title') q.sortBy = v
    }

    if (req.query.sortOrder !== undefined) {
      const v = String(req.query.sortOrder)
      if (v === 'asc' || v === 'desc') q.sortOrder = v
    }

    const result = await ListingService.getListings(q)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type: 'server_error',
      detail: e.message ?? 'Failed to fetch listings',
    })
  }
}

export const getUserListings = async (req: Request, res: Response) => {
  const { userId } = req.params
  if (!userId) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing userId' })
  }

  try {
    const q: import('@/modules/listings/services/listings.service').GetUserListingsQuery = {
      userId,
    }

    if (req.query.status !== undefined) q.status = String(req.query.status)

    if (req.query.page !== undefined) {
      const n = Number(req.query.page)
      if (Number.isFinite(n) && n > 0) q.page = n
    }

    if (req.query.limit !== undefined) {
      const n = Number(req.query.limit)
      if (Number.isFinite(n) && n > 0) q.limit = n
    }

    const result = await ListingService.getUserListings(q)
    return res.status(200).json({ ok: true, ...result })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type: 'server_error',
      detail: e.message ?? 'Failed to fetch user listings',
    })
  }
}

export const uploadListingImages = async (req: Request, res: Response) => {
  const sellerId = getAuthUserId(req)
  if (!sellerId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing listing id' })
  }

  const files = (req.files ?? []) as Express.Multer.File[]

  try {
    const images = await ListingService.uploadListingImages({
      listingId: id,
      sellerId,
      files,
    })

    return res.status(200).json({ ok: true, images })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type:
        statusCode === 400
          ? 'validation_error'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : 'server_error',
      detail: e.message ?? 'Failed to upload images',
    })
  }
}

export const deleteListingImage = async (req: Request, res: Response) => {
  const sellerId = getAuthUserId(req)
  if (!sellerId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id, index } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing listing id' })
  }

  const imageIndex = Number(index)
  if (!Number.isInteger(imageIndex) || imageIndex < 0) {
    return res.status(400).json({ type: 'validation_error', detail: 'Invalid image index' })
  }

  try {
    const images = await ListingService.deleteListingImage({
      listingId: id,
      sellerId,
      index: imageIndex,
    })

    return res.status(200).json({ ok: true, images })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type:
        statusCode === 400
          ? 'validation_error'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : 'server_error',
      detail: e.message ?? 'Failed to delete image',
    })
  }
}

export const updateListingStatus = async (req: Request, res: Response) => {
  const sellerId = getAuthUserId(req)
  if (!sellerId) {
    return res.status(401).json({ type: 'auth_error', detail: 'Unauthorized' })
  }

  const { id } = req.params
  if (!id) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing listing id' })
  }

  // validateBody(updateStatusSchema) should enforce this, but keep it safe:
  const statusRaw = req.body?.status
  if (!statusRaw) {
    return res.status(400).json({ type: 'validation_error', detail: 'Missing status' })
  }

  try {
    const listing = await ListingService.updateListingStatus({
      listingId: id,
      sellerId,
      status: String(statusRaw) as ListingStatus,
    })

    return res.status(200).json({ ok: true, listing })
  } catch (err) {
    const e = err as unknown as { statusCode?: number; message?: string }
    const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500

    return res.status(statusCode).json({
      type:
        statusCode === 400
          ? 'validation_error'
          : statusCode === 403
            ? 'forbidden'
            : statusCode === 404
              ? 'not_found'
              : 'server_error',
      detail: e.message ?? 'Failed to update listing status',
    })
  }
}
