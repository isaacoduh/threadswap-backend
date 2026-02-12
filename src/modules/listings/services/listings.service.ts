/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import path from 'path'
import fs from 'fs/promises'
import type { Category, Condition } from '@prisma/client';
import { ListingStatus, TransactionStatus, Prisma } from '@prisma/client'
import { prisma } from '@/db/prisma'

import { uploadFileFromPath, deleteObject } from '@/modules/uploads/services/s3.service'

const MAX_IMAGES = Number(process.env.MAX_FILES_PER_LISTING ?? 8)

const allowedTransitions: Record<ListingStatus, ListingStatus[]> = {
  DRAFT: [ListingStatus.ACTIVE, ListingStatus.ARCHIVED, ListingStatus.REMOVED],
  ACTIVE: [ListingStatus.DRAFT, ListingStatus.SOLD, ListingStatus.ARCHIVED, ListingStatus.REMOVED],
  SOLD: [ListingStatus.ARCHIVED, ListingStatus.REMOVED],
  ARCHIVED: [ListingStatus.ACTIVE, ListingStatus.REMOVED],
  REMOVED: [], // terminal
}

export type CreateListingInput = {
  sellerId: string
  title: string
  description: string
  brand: string
  category: Category
  condition: Condition
  size?: string | null
  price: string | number
  currency?: string | null
  status?: ListingStatus | null
  files: Express.Multer.File[]
}

export type UpdateListingInput = {
  listingId: string
  sellerId: string
  data: {
    title?: string
    description?: string
    brand?: string
    category?: string
    condition?: string
    size?: string | null
    price?: string | number
    currency?: string
    status?: ListingStatus
  }
}

function todayPrefix() {
  return new Date().toISOString().slice(0, 10)
}

function buildImageResponse(key: string) {
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '')
  return {
    key,
    url: base ? `${base}/${key}` : null,
  }
}

function makeListingImageKey(originalname: string) {
  const ext = path.extname(originalname || '').slice(0, 10)
  return `listings/${todayPrefix()}/${crypto.randomUUID()}${ext}`
}

export async function createListing(input: CreateListingInput) {
  const {
    sellerId,
    title,
    description,
    brand,
    category,
    condition,
    size,
    price,
    currency,
    status,
    files,
  } = input

  if (!files.length) {
    const err = new Error('At least one image is required')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const uploadedKeys: string[] = []
  const imageKeys: string[] = []

  try {
    // 1) Upload images
    for (const file of files) {
      const ext = path.extname(file.originalname || '').slice(0, 10)
      const key = `listings/${todayPrefix()}/${crypto.randomUUID()}${ext}`

      await uploadFileFromPath({
        key,
        filePath: file.path,
        contentType: file.mimetype,
      })

      uploadedKeys.push(key)
      imageKeys.push(key)

      await fs.unlink(file.path).catch(() => undefined)
    }

    // 2) Create listing
    const listing = await prisma.listing.create({
      data: {
        sellerId,
        title,
        description,
        brand,
        category,
        condition,
        size: size ?? null,
        price: new Prisma.Decimal(String(price)),
        currency: currency ?? 'GBP',
        status: status ?? ListingStatus.DRAFT,
        images: imageKeys,
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    })

    return {
      ...listing,
      images: listing.images.map(buildImageResponse),
    }
  } catch (err) {
    console.log('[listings.service.createListing] error', err)

    // rollback S3 uploads best-effort
    if (uploadedKeys.length) {
      await Promise.allSettled(uploadedKeys.map((key) => deleteObject({ key })))
    }

    throw err
  } finally {
    // ensure temp files removed
    if (files.length) {
      await Promise.allSettled(
        files
          .map((f) => f.path)
          .filter(Boolean)
          .map((p) => fs.unlink(p).catch(() => undefined))
      )
    }
  }
}

export async function getListingById(listingId: string, opts?: { trackView?: boolean }) {
  const trackView = opts?.trackView ?? true

  try {
    const listing = trackView
      ? await prisma.listing.update({
          where: { id: listingId },
          data: { viewCount: { increment: 1 } },
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
        })
      : await prisma.listing.findUnique({
          where: { id: listingId },
          include: {
            seller: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                createdAt: true,
              },
            },
          },
        })

    if (!listing) {
      const err = new Error('listing not found')
      ;(err as unknown as { statusCode: number }).statusCode = 404
      throw err
    }

    return {
      ...listing,
      images: listing.images.map(buildImageResponse),
    }
  } catch (err) {
    // Prisma "record not found" for update(where...)
    const e = err as unknown as { code?: string }
    if (e?.code === 'P2025') {
      const notFound = new Error('listing not found')
      ;(notFound as unknown as { statusCode: number }).statusCode = 404
      throw notFound
    }
    throw err
  }
}

