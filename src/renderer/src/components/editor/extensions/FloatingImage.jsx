import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React, { useRef, useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, Scissors, Copy, Layers, Crop, Square, Check } from 'lucide-react'

const FloatingImageComponent = ({ node, updateAttributes, selected, editor, deleteNode }) => {
  const { src, left, top, width, zIndex, cropLeft, cropRight, cropTop, cropBottom } = node.attrs
  const containerRef = useRef(null)

  // Dragging/Resizing States
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, left: 0, top: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0 })

  // Cropping States
  const [isCropping, setIsCropping] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(1.5) // Aspect ratio of natural image

  // Context Menu State
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)

  const isEditable = editor?.isEditable

  // Load natural aspect ratio of the image
  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.src = src
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(img.naturalWidth / img.naturalHeight)
      }
    }
  }, [src])

  // Disable crop mode if deselected
  useEffect(() => {
    if (!selected) {
      setIsCropping(false)
    }
  }, [selected])

  // Keyboard shortcut to apply crop
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isCropping && (e.key === 'Enter' || e.key === 'Escape')) {
        e.preventDefault()
        e.stopPropagation()
        setIsCropping(false)
      }
    }
    if (isCropping) {
      window.addEventListener('keydown', handleKeyDown, true)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isCropping])

  const handleMouseDown = (e) => {
    if (!isEditable) return
    if (isCropping) return // Prevent dragging while in cropping mode
    if (e.target.classList.contains('resize-handle')) return

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
      width: width
    })
  }

  const handleContextMenu = (e) => {
    if (!isEditable) return
    e.preventDefault()
    e.stopPropagation()

    const menuWidth = 180
    const menuHeight = 250

    let x = e.clientX
    let y = e.clientY

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10
    }

    setShowMenu(true)
    setMenuPos({ x, y })
  }

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Crop Drag Handler
  const handleCropMouseDown = (e, handle) => {
    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    const startLeft = cropLeft || 0
    const startRight = cropRight || 0
    const startTop = cropTop || 0
    const startBottom = cropBottom || 0

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY

      // Convert offsets to percentage of display full size
      const pctX = (dx / displayFullWidth) * 100
      const pctY = (dy / displayFullHeight) * 100

      let newLeft = startLeft
      let newRight = startRight
      let newTop = startTop
      let newBottom = startBottom

      if (handle.includes('left')) {
        newLeft = Math.max(0, Math.min(100 - startRight - 10, startLeft + pctX))
      }
      if (handle.includes('right')) {
        newRight = Math.max(0, Math.min(100 - startLeft - 10, startRight - pctX))
      }
      if (handle.includes('top')) {
        newTop = Math.max(0, Math.min(100 - startBottom - 10, startTop + pctY))
      }
      if (handle.includes('bottom')) {
        newBottom = Math.max(0, Math.min(100 - startTop - 10, startBottom - pctY))
      }

      updateAttributes({
        cropLeft: parseFloat(newLeft.toFixed(2)),
        cropRight: parseFloat(newRight.toFixed(2)),
        cropTop: parseFloat(newTop.toFixed(2)),
        cropBottom: parseFloat(newBottom.toFixed(2))
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Mouse drag & resize calculations
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isMouseDown && !isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 5) {
          setIsDragging(true)
        }
      }

      if (isDragging) {
        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y

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
        const newWidth = Math.max(50, resizeStart.width + dx)
        updateAttributes({
          width: newWidth,
          height: 'auto'
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
  }, [isMouseDown, isDragging, isResizing, dragStart, resizeStart, width])

  // Context Menu Actions
  const handleCut = () => {
    navigator.clipboard.writeText(src)
    deleteNode()
    setShowMenu(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(src)
    setShowMenu(false)
  }

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text && (text.startsWith('data:image') || text.startsWith('http'))) {
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'floatingImage',
              attrs: { src: text, left: left + 20, top: top + 20 }
            })
            .run()
        } else {
          alert('Clipboard does not contain a valid image source (base64 or URL).')
        }
      })
      .catch((err) => {
        console.warn('Clipboard read failed:', err)
      })
    setShowMenu(false)
  }

  const handleBringForward = () => {
    const curZ = parseInt(zIndex) || 100
    const newZ = curZ < 10 ? 100 : curZ + 10
    updateAttributes({ zIndex: newZ })
    setShowMenu(false)
  }

  const handleSendBackward = () => {
    const curZ = parseInt(zIndex) || 100
    const newZ = curZ >= 10 ? 5 : Math.max(1, curZ - 1)
    updateAttributes({ zIndex: newZ })
    setShowMenu(false)
  }

  const activeZIndex = parseInt(zIndex) || 100

  // Cropping geometry calculations
  const cropL = cropLeft || 0
  const cropR = cropRight || 0
  const cropT = cropTop || 0
  const cropB = cropBottom || 0

  const hasCrop = cropL > 0 || cropR > 0 || cropT > 0 || cropB > 0

  const scaleX = 1 - (cropL + cropR) / 100
  const scaleY = 1 - (cropT + cropB) / 100

  const displayContainerWidth = width
  const displayFullWidth = displayContainerWidth / scaleX
  const displayFullHeight = displayFullWidth / aspectRatio
  const displayContainerHeight = displayFullHeight * scaleY

  const leftOffset = -displayFullWidth * (cropL / 100)
  const topOffset = -displayFullHeight * (cropT / 100)

  // Overlay scaling factors for Crop Mode
  const boxWidth = 100 - cropL - cropR
  const boxHeight = 100 - cropT - cropB
  const multiplierX = 100 / boxWidth
  const multiplierY = 100 / boxHeight

  return (
    <NodeViewWrapper
      style={{
        position: 'relative',
        display: 'block',
        height: 0,
        overflow: 'visible',
        zIndex: isDragging || isResizing ? activeZIndex + 100 : activeZIndex
      }}
    >
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: isCropping ? `${displayFullWidth}px` : `${displayContainerWidth}px`,
          height: isCropping
            ? `${displayFullHeight}px`
            : hasCrop
              ? `${displayContainerHeight}px`
              : 'auto',
          border:
            isEditable && (selected || isDragging || isResizing) && !isCropping
              ? '2px solid #3b82f6'
              : '1px dashed transparent',
          cursor: isEditable
            ? isCropping
              ? 'default'
              : isDragging
                ? 'grabbing'
                : 'grab'
            : 'default',
          boxSizing: 'border-box',
          userSelect: 'none',
          zIndex: activeZIndex
        }}
        className={isEditable ? 'group hover:border-blue-300' : ''}
      >
        {isCropping ? (
          // Cropping mode layout: translucent background image + cropped high opacity overlay
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* 1. Translucent background image */}
            <img
              src={src}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none',
                opacity: 0.35,
                margin: 0
              }}
            />

            {/* 2. Visual crop box container */}
            <div
              style={{
                position: 'absolute',
                left: `${cropLeft}%`,
                top: `${cropTop}%`,
                width: `${boxWidth}%`,
                height: `${boxHeight}%`,
                border: '2px dashed #000',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Full opacity cropped preview */}
              <img
                src={src}
                alt=""
                style={{
                  position: 'absolute',
                  width: `${100 * multiplierX}%`,
                  height: `${100 * multiplierY}%`,
                  left: `${-cropLeft * multiplierX}%`,
                  top: `${-cropTop * multiplierY}%`,
                  display: 'block',
                  pointerEvents: 'none',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  margin: 0
                }}
              />
            </div>

            {/* 3. Microsoft Word style thick black Crop handles */}
            {isEditable && (
              <>
                {/* Corner brackets */}
                {/* Top-Left */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'top-left')}
                  style={{
                    position: 'absolute',
                    left: `${cropLeft}%`,
                    top: `${cropTop}%`,
                    transform: 'translate(-3px, -3px)',
                    borderLeft: '4px solid black',
                    borderTop: '4px solid black',
                    width: '16px',
                    height: '16px',
                    cursor: 'nwse-resize',
                    zIndex: 10
                  }}
                />
                {/* Top-Right */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'top-right')}
                  style={{
                    position: 'absolute',
                    right: `${cropRight}%`,
                    top: `${cropTop}%`,
                    transform: 'translate(3px, -3px)',
                    borderRight: '4px solid black',
                    borderTop: '4px solid black',
                    width: '16px',
                    height: '16px',
                    cursor: 'nesw-resize',
                    zIndex: 10
                  }}
                />
                {/* Bottom-Left */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'bottom-left')}
                  style={{
                    position: 'absolute',
                    left: `${cropLeft}%`,
                    bottom: `${cropBottom}%`,
                    transform: 'translate(-3px, 3px)',
                    borderLeft: '4px solid black',
                    borderBottom: '4px solid black',
                    width: '16px',
                    height: '16px',
                    cursor: 'nesw-resize',
                    zIndex: 10
                  }}
                />
                {/* Bottom-Right */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'bottom-right')}
                  style={{
                    position: 'absolute',
                    right: `${cropRight}%`,
                    bottom: `${cropBottom}%`,
                    transform: 'translate(3px, 3px)',
                    borderRight: '4px solid black',
                    borderBottom: '4px solid black',
                    width: '16px',
                    height: '16px',
                    cursor: 'nwse-resize',
                    zIndex: 10
                  }}
                />

                {/* Edge bars */}
                {/* Top */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'top')}
                  style={{
                    position: 'absolute',
                    left: `calc(${cropLeft}% + (${boxWidth}% - 16px) / 2)`,
                    top: `${cropTop}%`,
                    transform: 'translateY(-3px)',
                    width: '16px',
                    height: '6px',
                    backgroundColor: 'black',
                    cursor: 'ns-resize',
                    zIndex: 10
                  }}
                />
                {/* Bottom */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'bottom')}
                  style={{
                    position: 'absolute',
                    left: `calc(${cropLeft}% + (${boxWidth}% - 16px) / 2)`,
                    bottom: `${cropBottom}%`,
                    transform: 'translateY(3px)',
                    width: '16px',
                    height: '6px',
                    backgroundColor: 'black',
                    cursor: 'ns-resize',
                    zIndex: 10
                  }}
                />
                {/* Left */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'left')}
                  style={{
                    position: 'absolute',
                    left: `${cropLeft}%`,
                    top: `calc(${cropTop}% + (${boxHeight}% - 16px) / 2)`,
                    transform: 'translateX(-3px)',
                    width: '6px',
                    height: '16px',
                    backgroundColor: 'black',
                    cursor: 'ew-resize',
                    zIndex: 10
                  }}
                />
                {/* Right */}
                <div
                  onMouseDown={(e) => handleCropMouseDown(e, 'right')}
                  style={{
                    position: 'absolute',
                    right: `${cropRight}%`,
                    top: `calc(${cropTop}% + (${boxHeight}% - 16px) / 2)`,
                    transform: 'translateX(3px)',
                    width: '6px',
                    height: '16px',
                    backgroundColor: 'black',
                    cursor: 'ew-resize',
                    zIndex: 10
                  }}
                />
              </>
            )}

            {/* Crop Instructions Help Badge */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white text-[10px] px-3 py-1 rounded-full shadow-md z-50 pointer-events-none whitespace-nowrap font-medium font-sans">
              Crop Mode: Drag crop handles. Press Enter to apply.
            </div>
          </div>
        ) : (
          // Normal display mode: Masked offset cropped image layout
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: hasCrop ? 'hidden' : 'visible'
            }}
          >
            <img
              src={src}
              alt=""
              style={
                hasCrop
                  ? {
                      position: 'absolute',
                      width: `${displayFullWidth}px`,
                      height: `${displayFullHeight}px`,
                      left: `${leftOffset}px`,
                      top: `${topOffset}px`,
                      display: 'block',
                      pointerEvents: 'none',
                      maxWidth: 'none',
                      maxHeight: 'none',
                      margin: 0
                    }
                  : {
                      position: 'relative',
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      pointerEvents: 'none',
                      margin: 0
                    }
              }
            />
          </div>
        )}

        {/* Resize Handle (only shown when NOT cropping) */}
        {isEditable && (selected || isDragging || isResizing) && !isCropping && (
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

      {/* Context Menu */}
      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-10000 bg-gray-950 border border-gray-800 text-gray-200 rounded-lg shadow-2xl p-1.5 w-44 font-sans text-xs flex flex-col gap-0.5 select-none animate-in fade-in zoom-in-95 duration-100"
            style={{ left: menuPos.x, top: menuPos.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Layer Controls */}
            <button
              onClick={handleBringForward}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Bring Forward</span>
            </button>
            <button
              onClick={handleSendBackward}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400 rotate-180" />
              <span>Send Backward</span>
            </button>

            <div className="border-t border-gray-800 my-1" />

            {/* Crop Control */}
            <button
              onClick={() => {
                setIsCropping(true)
                setShowMenu(false)
              }}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <Crop className="w-3.5 h-3.5 text-teal-400" />
              <span>Crop</span>
            </button>

            <div className="border-t border-gray-800 my-1" />

            {/* Edit Actions */}
            <button
              onClick={handleCut}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <Scissors className="w-3.5 h-3.5 text-gray-400" />
              <span>Cut</span>
            </button>
            <button
              onClick={handleCopy}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
              <span>Copy</span>
            </button>
            <button
              onClick={handlePaste}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <Square className="w-3.5 h-3.5 text-gray-400" />
              <span>Paste Link/Base64</span>
            </button>

            <div className="border-t border-gray-800 my-1" />

            {/* Delete Action */}
            <button
              onClick={() => {
                deleteNode()
                setShowMenu(false)
              }}
              className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-red-950/40 hover:text-red-300 rounded cursor-pointer transition font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Delete</span>
            </button>
          </div>,
          document.body
        )}
    </NodeViewWrapper>
  )
}

