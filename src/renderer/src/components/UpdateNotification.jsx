import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Download, RefreshCw, CheckCircle2, X, AlertCircle } from 'lucide-react'
import appIcon from '../../../../resources/icon.png'

export default function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (!window.api) return

    const unsubAvailable = window.api.onUpdateAvailable?.((info) => {
      setUpdateInfo(info)
      setIsDismissed(false)
      setErrorMsg(null)
    })

    const unsubProgress = window.api.onDownloadProgress?.((progress) => {
      if (progress?.percent) {
        setDownloadProgress(Math.round(progress.percent))
      }
    })

    const unsubDownloaded = window.api.onUpdateDownloaded?.((info) => {
      setUpdateInfo(info)
      setIsDownloaded(true)
      setDownloadProgress(100)
    })

    const unsubError = window.api.onUpdateError?.((err) => {
      console.warn('AutoUpdate Error in renderer:', err)
      setErrorMsg(err)
    })

    return () => {
      unsubAvailable?.()
      unsubProgress?.()
      unsubDownloaded?.()
      unsubError?.()
    }
  }, [])

  const handleRestart = () => {
    if (window.api?.restartAndInstall) {
      window.api.restartAndInstall()
    }
  }

  if (isDismissed || (!updateInfo && !errorMsg)) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-[#020516]/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 text-white font-poppins"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/20 flex-shrink-0 shadow-inner">
              <img src={appIcon} alt="DommUnity" className="w-full h-full object-contain" />
              {isDownloaded ? (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-[#020516]">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              ) : errorMsg ? (
                <div className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-0.5 border border-[#020516]">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              ) : null}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white tracking-tight">
                {isDownloaded
                  ? 'Update Ready for Install'
                  : errorMsg
                    ? 'Update Check Status'
                    : `Software Update ${updateInfo?.version ? `v${updateInfo.version}` : ''}`}
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 font-medium">
                {isDownloaded
                  ? 'Click restart to apply the latest version of DommUnity.'
                  : errorMsg
                    ? errorMsg
                    : downloadProgress > 0
                      ? `Downloading update... ${downloadProgress}%`
                      : 'A new version is available and downloading.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar when downloading */}
        {!isDownloaded && !errorMsg && downloadProgress > 0 && (
          <div className="mt-3 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${downloadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Action Button */}
        {isDownloaded && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 border border-amber-400/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restart & Install Update
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
