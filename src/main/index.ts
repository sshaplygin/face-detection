import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

// Native module must be loaded via require (CommonJS) for .node binaries
// Detect architecture to load the correct binary (Apple Silicon vs Intel)
const arch = process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
const native = require(join(__dirname, `../../index.${arch}.node`))

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC handler: receive RGBA buffer from renderer, process in Rust, return result
ipcMain.handle('process-frame', (_event, buffer: Buffer, width: number, height: number) => {
  return native.processFrame(Buffer.from(buffer), width, height)
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
