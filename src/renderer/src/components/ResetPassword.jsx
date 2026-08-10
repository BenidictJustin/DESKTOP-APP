import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { verifyResetCode, resetPasswordWithCode } from '../services/db'
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import logo from '../assets/logo.png'
import logo3 from '../assets/logo3.png'

export default function ResetPassword({ oobCode, onComplete }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [accountEmail, setAccountEmail] = useState('')
  const [codeInvalid, setCodeInvalid] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let isMounted = true
    const checkCode = async () => {
      if (!oobCode) {
        if (isMounted) {
          setCodeInvalid(true)
          setVerifying(false)
        }
        return
      }
      try {
        const email = await verifyResetCode(oobCode)
        if (isMounted) {
          setAccountEmail(email)
          setVerifying(false)
        }
      } catch (err) {
        if (isMounted) {
          setCodeInvalid(true)
          setFormError(err.message || 'Invalid or expired password reset link.')
          setVerifying(false)
        }
      }
    }
    checkCode()
    return () => {
      isMounted = false
    }
  }, [oobCode])

  const validate = () => {
    const errs = {}
    if (!password) {
      errs.password = 'Password is required.'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.'
    } else if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      errs.password =
        'Password must contain uppercase, lowercase, numbers, and special characters.'
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Confirm password is required.'
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validate()) return

    setLoading(true)
    try {
      await resetPasswordWithCode(oobCode, password)
      setSuccess(true)
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('auth/weak-password') || msg.includes('password-does-not-meet-requirements')) {
        setErrors((prev) => ({
          ...prev,
          password: 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.'
        }))
      } else if (msg.includes('auth/invalid-action-code') || msg.includes('auth/expired-action-code')) {
        setFormError('This password reset link has expired or has already been used.')
        setCodeInvalid(true)
      } else {
        setFormError(err.message || 'Failed to update password. Please try again.')
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
        className="relative z-10 w-full max-w-md bg-[#0a1128]/80 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="DommUnity Logo" className="h-16 w-16 object-contain mb-3 drop-shadow-md" />
          <h2 className="text-2xl font-bold text-white tracking-tight">Reset Your Password</h2>
          {accountEmail && (
            <p className="text-xs text-gray-300 mt-1 font-medium bg-white/10 px-3 py-1 rounded-full border border-white/10">
              {accountEmail}
            </p>
          )}
        </div>

        {verifying ? (
          <div className="flex flex-col items-center py-8">
            <div className="w-8 h-8 border-3 border-sig-green border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-300">Verifying reset link...</p>
          </div>
        ) : codeInvalid ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3 border border-red-500/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-red-300 font-medium mb-6">
              {formError || 'The password reset link is invalid or has expired.'}
            </p>
            <button
              onClick={onComplete}
              className="w-full py-3 bg-sig-green hover:bg-sig-green-600 text-[#020516] font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-sig-green/20"
            >
              Back to Login
            </button>
          </div>
        ) : success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Password Reset Complete</h3>
            <p className="text-sm text-gray-300 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <button
              onClick={onComplete}
              className="w-full py-3 bg-sig-green hover:bg-sig-green-600 text-[#020516] font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-sig-green/20"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-[#1rem] space-y-4">
            {formError && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* New Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  placeholder="8+ chars with uppercase, lowercase, number, special char"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border ${
                    errors.password ? 'border-red-500/80 focus:ring-red-500/30' : 'border-white/15 focus:border-sig-green focus:ring-sig-green/30'
                  } rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                  }}
                  placeholder="Re-enter new password"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white/5 border ${
                    errors.confirmPassword ? 'border-red-500/80 focus:ring-red-500/30' : 'border-white/15 focus:border-sig-green focus:ring-sig-green/30'
                  } rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>

            {/* Validation helper rules notice */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">Password Requirements:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li className={password.length >= 8 ? 'text-emerald-400 font-medium' : ''}>
                  Minimum 8 characters long
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-emerald-400 font-medium' : ''}>
                  At least one uppercase letter (A-Z)
                </li>
                <li className={/[a-z]/.test(password) ? 'text-emerald-400 font-medium' : ''}>
                  At least one lowercase letter (a-z)
                </li>
                <li className={/\d/.test(password) ? 'text-emerald-400 font-medium' : ''}>
                  At least one numeric character (0-9)
                </li>
                <li className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400 font-medium' : ''}>
                  At least one special character (!@#$%^&*...)
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-sig-green hover:bg-sig-green-600 text-[#020516] font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-sig-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#020516] border-t-transparent rounded-full animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
