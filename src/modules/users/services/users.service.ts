/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/db/prisma'
import { TransactionStatus } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import {
  uploadFileFromPath,
  deleteObject,
  signGetObjectUrl,
} from '@/modules/uploads/services/s3.service'

function buildAvatarResponse(user: {
  avatarBucket?: string | null
  avatarKey?: string | null
  avatarUrl?: string | null
}) {
  const base = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '')
  const key = user.avatarKey ?? null

  const url =
    key && base
      ? `${base}/${key}` // if you later go private+signed, this becomes signed url
      : (user.avatarUrl ?? null)

  return { key, url }
}

async function getUserStats(userId: string) {
  const [listingsCount, salesCount, ratingAgg] = await Promise.all([
    prisma.listing.count({ where: { sellerId: userId } }),
    prisma.transaction.count({
      where: { sellerId: userId, status: TransactionStatus.COMPLETED },
    }),
    prisma.review.aggregate({
      where: { revieweeId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ])

  return {
    listingsCount,
    salesCount,
    avgRating: ratingAgg._avg.rating ?? null,
    ratingCount: ratingAgg._count.rating ?? 0,
  }
}

export async function getUserProfileById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      socials: true,
      avatarBucket: true,
      avatarKey: true,
      avatarUrl: true,
      createdAt: true,
    },
  })

  if (!user) {
    const err = new Error('User not found!')
    ;(err as unknown as { statusCode: number }).statusCode = 404
    throw err
  }

  const stats = await getUserStats(userId)
  const avatar = buildAvatarResponse(user)

  return {
    ...user,
    stats,
    avatar,
  }
}

export async function updateMyProfile(params: {
  userId: string
  data: {
    username?: string | undefined
    displayName?: string | undefined
    bio?: string | undefined
    socials?: Record<string, any> | undefined
  }
}) {
  const { userId, data } = params

  const update: any = {}

  if (data.username !== undefined) update.username = data.username.trim().toLowerCase()
  if (data.displayName !== undefined) update.displayName = data.displayName
  if (data.bio !== undefined) update.bio = data.bio
  if (data.socials !== undefined) update.socials = data.socials

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        socials: true,
        avatarBucket: true,
        avatarKey: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    const [stats] = await Promise.all([getUserStats(userId)])
    const avatar = buildAvatarResponse(user)

    return {
      ...user,
      avatar,
      stats,
    }
  } catch (err: any) {
    // Unique username conflict
    if (err?.code === 'P2002') {
      const e = new Error('Username already taken')
      ;(e as unknown as { statusCode: number }).statusCode = 400
      throw e
    }

    throw err
  }
}

function buildAvatarKey(params: {
  userId: string
  originalname?: string | null
  mimetype?: string | null
}) {
  const extFromName = params.originalname ? path.extname(params.originalname).slice(0, 10) : ''
  const ext =
    extFromName && extFromName.startsWith('.')
      ? extFromName
      : params.mimetype === 'image/png'
        ? '.png'
        : params.mimetype === 'image/webp'
          ? '.webp'
          : '.jpg'

  const id = crypto.randomUUID()
  return `avatars/${params.userId}/${Date.now()}-${id}${ext}`
}

export async function uploadMyAvatar(params: { userId: string; file: Express.Multer.File }) {
  const { userId, file } = params

  if (!file?.path) {
    const err = new Error('Avatar file is required')
    ;(err as unknown as { statusCode: number }).statusCode = 400
    throw err
  }

  console.log('[UsersService.uploadMyAvatar] start', {
    userId,
    filePath: file.path,
    mimetype: file.mimetype,
    size: file.size,
  })

  // fetch current user to delete old avatar (if any)
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarKey: true },
  })

  const key = buildAvatarKey({ userId, originalname: file.originalname, mimetype: file.mimetype })

  try {
    const uploaded = await uploadFileFromPath({
      key,
      filePath: file.path,
      contentType: file.mimetype,
    })

    // persist new avatar fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarBucket: uploaded.bucket ?? null,
        avatarKey: uploaded.key,
        // keep legacy field untouched or set null if you want:
        // avatarUrl: null,
      },
    })

    // best-effort delete old object (don’t fail upload if delete fails)
    if (existing?.avatarKey && existing.avatarKey !== uploaded.key) {
      deleteObject({ key: existing.avatarKey }).catch((e) =>
        console.error('[UsersService.uploadMyAvatar] delete old avatar failed', e)
      )
    }

    // signed url for private bucket (your s3.service supports it)
    const avatarUrl = await signGetObjectUrl({
      key: uploaded.key,
      expiresInSeconds: Number(process.env.AVATAR_SIGNED_URL_TTL_SECONDS ?? 60 * 10),
    })

    console.log('[UsersService.uploadMyAvatar] done', { userId, key: uploaded.key })

    return {
      avatar: {
        bucket: uploaded.bucket,
        key: uploaded.key,
        url: avatarUrl,
      },
    }
  } finally {
    // cleanup tmp file (disk storage)
    fs.unlink(file.path).catch(() => null)
  }
}
