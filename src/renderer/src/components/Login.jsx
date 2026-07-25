/* eslint-disable react/prop-types */
import { useState } from 'react'
import { login, requestPasswordReset } from '../services/db'
import { KeyRound, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import logo from '../assets/logo.png'
import logo3 from '../assets/logo3.png'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotErr, setForgotErr] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotStep, setForgotStep] = useState('input') // 'input' vs 'success'
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSuccessTransition, setIsSuccessTransition] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setEmailError('')
    setPasswordError('')

    let hasError = false
    if (!email.trim()) {
      setEmailError('Email is required.')
      hasError = true
    }
    if (!password.trim()) {
      setPasswordError('Password is required.')
      hasError = true
    }

    if (hasError) {
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      const user = await login(email, password)
      setIsSuccessTransition(true)
      setTimeout(() => {
        onLoginSuccess(user)
      }, 750)
    } catch (err) {
      const msg = err?.message || ''
      if (msg.includes('auth/invalid-credential') || msg.includes('invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        setError('Invalid email or password. Please try again.')
      } else {
        setError(err?.message || 'Invalid email or password. Please try again.')
      }
      setLoading(false)
    }
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotEmail('')
    setForgotErr('')
    setForgotMsg('')
    setForgotStep('input')
    setForgotLoading(false)
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotErr('')
    setForgotMsg('')

    if (!forgotEmail.trim()) {
      setForgotErr('Please enter your email.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotErr('Please enter a valid email address.')
      return
    }

    setForgotLoading(true)
    try {
      await requestPasswordReset(forgotEmail.trim())
      setForgotStep('success')
    } catch (err) {
      setForgotErr(err.message || 'Unable to process reset request.')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setForgotErr('')
    setForgotMsg('')
    setForgotLoading(true)
    try {
      await requestPasswordReset(forgotEmail.trim())
      setForgotMsg('A new password recovery link has been resent to your email.')
    } catch (err) {
      setForgotErr(err.message || 'Unable to resend reset request.')
    } finally {
      setForgotLoading(false)
    }
  }

  if (isSuccessTransition) {
    return (
      <div className="fixed inset-0 z-[99999] bg-[#020516] flex flex-col items-center justify-center font-poppins selection:bg-sig-green/20 overflow-hidden transition-opacity duration-500 ease-in-out animate-fade-in">
        {/* Background Banner Graphic (logo3.png) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <img
            src={logo3}
            alt="Background Banner"
            className="w-full h-full object-contain object-center opacity-70 filter brightness-95 contrast-105 pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020519]/50 via-[#030E69]/40 to-[#02061f]/65 backdrop-blur-[1px]" />
        </div>

        {/* Main Splash Transition Content */}
        <div className="flex flex-col items-center justify-center text-center z-10 px-6 animate-splash-scale relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#020516]/80 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sig-green/20 rounded-full blur-3xl pointer-events-none" />

          <img
            src={logo}
            alt="DommUnity Main Logo"
            className="h-28 w-28 md:h-36 md:w-36 object-contain drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)] mb-3 animate-subtle-float relative z-10"
          />

          <h1 className="text-3xl md:text-4xl font-extrabold text-sig-green tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] relative z-10">
            DommUnity
          </h1>
          <p className="text-xs font-bold text-gray-300 tracking-widest uppercase mt-2 relative z-10 animate-pulse">
            Authenticating Session...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 md:p-8 font-poppins selection:bg-sig-green/20 selection:text-navy-blue relative overflow-hidden bg-[#020516]">
      {/* Shared Background Banner Graphic (logo3.png) - Complete Uncropped Artwork */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        <img
          src={logo3}
          alt="Background Banner"
          className="w-full h-full object-contain object-center opacity-70 filter brightness-95 contrast-105 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020519]/50 via-[#030E69]/40 to-[#02061f]/65 backdrop-blur-[1px]" />
      </div>

      {/* Container Card with Glassmorphic Frosted Styling */}
      <div className="w-full max-w-md md:max-w-4xl bg-white/75 backdrop-blur-xl rounded-2xl shadow-glass-xl border border-white/60 overflow-hidden flex flex-col md:flex-row animate-fade-in-scale relative z-10">
        {/* Banner Headers (Left Side - Frosted Light Glass) */}
        <div className="w-full md:w-[45%] bg-white/40 backdrop-blur-md p-8 md:p-12 relative flex flex-col justify-between overflow-hidden min-h-80 md:min-h-125">
          {/* Decorative Circular Glass Orbs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 border-[6px] border-sig-green/20 rounded-full pointer-events-none backdrop-blur-xs"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 border-[6px] border-sig-green/10 rounded-full pointer-events-none"></div>

          {/* Bottom Left Circles & Rings */}
          <div className="absolute -bottom-28 -left-28 w-80 h-80 border-12 border-sig-green/15 rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-navy-blue/5 rounded-full pointer-events-none"></div>

          {/* Logo Header */}
          <div className="flex items-center space-x-3 self-start z-10">
            <div className="h-12 w-12 rounded-xl bg-white/90 backdrop-blur-sm border border-white/80 flex items-center justify-center overflow-hidden shadow-glass-sm">
              <img src={logo} alt="CES Logo" className="h-10 w-10 object-contain" />
            </div>
            <div className="text-left font-poppins">
              <div className="text-navy-blue font-extrabold text-[10px] leading-tight tracking-wider uppercase">
                Community Extension & Services
              </div>
              <div className="text-sig-green font-extrabold text-[10px] leading-tight tracking-wider uppercase">
                Dominican College of Tarlac
              </div>
            </div>
          </div>

          {/* Welcome Text & Tagline */}
          <div className="flex-1 flex flex-col justify-center my-8 z-10 text-left">
            <h1 className="text-sig-green text-5xl md:text-6xl font-black tracking-tight leading-none drop-shadow-xs">
              HELLO,
            </h1>
            <h1 className="text-navy-blue text-5xl md:text-6xl font-black tracking-tight leading-none mt-1 drop-shadow-xs">
              WELCOME!
            </h1>
            <div className="flex space-x-2 mt-5 text-[10px] md:text-[11px] font-extrabold tracking-[0.2em] uppercase">
              <span className="text-sig-green">FIDES,</span>
              <span className="text-navy-blue">PATRIA,</span>
              <span className="text-sig-green">SAPIENTIA</span>
            </div>
          </div>

          {/* Decorative Gradient Glass Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-1 md:h-full md:w-1 md:bottom-0 md:top-0 md:right-0 md:left-auto bg-linear-to-r md:bg-linear-to-b from-sig-green via-sig-green to-sig-green/40"></div>
        </div>

        {/* Form Body (Right Side - Frosted Dark Navy Glass) */}
        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-navy-blue/90 backdrop-blur-lg relative overflow-hidden min-h-100">
          {/* Glass Pillar Accents */}
          <div className="absolute top-0 right-16 w-8 h-24 bg-white/10 backdrop-blur-xs rounded-b-full pointer-events-none border-b border-white/20"></div>
          <div className="absolute top-0 right-6 w-8 h-36 bg-white/5 rounded-b-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-6 w-8 h-36 bg-white/5 rounded-t-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-16 w-8 h-24 bg-white/10 backdrop-blur-xs rounded-t-full pointer-events-none border-t border-white/20"></div>

          <div className="z-10 flex flex-col justify-center w-full">
            {error && (
              <div className="mb-5 p-3.5 bg-error-500/20 backdrop-blur-md text-red-100 rounded-xl text-xs flex items-start space-x-2.5 border border-error-500/30 animate-fade-in shadow-glass-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-300" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-white/90 text-xs font-semibold mb-1.5 tracking-wide drop-shadow-xs">
                  Username / Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (e.target.value.trim()) {
                        setEmailError('')
                      }
                    }}
                    placeholder="Enter email"
                    className={`w-full pl-11 pr-4 py-2.5 text-sm bg-white/90 backdrop-blur-md border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-navy-blue font-semibold shadow-inner ${emailError
                        ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
                        : 'border-white/80 focus:ring-sig-green/40 focus:border-sig-green'
                      }`}
                  />
                </div>
                {emailError && (
                  <p className="text-red-300 text-[11px] mt-1.5 text-left font-poppins font-medium flex items-center space-x-1 drop-shadow-xs">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-white/90 text-xs font-semibold tracking-wide drop-shadow-xs">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail('')
                      setForgotErr('')
                      setForgotMsg('')
                      setForgotStep('input')
                      setForgotLoading(false)
                      setShowForgotModal(true)
                    }}
                    className="text-[11px] text-gray-300 hover:text-sig-green font-semibold transition-colors duration-150 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                    <KeyRound className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (e.target.value.trim()) {
                        setPasswordError('')
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-11 py-2.5 text-sm bg-white/90 backdrop-blur-md border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 placeholder:text-gray-400 text-navy-blue font-semibold shadow-inner ${passwordError
                        ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
                        : 'border-white/80 focus:ring-sig-green/40 focus:border-sig-green'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-navy-blue focus:outline-none transition-colors duration-150 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-300 text-[11px] mt-1.5 text-left font-poppins font-medium flex items-center space-x-1 drop-shadow-xs">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sig-green hover:bg-sig-green-600 active:bg-sig-green-700 text-navy-blue font-extrabold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm mt-3 shadow-glass-navy hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-white/40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-navy-blue/30 border-t-navy-blue rounded-full animate-spin"></div>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Glass Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-modal rounded-2xl p-7 w-full max-w-md relative animate-fade-in-scale">
            {/* Top Close Button */}
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-navy-blue transition-colors duration-150 cursor-pointer p-1 rounded-lg hover:bg-white/50"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {forgotStep === 'input' ? (
              <div>
                <h3 className="text-xl font-bold text-navy-blue mb-2 font-poppins text-left tracking-tight">
                  Forget password
                </h3>
                <p className="text-gray-600 text-[13px] mb-6 font-poppins text-left leading-relaxed font-medium">
                  {
                    'This feature is restricted to Admin accounts only. If you are a Coordinator, please contact the CES Admin to request a password reset.'
                  }
                </p>

                {forgotErr && (
                  <div className="mb-4 p-3 bg-red-50/90 text-red-700 rounded-xl text-xs border border-red-200/80 animate-fade-in flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                    <span>{forgotErr}</span>
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 pointer-events-none">
                        <Mail className="w-4.5 h-4.5" />
                      </span>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter email"
                        className="w-full pl-11 pr-4 py-2.5 text-sm glass-input rounded-xl focus:outline-none placeholder:text-gray-400 text-navy-blue font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-navy-blue hover:bg-navy-blue-600 text-white font-extrabold py-2.5 px-5 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 text-sm mt-2 shadow-glass-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-white/20"
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <span>Submit</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center pt-2">
                <div className="w-14 h-14 bg-sig-green/20 backdrop-blur-md rounded-full flex items-center justify-center mb-5 mx-auto border border-sig-green/40">
                  <CheckCircle2 className="w-7 h-7 text-sig-green-600" />
                </div>

                <h3 className="text-lg font-bold text-navy-blue mb-1 font-poppins tracking-tight">
                  Password Reset Email Sent
                </h3>

                <div className="text-navy-blue font-bold text-sm mb-4 break-all">
                  {forgotEmail}
                </div>

                <p className="text-gray-600 text-[13px] mb-6 font-poppins leading-relaxed max-w-sm mx-auto font-medium">
                  {
                    "Your Account Security is Our Priority! We've Sent You a Secure Link to Safely Change Your Password and Keep Your Account Protected."
                  }
                </p>

                {forgotMsg && (
                  <div className="mb-4 p-3 bg-emerald-50/90 text-emerald-800 rounded-xl text-xs border border-emerald-200/80 animate-fade-in text-center font-medium">
                    {forgotMsg}
                  </div>
                )}

                {forgotErr && (
                  <div className="mb-4 p-3 bg-red-50/90 text-red-700 rounded-xl text-xs border border-red-200/80 animate-fade-in text-center font-medium">
                    {forgotErr}
                  </div>
                )}

                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full bg-navy-blue hover:bg-navy-blue-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-150 flex items-center justify-center text-sm shadow-glass-md hover:shadow-lg cursor-pointer mb-5 border border-white/20"
                >
                  Done
                </button>

                <div>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleResendEmail}
                    className="text-xs text-navy-blue hover:text-sig-green-600 font-bold transition-colors duration-150 cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {forgotLoading ? 'Resending...' : 'Resend Email'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
