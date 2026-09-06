import type { AppConfig, ClipboardUploadResponse, UploadResponse } from '../shared/contracts.js'
import './style.css'

const dropZone = document.querySelector<HTMLElement>('#drop-zone')!
const clipboardButton = document.querySelector<HTMLButtonElement>('#clipboard-button')!
const settingsButton = document.querySelector<HTMLButtonElement>('#settings-button')!
const toast = document.querySelector<HTMLElement>('#toast')!
const toastIcon = document.querySelector<HTMLElement>('#toast-icon')!
const toastText = document.querySelector<HTMLElement>('#toast-text')!
const toastTime = document.querySelector<HTMLElement>('#toast-time')!
const errorActions = document.querySelector<HTMLElement>('#error-actions')!
const retryButton = document.querySelector<HTMLButtonElement>('#retry-button')!
const resultCard = document.querySelector<HTMLElement>('#result-card')!
const preview = document.querySelector<HTMLImageElement>('#preview')!
const resultKey = document.querySelector<HTMLElement>('#result-key')!
const resultUrl = document.querySelector<HTMLAnchorElement>('#result-url')!
const copyButton = document.querySelector<HTMLButtonElement>('#copy-button')!
const copyMarkdownButton = document.querySelector<HTMLButtonElement>('#copy-markdown-button')!
const clearButton = document.querySelector<HTMLButtonElement>('#clear-button')!
const statusDot = document.querySelector<HTMLElement>('#status-dot')!
const statusLabel = document.querySelector<HTMLElement>('#status-label')!
const dialog = document.querySelector<HTMLDialogElement>('#settings-dialog')!
const settingsForm = document.querySelector<HTMLFormElement>('#settings-form')!
const settingsError = document.querySelector<HTMLElement>('#settings-error')!

let latestResponse: UploadResponse | undefined
let retry: (() => Promise<void>) | undefined

type ToastKind = 'success' | 'working' | 'error'

function setToast(kind: ToastKind, text: string, elapsedMs?: number) {
  toast.hidden = false
  toast.dataset.kind = kind
  toastIcon.textContent = kind === 'success' ? '✓' : kind === 'error' ? '!' : '…'
  toastText.textContent = text
  toastTime.textContent = elapsedMs === undefined ? '' : `${Math.max(1, Math.round(elapsedMs))} ms`
  statusDot.dataset.state = kind === 'working' ? 'working' : kind === 'error' ? 'error' : 'idle'
  statusLabel.textContent = kind === 'working' ? 'UPLOADING' : kind === 'error' ? 'ERROR' : 'READY'
}

function setBusy(busy: boolean) {
  clipboardButton.disabled = busy
  dropZone.classList.toggle('is-busy', busy)
  if (busy) {
    errorActions.hidden = true
    toast.hidden = false
  }
}

function automaticCopyLabel(response: Extract<UploadResponse, { ok: true }>): string {
  return response.result.copiedText === response.result.url ? 'Copied URL to clipboard' : 'Copied Markdown to clipboard'
}

function showResult(response: Extract<UploadResponse, { ok: true }>) {
  latestResponse = response
  resultCard.hidden = false
  resultKey.textContent = response.result.objectKey
  resultUrl.href = response.result.url
  resultUrl.textContent = response.result.url
  resultUrl.title = response.result.url
  resultUrl.setAttribute('aria-label', `Open uploaded image: ${response.result.url}`)
  preview.src = response.result.previewDataUrl ?? ''
  preview.hidden = !response.result.previewDataUrl
}

function showError(message: string) {
  errorActions.hidden = false
  setToast('error', message)
}

async function uploadDroppedFile(file: File) {
  retry = () => uploadDroppedFile(file)
  setBusy(true)
  setToast('working', `Uploading ${file.name}…`)
  const started = performance.now()
  try {
    const response = await window.ldPicU.uploadDroppedFile(file)
    if (response.ok) {
      showResult(response)
      setToast('success', automaticCopyLabel(response), performance.now() - started)
    } else {
      showError(response.error.message)
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : 'The upload request failed.')
  } finally {
    setBusy(false)
  }
}

