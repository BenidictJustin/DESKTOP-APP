import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { listenToAuthChanges, logout, hasAcceptedPolicy, acceptPolicy } from './services/db'
import AcceptableUseNotice from './components/AcceptableUseNotice'
import Login from './components/Login'
import ResetPassword from './components/ResetPassword'
import AdminDashboard from './modules/admin/AdminDashboard'
import OfficeCoordinatorDashboard from './modules/office-coordinator/OfficeCoordinatorDashboard'
import SplashScreen from './components/SplashScreen'
import UpdateNotification from './components/UpdateNotification'
import OfflineModal from './components/OfflineModal'
import { NetworkProvider, useNetworkStatus } from './context/NetworkContext'
import { authTransitionVariants, authTransition } from './components/motion/motionConfig'

function AppContent() {
  const { isOffline, openOfflineModal } = useNetworkStatus()
  const [activeUser, setActiveUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [policyAccepted, setPolicyAccepted] = useState(null) // null = checking, true = accepted, false = needs ack

  const [deactivationNotice, setDeactivationNotice] = useState('')

  const searchParams =
    typeof window !== 'undefined'
      ? new URLSearchParams(
          window.location.search ||
            (window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '')
        )
      : new URLSearchParams()
  const oobCode = searchParams.get('oobCode')
  const mode = searchParams.get('mode')
  const isResetMode = mode === 'resetPassword' && !!oobCode

  useEffect(() => {
    if (!activeUser && typeof document !== 'undefined') {
      document.body.style.overflow = ''
      document.body.style.pointerEvents = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.pointerEvents = ''
    }
  }, [activeUser])

  useEffect(() => {
    // Listen to changes in auth context (either Firebase auth or LocalStorage simulation)
    const unsubscribe = listenToAuthChanges((currentUser, info) => {
      if (info && info.deactivated) {
        setDeactivationNotice('Your account has been deactivated. Please contact the Administrator.')
        setActiveUser(null)
        setLoading(false)
        return
      }

      setLoading((prevLoading) => {
        if (prevLoading) {
          // On initial startup: restore session (currentUser will be user data or null)
          setActiveUser(currentUser)
          return false
        } else if (!currentUser) {
          // If already loaded and user is logged out: clear active user.
          // Login handles setting activeUser via handleLoginSuccess to allow login animation to complete.
          setActiveUser(null)
        }
        return prevLoading
      })
    })

    // Safety fallback: ensure loading screen resolves even if auth listener takes long during network recovery
    const fallbackTimer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => {
      unsubscribe()
      clearTimeout(fallbackTimer)
    }
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  const handleLogout = async () => {
    if (isOffline) {
      openOfflineModal()
      return
    }
    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
      document.body.style.pointerEvents = ''
      document.documentElement.style.overflow = ''
      document.documentElement.style.pointerEvents = ''
    }
    try {
      await logout()
      setDeactivationNotice('')
      setActiveUser(null)
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ''
        document.body.style.pointerEvents = ''
        document.documentElement.style.overflow = ''
        document.documentElement.style.pointerEvents = ''
      }
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const handleLoginSuccess = (authenticatedUser) => {
    setDeactivationNotice('')
    setPolicyAccepted(null) // reset to checking state for the new user
    setActiveUser(authenticatedUser)
  }

  // ── Policy acceptance check ──────────────────────────────
  useEffect(() => {
    if (!activeUser || !activeUser.uid) {
      setPolicyAccepted(null)
      return
    }
    let cancelled = false
    hasAcceptedPolicy(activeUser.uid).then((accepted) => {
      if (!cancelled) setPolicyAccepted(accepted)
    })
    return () => { cancelled = true }
  }, [activeUser])

  const handlePolicyAccept = useCallback(async () => {
    if (!activeUser?.uid) return
    await acceptPolicy(activeUser.uid)
    setPolicyAccepted(true)
  }, [activeUser])

  return (
    <div className="min-h-screen w-screen bg-[#F1EFEC] font-poppins relative overflow-hidden">
      <UpdateNotification />
      <OfflineModal />
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" onComplete={handleSplashComplete} />}
      </AnimatePresence>

      {!showSplash && (
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="loading"
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center font-poppins bg-[#020516] z-20"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            />
          ) : isResetMode ? (
            <ResetPassword
              oobCode={oobCode}
              onComplete={() => {
                window.location.href = window.location.origin + window.location.pathname
              }}
            />
          ) : !activeUser ? (
            <motion.div
              key="login"
              className="absolute inset-0 w-full h-full bg-[#020516] z-10"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <Login onLoginSuccess={handleLoginSuccess} deactivationNotice={deactivationNotice} />
            </motion.div>
          ) : policyAccepted === null ? (
            /* Checking policy status — show brief loading state */
            <motion.div
              key="policy-check"
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center font-poppins bg-[#F1EFEC] z-10"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            />
          ) : policyAccepted === false ? (
            /* First-login policy acknowledgment */
            <motion.div
              key="policy-ack"
              className="absolute inset-0 w-full h-full bg-[#F1EFEC] z-10"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <AcceptableUseNotice mode="acknowledge" onAccept={handlePolicyAccept} />
            </motion.div>
          ) : activeUser.role === 'admin' ? (
            <motion.div
              key="admin-dashboard"
              className="absolute inset-0 w-full h-full bg-[#F1EFEC] z-10"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <AdminDashboard user={activeUser} onLogout={handleLogout} />
            </motion.div>
          ) : activeUser.role === 'office_coordinator' ? (
            <motion.div
              key="coordinator-dashboard"
              className="absolute inset-0 w-full h-full bg-[#F1EFEC] z-10"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <OfficeCoordinatorDashboard user={activeUser} onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.div
              key="access-denied"
              className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center font-poppins bg-[#020516] z-20"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <div className="glass-modal rounded-2xl p-8 max-w-md shadow-glass-xl border border-white/80 text-gray-800 animate-fade-in-scale">
                <h2 className="text-lg font-bold text-error-600 mb-2 tracking-tight">
                  Access Restrict Alert
                </h2>
                <p className="text-sm text-gray-600 font-medium mb-6">
                  Your account role &quot;{activeUser.role}&quot; does not have access permissions
                  to view this terminal panel.
                </p>
                <button
                  onClick={handleLogout}
                  className="bg-navy-blue hover:bg-navy-blue-600 text-white rounded-xl text-sm font-semibold py-2.5 px-6 shadow-glass-sm hover:shadow-md transition-all duration-150 cursor-pointer border border-white/20"
                >
                  Return to Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

export default function App() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  )
}

