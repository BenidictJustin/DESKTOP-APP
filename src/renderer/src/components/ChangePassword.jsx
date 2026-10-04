/* eslint-disable react/prop-types */
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { changeFirstLoginPassword } from '../services/db'
import { Eye, EyeOff, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react'
import logo from '../assets/logo.png'
import logo3 from '../assets/logo3.png'
import { useNetworkStatus } from '../context/NetworkContext'

export default function ChangePassword({ user, onPasswordChanged, onLogout }) {
  const { isOffline } = useNetworkStatus()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [errors, setErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = () => {
    const errs = {}

    // Current/Temporary Password validation
    if (!currentPassword.trim()) {
      errs.currentPassword = 'Current or temporary password is required.'
    }

    // New Password validation
    if (!newPassword) {
      errs.newPassword = 'New password is required.'
    } else if (newPassword.length < 8) {
      errs.newPassword = 'The new password must contain at least 8 characters.'
    } else if (currentPassword && newPassword === currentPassword) {
      errs.newPassword = 'New password cannot be the same as the temporary password.'
    }

    // Confirm Password validation
    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required.'
    } else if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'The confirmation password must match the new password.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGeneralError('')

    if (isOffline) {
      setGeneralError(
        'Cannot perform action: No internet connection. Please wait until connection is restored.'
      )
      return
    }

    if (!validate()) {
      return
    }

    setLoading(true)
    try {
      const updatedUser = await changeFirstLoginPassword(currentPassword, newPassword)
      setSuccess(true)
      setTimeout(() => {
        onPasswordChanged(updatedUser)
      }, 1500)
    } catch (err) {
      const msg = err?.message || ''
      if (
        msg.toLowerCase().includes('current/temporary password is incorrect') ||
        msg.toLowerCase().includes('wrong-password') ||
        msg.toLowerCase().includes('invalid-credential')
      ) {
        setErrors((prev) => ({
          ...prev,
          currentPassword: 'The current or temporary password you entered is incorrect.'
        }))
      } else if (
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('failed to fetch')
      ) {
        setGeneralError('Waiting for network connection…')
      } else {
        setGeneralError(msg || 'Failed to update password. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020516] flex flex-col items-center justify-center font-poppins selection:bg-sig-green/20 overflow-hidden px-4">
      {/* Background Banner */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img
          src={logo3}
          alt="Background Blur"
          className="absolute inset-0 w-full h-full object-cover opacity-50 filter blur-xl scale-110 pointer-events-none"
        />
        <img
          src={logo3}
          alt="Background Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 filter brightness-105 contrast-105 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020519]/70 via-[#030E69]/40 to-[#02061f]/80 backdrop-blur-[2px]" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md glass-modal rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 space-y-4 max-h-[95vh] overflow-y-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-2">
          <img
            src={logo}
            alt="DommUnity Logo"
            className="h-14 w-14 object-contain mb-2 drop-shadow-md"
          />
          <h2 className="text-xl font-bold text-navy-blue tracking-tight">Set New Password</h2>
          {user?.email && (
            <div className="flex items-center gap-1.5 mt-1 bg-navy-blue/5 border border-navy-blue/10 px-3 py-1 rounded-full text-xs font-semibold text-navy-blue">
              <span>{user.name || user.username || 'User'}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500 font-normal">{user.email}</span>
            </div>
          )}
        </div>

        {/* Required Notice Alert */}
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900 leading-snug">
              You must change your password before continuing.
            </p>
            <p className="text-[11px] text-amber-700/90 mt-0.5 font-medium leading-relaxed">
              Your account was created with a temporary password. Please set a secure personal
              password to continue to your dashboard.
            </p>
          </div>
        </div>

        {/* General Error Alert */}
        <AnimatePresence>
          {generalError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{generalError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-3"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-navy-blue">Password Changed Successfully!</h3>
            <p className="text-xs text-gray-500 font-medium">
              Your account has been secured. Redirecting you to your dashboard...
            </p>
            <div className="pt-2 flex justify-center">
              <div className="w-6 h-6 border-2 border-navy-blue border-t-transparent rounded-full animate-spin" />
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left pt-1">
            {/* Field 1: Current / Temporary Password */}
            <div>
              <label className="block text-navy-blue text-xs font-semibold mb-1">
                Current / Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value)
                    if (errors.currentPassword) {
                      setErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.currentPassword
                        return copy
                      })
                    }
                  }}
                  placeholder="Enter temporary password"
                  className={`w-full p-2.5 pr-10 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${
                    errors.currentPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-navy-blue focus:outline-none transition-colors duration-150 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.currentPassword}</span>
                </p>
              )}
            </div>

            {/* Field 2: New Password */}
            <div>
              <label className="block text-navy-blue text-xs font-semibold mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    if (errors.newPassword) {
                      setErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.newPassword
                        return copy
                      })
                    }
                  }}
                  placeholder="Enter new password (at least 8 characters)"
                  className={`w-full p-2.5 pr-10 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${
                    errors.newPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-navy-blue focus:outline-none transition-colors duration-150 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.newPassword}</span>
                </p>
              )}
            </div>

            {/* Field 3: Confirm New Password */}
            <div>
              <label className="block text-navy-blue text-xs font-semibold mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) {
                      setErrors((prev) => {
                        const copy = { ...prev }
                        delete copy.confirmPassword
                        return copy
                      })
                    }
                  }}
                  placeholder="Confirm new password"
                  className={`w-full p-2.5 pr-10 text-xs glass-input rounded-xl focus:outline-none font-semibold text-navy-blue ${
                    errors.confirmPassword ? 'border-red-500 ring-2 ring-red-500/10' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-navy-blue focus:outline-none transition-colors duration-150 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-[10px] mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Helper requirement hint */}
            <div className="p-2.5 bg-gray-50 border border-gray-200/70 rounded-xl text-[11px] text-gray-600">
              <span className="font-semibold text-navy-blue">Requirement: </span>
              <span className={newPassword.length >= 8 ? 'text-emerald-600 font-semibold' : ''}>
                Password must contain at least 8 characters.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-blue hover:bg-navy-blue-600 text-white font-semibold py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer shadow-glass-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Change Password</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-center"
              >
                Sign Out
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}
