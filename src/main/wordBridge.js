import { app, shell, ipcMain } from 'electron'
import fs from 'fs'
import { join } from 'path'
import crypto from 'crypto'
import { exec } from 'child_process'
import JSZip from 'jszip'

// Active Word sessions map: reportId -> SessionObject
const activeSessions = new Map()

/**
 * Check if Microsoft Word is installed on the system (Windows Registry query).
 */
export function isWordInstalled() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      return resolve(false)
    }
    exec('reg query HKCR\\Word.Application', (err, stdout) => {
      if (!err && stdout && stdout.includes('Word.Application')) {
        resolve(true)
      } else {
        exec('assoc .docx', (err2, stdout2) => {
          resolve(!err2 && stdout2 && stdout2.toLowerCase().includes('word'))
        })
      }
    })
  })
}

/**
 * Compute SHA-256 hash of a buffer for deduplication.
 */
function computeHash(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

/**
 * Safely read a file with retries to handle Windows file locking while Word writes.
 */
async function safeReadFileWithRetry(filePath, maxRetries = 12, delayMs = 250) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (!fs.existsSync(filePath)) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      const stat = fs.statSync(filePath)
      if (stat.size < 100) {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      const buffer = fs.readFileSync(filePath)
      // Check for ZIP magic bytes (0x50, 0x4B, 0x03, 0x04)
      if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b) {
        return buffer
      }
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EPERM') {
        await new Promise((r) => setTimeout(r, delayMs))
        continue
      }
      throw err
    }
    await new Promise((r) => setTimeout(r, delayMs))
  }
  return null
}

/**
 * Generate a clean standard DOCX template via JSZip if no existing DOCX exists.
 */
