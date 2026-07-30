import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * DropdownWrapper — renders an absolutely-positioned dropdown panel
 * using a React Portal so it escapes all overflow:hidden ancestors.
 * The panel anchors relative to the trigger button's bounding rect.
 */
export function DropdownWrapper({
  open,
  onClose,
  triggerRef,
  children,
  className = '',
  align = 'left',
  width = 'auto'
}) {
  const panelRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!open || !triggerRef?.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    let left = align === 'right' ? rect.right : rect.left
    let top = rect.bottom + 2

    // Keep within viewport
    const panelW = typeof width === 'number' ? width : 200
    if (left + panelW > window.innerWidth) {
      left = window.innerWidth - panelW - 8
    }
    if (left < 4) left = 4

    setPos({ top, left })
  }, [open, triggerRef, align, width])

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose()
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [open, onClose, triggerRef])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      className={`fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-9999 animate-in fade-in-0 zoom-in-95 ${className}`}
      style={{
        top: pos.top,
        left: align === 'right' ? 'auto' : pos.left,
        right: align === 'right' ? window.innerWidth - pos.left : 'auto'
      }}
    >
      {children}
    </div>,
    document.body
  )
}

/**
 * Ribbon button — the small toolbar button used across all ribbon tabs.
 */
export function RBtn({ onClick, active, disabled, title, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center p-1.5 rounded transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs
        ${
          active
            ? 'bg-blue-100 text-blue-700 border border-blue-300 shadow-sm'
            : 'hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-200'
        } ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Ribbon separator — vertical divider between ribbon groups.
 */
export function RSep() {
  return <div className="w-px h-8 bg-gray-200 mx-1.5 shrink-0" />
}

/**
 * Ribbon group — wraps a set of related toolbar buttons with a label.
 */
export function RGroup({ label, children }) {
  return (
    <div className="flex flex-col items-center border-r border-gray-100 pr-3 mr-1 last:border-r-0">
      <div className="flex items-center gap-0.5 flex-wrap">{children}</div>
      <span className="text-[9px] text-gray-400 mt-0.5 uppercase font-semibold tracking-wider whitespace-nowrap select-none">
        {label}
      </span>
    </div>
  )
}

/**
 * ColorGrid — renders a grid of color swatches for text color or highlight.
 */
export function ColorGrid({ colors, onSelect, label, onClear, clearLabel = 'Clear' }) {
  return (
    <div className="p-2.5">
      {label && <p className="text-[9px] text-gray-400 font-bold uppercase mb-2">{label}</p>}
      <div className="grid grid-cols-8 gap-1">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            className="w-5 h-5 rounded border border-gray-200 hover:scale-125 hover:shadow-md transition-all duration-150 cursor-pointer"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="mt-2 text-[10px] text-gray-500 hover:text-blue-600 font-semibold cursor-pointer"
        >
          {clearLabel}
        </button>
      )}
    </div>
  )
}

/**
 * TableGridPicker — 8×8 grid for selecting table dimensions.
 */
export function TableGridPicker({ onSelect, tableHover, setTableHover, editor }) {
  return (
    <div className="p-3">
      <p className="text-[9px] text-gray-400 font-bold uppercase mb-2">Select table size</p>
      <div className="grid" style={{ gridTemplateColumns: 'repeat(8,1fr)', gap: 2 }}>
        {Array.from({ length: 64 }, (_, i) => {
          const r = Math.floor(i / 8) + 1
          const c = (i % 8) + 1
          const isHov = r <= tableHover.r && c <= tableHover.c
          return (
            <div
              key={i}
              onMouseEnter={() => setTableHover({ r, c })}
              onClick={() => onSelect(r, c)}
              className={`w-5 h-5 border rounded-sm cursor-pointer transition-all duration-100
                ${isHov ? 'bg-blue-200 border-blue-400 shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
            />
          )
        })}
      </div>
      <p className="text-[10px] text-gray-500 mt-2 text-center font-medium">
        {tableHover.r > 0 ? `${tableHover.r} × ${tableHover.c}` : 'Hover to select'}
      </p>
      {editor?.isActive('table') && (
        <>
          <div className="border-t border-gray-100 my-2" />
          <div className="space-y-0.5">
            {[
              { l: 'Add Row Before', fn: () => editor?.chain().focus().addRowBefore().run() },
              { l: 'Add Row After', fn: () => editor?.chain().focus().addRowAfter().run() },
              { l: 'Add Column Before', fn: () => editor?.chain().focus().addColumnBefore().run() },
              { l: 'Add Column After', fn: () => editor?.chain().focus().addColumnAfter().run() },
              { l: 'Delete Row', fn: () => editor?.chain().focus().deleteRow().run() },
              { l: 'Delete Column', fn: () => editor?.chain().focus().deleteColumn().run() },
              { l: 'Delete Table', fn: () => editor?.chain().focus().deleteTable().run() },
              { l: 'Merge Cells', fn: () => editor?.chain().focus().mergeCells().run() },
              { l: 'Split Cell', fn: () => editor?.chain().focus().splitCell().run() },
              { l: 'Toggle Header Row', fn: () => editor?.chain().focus().toggleHeaderRow().run() }
            ].map((item) => (
              <button
                key={item.l}
                onClick={item.fn}
                className="w-full text-left px-2 py-1 text-[10px] hover:bg-blue-50 rounded cursor-pointer transition"
              >
                {item.l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