export async function updateListing(input: UpdateListingInput) {
  const { listingId, sellerId, data } = input

  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true },
  })

  if (!existing) {
    const err = new Error('Listing not found')
    ;(err as unknown as { statusCode: number }).statusCode = 404
    throw err
  }

  if (existing.sellerId !== sellerId) {
    const err = new Error('You can only update your own listings')
    ;(err as unknown as { statusCode: number }).statusCode = 403
    throw err
  }

  if (existing.status === ListingStatus.SOLD) {
    const err = new Error('Cannot update sold listings')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const updateData: Record<string, unknown> = {}

  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.brand !== undefined) updateData.brand = data.brand
  if (data.category !== undefined) updateData.category = data.category
  if (data.condition !== undefined) updateData.condition = data.condition
  if (data.size !== undefined) updateData.size = data.size
  if (data.currency !== undefined) updateData.currency = data.currency
  if (data.status !== undefined) updateData.status = data.status

  if (data.price !== undefined) {
    updateData.price = new Prisma.Decimal(String(data.price))
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: updateData,
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  })

  return {
    ...updated,
    images: updated.images.map(buildImageResponse),
  }
}

export async function deleteListing(params: { listingId: string; sellerId: string }) {
  const { listingId, sellerId } = params

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, images: true },
  })

  if (!listing) {
    const err = new Error('listing not found!')
    ;(err as unknown as { statusCode: number }).statusCode = 404
    throw err
  }

  if (listing.sellerId !== sellerId) {
    const err = new Error('You can only delete your own listings')
    ;(err as unknown as { statusCode: number }).statusCode = 403
    throw err
  }

  // block deletion if there is an active transaction
  const activeTransaction = await prisma.transaction.findFirst({
    where: {
      listingId,
      status: {
        in: [
          TransactionStatus.PENDING,
          TransactionStatus.PAYMENT_PROCESSING,
          TransactionStatus.ESCROW,
          TransactionStatus.SHIPPED,
          TransactionStatus.DISPUTED,
        ],
      },
    },
    select: { id: true, status: true },
  })

  if (activeTransaction) {
    const err = new Error('Cannot delete listing with an active transaction')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  // Delete DB record first (FK constraints: offers/savedListings cascade; transaction is restricted and already blocked)
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: ListingStatus.REMOVED, images: [] },
  })
  // delete images from s3
  const keys = listing.images ?? []
  if (keys.length) {
    await Promise.allSettled(keys.map((key) => deleteObject({ key })))
  }

  return { ok: true }
}

