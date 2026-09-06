import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import sharp from 'sharp'
import { getImageContentType } from './upload-utils.js'

export interface PreparedImage {
  buffer: Buffer
  extension: string
  contentType: string
  previewDataUrl: string
}

function preview(buffer: Buffer, contentType: string): string {
  return `data:${contentType};base64,${buffer.toString('base64')}`
}

export async function prepareFileImage(filePath: string, convertToWebp: boolean, webpQuality: number): Promise<PreparedImage> {
  const original = await readFile(filePath)
  const fileName = basename(filePath)
  const extension = extname(fileName).toLowerCase()
  const contentType = getImageContentType(fileName)
  if (!contentType) throw new Error('Only common image files are supported.')

  try {
    await sharp(original, { animated: false }).metadata()
  } catch {
    throw new Error('The dropped file could not be processed as an image.')
  }

  if (!convertToWebp || extension === '.gif' || extension === '.webp') {
    return { buffer: original, extension: extension.slice(1), contentType, previewDataUrl: preview(original, contentType) }
  }

  try {
    const converted = await sharp(original, { animated: false }).rotate().webp({ quality: webpQuality }).toBuffer()
    return { buffer: converted, extension: 'webp', contentType: 'image/webp', previewDataUrl: preview(converted, 'image/webp') }
  } catch {
    throw new Error('The dropped file could not be processed as an image.')
  }
}

export async function prepareClipboardImage(pngBuffer: Buffer, convertToWebp: boolean, webpQuality: number): Promise<PreparedImage> {
  if (!pngBuffer.length) throw new Error('Clipboard does not contain an image.')
  if (!convertToWebp) return { buffer: pngBuffer, extension: 'png', contentType: 'image/png', previewDataUrl: preview(pngBuffer, 'image/png') }
  const converted = await sharp(pngBuffer).webp({ quality: webpQuality }).toBuffer()
  return { buffer: converted, extension: 'webp', contentType: 'image/webp', previewDataUrl: preview(converted, 'image/webp') }
}
