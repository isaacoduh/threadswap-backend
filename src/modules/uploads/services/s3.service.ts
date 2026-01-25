import {
  S3Client,
  type S3ClientConfig,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'

const bucket = process.env.AWS_S3_BUCKET
if (!bucket) throw new Error('AWS_S3_BUCKET is not set')

function getRegion(): string {
  const region = process.env.AWS_REGION
  if (!region) throw new Error('AWS_REGION is not set')
  return region
}

function buildS3Config(): S3ClientConfig {
  const config: S3ClientConfig = { region: getRegion() }

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  // Only include credentials if both are present
  if (accessKeyId && secretAccessKey) {
    config.credentials = { accessKeyId, secretAccessKey }
  }

  return config
}

export const s3 = new S3Client(buildS3Config())

export async function uploadFileFromPath(params: {
  key: string
  filePath: string
  contentType?: string
}) {
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: bucket,
      Key: params.key,
      Body: fs.createReadStream(params.filePath),
      ContentType: params.contentType,
    },
  })

  const result = await uploader.done()

  return {
    bucket,
    key: params.key,
    etag: result.ETag,
  }
}

export async function deleteObject(params: { key: string }) {
  const { key } = params

  console.log('[s3.deleteObject] start', { bucket, key })

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  )

  console.log('[s3.deleteObject] done', { bucket, key })
}

/***
 * Optional but recommended if your bucket is private.
 * This matches your preferences: store key in DB, return signed URL for now, swap to CDN later
 */
export async function signGetObjectUrl(params: { key: string; expiresInSeconds?: number }) {
  const { key, expiresInSeconds } = params
  const expiresIn = expiresInSeconds ?? 60 * 10

  console.log('[s3.signGetObjectUrl] start', { bucket, key, expiresIn })

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  })

  const url = await getSignedUrl(s3, command, { expiresIn })

  console.log('[s3.signGetObjectUrl] done', { bucket, key })

  return url
}
