import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { Image } from '@tiptap/extension-image'
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
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDFJS worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

import logoImg from '../../assets/logo.png'
import logo2Img from '../../assets/logo2.png'

import {
  Plus,
  FolderOpen,
  Save,
  Send,
  Printer,
  FileDown,
  Download,
  RefreshCw,
  FileText,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Copy,
  Link2,
  Globe,
  FileCode2
} from 'lucide-react'

import GoogleDocsModal, { GoogleDocsIcon } from './ui/GoogleDocsModal'

import { useEditorStore } from './store/useEditorStore'
import { FontSizeExtension } from './extensions/FontSize'
import { LineHeightExtension } from './extensions/lineHeight'
import { Toolbar } from './ui/Toolbar'
import { Ruler } from './ui/Ruler'
import StatusBar from './ui/StatusBar'
import { DropdownWrapper } from './ui/DropdownWrapper'
import { DocPropertiesDialog } from './ui/Dialogs'
import { updateReport } from '../../services/db'
import { compressImage } from '../../utils/imageCompressor'
import {
  handleExportPDF,
  handleExportDOCX,
  handleExportTXT,
  handlePrintNative,
  docxToHtml,
  parseDocxLayout,
  loadInitialContentAndResetHistory,
  resolveHeaderHtml,
  cleanGoogleDocHtml,
  fetchGoogleDocData
} from './utils/editorHelpers'
import { PAPER } from './constants'
import DocumentCanvas from './ui/DocumentCanvas'
import PageFlow from './extensions/PageFlow'
import PageBreak from './extensions/PageBreak'
import FloatingImage from './extensions/FloatingImage'
import FloatingTextBox from './extensions/FloatingTextBox'
import FloatingToolbar from './ui/FloatingToolbar'
import TableFloatingToolbar from './ui/TableFloatingToolbar'
import { cn } from './utils/cn'
import MovableTable from './extensions/MovableTable'