async function createDefaultTemplateDocxBuffer(title = 'Community Extension Report') {
  const zip = new JSZip()

  // [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`
  )

  // _rels/.rels
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  )

  // word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`
  )

  // word/settings.xml
  zip.file(
    'word/settings.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:zoom w:percent="100"/>
  <w:defaultTabStop w:val="720"/>
</w:settings>`
  )

  // word/styles.xml
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:color w:val="000000"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`
  )

  const safeXmlTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // word/document.xml
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
          <w:color w:val="030E69"/>
        </w:rPr>
        <w:t>DOMINICAN COLLEGE OF TARLAC, INC.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="480"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
          <w:color w:val="333333"/>
        </w:rPr>
        <w:t>COMMUNITY EXTENSION SERVICES</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="720"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="000000"/>
        </w:rPr>
        <w:t>${safeXmlTitle}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:pPr>
        <w:spacing w:after="240" w:line="360" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:t>Start typing your report details here. Use Microsoft Word's ribbons for formatting, inserting tables, photos, headers, footers, and page numbers.</w:t>
      </w:r>
    </w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>`
  )

  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

/**
 * Convert HTML to DOCX using Word COM if HTML exists but no DOCX buffer is present.
 */
async function convertHtmlToDocxBuffer(html, title) {
  if (process.platform !== 'win32') {
    return await createDefaultTemplateDocxBuffer(title)
  }
  const tempDir = app.getPath('temp')
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const inputPath = join(tempDir, `docx-html-in-${uniqueId}.html`)
  const outputPath = join(tempDir, `docx-html-out-${uniqueId}.docx`)

  try {
    fs.writeFileSync(inputPath, html, 'utf8')
    const psScript = `
      $inputPath = ${JSON.stringify(inputPath)}
      $outputPath = ${JSON.stringify(outputPath)}
      try {
        $word = New-Object -ComObject Word.Application
        $word.Visible = $false
        $word.DisplayAlerts = 0
        $doc = $word.Documents.Open($inputPath, $false, $true)
        $doc.SaveAs2([ref]$outputPath, [ref]16)
        try { $doc.Close([ref]0) } catch {}
        try { $word.Quit() } catch {}
        try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null } catch {}
        [System.GC]::Collect()
        [System.GC]::WaitForPendingFinalizers()
      } catch {
        Write-Error $_.Exception.Message
      }
    `
    const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64')
    await new Promise((resolve, reject) => {
      exec(
        `powershell -NoProfile -NonInteractive -EncodedCommand ${encodedCommand}`,
        { timeout: 25000 },
        (err, stdout, stderr) => {
          if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 100) {
            resolve(stdout)
          } else {
            reject(new Error(stderr || err?.message || 'Word HTML to DOCX failed'))
          }
        }
      )
    })
    return fs.readFileSync(outputPath)
  } catch (err) {
    console.warn('[WordBridge] HTML to DOCX COM conversion fallback to JSZip:', err.message)
    return await createDefaultTemplateDocxBuffer(title)
  } finally {
    try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath) } catch {}
    try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) } catch {}
  }
}

/**
 * Safely clean up session resources and temporary files.
 */
function cleanupSession(reportId, removeFiles = true) {
  const sid = String(reportId)
  const session = activeSessions.get(sid) || activeSessions.get(reportId)
  if (!session) return

  if (session.debounceTimer) {
    clearTimeout(session.debounceTimer)
    session.debounceTimer = null
  }
  if (session.pollInterval) {
    clearInterval(session.pollInterval)
    session.pollInterval = null
  }
  if (session.watcher) {
    try {
      session.watcher.close()
    } catch {}
    session.watcher = null
  }

  if (removeFiles && session.sessionDir && fs.existsSync(session.sessionDir)) {
    try {
      const lockFileName = `~$${session.fileName}`
      const lockFilePath = join(session.sessionDir, lockFileName)
      if (!fs.existsSync(lockFilePath)) {
        fs.rmSync(session.sessionDir, { recursive: true, force: true })
      }
    } catch (e) {
      console.warn(`[WordBridge] Temp directory cleanup delayed for ${sid}:`, e.message)
    }
  }

  activeSessions.delete(sid)
  activeSessions.delete(reportId)
}

/**
 * Start dual-layer monitoring for an active Word editing session.
 */
function startSessionMonitoring(session, getMainWindow) {
  const { reportId, sessionDir, targetPath, fileName } = session

  const triggerSyncCheck = async () => {
    if (session.isSyncing) return
    session.isSyncing = true
    try {
      const updatedBuffer = await safeReadFileWithRetry(targetPath, 12, 250)
      if (!updatedBuffer) return

      const hash = computeHash(updatedBuffer)
      if (hash === session.lastSyncedHash) {
        // Unchanged
        return
      }

      session.lastSyncedHash = hash
      const stat = fs.statSync(targetPath)
      session.lastMtime = stat.mtimeMs

      const win = getMainWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send('word-bridge:document-saved', {
          reportId: session.reportId,
          fileName: session.fileName,
          buffer: updatedBuffer,
          size: updatedBuffer.byteLength,
          hash,
          timestamp: new Date().toISOString()
        })
      }
    } catch (err) {
      console.warn(`[WordBridge] Error reading file during sync for report ${reportId}:`, err.message)
    } finally {
      session.isSyncing = false
    }
  }

  // 1. Directory Watcher
  try {
    session.watcher = fs.watch(sessionDir, (eventType, triggeredName) => {
      if (!triggeredName) return
      if (
        triggeredName === fileName ||
        triggeredName.endsWith('.docx') ||
        triggeredName.endsWith('.tmp')
      ) {
        if (session.debounceTimer) clearTimeout(session.debounceTimer)
        session.debounceTimer = setTimeout(triggerSyncCheck, 800)
      }
    })
  } catch (watchErr) {
    console.warn(`[WordBridge] Directory watcher setup warning:`, watchErr.message)
  }

  // 2. Heartbeat Polling (every 2.5s)
  session.pollInterval = setInterval(async () => {
    try {
      if (!fs.existsSync(targetPath)) return

      const stat = fs.statSync(targetPath)
      if (stat.mtimeMs !== session.lastMtime) {
        if (session.debounceTimer) clearTimeout(session.debounceTimer)
        session.debounceTimer = setTimeout(triggerSyncCheck, 600)
      }

      // Check Word lock file: ~$fileName
      const lockFileName = `~$${fileName}`
      const lockFilePath = join(sessionDir, lockFileName)
      const lockExists = fs.existsSync(lockFilePath)

      if (lockExists) {
        session.lockFileSeen = true
      } else if (session.lockFileSeen) {
        // Run a sync check when lock file disappears (Word saved/closed)
        await triggerSyncCheck()
        session.lockFileSeen = false
      }
    } catch (pollErr) {
      // Ignored
    }
  }, 2500)
}

/**
 * Initialize all Word Bridge IPC handlers.
 */
export function initWordBridge(getMainWindow) {
  // Check Word installation
  ipcMain.handle('word-bridge:check-word-installed', async () => {
    const installed = await isWordInstalled()
    return { installed }
  })

  // Open Document in Microsoft Word
  ipcMain.handle('word-bridge:open-document', async (event, {
    reportId,
    buffer,
    fileName,
    reportTitle,
    htmlFallback
  }) => {
    try {
      if (!reportId) {
        return { success: false, error: 'Report ID is required.' }
      }

      // Check installation
      const wordAvailable = await isWordInstalled()
      if (!wordAvailable) {
        return {
          success: false,
          error:
            'Microsoft Word is not detected on this computer. Please install Microsoft Word desktop or continue using the built-in Document Editor.'
        }
      }

      // Session Directory
      const sessionDir = join(app.getPath('userData'), 'word-sessions', String(reportId))
      fs.mkdirSync(sessionDir, { recursive: true })

      const safeTitle = (reportTitle || fileName || `Report-${reportId}`)
        .replace(/[<>:"/\\|?*]/g, '_')
        .trim()
      const docxFileName = safeTitle.toLowerCase().endsWith('.docx') ? safeTitle : `${safeTitle}.docx`
      const targetPath = join(sessionDir, docxFileName)

      // Prepare DOCX binary
      let fileBuffer = null
      if (buffer) {
        fileBuffer = Buffer.from(buffer)
      } else if (htmlFallback && htmlFallback !== '<p></p>') {
        fileBuffer = await convertHtmlToDocxBuffer(htmlFallback, safeTitle)
      } else {
        fileBuffer = await createDefaultTemplateDocxBuffer(safeTitle)
      }

      if (
        !fileBuffer ||
        fileBuffer.length < 100 ||
        fileBuffer[0] !== 0x50 ||
        fileBuffer[1] !== 0x4b
      ) {
        return { success: false, error: 'Invalid or unreadable DOCX binary data.' }
      }

      // If session exists, cleanly stop old monitoring
      if (activeSessions.has(reportId)) {
        cleanupSession(reportId, false)
      }

      // Clean up any stale docx files in sessionDir that differ from docxFileName
      try {
        const existingFiles = fs.readdirSync(sessionDir)
        for (const f of existingFiles) {
          if (f.endsWith('.docx') && f !== docxFileName && !f.startsWith('~$')) {
            try { fs.unlinkSync(join(sessionDir, f)) } catch {}
          }
        }
      } catch {}

      // Write file
      fs.writeFileSync(targetPath, fileBuffer)
      const initialHash = computeHash(fileBuffer)
      const initialStat = fs.statSync(targetPath)

      // Open with Microsoft Word
      const openError = await shell.openPath(targetPath)
      if (openError) {
        try {
          fs.unlinkSync(targetPath)
        } catch {}
        return {
          success: false,
          error: `Could not launch Microsoft Word: ${openError}`
        }
      }

      // Track session
      const sid = String(reportId)
      const session = {
        reportId: sid,
        sessionDir,
        targetPath,
        fileName: docxFileName,
        lastSyncedHash: initialHash,
        lastMtime: initialStat.mtimeMs,
        watcher: null,
        debounceTimer: null,
        pollInterval: null,
        lockFileSeen: false,
        isSyncing: false
      }

      startSessionMonitoring(session, getMainWindow)
      activeSessions.set(sid, session)

      return {
        success: true,
        reportId: sid,
        fileName: docxFileName,
        path: targetPath,
        message: 'Document successfully opened in Microsoft Word.'
      }
    } catch (err) {
      console.error('[WordBridge] open-document error:', err)
      return { success: false, error: err.message || 'Failed to open document in Word.' }
    }
  })

  // Force Sync Document
  ipcMain.handle('word-bridge:force-sync', async (event, { reportId }) => {
    const key = reportId ? String(reportId) : ''
    let session = key ? (activeSessions.get(key) || activeSessions.get(reportId)) : null

    // Fallback 1: If session not matched directly, check if any active session exists in memory
    if (!session && activeSessions.size > 0) {
      if (key) {
        for (const [id, s] of activeSessions.entries()) {
          if (String(id).includes(key) || key.includes(String(id))) {
            session = s
            break
          }
        }
      }
      if (!session) {
        session = activeSessions.values().next().value
      }
    }

    // Fallback 2: Check disk sessions directory
    if (!session) {
      const baseDir = join(app.getPath('userData'), 'word-sessions')
      if (fs.existsSync(baseDir)) {
        const subdirs = fs.readdirSync(baseDir)
        let matchedDir = null
        if (key && subdirs.includes(key)) {
          matchedDir = key
        } else if (subdirs.length > 0) {
          const sorted = subdirs
            .map((d) => {
              try {
                return { d, mtime: fs.statSync(join(baseDir, d)).mtimeMs }
              } catch {
                return { d, mtime: 0 }
              }
            })
            .sort((a, b) => b.mtime - a.mtime)
          matchedDir = sorted[0].d
        }

        if (matchedDir) {
          const sessionDir = join(baseDir, matchedDir)
          const files = fs.readdirSync(sessionDir).filter((f) => f.endsWith('.docx') && !f.startsWith('~$'))
          if (files.length > 0) {
            const sortedFiles = files
              .map((f) => {
                try {
                  return { f, mtime: fs.statSync(join(sessionDir, f)).mtimeMs }
                } catch {
                  return { f, mtime: 0 }
                }
              })
              .sort((a, b) => b.mtime - a.mtime)
            const fileName = sortedFiles[0].f
            const targetPath = join(sessionDir, fileName)
            const initialStat = fs.statSync(targetPath)
            const fileBuf = fs.readFileSync(targetPath)
            session = {
              reportId: matchedDir,
              sessionDir,
              targetPath,
              fileName,
              lastSyncedHash: computeHash(fileBuf),
              lastMtime: initialStat.mtimeMs,
              watcher: null,
              debounceTimer: null,
              pollInterval: null,
              lockFileSeen: false,
              isSyncing: false
            }
            startSessionMonitoring(session, getMainWindow)
            activeSessions.set(matchedDir, session)
          }
        }
      }
    }

    if (!session) {
      return { success: false, error: 'No active Word document found on disk or in memory.' }
    }

    try {
      const buffer = await safeReadFileWithRetry(session.targetPath, 8, 200)
      if (!buffer) {
        return { success: false, error: 'Could not read current document from disk.' }
      }

      const hash = computeHash(buffer)
      session.lastSyncedHash = hash
      const stat = fs.statSync(session.targetPath)
      session.lastMtime = stat.mtimeMs

      const win = getMainWindow()
      if (win && !win.isDestroyed()) {
        win.webContents.send('word-bridge:document-saved', {
          reportId: session.reportId,
          fileName: session.fileName,
          buffer,
          size: buffer.byteLength,
          hash,
          timestamp: new Date().toISOString()
        })
      }

      return { success: true, message: 'Document synchronized successfully.' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // Close Session
  ipcMain.handle('word-bridge:close-session', async (event, { reportId }) => {
    const key = reportId ? String(reportId) : ''
    let session = key ? (activeSessions.get(key) || activeSessions.get(reportId)) : null
    if (!session && activeSessions.size === 1) {
      session = activeSessions.values().next().value
    }
    if (session) {
      cleanupSession(session.reportId, true)
    }
    return { success: true }
  })

  // Get Active Sessions
  ipcMain.handle('word-bridge:get-active-sessions', () => {
    const list = []
    for (const [id, s] of activeSessions.entries()) {
      list.push({
        reportId: id,
        fileName: s.fileName,
        lockFileSeen: s.lockFileSeen
      })
    }
    return list
  })

  // Clean up all sessions on quit
  app.on('before-quit', () => {
    for (const reportId of activeSessions.keys()) {
      cleanupSession(reportId, false)
    }
  })
}
