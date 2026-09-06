import { app } from 'electron'
import { chmod, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { AppConfig, CopyFormat } from '../shared/contracts.js'

const configName = 'config.json'

export const defaultConfig: AppConfig = {
  endpoint: '',
  bucket: '',
  region: 'auto',
  accessKeyId: '',
  secretAccessKey: '',
  publicUrlPrefix: '',
  forcePathStyle: true,
  convertToWebp: true,
  webpQuality: 82,
  copyFormat: 'url'
}

export function validateConfig(value: AppConfig): AppConfig {
  const required = ['endpoint', 'bucket', 'accessKeyId', 'secretAccessKey', 'publicUrlPrefix'] as const
  for (const field of required) {
    if (!value[field].trim()) throw new Error(`${field} is required.`)
  }

  for (const field of ['endpoint', 'publicUrlPrefix'] as const) {
    try {
      new URL(value[field])
    } catch {
      throw new Error(`${field} must be a valid URL.`)
    }
  }

  if (!Number.isInteger(value.webpQuality) || value.webpQuality < 1 || value.webpQuality > 100) {
    throw new Error('WebP quality must be an integer between 1 and 100.')
  }
  if (!isCopyFormat(value.copyFormat)) throw new Error('Copy format must be URL or Markdown.')

  return {
    ...value,
    endpoint: value.endpoint.trim().replace(/\/+$/, ''),
    bucket: value.bucket.trim(),
    region: value.region.trim() || 'auto',
    accessKeyId: value.accessKeyId.trim(),
    secretAccessKey: value.secretAccessKey.trim(),
    publicUrlPrefix: value.publicUrlPrefix.trim().replace(/\/+$/, '')
  }
}

function isCopyFormat(value: unknown): value is CopyFormat {
  return value === 'url' || value === 'markdown'
}

export class ConfigStore {
  private readonly path: string

  constructor(userDataPath = app.getPath('userData')) {
    this.path = join(userDataPath, configName)
  }

  async read(): Promise<AppConfig> {
    try {
      const contents = await readFile(this.path, 'utf8')
      return { ...defaultConfig, ...JSON.parse(contents) }
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { ...defaultConfig }
      throw new Error('Unable to read saved settings.')
    }
  }

  async save(config: AppConfig): Promise<AppConfig> {
    const normalized = validateConfig(config)
    await mkdir(dirname(this.path), { recursive: true })
    const temporaryPath = `${this.path}.tmp`
    await writeFile(temporaryPath, JSON.stringify(normalized, null, 2), { encoding: 'utf8', mode: 0o600 })
    await rename(temporaryPath, this.path)
    if (process.platform !== 'win32') await chmod(this.path, 0o600)
    return normalized
  }
}
