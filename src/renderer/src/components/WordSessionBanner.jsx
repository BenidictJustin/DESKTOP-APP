import React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useWordBridge } from '../context/WordBridgeContext'
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, X, Save } from 'lucide-react'

export default function WordSessionBanner() {
  const { activeSessions, forceSync, closeSession, syncToast, setSyncToast } = useWordBridge()

  const sessionIds = Object.keys(activeSessions)
  const hasActiveSessions = sessionIds.length > 0

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none select-none">
      {/* Toast Notification */}
      <AnimatePresence>
        {syncToast && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              syncToast.type === 'error'
                ? 'bg-red-50/95 border-red-200 text-red-800'
                : syncToast.type === 'syncing'
                  ? 'bg-blue-50/95 border-blue-200 text-blue-800'
                  : 'bg-emerald-50/95 border-emerald-200 text-emerald-800'
            }`}
          >
            {syncToast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
            {syncToast.type === 'syncing' && (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
            )}
            {syncToast.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="leading-tight">{syncToast.message}</span>
            <button
              onClick={() => setSyncToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Word Session Card(s) */}
      <AnimatePresence>
        {hasActiveSessions &&
          sessionIds.map((id) => {
            const s = activeSessions[id]
            if (!s) return null

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="pointer-events-auto w-84 bg-white/95 backdrop-blur-md border border-blue-200/80 shadow-2xl rounded-2xl p-3.5 flex flex-col gap-2.5 text-gray-800"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-[#005a9e] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                      W
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-navy-blue truncate">
                        {s.reportTitle || s.fileName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Editing in Microsoft Word</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => closeSession(id)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                    title="Finish Word Session"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Bar inside Card */}
                <div className="flex items-center justify-between text-[11px] bg-blue-50/70 border border-blue-100 px-2.5 py-1.5 rounded-lg">
                  <span className="text-blue-900 flex items-center gap-1.5 font-medium">
                    {s.isSyncing ? (
                      <>
                        <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                        <span>Syncing to DommUnity...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Synced: {s.lastSyncedAt || 'Active'}</span>
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => forceSync(id)}
                    className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    title="Force immediate check from disk"
                  >
                    <Save className="w-3 h-3" />
                    <span>Sync Now</span>
                  </button>
                </div>

                {/* Footer hint */}
                <div className="flex items-center justify-between text-[10px] text-gray-400 px-0.5">
                  <span>Press <strong className="text-gray-600 font-semibold">Ctrl + S</strong> in Word to save</span>
                  <button
                    onClick={() => closeSession(id)}
                    className="text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    Finish Session
                  </button>
                </div>
              </motion.div>
            )
          })}
      </AnimatePresence>
    </div>
  )
}
