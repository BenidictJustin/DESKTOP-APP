import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import logo from '../assets/logo.png'
import logo3 from '../assets/logo3.png'
import { splashContainerVariants } from './motion/motionConfig'

export default function SplashScreen({ onComplete }) {
  const [isOnline, setIsOnline] = useState(null)
  const [minTimePassed, setMinTimePassed] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)

  // Refs to avoid stale closures in polling interval
  const isOnlineRef = useRef(null)
  const isMountedRef = useRef(true)

  // Keep ref in sync with state
  useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  // Internet connection verification.
  // Primary: use Electron main process IPC (no CORS restrictions, reliable).
  // Fallback: renderer-side fetch with no-cors (opaque response resolves = online, rejects = offline).
  const checkInternet = useCallback(async () => {
    // Quick fail if browser API says offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false
    }

    // Primary: Electron IPC-based check (main process, no CORS)
    // If IPC succeeds, return the result. If it fails (handler not registered),
    // fall through to the fetch fallback — do NOT return false here.
    if (window.api && typeof window.api.checkInternet === 'function') {
      try {
        const result = await window.api.checkInternet()
        return !!result
      } catch {
        // IPC handler not registered or errored — fall through to fetch fallback
      }
    }

    // Fallback: renderer-side fetch with no-cors.
    // With mode:'no-cors', the promise resolves with an opaque response when
    // network is reachable, and rejects with a TypeError when offline.
    // The resolve/reject itself is the connectivity signal.
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      await fetch(`https://www.google.com/generate_204?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return true
    } catch {
      // First endpoint failed, try a second one
    }

    // Second fallback endpoint
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      await fetch(`https://clients3.google.com/generate_204?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return true
    } catch {
      return false
    }
  }, [])

  // Handle minimum initial splash duration (1.5s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimePassed(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Single stable polling effect — runs once on mount, never tears down due to state changes
  useEffect(() => {
    isMountedRef.current = true

    const runCheck = async () => {
      const online = await checkInternet()
      if (isMountedRef.current) {
        setIsOnline(online)
      }
    }

    // Initial check
    runCheck()

    // Browser online/offline events for instant detection
    const handleOnline = () => runCheck()
    const handleOffline = () => {
      if (isMountedRef.current) setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Poll every 2s — always polls until online is confirmed,
    // then stops polling (no need to keep checking once online)
    const intervalId = setInterval(() => {
      if (!isOnlineRef.current) {
        runCheck()
      }
    }, 2000)

    return () => {
      isMountedRef.current = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [checkInternet])

  const hasCompletedRef = useRef(false)

  // Proceed only when minimum display time is reached AND internet is verified
  useEffect(() => {
    if (minTimePassed && isOnline && !hasCompletedRef.current) {
      hasCompletedRef.current = true
      setIsFadingOut(true)
      const completeTimer = setTimeout(() => {
        if (onComplete) onComplete()
      }, 500)
      return () => clearTimeout(completeTimer)
    }
  }, [minTimePassed, isOnline, onComplete])

  return (
    <motion.div
      className={`fixed inset-0 z-[99999] bg-[#020516] flex flex-col items-center justify-center font-poppins selection:bg-sig-green/20 overflow-hidden transition-opacity duration-500 ease-in-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: [0.4, 0, 1, 1] } }}
    >
      {/* Background Banner Graphic (logo3.png) - Complete Uncropped Artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Blurred background layer to fill margins on any aspect ratio */}
        <img
          src={logo3}
          alt="Background Blur"
          className="absolute inset-0 w-full h-full object-cover opacity-50 filter blur-xl scale-110 pointer-events-none"
        />
        {/* Clean foreground layer - fully visible, no cropping */}
        <img
          src={logo3}
          alt="Background Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85 filter brightness-105 contrast-105 pointer-events-none"
        />
        {/* Subtle Dark Vignette & Gradient Overlay for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020519]/40 via-[#030E69]/30 to-[#02061f]/55 backdrop-blur-[1px]" />
      </div>

      {/* Main Splash Container - Perfectly Centered */}
      <motion.div
        className="flex flex-col items-center justify-center text-center z-10 px-6 relative"
        variants={splashContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Focal Point Dark Backdrop Glow for High Contrast */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#020516]/80 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sig-green/20 rounded-full blur-3xl pointer-events-none" />

        {/* Direct Focal Point Logo */}
        <motion.img
          src={logo}
          alt="DommUnity Main Logo"
          className="h-32 w-32 md:h-40 md:w-40 object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)] mb-4 relative z-10"
          animate={{
            y: [0, -5, 0]
          }}
          transition={{
            duration: 3.5,
            ease: 'easeInOut',
            repeat: Infinity
          }}
        />

        {/* DommUnity Title in Bright Sig-Green */}
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-sig-green tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] relative z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          DommUnity
        </motion.h1>
      </motion.div>

      {/* Subtle, minimalist connection status at bottom */}
      {isOnline === false && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-2 text-[12px] font-normal tracking-wide text-gray-400/90 whitespace-nowrap select-none pointer-events-none z-20"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
          </span>
          <span>No internet connection. Waiting for connection...</span>
        </motion.div>
      )}
    </motion.div>
  )
}
