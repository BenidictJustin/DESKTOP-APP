import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

import { autoUpdater } from 'electron-updater'

// Configure autoUpdater log and settings
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

let mainWindow = null

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#F1EFEC',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    // Auto check for updates when window opens in production
    if (!is.dev) {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.warn('Failed to check for updates on startup:', err)
      })
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// AutoUpdater Events -> Renderer Forwarding
autoUpdater.on('update-available', (info) => {
  mainWindow?.webContents.send('update-available', info)
})

autoUpdater.on('update-not-available', (info) => {
  mainWindow?.webContents.send('update-not-available', info)
})

autoUpdater.on('download-progress', (progress) => {
  mainWindow?.webContents.send('download-progress', progress)
})

autoUpdater.on('update-downloaded', (info) => {
  mainWindow?.webContents.send('update-downloaded', info)
})

autoUpdater.on('error', (err) => {
  mainWindow?.webContents.send('update-error', err?.message || 'Update check failed')
})

// IPC AutoUpdate Handlers
ipcMain.handle('check-for-updates', async () => {
  if (is.dev) {
    return { isDev: true, message: 'Auto-updates are disabled in Development mode.' }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to check for updates' }
  }
})

ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.dommunity.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Native print to PDF IPC handler
  ipcMain.handle('print-to-pdf', async (event, { html, title, options }) => {
    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const tempPath = join(app.getPath('temp'), `print-${Date.now()}.html`)
    
    try {
      fs.writeFileSync(tempPath, html, 'utf8')
      await printWindow.loadURL(`file://${tempPath}`)
      
      // Wait for fonts and layouts to finish rendering
      await new Promise((resolve) => setTimeout(resolve, 800))

      const pdfBuffer = await printWindow.webContents.printToPDF({
        printBackground: true,
        pageSize: options?.pageSize || 'A4',
        landscape: options?.landscape || false,
        margins: options?.margins || { marginType: 'none' }
      })

      const { filePath } = await dialog.showSaveDialog({
        title: 'Save PDF',
        defaultPath: join(app.getPath('downloads'), `${title || 'document'}.pdf`),
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      })

      if (filePath) {
        fs.writeFileSync(filePath, pdfBuffer)
        return { success: true, filePath }
      } else {
        return { success: false, cancelled: true }
      }
    } catch (error) {
      console.error('Failed to print to PDF:', error)
      throw error
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
      printWindow.destroy()
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
