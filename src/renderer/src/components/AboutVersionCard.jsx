/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { RefreshCw, Download, CheckCircle2, AlertCircle, ArrowUpCircle, ShieldCheck, Loader2 } from 'lucide-react'
import { useNetworkStatus } from '../context/NetworkContext'

export default function AboutVersionCard() {
  const { isOffline } = useNetworkStatus()
  const [currentVersion, setCurrentVersion] = useState('1.0.5')
  const [status, setStatus] = useState('idle') // 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error'
  const [updateInfo, setUpdateInfo] = useState(null)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    // Fetch initial app version
    if (window.api?.getAppVersion) {
      window.api.getAppVersion().then((ver) => {
        if (ver) setCurrentVersion(ver)
      }).catch(() => {})
    }

    if (!window.api) return

    const unsubAvailable = window.api.onUpdateAvailable?.((info) => {
      setUpdateInfo(info)
      setStatus('available')
      setStatusMessage(`New version v${info?.version || ''} available on GitHub.`)
    })

    const unsubNotAvailable = window.api.onUpdateNotAvailable?.((info) => {
      setStatus('up-to-date')
      setStatusMessage('You are using the latest version.')
    })

    const unsubProgress = window.api.onDownloadProgress?.((p) => {
      setStatus('downloading')
      if (p?.percent) {
        setProgress(Math.round(p.percent))
      }
    })

    const unsubDownloaded = window.api.onUpdateDownloaded?.((info) => {
      setUpdateInfo(info)
      setStatus('downloaded')
      setProgress(100)
      setStatusMessage('Update downloaded and ready to install.')
    })

    const unsubError = window.api.onUpdateError?.((err) => {
      setStatus('error')
      setStatusMessage(typeof err === 'string' ? err : 'Unable to check for updates.')
    })

    return () => {
      unsubAvailable?.()
      unsubNotAvailable?.()
      unsubProgress?.()
      unsubDownloaded?.()
      unsubError?.()
    }
  }, [])

  const handleCheckUpdate = async () => {
    if (isOffline) {
      setStatus('error')
      setStatusMessage('No internet connection. Please connect to the internet to check for updates.')
      return
    }

    if (!window.api?.checkForUpdates) {
      setStatus('error')
      setStatusMessage('Auto-updater is not available in development preview.')
      return
    }

    setStatus('checking')
    setStatusMessage('Checking GitHub release for updates...')
    
    try {
      const res = await window.api.checkForUpdates()
      if (res?.isDev) {
        setStatus('error')
        setStatusMessage('Auto-updates are disabled in Development mode.')
      } else if (res?.success === false) {
        setStatus('error')
        setStatusMessage(res.error || 'Failed to check for updates.')
      }
    } catch (err) {
      setStatus('error')
      setStatusMessage(err?.message || 'Error communicating with update server.')
    }
  }

  const handleRestart = () => {
    if (window.api?.restartAndInstall) {
      window.api.restartAndInstall()
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {/* Version info + Action button row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-navy-blue tracking-tight">
            v{currentVersion}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sig-green/10 text-sig-green border border-sig-green/20">
            <ShieldCheck className="w-3 h-3" />
            Official
          </span>
        </div>

        {status === 'downloaded' ? (
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 border border-emerald-400/30"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            Restart & Install
          </button>
        ) : (
          <button
            onClick={handleCheckUpdate}
            disabled={status === 'checking' || status === 'downloading'}
            className="flex items-center gap-1.5 bg-navy-blue hover:bg-navy-blue/90 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {status === 'checking' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking...
              </>
            ) : status === 'downloading' ? (
              <>
                <Download className="w-3.5 h-3.5 animate-bounce" />
                Downloading ({progress}%)
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Check for Updates
              </>
            )}
          </button>
        )}
      </div>

      {/* Status Alert (compact) */}
      {status !== 'idle' && (
        <div
          className={`px-3 py-2 rounded-xl border text-[11px] font-semibold flex items-center gap-2 transition-all ${
            status === 'up-to-date'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : status === 'available' || status === 'downloading' || status === 'downloaded'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : status === 'checking'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {status === 'up-to-date' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : status === 'available' || status === 'downloading' || status === 'downloaded' ? (
            <ArrowUpCircle className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
          ) : status === 'checking' ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage}</span>

          {status === 'downloading' && (
            <div className="w-20 bg-amber-200/60 h-1.5 rounded-full overflow-hidden ml-1">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
