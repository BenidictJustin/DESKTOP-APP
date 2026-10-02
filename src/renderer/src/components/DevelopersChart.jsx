import React from 'react'
import { Code2 } from 'lucide-react'

import devTolentino from '../assets/dev-tolentino.jpg'
import devSalunga from '../assets/dev-salunga.jpg'
import devTaruc from '../assets/dev-taruc.jpg'
import devSantos from '../assets/dev-santos.jpg'

// DommUnity palette
const NAVY = '#030e69'
const SIG_GREEN = '#80cc2a'
const WHITE = '#ffffff'

const DEVELOPERS_LIST = [
  { name: 'MC HARRY TOLENTINO',      role: 'PROJECT MANAGER', image: devTolentino },
  { name: 'BENIDICT JUSTIN SALUNGA', role: 'PROGRAMMER',      image: devSalunga },
  { name: 'ARON STEFAN TARUC',       role: 'UI/UX DESIGNER',  image: devTaruc },
  { name: 'JOHN HAROLD SANTOS',      role: 'TESTER',          image: devSantos }
]

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

      {/* ══ Four Developer Cards — 2×2 grid ══ */}
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginTop: '36px'
      }}>
        {DEVELOPERS_LIST.map((dev) => (
          <div
            key={dev.name}
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              border: '1px solid #e5e7eb'
            }}
          >
            <img
              src={dev.image}
              alt={`${dev.name} – ${dev.role}`}
              style={{
                width: '100%',
                display: 'block'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
