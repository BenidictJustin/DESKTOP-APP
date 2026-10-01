import React, { useState, useEffect, useCallback } from 'react'
import {
  Copy,
  Check,
  Link2,
  X,
  Send,
  Loader2
} from 'lucide-react'
import AnimatedModal from '../../motion/AnimatedModal'

// Professional Google Docs Brand Icon SVG
export const GoogleDocsIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M30 4H14C11.7909 4 10 5.79086 10 8V40C10 42.2091 11.7909 44 14 44H34C36.2091 44 38 42.2091 38 40V12L30 4Z"
      fill="#4285F4"
    />
    <path d="M30 4V12H38L30 4Z" fill="#A1C2FA" />
    <path d="M16 22H32V24H16V22Z" fill="white" />
    <path d="M16 28H32V30H16V28Z" fill="white" />
    <path d="M16 34H26V36H16V34Z" fill="white" />
  </svg>
)

export default function GoogleDocsModal({
  isOpen,
  onClose,
  editor,
  docTitle,
  workspaceReportId,
  googleDocsUrl,
  onSaveGoogleDocsUrl,
  onSaveDraft,
  onSubmitToAdmin,
  user
}) {
  const getPersistedDocUrl = useCallback(() => {
    if (googleDocsUrl) return googleDocsUrl
    if (workspaceReportId) {
      const perReport = localStorage.getItem(`dommunity_gdocs_${workspaceReportId}`)
      if (perReport) return perReport
    }
    return localStorage.getItem('dommunity_saved_gdoc_url') || ''
  }, [googleDocsUrl, workspaceReportId])

  const [inputUrl, setInputUrl] = useState(() => getPersistedDocUrl())
  const [savedUrlSuccess, setSavedUrlSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const url = getPersistedDocUrl()
    if (url) {
      setInputUrl(url)
    } else if (isOpen && navigator.clipboard?.readText) {
      navigator.clipboard
        .readText()
        .then((text) => {
          const match = text && text.trim().match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)
          if (match) {
            const detected = `https://docs.google.com/document/d/${match[1]}/edit`
            setInputUrl(detected)
          }
        })
        .catch(() => {})
    }
  }, [googleDocsUrl, workspaceReportId, isOpen, getPersistedDocUrl])

  // Save the connected Google Doc URL permanently
  const handleSaveUrl = async (customUrl) => {
    const trimmed = (customUrl !== undefined ? customUrl : inputUrl).trim()
    setInputUrl(trimmed)
    if (trimmed) {
      const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
      if (!match) {
        alert('Please enter a valid Google Docs URL (e.g. https://docs.google.com/document/d/.../edit).')
        return false
      }
    }
    if (onSaveGoogleDocsUrl) {
      await onSaveGoogleDocsUrl(trimmed)
    }
    if (trimmed) {
      localStorage.setItem('dommunity_saved_gdoc_url', trimmed)
      if (workspaceReportId) {
        localStorage.setItem(`dommunity_gdocs_${workspaceReportId}`, trimmed)
      }
    } else {
      localStorage.removeItem('dommunity_saved_gdoc_url')
      if (workspaceReportId) {
        localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
      }
    }
    setSavedUrlSuccess(true)
    setTimeout(() => setSavedUrlSuccess(false), 2500)
    return true
  }

  // Paste Google Docs URL directly from clipboard
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard?.readText()
      const match = text && text.trim().match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)
      if (match) {
        const cleanUrl = `https://docs.google.com/document/d/${match[1]}/edit`
        setInputUrl(cleanUrl)
        handleSaveUrl(cleanUrl)
      } else {
        alert('No Google Docs URL found on clipboard. Please copy your document link from the browser address bar.')
      }
    } catch {
      alert('Unable to access clipboard. Please paste the URL directly into the input field.')
    }
  }

  // Clear linked Google Doc URL
  const handleClearLink = () => {
    setInputUrl('')
    localStorage.removeItem('dommunity_saved_gdoc_url')
    if (workspaceReportId) {
      localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
    }
    if (onSaveGoogleDocsUrl) onSaveGoogleDocsUrl('')
  }

  return (
    <AnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 glass-modal-overlay select-none font-poppins"
      contentClassName="glass-modal bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-white/80 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden text-left"
    >
      {/* ── Modal Header ── */}
      <div className="px-5 sm:px-6 py-4 border-b border-gray-200/70 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-navy-blue/5 border border-navy-blue/10 flex items-center justify-center shrink-0 shadow-xs">
            <GoogleDocsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-navy-blue text-base sm:text-lg tracking-tight truncate">
                Link Settings
              </h3>
              <span className="text-[10px] font-bold bg-sig-green/15 text-navy-blue border border-sig-green/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                Google Docs
              </span>
            </div>
            <p className="text-xs text-gray-500 font-normal mt-0.5 truncate">
              Manage Google Docs connection and document links.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-navy-blue hover:bg-gray-100 transition-all cursor-pointer shrink-0 ml-2"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Modal Content Body ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
        {/* Connect Specific Document Link */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-navy-blue flex items-center gap-2">
              <Link2 className="w-4 h-4 text-navy-blue shrink-0" />
              <span>Link Existing Google Doc to this Report</span>
            </h4>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            Paste the URL of your Google Doc (e.g. from your browser address bar) to associate it with this Dommunity report:
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://docs.google.com/document/d/YOUR_DOC_ID/edit"
              className="flex-1 min-w-0 bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs text-navy-blue font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition-all"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                title="Paste Google Docs URL from clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Paste Clipboard</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveUrl()}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-navy-blue hover:bg-navy-blue/90 text-white font-bold text-xs rounded-xl border-b-2 border-sig-green shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {savedUrlSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-sig-green" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Link</span>
                )}
              </button>
            </div>
          </div>

          {inputUrl && (
            <div className="flex items-center justify-end pt-2 border-t border-gray-100 text-xs">
              <button
                type="button"
                onClick={handleClearLink}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium cursor-pointer"
              >
                Clear link
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Footer ── */}
      <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-gray-50/90 border-t border-gray-150 flex items-center justify-end gap-2.5 shrink-0 rounded-b-3xl">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
        >
          Close
        </button>
        {onSubmitToAdmin && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              const trimmed = inputUrl.trim()
              if (!trimmed) {
                alert('Please enter or paste your Google Docs link before submitting to Admin.')
                return
              }
              const match = trimmed.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
              if (!match) {
                alert('Please enter a valid Google Docs URL (e.g. https://docs.google.com/document/d/.../edit).')
                return
              }
              setIsSubmitting(true)
              try {
                const saveOk = await handleSaveUrl(trimmed)
                if (saveOk === false) return
                const submitOk = await onSubmitToAdmin(trimmed)
                if (submitOk !== false) {
                  onClose()
                }
              } finally {
                setIsSubmitting(false)
              }
            }}
            className="px-5 py-2.5 bg-sig-green hover:bg-sig-green-600 disabled:opacity-60 text-navy-blue font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Submit this report to Admin"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Submit to Admin</span>
              </>
            )}
          </button>
        )}
      </div>
    </AnimatedModal>
  )
}
