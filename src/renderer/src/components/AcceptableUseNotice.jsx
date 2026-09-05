/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { motion } from 'motion/react'
import { Shield, CheckSquare, Square } from 'lucide-react'
import AnimatedModal from './motion/AnimatedModal'
import { duration, easing } from './motion/motionConfig'

/**
 * Policy content sections — concise, institutional, non-legal.
 * Applicable only to DommUnity / DCT CES Office.
 */
const POLICY_SECTIONS = [
  {
    title: 'Authorized Use',
    content:
      'DommUnity is intended solely for authorized users of the Dominican College of Tarlac – Community Extension & Services (CES) Office. Access is granted only for official CES-related activities and operations.'
  },
  {
    title: 'Account Responsibility',
    content:
      'Users are responsible for keeping their account credentials private and secure. Account sharing or allowing unauthorized access to your account is not permitted.'
  },
  {
    title: 'Proper Use of Records',
    content:
      'Users must provide accurate information when creating or updating records in the system. Intentionally modifying, falsifying, or misusing records that you are not authorized to manage is not permitted.'
  },
  {
    title: 'Document Responsibility',
    content:
      'All submitted reports, proposals, and documents should contain accurate and truthful information. Documents generated through DommUnity should only be used for official CES purposes.'
  },
  {
    title: 'Data Privacy',
    content:
      'DommUnity handles information related to users, donors, organizations, events, inventory, and reports. This information is collected and stored for the purpose of managing CES operations and should only be used for its intended purpose within the CES Office.'
  },
  {
    title: 'System Activity',
    content:
      'Relevant system activities — such as account access, document submissions, report actions, and inventory transactions — may be recorded for system management, accountability, and operational oversight.'
  },
  {
    title: 'Security & Access',
    content:
      'Users should only access features and information that are allowed for their assigned role. Attempting to access restricted areas or functions beyond your authorized role is not permitted.'
  },
  {
    title: 'Policy Compliance',
    content:
      'Users are expected to follow applicable Dominican College of Tarlac policies and institutional rules when using DommUnity.'
  }
]

/**
 * PolicyContent — renders the list of policy sections.
 * Shared between acknowledge modal and readonly card.
 */
function PolicyContent() {
  return (
    <div className="space-y-4">
      {POLICY_SECTIONS.map((section, idx) => (
        <div key={idx}>
          <h4 className="text-sm font-bold text-navy-blue mb-1">
            {idx + 1}. {section.title}
          </h4>
          <p className="text-[13px] text-gray-600 leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * AcceptableUseNotice
 *
 * @param {'acknowledge' | 'readonly'} mode
 *   - 'acknowledge': full-screen modal with checkbox + accept button (first login).
 *   - 'readonly': inline card for the About tab.
 * @param {function} onAccept — called when user accepts (acknowledge mode only).
 */
export default function AcceptableUseNotice({ mode = 'readonly', onAccept }) {
  const [checked, setChecked] = useState(false)
  const [accepting, setAccepting] = useState(false)

  const handleAccept = async () => {
    if (!checked || accepting) return
    setAccepting(true)
    try {
      if (onAccept) await onAccept()
    } finally {
      setAccepting(false)
    }
  }

  // ─── READ-ONLY CARD (About tab) ────────────────────────────
  if (mode === 'readonly') {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-navy-blue/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-navy-blue" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-blue">
              Acceptable Use & Data Privacy Notice
            </h2>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase mt-0.5">
              Dominican College of Tarlac — CES Office
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <PolicyContent />
        </div>
      </div>
    )
  }

  // ─── ACKNOWLEDGMENT MODAL (first login) ────────────────────
  return (
    <AnimatedModal
      isOpen={true}
      overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center bg-navy-blue/50 backdrop-blur-sm p-4 overflow-y-auto"
      contentClassName="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-w-lg w-full text-left max-h-[92vh] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-navy-blue flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-6 h-6 text-sig-green" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-navy-blue tracking-tight leading-tight">
            DommUnity Acceptable Use & Data Privacy Notice
          </h2>
          <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-0.5">
            Dominican College of Tarlac — CES Office
          </p>
        </div>
      </div>

      {/* Scrollable Policy Body */}
      <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 mb-5 max-h-[50vh] overflow-y-auto">
        <PolicyContent />
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => setChecked((prev) => !prev)}
        className="flex items-start space-x-3 mb-5 group cursor-pointer w-full text-left"
      >
        <div className="mt-0.5 shrink-0">
          {checked ? (
            <CheckSquare className="w-5 h-5 text-sig-green" />
          ) : (
            <Square className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
          )}
        </div>
        <span className="text-sm text-gray-700 font-medium leading-snug select-none">
          I have read and acknowledge this notice
        </span>
      </button>

      {/* Accept Button */}
      <motion.button
        type="button"
        disabled={!checked || accepting}
        onClick={handleAccept}
        className={`w-full font-extrabold py-3 px-6 rounded-xl text-sm transition-all duration-200 flex items-center justify-center space-x-2 border shadow-sm ${
          checked
            ? 'bg-sig-green hover:bg-sig-green-600 text-navy-blue border-white/40 cursor-pointer hover:shadow-md'
            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
        whileHover={checked && !accepting ? { scale: 1.01, y: -1 } : {}}
        whileTap={checked && !accepting ? { scale: 0.98 } : {}}
        transition={{ duration: duration.fast }}
      >
        {accepting ? (
          <div className="w-5 h-5 border-2 border-navy-blue/30 border-t-navy-blue rounded-full animate-spin" />
        ) : (
          <span>I Accept and Acknowledge</span>
        )}
      </motion.button>
    </AnimatedModal>
  )
}
