import React, { useState, useEffect } from 'react'
import { RefreshCw, Download, CheckCircle2, AlertCircle, Sparkles, ShieldCheck, Loader2 } from 'lucide-react'

export default function AboutVersionCard() {
  const [currentVersion, setCurrentVersion] = useState('1.0.2')
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
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
            System Version
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-black text-navy-blue tracking-tight">
              Version {currentVersion}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sig-green/10 text-sig-green border border-sig-green/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Official Build
            </span>
          </div>
        </div>

        <div>
          {status === 'downloaded' ? (
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 border border-emerald-400/30"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              Restart & Install Update
            </button>
          ) : (
            <button
              onClick={handleCheckUpdate}
              disabled={status === 'checking' || status === 'downloading'}
              className="flex items-center gap-2 bg-navy-blue hover:bg-navy-blue/90 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {status === 'checking' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : status === 'downloading' ? (
                <>
                  <Download className="w-4 h-4 animate-bounce" />
                  Downloading ({progress}%)
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Check for Updates
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Status Alert Banner */}
      {status !== 'idle' && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-start gap-3 transition-all ${
            status === 'up-to-date'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : status === 'available' || status === 'downloading' || status === 'downloaded'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : status === 'checking'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="mt-0.5">
            {status === 'up-to-date' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : status === 'available' || status === 'downloading' || status === 'downloaded' ? (
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
            ) : status === 'checking' ? (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p>{statusMessage}</p>

            {status === 'downloading' && (
              <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