export default function TextEditor({
  user,
  isOffline = false,
  workspaceReportId,
  setWorkspaceReportId,
  workspaceReportAY,
  setWorkspaceReportAY,
  workspaceReportSem,
  setWorkspaceReportSem,
  workspaceReportType,
  setWorkspaceReportType,
  workspaceReportEventId,
  setWorkspaceReportEventId,
  workspaceReportTitle,
  setWorkspaceReportTitle,
  workspaceReportDate,
  setWorkspaceReportDate,
  workspaceReportLocation,
  setWorkspaceReportLocation,
  workspaceReportBenef,
  setWorkspaceReportBenef,
  workspaceReportOrgId,
  setWorkspaceReportOrgId,
  workspaceReportPhotos,
  setWorkspaceReportPhotos,
  workspaceIsReadOnly,
  setWorkspaceIsReadOnly,
  workspaceFeedback,
  linkToEvent,
  setLinkToEvent,
  loading,
  setLoading,
  saveStatus,
  setSaveStatus,
  autoSave,
  setAutoSave,
  reportsList,
  orgsList,
  eventsList,
  onSave,
  onResetForm,
  onOpenReport,
  onLoadData,
  setActiveTab,
  editorOrigin,
  onBack,
  StatusBadge,
  workspaceReportStatus
}) {
  const [customTemplates, setCustomTemplates] = useState([])
  const [defaultTemplateId, setDefaultTemplateId] = useState(null)
  const [showDocProps, setShowDocProps] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  // -- Pagination & Header/Footer States --
  const [activeEditingArea, setActiveEditingArea] = useState('body') // 'body' | 'header' | 'footer'
  const [showHeader, setShowHeader] = useState(false)
  const [showFooter, setShowFooter] = useState(false)
  const [headerText, setHeaderText] = useState('')
  const [footerText, setFooterText] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [isTemplateActive, setIsTemplateActive] = useState(false)
  const [activeTemplateId, setActiveTemplateId] = useState(null)
  const [documentSource, setDocumentSource] = useState(null) // 'built_in_template' | 'google_docs' | 'scratch'
  const [docxBuffer, setDocxBuffer] = useState(null)
  const [paperKey, setPaperKey] = useState('Letter')
  const [orientation, setOrientation] = useState('portrait')
  const [marginKey, setMarginKey] = useState('Normal')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [openedFromTemplate, setOpenedFromTemplate] = useState(false)

  const fileMenuRef = useRef(null)
  const templatesMenuRef = useRef(null)
  const googleDocsMenuRef = useRef(null)
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState(false)
  const [showGoogleDocsMenu, setShowGoogleDocsMenu] = useState(false)
  const [googleDocsUrl, setGoogleDocsUrl] = useState('')

  useEffect(() => {
    if (workspaceReportId) {
      const rep = reportsList?.find((r) => r.id === workspaceReportId)
      const isBuiltInTemplateRep = Boolean(
        rep?.documentSource === 'built_in_template' ||
        rep?.submissionType === 'template' ||
        (rep?.isTemplateActive && !rep?.googleDocsUrl && !rep?.originalDocxUrl)
      )
      if (isBuiltInTemplateRep) {
        setGoogleDocsUrl('')
        setIsTemplateActive(true)
        setDocumentSource('built_in_template')
      } else {
        const saved =
          rep?.googleDocsUrl ||
          localStorage.getItem(`dommunity_gdocs_${workspaceReportId}`) ||
          ''
        setGoogleDocsUrl(saved)
        if (saved || rep?.submissionType === 'gdoc_submission') {
          setDocumentSource('google_docs')
        }
      }
    } else {
      setGoogleDocsUrl('')
    }
  }, [workspaceReportId, reportsList])

  const handleSaveGoogleDocsUrl = useCallback(
    async (url) => {
      const cleanUrl = (url || '').trim()
      setGoogleDocsUrl(cleanUrl)
      if (cleanUrl) {
        setDocumentSource('google_docs')
        setIsTemplateActive(false)
        if (workspaceReportId) {
          localStorage.setItem(`dommunity_gdocs_${workspaceReportId}`, cleanUrl)
          try {
            await updateReport(workspaceReportId, { googleDocsUrl: cleanUrl }, user?.uid)
          } catch (e) {
            console.warn('Failed to update report with googleDocsUrl in Firestore:', e)
          }
        }
      } else {
        localStorage.removeItem('dommunity_saved_gdoc_url')
        if (workspaceReportId) {
          localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
          try {
            await updateReport(workspaceReportId, { googleDocsUrl: null }, user?.uid)
          } catch (e) {
            console.warn('Failed to remove googleDocsUrl in Firestore:', e)
          }
        }
      }
    },
    [workspaceReportId, user?.uid]
  )

  const [hasLaunchedGoogleDocs, setHasLaunchedGoogleDocs] = useState(() => {
    return Boolean(
      (workspaceReportId && localStorage.getItem(`dommunity_gdocs_launched_${workspaceReportId}`)) ||
      localStorage.getItem('dommunity_gdocs_launched_active')
    )
  })
  const [showGDocFloatingBar, setShowGDocFloatingBar] = useState(false)
  const [floatingInputUrl, setFloatingInputUrl] = useState('')
  const [gDocNotification, setGDocNotification] = useState('')

  const extractGoogleDocUrl = useCallback((rawText) => {
    if (!rawText || typeof rawText !== 'string') return null
    const match = rawText.trim().match(/https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9-_]+)/)
    if (match && match[1]) {
      return `https://docs.google.com/document/d/${match[1]}/edit`
    }
    return null
  }, [])

  // Auto-detect Google Docs URL from clipboard whenever user returns/focuses Dommunity
  useEffect(() => {
    const handleWindowFocus = async () => {
      // Never auto-connect Google Docs if user is working on a built-in template
      if (isTemplateActive || documentSource === 'built_in_template') return

      if (!googleDocsUrl && navigator.clipboard?.readText) {
        try {
          const text = await navigator.clipboard.readText()
          const detectedUrl = extractGoogleDocUrl(text)
          if (detectedUrl) {
            handleSaveGoogleDocsUrl(detectedUrl)
            setShowGDocFloatingBar(false)
            setGDocNotification('🎉 Detected and connected your Google Doc from browser!')
            setTimeout(() => setGDocNotification(''), 4500)
          }
        } catch (e) {
          // Clipboard read not permitted or empty
        }
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    return () => window.removeEventListener('focus', handleWindowFocus)
  }, [googleDocsUrl, handleSaveGoogleDocsUrl, extractGoogleDocUrl, isTemplateActive, documentSource])

  const docxInputRef = useRef(null)
  const pdfInputRef = useRef(null)
  const templateInputRef = useRef(null)
  const canvasRef = useRef(null)
  const autoSaveTimer = useRef(null)
  const lastSavedContentRef = useRef(null)
  const lastLoadedReportIdRef = useRef(null)

  const zoomRef = useRef(zoom)
  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  const leftMargin = useEditorStore((state) => state.leftMargin)
  const rightMargin = useEditorStore((state) => state.rightMargin)
  const setEditor = useEditorStore((state) => state.setEditor)
  const setMainEditor = useEditorStore((state) => state.setMainEditor)
  const setHeaderEditor = useEditorStore((state) => state.setHeaderEditor)
  const setFooterEditor = useEditorStore((state) => state.setFooterEditor)

  const imagePasteDropProps = {
    handlePaste: (view, event) => {
      const items = event.clipboardData?.items || []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          if (!useEditorStore.getState().canInsertImage()) {
            alert('Maximum of 10 images allowed per document.')
            return true
          }
          const file = items[i].getAsFile()
          if (file) {
            compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 })
              .then((compressedSrc) => {
                if (compressedSrc) {
                  editor?.chain().setImage({ src: compressedSrc }).focus().run()
                }
              })
              .catch((err) => console.error('Pasted image compression failed:', err))
            return true
          }
        }
      }
      return false
    },
    handleDrop: (view, event, slice, moved) => {
      if (!moved && event.dataTransfer?.files?.length > 0) {
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
          const file = event.dataTransfer.files[i]
          if (file.type.startsWith('image/')) {
            if (!useEditorStore.getState().canInsertImage()) {
              alert('Maximum of 10 images allowed per document.')
              return true
            }
            compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.75 })
              .then((compressedSrc) => {
                if (compressedSrc) {
                  editor?.chain().setImage({ src: compressedSrc }).focus().run()
                }
              })
              .catch((err) => console.error('Dropped image compression failed:', err))
            return true
          }
        }
      }
      return false
    }
  }

  // ── Editor Instance ──
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false
      }),
      Underline,
      Color,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      Highlight.configure({ multicolor: true }),
      FloatingImage,
      FloatingTextBox,
      MovableTable.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
      TaskItem.configure({ nested: true }),
      TaskList,
      PageFlow,
      PageBreak
    ],
    content: '<p></p>',
    editable: !workspaceIsReadOnly && activeEditingArea === 'body',
    editorProps: {
      ...imagePasteDropProps
    },
    onCreate: ({ editor: ed }) => {
      try {
        ed.commands.clearHistory()
      } catch (e) {}

      const originalPosAtCoords = ed.view.posAtCoords.bind(ed.view)
      ed.view.posAtCoords = (coords) => {
        const scale = zoomRef.current / 100
        if (scale === 1) return originalPosAtCoords(coords)
        const rect = ed.view.dom.getBoundingClientRect()
        const left = rect.left + (coords.left - rect.left) / scale
        const top = rect.top + (coords.top - rect.top) / scale
        return originalPosAtCoords({ left, top })
      }
    },
    onUpdate: ({ editor: ed }) => {
      const txt = ed.getText()
      const html = ed.getHTML()
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0
      setWordCount(words)
      setCharCount(txt.length)
      if (lastSavedContentRef.current !== null && lastSavedContentRef.current !== html) {
        setHasUnsavedChanges(true)
      }
    }
  })

  // ── Header/Footer Editors ──
  const headerEditor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false
      }),
      Underline,
      Color,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      MovableTable.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow
    ],
    content: '<p></p>',
    editable: !workspaceIsReadOnly && activeEditingArea === 'header',
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-[10px] text-gray-800 font-sans'
      },
      ...imagePasteDropProps
    },
    onCreate: ({ editor: ed }) => {
      try {
        ed.commands.clearHistory()
      } catch (e) {}

      const originalPosAtCoords = ed.view.posAtCoords.bind(ed.view)
      ed.view.posAtCoords = (coords) => {
        const scale = zoomRef.current / 100
        if (scale === 1) return originalPosAtCoords(coords)
        const rect = ed.view.dom.getBoundingClientRect()
        const left = rect.left + (coords.left - rect.left) / scale
        const top = rect.top + (coords.top - rect.top) / scale
        return originalPosAtCoords({ left, top })
      }
    },
    onUpdate: ({ editor: ed }) => {
      if (ed.isFocused) {
        setHeaderText(ed.getHTML())
        setHasUnsavedChanges(true)
      }
    }
  })

  const footerEditor = useEditor({
    extensions: [
      StarterKit.configure({
        underline: false
      }),
      Underline,
      Color,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      MovableTable.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow
    ],
    content: '<p></p>',
    editable: !workspaceIsReadOnly && activeEditingArea === 'footer',
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-[10px] text-gray-800 font-sans'
      },
      ...imagePasteDropProps
    },
    onCreate: ({ editor: ed }) => {
      try {
        ed.commands.clearHistory()
      } catch (e) {}

      const originalPosAtCoords = ed.view.posAtCoords.bind(ed.view)
      ed.view.posAtCoords = (coords) => {
        const scale = zoomRef.current / 100
        if (scale === 1) return originalPosAtCoords(coords)
        const rect = ed.view.dom.getBoundingClientRect()
        const left = rect.left + (coords.left - rect.left) / scale
        const top = rect.top + (coords.top - rect.top) / scale
        return originalPosAtCoords({ left, top })
      }
    },
    onUpdate: ({ editor: ed }) => {
      if (ed.isFocused) {
        setFooterText(ed.getHTML())
        setHasUnsavedChanges(true)
      }
    }
  })

  useEffect(() => {
    setMainEditor(editor)
    setHeaderEditor(headerEditor)
    setFooterEditor(footerEditor)
  }, [editor, headerEditor, footerEditor, setMainEditor, setHeaderEditor, setFooterEditor])

  // ── Sync Editable State & Focus ──
  useEffect(() => {
    const isReadOnly = !!workspaceIsReadOnly
    if (editor) {
      editor.setEditable(!isReadOnly && activeEditingArea === 'body')
    }
    if (headerEditor) {
      headerEditor.setEditable(!isReadOnly && activeEditingArea === 'header')
      if (!isReadOnly && activeEditingArea === 'header') {
        setTimeout(() => {
          try {
            headerEditor.commands.focus()
          } catch (e) {}
        }, 50)
      }
    }
    if (footerEditor) {
      footerEditor.setEditable(!isReadOnly && activeEditingArea === 'footer')
      if (!isReadOnly && activeEditingArea === 'footer') {
        setTimeout(() => {
          try {
            footerEditor.commands.focus()
          } catch (e) {}
        }, 50)
      }
    }
  }, [editor, headerEditor, footerEditor, workspaceIsReadOnly, activeEditingArea])

  // ── Sync margins to ProseMirror DOM styles dynamically ──
  useEffect(() => {
    if (editor) {
      const pmNode = editor.view.dom
      if (pmNode) {
        pmNode.style.paddingLeft = `${leftMargin}px`
        pmNode.style.paddingRight = `${rightMargin}px`
      }
    }
  }, [editor, leftMargin, rightMargin])

  // ── Sync page flow settings to TipTap PageFlow extension ──
  const handlePageChange = useCallback((cur, tot) => {
    setCurrentPage(cur)
    setTotalPages(tot)
    useEditorStore.getState().setCurrentPage?.(cur)
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

  const activeEditor =
    activeEditingArea === 'header' && headerEditor
      ? headerEditor
      : activeEditingArea === 'footer' && footerEditor
        ? footerEditor
        : editor

  // ── Register active editor globally ──
  useEffect(() => {
    if (activeEditor) {
      setEditor(activeEditor)
      window.__dommunityEditor = activeEditor
    }

    window.__dommunityResetEditorLayout = () => {
      setHeaderText('')
      loadInitialContentAndResetHistory(headerEditor, '<p></p>')
      setFooterText('')
      loadInitialContentAndResetHistory(footerEditor, '<p></p>')
      setShowHeader(false)
      setShowFooter(false)
      setPaperKey('Letter')
      setOrientation('portrait')
      setMarginKey('Normal')
      setIsTemplateActive(false)
      setActiveTemplateId(null)
      setDocumentSource(null)
      setGoogleDocsUrl('')
      try {
        localStorage.removeItem('dommunity_saved_gdoc_url')
      } catch {}
      setDocxBuffer(null)
      setActiveEditingArea('body')
      lastSavedContentRef.current = '<p></p>'
      setHasUnsavedChanges(false)
      setOpenedFromTemplate(false)
      if (editor) {
        editor.setEditable(true)
        loadInitialContentAndResetHistory(editor, '<p></p>')
        setTimeout(() => {
          try {
            editor.commands.focus('start')
          } catch (e) {}
        }, 50)
      }
    }

    return () => {
      setEditor(null)
      window.__dommunityEditor = null
      delete window.__dommunityResetEditorLayout
    }
  }, [activeEditor, setEditor, editor, headerEditor, footerEditor])

  // ── Load template library on mount ──
  useEffect(() => {
    const saved = localStorage.getItem('dommunity_doc_templates')
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse templates:', e)
      }
    }
    const defId = localStorage.getItem('dommunity_default_template_id')
    if (defId) {
      setDefaultTemplateId(defId)
    }
  }, [])

  // ── Built-in System Templates ──
  const systemTemplates = [
    {
      id: 'system-dct-narrative',
      name: 'DCT CES Narrative Report',
      description:
        'Official multi-page narrative report template with Dominican College of Tarlac styling',
      paperKey: 'Folio',
      orientation: 'portrait',
      marginKey: 'Narrative',
      showHeader: true,
      showFooter: true,
      headerText: `<table style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;font-family:'Times New Roman',serif;table-layout:fixed;"><tbody><tr><td style="width:0.85in;vertical-align:middle;border:none;padding:0;text-align:left;"><img src="${logo2Img}" style="height:0.85in;width:0.85in;object-fit:contain;display:block;" /></td><td style="width:1.1in;vertical-align:middle;border:none;padding:0 0.15in 0 0.1in;text-align:left;"><img src="${logoImg}" style="height:0.85in;width:0.85in;object-fit:contain;display:block;" /></td><td style="width:4.55in;text-align:left;vertical-align:middle;border:none;border-left:2px solid #555;padding:0 0 0 0.15in;line-height:1.25;"><div style="font-family:'Book Antiqua','Palatino',serif;font-size:14pt;font-weight:bold;color:#000;margin:0 0 1px 0;">DOMINICAN COLLEGE OF TARLAC, INC.</div><div style="font-family:'Times New Roman',serif;font-size:12pt;color:#000;margin:0 0 2px 0;">COMMUNITY EXTENSION SERVICES</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0 0 1px 0;">McArthur Highway, Poblacion (Sto. Rosario), Capas, 2315 Tarlac, Philippines</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0 0 1px 0;">Institutional Contact No.: +63938-918-4093</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0;white-space:nowrap;">Website: dct.edu.ph | E-mail: <span style="color:#030e69;text-decoration:underline;">domct_2315@yahoo.com.ph / domct_2315@dct.edu.ph</span></div></td></tr></tbody></table><hr style="border:none;border-top:3px solid #000;margin:8px 0 0 0;width:110%;" />`,
      footerText: `<hr style="border:none;border-top:3px solid #000;margin:0 0 8px 0;width:100%;" /><div style="text-align:center;font-family:'Times New Roman',serif;line-height:1.25;color:#000;"><div style="font-size:12pt;font-weight:bold;margin:0 0 2px 0;">FIDES. PATRIA. SAPIENTIA.</div><div style="font-size:10pt;font-style:italic;margin:0 0 2px 0;">A God-loving educational community with passion for truth and compassion for humanity.</div><div style="font-size:10pt;margin:0;">Department/Office Facebook Page: www.facebook.com/dctces</div></div>`,
      html: `<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: center;"><span style="font-size: 28pt; font-weight: bold; color: #030e69; font-family: 'Times New Roman', serif;">NARRATIVE REPORT</span></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: center;"><span style="font-size: 20pt; font-weight: bold; font-family: 'Times New Roman', serif;">(PROGRAM)</span></p>
<p style="text-align: center;"><span style="font-size: 20pt; font-weight: bold; font-family: 'Times New Roman', serif;">(VENUE)</span></p>
<p style="text-align: center;"><span style="font-size: 20pt; font-weight: bold; font-family: 'Times New Roman', serif;">(DATE)</span></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<table style="width:100%;table-layout:fixed;border-collapse:collapse;border:1.5px solid #000;font-family:'Times New Roman',serif;background-color:#ffffff !important;">
  <tbody>
    <tr>
      <td style="width:35%;font-weight:bold;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p>Program:</p></td>
      <td style="width:65%;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p></p></td>
    </tr>
    <tr>
      <td style="width:35%;font-weight:bold;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p>Volunteer/s:</p></td>
      <td style="width:65%;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p></p></td>
    </tr>
    <tr>
      <td style="width:35%;font-weight:bold;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p>Venue:</p></td>
      <td style="width:65%;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p></p></td>
    </tr>
    <tr>
      <td style="width:35%;font-weight:bold;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p>Beneficiaries:</p></td>
      <td style="width:65%;border:1.5px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;word-break:break-word;overflow-wrap:break-word;"><p></p></td>
    </tr>
  </tbody>
</table>
<div class="page-break" data-page-break="true"></div>
<p style="text-align: left;"><span style="font-size: 16pt; font-weight: bold; font-family: 'Times New Roman', serif;">OBJECTIVES</span></p>
<p style="text-align: left;"><br></p>
<p style="text-align: center;"><span style="font-size: 16pt; font-weight: bold; font-family: 'Times New Roman', serif;">NARRATIVE REPORT</span></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><span style="font-size: 16pt; font-weight: bold; font-style: italic; font-family: 'Times New Roman', serif;">Reflections:</span></p>
<div class="page-break" data-page-break="true"></div>
<p style="text-align: left;"><span style="font-size: 16pt; font-weight: bold; font-family: 'Times New Roman', serif;">DOCUMENTATION:</span></p>
<p style="text-align: left;"><br></p>
<p style="text-align: left;"><br></p>
<p style="text-align: center;"><span style="font-size: 14pt; font-weight: bold; color: #000; font-family: 'Times New Roman', serif;">(Photos taken on event to be attached.)</span></p>
<p style="text-align: left;"><br></p>
<div class="page-break" data-page-break="true"></div>
<p style="text-align: left;"><span style="font-size: 12pt; font-family: 'Times New Roman', serif;"> </span></p>`
    }
  ]

  // ── Template Selection Handler ──
  const handleSelectTemplate = useCallback(
    (tpl) => {
      if (editor) {
        if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false)
        editor.setEditable(true)
        loadInitialContentAndResetHistory(editor, tpl.html || '<p></p>')
        editor.chain().focus('start').run()

        // Mark whether this is a built-in system template
        const isSystem = !!(tpl.id && tpl.id.startsWith('system-'))
        setIsTemplateActive(isSystem)
        setActiveTemplateId(isSystem ? tpl.id : null)
        if (isSystem) {
          setDocumentSource('built_in_template')
        }

        if (tpl.headerText !== undefined && tpl.headerText) {
          setHeaderText(tpl.headerText)
          loadInitialContentAndResetHistory(headerEditor, tpl.headerText)
          setShowHeader(true)
        } else {
          setHeaderText('')
          loadInitialContentAndResetHistory(headerEditor, '<p></p>')
        }

        if (tpl.footerText !== undefined && tpl.footerText) {
          setFooterText(tpl.footerText)
          loadInitialContentAndResetHistory(footerEditor, tpl.footerText)
          setShowFooter(true)
        } else {
          setFooterText('')
          loadInitialContentAndResetHistory(footerEditor, '<p></p>')
        }

        const pKey = tpl.paperKey || 'Letter'
        const orient = tpl.orientation || 'portrait'
        const mKey = tpl.marginKey || 'Normal'
        setPaperKey(pKey)
        setOrientation(orient)
        setMarginKey(mKey)

        editor.commands.updatePageFlowOptions({
          paperKey: pKey,
          orientation: orient,
          marginKey: mKey,
          showHeader: tpl.showHeader !== undefined ? tpl.showHeader : true,
          showFooter: tpl.showFooter !== undefined ? tpl.showFooter : true,
          headerText: tpl.headerText || '',
          footerText: tpl.footerText || '',
          isTemplateActive: isSystem
        })

        if (setWorkspaceReportTitle) {
          setWorkspaceReportTitle(tpl.name || 'Untitled')
        }
        if (setWorkspaceReportId) {
          setWorkspaceReportId(null)
        }
        if (isSystem || !tpl.googleDocsUrl) {
          setGoogleDocsUrl('')
          try {
            localStorage.removeItem('dommunity_saved_gdoc_url')
            if (workspaceReportId) {
              localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
            }
          } catch {}
        } else if (tpl.googleDocsUrl) {
          setGoogleDocsUrl(tpl.googleDocsUrl)
          localStorage.setItem('dommunity_saved_gdoc_url', tpl.googleDocsUrl)
        }

        setActiveEditingArea('body')
        // Reset dirty tracking to match loaded template content
        lastSavedContentRef.current = tpl.html || '<p></p>'
        setHasUnsavedChanges(false)
        setOpenedFromTemplate(true)
      }
      setShowTemplatesMenu(false)
    },
    [
      editor,
      headerEditor,
      footerEditor,
      setWorkspaceIsReadOnly,
      setWorkspaceReportTitle,
      setWorkspaceReportId,
      setPaperKey,
      setOrientation,
      setMarginKey,
      setIsTemplateActive,
      setActiveTemplateId,
      workspaceReportId
    ]
  )

  // ── Load Default Template on mount for new docs ──
  useEffect(() => {
    if (editor && !workspaceReportId) {
      const defId = localStorage.getItem('dommunity_default_template_id')
      if (defId) {
        const saved = localStorage.getItem('dommunity_doc_templates')
        let tpls = []
        if (saved) {
          try {
            tpls = JSON.parse(saved)
          } catch (e) {}
        }
        const found = tpls.find((x) => x.id === defId)
        if (found) {
          handleSelectTemplate(found)
        }
      }
    }
  }, [editor, workspaceReportId, handleSelectTemplate])

  // ── Load Report Layout configurations when workspaceReportId changes ──
  useEffect(() => {
    if (workspaceReportId && reportsList) {
      if (lastLoadedReportIdRef.current !== workspaceReportId) {
        const rep = reportsList.find((r) => r.id === workspaceReportId)
        if (rep) {
          const defaultHeader = `<table style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;font-family:'Times New Roman',serif;table-layout:fixed;"><tbody><tr><td style="width:0.85in;vertical-align:middle;border:none;padding:0;text-align:left;"><img src="${logo2Img}" style="height:0.85in;width:0.85in;object-fit:contain;display:block;" /></td><td style="width:1.1in;vertical-align:middle;border:none;padding:0 0.15in 0 0.1in;text-align:left;"><img src="${logoImg}" style="height:0.85in;width:0.85in;object-fit:contain;display:block;" /></td><td style="width:4.55in;text-align:left;vertical-align:middle;border:none;border-left:2px solid #555;padding:0 0 0 0.15in;line-height:1.25;"><div style="font-family:'Book Antiqua','Palatino',serif;font-size:14pt;font-weight:bold;color:#000;margin:0 0 1px 0;">DOMINICAN COLLEGE OF TARLAC, INC.</div><div style="font-family:'Times New Roman',serif;font-size:12pt;color:#000;margin:0 0 2px 0;">COMMUNITY EXTENSION SERVICES</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0 0 1px 0;">McArthur Highway, Poblacion (Sto. Rosario), Capas, 2315 Tarlac, Philippines</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0 0 1px 0;">Institutional Contact No.: +63938-918-4093</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0;white-space:nowrap;">Website: dct.edu.ph | E-mail: <span style="color:#030e69;text-decoration:underline;">domct_2315@yahoo.com.ph / domct_2315@dct.edu.ph</span></div></td></tr></tbody></table><hr style="border:none;border-top:3px solid #000;margin:8px 0 0 0;width:110%;" />`
          const defaultFooter = `<hr style="border:none;border-top:3px solid #000;margin:0 0 8px 0;width:100%;" /><div style="text-align:center;font-family:'Times New Roman',serif;line-height:1.25;color:#000;"><div style="font-size:12pt;font-weight:bold;margin:0 0 2px 0;">FIDES. PATRIA. SAPIENTIA.</div><div style="font-size:10pt;font-style:italic;margin:0 0 2px 0;">A God-loving educational community with passion for truth and compassion for humanity.</div><div style="font-size:10pt;margin:0;">Department/Office Facebook Page: www.facebook.com/dctces</div></div>`

          const headerVal = rep.headerText !== undefined ? rep.headerText : defaultHeader
          const resolvedHeader = resolveHeaderHtml(headerVal, logo2Img, logoImg)
          const footerVal = rep.footerText !== undefined ? rep.footerText : defaultFooter
          const showHeaderVal = rep.showHeader !== undefined ? rep.showHeader : true
          const showFooterVal = rep.showFooter !== undefined ? rep.showFooter : true
          const paperKeyVal = rep.paperKey || 'Folio'
          const orientationVal = rep.orientation || 'portrait'
          const marginKeyVal = rep.marginKey || 'Narrative'
          const isBuiltInTemplateRep = Boolean(
            rep.documentSource === 'built_in_template' ||
            rep.submissionType === 'template' ||
            (rep.isTemplateActive && !rep.googleDocsUrl && !rep.originalDocxUrl)
          )
          const isTemplateActiveVal = isBuiltInTemplateRep
            ? true
            : rep.isTemplateActive !== undefined
              ? rep.isTemplateActive
              : false

          if (isBuiltInTemplateRep) {
            setIsTemplateActive(true)
            setDocumentSource('built_in_template')
            setGoogleDocsUrl('')
            try {
              localStorage.removeItem('dommunity_saved_gdoc_url')
              localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
            } catch {}
          } else if (rep.googleDocsUrl || rep.submissionType === 'gdoc_submission') {
            setIsTemplateActive(false)
            setDocumentSource('google_docs')
            setGoogleDocsUrl(rep.googleDocsUrl || '')
          } else {
            setIsTemplateActive(isTemplateActiveVal)
          }

          setHeaderText(resolvedHeader)
          loadInitialContentAndResetHistory(headerEditor, resolvedHeader || '<p></p>')
          setFooterText(footerVal)
          loadInitialContentAndResetHistory(footerEditor, footerVal || '<p></p>')
          setShowHeader(showHeaderVal)
          setShowFooter(showFooterVal)
          setPaperKey(paperKeyVal)
          setOrientation(orientationVal)
          setMarginKey(marginKeyVal)
          setIsTemplateActive(isTemplateActiveVal)
          lastLoadedReportIdRef.current = workspaceReportId
          // Initialize dirty tracking baseline from the loaded report
          const loadedNarrative = rep.narrative || '<p></p>'
          if (editor) {
            editor.setEditable(!workspaceIsReadOnly)
            loadInitialContentAndResetHistory(editor, loadedNarrative)
          }
          if (editor && editor.commands.updatePageFlowOptions) {
            editor.commands.updatePageFlowOptions({
              paperKey: paperKeyVal,
              orientation: orientationVal,
              marginKey: marginKeyVal,
              showHeader: showHeaderVal,
              showFooter: showFooterVal,
              headerText: resolvedHeader || '',
              footerText: footerVal || '',
              isTemplateActive: isTemplateActiveVal
            })
          }
          lastSavedContentRef.current = loadedNarrative
          setHasUnsavedChanges(false)
          setOpenedFromTemplate(false)
        }
      }
    } else if (!workspaceReportId) {
      lastLoadedReportIdRef.current = null
    }
  }, [workspaceReportId, reportsList, editor, headerEditor, footerEditor, workspaceIsReadOnly])

  // ── Save current document as a template ──
  const handleSaveAsTemplate = useCallback(() => {
    if (!editor) return
    const name = window.prompt('Save Current Document as Template — Enter Name:')
    if (!name || !name.trim()) return

    const currentDocUrl =
      googleDocsUrl ||
      (workspaceReportId && localStorage.getItem(`dommunity_gdocs_${workspaceReportId}`)) ||
      localStorage.getItem('dommunity_saved_gdoc_url') ||
      ''

    const newTpl = {
      id: 'tpl-' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      html: editor.getHTML(),
      headerText,
      footerText,
      showHeader,
      showFooter,
      paperKey,
      orientation,
      marginKey,
      googleDocsUrl: currentDocUrl
    }

    setCustomTemplates((prev) => {
      const updated = [...prev, newTpl]
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated))
      return updated
    })
    alert(`Template "${name}" saved successfully!`)
  }, [editor, headerText, footerText, showHeader, showFooter, paperKey, orientation, marginKey, googleDocsUrl, workspaceReportId])

  // ── Import a .docx file as a template ──
  const handleImportTemplateFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result
      try {
        let layout = null
        try {
          layout = await parseDocxLayout(arrayBuffer)
        } catch (err) {
          console.warn('Template layout parse failed:', err)
        }

        let html = ''
        try {
          html = await docxToHtml(arrayBuffer)
        } catch (err) {
          console.warn('docxToHtml failed, falling back to mammoth:', err)
          const result = await mammoth.convertToHtml(
            { arrayBuffer },
            {
              convertImage: mammoth.images.imgElement((image) => {
                return image.readAsBase64String().then((b64) => ({
                  src: `data:${image.contentType};base64,${b64}`
                }))
              })
            }
          )
          html = result.value
        }

        const tplName = file.name.replace(/\.[^/.]+$/, '')
        const newTpl = {
          id: 'tpl-' + Math.random().toString(36).substr(2, 9),
          name: tplName,
          createdAt: new Date().toISOString(),
          html,
          headerText: layout?.headerText || '',
          footerText: layout?.footerText || '',
          showHeader: layout?.showHeader || false,
          showFooter: layout?.showFooter || false
        }

        setCustomTemplates((prev) => {
          const updated = [...prev, newTpl]
          localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated))
          return updated
        })
        alert(`Template "${tplName}" added to your library!`)
      } catch (err) {
        console.error('Template import failed:', err)
        alert('Failed to import template. Please check the file format.')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }, [])

  // ── Delete a template ──
  const handleDeleteTemplate = useCallback(
    (id) => {
      if (!window.confirm('Remove this template from your library?')) return
      setCustomTemplates((prev) => {
        const updated = prev.filter((x) => x.id !== id)
        localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated))
        return updated
      })
      if (defaultTemplateId === id) {
        setDefaultTemplateId(null)
        localStorage.removeItem('dommunity_default_template_id')
      }
    },
    [defaultTemplateId]
  )

  // ── Open local .docx ──
  const handleOpenLocalDocx = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result
        setLoading(true)
        try {
          let layout = null
          try {
            layout = await parseDocxLayout(arrayBuffer)
          } catch (e) {
            console.error('Failed to parse docx layout', e)
          }

          let html = ''
          try {
            html = await docxToHtml(arrayBuffer)
          } catch (err) {
            console.warn('High-fidelity parser failed, falling back to mammoth:', err)
            const result = await mammoth.convertToHtml(
              { arrayBuffer },
              {
                convertImage: mammoth.images.imgElement((image) => {
                  return image.readAsBase64String().then((base64String) => {
                    return {
                      src: `data:${image.contentType};base64,${base64String}`
                    }
                  })
                })
              }
            )
            html = result.value
          }

          if (editor) {
            if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false)
            editor.setEditable(true)

            if (setWorkspaceReportTitle) {
              setWorkspaceReportTitle(file.name.replace(/\.[^/.]+$/, ''))
            }

            if (setWorkspaceReportId) {
              setWorkspaceReportId(null)
            }

            if (layout) {
              if (layout.headerText) {
                setHeaderText(layout.headerText)
                loadInitialContentAndResetHistory(headerEditor, layout.headerText)
              } else {
                setHeaderText('')
                loadInitialContentAndResetHistory(headerEditor, '<p></p>')
              }

              if (layout.footerText) {
                setFooterText(layout.footerText)
                loadInitialContentAndResetHistory(footerEditor, layout.footerText)
              } else {
                setFooterText('')
                loadInitialContentAndResetHistory(footerEditor, '<p></p>')
              }

              setShowHeader(layout.showHeader !== false)
              setShowFooter(layout.showFooter !== false)
            }

            loadInitialContentAndResetHistory(editor, html || '<p></p>')
            lastSavedContentRef.current = html
            setHasUnsavedChanges(false)
            setActiveEditingArea('body')
          }
        } catch (err) {
          console.error('Error loading docx:', err)
          alert('Failed to open the document. Please check the file format.')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
      e.target.value = ''
    },
    [
      editor,
      headerEditor,
      footerEditor,
      setWorkspaceIsReadOnly,
      setWorkspaceReportTitle,
      setWorkspaceReportId,
      setLoading
    ]
  )

  // ── Open local .pdf ──
  const handleOpenLocalPdf = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      setLoading(true)
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          let html = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()

            // Reconstruct lines by grouping text items vertically
            let lastY = null
            let lineText = ''

            for (const item of textContent.items) {
              const y = item.transform[5]
              const fontSize = Math.round(Math.abs(item.transform[3]))

              let itemStr = item.str
              if (item.fontName) {
                const fnLower = item.fontName.toLowerCase()
                if (
                  fnLower.includes('bold') ||
                  fnLower.includes('-bd') ||
                  fnLower.includes('_bd')
                ) {
                  itemStr = `<strong>${itemStr}</strong>`
                }
                if (
                  fnLower.includes('italic') ||
                  fnLower.includes('-it') ||
                  fnLower.includes('_it')
                ) {
                  itemStr = `<em>${itemStr}</em>`
                }
              }

              const styledItem =
                fontSize && fontSize !== 16
                  ? `<span style="font-size: ${fontSize}px;">${itemStr}</span>`
                  : itemStr

              if (lastY !== null && Math.abs(y - lastY) > 5) {
                if (lineText.trim()) {
                  html += `<p>${lineText}</p>`
                }
                lineText = styledItem
              } else {
                lineText += (lineText ? ' ' : '') + styledItem
              }
              lastY = y
            }
            if (lineText.trim()) {
              html += `<p>${lineText}</p>`
            }
          }

          if (editor) {
            if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false)
            editor.setEditable(true)

            if (setWorkspaceReportTitle) {
              setWorkspaceReportTitle(file.name.replace(/\.[^/.]+$/, ''))
            }

            if (setWorkspaceReportId) {
              setWorkspaceReportId(null)
            }

            // Clear headers and footers for PDF as it extracts layout directly into body
            setHeaderText('')
            headerEditor?.commands.setContent('<p></p>')
            setFooterText('')
            footerEditor?.commands.setContent('<p></p>')
            setShowHeader(false)
            setShowFooter(false)

            editor.commands.setContent(html || '<p></p>')
            lastSavedContentRef.current = html
            setHasUnsavedChanges(false)
            setActiveEditingArea('body')
          }
        } catch (err) {
          console.error('Error loading PDF:', err)
          alert('Failed to parse PDF file. Ensure it contains selectable text.')
        } finally {
          setLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
      e.target.value = ''
    },
    [
      editor,
      headerEditor,
      footerEditor,
      setWorkspaceIsReadOnly,
      setWorkspaceReportTitle,
      setWorkspaceReportId,
      setLoading
    ]
  )

  // ── Save/Submit handler ──
  const handleSave = useCallback(
    async (status, silent = false, explicitGDocUrl) => {
      if (!editor) return
      if (isOffline) {
        if (!silent) {
          alert(
            'Cannot save or submit report: Internet connection is offline. Your changes remain safe in the editor. Please reconnect to sync.'
          )
        }
        return
      }

      // Determine document source: Built-in templates NEVER use Google Docs
      const isBuiltInTemplateDoc = Boolean(
        isTemplateActive ||
        documentSource === 'built_in_template' ||
        (activeTemplateId && activeTemplateId.startsWith('system-'))
      )

      const resolvedGDocUrl = isBuiltInTemplateDoc
        ? null
        : explicitGDocUrl !== undefined && explicitGDocUrl !== null
          ? explicitGDocUrl
          : googleDocsUrl ||
            (workspaceReportId ? localStorage.getItem(`dommunity_gdocs_${workspaceReportId}`) : '') ||
            ''

      let finalHtml = editor.getHTML()
      let fetchedDocxBase64 = null
      let fetchedPdfBase64 = null
      let fetchedDocTitle = null

      if (!isBuiltInTemplateDoc && resolvedGDocUrl) {
        const match = resolvedGDocUrl.match(/\/document\/d\/([a-zA-Z0-9-_]+)/)
        if (!match) {
          if (!silent) {
            alert('The saved Google Docs link is invalid. Please verify the URL in Link Settings.')
          }
          return false
        }

        // Fetch document content from Google Docs
        setLoading(true)
        let gDocResult
        try {
          gDocResult = await fetchGoogleDocData(resolvedGDocUrl)
        } catch (fetchErr) {
          gDocResult = { success: false, error: fetchErr.message }
        } finally {
          setLoading(false)
        }

        if (!gDocResult || !gDocResult.success) {
          const errMsg =
            gDocResult?.error ||
            'Unable to access or retrieve content from the saved Google Docs link. Please verify the link and ensure document sharing is set to "Anyone with the link".'
          if (!silent) {
            alert(errMsg)
          }
          return false
        }

        // Successfully retrieved Google Doc content!
        const cleanedHtml = cleanGoogleDocHtml(gDocResult.html)
        if (cleanedHtml) {
          finalHtml = cleanedHtml
          try {
            editor.commands.setContent(cleanedHtml)
          } catch (edErr) {
            console.warn('Failed to load Google Doc HTML into TipTap editor:', edErr)
          }
        }
        if (gDocResult.pdfBase64) {
          fetchedPdfBase64 = gDocResult.pdfBase64
          try {
            if (gDocResult.pdfBase64.length < 400000 && workspaceReportId) {
              localStorage.setItem(`dommunity_gdoc_pdf_${workspaceReportId}`, gDocResult.pdfBase64)
            }
          } catch {}
        }
        if (gDocResult.docxBase64) {
          fetchedDocxBase64 = gDocResult.docxBase64
          try {
            if (gDocResult.docxBase64.length < 400000 && workspaceReportId) {
              localStorage.setItem(`dommunity_gdoc_buffer_${workspaceReportId}`, gDocResult.docxBase64)
            }
          } catch {}
        }
        if (gDocResult.title) {
          fetchedDocTitle = gDocResult.title
        }
      }

      // Check content before saving
      if (!finalHtml || finalHtml === '<p></p>') {
        if (!silent) alert('Please write some content or link a valid Google Doc before saving.')
        return false
      }

      await onSave(status, finalHtml, silent, {
        headerText,
        footerText,
        showHeader,
        showFooter,
        paperKey,
        orientation,
        marginKey,
        isTemplateActive: isBuiltInTemplateDoc,
        documentSource: isBuiltInTemplateDoc
          ? 'built_in_template'
          : resolvedGDocUrl
            ? 'google_docs'
            : 'scratch',
        submissionType: isBuiltInTemplateDoc
          ? 'template'
          : resolvedGDocUrl
            ? 'gdoc_submission'
            : 'template',
        googleDocsUrl: isBuiltInTemplateDoc ? null : (resolvedGDocUrl || null),
        originalDocxUrl: null,
        gdocTitle: isBuiltInTemplateDoc ? null : fetchedDocTitle,
        pdfBase64: isBuiltInTemplateDoc ? null : fetchedPdfBase64,
        docxBase64: isBuiltInTemplateDoc ? null : fetchedDocxBase64
      })
      lastSavedContentRef.current = finalHtml
      setHasUnsavedChanges(false)
      return true
    },
    [
      editor,
      isOffline,
      onSave,
      headerText,
      footerText,
      showHeader,
      showFooter,
      paperKey,
      orientation,
      marginKey,
      isTemplateActive,
      documentSource,
      activeTemplateId,
      googleDocsUrl,
      workspaceReportId
    ]
  )

  // ── Context-aware Back Navigation ──
  const executeBackNavigation = useCallback(() => {
    if (openedFromTemplate) {
      setOpenedFromTemplate(false)
      if (onResetForm) {
        onResetForm(editor)
      } else if (window.__dommunityResetEditorLayout) {
        window.__dommunityResetEditorLayout()
      }
      lastSavedContentRef.current = '<p></p>'
      setHasUnsavedChanges(false)
    } else {
      if (onBack) onBack()
    }
  }, [openedFromTemplate, onBack, onResetForm, editor])

  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowLeaveConfirm(true)
    } else {
      executeBackNavigation()
    }
  }, [hasUnsavedChanges, executeBackNavigation])

  // ── AutoSave ──
  useEffect(() => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current)
    if (autoSave && workspaceReportId && !isOffline) {
      autoSaveTimer.current = setInterval(() => {
        handleSave('draft', true)
      }, 30000)
    }
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current)
    }
  }, [autoSave, workspaceReportId, handleSave, isOffline])

  const docTitle =
    workspaceReportTitle ||
    eventsList.find((x) => x.id === workspaceReportEventId)?.name ||
    'Document1'

  const activePaper = PAPER[paperKey] || PAPER.Letter
  const activeDocW = orientation === 'landscape' ? activePaper.h : activePaper.w
  const activeDocH = orientation === 'landscape' ? activePaper.w : activePaper.h

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          handleSave('draft')
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault()
          handlePrintNative(canvasRef, docTitle, {
            paperKey,
            orientation,
            marginKey,
            paperW: activeDocW,
            paperH: activeDocH
          })
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor, handleSave, docTitle, paperKey, orientation, marginKey, activeDocW, activeDocH])

  const handleOpenGoogleDocs = useCallback(
    async (targetUrl) => {
      const persisted =
        (workspaceReportId && localStorage.getItem(`dommunity_gdocs_${workspaceReportId}`)) ||
        localStorage.getItem('dommunity_saved_gdoc_url') ||
        ''
      const currentUrl = targetUrl || googleDocsUrl || persisted

      // 1. If an exact document URL is already linked or specified, ALWAYS reopen it!
      if (currentUrl) {
        if (typeof window !== 'undefined') {
          window.open(currentUrl, '_blank', 'noopener,noreferrer')
        }
        return
      }

      // 2. If no doc is linked yet, check clipboard immediately:
      if (navigator.clipboard?.readText) {
        try {
          const clipText = await navigator.clipboard.readText()
          const detected = extractGoogleDocUrl(clipText)
          if (detected) {
            handleSaveGoogleDocsUrl(detected)
            if (typeof window !== 'undefined') {
              window.open(detected, '_blank', 'noopener,noreferrer')
            }
            setGDocNotification('🎉 Reopening your connected Google Doc!')
            setTimeout(() => setGDocNotification(''), 4000)
            return
          }
        } catch (e) {}
      }

      // 3. If this is the FIRST time clicking Google Docs (session not yet launched):
      if (!hasLaunchedGoogleDocs) {
        setHasLaunchedGoogleDocs(true)
        if (workspaceReportId) {
          localStorage.setItem(`dommunity_gdocs_launched_${workspaceReportId}`, 'true')
        } else {
          localStorage.setItem('dommunity_gdocs_launched_active', 'true')
        }
        setShowGDocFloatingBar(true)

        // Open docs.new the first time so the user can start editing in Google Docs
        if (typeof window !== 'undefined') {
          window.open('https://docs.new', '_blank', 'noopener,noreferrer')
        }
        return
      }

      // 4. If this is the SECOND time clicking Google Docs, and we don't have the exact /d/ URL:
      // DO NOT OPEN docs.new (which would create another blank page)!
      // Instead, open Google Docs Home where their recently edited document is right at the top,
      // and keep the quick connect bar active so they can link it:
      setShowGDocFloatingBar(true)
      setGDocNotification('Opening your Google Docs Home where your edited doc is at the top. Copy its link to keep it connected!')
      setTimeout(() => setGDocNotification(''), 6000)
      if (typeof window !== 'undefined') {
        window.open('https://docs.google.com/document/u/0/', '_blank', 'noopener,noreferrer')
      }
    },
    [
      googleDocsUrl,
      workspaceReportId,
      hasLaunchedGoogleDocs,
      extractGoogleDocUrl,
      handleSaveGoogleDocsUrl
    ]
  )

  const handleCopyAndGoToGoogleDocs = useCallback(async () => {
    try {
      const html = editor?.getHTML() || '<p></p>'
      const text = editor?.getText() || ''
      if (navigator.clipboard && window.ClipboardItem) {
        const blobHtml = new Blob([html], { type: 'text/html' })
        const blobText = new Blob([text], { type: 'text/plain' })
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': blobHtml,
            'text/plain': blobText
          })
        ])
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
      }
    } catch (err) {
      console.warn('Clipboard copy warning:', err)
    }
    handleOpenGoogleDocs()
  }, [editor, handleOpenGoogleDocs])

  // ── File menu actions ──
  const fileMenuItems = [
    {
      icon: Plus,
      l: 'New Blank Document',
      fn: () => {
        if (editor) {
          // Helper to calculate insert position at the end of current page
          const getInsertPositionForBlankPage = () => {
            const { doc, selection } = editor.state
            const cursorFrom = selection.from

            // Paper configurations
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

            const getMargins = (key) => {
              const preset = MARGINS[key] || MARGINS.Normal
              if (typeof preset === 'number') {
                return { top: preset, bottom: preset, left: preset, right: preset }
              }
              return preset
            }

            const getScale = (el) => {
              let parent = el
              while (parent) {
                if (parent.style.transform && parent.style.transform.includes('scale')) {
                  const match = parent.style.transform.match(/scale\(([^)]+)\)/)
                  if (match) return parseFloat(match[1]) || 1
                }
                parent = parent.parentElement
              }
              return 1
            }

            const paper = PAPER[paperKey] || PAPER.A4
            const pageHeight = orientation === 'landscape' ? paper.w : paper.h
            const margins = getMargins(marginKey)
            const padTopActual =
              showHeader && isTemplateActive ? (marginKey === 'Narrow' ? 142 : 170) : margins.top
            const usableHeight = pageHeight - (padTopActual + margins.bottom)

            let runningHeight = 0
            let pageNum = 1
            let cursorPage = 1
            const nodePages = []
            const scale = getScale(editor.view.dom)

            doc.forEach((node, offset) => {
              const dom = editor.view.nodeDOM(offset)
              let height = 0
              let marginTop = 0
              let marginBottom = 0

              if (dom && dom.nodeType === 1) {
                const style = window.getComputedStyle(dom)
                marginTop = parseFloat(style.marginTop) || 0
                marginBottom = parseFloat(style.marginBottom) || 0
                const rect = dom.getBoundingClientRect()
                height = rect.height / scale + marginTop + marginBottom
              } else {
                if (node.type.name === 'heading') {
                  height = node.attrs.level === 1 ? 40 : 30
                } else if (node.type.name === 'paragraph') {
                  height = 20
                } else if (node.type.name === 'table') {
                  height = 120
                } else if (node.type.name === 'pageBreak') {
                  height = 1
                } else {
                  height = 20
                }
              }

              const forceBreak =
                node.type.name === 'pageBreak' ||
                (dom &&
                  dom.nodeType === 1 &&
                  (dom.classList.contains('page-break') ||
                    dom.querySelector('.page-break') !== null ||
                    window.getComputedStyle(dom).pageBreakBefore === 'always' ||
                    window.getComputedStyle(dom).breakBefore === 'page' ||
                    dom.getAttribute('data-page-break') === 'true'))

              if ((runningHeight + height > usableHeight || forceBreak) && runningHeight > 0) {
                pageNum++
                const isBreakElementEmpty =
                  (node.type.name === 'pageBreak' ||
                    (dom && dom.nodeType === 1 && dom.classList.contains('page-break'))) &&
                  height < 10
                runningHeight = isBreakElementEmpty ? 0 : height
              } else {
                runningHeight += height
              }

              nodePages.push({ start: offset, end: offset + node.nodeSize, page: pageNum })
              if (offset <= cursorFrom) {
                cursorPage = pageNum
              }
            })

            const currentNodes = nodePages.filter((n) => n.page === cursorPage)
            if (currentNodes.length > 0) {
              return currentNodes[currentNodes.length - 1].end
            }
            return cursorFrom
          }

          const insertPos = getInsertPositionForBlankPage()
          const isAtEnd = insertPos >= editor.state.doc.content.size - 2

          if (isAtEnd) {
            editor
              .chain()
              .focus()
              .insertContentAt(insertPos, [{ type: 'pageBreak' }, { type: 'paragraph' }])
              .setTextSelection(insertPos + 2)
              .run()
          } else {
            editor
              .chain()
              .focus()
              .insertContentAt(insertPos, [
                { type: 'pageBreak' },
                { type: 'paragraph' },
                { type: 'pageBreak' }
              ])
              .setTextSelection(insertPos + 2)
              .run()
          }
          setActiveEditingArea('body')
        }
      }
    },
    null,
    { icon: Save, l: 'Save Draft (Ctrl+S)', fn: () => handleSave('draft') },
    { icon: Send, l: 'Submit to Admin', fn: () => handleSave('submitted') },
    null,
    {
      icon: Printer,
      l: 'Print (Ctrl+P)',
      fn: () =>
        handlePrintNative(canvasRef, docTitle, {
          paperKey,
          orientation,
          marginKey,
          paperW: activeDocW,
          paperH: activeDocH
        })
    },
    {
      icon: FileDown,
      l: 'Export as PDF',
      fn: () =>
        handleExportPDF(canvasRef, docTitle, {
          paperKey,
          orientation,
          marginKey,
          paperW: activeDocW,
          paperH: activeDocH
        })
    },
    null,
    {
      icon: ExternalLink,
      l: 'Direct to Google Docs',
      fn: () => handleOpenGoogleDocs()
    },
    {
      icon: FileCode2,
      l: 'Link Settings',
      fn: () => setShowGoogleDocsModal(true)
    }
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFBFD] border border-neutral-200 rounded-lg">
      {/* ── Title Bar ── */}
      <div className="bg-navy-blue text-white flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 shrink-0 select-none gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={handleBackClick}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-all duration-150 cursor-pointer shrink-0 group border border-white/10 hover:border-white/25"
              title="Go back"
            >
              <ChevronLeft className="w-4 h-4 text-white group-hover:text-sig-green transition-colors" />
              <span className="text-[11px] font-semibold text-white/90 group-hover:text-white transition-colors hidden sm:inline">Back</span>
            </button>
          )}
          <div className="bg-white text-navy-blue rounded w-6 h-6 flex items-center justify-center font-bold text-sm shadow shrink-0">
            W
          </div>
          <span className="text-xs sm:text-sm font-semibold text-gray-100 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
            {docTitle} – DommUnity Rich Editor
          </span>
          {workspaceIsReadOnly && (
            <span className="text-[9px] sm:text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
              Read-Only
            </span>
          )}
        </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-gray-300 shrink-0">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden xs:inline">Saving…</span>
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-green-400">
                <Check className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Saved</span>
              </span>
            )}
            {saveStatus === 'error' && <span className="text-red-400">Save failed</span>}
            {autoSave && <span className="text-green-400 font-semibold hidden md:inline">AutoSave ON</span>}

            {!workspaceIsReadOnly && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  disabled={saveStatus === 'saving' || isOffline}
                  className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-md border border-white/15 transition cursor-pointer"
                  title="Save draft to Compiled Reports (Ctrl+S)"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save Draft</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('submitted')}
                  disabled={saveStatus === 'saving' || isOffline}
                  className="flex items-center gap-1.5 px-3.5 py-1 bg-sig-green hover:bg-sig-green-600 text-navy-blue font-bold text-xs rounded-md shadow-xs transition cursor-pointer"
                  title="Submit this report to Admin"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Admin</span>
                </button>
              </div>
            )}
          </div>
      </div>

      {/* ── Menu & Actions Row ── */}
      <div className="bg-neutral-100 border-b border-neutral-200 flex items-center px-3 sm:px-4 py-1.5 gap-2 shrink-0 select-none print:hidden overflow-x-auto">
        {/* File Dropdown */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="px-3 py-1 text-xs font-semibold bg-navy-blue text-white rounded hover:bg-navy-blue/90 transition cursor-pointer"
          >
            File
          </button>
          <DropdownWrapper
            open={showFileMenu}
            onClose={() => setShowFileMenu(false)}
            triggerRef={fileMenuRef}
            width={240}
          >
            <div className="py-1 w-56 bg-white border border-neutral-200 shadow-lg rounded">
              {fileMenuItems.map((item, i) => {
                if (!item) return <div key={i} className="my-1 border-t border-neutral-100" />
                return (
                  <button
                    key={item.l}
                    onClick={() => {
                      item.fn()
                      setShowFileMenu(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-neutral-100 cursor-pointer transition ${item.active ? 'text-blue-600 font-bold' : ''}`}
                  >
                    <item.icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{item.l}</span>
                  </button>
                )
              })}
            </div>
          </DropdownWrapper>
        </div>
        {/* Templates Dropdown */}
        <div className="relative" ref={templatesMenuRef}>
          <button
            onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
            className="px-3 py-1 text-xs font-semibold bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300 transition cursor-pointer"
          >
            Template
          </button>
          <DropdownWrapper
            open={showTemplatesMenu}
            onClose={() => setShowTemplatesMenu(false)}
            triggerRef={templatesMenuRef}
            width={240}
          >
            <div className="py-1 w-56 bg-white border border-neutral-200 shadow-lg rounded max-h-80 overflow-y-auto">
              {systemTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className="w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-neutral-100 cursor-pointer transition"
                >
                  <span className="font-semibold text-neutral-800 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    {tpl.name}
                  </span>
                  <span className="text-[9px] text-neutral-500 truncate pl-5.5">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>

        {/* Google Docs Direct Button & Options Dropdown */}
        <div className="relative" ref={googleDocsMenuRef}>
          <div className="flex items-center rounded overflow-hidden shadow-xs border border-blue-200 bg-white">
            <button
              onClick={() => handleOpenGoogleDocs()}
              className={`px-2.5 py-1 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                googleDocsUrl
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : hasLaunchedGoogleDocs
                    ? 'text-blue-800 bg-blue-50/70 hover:bg-blue-100'
                    : 'text-[#1a73e8] hover:bg-blue-50'
              }`}
              title={
                googleDocsUrl
                  ? `Reopen connected Google Doc (${googleDocsUrl})`
                  : hasLaunchedGoogleDocs
                    ? 'Reopen Google Docs (Recent Docs)'
                    : 'Open Google Docs'
              }
            >
              <GoogleDocsIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{googleDocsUrl ? 'Reopen Google Doc' : 'Google Docs'}</span>
            </button>
            <button
              onClick={() => setShowGoogleDocsMenu(!showGoogleDocsMenu)}
              className="px-1 py-1 text-xs text-[#1a73e8] hover:bg-blue-50 border-l border-blue-100 transition cursor-pointer flex items-center justify-center"
              title="More Google Docs Options & Google Script"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <DropdownWrapper
            open={showGoogleDocsMenu}
            onClose={() => setShowGoogleDocsMenu(false)}
            triggerRef={googleDocsMenuRef}
            width={260}
          >
            <div className="py-1 w-64 bg-white border border-neutral-200 shadow-xl rounded-lg">
              <div className="px-3 py-1.5 border-b border-neutral-100 bg-neutral-50/70">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Google Docs Quick Access
                </span>
              </div>

              {/* Direct to docs.new */}
              <button
                onClick={() => {
                  handleOpenGoogleDocs('https://docs.new')
                  setShowGoogleDocsMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-100 cursor-pointer transition text-neutral-800"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold flex-1 truncate">New Blank Doc</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {/* Open linked doc (if any) */}
              {googleDocsUrl && (
                <button
                  onClick={() => {
                    handleOpenGoogleDocs(googleDocsUrl)
                    setShowGoogleDocsMenu(false)
                  }}
                  className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-100 cursor-pointer transition text-neutral-800 bg-blue-50/40"
                >
                  <Link2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="font-semibold text-green-700 flex-1 truncate">Open Connected Doc</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
                </button>
              )}

              {/* Google Docs Home / Recent */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open('https://docs.google.com/document/u/0/', '_blank', 'noopener,noreferrer')
                  }
                  setShowGoogleDocsMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-100 cursor-pointer transition text-neutral-800"
              >
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-semibold flex-1 truncate">Recent Documents</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              {/* Google Docs Dashboard */}
              <button
                onClick={() => {
                  handleOpenGoogleDocs('https://docs.google.com/document/u/0/')
                  setShowGoogleDocsMenu(false)
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-100 cursor-pointer transition text-neutral-800"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="font-semibold flex-1 truncate">Google Docs Home</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 shrink-0" />
              </button>

              <div className="my-1 border-t border-neutral-100" />

              {/* Link Settings Modal */}
              <button
                onClick={() => {
                  setShowGoogleDocsMenu(false)
                  setShowGoogleDocsModal(true)
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-blue-50 cursor-pointer transition text-navy-blue font-semibold"
              >
                <FileCode2 className="w-3.5 h-3.5 text-navy-blue shrink-0" />
                <span>Link Settings</span>
              </button>
            </div>
          </DropdownWrapper>
        </div>

        <div className="h-4 w-px bg-neutral-300 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-200/60 rounded px-1.5 py-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            className="p-0.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/80 rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-neutral-700 min-w-[32px] text-center">
            {zoom}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            className="p-0.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/80 rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Formatting Toolbar ── */}
      <div className="bg-white border-b border-neutral-200 px-4 py-1.5 shrink-0 print:hidden">
        <Toolbar
          onPrint={() =>
            handlePrintNative(canvasRef, docTitle, {
              paperKey,
              orientation,
              marginKey,
              paperW: activeDocW,
              paperH: activeDocH
            })
          }
        />
      </div>

      {/* ── Active Google Docs Floating Banner & Auto-Detect Toast ── */}
      {gDocNotification && (
        <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs shadow-md border-b border-emerald-500 shrink-0 z-30 transition-all">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="font-semibold">{gDocNotification}</span>
          </div>
          <button
            onClick={() => setGDocNotification('')}
            className="p-1 text-emerald-200 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {showGDocFloatingBar && !googleDocsUrl && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md border-b border-blue-500/30 shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
              <GoogleDocsIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold block">Google Docs Opened in Browser</span>
              <span className="text-[11px] text-blue-200 block">
                Copy your doc's link from your browser address bar (Ctrl+C). Dommunity auto-detects it when you switch back.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white/10 rounded-lg border border-white/20 overflow-hidden">
              <input
                type="url"
                value={floatingInputUrl}
                onChange={(e) => setFloatingInputUrl(e.target.value)}
                placeholder="Paste https://docs.google.com/document/d/..."
                className="px-3 py-1 text-xs text-white placeholder-blue-200/60 bg-transparent focus:outline-none w-52 sm:w-64 font-mono text-[11px]"
              />
              <button
                onClick={() => {
                  const detected = extractGoogleDocUrl(floatingInputUrl)
                  if (detected) {
                    handleSaveGoogleDocsUrl(detected)
                    setShowGDocFloatingBar(false)
                    setGDocNotification('🎉 Connected to Google Doc! Click Google Docs anytime to reopen.')
                    setTimeout(() => setGDocNotification(''), 4500)
                  } else {
                    alert('Please enter a valid Google Docs URL (e.g., https://docs.google.com/document/d/.../edit)')
                  }
                }}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 font-bold text-xs transition cursor-pointer"
              >
                Link Doc
              </button>
            </div>

            <button
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText()
                  const detected = extractGoogleDocUrl(text)
                  if (detected) {
                    handleSaveGoogleDocsUrl(detected)
                    setShowGDocFloatingBar(false)
                    setGDocNotification('🎉 Connected to Google Doc from clipboard!')
                    setTimeout(() => setGDocNotification(''), 4500)
                  } else {
                    alert('No Google Docs URL found on clipboard. Please copy the URL from your Google Docs browser address bar.')
                  }
                } catch (e) {
                  alert('Clipboard access denied. Please paste the link manually into the box.')
                }
              }}
              className="px-2.5 py-1 bg-blue-500/40 hover:bg-blue-500/60 text-white rounded-lg border border-white/20 transition cursor-pointer font-semibold flex items-center gap-1"
              title="Paste link from clipboard"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>

            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.open('https://docs.google.com/document/u/0/', '_blank', 'noopener,noreferrer')
                }
              }}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer text-[11px] flex items-center gap-1"
              title="Open Google Docs Home to see your recent docs"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Recent Docs</span>
            </button>

            <button
              onClick={() => setShowGDocFloatingBar(false)}
              className="p-1 text-blue-200 hover:text-white rounded transition cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Document Workspace Area ── */}
      <div className="flex-1 overflow-hidden w-full relative">
        <DocumentCanvas
          editor={editor}
          canvasRef={canvasRef}
          paperKey={paperKey}
          orientation={orientation}
          marginKey={marginKey}
          zoom={zoom}
          lineSpacing="1.5"
          columns={1}
          showRuler={true}
          showGridlines={false}
          showLineNumbers={false}
          showHeader={showHeader}
          headerText={headerText}
          setHeaderText={setHeaderText}
          showFooter={showFooter}
          footerText={footerText}
          setFooterText={setFooterText}
          workspaceIsReadOnly={workspaceIsReadOnly}
          isTemplateActive={isTemplateActive}
          totalPages={totalPages}
          activeEditingArea={activeEditingArea}
          setActiveEditingArea={setActiveEditingArea}
          headerEditor={headerEditor}
          footerEditor={footerEditor}
          docxBuffer={docxBuffer}
          setDocxBuffer={setDocxBuffer}
          setTotalPages={setTotalPages}
          setCurrentPage={setCurrentPage}
          setWordCount={setWordCount}
          setCharCount={setCharCount}
        />
      </div>

      {/* ── Status Bar ── */}
      <StatusBar
        wordCount={wordCount}
        charCount={charCount}
        paperKey={paperKey}
        orientation={orientation}
        marginKey={marginKey}
        zoom={zoom}
        setZoom={setZoom}
        loading={loading}
        isOffline={isOffline}
        workspaceIsReadOnly={workspaceIsReadOnly}
        onSaveDraft={() => handleSave('draft')}
        onSubmit={() => handleSave('submitted')}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* ── Dialogs ── */}
      <DocPropertiesDialog
        show={showDocProps}
        onClose={() => setShowDocProps(false)}
        workspaceReportAY={workspaceReportAY}
        setWorkspaceReportAY={setWorkspaceReportAY}
        workspaceReportSem={workspaceReportSem}
        setWorkspaceReportSem={setWorkspaceReportSem}
        workspaceReportType={workspaceReportType}
        setWorkspaceReportType={setWorkspaceReportType}
        workspaceReportOrgId={workspaceReportOrgId}
        setWorkspaceReportOrgId={setWorkspaceReportOrgId}
        workspaceReportBenef={workspaceReportBenef}
        setWorkspaceReportBenef={setWorkspaceReportBenef}
        workspaceReportEventId={workspaceReportEventId}
        setWorkspaceReportEventId={setWorkspaceReportEventId}
        workspaceReportTitle={workspaceReportTitle}
        setWorkspaceReportTitle={setWorkspaceReportTitle}
        workspaceReportDate={workspaceReportDate}
        setWorkspaceReportDate={setWorkspaceReportDate}
        workspaceReportLocation={workspaceReportLocation}
        setWorkspaceReportLocation={setWorkspaceReportLocation}
        workspaceIsReadOnly={workspaceIsReadOnly}
        workspaceFeedback={workspaceFeedback}
        linkToEvent={linkToEvent}
        setLinkToEvent={setLinkToEvent}
        orgsList={orgsList}
        eventsList={eventsList}
      />

      <input
        type="file"
        ref={templateInputRef}
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleImportTemplateFile}
      />

      <input
        type="file"
        ref={docxInputRef}
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleOpenLocalDocx}
      />

      <input
        type="file"
        ref={pdfInputRef}
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleOpenLocalPdf}
      />

      <FloatingToolbar editor={editor} />
      <TableFloatingToolbar editor={editor} />

      {/* ── Unsaved Changes Confirmation Modal ── */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-navy-blue px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Unsaved Changes</h3>
                <p className="text-white/70 text-xs mt-0.5">You have unsaved changes. Do you want to save before leaving?</p>
              </div>
            </div>
            {/* Actions */}
            <div className="px-6 py-4 flex items-center justify-end gap-2 bg-neutral-50">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveConfirm(false)
                  setHasUnsavedChanges(false)
                  executeBackNavigation()
                }}
                className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all cursor-pointer"
              >
                Leave Without Saving
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLeaveConfirm(false)
                  const saveTargetStatus = workspaceReportStatus === 'returned' ? 'returned' : 'draft'
                  await handleSave(saveTargetStatus, true)
                  executeBackNavigation()
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-navy-blue border border-navy-blue rounded-lg hover:bg-navy-blue/90 transition-all cursor-pointer"
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Google Docs Integration & Script Modal ── */}
      <GoogleDocsModal
        isOpen={showGoogleDocsModal}
        onClose={() => setShowGoogleDocsModal(false)}
        editor={editor}
        docTitle={docTitle}
        workspaceReportId={workspaceReportId}
        googleDocsUrl={googleDocsUrl}
        onSaveGoogleDocsUrl={handleSaveGoogleDocsUrl}
        onSaveDraft={async (explicitUrl) => {
          if (explicitUrl) {
            setGoogleDocsUrl(explicitUrl)
            if (workspaceReportId) {
              localStorage.setItem(`dommunity_gdocs_${workspaceReportId}`, explicitUrl)
            }
          }
          return await handleSave('draft', false, explicitUrl)
        }}
        onSubmitToAdmin={async (explicitUrl) => {
          if (explicitUrl) {
            setGoogleDocsUrl(explicitUrl)
            if (workspaceReportId) {
              localStorage.setItem(`dommunity_gdocs_${workspaceReportId}`, explicitUrl)
            }
          }
          return await handleSave('submitted', false, explicitUrl)
        }}
        user={user}
      />
    </div>
  )
}