async function uploadClipboard() {
  retry = uploadClipboard
  setBusy(true)
  setToast('working', 'Uploading clipboard image…')
  const started = performance.now()
  try {
    const response: ClipboardUploadResponse = await window.ldPicU.uploadClipboard()
    if (response.skipped || !response.response) {
      toast.hidden = true
      statusDot.dataset.state = 'idle'
      statusLabel.textContent = 'READY'
      return
    }
    if (response.response.ok) {
      showResult(response.response)
      setToast('success', automaticCopyLabel(response.response), performance.now() - started)
    } else {
      showError(response.response.error.message)
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Unable to read the clipboard image.')
  } finally {
    setBusy(false)
  }
}

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault()
  if (!dropZone.classList.contains('is-busy')) dropZone.classList.add('is-dragging')
})
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-dragging'))
dropZone.addEventListener('drop', (event) => {
  event.preventDefault()
  dropZone.classList.remove('is-dragging')
  const files = event.dataTransfer?.files
  if (!files || files.length !== 1) {
    showError('Drop exactly one image file.')
    return
  }
  void uploadDroppedFile(files[0])
})

clipboardButton.addEventListener('click', () => void uploadClipboard())
copyButton.addEventListener('click', () => {
  if (!latestResponse?.ok) return
  void window.ldPicU.copyText(latestResponse.result.url)
  setToast('success', 'Copied URL to clipboard')
})
copyMarkdownButton.addEventListener('click', () => {
  if (!latestResponse?.ok) return
  void window.ldPicU.copyText(`![](${latestResponse.result.url})`)
  setToast('success', 'Copied Markdown to clipboard')
})
clearButton.addEventListener('click', () => {
  latestResponse = undefined
  resultCard.hidden = true
  preview.removeAttribute('src')
  if (toast.dataset.kind === 'success') {
    toast.hidden = true
    statusDot.dataset.state = 'idle'
    statusLabel.textContent = 'READY'
  }
})
retryButton.addEventListener('click', () => {
  if (retry) void retry()
})

function configToForm(config: AppConfig) {
  for (const [key, value] of Object.entries(config)) {
    const field = settingsForm.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null
    if (!field) continue
    if (field instanceof HTMLInputElement && field.type === 'checkbox') field.checked = Boolean(value)
    else field.value = String(value)
  }
}

async function openSettings() {
  settingsError.hidden = true
  configToForm(await window.ldPicU.getConfig())
  dialog.showModal()
}

settingsButton.addEventListener('click', () => void openSettings())
document.querySelector('#close-settings')?.addEventListener('click', () => dialog.close())

settingsForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const values = new FormData(settingsForm)
  const config: AppConfig = {
    endpoint: String(values.get('endpoint') ?? ''),
    bucket: String(values.get('bucket') ?? ''),
    region: String(values.get('region') ?? 'auto'),
    publicUrlPrefix: String(values.get('publicUrlPrefix') ?? ''),
    accessKeyId: String(values.get('accessKeyId') ?? ''),
    secretAccessKey: String(values.get('secretAccessKey') ?? ''),
    forcePathStyle: values.get('forcePathStyle') === 'on',
    convertToWebp: values.get('convertToWebp') === 'on',
    webpQuality: Number(values.get('webpQuality')),
    copyFormat: values.get('copyFormat') === 'markdown' ? 'markdown' : 'url'
  }
  try {
    await window.ldPicU.saveConfig(config)
    dialog.close()
  } catch (error) {
    settingsError.textContent = error instanceof Error ? error.message : 'Unable to save settings.'
    settingsError.hidden = false
  }
})

window.ldPicU.onOpenSettings(() => void openSettings())