export const FloatingImage = Node.create({
  name: 'floatingImage',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      src: {
        default: null
      },
      alt: {
        default: null
      },
      title: {
        default: null
      },
      left: {
        default: 50
      },
      top: {
        default: 0
      },
      width: {
        default: 200
      },
      height: {
        default: 'auto'
      },
      zIndex: {
        default: 100
      },
      cropLeft: {
        default: 0
      },
      cropRight: {
        default: 0
      },
      cropTop: {
        default: 0
      },
      cropBottom: {
        default: 0
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-floating-image]',
        getAttrs: (dom) => ({
          src: dom.getAttribute('data-src'),
          alt: dom.getAttribute('data-alt'),
          title: dom.getAttribute('data-title'),
          left: parseFloat(dom.getAttribute('data-left')) || 0,
          top: parseFloat(dom.getAttribute('data-top')) || 0,
          width: parseFloat(dom.getAttribute('data-width')) || 200,
          height: 'auto',
          zIndex: parseInt(dom.getAttribute('data-z-index')) || 100,
          cropLeft: parseFloat(dom.getAttribute('data-crop-left')) || 0,
          cropRight: parseFloat(dom.getAttribute('data-crop-right')) || 0,
          cropTop: parseFloat(dom.getAttribute('data-crop-top')) || 0,
          cropBottom: parseFloat(dom.getAttribute('data-crop-bottom')) || 0
        })
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const cropLeft = HTMLAttributes.cropLeft || 0
    const cropRight = HTMLAttributes.cropRight || 0
    const cropTop = HTMLAttributes.cropTop || 0
    const cropBottom = HTMLAttributes.cropBottom || 0

    const scaleX = 1 - (cropLeft + cropRight) / 100
    const scaleY = 1 - (cropTop + cropBottom) / 100

    const displayContainerWidth = HTMLAttributes.width || 200
    // Calculate display full width based on cropped container width
    const displayFullWidth = displayContainerWidth / scaleX

    // In read-only mode, we offset the underlying image inside the visible cropped container bounds
    const leftOffset = -displayFullWidth * (cropLeft / 100)

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-floating-image': 'true',
        'data-src': HTMLAttributes.src,
        'data-alt': HTMLAttributes.alt,
        'data-title': HTMLAttributes.title,
        'data-left': HTMLAttributes.left,
        'data-top': HTMLAttributes.top,
        'data-width': HTMLAttributes.width,
        'data-height': 'auto',
        'data-z-index': HTMLAttributes.zIndex,
        'data-crop-left': cropLeft,
        'data-crop-right': cropRight,
        'data-crop-top': cropTop,
        'data-crop-bottom': cropBottom,
        style: `position: relative; display: block; margin: 0; padding: 0; height: 0; overflow: visible; z-index: ${HTMLAttributes.zIndex || 100};`
      }),
      [
        'div',
        {
          style: `position: absolute; left: ${HTMLAttributes.left}px; top: ${HTMLAttributes.top}px; width: ${HTMLAttributes.width}px; overflow: hidden; pointer-events: auto; z-index: ${HTMLAttributes.zIndex || 100};`
        },
        [
          'div',
          {
            style: 'position: relative; width: 100%; height: auto; overflow: hidden;'
          },
          [
            'img',
            {
              src: HTMLAttributes.src,
              alt: HTMLAttributes.alt,
              title: HTMLAttributes.title,
              style: `width: ${100 / scaleX}%; height: auto; margin-left: ${-100 * (cropLeft / scaleX)}%; margin-top: 0; margin-bottom: 0; margin-right: 0; display: block; clip-path: inset(${cropTop}% ${cropRight}% ${cropBottom}% ${cropLeft}%);`
            }
          ]
        ]
      ]
    ]
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options
          })
        }
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingImageComponent)
  }
})

export default FloatingImage
