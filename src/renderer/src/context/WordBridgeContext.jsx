import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { uploadDocxReportFile, updateReport, getReports } from '../services/db'
import { getDocxArrayBuffer } from '../components/editor/utils/editorHelpers'

const WordBridgeContext = createContext(null)

export function WordBridgeProvider({ children, user, onReportUpdated }) {
  const [activeSessions, setActiveSessions] = useState({})
  const [syncToast, setSyncToast] = useState(null) // { message, type: 'success' | 'error' | 'syncing' }
  const toastTimeoutRef = useRef(null)
  const activeSessionsRef = useRef({})

  // Keep ref in sync
  useEffect(() => {
    activeSessionsRef.current = activeSessions
  }, [activeSessions])

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setSyncToast({ message, type })
    toastTimeoutRef.current = setTimeout(() => {
      setSyncToast(null)
    }, duration)
  }, [])

  // Listen to background document saves from Electron main process
  useEffect(() => {
    if (!window.api?.onWordDocumentSaved) return

    const unsubSave = window.api.onWordDocumentSaved(async (data) => {
      const { reportId, fileName, buffer, size, timestamp } = data
      const session = activeSessionsRef.current[reportId] || {}

      setActiveSessions((prev) => ({
        ...prev,
        [reportId]: {
          ...prev[reportId],
          reportId,
          fileName,
          isSyncing: true,
          status: 'syncing'
        }
      }))

      showToast(`Saving changes from Microsoft Word...`, 'syncing', 3000)

      try {
        const file = new File(
          [new Uint8Array(buffer)],
          fileName || 'document.docx',
          { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
        )

        const ay = session.academicYear || '2024-2025'
        const ev = session.eventId || null

        // 1. Upload updated DOCX to Firebase Storage (with Base64 fallback)
        const downloadUrl = await uploadDocxReportFile(ay, ev, file)

        // 2. Update Firestore document metadata
        await updateReport(
          reportId,
          {
            originalDocxUrl: downloadUrl,
            originalDocxName: fileName,
            originalDocxSize: size,
            submissionType: 'docx_upload',
            updatedAt: new Date().toISOString()
          },
          user?.uid || 'coordinator'
        )

        const syncTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        setActiveSessions((prev) => ({
          ...prev,
          [reportId]: {
            ...prev[reportId],
            isSyncing: false,
            status: 'synced',
            lastSyncedAt: syncTime,
            lastSyncedUrl: downloadUrl
          }
        }))

        showToast('Document saved and synchronized successfully.', 'success', 4500)

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dommunity:word-docx-updated', {
              detail: {
                reportId,
                fileName,
                buffer: new Uint8Array(buffer),
                downloadUrl
              }
            })
          )
        }

        // Trigger parent refresh if provided
        if (typeof onReportUpdated === 'function') {
          onReportUpdated(reportId)
        }
      } catch (err) {
        console.error('[WordBridge] Background upload failed:', err)
        setActiveSessions((prev) => ({
          ...prev,
          [reportId]: {
            ...prev[reportId],
            isSyncing: false,
            status: 'error',
            error: err.message
          }
        }))
        showToast(`Sync failed: ${err.message}. Your file is still safe in Word.`, 'error', 6000)
      }
    })

    const unsubClose = window.api.onWordSessionClosed?.((data) => {
      const { reportId, fileName } = data
      setActiveSessions((prev) => {
        const updated = { ...prev }
        delete updated[reportId]
        return updated
      })
      showToast(`Microsoft Word editing session finished.`, 'info', 3500)
      if (typeof onReportUpdated === 'function') {
        onReportUpdated(reportId)
      }
    })

    return () => {
      if (typeof unsubSave === 'function') unsubSave()
      if (typeof unsubClose === 'function') unsubClose()
    }
  }, [user, onReportUpdated, showToast])

  /**
   * Launch Microsoft Word session for a report.
   */
  const startWordSession = useCallback(
    async ({ report, title, buffer, htmlFallback, isOffline = false }) => {
      if (isOffline) {
        showToast('Cannot open Microsoft Word: Internet connection is offline.', 'error', 5000)
        return { success: false, error: 'Offline' }
      }

      if (!window.api?.openDocxInWord) {
        showToast('Microsoft Word Bridge is not supported in this environment.', 'error', 5000)
        return { success: false, error: 'API not supported' }
      }

      // Check Word installation
      const checkRes = await window.api.checkWordInstalled()
      if (!checkRes?.installed) {
        showToast(
          'Microsoft Word desktop is not detected on this computer. Please install Microsoft Word or continue using the built-in Document Editor.',
          'error',
          6000
        )
        return { success: false, error: 'Word not installed' }
      }

      showToast('Preparing document for Microsoft Word...', 'syncing', 3000)

      let docxBuffer = buffer
      if (!docxBuffer && report?.originalDocxUrl) {
        try {
          docxBuffer = await getDocxArrayBuffer(report.originalDocxUrl)
        } catch (err) {
          showToast(`Failed to download document: ${err.message}`, 'error', 5000)
          return { success: false, error: err.message }
        }
      }

      const reportTitle = title || report?.activityTitle || 'Report'
      const fileName = report?.originalDocxName || `${reportTitle.replace(/[<>:"/\\|?*]/g, '_')}.docx`

      const res = await window.api.openDocxInWord({
        reportId: report.id,
        buffer: docxBuffer,
        fileName,
        reportTitle,
        htmlFallback: htmlFallback || report?.narrative
      })

      if (!res.success) {
        showToast(`Failed to launch Word: ${res.error}`, 'error', 5000)
        return res
      }

      setActiveSessions((prev) => ({
        ...prev,
        [report.id]: {
          reportId: report.id,
          reportTitle,
          fileName: res.fileName,
          academicYear: report.academicYear || '2024-2025',
          eventId: report.eventId || null,
          status: 'active',
          isSyncing: false,
          lastSyncedAt: 'Just opened',
          openedAt: new Date().toLocaleTimeString()
        }
      }))

      showToast('Document opened in Microsoft Word. Press Ctrl+S in Word to sync changes.', 'success', 5000)
      return { success: true, fileName: res.fileName }
    },
    [showToast]
  )

  const forceSync = useCallback(
    async (reportId) => {
      if (!window.api?.forceSyncWordDocument) return
      showToast('Checking for changes from Microsoft Word...', 'syncing', 2000)
      const res = await window.api.forceSyncWordDocument({ reportId: String(reportId) })
      if (!res.success) {
        showToast(`Sync error: ${res.error}`, 'error', 4500)
      } else {
        showToast('Document synchronized successfully.', 'success', 3000)
      }
    },
    [showToast]
  )

  const closeSession = useCallback(
    async (reportId) => {
      if (!window.api?.closeWordSession) return
      await window.api.closeWordSession({ reportId })
      setActiveSessions((prev) => {
        const next = { ...prev }
        delete next[reportId]
        return next
      })
      showToast('Microsoft Word session ended.', 'info', 3000)
    },
    [showToast]
  )

  return (
    <WordBridgeContext.Provider
      value={{
        activeSessions,
        startWordSession,
        forceSync,
        closeSession,
        syncToast,
        setSyncToast
      }}
    >
      {children}
    </WordBridgeContext.Provider>
  )
}

export function useWordBridge() {
  const context = useContext(WordBridgeContext)
  if (!context) {
    throw new Error('useWordBridge must be used within a WordBridgeProvider')
  }
  return context
}
