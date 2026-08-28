import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, basename } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import dns from 'dns'
import net from 'net'

import { autoUpdater } from 'electron-updater'

// Configure autoUpdater log and settings
autoUpdater.logger = console
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

// Disable Chromium's print preview feature to force classic Windows native print dialog
app.commandLine.appendSwitch('disable-print-preview')

let mainWindow = null

// Robust internet verification in main process using DNS + raw TCP socket with strict safety timeout
function verifyInternetConnection() {
  return new Promise((resolve) => {
    let settled = false
    const done = (result) => {
      if (!settled) {
        settled = true
        clearTimeout(timeoutId)
        resolve(result)
      }
    }

    // Hard ceiling timeout: 2000ms max to prevent IPC calls from hanging
    const timeoutId = setTimeout(() => done(false), 2000)

    try {
      // 1. Try DNS lookup first
      dns.lookup('google.com', (err) => {
        if (!err) return done(true)

        dns.lookup('cloudflare.com', (err2) => {
          if (!err2) return done(true)

          // 2. Direct TCP socket to public DNS port 53 (fast fallback)
          try {
            const socket = net.createConnection(53, '8.8.8.8')
            socket.setTimeout(1200)
            socket.on('connect', () => {
              socket.destroy()
              done(true)
            })
            socket.on('error', () => {
              socket.destroy()
              done(false)
            })
            socket.on('timeout', () => {
              socket.destroy()
              done(false)
            })
          } catch {
            done(false)
          }
        })
      })
    } catch {
      done(false)
    }
  })
}

