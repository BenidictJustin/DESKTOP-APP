import React from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'

/**
 * StatusBar — Bottom bar showing word count, document info, and zoom controls.
 */
export default function StatusBar({
  wordCount,
  charCount,
  paperKey,
  orientation,
  marginKey,
  zoom,
  setZoom,
  isOffline = false,
  currentPage = 1,
  totalPages = 1
}) {
  return (
    <div className="bg-navy-blue text-gray-300 flex items-center justify-between px-3 sm:px-4 py-1 text-[10px] shrink-0 select-none overflow-x-auto gap-3">
      <div className="flex items-center gap-2 sm:gap-4 whitespace-nowrap min-w-0">
        <span>
          Page <strong className="text-white">{currentPage}</strong> of{' '}
          <strong className="text-white">{totalPages}</strong>
        </span>
        <span className="text-white/30">|</span>
        <span>
          Words: <strong className="text-white">{wordCount}</strong>
        </span>
        <span className="hidden md:inline">
          Characters: <strong className="text-white">{charCount}</strong>
        </span>
        <span className="hidden sm:inline">
          Paper:{' '}
          <strong className="text-white">
            {paperKey}
            {orientation === 'landscape' ? ' (L)' : ''}
          </strong>
        </span>
        <span className="hidden lg:inline">
          Margins: <strong className="text-white">{marginKey}</strong>
        </span>
        {isOffline && (
          <span className="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-400/30 text-[9.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            Offline · Draft saved locally
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="hover:text-white cursor-pointer transition p-0.5"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-7 sm:w-8 text-center">
            <strong className="text-white">{zoom}%</strong>
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="hover:text-white cursor-pointer transition p-0.5"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
