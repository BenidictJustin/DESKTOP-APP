import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'motion/react'
import { User, Code2, X } from 'lucide-react'

import devTolentino from '../assets/dev-tolentino.jpg'
import devSalunga from '../assets/dev-salunga.jpg'
import devTaruc from '../assets/dev-taruc.jpg'
import devSantos from '../assets/dev-santos.jpg'

// DommUnity brand palette
const NAVY = '#030e69'
const SIG_GREEN = '#80cc2a'
const WHITE = '#ffffff'

/**
 * Developer directory definitions with references to full high-res profile cards.
 * Order matches the original compact Developers layout:
 * Lead Programmer | Project Manager | UI/UX Designer | Tester
 */
const DEVELOPERS_LIST = [
  {
    id: 'programmer',
    name: 'BENIDICT JUSTIN SALUNGA',
    fullName: 'Benidict Justin E. Salunga',
    role: 'LEAD PROGRAMMER',
    cardRole: 'PROGRAMMER',
    image: devSalunga,
    alt: 'Benidict Justin E. Salunga – Programmer Card'
  },
  {
    id: 'project-manager',
    name: 'MC HARRY TOLENTINO',
    fullName: 'Mc Harry C. Tolentino',
    role: 'PROJECT MANAGER',
    cardRole: 'PROJECT MANAGER',
    image: devTolentino,
    alt: 'Mc Harry C. Tolentino – Project Manager Card'
  },
  {
    id: 'designer',
    name: 'ARON STEFAN TARUC',
    fullName: 'Aron Stefan C. Taruc',
    role: 'UI/UX DESIGNER',
    cardRole: 'DESIGNER',
    image: devTaruc,
    alt: 'Aron Stefan C. Taruc – Designer Card'
  },
  {
    id: 'tester',
    name: 'JOHN HAROLD SANTOS',
    fullName: 'John Harold M. Santos',
    role: 'TESTER',
    cardRole: 'TESTER',
    image: devSantos,
    alt: 'John Harold M. Santos – Tester Card'
  }
]

export default function DevelopersChart() {
  const [selectedDeveloper, setSelectedDeveloper] = useState(null)

  // Close modal on Escape key press and prevent background scrolling
  useEffect(() => {
    if (!selectedDeveloper) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedDeveloper(null)
      } else if (e.key === 'ArrowRight') {
        const currentIndex = DEVELOPERS_LIST.findIndex((d) => d.id === selectedDeveloper.id)
        const nextIndex = (currentIndex + 1) % DEVELOPERS_LIST.length
        setSelectedDeveloper(DEVELOPERS_LIST[nextIndex])
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = DEVELOPERS_LIST.findIndex((d) => d.id === selectedDeveloper.id)
        const prevIndex = (currentIndex - 1 + DEVELOPERS_LIST.length) % DEVELOPERS_LIST.length
        setSelectedDeveloper(DEVELOPERS_LIST[prevIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedDeveloper])

  return (
    <div
      style={{
        backgroundColor: WHITE,
        borderRadius: '28px',
        padding: '36px 40px 48px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f0f1f3',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: "'Poppins', sans-serif",
        boxSizing: 'border-box'
      }}
    >
      {/* ══ DEVELOPERS Header Banner ══ */}
      <div
        style={{
          width: '100%',
          background: NAVY,
          borderRadius: '9999px',
          padding: '14px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(3,14,105,0.30)',
          outline: `3px solid ${SIG_GREEN}`,
          outlineOffset: '-3px'
        }}
      >
        <Code2 size={20} strokeWidth={2.8} style={{ color: SIG_GREEN, flexShrink: 0 }} />
        <h2
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: WHITE
          }}
        >
          DEVELOPERS
        </h2>
      </div>

      {/* ══ Four Developer Profiles — Compact Horizontal Layout ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-8 sm:pt-10">
        {DEVELOPERS_LIST.map((dev) => (
          <button
            key={dev.id}
            type="button"
            onClick={() => setSelectedDeveloper(dev)}
            className="group flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] cursor-pointer p-3 sm:p-4 rounded-2xl hover:bg-slate-50/80 focus:outline-hidden focus:ring-2 focus:ring-sig-green/50 border border-transparent hover:border-gray-200/60"
            title={`Click to view ${dev.name}'s profile card`}
          >
            {/* Avatar with Curved Partial Circular Accent Arc */}
            <div className="relative w-20 h-20 flex items-center justify-center mb-3.5">
              {/* Outer SVG Curved Partial Ring */}
              <svg
                className="absolute inset-0 w-full h-full -rotate-45 transition-transform duration-500 group-hover:rotate-0"
                viewBox="0 0 100 100"
              >
                {/* Base Light Circular Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="5"
                />
                {/* Bold Curved Partial Arc Accent */}
                <path
                  d="M 50 7 A 43 43 0 0 1 93 50"
                  fill="none"
                  stroke={NAVY}
                  strokeWidth="6.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Circular Profile Container with User Icon */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/80 border-2 border-white shadow-xs flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <User className="w-6 h-6 text-navy-blue/70 transition-colors group-hover:text-navy-blue" />
              </div>
            </div>

            {/* Name */}
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wide leading-tight group-hover:text-gray-800 transition-colors">
              {dev.name}
            </p>

            {/* Position / Title */}
            <p className="text-[13.5px] font-black text-navy-blue uppercase tracking-tight mt-1.5 leading-snug group-hover:text-blue-900 transition-colors">
              {dev.role}
            </p>

            {/* Subtle Interactive Cue Badge */}
            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-sig-green opacity-0 group-hover:opacity-100 transition-opacity bg-sig-green/10 px-2 py-0.5 rounded-full">
              View Card
            </span>
          </button>
        ))}
      </div>

      {/* ══ Developer Card Centered Modal Portal ══ */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedDeveloper && (
              <motion.div
                key="dev-card-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-xs select-none font-poppins"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedDeveloper(null)
                }}
              >
                <motion.div
                  key={`dev-card-${selectedDeveloper.id}`}
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 12 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="relative w-full max-w-[820px] bg-white rounded-3xl p-3 sm:p-4 md:p-5 shadow-2xl border border-gray-100/90 flex flex-col items-center gap-3 max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Top Bar */}
                  <div className="w-full flex items-center justify-between px-2 pt-1 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sig-green animate-pulse" />
                      <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-navy-blue">
                        Developer Profile Card
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-navy-blue/10 text-navy-blue">
                        {selectedDeveloper.cardRole || selectedDeveloper.role}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDeveloper(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                      title="Close (Esc)"
                      aria-label="Close modal"
                    >
                      <X size={16} strokeWidth={2.4} />
                      <span className="hidden sm:inline">Close</span>
                    </button>
                  </div>

                  {/* Developer Profile Card Display */}
                  <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200/80 bg-slate-900">
                    <img
                      src={selectedDeveloper.image}
                      alt={selectedDeveloper.alt}
                      className="w-full h-auto block object-contain"
                    />
                  </div>

                  {/* Modal Footer: Quick Switcher for Developers */}
                  <div className="w-full flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1 px-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline">
                      Switch Card:
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {DEVELOPERS_LIST.map((dev) => {
                        const isActive = selectedDeveloper.id === dev.id
                        return (
                          <button
                            key={dev.id}
                            type="button"
                            onClick={() => setSelectedDeveloper(dev)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-navy-blue text-white shadow-sm ring-2 ring-sig-green'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {dev.cardRole || dev.role}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
