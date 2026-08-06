import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Merge,
  Split,
  Trash
} from 'lucide-react'

function Btn({ onClick, children, title, disabled }) {
  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer transition disabled:opacity-30 disabled:cursor-not-allowed"
      title={title}
    >
      {children}
    </button>
  )
}

export default function TableFloatingToolbar({ editor }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!editor || !editor.isActive('table')) {
      setVisible(false)
      return
    }

    const { view } = editor
    const tableEl = view.dom.querySelector('.movable-table:focus-within')
    if (!tableEl) {
      setVisible(false)
      return
    }

    const rect = tableEl.getBoundingClientRect()
    
    // Position toolbar above the table
    const top = rect.top - 46
    const left = rect.left + rect.width / 2

    setPos({
      top: Math.max(8, top),
      left: Math.max(8, Math.min(left - 150, window.innerWidth - 350))
    })
    setVisible(true)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      requestAnimationFrame(updatePosition)
    }

    editor.on('selectionUpdate', handleUpdate)
    editor.on('focus', handleUpdate)
    editor.on('transaction', handleUpdate)

    window.addEventListener('scroll', handleUpdate, true)

    editor.on('blur', () => {
      setTimeout(() => {
        if (!editor.isFocused) {
          setVisible(false)
        }
      }, 250)
    })

    return () => {
      editor.off('selectionUpdate', handleUpdate)
      editor.off('focus', handleUpdate)
      editor.off('transaction', handleUpdate)
      window.removeEventListener('scroll', handleUpdate, true)
    }
  }, [editor, updatePosition])

  if (!visible) return null

  // Check if multiple cells are selected to enable merging
  const canMerge = editor.can().mergeCells()
  const canSplit = editor.can().splitCell()

  return createPortal(
    <div
      ref={toolbarRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        pointerEvents: 'auto'
      }}
      className="z-[9999] flex items-center gap-0.5 bg-gray-950/95 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-2xl border border-gray-800 text-white select-none animate-in fade-in zoom-in-95 duration-100 ease-out origin-bottom"
    >
      <Btn
        onClick={() => editor.chain().focus().addRowBefore().run()}
        title="Insert Row Above"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().addRowAfter().run()}
        title="Insert Row Below"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </Btn>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        title="Insert Column Left"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        title="Insert Column Right"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </Btn>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        onClick={() => editor.chain().focus().deleteRow().run()}
        title="Delete Row"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().deleteColumn().run()}
        title="Delete Column"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400 rotate-90" />
      </Btn>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        onClick={() => editor.chain().focus().mergeCells().run()}
        disabled={!canMerge}
        title="Merge Cells"
      >
        <Merge className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().splitCell().run()}
        disabled={!canSplit}
        title="Split Cell"
      >
        <Split className="w-3.5 h-3.5" />
      </Btn>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        onClick={() => editor.chain().focus().deleteTable().run()}
        title="Delete Table"
      >
        <Trash className="w-3.5 h-3.5 text-red-500" />
      </Btn>
    </div>,
    document.body
  )
}
