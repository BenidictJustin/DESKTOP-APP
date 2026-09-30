import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import { ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  checkInternet: () => ipcRenderer.invoke('check-internet'),
  convertDocxToPdfBuffer: (buffer) => ipcRenderer.invoke('convert-docx-to-pdf-buffer', { buffer }),
  exportHtmlToDocx: (data) => ipcRenderer.invoke('export-html-to-docx', data),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
  onUpdateAvailable: (callback) => {
    const handler = (_, info) => callback(info)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (_, info) => callback(info)
    ipcRenderer.on('update-not-available', handler)
    return () => ipcRenderer.removeListener('update-not-available', handler)
  },
  onDownloadProgress: (callback) => {
    const handler = (_, progress) => callback(progress)
    ipcRenderer.on('download-progress', handler)
    return () => ipcRenderer.removeListener('download-progress', handler)
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_, info) => callback(info)
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },
  onUpdateError: (callback) => {
    const handler = (_, err) => callback(err)
    ipcRenderer.on('update-error', handler)
    return () => ipcRenderer.removeListener('update-error', handler)
  },
  // Microsoft Word Desktop File Bridge APIs
  checkWordInstalled: () => ipcRenderer.invoke('word-bridge:check-word-installed'),
  openDocxInWord: (options) => ipcRenderer.invoke('word-bridge:open-document', options),
  forceSyncWordDocument: (options) => ipcRenderer.invoke('word-bridge:force-sync', options),
  closeWordSession: (options) => ipcRenderer.invoke('word-bridge:close-session', options),
  getActiveWordSessions: () => ipcRenderer.invoke('word-bridge:get-active-sessions'),
  onWordDocumentSaved: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('word-bridge:document-saved', handler)
    return () => ipcRenderer.removeListener('word-bridge:document-saved', handler)
  },
  onWordSessionClosed: (callback) => {
    const handler = (_, data) => callback(data)
    ipcRenderer.on('word-bridge:session-closed', handler)
    return () => ipcRenderer.removeListener('word-bridge:session-closed', handler)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
