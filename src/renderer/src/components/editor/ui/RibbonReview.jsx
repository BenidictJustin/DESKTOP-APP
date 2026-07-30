import React from 'react'
import { MessageSquare, Hash, AlertTriangle } from 'lucide-react'
import { RBtn, RGroup } from './DropdownWrapper'

export default function RibbonReview({
  editor,
  showComments,
  setShowComments,
  trackChanges,
  setTrackChanges,
  onOpenWordCount,
  workspaceFeedback
}) {
  return (
    <div className="flex items-end gap-0 overflow-visible flex-nowrap">
      {/* ── Comments ── */}
      <RGroup label="Comments">
        <RBtn
          active={showComments}
          title="Comments Panel"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Proofing ── */}
      <RGroup label="Proofing">
        <RBtn
          title="Spell Check"
          onClick={() => {
            const el = document.querySelector('.ProseMirror')
            if (el) {
              el.setAttribute('spellcheck', 'true')
              el.focus()
              alert('Spell check enabled. Misspellings will be underlined by the browser.')
            }
          }}
        >
          <span className="text-[10px] font-bold">ABC✓</span>
        </RBtn>
        <RBtn title="Word Count" onClick={onOpenWordCount}>
          <Hash className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Tracking ── */}
      <RGroup label="Tracking">
        <RBtn
          active={trackChanges}
          title="Track Changes (Suggestion Mode)"
          onClick={() => setTrackChanges(!trackChanges)}
          className="px-2 text-[10px]"
        >
          {trackChanges ? '● Tracking ON' : 'Track Changes'}
        </RBtn>
      </RGroup>

      {/* ── Admin Feedback ── */}
      {workspaceFeedback && (
        <RGroup label="Feedback">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-[10px] text-amber-800 max-w-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{workspaceFeedback}</span>
          </div>
        </RGroup>
      )}
    </div>
  )
}
