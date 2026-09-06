export type CopyFormat = 'url' | 'markdown'

export interface AppConfig {
  endpoint: string
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  publicUrlPrefix: string
  forcePathStyle: boolean
  convertToWebp: boolean
  webpQuality: number
  copyFormat: CopyFormat
}

export type UploadSource = 'file' | 'clipboard'

export interface UploadRequest {
  source: UploadSource
  filePath?: string
}

export interface UploadResult {
  url: string
  copiedText: string
  objectKey: string
  previewDataUrl?: string
}

export interface UploadError {
  message: string
}

export type UploadResponse =
  | { ok: true; result: UploadResult }
  | { ok: false; error: UploadError }

export interface ClipboardUploadResponse {
  skipped: boolean
  response?: UploadResponse
}

export interface LdPicUApi {
  getConfig(): Promise<AppConfig>
  saveConfig(config: AppConfig): Promise<AppConfig>
  uploadDroppedFile(file: File): Promise<UploadResponse>
  uploadClipboard(): Promise<ClipboardUploadResponse>
  copyText(text: string): Promise<void>
  openSettings(): Promise<void>
  onOpenSettings(listener: () => void): () => void
}

declare global {
  interface Window {
    ldPicU: LdPicUApi
  }
}
