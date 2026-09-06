import { randomBytes } from 'node:crypto'
import { extname } from 'node:path'
import type { CopyFormat } from '../shared/contracts.js'

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.webp': 'image/webp'
}

export function getImageContentType(fileName: string): string | undefined {
  return contentTypes[extname(fileName).toLowerCase()]
}

export function createObjectKey(extension: string, date = new Date()): string {
  const normalizedExtension = extension.replace(/^\./, '').toLowerCase()
  if (!normalizedExtension) throw new Error('An image extension is required.')
  const datePath = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('/')
  return `${datePath}/${randomBytes(8).toString('hex')}.${normalizedExtension}`
}

export function createPublicUrl(prefix: string, objectKey: string): string {
  return `${prefix.replace(/\/+$/, '')}/${objectKey.replace(/^\/+/, '')}`
}

export function formatCopyText(url: string, format: CopyFormat): string {
  return format === 'markdown' ? `![](${url})` : url
}
