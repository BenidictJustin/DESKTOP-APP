import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon, Table as TableIcon, Link as LinkIcon,
  MessageSquare, Clock, Minus, Smile, Sparkles, Eye, AlignVerticalJustifyStart,
} from 'lucide-react';
import { RBtn, RGroup, DropdownWrapper, TableGridPicker } from './DropdownWrapper';
import { SHAPES, ICONS, EMOJI_LIST, SYMBOL_LIST, EQUATIONS } from '../constants';
import {
  insertShape, insertIcon, insertDateTime, insertChart, insertSmartArt,
  insertTextBox, handleLink, handleInsertImage, insertPageNumber, insertEquation,
  insertVideo,
} from '../utils/editorHelpers';

export default function RibbonInsert({
  editor,
  imageInputRef,
  showHeader, setShowHeader,
  showFooter, setShowFooter,
  onOpenComments,
}) {
  const [showTableDD, setShowTableDD] = useState(false);
  const [showShapeDD, setShowShapeDD] = useState(false);
  const [showIconDD, setShowIconDD] = useState(false);
  const [showEmojiDD, setShowEmojiDD] = useState(false);
  const [showEquationDD, setShowEquationDD] = useState(false);
  const [tableHover, setTableHover] = useState({ r: 0, c: 0 });

  const tableRef = useRef(null);
  const shapeRef = useRef(null);
  const iconRef = useRef(null);
  const emojiRef = useRef(null);
  const equationRef = useRef(null);

  return (
    <div className="flex items-end gap-0 overflow-visible flex-nowrap">

      {/* ── Tables ── */}
      <RGroup label="Tables">
        <div className="relative" ref={tableRef}>
          <RBtn title="Insert Table" onClick={() => setShowTableDD(!showTableDD)}>
            <TableIcon className="w-3.5 h-3.5" />
          </RBtn>
          <DropdownWrapper open={showTableDD} onClose={() => setShowTableDD(false)} triggerRef={tableRef} width={220}>
            <TableGridPicker
              editor={editor}
              tableHover={tableHover}
              setTableHover={setTableHover}
              onSelect={(r, c) => {
                editor?.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
                setShowTableDD(false);
                setTableHover({ r: 0, c: 0 });
              }}
            />
          </DropdownWrapper>
        </div>
      </RGroup>

      {/* ── Pictures ── */}
      <RGroup label="Pictures">
        <RBtn title="Insert Image" onClick={() => imageInputRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5" />
        </RBtn>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleInsertImage(editor, e)}
          className="hidden"
        />
      </RGroup>

      {/* ── Illustrations ── */}
      <RGroup label="Illustrations">
        {/* Shapes */}
        <div className="relative" ref={shapeRef}>
          <RBtn title="Shapes" onClick={() => setShowShapeDD(!showShapeDD)}>
            <span className="text-[10px] font-bold">▲●</span>
          </RBtn>
          <DropdownWrapper open={showShapeDD} onClose={() => setShowShapeDD(false)} triggerRef={shapeRef} width={160}>
            <div className="p-2 w-40">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Shapes</p>
              {SHAPES.map(s => (
                <button
                  key={s.val}
                  onClick={() => { insertShape(editor, s.html); setShowShapeDD(false); }}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded cursor-pointer transition"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>

        {/* Icons */}
        <div className="relative" ref={iconRef}>
          <RBtn title="Icons" onClick={() => setShowIconDD(!showIconDD)}>
            <Sparkles className="w-3.5 h-3.5" />
          </RBtn>
          <DropdownWrapper open={showIconDD} onClose={() => setShowIconDD(false)} triggerRef={iconRef} width={160}>
            <div className="p-2 w-40">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Icons</p>
              {ICONS.map(i => (
                <button
                  key={i.val}
                  onClick={() => { insertIcon(editor, i.char); setShowIconDD(false); }}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded cursor-pointer transition"
                >
                  {i.label}
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>

        {/* SmartArt */}
        <RBtn title="SmartArt Diagram" onClick={() => insertSmartArt(editor)}>
          <span className="text-[10px] font-bold">Art</span>
        </RBtn>

        {/* Charts */}
        <RBtn title="Insert Data Chart" onClick={() => insertChart(editor)}>
          <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Media ── */}
      <RGroup label="Media">
        <RBtn title="Online Video" onClick={() => insertVideo(editor)}>
          <Eye className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Text Box" onClick={() => insertTextBox(editor)}>
          <span className="text-[10px] font-bold">T□</span>
        </RBtn>
      </RGroup>

      {/* ── Links ── */}
      <RGroup label="Links">
        <RBtn title="Hyperlink (Ctrl+K)" onClick={() => handleLink(editor)}>
          <LinkIcon className="w-3.5 h-3.5" />
        </RBtn>
        <RBtn title="Add Comment" onClick={onOpenComments}>
          <MessageSquare className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Header & Footer ── */}
      <RGroup label="Header & Footer">
        <RBtn active={showHeader} title="Toggle Header" onClick={() => setShowHeader(!showHeader)}>
          <span className="text-[10px] font-bold">H↑</span>
        </RBtn>
        <RBtn active={showFooter} title="Toggle Footer" onClick={() => setShowFooter(!showFooter)}>
          <span className="text-[10px] font-bold">F↓</span>
        </RBtn>
        <RBtn title="Page Number" onClick={() => insertPageNumber(editor)}>
          <span className="text-[10px] font-bold">#</span>
        </RBtn>
        <RBtn title="Insert Page Break" onClick={() => editor?.chain().focus().insertContent({ type: 'pageBreak' }).insertContent('<p></p>').run()}>
          <Minus className="w-3.5 h-3.5" />
        </RBtn>
      </RGroup>

      {/* ── Text & Symbols ── */}
      <RGroup label="Symbols">
        <RBtn title="Date & Time" onClick={() => insertDateTime(editor)}>
          <Clock className="w-3.5 h-3.5" />
        </RBtn>

        {/* Equations */}
        <div className="relative" ref={equationRef}>
          <RBtn title="Equations" onClick={() => setShowEquationDD(!showEquationDD)}>
            <span className="text-[10px] font-bold italic">∑π</span>
          </RBtn>
          <DropdownWrapper open={showEquationDD} onClose={() => setShowEquationDD(false)} triggerRef={equationRef} width={160}>
            <div className="p-2 w-40 max-h-52 overflow-y-auto">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Equations</p>
              {EQUATIONS.map(eq => (
                <button
                  key={eq.val}
                  onClick={() => { insertEquation(editor, eq.val); setShowEquationDD(false); }}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded cursor-pointer transition font-mono"
                >
                  {eq.label}: <span className="text-blue-600">{eq.val}</span>
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>

        {/* Symbols & Emoji */}
        <div className="relative" ref={emojiRef}>
          <RBtn title="Symbols & Emoji" onClick={() => setShowEmojiDD(!showEmojiDD)}>
            <Smile className="w-3.5 h-3.5" />
          </RBtn>
          <DropdownWrapper open={showEmojiDD} onClose={() => setShowEmojiDD(false)} triggerRef={emojiRef} width={220}>
            <div className="p-2.5 w-52">
              <p className="text-[9px] text-gray-400 font-bold uppercase mb-1.5">Emoji</p>
              <div className="grid grid-cols-5 gap-1">
                {EMOJI_LIST.map(e => (
                  <button
                    key={e}
                    onClick={() => { editor?.chain().focus().insertContent(e).run(); setShowEmojiDD(false); }}
                    className="text-lg hover:bg-blue-50 rounded p-0.5 cursor-pointer transition"
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-[9px] text-gray-400 mb-1 font-bold uppercase">Symbols</p>
                <div className="flex flex-wrap gap-1">
                  {SYMBOL_LIST.map(s => (
                    <button
                      key={s}
                      onClick={() => { editor?.chain().focus().insertContent(s).run(); setShowEmojiDD(false); }}
                      className="text-sm hover:bg-blue-50 rounded p-0.5 cursor-pointer font-mono transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DropdownWrapper>
        </div>
      </RGroup>
    </div>
  );
}


