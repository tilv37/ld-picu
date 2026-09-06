import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { AppConfig, ClipboardUploadResponse, UploadResponse } from '../shared/contracts.js'

contextBridge.exposeInMainWorld('ldPicU', {
  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
  saveConfig: (config: AppConfig): Promise<AppConfig> => ipcRenderer.invoke('config:save', config),
  uploadDroppedFile: (file: File): Promise<UploadResponse> => ipcRenderer.invoke('upload:file', webUtils.getPathForFile(file)),
  uploadClipboard: (): Promise<ClipboardUploadResponse> => ipcRenderer.invoke('upload:clipboard'),
  copyText: (text: string): Promise<void> => ipcRenderer.invoke('clipboard:write-text', text),
  openSettings: (): Promise<void> => ipcRenderer.invoke('window:settings'),
  onOpenSettings: (listener: () => void): (() => void) => {
    const channel = 'window:open-settings'
    const wrapped = () => listener()
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
})
