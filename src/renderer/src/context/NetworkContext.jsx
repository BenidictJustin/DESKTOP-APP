/* eslint-disable */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const NetworkContext = createContext({
  isOnline: true,
  isOffline: false,
  isOfflineModalOpen: false,
  openOfflineModal: () => {},
  closeOfflineModal: () => {},
  recheckConnection: async () => true,
  registerReconnectHandler: () => () => {}
})

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState(false)
  const isOnlineRef = useRef(isOnline)
  const reconnectListenersRef = useRef(new Set())
  const checkingRef = useRef(false)
  const isInitialMountRef = useRef(true)

  useEffect(() => {
    isOnlineRef.current = isOnline
  }, [isOnline])

  // Clear initial mount flag after 3 seconds (startup phase)
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMountRef.current = false
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Connection verification method
  const checkConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false
    }

    if (window.api && typeof window.api.checkInternet === 'function') {
      try {
        const result = await Promise.race([
          window.api.checkInternet(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ])
        return !!result
      } catch {
        // Fallback to fetch
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      await fetch(`https://www.google.com/generate_204?t=${Date.now()}`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return true
    } catch {
      // Second endpoint fallback
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
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

  const verifyAndSetStatus = useCallback(
    async (forceNotify = false) => {
      if (checkingRef.current) return isOnlineRef.current
      checkingRef.current = true
      try {
        const online = await checkConnection()
        const prev = isOnlineRef.current
        setIsOnline(online)
        isOnlineRef.current = online

        if (!online && prev !== false && !isInitialMountRef.current) {
          setIsOfflineModalOpen(true)
        } else if (online) {
          setIsOfflineModalOpen(false)
        }

        // When transition from offline to online occurs, trigger reconnect callbacks
        if ((!prev && online) || (online && forceNotify)) {
          reconnectListenersRef.current.forEach((listener) => {
            try {
              listener()
            } catch (err) {
              console.error('Network reconnect listener error:', err)
            }
          })
        }
        return online
      } finally {
        checkingRef.current = false
      }
    },
    [checkConnection]
  )

  useEffect(() => {
    // Initial verification
    verifyAndSetStatus()

    const handleBrowserOnline = () => {
      // Immediate optimistic check on browser online event
      verifyAndSetStatus(true)
    }

    const handleBrowserOffline = () => {
      // Immediate offline detection
      setIsOnline(false)
      isOnlineRef.current = false
      setIsOfflineModalOpen(true)
    }

    window.addEventListener('online', handleBrowserOnline)
    window.addEventListener('offline', handleBrowserOffline)

    // Polling interval: every 3s when offline (fast reconnect), every 15s when online
    const interval = setInterval(() => {
      verifyAndSetStatus()
    }, isOnline ? 15000 : 3000)

    return () => {
      window.removeEventListener('online', handleBrowserOnline)
      window.removeEventListener('offline', handleBrowserOffline)
      clearInterval(interval)
    }
  }, [isOnline, verifyAndSetStatus])

  const registerReconnectHandler = useCallback((callback) => {
    if (typeof callback === 'function') {
      reconnectListenersRef.current.add(callback)
      return () => {
        reconnectListenersRef.current.delete(callback)
      }
    }
    return () => {}
  }, [])

  const openOfflineModal = useCallback(() => {
    setIsOfflineModalOpen(true)
  }, [])

  const closeOfflineModal = useCallback(() => {
    setIsOfflineModalOpen(false)
  }, [])

  const value = {
    isOnline,
    isOffline: !isOnline,
    isOfflineModalOpen,
    openOfflineModal,
    closeOfflineModal,
    recheckConnection: verifyAndSetStatus,
    registerReconnectHandler
  }

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetworkStatus() {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkProvider')
  }
  return context
}
