import React, { useState, useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Hand,
  Type,
  Printer,
  Download,
  X,
  Check,
  Clock,
  Maximize2,
  Minimize2,
  Calendar,
  MapPin,
  Tag,
  User,
  Layers,
  FileText
} from 'lucide-react'
import logo from '../assets/logo.png'

export default function DocumentViewer({
  report,
  onClose,
  eventsList = [],
  orgsList = [],
  usersList = [],
  feedbackNote,
  setFeedbackNote,
  handleReviewReport,
  compileReportPDF,
  loading = false
}) {
  // Viewer Settings State
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [zoomScale, setZoomScale] = useState(1.0)
  const [viewMode, setViewMode] = useState('select') // 'select' or 'pan'
  
  // Panning State
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })
  
  const viewportRef = useRef(null)

  // Resolve metadata fields
  const event = eventsList.find((e) => e.id === report.eventId)
  const org = orgsList.find((o) => o.id === report.organizationId)
  const author = usersList.find((u) => u.uid === report.authorId)

  // Parse HTML into paginated blocks without breaking tags
  const parseNarrativePages = (htmlString) => {
    if (!htmlString) return []
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlString
    const children = Array.from(tempDiv.children)
    
    if (children.length === 0) {
      return [htmlString]
    }
    
    const pages = []
    let currentPageHtml = ''
    let currentPageTextLength = 0
    
    // Page 1 has header and metadata block, so space is limited. Limit to ~1000 characters.
    // Subsequent pages have more space. Limit to ~1600 characters.
    let maxChars = 1000
    
    children.forEach((child) => {
      const childText = child.textContent || child.innerText || ''
      const childHtml = child.outerHTML
      
      if (currentPageTextLength + childText.length > maxChars && currentPageHtml) {
        pages.push(currentPageHtml)
        currentPageHtml = childHtml
        currentPageTextLength = childText.length
        maxChars = 1600
      } else {
        currentPageHtml += childHtml
        currentPageTextLength += childText.length
      }
    })
    
    if (currentPageHtml) {
      pages.push(currentPageHtml)
    }
    
    return pages
  }

  // Pre-generate pages
  const pages = []
  const narrativePages = parseNarrativePages(report.narrative || '')
  
  if (narrativePages.length === 0) {
    pages.push({ type: 'narrative', content: '', pageNum: 1 })
  } else {
    narrativePages.forEach((content, index) => {
      pages.push({
        type: 'narrative',
        content,
        pageNum: index + 1
      })
    })
  }

  const narrativePageCount = pages.length
  if (report.photos && report.photos.length > 0) {
    const photoChunks = []
    const chunkSize = 4 // 4 photos max per evidence page (2x2 grid)
    for (let i = 0; i < report.photos.length; i += chunkSize) {
      photoChunks.push(report.photos.slice(i, i + chunkSize))
    }
    
    photoChunks.forEach((photos, index) => {
      pages.push({
        type: 'photos',
        photos,
        pageNum: narrativePageCount + index + 1
      })
    })
  }

  // Scroll viewport to a specific page
  const scrollToPage = (pageNum) => {
    const pageEl = document.getElementById(`doc-viewer-page-${pageNum}`)
    if (pageEl && viewportRef.current) {
      pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setCurrentPageNum(pageNum)
    }
  }

  // Navigation handlers
  const handlePrevPage = () => {
    if (currentPageNum > 1) {
      scrollToPage(currentPageNum - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPageNum < pages.length) {
      scrollToPage(currentPageNum + 1)
    }
  }

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.1, 2.0))
  }

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.1, 0.5))
  }

  const handleFitToWidth = () => {
    if (viewportRef.current) {
      const width = viewportRef.current.clientWidth
      // We subtract padding margins (64px) from viewport width
      const scale = (width - 64) / 800
      setZoomScale(Math.min(Math.max(scale, 0.5), 2.0))
    }
  }

  const handleFitToHeight = () => {
    if (viewportRef.current) {
      const height = viewportRef.current.clientHeight
      // We subtract padding margins (64px) from viewport height
      const scale = (height - 64) / 1123
      setZoomScale(Math.min(Math.max(scale, 0.5), 2.0))
    }
  }

  // Viewport Scroll Tracker to sync currentPageNum with scroll position
  const handleViewportScroll = (e) => {
    const viewport = e.target
    const viewportRect = viewport.getBoundingClientRect()
    
    let activePage = 1
    let minDiff = Infinity
    
    pages.forEach((page) => {
      const pageEl = document.getElementById(`doc-viewer-page-${page.pageNum}`)
      if (!pageEl) return
      
      const elRect = pageEl.getBoundingClientRect()
      // Difference between page element's top and viewport container's top
      const diff = Math.abs(elRect.top - viewportRect.top)
      
      if (diff < minDiff) {
        minDiff = diff
        activePage = page.pageNum
      }
    })
    
    setCurrentPageNum(activePage)
  }

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    if (viewMode !== 'pan') return
    setIsPanning(true)
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewportRef.current.scrollLeft,
      scrollTop: viewportRef.current.scrollTop
    }
  }

  const handleMouseMove = (e) => {
    if (!isPanning || viewMode !== 'pan') return
    const dx = e.clientX - panStartRef.current.x
    const dy = e.clientY - panStartRef.current.y
    viewportRef.current.scrollLeft = panStartRef.current.scrollLeft - dx
    viewportRef.current.scrollTop = panStartRef.current.scrollTop - dy
  }

  const handleMouseUpOrLeave = () => {
    setIsPanning(false)
  }

  // Custom Printable Content using sandbox iframe
  const handlePrint = () => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    
    const doc = iframe.contentWindow.document
    doc.write('<html><head><title>CES Outreach Report</title>')
    doc.write('<style>')
    doc.write(`
      @page { size: A4; margin: 10mm; }
      body { font-family: 'Poppins', sans-serif; color: #1e293b; background: white; margin: 0; padding: 0; }
      .page-print { width: 190mm; min-height: 277mm; box-sizing: border-box; page-break-after: always; padding: 10mm 5mm; background: white; position: relative; }
      .header-print { text-align: center; border-bottom: 2px solid #80cc2a; padding-bottom: 12px; margin-bottom: 20px; }
      .title-print { font-size: 18px; font-weight: bold; color: #030e69; margin: 0; }
      .subtitle-print { font-size: 12px; font-weight: 600; color: #475569; margin: 4px 0 0 0; }
      .subtext-print { font-size: 9px; color: #94a3b8; margin: 2px 0 0 0; }
      .metadata-print { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 11px; padding: 12px; border: 1px solid #f1f5f9; border-radius: 8px; background: #fafafa; }
      .metadata-item { margin-bottom: 4px; }
      .metadata-label { font-weight: bold; color: #030e69; }
      .prose { font-size: 12px; line-height: 1.6; }
      .prose p { margin-bottom: 12px; }
      .photo-grid-print { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
      .photo-card-print { border: 1px solid #e2e8f0; padding: 8px; border-radius: 12px; background: #fafafa; text-align: center; }
      .photo-card-print img { width: 100%; height: 95mm; object-fit: cover; border-radius: 8px; }
      .photo-caption-print { font-size: 9px; color: #64748b; margin-top: 6px; font-weight: bold; }
      .page-footer-print { position: absolute; bottom: 5mm; left: 5mm; right: 5mm; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 6px; }
    `)
    doc.write('</style></head><body>')
    
    let pagesHtml = ''
    pages.forEach((page, idx) => {
      pagesHtml += `<div class="page-print">`
      
      if (page.type === 'narrative') {
        if (idx === 0) {
          pagesHtml += `
            <div class="header-print">
              <h2 class="title-print">DOMINICAN COLLEGE OF TARLAC, INC.</h2>
              <h3 class="subtitle-print">Community Extension & Services (CES) Office</h3>
              <p class="subtext-print">Tarlac, Philippines · Official Document Archive</p>
            </div>
            <div class="metadata-print">
              <div class="metadata-item"><span class="metadata-label">Extension Outreach Program:</span> <span>${event ? event.name : report.activityTitle || 'Outreach'}</span></div>
              <div class="metadata-item"><span class="metadata-label">Academic Schedule:</span> <span>${report.semester} | AY ${report.academicYear}</span></div>
              <div class="metadata-item"><span class="metadata-label">Department / Organization:</span> <span>${org ? org.name : report.organizationId ? 'Unknown' : 'CES Office'}</span></div>
              <div class="metadata-item"><span class="metadata-label">Activity Details:</span> <span>${report.activityDate ? new Date(report.activityDate).toLocaleDateString() : ''} ${report.location ? ' @ ' + report.location : ''}</span></div>
              <div class="metadata-item"><span class="metadata-label">Target Beneficiaries:</span> <span>${report.beneficiaries || 'N/A'}</span></div>
              <div class="metadata-item"><span class="metadata-label">Category:</span> <span style="text-transform: capitalize;">${(report.type || 'outreach').replace('_', ' ')}</span></div>
            </div>
            <h4 style="font-size: 13px; font-weight: bold; color: #030e69; margin: 0 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px;">Activity Description Narrative</h4>
          `
        } else {
          pagesHtml += `
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 16px; font-size: 9px; color: #94a3b8;">
              <span>CES Narrative Report - Continuation</span>
              <span>Page ${page.pageNum}</span>
            </div>
          `
        }
        pagesHtml += `<div class="prose">${page.content}</div>`
      } else if (page.type === 'photos') {
        pagesHtml += `
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 16px; font-size: 9px; color: #94a3b8;">
            <span>CES Narrative Report - Photographic Evidence</span>
            <span>Page ${page.pageNum}</span>
          </div>
          <h4 style="font-size: 13px; font-weight: bold; color: #030e69; margin: 0 0 12px 0;">Photographic Documentation</h4>
          <div class="photo-grid-print">
        `
        page.photos.forEach((photo, pIdx) => {
          pagesHtml += `
            <div class="photo-card-print">
              <img src="${photo.url}" />
              <div class="photo-caption-print">Photo Evidence ${pIdx + 1}</div>
            </div>
          `
        })
        pagesHtml += `</div>`
      }
      
      pagesHtml += `<div class="page-footer-print">DOMMUNITY CODE | Page ${page.pageNum} of ${pages.length}</div>`
      pagesHtml += `</div>`
    })
    
    doc.write(pagesHtml)
    doc.write('</body></html>')
    doc.close()
    
    // Trigger print
    iframe.contentWindow.focus()
    setTimeout(() => {
      iframe.contentWindow.print()
      document.body.removeChild(iframe)
    }, 600)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in font-poppins text-slate-800">
      <div className="w-[98vw] h-[95vh] bg-[#f8fafc] rounded-3xl flex flex-col overflow-hidden shadow-2xl border border-white/10">
        
        {/* ==================================================== */}
        {/* TOP BAR / VIEWBAR TOOLBAR */}
        {/* ==================================================== */}
        <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-xs">
          {/* Left Panel Toggle & Title */}
          <div className="flex items-center space-x-3.5">
            <button
              onClick={() => setShowThumbnails(!showThumbnails)}
              className={`p-2 rounded-xl border transition cursor-pointer flex items-center justify-center ${showThumbnails ? 'bg-navy-blue text-white border-navy-blue shadow-xs' : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'}`}
              title="Show/Hide Page Thumbnails"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-navy-blue truncate max-w-xs lg:max-w-md">
                {event ? event.name : report.activityTitle || 'Outreach Report'}
              </span>
              <span className="text-[10px] font-semibold text-sig-green uppercase tracking-wider">
                Document Inspect Mode
              </span>
            </div>
          </div>

          {/* Middle Toolbar Controls */}
          <div className="flex items-center space-x-2 md:space-x-4 bg-gray-50 p-1 rounded-2xl border border-gray-200/50">
            {/* Page Navigation */}
            <div className="flex items-center space-x-1.5 px-2 border-r border-gray-200/60">
              <button
                onClick={handlePrevPage}
                disabled={currentPageNum <= 1}
                className="p-1 rounded-lg text-gray-500 hover:bg-white hover:text-navy-blue disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-navy-blue min-w-16 text-center select-none">
                {currentPageNum} / {pages.length}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPageNum >= pages.length}
                className="p-1 rounded-lg text-gray-500 hover:bg-white hover:text-navy-blue disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 border-r border-gray-200/60 pr-1.5">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded-lg text-gray-500 hover:bg-white hover:text-navy-blue transition cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-navy-blue min-w-10 text-center select-none">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded-lg text-gray-500 hover:bg-white hover:text-navy-blue transition cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleFitToWidth}
                className="p-1 ml-1 rounded-lg text-gray-500 hover:bg-white hover:text-navy-blue transition cursor-pointer flex items-center gap-0.5"
                title="Fit to Width"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold hidden lg:inline">Width</span>
              </button>
              <button
                onClick={handleFitToHeight}
                className="p-1 rounded-lg text-gray-500 hover:bg-white hover:text-navy-blue transition cursor-pointer flex items-center gap-0.5"
                title="Fit to Height"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold hidden lg:inline">Height</span>
              </button>
            </div>

            {/* Pan & Select Mode Toggles */}
            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => setViewMode('select')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'select' ? 'bg-white text-navy-blue shadow-xs font-semibold' : 'text-gray-500 hover:bg-white'}`}
                title="Select Text"
              >
                <Type className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('pan')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${viewMode === 'pan' ? 'bg-white text-navy-blue shadow-xs font-semibold' : 'text-gray-500 hover:bg-white'}`}
                title="Pan Canvas"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Action Options & Close */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={handlePrint}
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl transition cursor-pointer flex items-center justify-center"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => compileReportPDF(report)}
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl transition cursor-pointer flex items-center justify-center"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-xl transition cursor-pointer flex items-center justify-center font-bold"
              title="Close Inspect"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ==================================================== */}
        {/* MAIN BODY AREA */}
        {/* ==================================================== */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          
          {/* Thumbnails Sidebar */}
          <aside
            className={`bg-white border-r border-gray-100 p-4 overflow-y-auto space-y-4 shrink-0 transition-all duration-300 flex flex-col items-center select-none ${showThumbnails ? 'w-48' : 'w-0 p-0 border-r-0 overflow-hidden'}`}
          >
            <h4 className="text-[10px] font-bold text-navy-blue uppercase tracking-wider mb-2 self-start">
              Page Index
            </h4>
            {pages.map((page) => (
              <button
                key={page.pageNum}
                onClick={() => scrollToPage(page.pageNum)}
                className={`relative w-36 aspect-[1/1.414] border-2 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-sig-green/50 transition p-2.5 flex flex-col justify-between overflow-hidden shadow-xs cursor-pointer ${currentPageNum === page.pageNum ? 'border-sig-green ring-3 ring-sig-green/10' : 'border-gray-200'}`}
              >
                <div className="flex-1 w-full text-[4px] leading-tight text-gray-400 text-left overflow-hidden pointer-events-none select-none">
                  {page.type === 'narrative' ? (
                    <div>
                      <div className="font-extrabold text-[5px] text-navy-blue mb-1">
                        PAGE {page.pageNum}
                      </div>
                      <div className="w-full h-1 bg-gray-200 rounded-full mb-1"></div>
                      <div className="w-5/6 h-1 bg-gray-200 rounded-full mb-1"></div>
                      <div className="w-4/5 h-1 bg-gray-200 rounded-full mb-1"></div>
                      <p className="mt-1 line-clamp-6 opacity-60 scale-75 origin-top-left font-semibold text-gray-650">
                        {page.content.replace(/<[^>]*>/g, '')}
                      </p>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between">
                      <div className="font-extrabold text-[5px] text-navy-blue mb-1">
                        EVIDENCE PG {page.pageNum}
                      </div>
                      <div className="grid grid-cols-2 gap-1 flex-1 items-center justify-center">
                        {page.photos.map((_, pIdx) => (
                          <div key={pIdx} className="bg-gray-200 rounded aspect-video flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-bold text-gray-500 self-center mt-1">
                  Page {page.pageNum}
                </span>
              </button>
            ))}
          </aside>

          {/* Central Scrollable Page Viewport */}
          <main
            ref={viewportRef}
            onScroll={handleViewportScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex-1 bg-slate-100 p-8 overflow-auto flex flex-col items-center gap-6 relative ${viewMode === 'pan' ? (isPanning ? 'cursor-grabbing' : 'cursor-grab select-none') : 'cursor-default'}`}
          >
            {pages.map((page, idx) => (
              <div
                key={page.pageNum}
                id={`doc-viewer-page-${page.pageNum}`}
                style={{
                  width: `${800 * zoomScale}px`,
                  height: `${1123 * zoomScale}px`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  flexShrink: 0
                }}
              >
                <div
                  className={`bg-white shadow-md border border-gray-200 text-left p-12 relative flex flex-col justify-between ${viewMode === 'select' ? 'select-text pointer-events-auto cursor-text' : 'select-none pointer-events-none'}`}
                  style={{
                    width: '800px',
                    height: '1123px',
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    boxSizing: 'border-box'
                  }}
                >
                  
                  {/* Page Top Content */}
                  <div className="w-full">
                    {/* First Page Institutional Header */}
                    {page.type === 'narrative' && idx === 0 ? (
                      <div>
                        {/* Header Title Banner */}
                        <div className="flex items-center space-x-3.5 border-b-2 border-sig-green pb-4 mb-6 select-none">
                          <img src={logo} alt="CES Logo" className="h-12 w-12 object-contain" />
                          <div className="flex flex-col text-left leading-none">
                            <span className="text-sm font-extrabold text-navy-blue tracking-wide uppercase">
                              DOMINICAN COLLEGE OF TARLAC, INC.
                            </span>
                            <span className="text-[11px] font-bold text-gray-600 uppercase mt-0.5">
                              Community Extension & Services (CES) Office
                            </span>
                            <span className="text-[8px] text-gray-400 mt-0.5">
                              Tarlac, Philippines · Official Document Archive
                            </span>
                          </div>
                        </div>

                        {/* Page 1 metadata grid details */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 border border-gray-150 p-4 rounded-2xl bg-gray-50/50 text-xs mb-6 font-poppins select-none">
                          <div>
                            <span className="text-[10px] text-navy-blue font-bold block">Extension Outreach Program:</span>
                            <span className="font-bold text-gray-800 text-[11px] truncate block">
                              {event ? event.name : report.activityTitle || 'Outreach'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-navy-blue font-bold block">Academic Schedule:</span>
                            <span className="font-semibold text-gray-800 block">
                              {report.semester} | AY {report.academicYear}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-navy-blue font-bold block">Department / Organization:</span>
                            <span className="font-semibold text-gray-800 block truncate">
                              {org ? org.name : report.organizationId ? 'Unknown' : 'CES Office'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-navy-blue font-bold block">Activity Details:</span>
                            <span className="font-semibold text-gray-800 block truncate">
                              {report.activityDate ? new Date(report.activityDate).toLocaleDateString() : ''} 
                              {report.location ? ` @ ${report.location}` : ''}
                            </span>
                          </div>
                          <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-gray-150 pt-2.5">
                            <div>
                              <span className="text-[10px] text-navy-blue font-bold block">Target Beneficiaries:</span>
                              <span className="font-semibold text-gray-800 block truncate">{report.beneficiaries || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-navy-blue font-bold block">Category:</span>
                              <span className="font-semibold text-gray-800 block capitalize">{(report.type || 'outreach').replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-navy-blue uppercase tracking-wider mb-3 pb-1.5 border-b border-gray-150 flex items-center gap-1.5 select-none">
                          <FileText className="w-3.5 h-3.5 text-sig-green" />
                          Activity Description Narrative
                        </h4>
                      </div>
                    ) : (
                      /* Subsequent Page Running Header */
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2.5 mb-6 text-[10px] text-gray-400 font-bold select-none">
                        <span className="flex items-center gap-1">
                          <img src={logo} className="h-4 w-4 object-contain" />
                          Community Extension & Services (CES)
                        </span>
                        <span>Page {page.pageNum}</span>
                      </div>
                    )}

                    {/* Page Content Body */}
                    {page.type === 'narrative' ? (
                      <div
                        className="prose prose-sm text-xs max-w-none text-gray-700 leading-relaxed font-poppins"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                      />
                    ) : (
                      /* Photos evidence page layout */
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-navy-blue uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none">
                          <Layers className="w-3.5 h-3.5 text-sig-green" />
                          Photographic Evidence Documentation
                        </h4>
                        
                        <div className={`grid ${page.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full`}>
                          {page.photos.map((photo, pIdx) => (
                            <div key={pIdx} className="border border-gray-100 p-2 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shadow-2xs">
                              <div className="w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-200">
                                <img
                                  src={photo.url}
                                  className="w-full h-full object-contain"
                                  alt="outreach evidence"
                                />
                              </div>
                              <span className="text-[9px] text-gray-500 font-bold mt-2">
                                Photo Documentation Item {idx * 4 - narrativePageCount * 4 + pIdx + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page Bottom Footer */}
                  <footer className="w-full border-t border-gray-100 pt-3 text-[9px] text-gray-400 font-bold flex justify-between select-none">
                    <span>Dominican College of Tarlac - Narrative Archival</span>
                    <span>Document Page {page.pageNum} of {pages.length}</span>
                  </footer>

                </div>
              </div>
            ))}
          </main>

          {/* Assessment & Actions Sidebar */}
          <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto shrink-0 flex flex-col justify-between select-none">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] text-sig-green font-bold uppercase tracking-wider">
                  Review & Assessment
                </span>
                <h3 className="text-base font-bold text-navy-blue mt-0.5">
                  Narrative Assessment
                </h3>
              </div>

              {/* Quick Details Cards */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <User className="w-4 h-4 text-navy-blue shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-gray-450 block font-bold uppercase">Submitted By</span>
                    <span className="text-[11px] font-bold text-navy-blue block leading-tight mt-0.5">
                      {author ? author.name : 'Coordinator'}
                    </span>
                    <span className="text-[9px] text-gray-500 block">
                      Submitted: {new Date(report.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <Calendar className="w-4 h-4 text-navy-blue shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-gray-450 block font-bold uppercase">Academic Term</span>
                    <span className="text-[11px] font-bold text-navy-blue block leading-tight mt-0.5">
                      {report.semester}
                    </span>
                    <span className="text-[9px] text-gray-500 block leading-tight">
                      AY {report.academicYear}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <MapPin className="w-4 h-4 text-navy-blue shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-gray-450 block font-bold uppercase">Location details</span>
                    <span className="text-[11px] font-bold text-navy-blue block leading-tight mt-0.5 truncate max-w-[200px]">
                      {report.location || 'Not Specified'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <Tag className="w-4 h-4 text-navy-blue shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-gray-450 block font-bold uppercase">Workflow Status</span>
                    <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                      report.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Input & Actions Panel */}
            <div className="border-t border-gray-150 pt-5 mt-6 space-y-4">
              {report.status === 'submitted' && (
                <>
                  <div className="text-left">
                    <label className="block text-gray-700 text-xs font-semibold mb-1">
                      Feedback/Revision Instructions <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={feedbackNote}
                      onChange={(e) => setFeedbackNote(e.target.value)}
                      placeholder="Specify required corrections clearly. Needed if returning for revision..."
                      className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-medium text-navy-blue placeholder-gray-400"
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => handleReviewReport('returned')}
                      disabled={loading}
                      className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-full font-bold text-xs py-2.5 transition duration-200 cursor-pointer text-center disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Return with Feedback'}
                    </button>
                    <button
                      onClick={() => handleReviewReport('approved')}
                      disabled={loading}
                      className="w-full bg-navy-blue text-white rounded-full font-bold text-xs py-2.5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition duration-200 cursor-pointer text-center disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Approve & Lock'}
                    </button>
                  </div>
                </>
              )}

              {report.status === 'approved' && (
                <div className="flex items-start space-x-2 text-green-700 bg-green-50/50 p-4 rounded-2xl border border-green-200/50 text-xs text-left">
                  <Check className="w-4.5 h-4.5 shrink-0 bg-green-600 text-white rounded-full p-0.5 mt-0.5" />
                  <div>
                    <span className="font-bold">Report Approved</span>
                    <p className="mt-1 text-green-600/80 leading-normal font-medium">
                      This narrative report has been reviewed, approved, and locked in the archives.
                    </p>
                  </div>
                </div>
              )}

              {report.status === 'returned' && (
                <div className="space-y-3.5 text-left font-poppins">
                  <div className="flex items-start space-x-2 text-amber-700 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50 text-xs">
                    <Clock className="w-4.5 h-4.5 shrink-0 text-amber-650 mt-0.5" />
                    <div>
                      <span className="font-bold">Returned for Revision</span>
                      <p className="mt-1 text-amber-650/80 leading-normal font-medium">
                        Returned to the office coordinator for revisions.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs border border-gray-150 p-3.5 rounded-2xl bg-gray-50 text-gray-600">
                    <strong className="text-navy-blue font-bold block mb-1">Active Revision Request:</strong>
                    <p className="font-semibold leading-relaxed text-gray-700">{report.adminFeedback}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  )
}
