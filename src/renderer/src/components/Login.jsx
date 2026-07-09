/* eslint-disable react/prop-types */
import { useState } from 'react'
import { login, requestPasswordReset } from '../services/db'
import { KeyRound, Mail, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import logo from '../assets/logo.png'

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
      onLoginSuccess(user)
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
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

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gray-100 p-4 md:p-8 font-poppins selection:bg-sig-green selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-md md:max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Banner Headers (Left Side) */}
        <div className="w-full md:w-[45%] bg-white p-8 md:p-12 relative flex flex-col justify-between overflow-hidden min-h-[320px] md:min-h-[500px]">
          {/* Decorative Circular Background Elements */}
          {/* Top Right Rings */}
          <div className="absolute -top-10 -right-10 w-40 h-40 border-8 border-sig-green/15 rounded-full pointer-events-none"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 border-8 border-sig-green/10 rounded-full pointer-events-none"></div>

          {/* Bottom Left Circles & Rings */}
          <div className="absolute -bottom-28 -left-28 w-80 h-80 border-16 border-sig-green/15 rounded-full pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-navy-blue/5 rounded-full pointer-events-none"></div>

          {/* Logo Header */}
          <div className="flex items-center space-x-3 self-start z-10">
            <img src={logo} alt="CES Logo" className="h-12 w-12 object-contain" />
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
            <h1 className="text-sig-green text-5xl md:text-6xl font-black tracking-wide leading-none">
              HELLO,
            </h1>
            <h1 className="text-navy-blue text-5xl md:text-6xl font-black tracking-wide leading-none mt-1">
              WELCOME!
            </h1>
            <div className="flex space-x-2 mt-4 text-[10px] md:text-[11px] font-extrabold tracking-widest uppercase">
              <span className="text-sig-green">FIDES,</span>
              <span className="text-navy-blue">PATRIA,</span>
              <span className="text-sig-green">SAPIENTIA</span>
            </div>
          </div>

          {/* Decorative Divider Line - bottom on mobile, right side on desktop */}
          <div className="absolute bottom-0 left-0 right-0 h-1 md:h-full md:w-1 md:bottom-0 md:top-0 md:right-0 md:left-auto bg-sig-green"></div>
        </div>

        {/* Form Body (Right Side) */}
        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-navy-blue relative overflow-hidden min-h-[400px]">
          {/* Decorative vertical rounded shapes */}
          {/* Top-Right Pills */}
          <div className="absolute top-0 right-16 w-10 h-28 bg-black/15 rounded-b-full pointer-events-none"></div>
          <div className="absolute top-0 right-6 w-10 h-40 bg-white/10 rounded-b-full pointer-events-none"></div>

          {/* Bottom-Left Pills */}
          <div className="absolute bottom-0 left-6 w-10 h-40 bg-white/10 rounded-t-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-16 w-10 h-28 bg-black/15 rounded-t-full pointer-events-none"></div>

          <div className="z-10 flex flex-col justify-center w-full">
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start space-x-2 border border-red-200">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-200 text-xs font-semibold mb-1">
                  Username / Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="w-4 h-4" />
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
                    placeholder="faithful@dct.edu.ph"
                    className={`w-full pl-10 pr-4 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition duration-200 ${emailError
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-sig-green/20 focus:border-sig-green'
                      }`}
                    style={{ height: '40px' }}
                  />
                </div>
                {emailError && (
                  <p className="text-red-500 text-[10px] mt-1 text-left font-poppins font-medium">
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-gray-200 text-xs font-semibold">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotErr('')
                      setForgotMsg('')
                      setForgotStep('input')
                      setForgotLoading(false)
                      setShowForgotModal(true)
                    }}
                    className="text-xs text-gray-300 hover:text-sig-green font-medium transition duration-200 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <KeyRound className="w-4 h-4" />
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
                    className={`w-full pl-10 pr-10 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition duration-200 ${passwordError
                        ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 focus:ring-sig-green/20 focus:border-sig-green'
                      }`}
                    style={{ height: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white focus:outline-none transition duration-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-red-500 text-[10px] mt-1 text-left font-poppins font-medium">
                    {passwordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-[45%] mx-auto bg-sig-green hover:bg-sig-green/90 text-navy-blue font-bold py-2 px-4 rounded-full transition duration-200 flex items-center justify-center space-x-2 text-sm mt-6 border-b-2 border-navy-blue/30 disabled:bg-gray-400 disabled:border-transparent cursor-pointer"
                style={{ height: '42px' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-navy-blue border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Log In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative">
            {/* Top Close Button */}
            <button
              onClick={closeForgotModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition cursor-pointer font-bold text-lg focus:outline-none"
              aria-label="Close"
            >
              ✕
            </button>

            {forgotStep === 'input' ? (
              <div>
                <h3 className="text-2xl font-bold text-navy-blue mb-2 font-poppins text-left">
                  Forget password
                </h3>
                <p className="text-gray-500 text-xs mb-6 font-poppins text-left leading-relaxed">
                  {
                    'This feature is restricted to Admin accounts only. If you are a Coordinator, please contact the CES Admin to request a password reset.'
                  }
                </p>

                {forgotErr && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200 animate-fade-in">
                    {forgotErr}
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="E-Mail"
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition duration-200"
                        style={{ height: '44px' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="w-full bg-navy-blue hover:bg-navy-blue/90 text-white font-semibold py-2 px-4 rounded-full transition duration-200 flex items-center justify-center space-x-2 text-sm mt-6 border-b-2 border-sig-green disabled:bg-gray-400 disabled:border-transparent cursor-pointer"
                    style={{ height: '44px' }}
                  >
                    {forgotLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>Submit</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center pt-2">
                <div className="w-16 h-16 bg-sig-green/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-sig-green" />
                </div>

                <h3 className="text-xl font-bold text-navy-blue mb-1 font-poppins">
                  Password Reset Email Sent
                </h3>

                <div className="text-navy-blue font-semibold text-sm mb-4 break-all">
                  {forgotEmail}
                </div>

                <p className="text-gray-500 text-xs mb-6 font-poppins leading-relaxed max-w-sm mx-auto">
                  {
                    "Your Account Security is Our Priority! We've Sent You a Secure Link to Safely Change Your Password and Keep Your Account Protected."
                  }
                </p>

                {forgotMsg && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-xs border border-green-200 animate-fade-in text-center">
                    {forgotMsg}
                  </div>
                )}

                {forgotErr && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200 animate-fade-in text-center">
                    {forgotErr}
                  </div>
                )}

                <button
                  type="button"
                  onClick={closeForgotModal}
                  className="w-full bg-navy-blue hover:bg-navy-blue/90 text-white font-semibold py-2 px-4 rounded-full transition duration-200 flex items-center justify-center text-sm border-b-2 border-sig-green cursor-pointer mb-6"
                  style={{ height: '44px' }}
                >
                  Done
                </button>

                <div>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={handleResendEmail}
                    className="text-xs text-navy-blue hover:text-sig-green font-semibold transition duration-200 cursor-pointer disabled:text-gray-400"
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
