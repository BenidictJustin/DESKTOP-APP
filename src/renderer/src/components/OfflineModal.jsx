/* eslint-disable */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { WifiOff, RefreshCw } from 'lucide-react'
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
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none font-poppins"
        >
          <motion.div
            key="offline-modal-card"
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="w-full max-w-[320px] sm:max-w-[350px] bg-white rounded-3xl p-8 sm:p-9 shadow-2xl border border-gray-100/90 flex flex-col items-center text-center"
          >
            {/* Soft Light-Red / Pink Rounded Icon Container */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[#FFF2F2] border border-red-100/80 flex items-center justify-center mb-6 shadow-xs">
              <WifiOff className="w-10 h-10 sm:w-11 sm:h-11 text-[#C8524B] stroke-[2.2]" />
            </div>

            {/* Heading */}
            <h3 className="text-xl sm:text-[22px] font-extrabold text-navy-blue tracking-tight leading-tight mb-2">
              No internet connection
            </h3>

            {/* Supporting Message */}
            <p className="text-xs sm:text-[13px] text-gray-500 font-medium leading-relaxed max-w-[240px] mb-7">
              Please check your internet connection and try again
            </p>

            {/* Action Buttons: Centered Retry & Okay */}
            <div className="w-full flex flex-col items-center gap-2.5">
              {/* Primary Retry Button */}
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="w-full max-w-[220px] py-3 rounded-full bg-[#C8524B] hover:bg-[#B5443E] active:scale-95 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-80"
              >
                {retrying && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{retrying ? 'Checking connection...' : 'Retry'}</span>
              </button>

              {/* Okay Button */}
              <button
                type="button"
                onClick={handleOk}
                className="w-full max-w-[220px] py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 active:scale-95 text-navy-blue font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center"
              >
                <span>Okay</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
