import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { NodeSelection } from 'prosemirror-state'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  ChevronDown,
  Plus,
  Minus,
  Palette,
  Highlighter,
  List,
  ListOrdered,
  MessageSquare
} from 'lucide-react'

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Verdana', value: 'Verdana' }
]

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72]

const TEXT_COLORS = [
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#cccccc',
  '#efefef',
  '#f3f3f3',
  '#ffffff',
  '#980000',
  '#ff0000',
  '#ff9900',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#4a86e8',
  '#0000ff',
  '#9900ff',
  '#ff00ff',
  '#e6b8af',
  '#f4cccc',
  '#fce5cd',
  '#fff2cc',
  '#d9ead3',
  '#d0e0e3',
  '#c9daf8',
  '#cfe2f3',
  '#d9d2e9',
  '#ead1dc',
  '#dd7e6b',
  '#ea9999',
  '#f9cb9c',
  '#ffe599'
]

const HIGHLIGHT_COLORS = [
  'transparent',
  '#fef08a',
  '#bbf7d0',
  '#bfdbfe',
  '#fbcfe8',
  '#fed7aa',
  '#ddd6fe',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#ff00ff',
  '#ff0000',
  '#0000ff',
  '#000080'
]

const HEADING_STYLES = [
  { label: 'Normal Text', value: 0 },
  { label: 'Heading 1', value: 1 },
  { label: 'Heading 2', value: 2 },
  { label: 'Heading 3', value: 3 }
]

