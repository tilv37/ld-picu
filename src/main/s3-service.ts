import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { AppConfig } from '../shared/contracts.js'
import type { PreparedImage } from './image-service.js'

const uploadTimeoutMs = 30_000

export async function uploadToS3(config: AppConfig, objectKey: string, image: PreparedImage): Promise<void> {
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })

  try {
    await client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
      Body: image.buffer,
      ContentType: image.contentType
    }), { abortSignal: AbortSignal.timeout(uploadTimeoutMs) })
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      throw new Error('Upload timed out after 30 seconds. Check the endpoint, network, and bucket settings.')
    }
    throw error
  }
}
