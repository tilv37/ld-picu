import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { prepareClipboardImage } from './image-service.js'

describe('clipboard image processing', () => {
  it('converts clipboard PNG to WebP when enabled', async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 4, background: '#146c94' } }).png().toBuffer()
    const result = await prepareClipboardImage(png, true, 82)
    expect(result.extension).toBe('webp')
    expect(result.contentType).toBe('image/webp')
    expect(await sharp(result.buffer).metadata()).toMatchObject({ format: 'webp', width: 2, height: 2 })
  })

  it('keeps clipboard PNG when conversion is disabled', async () => {
    const png = await sharp({ create: { width: 1, height: 1, channels: 4, background: '#ffffff' } }).png().toBuffer()
    const result = await prepareClipboardImage(png, false, 82)
    expect(result.extension).toBe('png')
    expect(result.buffer).toEqual(png)
  })
})
