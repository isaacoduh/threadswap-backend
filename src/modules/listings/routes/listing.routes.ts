/**
 * @openapi
 * tags:
 *   - name: Listings
 *     description: Listing management
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     ListingImage:
 *       type: object
 *       properties:
 *         key: { type: string }
 *         url: { type: string, nullable: true }
 *     ListingSeller:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         username: { type: string, nullable: true }
 *         displayName: { type: string, nullable: true }
 *         avatarUrl: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *     Listing:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         sellerId: { type: string, format: uuid }
 *         title: { type: string }
 *         description: { type: string }
 *         brand: { type: string }
 *         category: { type: string }
 *         condition: { type: string }
 *         size: { type: string, nullable: true }
 *         price: { type: string } # Prisma Decimal often serializes as string
 *         currency: { type: string }
 *         status: { type: string }
 *         images:
 *           type: array
 *           items: { $ref: "#/components/schemas/ListingImage" }
 *         seller: { $ref: "#/components/schemas/ListingSeller" }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

/**
 * @openapi
 * /listings:
 *   post:
 *     tags: [Listings]
 *     summary: Create listing (multipart)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, brand, category, condition, price, images]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               brand: { type: string }
 *               category: { type: string }
 *               condition: { type: string }
 *               size: { type: string, nullable: true }
 *               price: { type: string }
 *               currency: { type: string, example: GBP }
 *               status: { type: string, example: DRAFT }
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 listing: { $ref: "#/components/schemas/Listing" }
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiError" }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: "#/components/schemas/ApiError" }
 */

/**
 * @openapi
 * /listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Get single listing
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: OK
 *       404:
 *         description: Not found
 */

import { Router } from 'express'

import { requireAuth } from '@/middleware/auth.middleware'
import { validateBody } from '@/common/validation/validation.middleware'
import { uploadListingImages, handleMulterError } from '@/modules/uploads/services/multer.service'

import {
  createListingSchema,
  updateListingSchema,
  listingFiltersSchema,
  updateStatusSchema,
} from '@/modules/listings/validators/listing.validator'

import {
  createListing,
  getListing,
  updateListing,
  deleteListing,
  getListings,
  getUserListings,
  uploadListingImages as uploadListingImagesCtl,
  deleteListingImage,
  updateListingStatus,
} from '@/modules/listings/controllers/listings.controller'

const router = Router()

// Public
router.get('/', validateBody(listingFiltersSchema), getListings)

// Public - user store (MUST be before "/:id")
router.get('/users/:userId/listings', getUserListings)

// Public - single listing
router.get('/:id', getListing)

// Protected - create (multipart/form-data)
router.post('/', requireAuth, uploadListingImages, handleMulterError, createListing)

// Protected - update (json)
router.patch('/:id', requireAuth, validateBody(updateListingSchema), updateListing)

// Protected - delete
router.delete('/:id', requireAuth, deleteListing)

// Protected - add images (multipart/form-data)
router.post(
  '/:id/images',
  requireAuth,
  uploadListingImages,
  handleMulterError,
  uploadListingImagesCtl
)

// Protected - delete image by index
router.delete('/:id/images/:index', requireAuth, deleteListingImage)

// Protected - status (BE-061)
router.patch('/:id/status', requireAuth, validateBody(updateStatusSchema), updateListingStatus)

export default router
