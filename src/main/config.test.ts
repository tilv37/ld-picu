import { describe, expect, it } from 'vitest'
import { defaultConfig, validateConfig } from './config.js'

describe('configuration validation', () => {
  it('normalizes endpoint and public URL slashes', () => {
    const config = validateConfig({
      ...defaultConfig,
      endpoint: 'https://account.r2.cloudflarestorage.com///',
      bucket: 'images',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      publicUrlPrefix: 'https://img.example.com///'
    })
    expect(config.endpoint).toBe('https://account.r2.cloudflarestorage.com')
    expect(config.publicUrlPrefix).toBe('https://img.example.com')
  })

  it('rejects incomplete upload settings', () => {
    expect(() => validateConfig(defaultConfig)).toThrow('endpoint is required.')
  })
})
