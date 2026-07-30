import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import React, { useRef, useState, useEffect } from 'react'

const FloatingTextBoxComponent = ({ node, updateAttributes, selected, editor }) => {
  const { left, top, width, height } = node.attrs
  const containerRef = useRef(null)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, left: 0, top: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const isEditable = editor?.isEditable

  const handleMouseDown = (e) => {
    if (!isEditable) return
    // Prevent dragging if clicking inside the editable text area
    if (e.target.closest('.text-box-content-wrapper')) return
    if (e.target.classList.contains('resize-handle')) return

    // We do NOT call e.preventDefault() here so that ProseMirror's click/select handling
    // still receives the click event and can select the node view correctly.
    setIsMouseDown(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      left: left,
      top: top
    })
  }

  const handleResizeMouseDown = (e) => {
    if (!isEditable) return
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: width,
      height: height
    })
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isMouseDown && !isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        // Drag threshold of 5 pixels to distinguish click/select from dragging
        if (dist > 5) {
          setIsDragging(true)
        }
      }

      if (isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y

        // Constrain horizontal positioning to printable width
        const parentEl = containerRef.current?.parentElement?.parentElement
        const editorDom = parentEl?.closest('.ProseMirror')
        let printableWidth = 600
        if (editorDom) {
          const style = window.getComputedStyle(editorDom)
          const padLeft = parseFloat(style.paddingLeft) || 0
          const padRight = parseFloat(style.paddingRight) || 0
          printableWidth = editorDom.clientWidth - (padLeft + padRight)
        }

        const newLeft = Math.max(0, Math.min(printableWidth - width, dragStart.left + dx))
        updateAttributes({
          left: newLeft,
          top: dragStart.top + dy
        })
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.x
        const dy = e.clientY - resizeStart.y
        updateAttributes({
          width: Math.max(100, resizeStart.width + dx),
          height: Math.max(50, resizeStart.height + dy)
        })
      }
    }

    const handleMouseUp = () => {
      setIsMouseDown(false)
      setIsDragging(false)
      setIsResizing(false)
    }

    if (isMouseDown || isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isMouseDown, isDragging, isResizing, dragStart, resizeStart, width, height])

  return (
    <NodeViewWrapper
      style={{
        position: 'relative',
        display: 'block',
        height: 0,
        overflow: 'visible',
        zIndex: selected && isEditable ? 150 : 100
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          border:
            isEditable && (selected || isDragging || isResizing)
              ? '2px solid #3b82f6'
              : '1px solid #ccc',
          backgroundColor: '#ffffff',
          boxSizing: 'border-box',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          cursor: isEditable && isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Drag handle header bar - hide completely if not editable */}
        {isEditable && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              height: '14px',
              margin: '-8px -8px 4px -8px',
              backgroundColor: selected || isDragging || isResizing ? '#3b82f6' : '#f3f4f6',
              cursor: 'move',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: selected || isDragging || isResizing ? '#ffffff' : '#6b7280',
              fontWeight: 'bold',
              userSelect: 'none'
            }}
          >
            {selected || isDragging || isResizing ? 'Text Box' : ''}
          </div>
        )}

        {/* Content Area */}
        <div className="text-box-content-wrapper flex-1 overflow-auto">
          <NodeViewContent className="outline-none min-h-full" />
        </div>

        {/* Bottom-right resize handle */}
        {isEditable && (selected || isDragging || isResizing) && (
          <div
            onMouseDown={handleResizeMouseDown}
            className="resize-handle"
            style={{
              position: 'absolute',
              right: '-6px',
              bottom: '-6px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 10
            }}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}

export const FloatingTextBox = Node.create({
  name: 'floatingTextBox',
  group: 'block',
  content: 'block+',
  defining: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      left: {
        default: 50
      },
      top: {
        default: 0
      },
      width: {
        default: 250
      },
      height: {
        default: 150
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-floating-text-box]',
        getAttrs: (dom) => ({
          left: parseFloat(dom.getAttribute('data-left')) || 0,
          top: parseFloat(dom.getAttribute('data-top')) || 0,
          width: parseFloat(dom.getAttribute('data-width')) || 250,
          height: parseFloat(dom.getAttribute('data-height')) || 150
        })
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-floating-text-box': 'true',
        'data-left': HTMLAttributes.left,
        'data-top': HTMLAttributes.top,
        'data-width': HTMLAttributes.width,
        'data-height': HTMLAttributes.height,
        style: `position: relative; display: block; margin: 0; padding: 0; height: 0; overflow: visible; z-index: 100;`
      }),
      [
        'div',
        {
          style: `position: absolute; left: ${HTMLAttributes.left}px; top: ${HTMLAttributes.top}px; width: ${HTMLAttributes.width}px; height: ${HTMLAttributes.height}px; border: 1px solid #ccc; background-color: white; padding: 8px; box-sizing: border-box; overflow: auto; pointer-events: auto;`
        },
        0
      ]
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingTextBoxComponent)
  }
})

export default FloatingTextBox