export default function FloatingToolbar({ editor }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const [fontSizeInfo, setFontSizeInfo] = useState({ value: '16', isMixed: false })

  const [activeDropdown, setActiveDropdown] = useState(null)

  const toolbarRef = useRef(null)

  const updatePosition = useCallback(() => {
    if (!editor) return
    const { state } = editor
    const { from, to, $from } = state.selection

    // Hide for empty selections
    if (from === to || !editor.isFocused) {
      setVisible(false)
      setActiveDropdown(null)
      return
    }

    // Hide for node selections (images, text boxes, etc.)
    if (state.selection instanceof NodeSelection) {
      setVisible(false)
      setActiveDropdown(null)
      return
    }

    const getFontSizeFromNodeOrDOM = (pos, node) => {
      if (!editor) return '16'

      if (node && node.marks) {
        const textStyleMark = node.marks.find((m) => m.type.name === 'textStyle')
        if (textStyleMark && textStyleMark.attrs?.fontSize) {
          return textStyleMark.attrs.fontSize.replace('px', '').replace('pt', '')
        }
      }

      if (editor.view && editor.view.dom) {
        try {
          const domResult = editor.view.domAtPos(pos)
          const targetEl =
            domResult.node?.nodeType === 1
              ? domResult.node
              : domResult.node?.parentElement
          if (targetEl && editor.view.dom.contains(targetEl)) {
            const px = parseFloat(window.getComputedStyle(targetEl).fontSize)
            if (!isNaN(px) && px > 0) {
              const pt = Math.round(px * 0.75)
              return pt.toString()
            }
          }
        } catch (e) {
          // ignore fallback errors
        }
      }

      return '16'
    }

    // Calculate selection font size dynamically across the selection range
    const sizes = new Set()
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (node.isText) {
        const size = getFontSizeFromNodeOrDOM(pos, node)
        sizes.add(size)
      }
    })

    let val = '16'
    let mixed = false
    if (sizes.size > 1) {
      val = '—'
      mixed = true
    } else if (sizes.size === 1) {
      val = Array.from(sizes)[0]
    } else {
      const markSize = editor.getAttributes('textStyle').fontSize
      val = markSize ? markSize.replace('px', '').replace('pt', '') : getFontSizeFromNodeOrDOM(from, null)
    }

    setFontSizeInfo({ value: val, isMixed: mixed })

    const { view } = editor
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)

    const left = (start.left + end.left) / 2
    const top = start.top - 54

    setPos({
      top: Math.max(8, top),
      left: Math.max(8, Math.min(left - 180, window.innerWidth - 450))
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
          setActiveDropdown(null)
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

  if (!visible || !editor) return null

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name))
  }

  const currentSizeNum = parseFloat(fontSizeInfo.value) || 16

  // Use setMark('textStyle') — the same approach as the ribbon — for reliable font size change.
  const applyFontSize = (sizeNum) => {
    editor
      .chain()
      .focus()
      .setMark('textStyle', { fontSize: `${sizeNum}pt` })
      .run()
  }

  const increaseFontSize = () => {
    const { from, to } = editor.state
    editor.chain().focus().run()

    if (from !== to) {
      let tr = editor.state.tr
      let modified = false
      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          const textStyleMark = node.marks.find((m) => m.type.name === 'textStyle')
          const currentSizePx = textStyleMark?.attrs?.fontSize || '16pt'
          const currentSize = parseFloat(currentSizePx.replace('px', '').replace('pt', '')) || 16
          const newSize = currentSize + 1

          const startPos = Math.max(from, pos)
          const endPos = Math.min(to, pos + node.nodeSize)

          const textStyleType = editor.state.schema.marks.textStyle
          const newAttrs = { ...textStyleMark?.attrs, fontSize: `${newSize}pt` }
          tr.addMark(startPos, endPos, textStyleType.create(newAttrs))
          modified = true
        }
      })
      if (modified) {
        editor.view.dispatch(tr)
        return
      }
    }

    const liveSizePx = editor.getAttributes('textStyle').fontSize || '16pt'
    const liveSize = parseFloat(liveSizePx.replace('px', '').replace('pt', '')) || 16
    applyFontSize(liveSize + 1)
  }

  const decreaseFontSize = () => {
    const { from, to } = editor.state
    editor.chain().focus().run()

    if (from !== to) {
      let tr = editor.state.tr
      let modified = false
      editor.state.doc.nodesBetween(from, to, (node, pos) => {
        if (node.isText) {
          const textStyleMark = node.marks.find((m) => m.type.name === 'textStyle')
          const currentSizePx = textStyleMark?.attrs?.fontSize || '16pt'
          const currentSize = parseFloat(currentSizePx.replace('px', '').replace('pt', '')) || 16
          const newSize = Math.max(1, currentSize - 1)

          const startPos = Math.max(from, pos)
          const endPos = Math.min(to, pos + node.nodeSize)

          const textStyleType = editor.state.schema.marks.textStyle
          const newAttrs = { ...textStyleMark?.attrs, fontSize: `${newSize}pt` }
          tr.addMark(startPos, endPos, textStyleType.create(newAttrs))
          modified = true
        }
      })
      if (modified) {
        editor.view.dispatch(tr)
        return
      }
    }

    const liveSizePx = editor.getAttributes('textStyle').fontSize || '16pt'
    const liveSize = parseFloat(liveSizePx.replace('px', '').replace('pt', '')) || 16
    applyFontSize(Math.max(1, liveSize - 1))
  }

  const currentStyleLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Heading 1'
    if (editor.isActive('heading', { level: 2 })) return 'Heading 2'
    if (editor.isActive('heading', { level: 3 })) return 'Heading 3'
    return 'Normal'
  }

  const applyStyle = (level) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run()
    } else {
      editor.chain().focus().toggleHeading({ level }).run()
    }
    setActiveDropdown(null)
  }

  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || 'Arial'

  const applyFont = (font) => {
    editor.chain().focus().setFontFamily(font).run()
    setActiveDropdown(null)
  }

  const Btn = ({ active, onClick, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={`p-1.5 rounded transition cursor-pointer flex items-center justify-center ${active ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-300'}`}
    >
      {children}
    </button>
  )

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-10000 flex items-center gap-0.5 bg-gray-950/95 backdrop-blur-md rounded-lg shadow-2xl px-2 py-1 border border-gray-800/60 select-none animate-in fade-in zoom-in-95 duration-100"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            toggleDropdown('font')
          }}
          className="text-[10px] font-semibold text-gray-200 hover:text-white px-2 py-1 rounded hover:bg-white/10 cursor-pointer flex items-center gap-1 min-w-[70px] justify-between"
          title="Font Family"
        >
          <span className="truncate max-w-[60px]">{currentFontFamily}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>
        {activeDropdown === 'font' && (
          <div className="absolute bottom-full left-0 mb-1.5 bg-gray-950 rounded-lg shadow-2xl border border-gray-800 py-1 w-32 z-50">
            {FONT_FAMILIES.map((f) => (
              <button
                key={f.value}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applyFont(f.value)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition"
                style={{ fontFamily: f.value }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <div className="flex items-center">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            decreaseFontSize()
          }}
          className="p-1 rounded hover:bg-white/10 cursor-pointer text-gray-400 hover:text-white"
          title="Decrease font size"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>

        <div className="relative">
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              toggleDropdown('size')
            }}
            className="text-[10px] font-semibold text-gray-200 hover:text-white px-1.5 py-1 rounded hover:bg-white/10 cursor-pointer flex items-center gap-0.5 animate-in fade-in duration-100"
            title="Font Size"
          >
            {fontSizeInfo.value}
            <ChevronDown className="w-2 h-2 opacity-60" />
          </button>
          {activeDropdown === 'size' && (
            <div className="absolute bottom-full left-0 mb-1.5 bg-gray-950 rounded-lg shadow-2xl border border-gray-800 py-1 max-h-40 overflow-y-auto w-16 z-50">
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    applyFontSize(s)
                    setActiveDropdown(null)
                  }}
                  className="w-full text-center px-2 py-1 text-xs text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onMouseDown={(e) => {
            e.preventDefault()
            increaseFontSize()
          }}
          className="p-1 rounded hover:bg-white/10 cursor-pointer text-gray-400 hover:text-white"
          title="Increase font size"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            toggleDropdown('style')
          }}
          className="text-[10px] font-semibold text-gray-200 hover:text-white px-2 py-1 rounded hover:bg-white/10 cursor-pointer flex items-center gap-1 min-w-[65px] justify-between"
          title="Styles"
        >
          <span className="truncate max-w-[55px]">{currentStyleLabel()}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60" />
        </button>
        {activeDropdown === 'style' && (
          <div className="absolute bottom-full left-0 mb-1.5 bg-gray-950 rounded-lg shadow-2xl border border-gray-800 py-1 w-28 z-50">
            {HEADING_STYLES.map((h) => (
              <button
                key={h.value}
                onMouseDown={(e) => {
                  e.preventDefault()
                  applyStyle(h.value)
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition font-medium"
              >
                {h.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </Btn>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            toggleDropdown('color')
          }}
          className="p-1.5 rounded hover:bg-white/10 cursor-pointer text-gray-300 flex flex-col items-center justify-center"
          title="Text Color"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
        {activeDropdown === 'color' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-950 rounded-lg shadow-2xl border border-gray-800 p-2 w-44 z-50">
            <div className="grid grid-cols-8 gap-1">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    editor.chain().focus().setColor(c).run()
                    setActiveDropdown(null)
                  }}
                  className="w-4.5 h-4.5 rounded border border-gray-800 hover:scale-125 transition cursor-pointer shrink-0"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault()
            toggleDropdown('highlight')
          }}
          className="p-1.5 rounded hover:bg-white/10 cursor-pointer text-gray-300"
          title="Highlight Color"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
        {activeDropdown === 'highlight' && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-950 rounded-lg shadow-2xl border border-gray-800 p-2 w-32 z-50">
            <div className="grid grid-cols-5 gap-1">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (c === 'transparent') {
                      editor.chain().focus().unsetHighlight().run()
                    } else {
                      editor.chain().focus().toggleHighlight({ color: c }).run()
                    }
                    setActiveDropdown(null)
                  }}
                  className="w-5 h-5 rounded border border-gray-800 hover:scale-125 transition cursor-pointer flex items-center justify-center text-[9px] text-gray-400 font-bold shrink-0"
                  style={{ backgroundColor: c === 'transparent' ? '#333' : c }}
                >
                  {c === 'transparent' && 'X'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bulleted List"
      >
        <List className="w-3.5 h-3.5" />
      </Btn>
      <Btn
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </Btn>

      <div className="w-px h-5 bg-gray-800 mx-0.5" />

      <Btn
        onClick={() => {
          const commentText = window.prompt('Add comment about selected text:')
          if (commentText && commentText.trim()) {
            if (editor.commands.setComment) {
              editor.chain().focus().setComment(commentText).run()
            } else {
              editor.chain().focus().toggleHighlight({ color: '#ffff00' }).run()
            }
          }
        }}
        title="New Comment"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </Btn>
    </div>,
    document.body
  )
}