// IPC handler: check internet connectivity from main process
ipcMain.handle('check-internet', async () => {
  return await verifyInternetConnection()
})

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
    // Auto check for updates delayed by 4s to prevent blocking initial app startup/splash rendering
    if (!is.dev) {
      setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          console.warn('Failed to check for updates on startup:', err)
        })
      }, 4000)
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
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('check-for-updates', async () => {
  if (is.dev) {
    return { isDev: true, message: 'Auto-updates are disabled in Development mode.' }
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    return { success: true, version: result?.updateInfo?.version || null }
  } catch (error) {
    return { success: false, error: error?.message || 'Failed to check for updates' }
  }
})

ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
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
      const rawHtmlCardCount = (html.match(/class="pdf-page-card"/g) || []).length
      const rawHtmlIdCount = (html.match(/id="doc-viewer-page-/g) || []).length

      console.log('========================================')
      console.log('[STAGE 3: HIDDEN PRINT WINDOW RENDER]')
      console.log(`  - Temp HTML File Saved: ${tempPath}`)
      console.log(`  - Raw HTML .pdf-page-card Count: ${rawHtmlCardCount}`)
      console.log(`  - Raw HTML doc-viewer-page-* Count: ${rawHtmlIdCount}`)
      console.log(`  - Export Stamp: ${options?.exportStamp || 'none'}`)

      fs.writeFileSync(tempPath, html, 'utf8')
      await printWindow.loadURL(`file://${tempPath}`)

      // Wait for fonts, base64 images, and layouts to finish rendering
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Inspect DOM rendering state inside hidden print window
      const windowDomStats = await printWindow.webContents.executeJavaScript(`
        (() => {
          const cards = Array.from(document.querySelectorAll('.pdf-page-card'));
          const stamps = Array.from(document.querySelectorAll('.pdf-export-stamp')).map(el => el.innerText.trim());
          const cardSnippets = cards.map((c, idx) => {
            const text = (c.innerText || '').replace(/\\s+/g, ' ').trim();
            return {
              page: idx + 1,
              width: c.offsetWidth,
              height: c.offsetHeight,
              snippet: text.substring(0, 80) + '...'
            };
          });

          return {
            pageCardCount: cards.length,
            idPageCount: document.querySelectorAll('[id^="doc-viewer-page-"]').length,
            stampsCount: stamps.length,
            stampsList: stamps,
            bodyHeight: document.body ? document.body.offsetHeight : 0,
            cardSnippets: cardSnippets
          };
        })()
      `)

      console.log('  - PrintWindow Rendered DOM Stats:')
      console.log(`    * Rendered .pdf-page-card Count: ${windowDomStats.pageCardCount}`)
      console.log(`    * Rendered Stamps List: ${JSON.stringify(windowDomStats.stampsList)}`)
      console.log(`    * Body Rendered Height: ${windowDomStats.bodyHeight}px`)
      console.log(`    * Card Snippets: ${JSON.stringify(windowDomStats.cardSnippets, null, 2)}`)

      console.log('========================================')
      console.log('[STAGE 4: ELECTRON printToPDF GENERATION]')

      const pdfBuffer = await printWindow.webContents.printToPDF({
        printBackground: true,
        preferCSSPageSize: true,
        landscape: options?.landscape || false,
        margins: options?.margins || { marginType: 'none' }
      })

      const physicalPageCount = (pdfBuffer.toString('binary').match(/\/Type\s*\/Page\b/g) || []).length
      console.log(`  - Generated PDF Buffer Size: ${pdfBuffer.length} bytes`)
      console.log(`  - PHYSICAL PDF PAGE COUNT GENERATED (/Type /Page) = ${physicalPageCount}`)

      console.log('========================================')
      console.log('[STAGE 5: FILE SAVE PROMPT]')

      const isDocxDefault = options?.defaultFormat === 'docx'
      const baseTitle = (title || 'Document').replace(/\.(pdf|docx)$/i, '')
      const defaultExt = isDocxDefault ? 'docx' : 'pdf'
      const defaultName = `${baseTitle}.${defaultExt}`

      const filters = isDocxDefault
        ? [
            { name: 'DOCX Document', extensions: ['docx'] },
            { name: 'PDF Document', extensions: ['pdf'] }
          ]
        : [
            { name: 'PDF Document', extensions: ['pdf'] },
            { name: 'DOCX Document', extensions: ['docx'] }
          ]

      const { filePath } = await dialog.showSaveDialog({
        title: 'Save Report',
        defaultPath: join(app.getPath('downloads'), defaultName),
        filters
      })

      if (filePath) {
        try {
          const selectedExt = (filePath.split('.').pop() || '').toLowerCase()

          if (selectedExt === 'docx') {
            if (options?.originalDocxBase64) {
              const buffer = Buffer.from(options.originalDocxBase64, 'base64')
              fs.writeFileSync(filePath, buffer)
            } else if (options?.docxContent) {
              fs.writeFileSync(filePath, options.docxContent, 'utf8')
            } else {
              fs.writeFileSync(filePath, html, 'utf8')
            }
          } else {
            // PDF chosen
            if (options?.originalPdfBase64) {
              const buffer = Buffer.from(options.originalPdfBase64, 'base64')
              fs.writeFileSync(filePath, buffer)
            } else {
              fs.writeFileSync(filePath, pdfBuffer)
            }
          }

          const fileStat = fs.statSync(filePath)
          console.log(`[STAGE 5: FILE SAVE SUCCESS]`)
          console.log(`  - Saved File Path: ${filePath}`)
          console.log(`  - Saved File Format: ${selectedExt.toUpperCase()}`)
          console.log(`  - Saved File Size on Disk: ${fileStat.size} bytes`)
          console.log(`  - File Last Modified: ${fileStat.mtime.toISOString()}`)
          console.log('========================================')
          return { success: true, filePath, format: selectedExt }
        } catch (writeError) {
          if (writeError.code === 'EBUSY' || writeError.code === 'EPERM') {
            console.error(`[STAGE 5: FILE SAVE ERROR] File is locked by another process: ${filePath}`)
            dialog.showErrorBox(
              'File is Locked',
              `The file "${basename(filePath)}" is currently open in another application (like WPS Office or Adobe Reader). Please close the document in that application and try exporting again.`
            )
            return { success: false, error: 'File is locked by another process' }
          }
          throw writeError
        }
      } else {
        console.log('[STAGE 5: FILE SAVE CANCELLED BY USER]')
        return { success: false, cancelled: true }
      }
    } catch (error) {
      console.error('Failed to print to PDF:', error)
      throw error
    } finally {
      printWindow.destroy()
    }
  })

  // Native document printing IPC handler directly from Document Viewer HTML
  ipcMain.handle('print-document', async (event, { html, title, options }) => {
    const traceId = options?.traceId || `MAIN-PRINT-${Date.now()}`
    console.log('════════════════════════════════════════════════════')
    console.log(`[${traceId}] STEP 4: MAIN PROCESS 'print-document' handler entered`)
    console.log(`[${traceId}]   This handler calls webContents.print() ONLY`)
    console.log(`[${traceId}]   NO printToPDF, NO shell.openPath, NO save dialog`)
    console.log('════════════════════════════════════════════════════')

    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    
    // Position the 1x1 window at the center of the sender window to anchor the dialog correctly
    let x, y
    if (senderWindow) {
      const bounds = senderWindow.getBounds()
      x = Math.round(bounds.x + (bounds.width - 1) / 2)
      y = Math.round(bounds.y + (bounds.height - 1) / 2)
    }

    const printWindow = new BrowserWindow({
      width: 1,
      height: 1,
      x,
      y,
      show: true, // Must be true so the OS registers it as an active onscreen window
      frame: false,
      transparent: true,
      opacity: 0.0,
      parent: senderWindow || undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    const tempPath = join(app.getPath('temp'), `print-${Date.now()}.html`)

    try {
      console.log(`[${traceId}] STEP 4a: Writing temp HTML (${html.length} bytes) to ${tempPath}`)
      fs.writeFileSync(tempPath, html, 'utf8')

      // Save a copy to the workspace directory for debugging layout differences
      try {
        const debugPath = 'c:\\Users\\JOHN HAROLD SANTOS\\OneDrive\\Desktop\\CAPSTONE 2 - DOMMUNITY CODE\\DOMMUNITY-main\\debug-print.html'
        fs.writeFileSync(debugPath, html, 'utf8')
        console.log(`[${traceId}] Saved debug copy to ${debugPath}`)
      } catch (e) {
        console.error('Failed to write debug copy:', e)
      }
      
      console.log(`[${traceId}] STEP 4b: Loading temp HTML into hidden BrowserWindow...`)
      await printWindow.loadURL(`file://${tempPath}`)

      console.log(`[${traceId}] STEP 4c: Waiting 1000ms for fonts/images to render...`)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log(`[${traceId}] STEP 5: CALLING webContents.print() NOW (silent: false)`)
      console.log(`[${traceId}]   After this line, the OS print dialog should appear.`)
      console.log(`[${traceId}]   Nothing else happens until user interacts with the dialog.`)
      
      const printResult = await new Promise((resolve) => {
        printWindow.webContents.print(
          {
            silent: false,
            printBackground: true,
            deviceName: '',
            color: true,
            margins: options?.margins || { marginType: 'none' },
            landscape: options?.landscape || false,
            pageSize: options?.pageSize || 'A4',
            useSystemDialog: true
          },
          (success, failureReason) => {
            console.log(`[${traceId}] STEP 5 CALLBACK: webContents.print() finished`)
            console.log(`[${traceId}]   success: ${success}`)
            console.log(`[${traceId}]   failureReason: ${failureReason}`)
            resolve({ success, failureReason })
          }
        )
      })

      console.log(`[${traceId}] STEP 5 DONE: Print dialog closed. Result:`, printResult)
      await new Promise((resolve) => setTimeout(resolve, 500))
      return printResult
    } catch (error) {
      console.error(`[${traceId}] FAILED:`, error)
      throw error
    } finally {
      console.log(`[${traceId}] CLEANUP: Destroying printWindow and deleting temp file`)
      if (senderWindow && !senderWindow.isDestroyed()) {
        senderWindow.show()
        senderWindow.focus()
      }
      if (!printWindow.isDestroyed()) {
        printWindow.destroy()
      }
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
      } catch (e) {
        // ignore temp file cleanup error
      }
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
