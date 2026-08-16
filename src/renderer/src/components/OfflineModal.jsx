/* eslint-disable */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useNetworkStatus } from '../context/NetworkContext'

export default function OfflineModal() {
  const { isOffline, isOfflineModalOpen, closeOfflineModal, recheckConnection } = useNetworkStatus()
  const [retrying, setRetrying] = useState(false)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await recheckConnection(true)
    } finally {
      setTimeout(() => setRetrying(false), 600)
    }
  }

  const handleOk = () => {
    closeOfflineModal()
  }

  return (
    <AnimatePresence>
      {isOffline && isOfflineModalOpen && (
        <motion.div
          key="offline-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none"
        >
          <motion.div
            key="offline-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-[320px] sm:max-w-[340px] bg-white rounded-3xl shadow-2xl overflow-hidden text-center border border-gray-100 flex flex-col font-poppins"
          >
            {/* Top Red Header Banner with Tower & Alert Icon (Matches Reference 1) */}
            <div className="relative bg-[#FF3B30] text-white pt-8 pb-7 px-6 flex items-center justify-center overflow-hidden">
              {/* Subtle decorative background glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

              {/* Tower & Signal Broadcast Waves Graphic */}
              <div className="relative flex items-center justify-center w-24 h-24">
                {/* SVG Broadcast Tower & Signal Waves */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-20 h-20 text-white/90 drop-shadow-md"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* Outer Signal Wave Arc */}
                  <path d="M 20 40 A 38 38 0 0 1 80 40" strokeWidth="4.5" opacity="0.45" />
                  {/* Middle Signal Wave Arc */}
                  <path d="M 30 50 A 26 26 0 0 1 70 50" strokeWidth="4.5" opacity="0.75" />
                  {/* Inner Signal Wave Arc */}
                  <path d="M 40 60 A 14 14 0 0 1 60 60" strokeWidth="4.5" opacity="0.95" />

                  {/* Radio Antenna Mast / Tower */}
                  <circle cx="50" cy="62" r="3.5" fill="currentColor" />
                  <line x1="50" y1="65" x2="50" y2="78" strokeWidth="4" />
                  <path d="M 38 90 L 50 78 L 62 90" strokeWidth="4" />
                  <line x1="42" y1="84" x2="58" y2="84" strokeWidth="3.5" />
                </svg>

                {/* Floating Warning Badge */}
                <div className="absolute bottom-1 right-2 bg-white text-[#FF3B30] p-1 rounded-full shadow-lg border border-red-100 flex items-center justify-center animate-bounce-short">
                  <AlertTriangle className="w-4 h-4 fill-current stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 flex flex-col items-center text-center space-y-2 bg-white">
              <h3 className="text-2xl font-black text-navy-blue tracking-tight leading-tight">
                Whoops!
              </h3>

              <div className="space-y-1 pt-1 pb-3">
                <p className="text-sm font-bold text-gray-800 tracking-tight leading-snug">
                  No Internet Connection found.
                </p>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Check your connection or try again.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOk}
                  className="w-36 py-2.5 rounded-full bg-black hover:bg-neutral-800 active:scale-95 text-white font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>OK</span>
                </button>

                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="text-[11px] font-semibold text-gray-500 hover:text-navy-blue transition-colors flex items-center gap-1 cursor-pointer pt-1"
                >
                  <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin text-navy-blue' : ''}`} />
                  <span>{retrying ? 'Checking connection...' : 'Try Again'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
