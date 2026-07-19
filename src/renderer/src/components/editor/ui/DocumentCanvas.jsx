import React, { useEffect, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { Check } from "lucide-react";
import { renderAsync } from "docx-preview";
import { PAPER, MARGINS } from "../constants";

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
  hasBeenEdited = false,
  activeEditingArea = "body",
  setActiveEditingArea,
  headerEditor,
  footerEditor,
  docxBuffer,
  setDocxBuffer,
  setTotalPages,
  setCurrentPage,
  setWordCount,
  setCharCount,
}) {
  const paper = PAPER[paperKey] || PAPER.Letter;
  const docW = orientation === "landscape" ? paper.h : paper.w;
  const docH = orientation === "landscape" ? paper.w : paper.h;
  const pad = MARGINS[marginKey] || 96;
  const gapH = 36; // Constant page gap height (matching visual page breaks)

  // Strictly bound layout height by physical pages count
  const canvasHeight = docH * totalPages + gapH * (totalPages - 1);
  const totalHeight = canvasHeight + (showRuler ? 20 : 0);

  const docxRef = useRef(null);
  const currentPageRef = useRef(1);
  const [editingPage, setEditingPage] = useState(1);

  // Exit header/footer mode with Escape key
  useEffect(() => {
    if (activeEditingArea === "body") return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveEditingArea("body");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeEditingArea, setActiveEditingArea]);

  // Live count updater for DOCX text content
  const updateDocxCounts = () => {
    if (!docxRef.current) return;
    const text = docxRef.current.innerText || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    if (setWordCount) setWordCount(words);
    if (setCharCount) setCharCount(text.length);
  };

  // Load and render docx natively using docx-preview
  useEffect(() => {
    if (!docxBuffer || !docxRef.current) return;
    docxRef.current.innerHTML = "";
    renderAsync(docxBuffer, docxRef.current, null, {
      breakPages: true,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      ignoreLastRenderedPageBreak: false,
      inWrapper: true,
      useBase64URL: true,
    }).then(() => {
      const pages = docxRef.current.querySelectorAll("section.docx");
      if (setTotalPages) {
        setTotalPages(pages.length || 1);
      }
      
      // Compute initial counts
      updateDocxCounts();

      // Make all pages editable
      pages.forEach((page) => {
        page.setAttribute("contenteditable", "true");
        page.style.outline = "none";
        page.style.boxShadow = "0 8px 30px rgba(0,0,0,0.15)";
        page.style.marginBottom = "24px";
        page.style.background = "#ffffff";
        page.style.position = "relative";
        
        // Listen to inline editing to update count status bar in real-time
        page.addEventListener("input", updateDocxCounts);
      });
    }).catch((err) => {
      console.error("docx-preview error in canvas:", err);
    });
  }, [docxBuffer]);

  // Track page navigation scrolling for DOCX workspace
  const handleDocxScroll = (e) => {
    if (!docxBuffer) return;
    const container = e.currentTarget;
    const pages = container.querySelectorAll("section.docx");
    const containerTop = container.getBoundingClientRect().top;
    
    let activePage = 1;
    for (let i = 0; i < pages.length; i++) {
      const pageRect = pages[i].getBoundingClientRect();
      if (pageRect.top - containerTop < container.clientHeight / 2) {
        activePage = i + 1;
      }
    }
    if (setCurrentPage) {
      setCurrentPage(activePage);
    }
  };
 
  // Track page navigation scrolling for Tiptap workspace
  const handleScroll = (e) => {
    if (docxBuffer) {
      handleDocxScroll(e);
      return;
    }
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const scaledPageHeight = (docH + gapH) * (zoom / 100);
    const rawPage = Math.floor((scrollTop + (scaledPageHeight / 2)) / scaledPageHeight) + 1;
    const clampedPage = Math.min(Math.max(1, rawPage), totalPages);
    if (setCurrentPage && clampedPage !== currentPageRef.current) {
      currentPageRef.current = clampedPage;
      setCurrentPage(clampedPage);
    }
  };

  // If native DOCX workspace is active, render docx-preview container directly
  if (docxBuffer) {
    return (
      <div 
        onScroll={handleDocxScroll}
        className="flex-1 overflow-y-auto bg-gray-300 py-6 px-4 flex flex-col items-center select-text relative w-full h-full"
      >
        <div style={{
          width: docW,
          zoom: zoom / 100,
          outline: "none",
        }}>
          <div 
            ref={docxRef} 
            className="docx-editor-container select-text" 
            style={{ outline: "none" }} 
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
    );
  }

  return (
    <div 
      onScroll={handleScroll}
      className="flex-1 overflow-auto bg-gray-300 py-6 px-4 flex flex-col items-center select-text relative w-full h-full"
    >

      {/* Scaled wrapper to reserve correct layout bounds for scrollbars */}
      <div style={{
        width: docW * (zoom / 100),
        height: totalHeight * (zoom / 100),
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflow: "visible",
        position: "relative",
        marginTop: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top center",
          width: docW,
          height: totalHeight,
          outline: "none",
          position: "relative",
        }}>
          {/* -- Horizontal Ruler -- */}
          {showRuler && (
            <div
              className="bg-linear-to-b from-gray-50 to-gray-100 border border-gray-300 h-5 flex items-center relative select-none shrink-0"
              style={{ width: docW, marginBottom: "2px" }}
            >
              <div className="absolute left-0 h-full bg-gray-200/80 border-r border-gray-300" style={{ width: pad }} />
              <div className="absolute right-0 h-full bg-gray-200/80 border-l border-gray-300" style={{ width: pad }} />
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="absolute flex flex-col items-center" style={{ left: pad + i * ((docW - 2 * pad) / 7) }}>
                  <div className="h-2 w-px bg-gray-400" />
                  <span className="text-[7px] text-gray-500">{i === 0 ? "" : `${i}"`}</span>
                </div>
              ))}
            </div>
          )}

          {/* Wrapper housing the background page sheets and the editor content */}
          <div ref={canvasRef} style={{ width: docW, height: canvasHeight, position: "relative" }} className="print-canvas">
            
            {/* -- Page Background Sheets (Physical Paper Shadow Cards) -- */}
            <div className="absolute inset-0 pointer-events-none select-none flex flex-col items-center">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <div
                    key={i}
                    className="bg-white shadow-xl border border-gray-300/70 rounded-xs shrink-0 relative pointer-events-auto"
                    style={{
                      width: docW,
                      height: docH,
                      marginBottom: gapH,
                    }}
                  >
                    {/* Double-click zone to trigger Header Edit */}
                    <div
                      className="absolute top-0 left-0 right-0 cursor-text z-40 hover:bg-blue-50/20 transition"
                      style={{ height: `${pad}px` }}
                      onDoubleClick={() => {
                        if (!workspaceIsReadOnly) {
                          setEditingPage(pageNum);
                          setActiveEditingArea("header");
                        }
                      }}
                      title="Double click to edit Header"
                    />

                    {/* Double-click zone to trigger Footer Edit */}
                    <div
                      className="absolute bottom-0 left-0 right-0 cursor-text z-40 hover:bg-blue-50/20 transition"
                      style={{ height: `${pad}px` }}
                      onDoubleClick={() => {
                        if (!workspaceIsReadOnly) {
                          setEditingPage(pageNum);
                          setActiveEditingArea("footer");
                        }
                      }}
                      title="Double click to edit Footer"
                    />

                    {/* -- Page Header -- */}
                    {showHeader && (
                      <div
                        className="absolute left-0 right-0 z-50"
                        style={{
                          top: "12px",
                          paddingLeft: pad,
                          paddingRight: pad,
                          boxSizing: "border-box",
                        }}
                      >
                        {activeEditingArea === "header" && editingPage === pageNum ? (
                          <div className="relative">
                            <div className="w-full bg-blue-50/70 border border-dashed border-blue-400 text-gray-800 text-[10px] px-2 py-1 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans min-h-[20px] select-text">
                              {headerEditor && <EditorContent editor={headerEditor} />}
                            </div>
                            <span className="absolute -top-3.5 right-1 text-[8px] text-blue-500 font-bold uppercase tracking-wider select-none">Header</span>
                          </div>
                        ) : (
                          <div 
                            className="border-b border-dashed border-transparent hover:border-gray-300 cursor-pointer pb-1"
                            onClick={() => { if (!workspaceIsReadOnly) { setEditingPage(pageNum); setActiveEditingArea("header"); }}}
                            dangerouslySetInnerHTML={{ __html: headerText || '<span style="font-size:10px;color:#9ca3af;font-family:sans-serif;">Click to add header</span>' }}
                          />
                        )}
                      </div>
                    )}

                    {/* -- Page Footer -- */}
                    {showFooter && (
                      <div
                        className="absolute left-0 right-0 z-50"
                        style={{
                          bottom: "12px",
                          paddingLeft: pad,
                          paddingRight: pad,
                          boxSizing: "border-box",
                        }}
                      >
                        {activeEditingArea === "footer" && editingPage === pageNum ? (
                          <div className="relative bg-blue-50/70 border border-dashed border-blue-400 rounded-sm p-1 select-text">
                            <div className="bg-transparent text-gray-800 text-[10px] px-2 py-0.5 focus:outline-none font-sans min-h-[20px] text-center">
                              {footerEditor && <EditorContent editor={footerEditor} />}
                            </div>
                            <span className="absolute -top-3.5 right-1 text-[8px] text-blue-500 font-bold uppercase tracking-wider select-none">Footer</span>
                          </div>
                        ) : (
                          <div 
                            className="relative border-t border-dashed border-transparent hover:border-gray-300 cursor-pointer pt-1 w-full"
                            onClick={() => { if (!workspaceIsReadOnly) { setEditingPage(pageNum); setActiveEditingArea("footer"); }}}
                          >
                            <div dangerouslySetInnerHTML={{ __html: footerText || '<span style="font-size:10px;color:#9ca3af;font-family:sans-serif;">Click to add footer</span>' }} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* -- Transparent Editor Canvas overlaying sheets -- */}
            <div
              onClick={(e) => {
                const target = e.target;
                if (target === canvasRef.current || target.classList.contains("doc-page") ||
                    (!target.closest(".ProseMirror") && target.closest(".doc-page-container"))) {
                  if (activeEditingArea === "body") {
                    editor?.commands.focus("end");
                  } else {
                    setActiveEditingArea("body");
                  }
                }
              }}
              onDoubleClick={() => {
                if (activeEditingArea !== "body") {
                  setActiveEditingArea("body");
                }
              }}
              className={`relative doc-page-container ${showGridlines ? "bg-grid" : ""}`}
              style={{
                width: docW,
                minHeight: canvasHeight,
                paddingTop: pad,
                paddingBottom: pad,
                paddingLeft: pad,
                paddingRight: pad,
                cursor: activeEditingArea === "body" ? "text" : "pointer",
                background: "transparent",
                boxSizing: "border-box",
                opacity: activeEditingArea !== "body" ? 0.35 : 1,
                pointerEvents: activeEditingArea !== "body" ? "none" : "auto",
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              {workspaceIsReadOnly && (
                <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-bold text-[9px] uppercase tracking-wide z-10 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />Approved
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
                    min-height: ${docH - pad * 2}px !important;
                    column-count: ${columns};
                    column-gap: 32px;
                  }
                 .doc-page .ProseMirror {
                   min-height: ${docH - pad * 2}px;
                   column-count: ${columns};
                   column-gap: 32px;
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
                 .ProseMirror table {
                   border-collapse: collapse; width: 100%; margin: 12px 0;
                   table-layout: auto;
                 }
                 .ProseMirror th,
                 .ProseMirror td {
                   border: 1px solid #c0c0c0; padding: 6px 10px;
                   font-size: 12px; text-align: left; position: relative;
                 }
                 .ProseMirror th { background: #f3f4f6; font-weight: 600; }
                 .ProseMirror tr:nth-child(even) td { background: #fafafa; }
                 .ProseMirror .selectedCell { background: #d4e4ff !important; }
                 .ProseMirror .column-resize-handle {
                   position: absolute; right: -2px; top: 0; bottom: 0;
                   width: 4px; background: #2563eb; cursor: col-resize;
                   pointer-events: auto; z-index: 20;
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
                 ${showGridlines ? `
                   .bg-grid {
                     background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
                     background-size: 20px 20px;
                   }
                 ` : ""}
                 ${showLineNumbers ? `
                   .doc-page .ProseMirror { counter-reset: line; }
                   .doc-page .ProseMirror p::before {
                     counter-increment: line;
                     content: counter(line);
                     display: inline-block; width: 28px; margin-right: 8px;
                     color: #9ca3af; font-size: 10px; user-select: none;
                   }
                 ` : ""}
                 ${trackChanges ? `
                   .doc-page .ProseMirror *:not(h1):not(h2):not(h3) {
                     text-decoration-color: #16a34a;
                   }
                 ` : ""}
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
 
               <div className={`doc-page ${hasBeenEdited ? "has-been-edited" : ""}`}>
                 {editor && <EditorContent editor={editor} className="outline-none" />}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
