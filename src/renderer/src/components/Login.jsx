/* eslint-disable react/prop-types */
import { useState } from 'react'
import { login, requestPasswordReset } from '../services/db'
import { KeyRound, Mail, AlertTriangle, Info, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotRole, setForgotRole] = useState('coordinator') // admin vs coordinator
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotErr, setForgotErr] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Validations
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credential fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
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

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotErr('')
    setForgotMsg('')

    if (!forgotEmail.trim()) {
      setForgotErr('Please enter your email.')
      return
    }

    setForgotLoading(true)
    try {
      await requestPasswordReset(forgotEmail)
      if (forgotRole === 'admin') {
        setForgotMsg('A secure password recovery link has been dispatched to your email.')
      } else {
        setForgotMsg(
          'Your password reset request has been forwarded to the Admin. Please contact Mr. Jonnel B. Manio or Mrs. Faithful Anne F. Arugay to receive your updated password.'
        )
      }
    } catch (err) {
      setForgotErr(err.message || 'Unable to process reset request.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gray-100 p-4 md:p-8 font-poppins selection:bg-sig-green selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-md md:max-w-4xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Banner Headers (Left Side) */}
        <div className="w-full md:w-[45%] bg-linear-to-br from-navy-blue via-navy-blue to-navy-blue/90 p-8 md:p-12 text-center relative flex flex-col items-center justify-center min-h-[240px] md:min-h-[500px]">
          <div className="absolute top-4 left-4 flex space-x-1.5">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
          </div>

          <div className="h-20 w-20 md:h-24 md:w-24 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg border-2 border-sig-green mt-2 mb-4 md:mb-6 transform hover:scale-105 transition-transform duration-300">
            <span className="text-navy-blue font-bold text-4xl md:text-5xl">D</span>
            <span className="text-sig-green font-bold text-3xl md:text-4xl -ml-1">U</span>
          </div>

          <h1 className="text-white text-3xl md:text-4xl font-extrabold tracking-wider">
            DommUnity
          </h1>
          <p className="text-gray-300 text-xs md:text-sm mt-2 max-w-xs leading-relaxed">
            Community Extension & Services Office
          </p>

          {/* Decorative Divider Line - bottom on mobile, right side on desktop */}
          <div className="absolute bottom-0 left-0 right-0 h-1 md:h-full md:w-1 md:bottom-0 md:top-0 md:right-0 md:left-auto bg-sig-green"></div>
        </div>

        {/* Form Body (Right Side) */}
        <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-navy-blue mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-xs mb-6">
            Sign in to coordinate community extension, track inventory, or submit narratives.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start space-x-2 border border-red-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-xs font-semibold mb-1">
                Username / Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="faithful@dct.edu.ph"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition duration-200"
                  style={{ height: '40px' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-gray-700 text-xs font-semibold">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email)
                    setForgotErr('')
                    setForgotMsg('')
                    setShowForgotModal(true)
                  }}
                  className="text-xs text-navy-blue hover:text-sig-green font-medium transition duration-200"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition duration-200"
                  style={{ height: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-navy-blue focus:outline-none transition duration-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-blue hover:bg-navy-blue/90 text-white font-semibold py-2 px-4 rounded-full transition duration-200 flex items-center justify-center space-x-2 text-sm mt-6 border-b-2 border-sig-green disabled:bg-gray-400 disabled:border-transparent cursor-pointer"
              style={{ height: '42px' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Quick Login Helper for Testing */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center space-x-1.5 mb-2 text-navy-blue">
              <Info className="w-4 h-4" />
              <h3 className="text-xs font-bold">UAT Demo Direct Logins:</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('faithful@dct.edu.ph')
                  setPassword('adminpassword')
                }}
                className="bg-navy-blue/5 text-navy-blue p-2 rounded-lg text-left hover:bg-navy-blue/15 transition cursor-pointer"
              >
                <strong>Admin</strong>
                <div className="text-gray-500">faithful@dct.edu.ph / adminpassword</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('jonnel@dct.edu.ph')
                  setPassword('coordinatorpassword')
                }}
                className="bg-navy-blue/5 text-navy-blue p-2 rounded-lg text-left hover:bg-navy-blue/15 transition cursor-pointer"
              >
                <strong>Office Coord</strong>
                <div className="text-gray-500">jonnel@dct.edu.ph / coordinatorpassword</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('cba@dct.edu.ph')
                  setPassword('cbapassword')
                }}
                className="bg-sig-green/5 text-navy-blue p-2 rounded-lg text-left hover:bg-sig-green/15 transition cursor-pointer"
              >
                <strong>CBA Coord</strong>
                <div className="text-gray-500">cba@dct.edu.ph / cbapassword</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('cs@dct.edu.ph')
                  setPassword('cspassword')
                }}
                className="bg-sig-green/5 text-navy-blue p-2 rounded-lg text-left hover:bg-sig-green/15 transition cursor-pointer"
              >
                <strong>CS Coord</strong>
                <div className="text-gray-500">cs@dct.edu.ph / cspassword</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-navy-blue">Account Reset Gateway</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-500 text-xs mb-4">
              Select your user account role type to route the password reset request properly.
            </p>

            <div className="flex space-x-2 mb-4 p-1 bg-gray-100 rounded-full">
              <button
                type="button"
                onClick={() => setForgotRole('coordinator')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${forgotRole === 'coordinator' ? 'bg-navy-blue text-white' : 'text-gray-500 hover:text-navy-blue'}`}
              >
                Department Coordinator
              </button>
              <button
                type="button"
                onClick={() => setForgotRole('admin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${forgotRole === 'admin' ? 'bg-navy-blue text-white' : 'text-gray-500 hover:text-navy-blue'}`}
              >
                CES Head / Admin
              </button>
            </div>

            {forgotMsg && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-xs border border-green-200">
                {forgotMsg}
              </div>
            )}

            {forgotErr && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs border border-red-200">
                {forgotErr}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1">
                  Registered Account Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@dct.edu.ph"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition duration-200"
                    style={{ height: '40px' }}
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-200 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                  style={{ height: '38px' }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 bg-navy-blue hover:bg-navy-blue/90 text-white rounded-full text-xs font-semibold transition flex items-center justify-center border-b-2 border-sig-green cursor-pointer"
                  style={{ height: '38px' }}
                >
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
