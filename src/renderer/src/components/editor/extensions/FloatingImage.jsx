import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2, Scissors, Copy, Layers, Crop, Square, Check
} from 'lucide-react';

const FloatingImageComponent = ({ node, updateAttributes, selected, editor, deleteNode }) => {
  const { src, left, top, width, zIndex, clipPath } = node.attrs;
  const containerRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, left: 0, top: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0 });

  // Context Menu State
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showCropMenu, setShowCropMenu] = useState(false);
  const menuRef = useRef(null);

  const isEditable = editor?.isEditable;

  const handleMouseDown = (e) => {
    if (!isEditable) return;
    if (e.target.classList.contains('resize-handle')) return;
    
    setIsMouseDown(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      left: left,
      top: top,
    });
  };

  const handleResizeMouseDown = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: width,
    });
  };

  const handleContextMenu = (e) => {
    if (!isEditable) return;
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(true);
    setShowCropMenu(false);
    setMenuPos({
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Mouse drag & resize calculations
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isMouseDown && !isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          setIsDragging(true);
        }
      }

      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        const parentEl = containerRef.current?.parentElement?.parentElement;
        const editorDom = parentEl?.closest('.ProseMirror');
        let printableWidth = 600;
        if (editorDom) {
          const style = window.getComputedStyle(editorDom);
          const padLeft = parseFloat(style.paddingLeft) || 0;
          const padRight = parseFloat(style.paddingRight) || 0;
          printableWidth = editorDom.clientWidth - (padLeft + padRight);
        }

        const newLeft = Math.max(0, Math.min(printableWidth - width, dragStart.left + dx));
        updateAttributes({
          left: newLeft,
          top: dragStart.top + dy,
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.x;
        const newWidth = Math.max(50, resizeStart.width + dx);
        updateAttributes({
          width: newWidth,
          height: 'auto',
        });
      }
    };

    const handleMouseUp = () => {
      setIsMouseDown(false);
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isMouseDown || isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMouseDown, isDragging, isResizing, dragStart, resizeStart, width]);

  // Context Menu Actions
  const handleCut = () => {
    navigator.clipboard.writeText(src);
    deleteNode();
    setShowMenu(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(src);
    setShowMenu(false);
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then(text => {
      if (text && (text.startsWith('data:image') || text.startsWith('http'))) {
        editor.chain().focus().insertContent({
          type: 'floatingImage',
          attrs: { src: text, left: left + 20, top: top + 20 }
        }).run();
      } else {
        alert("Clipboard does not contain a valid image source (base64 or URL).");
      }
    }).catch(err => {
      console.warn("Clipboard read failed:", err);
    });
    setShowMenu(false);
  };

  const handleBringForward = () => {
    const curZ = parseInt(zIndex) || 100;
    updateAttributes({ zIndex: curZ + 10 });
    setShowMenu(false);
  };

  const handleSendBackward = () => {
    const curZ = parseInt(zIndex) || 100;
    updateAttributes({ zIndex: Math.max(10, curZ - 10) });
    setShowMenu(false);
  };

  const handleCrop = (shape) => {
    updateAttributes({ clipPath: shape });
    setShowMenu(false);
  };

  const activeZIndex = parseInt(zIndex) || 100;

  return (
    <NodeViewWrapper style={{ position: 'relative', display: 'block', height: 0, overflow: 'visible', zIndex: selected && isEditable ? 150 : activeZIndex }}>
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute',
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: 'auto',
          border: isEditable && (selected || isDragging || isResizing) ? '2px solid #3b82f6' : '1px dashed transparent',
          cursor: isEditable ? (isDragging ? 'grabbing' : 'grab') : 'default',
          boxSizing: 'border-box',
          userSelect: 'none',
        }}
        className={isEditable ? "group hover:border-blue-300" : ""}
      >
        <img
          src={src}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            pointerEvents: 'none',
            clipPath: clipPath || 'none',
            transition: 'clip-path 0.2s ease-in-out',
          }}
        />
        
        {/* Selection/Resize Handles */}
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
              zIndex: 10,
            }}
          />
        )}
      </div>

      {/* Viewport Rendered Portal Context Menu */}
      {showMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed z-10000 bg-gray-950 border border-gray-800 text-gray-200 rounded-lg shadow-2xl p-1.5 w-44 font-sans text-xs flex flex-col gap-0.5 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{ left: menuPos.x, top: menuPos.y }}
          onMouseDown={e => e.stopPropagation()}
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

          {/* Crop controls */}
          <div className="relative">
            <button
              onClick={() => setShowCropMenu(!showCropMenu)}
              className="w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-white/10 hover:text-white rounded cursor-pointer transition font-medium"
            >
              <div className="flex items-center gap-2">
                <Crop className="w-3.5 h-3.5 text-teal-400" />
                <span>Crop Shape</span>
              </div>
              <span className="text-[10px] text-gray-500">▶</span>
            </button>
            
            {showCropMenu && (
              <div className="absolute left-full top-0 ml-1 bg-gray-950 border border-gray-800 rounded-lg shadow-2xl p-1 w-36 flex flex-col gap-0.5 z-[10001]">
                <button
                  onClick={() => handleCrop('none')}
                  className="w-full text-left px-2 py-1 hover:bg-white/10 hover:text-white rounded cursor-pointer flex items-center justify-between"
                >
                  <span>Rectangle (Reset)</span>
                  {(!clipPath || clipPath === 'none') && <Check className="w-3 h-3 text-green-500" />}
                </button>
                <button
                  onClick={() => handleCrop('inset(0% rounded 16px)')}
                  className="w-full text-left px-2 py-1 hover:bg-white/10 hover:text-white rounded cursor-pointer flex items-center justify-between"
                >
                  <span>Rounded Rect</span>
                  {clipPath?.includes('rounded') && <Check className="w-3 h-3 text-green-500" />}
                </button>
                <button
                  onClick={() => handleCrop('circle(50%)')}
                  className="w-full text-left px-2 py-1 hover:bg-white/10 hover:text-white rounded cursor-pointer flex items-center justify-between"
                >
                  <span>Circle/Oval</span>
                  {clipPath?.includes('circle') && <Check className="w-3 h-3 text-green-500" />}
                </button>
              </div>
            )}
          </div>

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
            onClick={() => { deleteNode(); setShowMenu(false); }}
            className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 hover:bg-red-950/40 hover:text-red-300 rounded cursor-pointer transition font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
            <span>Delete</span>
          </button>
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
};

