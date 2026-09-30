import React from 'react'
import { User, Code2 } from 'lucide-react'

// DommUnity palette
const NAVY = '#030e69'
const NAVY_MID = '#0B2545'
const SIG_GREEN = '#80cc2a'
const WHITE = '#ffffff'

const DEVELOPERS_LIST = [
  { name: 'MC HARRY TOLENTINO', role: 'PROJECT MANAGER' },
  { name: 'BENIDICT JUSTIN SALUNGA', role: 'PROGRAMMER' },
  { name: 'ARON STEFAN TARUC', role: 'UI/UX DESIGNER' },
  { name: 'JOHN HAROLD SANTOS', role: 'TESTER' }
]

/**
 * Avatar built to match Image 1:
 *   [thick navy outer ring] → [white gap] → [light neutral inner circle + user icon]
 *   + a small green arc accent at the top of the outer ring
 */
function DevAvatar() {
  const OUTER = 64   // outer ring radius
  const GAP = 8    // gap between outer ring and inner circle
  const INNER = OUTER - GAP  // inner circle radius
  const RING_W = 10   // outer ring stroke width
  const CX = 80
  const CY = 80
  const TOTAL = (CX + RING_W + 4) * 2   // 168 → viewBox size

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px' }}>
      <svg
        width="140"
        height="140"
        viewBox={`0 0 ${TOTAL} ${TOTAL}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* ── Thick navy outer ring ── */}
        <circle
          cx={CX}
          cy={CY}
          r={OUTER}
          fill="none"
          stroke={NAVY}
          strokeWidth={RING_W}
        />

        {/* ── Green accent arc at the top of the outer ring ── */}
        <path
          d={`M ${CX - OUTER * 0.55} ${CY - OUTER * 0.84}
              A ${OUTER} ${OUTER} 0 0 1 ${CX + OUTER * 0.55} ${CY - OUTER * 0.84}`}
          fill="none"
          stroke={SIG_GREEN}
          strokeWidth={RING_W + 2}
          strokeLinecap="round"
        />

        {/* ── White gap ring ── */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER + 3}
          fill="none"
          stroke={WHITE}
          strokeWidth={6}
        />

        {/* ── Inner circle fill (light neutral) ── */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER - 1}
          fill="url(#avatarGrad)"
        />

        <defs>
          <radialGradient id="avatarGrad" cx="50%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#EEF0F4" />
            <stop offset="100%" stopColor="#D8DCE3" />
          </radialGradient>
        </defs>
      </svg>

      {/* ── User icon centered over the inner circle ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '140px', height: '140px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <User
          size={40}
          strokeWidth={1.4}
          style={{ color: `rgba(3,14,105,0.45)`, marginTop: '4px' }}
        />
      </div>
    </div>
  )
}

export default function DevelopersChart() {
  return (
    <div style={{
      backgroundColor: WHITE,
      borderRadius: '28px',
      padding: '36px 44px 52px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      border: '1px solid #f0f1f3',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Poppins', sans-serif",
      boxSizing: 'border-box'
    }}>

      {/* ══ DEVELOPERS Header Banner ══ */}
      <div style={{
        width: '100%',
        background: NAVY,
        borderRadius: '9999px',
        padding: '15px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        boxShadow: `0 4px 16px rgba(3,14,105,0.30)`,
        // Green accent line at the bottom of the pill
        outline: `3px solid ${SIG_GREEN}`,
        outlineOffset: '-3px'
      }}>
        <Code2 size={20} strokeWidth={2.8} style={{ color: SIG_GREEN, flexShrink: 0 }} />
        <h2 style={{
          margin: 0,
          fontWeight: 800,
          fontSize: '15px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: WHITE
        }}>
          DEVELOPERS
        </h2>
      </div>

      {/* ══ Four Developer Profiles — one horizontal row ══ */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'flex-start',
        marginTop: '48px',
        flexWrap: 'wrap',
        gap: '32px 0'
      }}>
        {DEVELOPERS_LIST.map((dev) => (
          <div
            key={dev.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              flex: '1 1 0',
              minWidth: '140px',
              maxWidth: '220px'
            }}
          >
            {/* Avatar */}
            <DevAvatar />

            {/* Name */}
            <p style={{
              margin: '16px 0 5px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#9CA3AF',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              lineHeight: 1.35
            }}>
              {dev.name}
            </p>

            {/* Role */}
            <p style={{
              margin: 0,
              fontSize: '13.5px',
              fontWeight: 800,
              color: NAVY,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1.3
            }}>
              {dev.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
