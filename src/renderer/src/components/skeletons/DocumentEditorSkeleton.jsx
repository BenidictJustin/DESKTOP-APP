/* eslint-disable */
import Skeleton from '../ui/Skeleton'

/**
 * DocumentEditorSkeleton — skeleton loading state matching the TextEditor layout.
 * Shown when user is offline on the Document Editor tab.
 */
export default function DocumentEditorSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFBFD] border border-neutral-200 rounded-lg animate-fade-in">
      {/* ── Title Bar skeleton ── */}
      <div className="bg-navy-blue flex items-center justify-between px-4 py-2 shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="w-6 h-6 rounded bg-white/20" />
          <Skeleton className="h-4 w-48 rounded bg-white/15" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20 rounded bg-white/15" />
        </div>
      </div>

      {/* ── Menu & Actions Row skeleton ── */}
      <div className="bg-neutral-100 border-b border-neutral-200 flex items-center px-4 py-2 gap-2 shrink-0">
        <Skeleton className="h-7 w-14 rounded" />
        <Skeleton className="h-7 w-20 rounded" />
        <div className="h-4 w-px bg-neutral-300 mx-1" />
        <div className="flex items-center gap-1 bg-neutral-200/60 rounded px-1.5 py-0.5">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-3 w-8 rounded" />
          <Skeleton className="w-5 h-5 rounded" />
        </div>
      </div>

      {/* ── Formatting Toolbar skeleton ── */}
      <div className="bg-white border-b border-neutral-200 px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Font family + size selectors */}
          <Skeleton className="h-7 w-28 rounded" />
          <Skeleton className="h-7 w-14 rounded" />
          <div className="h-4 w-px bg-neutral-200 mx-0.5" />
          {/* Bold, Italic, Underline, Strikethrough */}
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`fmt-${i}`} className="w-7 h-7 rounded" />
          ))}
          <div className="h-4 w-px bg-neutral-200 mx-0.5" />
          {/* Color, Highlight */}
          <Skeleton className="w-7 h-7 rounded" />
          <Skeleton className="w-7 h-7 rounded" />
          <div className="h-4 w-px bg-neutral-200 mx-0.5" />
          {/* Alignment buttons */}
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`align-${i}`} className="w-7 h-7 rounded" />
          ))}
          <div className="h-4 w-px bg-neutral-200 mx-0.5" />
          {/* List, indent, etc */}
          {[1, 2, 3].map((i) => (
            <Skeleton key={`list-${i}`} className="w-7 h-7 rounded" />
          ))}
        </div>
      </div>

      {/* ── Document Canvas Area skeleton ── */}
      <div className="flex-1 overflow-hidden w-full relative bg-neutral-200/40 flex items-start justify-center pt-8 pb-8">
        {/* Paper page skeleton */}
        <div className="bg-white rounded shadow-lg border border-neutral-200/80 flex flex-col"
          style={{ width: 620, minHeight: 780 }}
        >
          {/* Simulated page content lines */}
          <div className="px-14 py-16 space-y-4">
            {/* Title line */}
            <Skeleton className="h-6 w-3/5 rounded mx-auto" />
            <div className="h-4" />
            {/* Paragraph block 1 */}
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-11/12 rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
            <div className="h-3" />
            {/* Paragraph block 2 */}
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-10/12 rounded" />
            <div className="h-3" />
            {/* Paragraph block 3 */}
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-9/12 rounded" />
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <div className="h-3" />
            {/* Shorter block */}
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-2/3 rounded" />
          </div>
        </div>
      </div>

      {/* ── Status Bar skeleton ── */}
      <div className="bg-neutral-100 border-t border-neutral-200 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </div>
  )
}
