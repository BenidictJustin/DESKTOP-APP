import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Link as LinkIcon, Highlighter, Palette, ChevronDown,
} from 'lucide-react';
import { FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS } from '../constants';
import { handleLink } from '../utils/editorHelpers';

/**
 * FloatingToolbar — Appears above selected text, similar to Google Docs.
 * Shows quick formatting options when text is selected.
 */
export default function FloatingToolbar({ editor }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSizePicker, setShowSizePicker] = useState(false);
  const toolbarRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!editor) return;
    const { state } = editor;
    const { from, to } = state.selection;

    if (from === to || !editor.isFocused) {
      setVisible(false);
      return;
    }

    const { view } = editor;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    const left = (start.left + end.left) / 2;
    const top = start.top - 48;

    setPos({
      top: Math.max(8, top),
      left: Math.max(8, Math.min(left, window.innerWidth - 350)),
    });
    setVisible(true);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', () => {
      // Delay hiding so button clicks register
      setTimeout(() => {
        if (!editor.isFocused) setVisible(false);
      }, 200);
    });
    return () => {
      editor.off('selectionUpdate', updatePosition);
    };
  }, [editor, updatePosition]);

  if (!visible || !editor) return null;

  const Btn = ({ active, onClick, title, children }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1 rounded transition cursor-pointer ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-white/80 text-gray-700'}`}
    >
      {children}
    </button>
  );

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-10000 flex items-center gap-0.5 bg-gray-800/95 backdrop-blur-md rounded-lg shadow-2xl px-1.5 py-1 border border-gray-600"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={e => e.preventDefault()}
    >
      {/* Font size quick select */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowSizePicker(!showSizePicker); setShowColorPicker(false); setShowHighlightPicker(false); }}
          className="text-[10px] text-gray-300 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 cursor-pointer flex items-center gap-0.5"
        >
          {editor?.getAttributes('textStyle').fontSize?.replace('px', '') || '11'}
          <ChevronDown className="w-2 h-2" />
        </button>
        {showSizePicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 py-1 max-h-40 overflow-y-auto w-14">
            {FONT_SIZES.map(s => (
              <button
                key={s}
                onMouseDown={e => {
                  e.preventDefault();
                  editor?.chain().focus().setMark('textStyle', { fontSize: `${s}px` }).run();
                  setShowSizePicker(false);
                }}
                className="w-full text-left px-2 py-0.5 text-[10px] text-gray-300 hover:bg-white/10 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      <Btn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold">
        <Bold className="w-3 h-3" />
      </Btn>
      <Btn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic">
        <Italic className="w-3 h-3" />
      </Btn>
      <Btn active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline">
        <UnderlineIcon className="w-3 h-3" />
      </Btn>
      <Btn active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough">
        <Strikethrough className="w-3 h-3" />
      </Btn>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      {/* Text Color */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowColorPicker(!showColorPicker); setShowHighlightPicker(false); setShowSizePicker(false); }}
          className="p-1 rounded hover:bg-white/10 cursor-pointer"
          title="Text Color"
        >
          <Palette className="w-3 h-3 text-gray-300" />
        </button>
        {showColorPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 p-2 w-44">
            <div className="grid grid-cols-8 gap-1">
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  onMouseDown={e => {
                    e.preventDefault();
                    editor?.chain().focus().setColor(c).run();
                    setShowColorPicker(false);
                  }}
                  className="w-4 h-4 rounded border border-gray-500 hover:scale-125 transition cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Highlight */}
      <div className="relative">
        <button
          onMouseDown={e => { e.preventDefault(); setShowHighlightPicker(!showHighlightPicker); setShowColorPicker(false); setShowSizePicker(false); }}
          className="p-1 rounded hover:bg-white/10 cursor-pointer"
          title="Highlight"
        >
          <Highlighter className="w-3 h-3 text-gray-300" />
        </button>
        {showHighlightPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-gray-800 rounded-lg shadow-2xl border border-gray-600 p-2 w-36">
            <div className="grid grid-cols-5 gap-1">
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c}
                  onMouseDown={e => {
                    e.preventDefault();
                    editor?.chain().focus().toggleHighlight({ color: c }).run();
                    setShowHighlightPicker(false);
                  }}
                  className="w-5 h-5 rounded border border-gray-500 hover:scale-125 transition cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      <Btn active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Left">
        <AlignLeft className="w-3 h-3" />
      </Btn>
      <Btn active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Center">
        <AlignCenter className="w-3 h-3" />
      </Btn>
      <Btn active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Right">
        <AlignRight className="w-3 h-3" />
      </Btn>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      <Btn active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullets">
        <List className="w-3 h-3" />
      </Btn>
      <Btn active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbering">
        <ListOrdered className="w-3 h-3" />
      </Btn>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      <Btn onClick={() => handleLink(editor)} title="Link">
        <LinkIcon className="w-3 h-3" />
      </Btn>
    </div>,
    document.body
  );
}
