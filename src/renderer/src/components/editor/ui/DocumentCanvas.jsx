import React, { useEffect, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { Check } from 'lucide-react'
import { renderAsync } from 'docx-preview'
import { PAPER, MARGINS } from '../constants'
import logo from '../../../assets/logo.png'
import logo2Img from '../../../assets/logo2.png'
import { resolveHeaderHtml } from '../utils/editorHelpers'

/**
 * DocumentCanvas — Renders dynamic Microsoft Word-style page sheets.
 * Positioned on top of static page cards to allow continuous pagination editing.
 */
export default function DocumentCanvas({
  editor,
  canvasRef,
  paperKey,
  orientation,
  marginKey,
  zoom,
  lineSpacing,
  columns,
  showRuler,
  showGridlines,
  showLineNumbers,
  showHeader,
  headerText,
  setHeaderText,
  showFooter,
  footerText,
  setFooterText,
  workspaceIsReadOnly,
  isTemplateActive = false,
  trackChanges,
  totalPages = 1,
  hasBeenEdited = false,
  activeEditingArea = 'body',
  setActiveEditingArea,
  headerEditor,
  footerEditor,
  docxBuffer,
  setDocxBuffer,
  setTotalPages,
  setCurrentPage,
  setWordCount,
  setCharCount
}) {
  const paper = PAPER[paperKey] || PAPER.Letter
  const docW = orientation === 'landscape' ? paper.h : paper.w
  const docH = orientation === 'landscape' ? paper.w : paper.h

  const getMargins = (key) => {
    const preset = MARGINS[key] || MARGINS.Normal
    if (typeof preset === 'number') {
      return { top: preset, bottom: preset, left: preset, right: preset }
    }
    return preset
  }
  const margins = getMargins(marginKey)
  const padTop = margins.top
  const padBottom = margins.bottom
  const padLeft = margins.left
  const padRight = margins.right
  const padTopActual = showHeader && isTemplateActive ? (marginKey === 'Narrow' ? 142 : 220) : padTop
  const gapH = 36 // Constant page gap height (matching visual page breaks)

  // Strictly bound layout height by physical pages count
  const canvasHeight = docH * totalPages + gapH * (totalPages - 1)
  const totalHeight = canvasHeight + (showRuler ? 20 : 0)

  const docxRef = useRef(null)
  const currentPageRef = useRef(1)
  const [editingPage, setEditingPage] = useState(1)

  // Exit header/footer mode with Escape key
  useEffect(() => {
    if (activeEditingArea === 'body') return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveEditingArea('body')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeEditingArea, setActiveEditingArea])

  // Live count updater for DOCX text content
  const updateDocxCounts = () => {
    if (!docxRef.current) return
    const text = docxRef.current.innerText || ''
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    if (setWordCount) setWordCount(words)
    if (setCharCount) setCharCount(text.length)
  }

  // Load and render docx natively using docx-preview
  useEffect(() => {
    if (!docxBuffer || !docxRef.current) return
    docxRef.current.innerHTML = ''
    renderAsync(docxBuffer, docxRef.current, null, {
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      ignoreLastRenderedPageBreak: false,
      inWrapper: true,
      useBase64URL: true
    })
      .then(() => {
        const pages = docxRef.current.querySelectorAll('section.docx')
        if (setTotalPages) {
          setTotalPages(pages.length || 1)
        }

        // Compute initial counts
        updateDocxCounts()

        // Make all pages editable
        pages.forEach((page) => {
          page.setAttribute('contenteditable', 'true')
          page.style.outline = 'none'
          page.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)'
          page.style.marginBottom = '24px'
          page.style.background = '#ffffff'
          page.style.position = 'relative'

          // Listen to inline editing to update count status bar in real-time
          page.addEventListener('input', updateDocxCounts)
        })
      })
      .catch((err) => {
        console.error('docx-preview error in canvas:', err)
      })
  }, [docxBuffer])

  // Track page navigation scrolling for DOCX workspace
  const handleDocxScroll = (e) => {
    if (!docxBuffer) return
    const container = e.currentTarget
    const pages = container.querySelectorAll('section.docx')
    const containerTop = container.getBoundingClientRect().top

    let activePage = 1
    for (let i = 0; i < pages.length; i++) {
      const pageRect = pages[i].getBoundingClientRect()
      if (pageRect.top - containerTop < container.clientHeight / 2) {
        activePage = i + 1
      }
    }
    if (setCurrentPage) {
      setCurrentPage(activePage)
    }
  }

  // Track page navigation scrolling for Tiptap workspace
  const handleScroll = (e) => {
    if (docxBuffer) {
      handleDocxScroll(e)
      return
    }
    const container = e.currentTarget
    const scrollTop = container.scrollTop
    const scaledPageHeight = (docH + gapH) * (zoom / 100)
    const rawPage = Math.floor((scrollTop + scaledPageHeight / 2) / scaledPageHeight) + 1
    const clampedPage = Math.min(Math.max(1, rawPage), totalPages)
    if (setCurrentPage && clampedPage !== currentPageRef.current) {
      currentPageRef.current = clampedPage
      setCurrentPage(clampedPage)
    }
  }

  // If native DOCX workspace is active, render docx-preview container directly
  if (docxBuffer) {
    return (
      <div
        onScroll={handleDocxScroll}
        className="flex-1 overflow-y-auto bg-gray-300 py-6 px-4 flex flex-col items-center select-text relative w-full h-full"
      >
        <div
          style={{
            width: docW,
            zoom: zoom / 100,
            outline: 'none'
          }}
        >
          <div
            ref={docxRef}
            className="docx-editor-container select-text"
            style={{ outline: 'none' }}
          />
        </div>

        <style>{`
          .docx-wrapper {
            background: transparent !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: ${gapH}px !important;
            overflow: visible !important;
            height: auto !important;
            position: relative !important;
            min-height: 100% !important;
          }
          .docx-wrapper > section.docx {
            box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
            border: 1px solid #c0c0c0 !important;
            margin: 0 auto !important;
            background: #ffffff !important;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      onScroll={handleScroll}
      className="flex-1 overflow-auto bg-gray-300 py-6 px-4 flex flex-col items-center select-text relative w-full h-full"
    >
      {/* Scaled wrapper to reserve correct layout bounds for scrollbars */}
      <div
        style={{
          width: docW * (zoom / 100),
          height: totalHeight * (zoom / 100),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'visible',
          position: 'relative',
          marginTop: '1.5rem',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            width: docW,
            height: totalHeight,
            outline: 'none',
            position: 'relative'
          }}
        >
          {/* -- Horizontal Ruler -- */}
          {showRuler && (
            <div
              className="bg-linear-to-b from-gray-50 to-gray-100 border border-gray-300 h-5 flex items-center relative select-none shrink-0"
              style={{ width: docW, marginBottom: '2px' }}
            >
              <div
                className="absolute left-0 h-full bg-gray-200/80 border-r border-gray-300"
                style={{ width: padLeft }}
              />
              <div
                className="absolute right-0 h-full bg-gray-200/80 border-l border-gray-300"
                style={{ width: padRight }}
              />
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ left: padLeft + i * ((docW - (padLeft + padRight)) / 7) }}
                >
                  <div className="h-2 w-px bg-gray-400" />
                  <span className="text-[7px] text-gray-500">{i === 0 ? '' : `${i}"`}</span>
                </div>
              ))}
            </div>
          )}

          {/* Wrapper housing the background page sheets and the editor content */}
          <div
            ref={canvasRef}
            style={{ width: docW, height: canvasHeight, position: 'relative' }}
            className="print-canvas"
          >
            {/* -- Page Background Sheets (Physical Paper Shadow Cards) -- */}
            <div className="absolute inset-0 pointer-events-none select-none flex flex-col items-center">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <div
                    key={i}
                    id={`doc-viewer-page-${pageNum}`}
                    className="bg-white shadow-xl border border-gray-300/70 rounded-xs shrink-0 relative pointer-events-auto"
                    style={{
                      width: docW,
                      height: docH,
                      marginBottom: gapH
                    }}
                  >
                    {/* -- System Template Header/Footer Rendering (100% Static & Preserved) -- */}
                    {isTemplateActive ? (
                      <>
                        {/* -- Static Template Header -- */}
                        {showHeader && (
                          <div
                            className="absolute left-0 right-0 z-50 pointer-events-none select-none"
                            style={{
                              top: `${padTop}px`,
                              paddingLeft: padLeft,
                              paddingRight: padRight,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  resolveHeaderHtml(headerText, logo2Img, logo) ||
                                  '<div style="min-height: 20px;"></div>'
                              }}
                            />
                          </div>
                        )}

                        {/* -- Static Template Footer -- */}
                        {showFooter && (
                          <div
                            className="absolute left-0 right-0 z-50 pointer-events-none select-none"
                            style={{
                              bottom: '0px',
                              paddingLeft: padLeft,
                              paddingRight: padRight,
                              paddingBottom: '24px',
                              boxSizing: 'border-box'
                            }}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html:
                                  resolveHeaderHtml(footerText, logo2Img, logo) ||
                                  '<div style="min-height: 20px;"></div>'
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      /* -- Normal Document Microsoft Word-Style Header & Footer UI -- */
                      <>
                        {/* Header Region */}
                        {showHeader && (
                          <div
                            className={`absolute top-0 left-0 right-0 z-50 select-text transition-colors ${
                              activeEditingArea === 'header' && editingPage === pageNum
                                ? 'bg-white'
                                : 'hover:bg-blue-50/20 cursor-pointer'
                            }`}
                            style={{
                              height: `${padTopActual}px`,
                              paddingLeft: padLeft,
                              paddingRight: padRight,
                              paddingTop: '20px',
                              boxSizing: 'border-box'
                            }}
                            onClick={(e) => {
                              if (!workspaceIsReadOnly && activeEditingArea !== 'header') {
                                e.stopPropagation()
                                setEditingPage(pageNum)
                                setActiveEditingArea('header')
                              }
                            }}
                            onDoubleClick={(e) => {
                              if (!workspaceIsReadOnly) {
                                e.stopPropagation()
                                setEditingPage(pageNum)
                                setActiveEditingArea('header')
                              }
                            }}
                          >
                            {activeEditingArea === 'header' && editingPage === pageNum ? (
                              <div className="w-full h-full relative flex flex-col justify-end pb-2">
                                <div className="w-full text-gray-800 text-xs font-sans min-h-[20px] outline-none">
                                  {headerEditor && <EditorContent editor={headerEditor} />}
                                </div>
                                {/* MS Word-style full-width horizontal boundary line */}
                                <div className="absolute left-0 right-0 bottom-0 border-b border-dashed border-gray-400 pointer-events-none" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col justify-end pb-2 border-b border-dashed border-transparent hover:border-gray-300">
                                <div
                                  className="w-full text-gray-800 text-xs font-sans min-h-[20px]"
                                  dangerouslySetInnerHTML={{
                                    __html: headerText || '<div style="min-height: 20px;"></div>'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer Region */}
                        {showFooter && (
                          <div
                            className={`absolute bottom-0 left-0 right-0 z-50 select-text transition-colors ${
                              activeEditingArea === 'footer' && editingPage === pageNum
                                ? 'bg-white'
                                : 'hover:bg-blue-50/20 cursor-pointer'
                            }`}
                            style={{
                              height: `${padBottom}px`,
                              paddingLeft: padLeft,
                              paddingRight: padRight,
                              paddingBottom: '20px',
                              boxSizing: 'border-box'
                            }}
                            onClick={(e) => {
                              if (!workspaceIsReadOnly && activeEditingArea !== 'footer') {
                                e.stopPropagation()
                                setEditingPage(pageNum)
                                setActiveEditingArea('footer')
                              }
                            }}
                            onDoubleClick={(e) => {
                              if (!workspaceIsReadOnly) {
                                e.stopPropagation()
                                setEditingPage(pageNum)
                                setActiveEditingArea('footer')
                              }
                            }}
                          >
                            {activeEditingArea === 'footer' && editingPage === pageNum ? (
                              <div className="w-full h-full relative flex flex-col justify-start pt-2">
                                {/* MS Word-style full-width horizontal boundary line */}
                                <div className="absolute left-0 right-0 top-0 border-t border-dashed border-gray-400 pointer-events-none" />
                                <div className="w-full text-gray-800 text-xs font-sans min-h-[20px] outline-none">
                                  {footerEditor && <EditorContent editor={footerEditor} />}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col justify-start pt-2 border-t border-dashed border-transparent hover:border-gray-300">
                                <div
                                  className="w-full text-gray-800 text-xs font-sans min-h-[20px]"
                                  dangerouslySetInnerHTML={{
                                    __html: footerText || '<div style="min-height: 20px;"></div>'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* -- Transparent Editor Canvas overlaying sheets -- */}
            <div
              onClick={(e) => {
                const target = e.target
                // Only handle clicks on the container background itself, not on text content
                const isContainerClick =
                  target === e.currentTarget || target.classList.contains('doc-page')
                const isEmptyAreaClick =
                  !target.closest('.ProseMirror') &&
                  target.closest('.doc-page-container') &&
                  target === e.currentTarget
                if (isContainerClick || isEmptyAreaClick) {
                  if (activeEditingArea !== 'body') {
                    setActiveEditingArea('body')
                  }
                  // Do NOT call editor.commands.focus("end") — let ProseMirror handle caret placement naturally
                }
              }}
              onDoubleClick={() => {
                if (activeEditingArea !== 'body') {
                  setActiveEditingArea('body')
                }
              }}
              className={`relative doc-page doc-page-container select-text ${showGridlines ? 'bg-grid' : ''}`}
              style={{
                width: docW,
                minHeight: canvasHeight,
                paddingTop: padTopActual,
                paddingBottom: padBottom,
                paddingLeft: padLeft,
                paddingRight: padRight,
                cursor: activeEditingArea === 'body' ? 'text' : 'pointer',
                background: 'transparent',
                boxSizing: 'border-box',
                opacity: activeEditingArea !== 'body' ? 0.35 : 1,
                pointerEvents: 'auto', // Always allow interaction so double-click works
                transition: 'opacity 0.2s ease-in-out'
              }}
            >
              {workspaceIsReadOnly && (
                <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-bold text-[9px] uppercase tracking-wide z-10 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  Approved
                </div>
              )}

              {/* Document styles */}
              <style>{`
                  .reactjs-tiptap-editor {
                    display: flex !important;
                    flex-direction: column !important;
                    flex: 1 1 0% !important;
                    height: 100% !important;
                    width: 100% !important;
                    overflow: visible !important;
                  }
                  .ProseMirror {
                    padding: 0 !important;
                    background-color: transparent !important;
                    background-image: none !important;
                    outline: none;
                    font-size: 13px;
                    line-height: ${lineSpacing};
                    color: #1f2937;
                    font-family: 'Calibri', sans-serif;
                    overflow: visible !important;
                  }
                  .reactjs-tiptap-editor .ProseMirror.ProseMirror.ProseMirror {
                    min-height: ${docH - (padTopActual + padBottom)}px !important;
                    column-count: ${columns};
                    column-gap: 32px;
                  }
                  .doc-page .ProseMirror {
                    min-height: ${docH - (padTopActual + padBottom)}px;
                    column-count: ${columns};
                    column-gap: 32px;
                  }
                  .doc-page {
                    pointer-events: ${activeEditingArea !== 'body' ? 'none' : 'auto'};
                  }
                  .ProseMirror p,
                  .ProseMirror h1,
                  .ProseMirror h2,
                  .ProseMirror h3,
                  .ProseMirror h4,
                  .ProseMirror h5,
                  .ProseMirror ul,
                  .ProseMirror ol,
                  .ProseMirror table,
                  .ProseMirror blockquote,
                  .ProseMirror hr {
                    position: relative;
                    z-index: 10;
                  }
                  .ProseMirror p { margin-bottom: 8px; }
                 .ProseMirror h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #111827; }
                 .ProseMirror h2 { font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #1f2937; }
                 .ProseMirror h3 { font-size: 15px; font-weight: 600; margin-bottom: 8px; color: #374151; }
                 .ProseMirror h4 { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151; }
                 .ProseMirror h5 { font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #4b5563; }
                 .ProseMirror ul { list-style: disc; padding-left: 22px; margin-bottom: 8px; }
                 .ProseMirror ol { list-style: decimal; padding-left: 22px; margin-bottom: 8px; }
                 .ProseMirror li p { margin-bottom: 2px; }
                 .ProseMirror ul[data-type="taskList"] { list-style: none; padding-left: 4px; }
                 .ProseMirror ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 6px; }
                 .ProseMirror ul[data-type="taskList"] li > label { margin-top: 2px; cursor: pointer; }
                 .ProseMirror blockquote {
                   border-left: 3px solid #d1d5db; padding-left: 14px;
                   margin: 0 0 8px; color: #6b7280; font-style: italic;
                 }
                 .ProseMirror img {
                   max-width: 100%; height: auto;
                 }
                  .ProseMirror table,
                  table.movable-table {
                    border-collapse: collapse !important;
                    border-spacing: 0 !important;
                    width: 100% !important;
                    margin: 8px 0;
                    table-layout: fixed;
                    border: 1.5px solid #000000;
                    box-sizing: border-box !important;
                  }
                  .ProseMirror table th,
                  .ProseMirror table td,
                  table.movable-table th,
                  table.movable-table td {
                    border: 1.5px solid #000000;
                    padding: 4px 8px;
                    font-size: 12px;
                    text-align: left;
                    position: relative;
                    word-break: break-word;
                    overflow-wrap: break-word;
                    box-sizing: border-box !important;
                  }
                  .ProseMirror table.compact-form-table {
                    margin: 1px 0 !important;
                  }
                  .ProseMirror table.compact-form-table th,
                  .ProseMirror table.compact-form-table td {
                    padding: 1px 5px !important;
                  }
                  .ProseMirror table.compact-form-table p {
                    margin: 0 !important;
                    padding: 0 !important;
                  }
                  .ProseMirror table.borderless,
                  .ProseMirror table.borderless th,
                  .ProseMirror table.borderless td,
                  .ProseMirror table[style*="border:none"],
                  .ProseMirror table[style*="border: none"],
                  .ProseMirror table[style*="border:none"] th,
                  .ProseMirror table[style*="border:none"] td,
                  .ProseMirror table[style*="border: none"] th,
                  .ProseMirror table[style*="border: none"] td,
                  .ProseMirror table th[style*="border:none"],
                  .ProseMirror table th[style*="border: none"],
                  .ProseMirror table td[style*="border:none"],
                  .ProseMirror table td[style*="border: none"] {
                    border: none !important;
                    background: transparent !important;
                  }
                  .ProseMirror th { background: #f3f4f6; font-weight: 600; }
                  .ProseMirror tr:nth-child(even) td { background: #fafafa; }
                  .ProseMirror table.borderless tr td,
                  .ProseMirror table[style*="border:none"] tr td,
                  .ProseMirror table[style*="border: none"] tr td {
                    background: transparent !important;
                  }
                  .ProseMirror .selectedCell { background: #d4e4ff !important; }
                  .ProseMirror .column-resize-handle {
                    position: absolute; right: -2px; top: 0; bottom: 0;
                    width: 4px; background: #2563eb; cursor: col-resize;
                    pointer-events: auto; z-index: 20;
                  }
                  .ProseMirror table.movable-table th {
                    background: #f3f4f6;
                    font-weight: 600;
                  }
                  .ProseMirror table.movable-table tr:nth-child(even) td {
                    background: #fafafa;
                  }
                  .ProseMirror .movable-table-wrapper:hover {
                    outline: 1px dashed #3b82f6;
                  }
                  .ProseMirror .movable-table-wrapper .table-move-handle,
                  .ProseMirror .movable-table-wrapper .table-resize-handle {
                    opacity: 0;
                    transition: opacity 0.15s ease-in-out;
                  }
                  .ProseMirror .movable-table-wrapper:hover .table-move-handle,
                  .ProseMirror .movable-table-wrapper:hover .table-resize-handle,
                  .ProseMirror .movable-table-wrapper:focus-within .table-move-handle,
                  .ProseMirror .movable-table-wrapper:focus-within .table-resize-handle {
                    opacity: 1;
                  }
                 .ProseMirror hr { border: none; border-top: 1px solid #d1d5db; margin: 14px 0; }
                 .ProseMirror mark { padding: 1px 2px; border-radius: 2px; }
                 .ProseMirror a.doc-link { color: #2563eb; text-decoration: underline; cursor: pointer; }
                 .ProseMirror sub { font-size: 0.75em; }
                 .ProseMirror sup { font-size: 0.75em; }
                 .doc-page:not(.has-been-edited) .ProseMirror p.is-editor-empty:first-child::before {
                   color: #adb5bd;
                   content: attr(data-placeholder);
                   float: left;
                   height: 0;
                   pointer-events: none;
                 }
                 ${
                   showGridlines
                     ? `
                   .bg-grid {
                     background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
                     background-size: 20px 20px;
                   }
                 `
                     : ''
                 }
                 ${
                   showLineNumbers
                     ? `
                   .doc-page .ProseMirror { counter-reset: line; }
                   .doc-page .ProseMirror p::before {
                     counter-increment: line;
                     content: counter(line);
                     display: inline-block; width: 28px; margin-right: 8px;
                     color: #9ca3af; font-size: 10px; user-select: none;
                   }
                 `
                     : ''
                 }
                 ${
                   trackChanges
                     ? `
                   .doc-page .ProseMirror *:not(h1):not(h2):not(h3) {
                     text-decoration-color: #16a34a;
                   }
                 `
                     : ''
                 }
                  @media print {
                    body > * { display: none !important; }
                    .print-canvas { 
                      display: block !important; 
                      position: absolute !important; 
                      left: 0 !important; 
                      top: 0 !important; 
                      width: 100% !important; 
                      height: auto !important; 
                      transform: none !important;
                      zoom: 100% !important;
                    }
                    .page-break-widget {
                      page-break-after: always;
                    }
                  }
               `}</style>

              <div className={`doc-page-content ${hasBeenEdited ? 'has-been-edited' : ''}`}>
                {editor && <EditorContent editor={editor} className="outline-none" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
