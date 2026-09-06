import { app, BrowserWindow, clipboard, ipcMain, Menu, nativeImage, Notification, Tray } from 'electron'
import { join } from 'node:path'
import { ConfigStore } from './config.js'
import { uploadClipboard, uploadFile } from './upload-service.js'
import type { AppConfig } from '../shared/contracts.js'

let mainWindow: BrowserWindow | undefined
let tray: Tray | undefined
let isQuitting = false
const configStore = new ConfigStore()

function createIcon() {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'tray-icon.png')
    : join(app.getAppPath(), 'assets', 'tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) throw new Error(`Unable to load tray icon: ${iconPath}`)
  return icon
}

function getWindowIconPath() {
  return app.isPackaged
    ? join(process.resourcesPath, 'app-icon.png')
    : join(app.getAppPath(), 'assets', 'app-icon.png')
}

function showWindow() {
  if (!mainWindow) return
  mainWindow.show()
  mainWindow.focus()
}

function openSettings() {
  showWindow()
  mainWindow?.webContents.send('window:open-settings')
}

async function runClipboardUpload(fromTray: boolean) {
  const response = await uploadClipboard(await configStore.read())
  if (response.skipped || !response.response) return
  if (fromTray) {
    if (response.response.ok) {
      new Notification({ title: 'LD PicU', body: 'Image uploaded and copied to clipboard.' }).show()
    } else {
      new Notification({ title: 'LD PicU upload failed', body: response.response.error.message }).show()
    }
    return
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 720,
    height: 620,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    title: 'LD PicU',
    icon: getWindowIconPath(),
    backgroundColor: '#141619',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })
  mainWindow.once('ready-to-show', () => mainWindow?.show())
  const devServerUrl = process.env.VITE_DEV_SERVER_URL
  if (devServerUrl) void mainWindow.loadURL(devServerUrl)
  else void mainWindow.loadFile(join(__dirname, '../../renderer/index.html'))
}

function createTray() {
  tray = new Tray(createIcon())
  tray.setToolTip('LD PicU')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Show LD PicU', click: showWindow },
    { label: 'Upload from Clipboard', click: () => void runClipboardUpload(true) },
    { label: 'Settings', click: openSettings },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit() } }
  ]))
  tray.on('click', showWindow)
}

function registerIpc() {
  ipcMain.handle('config:get', () => configStore.read())
  ipcMain.handle('config:save', (_event, config: AppConfig) => configStore.save(config))
  ipcMain.handle('upload:file', async (_event, filePath: unknown) => {
    if (typeof filePath !== 'string' || !filePath) return { ok: false, error: { message: 'Invalid file path.' } }
    return uploadFile(await configStore.read(), filePath)
  })
  ipcMain.handle('upload:clipboard', async () => uploadClipboard(await configStore.read()))
  ipcMain.handle('clipboard:write-text', (_event, text: unknown) => {
    if (typeof text !== 'string') throw new Error('Invalid clipboard value.')
    clipboard.writeText(text)
  })
  ipcMain.handle('window:settings', openSettings)
}

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', showWindow)
  app.whenReady().then(() => {
    Menu.setApplicationMenu(null)
    registerIpc()
    createMainWindow()
    createTray()
    app.on('activate', showWindow)
  })
  app.on('window-all-closed', () => undefined)
}
