import { describe, expect, it } from 'vitest'
import { createObjectKey, createPublicUrl, formatCopyText, getImageContentType } from './upload-utils.js'

describe('upload utilities', () => {
  it('creates a dated object key with a random 16-character identifier', () => {
    const key = createObjectKey('.webp', new Date(2026, 8, 6))
    expect(key).toMatch(/^2026\/09\/06\/[a-f0-9]{16}\.webp$/)
  })

  it('normalizes public URL prefixes', () => {
    expect(createPublicUrl('https://img.example.com///', '/2026/09/06/example.webp'))
      .toBe('https://img.example.com/2026/09/06/example.webp')
  })

  it('formats Markdown copy text', () => {
    expect(formatCopyText('https://img.example.com/a.webp', 'markdown'))
      .toBe('![](https://img.example.com/a.webp)')
  })

  it('recognizes supported image extensions case-insensitively', () => {
    expect(getImageContentType('PHOTO.JPEG')).toBe('image/jpeg')
    expect(getImageContentType('document.pdf')).toBeUndefined()
  })
})
