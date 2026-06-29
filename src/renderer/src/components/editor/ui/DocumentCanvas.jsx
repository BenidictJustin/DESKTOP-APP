import React from 'react';
import { EditorContent } from '@tiptap/react';
import { Check } from 'lucide-react';
import { PAPER, MARGINS } from '../constants';

/**
 * DocumentCanvas — Renders dynamic Microsoft Word-style page sheets.
 * Positioned on top of static page cards to allow continuous pagination editing.
 */
export default function DocumentCanvas({
  editor,
  canvasRef,
  paperKey, orientation, marginKey,
  zoom,
  lineSpacing, columns,
  showRuler, showGridlines, showLineNumbers,
  showHeader, headerText, setHeaderText,
  showFooter, footerText, setFooterText,
  workspaceIsReadOnly,
  trackChanges,
  totalPages = 1,
}) {
  const paper = PAPER[paperKey] || PAPER.Letter;
  const docW = orientation === 'landscape' ? paper.h : paper.w;
  const docH = orientation === 'landscape' ? paper.w : paper.h;
  const pad = MARGINS[marginKey] || 96;
  const gapH = 36; // Constant page gap height (matching visual page breaks)

  // Strictly bound layout height by physical pages count
  const canvasHeight = docH * totalPages + gapH * (totalPages - 1);
  const totalHeight = canvasHeight + (showRuler ? 20 : 0);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-300 py-6 px-4 flex flex-col items-center select-text">
      {/* Scaled container for zooming */}
      <div style={{
        width: docW * (zoom / 100),
        minHeight: totalHeight * (zoom / 100),
        overflow: 'visible',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translate(-50%, 0) scale(${zoom / 100})`,
          transformOrigin: 'top center',
          width: docW,
          outline: 'none',
        }}>
          {/* ── Horizontal Ruler ── */}
          {showRuler && (
            <div
              className="bg-linear-to-b from-gray-50 to-gray-100 border border-gray-300 h-5 flex items-center relative select-none shrink-0"
              style={{ width: docW, marginBottom: '2px' }}
            >
              <div className="absolute left-0 h-full bg-gray-200/80 border-r border-gray-300" style={{ width: pad }} />
              <div className="absolute right-0 h-full bg-gray-200/80 border-l border-gray-300" style={{ width: pad }} />
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="absolute flex flex-col items-center" style={{ left: pad + i * ((docW - 2 * pad) / 7) }}>
                  <div className="h-2 w-px bg-gray-400" />
                  <span className="text-[7px] text-gray-500">{i === 0 ? '' : `${i}"`}</span>
                </div>
              ))}
            </div>
          )}

          {/* Wrapper housing the background page sheets and the editor content */}
          <div style={{ width: docW, height: canvasHeight, position: 'relative' }}>
            
            {/* ── Page Background Sheets (Physical Paper Shadow Cards) ── */}
            <div className="absolute inset-0 pointer-events-none select-none flex flex-col items-center">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white shadow-xl border border-gray-300/70 rounded-xs shrink-0"
                  style={{
                    width: docW,
                    height: docH,
                    marginBottom: gapH,
                  }}
                />
              ))}
            </div>

            {/* ── Transparent Editor Canvas overlaying sheets ── */}
            <div
              ref={canvasRef}
              onClick={(e) => {
                const target = e.target;
                if (target === canvasRef.current || target.classList.contains('doc-page') ||
                    (!target.closest('.ProseMirror') && target.closest('.doc-page-container'))) {
                  editor?.commands.focus('end');
                }
              }}
              className={`relative doc-page-container ${showGridlines ? 'bg-grid' : ''}`}
              style={{
                width: docW,
                minHeight: canvasHeight,
                paddingTop: pad,
                paddingBottom: pad,
                paddingLeft: pad,
                paddingRight: pad,
                cursor: 'text',
                background: 'transparent',
                boxSizing: 'border-box',
              }}
            >
              {workspaceIsReadOnly && (
                <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-bold text-[9px] uppercase tracking-wide z-10 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />Approved
                </div>
              )}

              {/* ── Page 1 Header ── */}
              {showHeader && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: '16px',
                    paddingLeft: pad,
                    paddingRight: pad,
                    fontSize: '10px',
                    color: '#9ca3af',
                    fontFamily: 'sans-serif',
                    borderBottom: '1px dashed #e5e7eb',
                    paddingBottom: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>{headerText}</span>
                </div>
              )}

              {/* ── Page 1 Footer ── */}
              {showFooter && (
                <div
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{
                    top: (docH - 36) + 'px',
                    paddingLeft: pad,
                    paddingRight: pad,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#9ca3af',
                    fontFamily: 'sans-serif',
                    borderTop: '1px dashed #e5e7eb',
                    paddingTop: '6px',
                    boxSizing: 'border-box',
                  }}
                >
                  <span>{footerText}</span>
                  <span>Page 1</span>
                </div>
              )}

              {/* Document styles */}
              <style>{`
                .doc-page .ProseMirror {
                  min-height: ${docH - pad * 2}px;
                  outline: none;
                  font-size: 13px;
                  line-height: ${lineSpacing};
                  color: #1f2937;
                  font-family: 'Calibri', sans-serif;
                  column-count: ${columns};
                  column-gap: 32px;
                }
                .doc-page .ProseMirror p { margin-bottom: 8px; }
                .doc-page .ProseMirror h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #111827; }
                .doc-page .ProseMirror h2 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #1f2937; }
                .doc-page .ProseMirror h3 { font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #374151; }
                .doc-page .ProseMirror h4 { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
                .doc-page .ProseMirror h5 { font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #4b5563; }
                .doc-page .ProseMirror ul { list-style: disc; padding-left: 22px; margin-bottom: 8px; }
                .doc-page .ProseMirror ol { list-style: decimal; padding-left: 22px; margin-bottom: 8px; }
                .doc-page .ProseMirror li p { margin-bottom: 2px; }
                .doc-page .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 4px; }
                .doc-page .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 6px; }
                .doc-page .ProseMirror ul[data-type="taskList"] li > label { margin-top: 2px; cursor: pointer; }
                .doc-page .ProseMirror blockquote {
                  border-left: 3px solid #d1d5db; padding-left: 14px;
                  margin: 0 0 8px; color: #6b7280; font-style: italic;
                }
                .doc-page .ProseMirror img {
                  max-width: 100%; height: auto; display: block;
                  margin: 8px auto; border-radius: 2px;
                }
                .doc-page .ProseMirror table {
                  border-collapse: collapse; width: 100%; margin: 12px 0;
                  table-layout: auto;
                }
                .doc-page .ProseMirror th,
                .doc-page .ProseMirror td {
                  border: 1px solid #c0c0c0; padding: 6px 10px;
                  font-size: 12px; text-align: left; position: relative;
                }
                .doc-page .ProseMirror th { background: #f3f4f6; font-weight: 600; }
                .doc-page .ProseMirror tr:nth-child(even) td { background: #fafafa; }
                .doc-page .ProseMirror .selectedCell { background: #d4e4ff !important; }
                .doc-page .ProseMirror .column-resize-handle {
                  position: absolute; right: -2px; top: 0; bottom: 0;
                  width: 4px; background: #2563eb; cursor: col-resize;
                  pointer-events: auto; z-index: 20;
                }
                .doc-page .ProseMirror hr { border: none; border-top: 1px solid #d1d5db; margin: 14px 0; }
                .doc-page .ProseMirror mark { padding: 1px 2px; border-radius: 2px; }
                .doc-page .ProseMirror a.doc-link { color: #2563eb; text-decoration: underline; cursor: pointer; }
                .doc-page .ProseMirror sub { font-size: 0.75em; }
                .doc-page .ProseMirror sup { font-size: 0.75em; }
                .doc-page .ProseMirror p.is-editor-empty:first-child::before {
                  color: #adb5bd;
                  content: attr(data-placeholder);
                  float: left;
                  height: 0;
                  pointer-events: none;
                }
                ${showGridlines ? `
                  .bg-grid {
                    background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
                    background-size: 20px 20px;
                  }
                ` : ''}
                ${showLineNumbers ? `
                  .doc-page .ProseMirror { counter-reset: line; }
                  .doc-page .ProseMirror p::before {
                    counter-increment: line;
                    content: counter(line);
                    display: inline-block; width: 28px; margin-right: 8px;
                    color: #9ca3af; font-size: 10px; user-select: none;
                  }
                ` : ''}
                ${trackChanges ? `
                  .doc-page .ProseMirror *:not(h1):not(h2):not(h3) {
                    text-decoration-color: #16a34a;
                  }
                ` : ''}
                @media print {
                  body > * { display: none !important; }
                  .doc-page-container { display: block !important; }
                }
              `}</style>

              <div className="doc-page">
                <EditorContent editor={editor} className="outline-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
