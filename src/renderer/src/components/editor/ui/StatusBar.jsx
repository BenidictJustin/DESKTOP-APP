import React from 'react'
import { Save, Send, ZoomIn, ZoomOut } from 'lucide-react'

/**
 * StatusBar — Bottom bar showing word count, document info, zoom, and save/submit buttons.
 */
export default function StatusBar({
  wordCount,
  charCount,
  paperKey,
  orientation,
  marginKey,
  zoom,
  setZoom,
  loading,
  isOffline = false,
  workspaceIsReadOnly,
  onSaveDraft,
  onSubmit,
  currentPage = 1,
  totalPages = 1
}) {
  return (
    <div className="bg-navy-blue text-gray-300 flex items-center justify-between px-4 py-1 text-[10px] shrink-0 select-none">
      <div className="flex items-center gap-4">
        <span>
          Page <strong className="text-white">{currentPage}</strong> of{' '}
          <strong className="text-white">{totalPages}</strong>
        </span>
        <span className="text-white/30">|</span>
        <span>
          Words: <strong className="text-white">{wordCount}</strong>
        </span>
        <span>
          Characters: <strong className="text-white">{charCount}</strong>
        </span>
        <span>
          Paper:{' '}
          <strong className="text-white">
            {paperKey}
            {orientation === 'landscape' ? ' (L)' : ''}
          </strong>
        </span>
        <span>
          Margins: <strong className="text-white">{marginKey}</strong>
        </span>
        {isOffline && (
          <span className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/30 text-[9.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            Offline · Draft saved locally
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {!workspaceIsReadOnly && (
          <>
            <button
              onClick={onSaveDraft}
              disabled={loading}
              title={isOffline ? 'Offline: Draft is preserved in memory. Connect to sync.' : 'Save Draft'}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded text-white font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={onSubmit}
              disabled={loading || isOffline}
              title={isOffline ? 'Connect to internet to submit' : 'Submit Report'}
              className="flex items-center gap-1 bg-sig-green text-navy-blue px-2.5 py-0.5 rounded font-bold transition hover:bg-sig-green/90 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              <span>Submit</span>
            </button>
          </>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="hover:text-white cursor-pointer transition"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-8 text-center">
            <strong className="text-white">{zoom}%</strong>
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="hover:text-white cursor-pointer transition"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
