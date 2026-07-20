import React, { useState, useRef, useCallback } from 'react';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Undo2, Redo2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Underline as UnderlineIcon, Palette, Highlighter, ChevronDown,
  Copy, Scissors, ClipboardPaste, Search, ChevronRight, ChevronLeft,
  AlignVerticalJustifyStart, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
} from 'lucide-react';
import { RBtn, RGroup, DropdownWrapper, ColorGrid } from './DropdownWrapper';
import { FONT_FAMILIES, FONT_SIZES, TEXT_COLORS, HIGHLIGHT_COLORS, LINE_SPACINGS, HEADING_OPTIONS } from '../constants';
import { changeIndent } from '../utils/editorHelpers';

export default function RibbonHome({ editor, lineSpacing, setLineSpacing, onOpenFindReplace }) {
  // Dropdown states
  const [showFontDD, setShowFontDD] = useState(false);
  const [showSizeDD, setShowSizeDD] = useState(false);
  const [showColorDD, setShowColorDD] = useState(false);
  const [showHighlightDD, setShowHighlightDD] = useState(false);
  const [showSpacingDD, setShowSpacingDD] = useState(false);
  const [showHeadingDD, setShowHeadingDD] = useState(false);

  // Refs for dropdown anchors
  const fontRef = useRef(null);
  const sizeRef = useRef(null);
  const colorRef = useRef(null);
  const highlightRef = useRef(null);
  const spacingRef = useRef(null);
  const headingRef = useRef(null);

  const currentFont = editor?.getAttributes('textStyle').fontFamily?.split(',')[0]?.replace(/"/g, '') || 'Calibri';
  const currentSize = editor?.getAttributes('textStyle').fontSize?.replace('px', '').replace('pt', '') || '11';
  const currentHeading = editor?.isActive('heading', { level: 1 }) ? 'Heading 1'
    : editor?.isActive('heading', { level: 2 }) ? 'Heading 2'
    : editor?.isActive('heading', { level: 3 }) ? 'Heading 3'
    : editor?.isActive('heading', { level: 4 }) ? 'Heading 4'
    : 'Normal Text';

  return (
    <div className="flex items-end gap-0 overflow-visible flex-nowrap">

      {/* ── Clipboard ── */}
      <RGroup label="Clipboard">
        <RBtn title="Cut (Ctrl+X)" onClick={() => document.execCommand('cut')}>
          <Scissors className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Copy (Ctrl+C)" onClick={() => document.execCommand('copy')}>
          <Copy className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Paste (Ctrl+V)" onClick={async () => {
          try {
            const t = await navigator.clipboard.readText();
            editor?.chain().focus().insertContent(t).run();
          } catch { document.execCommand('paste'); }
        }}>
          <ClipboardPaste className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Undo/Redo ── */}
      <RGroup label="Undo">
        <RBtn title="Undo (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
          <Undo2 className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Redo (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
          <Redo2 className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Font Family ── */}
      <RGroup label="Font">
        <div className="relative" ref={fontRef}>
          <button
            onClick={() => setShowFontDD(!showFontDD)}
            className="flex items-center bg-white border border-gray-300 rounded px-2 py-0.5 text-[10px] w-28 h-7 text-gray-700 hover:border-blue-400 cursor-pointer transition"
          >
            <span className="truncate flex-1" style={{ fontFamily: editor?.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif' }}>
              {currentFont}
            </span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
          </button>
          <DropdownWrapper open={showFontDD} onClose={() => setShowFontDD(false)} triggerRef={fontRef} width={180}>
            <div className="py-1 max-h-56 overflow-y-auto w-44">
              {FONT_FAMILIES.map(f => (
                <button
                  key={f.label}
                  onClick={() => { editor?.chain().focus().setFontFamily(f.value).run(); setShowFontDD(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 cursor-pointer transition"
                  style={{ fontFamily: f.value }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>

        {/* Font Size */}
        <div className="relative ml-1" ref={sizeRef}>
          <button
            onClick={() => setShowSizeDD(!showSizeDD)}
            className="flex items-center bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] w-14 h-7 text-gray-700 hover:border-blue-400 cursor-pointer transition"
          >
            <span className="flex-1 text-center">{currentSize}</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
          </button>
          <DropdownWrapper open={showSizeDD} onClose={() => setShowSizeDD(false)} triggerRef={sizeRef} width={70}>
            <div className="py-1 max-h-56 overflow-y-auto w-[70px]">
              {FONT_SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    editor?.chain().focus().setMark('textStyle', { fontSize: `${s}pt` }).run();
                    setShowSizeDD(false);
                  }}
                  className={`w-full text-left px-2 py-1 text-xs hover:bg-blue-50 cursor-pointer transition
                    ${currentSize === s ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>
      </RGroup>

      {/* ── Text Formatting ── */}
      <RGroup label="Format">
        <RBtn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('strike')} onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('superscript')} onClick={() => editor?.chain().focus().toggleSuperscript().run()} title="Superscript">
          <SuperscriptIcon className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('subscript')} onClick={() => editor?.chain().focus().toggleSubscript().run()} title="Subscript">
          <SubscriptIcon className="w-3.5 h-3.5" />
        </RBtn>

        {/* Text Color */}
        <div className="relative" ref={colorRef}>
          <button
            onClick={() => setShowColorDD(!showColorDD)}
            title="Text Color"
            className="flex flex-col items-center p-1 rounded hover:bg-gray-100 cursor-pointer transition border border-transparent hover:border-gray-200"
          >
            <Palette className="w-3.5 h-3.5 text-gray-700" />
            <div className="w-3.5 h-1 rounded-sm mt-0.5" style={{ backgroundColor: editor?.getAttributes('textStyle').color || '#000' }} />
          </button>
          <DropdownWrapper open={showColorDD} onClose={() => setShowColorDD(false)} triggerRef={colorRef} width={200}>
            <ColorGrid
              colors={TEXT_COLORS}
              label="Text Color"
              onSelect={c => { editor?.chain().focus().setColor(c).run(); setShowColorDD(false); }}
              onClear={() => { editor?.chain().focus().unsetColor().run(); setShowColorDD(false); }}
              clearLabel="Remove Color"
            />
          </DropdownWrapper>
        </div>

        {/* Highlight */}
        <div className="relative" ref={highlightRef}>
          <button
            onClick={() => setShowHighlightDD(!showHighlightDD)}
            title="Highlight"
            className="p-1 rounded hover:bg-gray-100 cursor-pointer transition border border-transparent hover:border-gray-200"
          >
            <Highlighter className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <DropdownWrapper open={showHighlightDD} onClose={() => setShowHighlightDD(false)} triggerRef={highlightRef} width={180}>
            <ColorGrid
              colors={HIGHLIGHT_COLORS}
              label="Highlight Color"
              onSelect={c => { editor?.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlightDD(false); }}
              onClear={() => { editor?.chain().focus().unsetHighlight().run(); setShowHighlightDD(false); }}
              clearLabel="Remove Highlight"
            />
          </DropdownWrapper>
        </div>

        {/* Clear Formatting */}
        <RBtn title="Clear All Formatting" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
          <span className="text-[10px] font-bold">A↺</span>
        </RBtn>
      </RGroup>

      {/* ── Heading Styles ── */}
      <RGroup label="Styles">
        <div className="relative" ref={headingRef}>
          <button
            onClick={() => setShowHeadingDD(!showHeadingDD)}
            className="flex items-center bg-white border border-gray-300 rounded px-2 py-0.5 text-[10px] h-7 text-gray-700 hover:border-blue-400 cursor-pointer gap-1 transition min-w-[80px]"
          >
            <span className="truncate">{currentHeading}</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400 shrink-0" />
          </button>
          <DropdownWrapper open={showHeadingDD} onClose={() => setShowHeadingDD(false)} triggerRef={headingRef} width={160}>
            <div className="py-1 w-40">
              {HEADING_OPTIONS.map(h => (
                <button
                  key={h.label}
                  onClick={() => {
                    if (h.level === 0) editor?.chain().focus().setParagraph().run();
                    else editor?.chain().focus().toggleHeading({ level: h.level }).run();
                    setShowHeadingDD(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 cursor-pointer transition
                    ${h.level === 0 ? '' : `font-bold`}`}
                  style={{ fontSize: h.level === 0 ? 12 : Math.max(11, 18 - h.level * 2) }}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>
      </RGroup>

      {/* ── Alignment ── */}
      <RGroup label="Paragraph">
        <RBtn active={editor?.isActive({ textAlign: 'left' })} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive({ textAlign: 'center' })} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive({ textAlign: 'right' })} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive({ textAlign: 'justify' })} onClick={() => editor?.chain().focus().setTextAlign('justify').run()} title="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Spacing & Indent ── */}
      <RGroup label="Spacing">
        <div className="relative" ref={spacingRef}>
          <button
            onClick={() => setShowSpacingDD(!showSpacingDD)}
            title="Line Spacing"
            className="flex items-center bg-white border border-gray-300 rounded px-1.5 py-0.5 text-[10px] h-7 text-gray-700 hover:border-blue-400 cursor-pointer gap-0.5 transition"
          >
            <AlignVerticalJustifyStart className="w-3 h-3" />
            <span>{lineSpacing}</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
          </button>
          <DropdownWrapper open={showSpacingDD} onClose={() => setShowSpacingDD(false)} triggerRef={spacingRef} width={150}>
            <div className="py-1 w-36">
              {LINE_SPACINGS.map(ls => (
                <button
                  key={ls.value}
                  onClick={() => { setLineSpacing(ls.value); setShowSpacingDD(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 transition
                    ${lineSpacing === ls.value ? 'bg-blue-50 text-blue-700 font-bold' : ''}`}
                >
                  {ls.label}
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>
        <RBtn title="Increase Indent" onClick={() => changeIndent(editor, 'increase')}>
          <ChevronRight className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Decrease Indent" onClick={() => changeIndent(editor, 'decrease')}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Lists ── */}
      <RGroup label="Lists">
        <RBtn active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn active={editor?.isActive('taskList')} onClick={() => editor?.chain().focus().toggleTaskList().run()} title="Checklist">
          <span className="text-[11px] font-bold">☑</span>
        </RBtn>
        <RBtn active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <span className="text-[11px] font-bold">"</span>
        </RBtn>
      </RGroup>

      {/* ── Find ── */}
      <RGroup label="Editing">
        <RBtn title="Find & Replace (Ctrl+H)" onClick={onOpenFindReplace}>
          <Search className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>
    </div>
  );
}