export type GetListingsQuery = {
  category?: string
  condition?: string
  status?: string
  size?: string
  brand?: string
  search?: string
  minPrice?: number
  maxPrice?: number
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'price' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export async function getListings(query: GetListingsQuery) {
  const {
    category,
    condition,
    status,
    size,
    brand,
    search,
    minPrice,
    maxPrice,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query

  const where: Record<string, unknown> = {}

  where.status = status ?? 'ACTIVE'

  if (category) where.category = category
  if (condition) where.condition = condition
  if (size) where.size = size

  if (brand) {
    where.brand = { contains: brand, mode: 'insensitive' }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {}
    if (minPrice !== undefined) (where.price as any).gte = minPrice
    if (maxPrice !== undefined) (where.price as any).lte = maxPrice
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ]
  }

  const skip = (page - 1) * limit

  const orderBy: Record<string, 'asc' | 'desc'> = {
    [sortBy]: sortOrder,
  }

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: orderBy as any,
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.listing.count({ where: where as any }),
  ])

  return {
    items: items.map((l) => ({
      ...l,
      images: l.images.map(buildImageResponse),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export type GetUserListingsQuery = {
  userId: string
  status?: string
  page?: number
  limit?: number
}

export async function getUserListings(query: GetUserListingsQuery) {
  const { userId, status, page = 1, limit = 20 } = query

  const where: Record<string, unknown> = { sellerId: userId }
  if (status) where.status = status

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where: where as any,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.listing.count({ where: where as any }),
  ])

  return {
    items: items.map((l) => ({
      ...l,
      images: l.images.map(buildImageResponse),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function uploadListingImages(params: {
  listingId: string
  sellerId: string
  files: Express.Multer.File[]
}) {
  const { listingId, sellerId, files } = params

  if (!files.length) {
    const err = new Error('No images provided')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, images: true },
  })

  if (!listing) {
    const err = new Error('Listing not found')
    ;(err as unknown as { statusCode: number }).statusCode = 404
    throw err
  }

  if (listing.sellerId !== sellerId) {
    const err = new Error('You can only update your own listings')
    ;(err as unknown as { statusCode: number }).statusCode = 403
    throw err
  }

  if (listing.images.length + files.length > MAX_IMAGES) {
    const err = new Error(`Maximum ${MAX_IMAGES} images allowed per listing`)
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const uploadedKeys: string[] = []
  const newKeys: string[] = []

  try {
    for (const file of files) {
      const key = makeListingImageKey(file.originalname)
      await uploadFileFromPath({
        key,
        filePath: file.path,
        contentType: file.mimetype,
      })

      uploadedKeys.push(key)
      newKeys.push(key)

      fs.unlink(file.path).catch(() => undefined)
    }
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { images: [...listing.images, ...newKeys] },
      select: { images: true },
    })

    return updated.images.map(buildImageResponse)
  } catch (err) {
    console.log('[listings.service.uploadListingImages] error', err)

    if (uploadedKeys.length) {
      await Promise.allSettled(uploadedKeys.map((key) => deleteObject({ key })))
    }

    throw err
  } finally {
    await Promise.allSettled(
      files
        .map((f) => f.path)
        .filter(Boolean)
        .map((p) => fs.unlink(p).catch(() => undefined))
    )
  }
}

export async function deleteListingImage(params: {
  listingId: string
  sellerId: string
  index: number
}) {
  const { listingId, sellerId, index } = params
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, images: true },
  })

  if (!listing) {
    const err = new Error('Listing not found')
    ;(err as unknown as { statusCode: number }).statusCode = 404
    throw err
  }

  if (listing.sellerId !== sellerId) {
    const err = new Error('You can only update your own listings')
    ;(err as unknown as { statusCode: number }).statusCode = 403
    throw err
  }

  if (!Number.isInteger(index) || index < 0 || index >= listing.images.length) {
    const err = new Error('Invalid image index')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  if (listing.images.length === 1) {
    const err = new Error('Listing must have at least one image')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const keyToDelete = listing.images[index]!
  if (!keyToDelete) {
    const err = new Error('Invalid image index')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const updatedImages = listing.images.filter((_, i) => i !== index)

  await prisma.listing.update({
    where: { id: listingId },
    data: { images: updatedImages },
  })

  // best-effort S3 delete
  await Promise.allSettled([deleteObject({ key: keyToDelete })])

  return updatedImages.map(buildImageResponse)
}

export async function updateListingStatus(params: {
  listingId: string
  sellerId: string
  status: ListingStatus
}) {
  const { listingId, sellerId, status } = params

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true },
  })

  if (!listing) {
    const err = new Error('Listing not found')
    ;(err as unknown as { statusCode: number }).statusCode = 404
    throw err
  }

  if (listing.sellerId !== sellerId) {
    const err = new Error('You can only update your own listings')
    ;(err as unknown as { statusCode: number }).statusCode = 403
    throw err
  }

  // ✅ idempotent: if same status, just return the current listing
  if (listing.status === status) {
    const current = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    })

    // `current` should exist because `listing` existed above
    return {
      ...current!,
      images: current!.images.map(buildImageResponse),
    }
  }

  const currentStatus = listing.status
  const allowed = allowedTransitions[currentStatus] ?? []
  if (!allowed.includes(status)) {
    const err = new Error(`Invalid status transition: ${currentStatus} -> ${status}`)
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  const updated = await prisma.listing.update({
    where: { id: listingId },
    data: { status },
    include: {
      seller: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  })

  return {
    ...updated,
    images: updated.images.map(buildImageResponse),
  }
}
