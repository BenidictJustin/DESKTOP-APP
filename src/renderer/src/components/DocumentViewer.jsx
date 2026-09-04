import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  modalOverlayVariants,
  modalContentVariants,
  modalOverlayTransition,
  modalContentTransition
} from './motion/motionConfig'
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
  FileText,
  FileDown,
  Loader2,
  AlertCircle
} from 'lucide-react'
import logo from '../assets/logo.png'
import logo2Img from '../assets/logo2.png'
import { renderAsync } from 'docx-preview'
// Polyfill modern ECMAScript methods for PDF.js compatibility across all Chromium builds
if (typeof Map !== 'undefined' && !Map.prototype.getOrInsertComputed) {
  Map.prototype.getOrInsertComputed = function (key, callback) {
    if (this.has(key)) return this.get(key)
    const val = callback()
    this.set(key, val)
    return val
  }
}
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}
if (typeof Math !== 'undefined' && typeof Math.sumPrecise === 'undefined') {
  Math.sumPrecise = function (items) {
    let sum = 0
    for (const item of items) sum += Number(item) || 0
    return sum
  }
}

import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

// In-memory cache for native DOCX -> PDF converted preview buffers
const docxPdfPreviewCache = new Map()

import {
  sanitizeOklchInDocument,
  exportElementToPDF,
  printElementNative,
  resolveHeaderHtml,
  parseNarrativePages,
  downloadFileFromUrl,
  getDocxArrayBuffer,
  exportDocxToPDF,
  exportElementToDOCX
} from './editor/utils/editorHelpers'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Image } from '@tiptap/extension-image'
import MovableTable from './editor/extensions/MovableTable'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { TaskItem } from '@tiptap/extension-task-item'
import { TaskList } from '@tiptap/extension-task-list'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextStyle } from '@tiptap/extension-text-style'
import ImageResize from 'tiptap-extension-resize-image'

import { FontSizeExtension } from './editor/extensions/fontSize'
import { LineHeightExtension } from './editor/extensions/lineHeight'
import PageFlow from './editor/extensions/PageFlow'
import PageBreak from './editor/extensions/PageBreak'
import FloatingImage from './editor/extensions/FloatingImage'
import FloatingTextBox from './editor/extensions/FloatingTextBox'

const PAPER = {
  Letter: { w: 816, h: 1056 },
  Folio: { w: 816, h: 1248 },
  Legal: { w: 816, h: 1344 },
  A4: { w: 794, h: 1122 }
}

