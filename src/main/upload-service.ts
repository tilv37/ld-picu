import { clipboard } from 'electron'
import type { AppConfig, ClipboardUploadResponse, UploadResponse } from '../shared/contracts.js'
import { prepareClipboardImage, prepareFileImage, type PreparedImage } from './image-service.js'
import { uploadToS3 } from './s3-service.js'
import { createObjectKey, createPublicUrl, formatCopyText } from './upload-utils.js'
import { validateConfig } from './config.js'

async function uploadPreparedImage(config: AppConfig, image: PreparedImage): Promise<UploadResponse> {
  try {
    const validConfig = validateConfig(config)
    const objectKey = createObjectKey(image.extension)
    await uploadToS3(validConfig, objectKey, image)
    const url = createPublicUrl(validConfig.publicUrlPrefix, objectKey)
    const copiedText = formatCopyText(url, validConfig.copyFormat)
    clipboard.writeText(copiedText)
    return { ok: true, result: { url, copiedText, objectKey, previewDataUrl: image.previewDataUrl } }
  } catch (error) {
    return { ok: false, error: { message: error instanceof Error ? error.message : 'Upload failed.' } }
  }
}

export async function uploadFile(config: AppConfig, filePath: string): Promise<UploadResponse> {
  try {
    const image = await prepareFileImage(filePath, config.convertToWebp, config.webpQuality)
    return await uploadPreparedImage(config, image)
  } catch (error) {
    return { ok: false, error: { message: error instanceof Error ? error.message : 'Unable to prepare image.' } }
  }
}

export async function uploadClipboard(config: AppConfig): Promise<ClipboardUploadResponse> {
  const image = clipboard.readImage()
  if (image.isEmpty()) return { skipped: true }

  try {
    const pngBuffer = image.toPNG()
    return { skipped: false, response: await uploadPreparedImage(config, await prepareClipboardImage(pngBuffer, config.convertToWebp, config.webpQuality)) }
  } catch (error) {
    return { skipped: false, response: { ok: false, error: { message: error instanceof Error ? error.message : 'Unable to prepare clipboard image.' } } }
  }
}