export const FloatingImage = Node.create({
  name: 'floatingImage',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  
  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      left: {
        default: 50,
      },
      top: {
        default: 0,
      },
      width: {
        default: 200,
      },
      height: {
        default: 'auto',
      },
      zIndex: {
        default: 100,
      },
      clipPath: {
        default: 'none',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-floating-image]',
        getAttrs: dom => ({
          src: dom.getAttribute('data-src'),
          alt: dom.getAttribute('data-alt'),
          title: dom.getAttribute('data-title'),
          left: parseFloat(dom.getAttribute('data-left')) || 0,
          top: parseFloat(dom.getAttribute('data-top')) || 0,
          width: parseFloat(dom.getAttribute('data-width')) || 200,
          height: 'auto',
          zIndex: parseInt(dom.getAttribute('data-z-index')) || 100,
          clipPath: dom.getAttribute('data-clip-path') || 'none',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
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
        'data-clip-path': HTMLAttributes.clipPath,
        style: `position: relative; display: block; margin: 0; padding: 0; height: 0; overflow: visible; z-index: ${HTMLAttributes.zIndex || 100};`,
      }),
      [
        'div',
        {
          style: `position: absolute; left: ${HTMLAttributes.left}px; top: ${HTMLAttributes.top}px; width: ${HTMLAttributes.width}px; height: auto; pointer-events: auto; z-index: ${HTMLAttributes.zIndex || 100};`,
        },
        ['img', {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt,
          title: HTMLAttributes.title,
          style: `width: 100%; height: auto; display: block; clip-path: ${HTMLAttributes.clipPath || 'none'};`
        }]
      ]
    ];
  },

  addCommands() {
    return {
      setImage: options => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(FloatingImageComponent);
  },
});

export default FloatingImage;