const MARGINS = {
  Normal: 96,
  Narrow: 48,
  Moderate: 72,
  Wide: 128,
  Narrative: { top: 96, bottom: 96, left: 144, right: 96 }
}

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
  loading = false,
  isExportOnly = false,
  exportFormat = 'pdf',
  onExportFinished
}) {
  // Viewer Settings State
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [currentPageNum, setCurrentPageNum] = useState(1)
  const [zoomScale, setZoomScale] = useState(1.0)
  const [viewMode, setViewMode] = useState('select') // 'select' or 'pan'

  const [narrativeTotalPages, setNarrativeTotalPages] = useState(1)

  // DOCX / PDF Direct View State
  const isDocxSubmission = Boolean(report?.submissionType === 'docx_upload' || report?.originalDocxUrl)
  const isPdfFile = Boolean(
    report?.fileType === 'pdf' ||
    report?.originalDocxName?.toLowerCase().endsWith('.pdf') ||
    report?.originalDocxUrl?.startsWith('data:application/pdf')
  )
  const [docxLoading, setDocxLoading] = useState(isDocxSubmission)
  const [docxError, setDocxError] = useState(null)
  const [docxPageCount, setDocxPageCount] = useState(1)
  const docxContainerRef = useRef(null)

  // Panning State
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  const viewportRef = useRef(null)

  // Helper to verify a buffer/typed array is valid and not detached
  const isBufferUsable = (buf) => {
    if (!buf) return false
    try {
      if (buf instanceof ArrayBuffer) return buf.byteLength > 0
      if (ArrayBuffer.isView(buf)) return Boolean(buf.buffer && buf.buffer.byteLength > 0 && buf.byteLength > 0)
      return false
    } catch {
      return false
    }
  }

  // Load and render DOCX or PDF file directly
  useEffect(() => {
    if (!isDocxSubmission || !report?.originalDocxUrl) return

    let isMounted = true
    setDocxLoading(true)
    setDocxError(null)

    const loadAndRenderDocument = async () => {
      try {
        const rawBuffer = await getDocxArrayBuffer(report.originalDocxUrl)
        if (!isBufferUsable(rawBuffer)) {
          throw new Error('Unable to read submitted document data.')
        }

        if (!docxContainerRef.current || !isMounted) return
        docxContainerRef.current.innerHTML = ''

        const cacheKey = report.id || (typeof report.originalDocxUrl === 'string' ? report.originalDocxUrl.slice(0, 100) : 'docx-doc')
        let pdfData = null

        if (isPdfFile) {
          pdfData = new Uint8Array(rawBuffer).slice()
        } else if (window.api?.convertDocxToPdfBuffer || window.electron?.ipcRenderer) {
          if (docxPdfPreviewCache.has(cacheKey)) {
            const cached = docxPdfPreviewCache.get(cacheKey)
            if (isBufferUsable(cached)) {
              // Hand out a fresh independent copy so cache is never mutated or detached
              pdfData = new Uint8Array(cached).slice()
            } else {
              docxPdfPreviewCache.delete(cacheKey)
            }
          }

          if (!pdfData && isBufferUsable(rawBuffer)) {
            try {
              // Pass a slice so rawBuffer is never detached by IPC structured clone
              const bufferCopy = rawBuffer.slice(0)
              const res = window.api?.convertDocxToPdfBuffer
                ? await window.api.convertDocxToPdfBuffer(bufferCopy)
                : await window.electron.ipcRenderer.invoke('convert-docx-to-pdf-buffer', { buffer: bufferCopy })
              if (res?.success && res?.buffer) {
                const freshBytes = new Uint8Array(res.buffer)
                if (isBufferUsable(freshBytes)) {
                  // Cache a clean copy and use a clean slice
                  docxPdfPreviewCache.set(cacheKey, freshBytes.slice())
                  pdfData = freshBytes.slice()
                }
              }
            } catch (convErr) {
              console.warn('Native DOCX preview conversion failed, will attempt docx-preview fallback:', convErr)
            }
          }
        }

        let renderedWithPdf = false
        if (pdfData && isBufferUsable(pdfData)) {
          try {
            // ALWAYS pass an isolated slice to pdfjsLib so worker transfer never detaches pdfData or cache
            const workerData = new Uint8Array(pdfData).slice()
            const loadingTask = pdfjsLib.getDocument({ data: workerData })
            const pdf = await loadingTask.promise
            if (!isMounted) return

            const numPages = pdf.numPages
            const wrapper = document.createElement('div')
            wrapper.className = 'docx-wrapper pdf-wrapper'

            for (let i = 1; i <= numPages; i++) {
              if (!isMounted) return
              const page = await pdf.getPage(i)
              // Render at 2.0 scale for ultra-crisp display on all DPIs
              const viewport = page.getViewport({ scale: 2.0 })

              const section = document.createElement('section')
              section.className = 'docx pdf-page-section'
              section.id = `docx-page-${i}`
              section.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)'
              section.style.margin = '0 auto 28px auto'
              section.style.background = '#ffffff'
              section.style.boxSizing = 'border-box'
              section.style.position = 'relative'
              section.style.width = `${viewport.width / 2.0}px`
              section.style.minHeight = `${viewport.height / 2.0}px`
              section.style.overflow = 'hidden'

              const canvas = document.createElement('canvas')
              canvas.width = viewport.width
              canvas.height = viewport.height
              canvas.style.width = '100%'
              canvas.style.height = 'auto'
              canvas.style.display = 'block'

              const canvasContext = canvas.getContext('2d')
              await page.render({ canvasContext, viewport }).promise

              section.appendChild(canvas)
              wrapper.appendChild(section)
            }

            if (!isMounted) return
            docxContainerRef.current.appendChild(wrapper)
            setDocxPageCount(numPages)
            setDocxLoading(false)
            renderedWithPdf = true
          } catch (pdfErr) {
            console.warn('PDF.js rendering encountered an error, falling back to docx-preview:', pdfErr)
            docxPdfPreviewCache.delete(cacheKey)
            if (docxContainerRef.current) {
              docxContainerRef.current.innerHTML = ''
            }
          }
        }

        if (!renderedWithPdf) {
          if (!docxContainerRef.current || !isMounted) return
          if (!isBufferUsable(rawBuffer)) {
            throw new Error('Document buffer is invalid or unavailable.')
          }

          docxContainerRef.current.innerHTML = ''
          // Fallback: Render DOCX document using docx-preview with a fresh buffer slice
          await renderAsync(rawBuffer.slice(0), docxContainerRef.current, null, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: true,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
            renderAltChunks: true
          })

          if (!isMounted) return

          const pageSections = docxContainerRef.current.querySelectorAll('section.docx')
          pageSections.forEach((section, idx) => {
            section.id = `docx-page-${idx + 1}`
            section.style.boxShadow = '0 10px 30px rgba(0,0,0,0.12)'
            section.style.marginBottom = '28px'
            section.style.background = '#ffffff'
            section.style.boxSizing = 'border-box'
            section.style.position = 'relative'
          })

          setDocxPageCount(pageSections.length || 1)
          setDocxLoading(false)
        }
      } catch (err) {
        console.error('Failed to render document preview in DocumentViewer:', err)
        if (isMounted) {
          setDocxError(err.message || 'Failed to render document')
          setDocxLoading(false)
        }
      }
    }

    loadAndRenderDocument()

    return () => {
      isMounted = false
    }
  }, [isDocxSubmission, isPdfFile, report?.originalDocxUrl, report?.id])

  // Keyboard shortcut listener for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Resolve metadata fields
  const event = eventsList.find((e) => e.id === report.eventId)
  const org = orgsList.find((o) => o.id === report.organizationId)
  const author = usersList.find((u) => u.uid === report.authorId)

  // Layout settings with fallbacks
  const defaultHeader = `<table style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;font-family:'Times New Roman',Times,serif;table-layout:fixed;"><tbody><tr><td style="width:0.85in;vertical-align:middle;border:none;padding:0;text-align:left;"><img src="${logo2Img}" style="height:0.82in;width:0.82in;object-fit:contain;display:block;" /></td><td style="width:0.95in;vertical-align:middle;border:none;padding:0 0.08in 0 0.04in;text-align:left;"><img src="${logo}" style="height:0.82in;width:0.82in;object-fit:contain;display:block;" /></td><td style="width:auto;text-align:left;vertical-align:middle;border:none;border-left:1.5px solid #777777;padding:0 0 0 0.12in;line-height:1.2;"><div style="font-family:'Times New Roman',Times,serif;font-variant:small-caps;font-size:14pt;font-weight:bold;color:#262626;letter-spacing:0.3px;margin:0 0 1px 0;">Dominican College Of Tarlac, Inc.</div><div style="font-family:'Times New Roman',Times,serif;font-size:10.5pt;font-weight:normal;color:#404040;letter-spacing:0.5px;margin:0 0 2px 0;">COMMUNITY EXTENSION SERVICES</div><div style="font-family:'Times New Roman',serif;font-size:9pt;color:#404040;margin:0 0 1px 0;line-height:1.2;">McArthur Highway, Poblacion (Sto. Rosario), Capas, 2315 Tarlac, Philippines</div><div style="font-family:'Times New Roman',serif;font-size:9pt;color:#404040;margin:0 0 1px 0;line-height:1.2;">Institutional Contact No.: +63938-918-4093</div><div style="font-family:'Times New Roman',serif;font-size:9pt;color:#404040;margin:0;line-height:1.2;white-space:nowrap;">Website: dct.edu.ph | E-mail: <span style="color:#0563c1;text-decoration:underline;">domct_2315@yahoo.com.ph / domct_2315@dct.edu.ph</span></div></td></tr></tbody></table><hr style="border:none;border-top:2.5px solid #8e9092;margin:6px 0 0 0;width:100%;" />`
  const defaultFooter = `<hr style="border:none;border-top:2.5px solid #8e9092;margin:0 0 6px 0;width:100%;" /><div style="text-align:center;font-family:'Times New Roman',Times,serif;line-height:1.25;color:#404040;"><div style="font-size:10.5pt;font-weight:bold;margin:0 0 2px 0;letter-spacing:0.5px;">FIDES. PATRIA. SAPIENTIA</div><div style="font-size:9pt;font-style:italic;margin:0 0 2px 0;color:#555;">A God-loving educational community with passion for truth and compassion for humanity.</div><div style="font-size:9pt;margin:0;color:#555;">Department/Office Facebook Page: www.facebook.com/dctces</div></div>`

  const rawHeader = report.headerText !== undefined ? report.headerText : defaultHeader
  const headerText = resolveHeaderHtml(rawHeader, logo2Img, logo)
  const footerText = report.footerText !== undefined ? report.footerText : defaultFooter
  const showHeader = report.showHeader !== undefined ? report.showHeader : true
  const showFooter = report.showFooter !== undefined ? report.showFooter : true
  const paperKey = report.paperKey || 'Folio'
  const orientation = report.orientation || 'portrait'
  const marginKey = report.marginKey || 'Narrative'
  const isTemplateActive = report.isTemplateActive !== undefined ? report.isTemplateActive : true

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
  const gapH = 36

  const paper = PAPER[paperKey] || PAPER.Letter
  const docW = orientation === 'landscape' ? paper.h : paper.w
  const docH = orientation === 'landscape' ? paper.w : paper.h

  const canvasHeight = docH * narrativeTotalPages + gapH * (narrativeTotalPages - 1)
  const totalHeight = canvasHeight

  // Read-only Editor Instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true }),
      Highlight.configure({ multicolor: true }),
      FloatingImage,
      FloatingTextBox,
      MovableTable.configure({ resizable: false }),
      TableCell,
      TableHeader,
      TableRow,
      TaskItem.configure({ nested: true }),
      TaskList,
      PageFlow,
      PageBreak
    ],
    content: report.narrative || '<p></p>',
    editable: false
  })

  const handlePageChange = useCallback((cur, tot) => {
    setNarrativeTotalPages(tot)
  }, [])

  useEffect(() => {
    if (editor && !editor.isDestroyed && editor.commands.updatePageFlowOptions) {
      editor.commands.updatePageFlowOptions({
        paperKey,
        orientation,
        marginKey,
        headerText,
        footerText,
        showHeader,
        showFooter,
        isTemplateActive,
        onPageChange: handlePageChange
      })
    }
  }, [
    editor,
    paperKey,
    orientation,
    marginKey,
    headerText,
    footerText,
    showHeader,
    showFooter,
    isTemplateActive,
    handlePageChange
  ])

  useEffect(() => {
    if (editor && report?.narrative) {
      editor.commands.setContent(report.narrative)
    }
  }, [editor, report?.narrative])

  // Pre-generate pages for indexing and sidebar
  const pages = []
  for (let i = 1; i <= narrativeTotalPages; i++) {
    pages.push({
      type: 'narrative',
      pageNum: i
    })
  }

  const photoPages = []
  if (report.photos && report.photos.length > 0) {
    const photoChunks = []
    const chunkSize = 4
    for (let i = 0; i < report.photos.length; i += chunkSize) {
      photoChunks.push(report.photos.slice(i, i + chunkSize))
    }

    photoChunks.forEach((photos, index) => {
      const pageNum = narrativeTotalPages + index + 1
      const pageObj = {
        type: 'photos',
        photos,
        pageNum
      }
      pages.push(pageObj)
      photoPages.push(pageObj)
    })
  }

  const totalDocPages = isDocxSubmission ? Math.max(1, docxPageCount) : pages.length

  // Scroll viewport to a specific page
  const scrollToPage = (pageNum) => {
    if (isDocxSubmission) {
      const docxPageEl = document.getElementById(`docx-page-${pageNum}`)
      if (docxPageEl && viewportRef.current) {
        docxPageEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setCurrentPageNum(pageNum)
      }
      return
    }
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
    if (currentPageNum < totalDocPages) {
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

    if (isDocxSubmission) {
      const sections = docxContainerRef.current?.querySelectorAll('section.docx') || []
      sections.forEach((sec, idx) => {
        const elRect = sec.getBoundingClientRect()
        const diff = Math.abs(elRect.top - viewportRect.top)
        if (diff < minDiff) {
          minDiff = diff
          activePage = idx + 1
        }
      })
      setCurrentPageNum(activePage)
      return
    }

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

  const handleDownloadPDF = async () => {
    if (!viewportRef?.current) {
      alert('Report viewport not available.')
      return
    }
    try {
      const reportName = (
        report.originalDocxName?.replace(/\.(docx|pdf)$/i, '') ||
        report.activityTitle ||
        report.title ||
        event?.name ||
        `CES_Narrative_Report_${report.academicYear || 'AY'}`
      ).replace(/[^a-zA-Z0-9_-]+/g, '_')

      await exportElementToPDF(
        viewportRef.current,
        reportName,
        { isDocument: true, paperKey, orientation, marginKey, paperW: docW, paperH: docH }
      )
    } catch (err) {
      console.error('DocumentViewer PDF export failed:', err)
      alert('Failed to download PDF: ' + (err.message || err))
    }
  }

  const handleDownloadDOCX = async () => {
    if (!viewportRef?.current) {
      alert('Report viewport not available.')
      return
    }
    try {
      const reportName = (
        report.originalDocxName?.replace(/\.(docx|pdf)$/i, '') ||
        report.activityTitle ||
        report.title ||
        event?.name ||
        `CES_Narrative_Report_${report.academicYear || 'AY'}`
      ).replace(/[^a-zA-Z0-9_-]+/g, '_')

      await exportElementToDOCX(
        viewportRef.current,
        reportName,
        { isDocument: true, paperKey, orientation, marginKey, paperW: docW, paperH: docH }
      )
    } catch (err) {
      console.error('DocumentViewer DOCX export failed:', err)
      alert('Failed to download DOCX: ' + (err.message || err))
    }
  }

  // Single download action: directly downloads file if uploaded submission, otherwise exports PDF
  const handleDownloadDocument = async () => {
    if (isDocxSubmission && report?.originalDocxUrl) {
      downloadFileFromUrl(
        report.originalDocxUrl,
        report.originalDocxName || `${report.activityTitle || 'Report'}.${isPdfFile ? 'pdf' : 'docx'}`
      )
      return
    }
    await handleDownloadPDF()
  }

  // Auto-download for export-only hidden viewer
  useEffect(() => {
    if (!isExportOnly) return

    // Uploaded DOCX / PDF Submission Export
    if (isDocxSubmission && report?.originalDocxUrl) {
      if (isPdfFile) {
        downloadFileFromUrl(
          report.originalDocxUrl,
          report.originalDocxName || `${report.activityTitle || 'Report'}.pdf`
        )
        if (typeof onExportFinished === 'function') onExportFinished()
        return
      }

      if (!docxLoading && docxContainerRef.current) {
        const timer = setTimeout(async () => {
          try {
            if (exportFormat === 'docx') {
              downloadFileFromUrl(
                report.originalDocxUrl,
                report.originalDocxName || `${report.activityTitle || 'Report'}.docx`
              )
            } else {
              const reportFileName = (
                report.originalDocxName?.replace(/\.docx$/i, '') ||
                report.activityTitle ||
                'CES_Report'
              ).replace(/[^a-zA-Z0-9_-]+/g, '_')

              await exportElementToPDF(docxContainerRef.current, reportFileName, {
                isDocument: true
              })
            }
          } catch (err) {
            console.error('Failed to export DOCX, falling back to direct download:', err)
            downloadFileFromUrl(
              report.originalDocxUrl,
              report.originalDocxName || `${report.activityTitle || 'Report'}.docx`
            )
          } finally {
            if (typeof onExportFinished === 'function') {
              onExportFinished()
            }
          }
        }, 800)
        return () => clearTimeout(timer)
      }
      return
    }

    // Standard Tiptap Narrative Report Export (Built-in templates)
    if (editor && narrativeTotalPages > 0) {
      const timer = setTimeout(async () => {
        try {
          if (exportFormat === 'docx') {
            await handleDownloadDOCX()
          } else {
            await handleDownloadPDF()
          }
        } finally {
          if (typeof onExportFinished === 'function') {
            onExportFinished()
          }
        }
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [isExportOnly, exportFormat, isDocxSubmission, isPdfFile, docxLoading, editor, narrativeTotalPages])

  // Native Printable Content using Electron print-document IPC
  const handlePrint = async () => {
    const traceId = `PRINT-${Date.now()}`
    console.log(`%c══════════════════════════════════════`, 'color: #7c3aed; font-weight: bold; font-size: 16px;')
    console.log(`%c[${traceId}] STEP 0: PRINT BUTTON CLICKED`, 'color: #7c3aed; font-weight: bold; font-size: 16px;')
    console.log(`%c[${traceId}] handlePrint() entered (NOT handleDownloadPDF)`, 'color: #7c3aed; font-weight: bold; font-size: 14px;')
    console.log(`%c[${traceId}] This function calls printElementNative → ipcRenderer.invoke('print-document') → webContents.print()`, 'color: #7c3aed; font-size: 12px;')
    console.log(`%c[${traceId}] exportElementToPDF is NOT called. No PDF file will be created.`, 'color: #dc2626; font-weight: bold; font-size: 14px;')
    console.log(`%c══════════════════════════════════════`, 'color: #7c3aed; font-weight: bold; font-size: 16px;')

    if (!viewportRef?.current) {
      alert('Report viewport not available for printing.')
      return
    }

    try {
      const title = `${report.activityTitle || 'Report'}`
      const targetPrintElement = isDocxSubmission && docxContainerRef.current ? docxContainerRef.current : viewportRef.current
      await printElementNative(targetPrintElement, title, {
        isDocument: true,
        traceId,
        paperKey,
        orientation,
        marginKey,
        paperW: docW,
        paperH: docH
      })
    } catch (err) {
      console.error(`[${traceId}] Print failed:`, err)
      alert('Failed to print document: ' + (err.message || err))
    }
  }

  if (isExportOnly) {
    if (isDocxSubmission) {
      return (
        <main
          ref={viewportRef}
          className="print-canvas-only"
          style={{
            width: '816px',
            minHeight: '1000px',
            overflow: 'visible',
            position: 'relative',
            background: '#ffffff'
          }}
        >
          <div ref={docxContainerRef} className="w-full" />
        </main>
      )
    }

    return (
      <main
        ref={viewportRef}
        className="print-canvas-only"
        style={{
          width: `${docW}px`,
          height: `${totalHeight}px`,
          overflow: 'visible',
          position: 'relative'
        }}
      >
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
            min-height: 100% !important;
            outline: none !important;
            box-sizing: border-box !important;
            white-space: pre-wrap !important;
            word-wrap: break-word !important;
            padding: 0 !important;
            background-color: transparent !important;
            background-image: none !important;
            font-size: 13px;
            line-height: 1.5;
            color: #1f2937;
            font-family: 'Calibri', sans-serif;
            overflow: visible !important;
          }
          .reactjs-tiptap-editor .ProseMirror.ProseMirror.ProseMirror {
            min-height: ${docH - (padTopActual + padBottom)}px !important;
          }
          .doc-page .ProseMirror {
            min-height: ${docH - (padTopActual + padBottom)}px;
          }
          .page-break-widget {
            position: relative;
            margin-left: -${padLeft}px;
            margin-right: -${padRight}px;
            background: transparent;
            pointer-events: none;
            user-select: none;
          }
          .page-break {
            display: none !important;
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
          .ProseMirror ul[data-type="taskList"] li > label { margin-top: 2px; }
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
          .ProseMirror table.movable-table th {
            background: #f3f4f6;
            font-weight: 600;
          }
          .ProseMirror table.movable-table tr:nth-child(even) td {
            background: #fafafa;
          }
          .ProseMirror hr { border: none; border-top: 1px solid #d1d5db; margin: 14px 0; }
          .ProseMirror mark { padding: 1px 2px; border-radius: 2px; }
          .ProseMirror a { color: #2563eb; text-decoration: underline; }
          .ProseMirror sub { font-size: 0.75em; }
          .ProseMirror sup { font-size: 0.75em; }

          /* ── High-Fidelity DOCX Preview Layout (Unpolluted by Tailwind) ── */
          .docx-render-target {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .docx-render-target .docx-wrapper {
            background: transparent !important;
            padding: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            width: 100% !important;
          }
          .docx-render-target .docx-wrapper > section.docx,
          .docx-render-target section.docx {
            background: #ffffff !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12) !important;
            margin-bottom: 28px !important;
            position: relative !important;
          }
          .docx-render-target table {
            border-collapse: collapse;
            border-spacing: 0;
          }
          .docx-render-target img {
            display: inline-block;
            vertical-align: baseline;
          }
          .docx-render-target svg {
            display: inline-block;
            vertical-align: baseline;
          }
          .docx-render-target p {
            min-height: 1em;
          }
        `}</style>

        <div
          style={{
            width: `${docW}px`,
            height: `${totalHeight}px`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflow: 'visible',
            position: 'relative',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: `${docW}px`,
              height: `${totalHeight}px`,
              outline: 'none',
              position: 'relative'
            }}
          >
            <div
              style={{ width: `${docW}px`, height: `${canvasHeight}px`, position: 'relative' }}
              className="print-canvas"
            >
              <div className="absolute inset-0 pointer-events-none select-none flex flex-col items-center">
                {Array.from({ length: narrativeTotalPages }).map((_, i) => {
                  const pageNum = i + 1
                  return (
                    <div
                      key={i}
                      id={`doc-viewer-page-${pageNum}`}
                      className="bg-white shadow-xl border border-gray-300/70 rounded-xs shrink-0 relative pointer-events-auto"
                      style={{
                        width: `${docW}px`,
                        height: `${docH}px`,
                        marginBottom: `${gapH}px`
                      }}
                    >
                      {showHeader && (
                        <div
                          className="absolute left-0 right-0 z-50 pointer-events-none select-none"
                          style={{
                            top: `${padTop}px`,
                            paddingLeft: `${padLeft}px`,
                            paddingRight: `${padRight}px`,
                            boxSizing: 'border-box'
                          }}
                          dangerouslySetInnerHTML={{
                            __html:
                              resolveHeaderHtml(headerText, logo2Img, logo) ||
                              '<div style="min-height: 20px;"></div>'
                          }}
                        />
                      )}

                      {showFooter && (
                        <div
                          className="absolute left-0 right-0 z-50 pointer-events-none select-none"
                          style={{
                            bottom: '0px',
                            paddingLeft: `${padLeft}px`,
                            paddingRight: `${padRight}px`,
                            paddingBottom: '24px',
                            boxSizing: 'border-box'
                          }}
                          dangerouslySetInnerHTML={{
                            __html:
                              resolveHeaderHtml(footerText, logo2Img, logo) ||
                              '<div style="min-height: 20px;"></div>'
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              <div
                className="relative doc-page select-text"
                style={{
                  width: `${docW}px`,
                  minHeight: `${canvasHeight}px`,
                  paddingTop: `${padTopActual}px`,
                  paddingBottom: `${padBottom}px`,
                  paddingLeft: `${padLeft}px`,
                  paddingRight: `${padRight}px`,
                  background: 'transparent',
                  boxSizing: 'border-box',
                  cursor: 'text'
                }}
              >
                {editor && <EditorContent editor={editor} className="outline-none" />}
              </div>
            </div>
          </div>
        </div>

        {photoPages.map((page, pIdx) => (
          <div
            key={page.pageNum}
            id={`doc-viewer-page-${page.pageNum}`}
            style={{
              width: `${docW}px`,
              height: `${docH}px`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              flexShrink: 0,
              marginTop: `${gapH}px`
            }}
          >
            <div
              className="bg-white shadow-xl border border-gray-300/70 rounded-xs text-left relative flex flex-col justify-between"
              style={{
                width: `${docW}px`,
                height: `${docH}px`,
                boxSizing: 'border-box',
                paddingTop: `${padTop}px`,
                paddingBottom: `${padBottom}px`,
                paddingLeft: `${padLeft}px`,
                paddingRight: `${padRight}px`
              }}
            >
              {showHeader && (
                <div
                  style={{
                    paddingBottom: '12px',
                    marginBottom: '20px',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '9px',
                    color: '#94a3b8',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: 'sans-serif'
                  }}
                >
                  <span>CES Narrative Report - Photographic Evidence</span>
                  <span>Page {page.pageNum}</span>
                </div>
              )}

              <div className="space-y-4 flex-1">
                <h4 className="text-xs font-bold text-navy-blue uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none font-poppins">
                  <Layers className="w-3.5 h-3.5 text-sig-green" />
                  Photographic Evidence Documentation
                </h4>

                <div
                  className={`grid ${page.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full`}
                >
                  {page.photos.map((photo, pIdx2) => (
                    <div
                      key={pIdx2}
                      className="border border-gray-100 p-2 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shadow-2xs"
                    >
                      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-200">
                        <img
                          src={photo.url}
                          className="w-full h-full object-contain"
                          alt="outreach evidence"
                        />
                      </div>
                      <span className="text-[9px] text-gray-550 font-bold mt-2 font-poppins">
                        Photo Documentation Item {pIdx * 4 + pIdx2 + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {showFooter && (
                <footer className="w-full border-t border-gray-100 pt-3 text-[9px] text-gray-400 font-bold flex justify-between select-none font-poppins">
                  <span>Dominican College of Tarlac - Narrative Archival</span>
                  <span>
                    Document Page {page.pageNum} of {pages.length}
                  </span>{' '}
                </footer>
              )}
            </div>
          </div>
        ))}
      </main>
    )
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-navy-blue/40 backdrop-blur-md flex items-center justify-center p-3 md:p-6 z-9999 font-poppins text-slate-800 doc-viewer-modal"
      variants={modalOverlayVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={modalOverlayTransition}
    >
      <motion.div
        className="w-full max-w-350 h-[92vh] max-h-240 bg-[#f8fafc] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-white/60 doc-viewer"
        variants={modalContentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={modalContentTransition}
      >
        {/* ==================================================== */}
        {/* TOP BAR / VIEWBAR TOOLBAR */}
        {/* ==================================================== */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-xs">
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
                Narrative Report
              </span>
              <span className="text-[10px] font-semibold text-sig-green uppercase tracking-wider">

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
                {currentPageNum} / {totalDocPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPageNum >= totalDocPages}
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
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:text-navy-blue"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownloadDocument}
              className="p-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 rounded-xl transition cursor-pointer flex items-center justify-center shadow-2xs hover:text-navy-blue"
              title={isDocxSubmission ? (isPdfFile ? 'Download PDF Document' : 'Download Original DOCX File') : 'Download Document'}
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <button
              onClick={onClose}
              className="p-2.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white border border-red-200/80 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-center font-bold shadow-xs shrink-0 ml-2"
              title="Close Inspect (Esc)"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
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
            {isDocxSubmission ? (
              docxLoading ? (
                <div className="flex flex-col items-center justify-center p-6 text-gray-400 gap-2 text-center select-none">
                  <Loader2 className="w-5 h-5 animate-spin text-navy-blue" />
                  <span className="text-[10px] font-semibold text-navy-blue">
                    Rendering {isPdfFile ? 'PDF' : 'DOCX'}...
                  </span>
                </div>
              ) : (
                Array.from({ length: docxPageCount }).map((_, idx) => {
                  const pNum = idx + 1
                  return (
                    <button
                      key={`docx-thumb-${pNum}`}
                      onClick={() => scrollToPage(pNum)}
                      className={`relative w-36 aspect-[1/1.414] border-2 rounded-xl bg-white hover:bg-gray-50 hover:border-sig-green/50 transition p-2.5 flex flex-col justify-between overflow-hidden shadow-xs cursor-pointer ${
                        currentPageNum === pNum
                          ? 'border-sig-green ring-3 ring-sig-green/10'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex-1 w-full flex flex-col items-center justify-center text-gray-400 select-none">
                        <FileText className={`w-6 h-6 mb-1 ${isPdfFile ? 'text-red-500' : 'text-blue-500'}`} />
                        <span className="text-[8px] font-bold text-navy-blue uppercase tracking-wider">
                          PAGE {pNum}
                        </span>
                        <span className={`text-[7px] font-semibold ${isPdfFile ? 'text-red-600' : 'text-blue-600'}`}>
                          {isPdfFile ? 'PDF Document' : 'Word Layout'}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 self-center mt-1 select-none">
                        Page {pNum}
                      </span>
                    </button>
                  )
                })
              )
            ) : (
              pages.map((page) => (
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
                      <div className="w-full h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-2/3 h-1 bg-gray-100 rounded-full mb-1"></div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col justify-between">
                      <div className="font-extrabold text-[5px] text-navy-blue mb-1">
                        EVIDENCE PG {page.pageNum}
                      </div>
                      <div className="grid grid-cols-2 gap-1 flex-1 items-center justify-center">
                        {page.photos.map((_, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-gray-200 rounded aspect-video flex items-center justify-center"
                          >
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
            ))
            )}
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
            {/* CSS styles to overlay Tiptap pages */}
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
                min-height: 100% !important;
                outline: none !important;
                box-sizing: border-box !important;
                white-space: pre-wrap !important;
                word-wrap: break-word !important;
                padding: 0 !important;
                background-color: transparent !important;
                background-image: none !important;
                font-size: 13px;
                line-height: 1.5;
                color: #1f2937;
                font-family: 'Calibri', sans-serif;
                overflow: visible !important;
              }
              .reactjs-tiptap-editor .ProseMirror.ProseMirror.ProseMirror {
                min-height: ${docH - (padTopActual + padBottom)}px !important;
              }
              .doc-page .ProseMirror {
                min-height: ${docH - (padTopActual + padBottom)}px;
              }
              .page-break-widget {
                position: relative;
                margin-left: -${padLeft}px;
                margin-right: -${padRight}px;
                background: transparent;
                pointer-events: none;
                user-select: none;
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
              .ProseMirror ul[data-type="taskList"] li > label { margin-top: 2px; }
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
              .ProseMirror table.movable-table th {
                background: #f3f4f6;
                font-weight: 600;
              }
              .ProseMirror table.movable-table tr:nth-child(even) td {
                background: #fafafa;
              }
              .ProseMirror hr { border: none; border-top: 1px solid #d1d5db; margin: 14px 0; }
              .ProseMirror mark { padding: 1px 2px; border-radius: 2px; }
              .ProseMirror a { color: #2563eb; text-decoration: underline; }
              .ProseMirror sub { font-size: 0.75em; }
              .ProseMirror sup { font-size: 0.75em; }

              /* Live DOCX / PDF Preview Styles */
              .docx-render-target .docx-wrapper {
                background: transparent !important;
                padding: 0 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 28px !important;
              }
              .docx-render-target .docx-wrapper > section.docx {
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08) !important;
                border: 1px solid rgba(209, 213, 219, 0.8) !important;
                border-radius: 4px !important;
                background: #ffffff !important;
                margin: 0 auto 28px auto !important;
                box-sizing: border-box !important;
              }
              .docx-render-target section.pdf-page-section {
                padding: 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                overflow: hidden !important;
              }
              .docx-render-target section.pdf-page-section canvas {
                width: 100% !important;
                height: auto !important;
                display: block !important;
              }
              .docx-render-target table {
                border-collapse: collapse !important;
              }
            `}</style>

            {/* 1. Narrative Content (Tiptap Canvas layout or Direct DOCX Live View) */}
            {isDocxSubmission ? (
              <div className="w-full flex flex-col items-center justify-start min-h-full py-8 px-4">
                {docxLoading && (
                  <div className="flex flex-col items-center justify-center py-28 gap-3 select-none">
                    <Loader2 className="w-9 h-9 animate-spin text-navy-blue" />
                    <h4 className="text-sm font-bold text-navy-blue">
                      Loading and rendering submitted document...
                    </h4>
                  </div>
                )}

                {docxError && !docxLoading && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md my-12 shadow-sm">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-red-800">Failed to render {isPdfFile ? 'PDF' : 'DOCX'} content</h4>
                    <p className="text-xs text-red-600 mt-1">{docxError}</p>
                    {report?.originalDocxUrl && (
                      <button
                        onClick={() =>
                          downloadFileFromUrl(
                            report.originalDocxUrl,
                            report.originalDocxName || `${report.activityTitle || 'Report'}.${isPdfFile ? 'pdf' : 'docx'}`
                          )
                        }
                        className={`mt-4 px-4 py-2 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${isPdfFile ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Original (.{isPdfFile ? 'pdf' : 'docx'})</span>
                      </button>
                    )}
                  </div>
                )}

                {/* DOCX Live Rendered Pages */}
                <div
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top center',
                    display: docxLoading || docxError ? 'none' : 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    transition: 'transform 0.15s ease-out'
                  }}
                >
                  <div ref={docxContainerRef} className="docx-render-target w-full" />
                </div>
              </div>
            ) : (
              <>
                <div
              style={{
                width: `${docW * zoomScale}px`,
                height: `${totalHeight * zoomScale}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                overflow: 'visible',
                position: 'relative',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: 'top center',
                  width: `${docW}px`,
                  height: `${totalHeight}px`,
                  outline: 'none',
                  position: 'relative'
                }}
              >
                <div
                  style={{ width: `${docW}px`, height: `${canvasHeight}px`, position: 'relative' }}
                  className="print-canvas"
                >
                  {/* Page background sheets */}
                  <div className="absolute inset-0 pointer-events-none select-none flex flex-col items-center">
                    {Array.from({ length: narrativeTotalPages }).map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <div
                          key={i}
                          id={`doc-viewer-page-${pageNum}`}
                          className="bg-white shadow-xl border border-gray-300/70 rounded-xs shrink-0 relative pointer-events-auto"
                          style={{
                            width: `${docW}px`,
                            height: `${docH}px`,
                            marginBottom: `${gapH}px`
                          }}
                        >
                          {/* Page Header */}
                          {showHeader && (
                            <div
                              className="absolute left-0 right-0 z-50 pointer-events-none select-none"
                              style={{
                                top: `${padTop}px`,
                                paddingLeft: `${padLeft}px`,
                                paddingRight: `${padRight}px`,
                                boxSizing: 'border-box'
                              }}
                              dangerouslySetInnerHTML={{
                                __html:
                                  resolveHeaderHtml(headerText, logo2Img, logo) ||
                                  '<div style="min-height: 20px;"></div>'
                              }}
                            />
                          )}

                          {/* Page Footer */}
                          {showFooter && (
                            <div
                              className="absolute left-0 right-0 z-50 pointer-events-none select-none"
                              style={{
                                bottom: '0px',
                                paddingLeft: `${padLeft}px`,
                                paddingRight: `${padRight}px`,
                                paddingBottom: '24px',
                                boxSizing: 'border-box'
                              }}
                              dangerouslySetInnerHTML={{
                                __html:
                                  resolveHeaderHtml(footerText, logo2Img, logo) ||
                                  '<div style="min-height: 20px;"></div>'
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Editor Content Area */}
                  <div
                    className="relative doc-page select-text"
                    style={{
                      width: `${docW}px`,
                      minHeight: `${canvasHeight}px`,
                      paddingTop: `${padTopActual}px`,
                      paddingBottom: `${padBottom}px`,
                      paddingLeft: `${padLeft}px`,
                      paddingRight: `${padRight}px`,
                      background: 'transparent',
                      boxSizing: 'border-box',
                      cursor: 'text'
                    }}
                  >
                    {editor && <EditorContent editor={editor} className="outline-none" />}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Photo Evidence Pages */}
            {photoPages.map((page, pIdx) => (
              <div
                key={page.pageNum}
                id={`doc-viewer-page-${page.pageNum}`}
                style={{
                  width: `${docW * zoomScale}px`,
                  height: `${docH * zoomScale}px`,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  flexShrink: 0
                }}
              >
                <div
                  className="bg-white shadow-xl border border-gray-300/70 rounded-xs text-left relative flex flex-col justify-between"
                  style={{
                    width: `${docW}px`,
                    height: `${docH}px`,
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'top left',
                    boxSizing: 'border-box',
                    paddingTop: `${padTop}px`,
                    paddingBottom: `${padBottom}px`,
                    paddingLeft: `${padLeft}px`,
                    paddingRight: `${padRight}px`
                  }}
                >
                  {/* Photo Header */}
                  {showHeader && (
                    <div
                      style={{
                        paddingBottom: '12px',
                        marginBottom: '20px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '9px',
                        color: '#94a3b8',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: 'sans-serif'
                      }}
                    >
                      <span>CES Narrative Report - Photographic Evidence</span>
                      <span>Page {page.pageNum}</span>
                    </div>
                  )}

                  {/* Photo Grid content */}
                  <div className="space-y-4 flex-1">
                    <h4 className="text-xs font-bold text-navy-blue uppercase tracking-wider mb-2 flex items-center gap-1.5 select-none font-poppins">
                      <Layers className="w-3.5 h-3.5 text-sig-green" />
                      Photographic Evidence Documentation
                    </h4>

                    <div
                      className={`grid ${page.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-4 w-full`}
                    >
                      {page.photos.map((photo, pIdx2) => (
                        <div
                          key={pIdx2}
                          className="border border-gray-100 p-2 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shadow-2xs"
                        >
                          <div className="w-full aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border border-gray-200">
                            <img
                              src={photo.url}
                              className="w-full h-full object-contain"
                              alt="outreach evidence"
                            />
                          </div>
                          <span className="text-[9px] text-gray-550 font-bold mt-2 font-poppins">
                            Photo Documentation Item {pIdx * 4 + pIdx2 + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Photo Footer */}
                  {showFooter && (
                    <footer className="w-full border-t border-gray-100 pt-3 text-[9px] text-gray-400 font-bold flex justify-between select-none font-poppins">
                      <span>Dominican College of Tarlac - Narrative Archival</span>
                      <span>
                        Document Page {page.pageNum} of {pages.length}
                      </span>{' '}
                    </footer>
                  )}
                </div>
              </div>
            ))}
            </>
            )}
          </main>

          {/* Assessment & Actions Sidebar */}
          <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto shrink-0 flex flex-col justify-between select-none">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] text-sig-green font-bold uppercase tracking-wider">
                  Review & Assessment
                </span>
                <h3 className="text-base font-bold text-navy-blue mt-0.5">Narrative Assessment</h3>
              </div>

              {/* Quick Details Cards */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <User className="w-4 h-4 text-navy-blue shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-gray-455 block font-bold uppercase">
                      Submitted By
                    </span>
                    <span className="text-[11px] font-bold text-navy-blue block leading-tight mt-0.5">
                      {author ? author.name : 'Coordinator'}
                    </span>
                    <span className="text-[9px] text-gray-550 block">
                      Submitted: {new Date(report.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 rounded-2xl bg-gray-50 border border-gray-100/50">
                  <Tag className="w-4 h-4 text-navy-blue shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-gray-450 block font-bold uppercase">
                      Workflow Status
                    </span>
                    <span
                      className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${report.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'submitted'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {report.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Input & Actions Panel */}
            <div className="border-t border-gray-150 pt-5 mt-6 space-y-4">
              {report.status === 'submitted' &&
                (handleReviewReport ? (
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
                        {loading ? 'Processing...' : 'Approve'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start space-x-2 text-amber-700 bg-amber-50/50 p-4 rounded-2xl border border-amber-200/50 text-xs text-left">
                    <Clock className="w-4.5 h-4.5 shrink-0 text-amber-650 mt-0.5" />
                    <div>
                      <span className="font-bold">Pending Review</span>
                      <p className="mt-1 text-amber-650/80 leading-normal font-medium">
                        This report has been submitted and is currently pending review by the Admin.
                      </p>
                    </div>
                  </div>
                ))}

              {report.status === 'draft' && (
                <div className="flex items-start space-x-2 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-250 text-xs text-left">
                  <FileText className="w-4.5 h-4.5 shrink-0 text-gray-550 mt-0.5" />
                  <div>
                    <span className="font-bold">Draft Document</span>
                    <p className="mt-1 text-gray-500 leading-normal font-medium">
                      This is a draft version. You can close this viewer and click "Edit" to
                      complete and submit it to the Admin.
                    </p>
                  </div>
                </div>
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
                    <strong className="text-navy-blue font-bold block mb-1">
                      Active Revision Request:
                    </strong>
                    <p className="font-semibold leading-relaxed text-gray-700">
                      {report.adminFeedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </motion.div>
    </motion.div>
  )
}
