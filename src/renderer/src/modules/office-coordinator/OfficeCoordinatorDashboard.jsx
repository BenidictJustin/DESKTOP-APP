/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import AboutVersionCard from '../../components/AboutVersionCard'
import UpcomingEventsSchedule from '../../components/UpcomingEventsSchedule'
import OrganizationalChart from '../../components/OrganizationalChart'
import DevelopersChart from '../../components/DevelopersChart'
import AnimatedPage from '../../components/motion/AnimatedPage'
import { staggerContainer, staggerItem } from '../../components/motion/motionConfig'
import {
  getReports,
  subscribeReports,
  addReport,
  updateReport,
  getOrganizations,
  subscribeOrganizations,
  getEvents,
  subscribeEvents,
  getUsers,
  subscribeUsers,
  uploadDocxReportFile
} from '../../services/db'
import logo from '../../assets/logo.png'
import logo2Img from '../../assets/logo2.png'
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  LogOut,
  Plus,
  Edit3,
  AlertTriangle,
  Check,
  Home,
  Info,
  Users,
  Eye,
  Rocket,
  Target,
  Download,
  Layers,
  Calendar,
  X,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Search,
  Upload
} from 'lucide-react'
import TextEditor from '../../components/editor/TextEditor'
import DocumentViewer from '../../components/DocumentViewer'
import DocxUploadModal from '../../components/DocxUploadModal'
import AnimatedSidebar from '../../components/AnimatedSidebar'
import AnimatedModal from '../../components/motion/AnimatedModal'
import {
  sanitizeOklchInDocument,
  loadInitialContentAndResetHistory,
  exportElementToPDF,
  resolveHeaderHtml,
  parseNarrativePages,
  downloadFileFromUrl,
  exportDocxToPDF
} from '../../components/editor/utils/editorHelpers'
import { PAPER, MARGINS } from '../../components/editor/constants'
import { useNetworkStatus } from '../../context/NetworkContext'
import {
  CoordinatorDashboardSkeleton,
  ReportsSkeleton,
  AboutSkeleton,
  DocumentEditorSkeleton
} from '../../components/skeletons'

// ─── Status Badge helper ───────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-warning-100 text-warning-700',
    approved: 'bg-success-100 text-success-700',
    returned: 'bg-error-100 text-error-700'
  }
  return (
    <span
      className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}
    >
      {status}
    </span>
  )
}

export default function OfficeCoordinatorDashboard({ user, onLogout }) {
  const { isOffline, registerReconnectHandler } = useNetworkStatus()
  // ── Navigation ──
  const [activeTab, setActiveTab] = useState('dashboard')
  const [previousTab, setPreviousTab] = useState('reports')
  const [editorOrigin, setEditorOrigin] = useState(null) // 'new' | 'reports' — tracks where user came from

  const navigateTab = useCallback(
    (nextTab) => {
      if (activeTab !== 'editor') {
        setPreviousTab(activeTab)
      }
      setActiveTab(nextTab)
    },
    [activeTab]
  )

  // ── Report metadata ──
  const [workspaceReportId, setWorkspaceReportId] = useState(null)
  const [workspaceReportStatus, setWorkspaceReportStatus] = useState('draft')
  const [workspaceReportAY, setWorkspaceReportAY] = useState('2026-2027')
  const [workspaceReportSem, setWorkspaceReportSem] = useState('1st Semester')
  const [workspaceReportType, setWorkspaceReportType] = useState('outreach')
  const [workspaceReportEventId, setWorkspaceReportEventId] = useState('')
  const [workspaceReportTitle, setWorkspaceReportTitle] = useState('')
  const [workspaceReportDate, setWorkspaceReportDate] = useState('')
  const [workspaceReportLocation, setWorkspaceReportLocation] = useState('')
  const [workspaceReportBenef, setWorkspaceReportBenef] = useState('')
  const [workspaceReportOrgId, setWorkspaceReportOrgId] = useState('')
  const [workspaceReportPhotos, setWorkspaceReportPhotos] = useState([])
  const [workspaceIsReadOnly, setWorkspaceIsReadOnly] = useState(false)
  const [workspaceFeedback, setWorkspaceFeedback] = useState(null)
  const [linkToEvent, setLinkToEvent] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [autoSave, setAutoSave] = useState(false)
  const [selectedViewerReport, setSelectedViewerReport] = useState(null)
  const [exportingReport, setExportingReport] = useState(null)
  const [exportingDocxReport, setExportingDocxReport] = useState(null)
  const [selectedViewEvent, setSelectedViewEvent] = useState(null)
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false)
  const [showAllCompleted, setShowAllCompleted] = useState(false)
  const [compiledReportsTab, setCompiledReportsTab] = useState('draft') // 'draft' | 'submitted' | 'returned' | 'approved'
  const [approvedSearchQuery, setApprovedSearchQuery] = useState('')
  const [isDocxUploadModalOpen, setIsDocxUploadModalOpen] = useState(false)
  const [isDocxUploading, setIsDocxUploading] = useState(false)

  // ── Database ──
  const [reportsList, setReportsList] = useState([])
  const [orgsList, setOrgsList] = useState([])
  const [eventsList, setEventsList] = useState([])
  const [usersList, setUsersList] = useState([])

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      const [reports, orgs, events, users] = await Promise.all([
        getReports(),
        getOrganizations(),
        getEvents(),
        getUsers()
      ])
      setReportsList(reports)
      setOrgsList(orgs)
      setEventsList(events)
      setUsersList(users)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadData()
    const unsubReconnect = registerReconnectHandler(() => {
      loadData()
    })
    const unsubReports = subscribeReports((reports) => setReportsList(reports))
    const unsubOrgs = subscribeOrganizations((orgs) => setOrgsList(orgs))
    const unsubEvents = subscribeEvents((events) => setEventsList(events))
    const unsubUsers = subscribeUsers((users) => setUsersList(users))
    return () => {
      if (typeof unsubReconnect === 'function') unsubReconnect()
      if (typeof unsubReports === 'function') unsubReports()
      if (typeof unsubOrgs === 'function') unsubOrgs()
      if (typeof unsubEvents === 'function') unsubEvents()
      if (typeof unsubUsers === 'function') unsubUsers()
    }
  }, [loadData, registerReconnectHandler])

  // Body scroll lock effect whenever any modal/dialog is open
  useEffect(() => {
    if (selectedViewerReport || exportingReport || exportingDocxReport || isViewEventModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedViewerReport, exportingReport, exportingDocxReport, isViewEventModalOpen])

  // ── Reset form (clear all fields + editor) ──
  const resetForm = useCallback((editor) => {
    setWorkspaceReportId(null)
    setWorkspaceReportAY('2026-2027')
    setWorkspaceReportSem('1st Semester')
    setWorkspaceReportType('outreach')
    setWorkspaceReportEventId('')
    setWorkspaceReportTitle('')
    setWorkspaceReportDate('')
    setWorkspaceReportLocation('')
    setWorkspaceReportBenef('')
    setWorkspaceReportOrgId('')
    setWorkspaceReportPhotos([])
    setWorkspaceReportStatus('draft')
    setWorkspaceIsReadOnly(false)
    setWorkspaceFeedback(null)
    setLinkToEvent(true)
    // Reset editor content
    if (window.__dommunityResetEditorLayout) {
      try {
        window.__dommunityResetEditorLayout()
      } catch (err) {
        console.error('Reset editor layout failed:', err)
      }
    } else {
      const ed = editor || window.__dommunityEditor
      if (ed) {
        ed.setEditable(true)
        loadInitialContentAndResetHistory(ed, '<p></p>')
        setTimeout(() => ed.commands.focus('start'), 50)
      }
    }
  }, [])

  // ── Open a report for editing ──
  const openReport = useCallback((rep, editor) => {
    setWorkspaceReportId(rep.id)
    setWorkspaceReportAY(rep.academicYear || '2026-2027')
    setWorkspaceReportSem(rep.semester || '1st Semester')
    setWorkspaceReportType(rep.type || 'outreach')
    setWorkspaceReportEventId(rep.eventId || '')
    setWorkspaceReportTitle(rep.activityTitle || '')
    setWorkspaceReportDate(
      rep.activityDate ? new Date(rep.activityDate).toISOString().split('T')[0] : ''
    )
    setWorkspaceReportLocation(rep.location || '')
    setWorkspaceReportBenef(rep.beneficiaries || '')
    setWorkspaceReportOrgId(rep.organizationId || '')
    setWorkspaceReportPhotos(rep.photos || [])
    setWorkspaceReportStatus(rep.status || 'draft')
    const isReadOnly = rep.status === 'submitted' || rep.status === 'approved'
    setWorkspaceIsReadOnly(isReadOnly)
    setWorkspaceFeedback(rep.status === 'returned' ? rep.adminFeedback : null)
    setLinkToEvent(!!rep.eventId)
    // Load content into editor
    const ed = editor || window.__dommunityEditor
    if (ed) {
      ed.setEditable(!isReadOnly)
      loadInitialContentAndResetHistory(ed, rep.narrative || '<p></p>')
      setTimeout(() => {
        if (!isReadOnly) ed.commands.focus('end')
      }, 100)
    }
    setPreviousTab('reports')
    setEditorOrigin('reports')
    setActiveTab('editor')
  }, [])

  // ── Save/Submit handler ──
  const handleSave = useCallback(
    async (status, html, silent = false, layoutOptions = {}) => {
      if (isOffline) {
        if (!silent) {
          alert('Cannot save or submit report: Internet connection is offline. Your draft remains safe in the editor. Please reconnect to sync.')
        }
        setSaveStatus('offline')
        return
      }

      if (!html || html === '<p></p>') {
        if (!silent) alert('Please write some content before saving.')
        return
      }

      let title = workspaceReportTitle
      let date = workspaceReportDate
      let location = workspaceReportLocation

      if (linkToEvent && workspaceReportEventId) {
        const ev = eventsList.find((e) => e.id === workspaceReportEventId)
        if (ev) {
          title = ev.name
          date = ev.scheduleDate
          location = ev.venueLocation || ''
        }
      }

      setSaveStatus('saving')
      setLoading(true)
      try {
        let effectiveStatus = status
        // If the report is currently in 'returned' status and user saves progress (Save & Leave or Save Draft),
        // preserve status as 'returned' so it does not revert to 'draft'.
        if (workspaceReportStatus === 'returned' && status === 'draft') {
          effectiveStatus = 'returned'
        }

        const payload = {
          academicYear: workspaceReportAY,
          semester: workspaceReportSem,
          type: workspaceReportType,
          eventId: linkToEvent ? workspaceReportEventId : null,
          activityTitle: title,
          activityDate: date,
          location,
          beneficiaries: workspaceReportBenef,
          organizationId: workspaceReportOrgId || null,
          narrative: html,
          photos: workspaceReportPhotos,
          status: effectiveStatus,
          adminFeedback: effectiveStatus === 'submitted' ? null : (workspaceReportStatus === 'returned' ? workspaceFeedback : null),
          authorId: user.uid,
          authorName: user.name,
          authorEmail: user.email,
          updatedAt: new Date().toISOString(),
          headerText: layoutOptions.headerText || '',
          footerText: layoutOptions.footerText || '',
          showHeader: layoutOptions.showHeader !== undefined ? layoutOptions.showHeader : true,
          showFooter: layoutOptions.showFooter !== undefined ? layoutOptions.showFooter : true,
          paperKey: layoutOptions.paperKey || 'Letter',
          orientation: layoutOptions.orientation || 'portrait',
          marginKey: layoutOptions.marginKey || 'Normal',
          isTemplateActive:
            layoutOptions.isTemplateActive !== undefined ? layoutOptions.isTemplateActive : true
        }

        if (workspaceReportId) {
          await updateReport(workspaceReportId, payload, user.uid)
        } else {
          payload.createdAt = new Date().toISOString()
          const newReportObj = await addReport(payload, user.uid)
          if (newReportObj) {
            const actualId = newReportObj.id || newReportObj
            setWorkspaceReportId(actualId)
          }
        }

        if (effectiveStatus === 'submitted') {
          setWorkspaceReportStatus('submitted')
        }

        setSaveStatus('saved')
        if (!silent) {
          alert(
            effectiveStatus === 'returned'
              ? 'Changes saved to returned report successfully!'
              : status === 'draft'
                ? 'Draft saved successfully!'
                : 'Report submitted to Admin successfully!'
          )
          if (effectiveStatus !== 'returned') {
            resetForm()
          }
          if (status === 'submitted') {
            setCompiledReportsTab('submitted')
            setActiveTab('reports')
          }
        }
        loadData()
      } catch (err) {
        console.error('Save failed:', err)
        setSaveStatus('error')
        if (!silent) alert('Save failed. Please try again.')
      } finally {
        setLoading(false)
        setTimeout(() => setSaveStatus(''), 3000)
      }
    },
    [
      workspaceReportId,
      workspaceReportAY,
      workspaceReportSem,
      workspaceReportType,
      workspaceReportEventId,
      workspaceReportTitle,
      workspaceReportDate,
      workspaceReportLocation,
      workspaceReportBenef,
      workspaceReportOrgId,
      workspaceReportPhotos,
      workspaceReportStatus,
      workspaceFeedback,
      linkToEvent,
      eventsList,
      user,
      isOffline,
      resetForm,
      loadData
    ]
  )

  // ── Direct DOCX Upload & Submit Handler (Bypasses Tiptap to preserve 100% formatting) ──
  const handleDocxUploadSubmit = async ({ file, comment, eventId }) => {
    if (isOffline) {
      alert('Cannot submit report: Internet connection is offline. Please reconnect to sync.')
      return
    }
    setIsDocxUploading(true)
    try {
      // 1. Upload raw DOCX file without conversion to preserve formatting
      const downloadUrl = await uploadDocxReportFile(workspaceReportAY || '2024-2025', eventId, file)

      let title = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')
      let date = new Date().toISOString().split('T')[0]
      let location = ''

      if (eventId) {
        const ev = eventsList.find((e) => e.id === eventId)
        if (ev) {
          title = ev.name
          date = ev.scheduleDate || date
          location = ev.venueLocation || ''
        }
      }

      // 2. Submit directly to Admin with 'submitted' status
      const isPdf = file.name.toLowerCase().endsWith('.pdf')
      const payload = {
        submissionType: 'docx_upload',
        fileType: isPdf ? 'pdf' : 'docx',
        academicYear: workspaceReportAY || '2024-2025',
        semester: workspaceReportSem || '1st Semester',
        type: workspaceReportType || 'Narrative',
        eventId: eventId || null,
        activityTitle: title,
        activityDate: date,
        location,
        beneficiaries: '',
        organizationId: workspaceReportOrgId || user.organizationId || null,
        narrative: '', // Bypasses Tiptap editor
        originalDocxName: file.name,
        originalDocxSize: file.size,
        originalDocxUrl: downloadUrl,
        comment: comment || '',
        photos: [],
        status: 'submitted',
        authorId: user.uid,
        authorName: user.name || user.username || 'Coordinator',
        authorEmail: user.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addReport(payload, user.uid)
      setIsDocxUploadModalOpen(false)
      alert(`Original ${isPdf ? 'PDF' : 'Word'} document submitted directly to Admin successfully! Formatting is 100% preserved.`)
      setCompiledReportsTab('submitted')
      setActiveTab('reports')
      await loadData()
    } catch (err) {
      console.error('Failed to submit document report:', err)
      alert('Failed to submit report: ' + (err.message || err))
    } finally {
      setIsDocxUploading(false)
    }
  }

  const compileReportPDF = useCallback(async (report) => {
    if (report?.submissionType === 'docx_upload' || report?.originalDocxUrl) {
      if (report.fileType === 'pdf' || report.originalDocxName?.toLowerCase().endsWith('.pdf')) {
        downloadFileFromUrl(
          report.originalDocxUrl,
          report.originalDocxName || `${report.activityTitle || 'Report'}.pdf`
        )
        return
      }
      try {
        await exportDocxToPDF(
          report.originalDocxUrl,
          report.originalDocxName || report.activityTitle || 'Report'
        )
      } catch (err) {
        console.error('Failed to export DOCX as PDF, falling back to original DOCX download:', err)
        downloadFileFromUrl(
          report.originalDocxUrl,
          report.originalDocxName || `${report.activityTitle || 'Report'}.docx`
        )
      }
      return
    }
    setExportingReport(report)
  }, [])

  const compileReportDOCX = useCallback(async (report) => {
    if (report?.submissionType === 'docx_upload' || report?.originalDocxUrl) {
      downloadFileFromUrl(
        report.originalDocxUrl,
        report.originalDocxName || `${report.activityTitle || 'Report'}.${report.fileType === 'pdf' ? 'pdf' : 'docx'}`
      )
      return
    }
    setExportingDocxReport(report)
  }, [])

  // Helper to extract timestamp for chronological sorting (oldest first)
  const getReportTimestamp = (rep, targetStatus) => {
    if (!rep) return 0
    if (targetStatus === 'draft') {
      if (rep.createdAt) {
        const t = new Date(rep.createdAt).getTime()
        if (!isNaN(t)) return t
      }
      if (rep.updatedAt) {
        const t = new Date(rep.updatedAt).getTime()
        if (!isNaN(t)) return t
      }
    }
    if (targetStatus === 'returned') {
      if (rep.returnedAt) {
        const t = new Date(rep.returnedAt).getTime()
        if (!isNaN(t)) return t
      }
      if (Array.isArray(rep.history) && rep.history.length > 0) {
        const retEntry = [...rep.history].reverse().find((h) => h.status === 'returned')
        if (retEntry?.timestamp) {
          const t = new Date(retEntry.timestamp).getTime()
          if (!isNaN(t)) return t
        }
      }
    }
    if (targetStatus === 'approved') {
      if (rep.approvedAt) {
        const t = new Date(rep.approvedAt).getTime()
        if (!isNaN(t)) return t
      }
      if (Array.isArray(rep.history) && rep.history.length > 0) {
        const appEntry = [...rep.history].reverse().find((h) => h.status === 'approved')
        if (appEntry?.timestamp) {
          const t = new Date(appEntry.timestamp).getTime()
          if (!isNaN(t)) return t
        }
      }
    }
    if (rep.submittedAt) {
      const t = new Date(rep.submittedAt).getTime()
      if (!isNaN(t)) return t
    }
    if (Array.isArray(rep.history) && rep.history.length > 0) {
      const lastEntry = rep.history[rep.history.length - 1]
      if (lastEntry?.timestamp) {
        const t = new Date(lastEntry.timestamp).getTime()
        if (!isNaN(t)) return t
      }
    }
    if (rep.updatedAt) {
      const t = new Date(rep.updatedAt).getTime()
      if (!isNaN(t)) return t
    }
    if (rep.createdAt) {
      const t = new Date(rep.createdAt).getTime()
      if (!isNaN(t)) return t
    }
    return 0
  }

  // Helper for searching approved reports
  const getReportSearchableText = useCallback(
    (rep) => {
      if (!rep) return ''
      const ev = eventsList.find((e) => e.id === rep.eventId)
      const org = orgsList.find((o) => o.id === rep.organizationId)
      const author = usersList.find((u) => u.uid === rep.authorId)
      const rawNarrativeText = rep.narrative ? rep.narrative.replace(/<[^>]*>/g, ' ') : ''

      const fields = [
        rep.activityTitle,
        rep.title,
        rep.narrativeReportName,
        ev?.name,
        ev?.venue,
        ev?.location,
        ev?.description,
        author?.name,
        rep.authorName,
        rep.location,
        rep.beneficiaries,
        rep.academicYear,
        rep.semester,
        org?.name,
        org?.abbreviation,
        rawNarrativeText
      ]

      return fields.filter(Boolean).join(' ').toLowerCase()
    },
    [eventsList, orgsList, usersList]
  )

  // ── Derived ──
  const myReports = reportsList.filter((r) => {
    const ev = eventsList.find((e) => e.id === r.eventId)
    const title = ev?.name || r.activityTitle
    return !!(title && title.trim())
  })
  const stats = {
    total: myReports.length,
    drafts: myReports.filter((r) => r.status === 'draft').length,
    submitted: myReports.filter((r) => r.status === 'submitted').length,
    approved: myReports.filter((r) => r.status === 'approved').length,
    returned: myReports.filter((r) => r.status === 'returned').length
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ── RENDER ────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen max-h-screen flex flex-col font-poppins selection:bg-sig-green/20 selection:text-navy-blue overflow-hidden bg-[#F1EFEC]">
      {/* Top Glass Header Bar */}
      <header className="mx-2 sm:mx-4 mt-2 sm:mt-4 glass-header rounded-2xl flex items-center justify-between px-3 sm:px-6 py-2 sm:py-2.5 shrink-0 shadow-glass-sm gap-2">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm p-1.5 sm:p-2 pr-3 sm:pr-4 rounded-xl border border-white/60 min-w-0">
          <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg bg-white/90 flex items-center justify-center border border-white/80 overflow-hidden shrink-0 shadow-2xs">
            <img src={logo} alt="CES Logo" className="h-7 w-7 sm:h-9 sm:w-9 object-contain" />
          </div>
          <div className="flex flex-col text-left leading-none min-w-0">
            <span className="text-[10px] sm:text-[12px] font-bold text-navy-blue tracking-wide uppercase leading-tight truncate">
              COMMUNITY EXTENSION & SERVICES
            </span>
            <span className="text-[8px] sm:text-[10px] font-semibold text-sig-green tracking-wide uppercase mt-0.5 leading-tight truncate">
              DOMINICAN COLLEGE OF TARLAC
            </span>
          </div>
        </div>

        {/* Right: Info, Home, Profile info */}
        <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className="text-navy-blue hover:opacity-85 transition-all duration-150 cursor-pointer p-1"
            title="About DommUnity"
          >
            <Info className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 sm:space-x-3 bg-white/60 backdrop-blur-sm p-1.5 sm:p-2 pr-3 sm:pr-4 pl-2 sm:pl-3 rounded-xl border border-white/60">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-navy-blue/15 flex items-center justify-center text-navy-blue bg-white shadow-2xs shrink-0">
              <Users className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-navy-blue truncate max-w-[100px] sm:max-w-[140px]">
                {user.username || user.name || 'coordinator123'}
              </div>
              <div className="text-[9px] text-gray-400 font-medium mt-0.5 truncate max-w-[100px] sm:max-w-[140px] hidden sm:block">{user.email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <AnimatedSidebar
          tabs={[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'editor', label: 'Document Editor', icon: FileText },
            {
              id: 'reports',
              label: 'Compiled Reports',
              icon: FolderOpen,
              badge: stats.returned > 0 ? stats.returned : 0
            },
            { id: 'about', label: 'About', icon: Info }
          ]}
          activeTab={activeTab}
          setActiveTab={navigateTab}
          disabled={Boolean(selectedViewerReport)}
          onLogout={onLogout}
          user={user}
        />

        {/* Main Panel Content Area */}
        <main className="flex-1 my-2 sm:my-4 mx-2 sm:mx-4 glass-panel rounded-2xl shadow-glass-md overflow-hidden flex flex-col min-w-0">
          <AnimatedPage pageKey={activeTab} className="h-full flex flex-col">
            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              isOffline ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                  <div className="max-w-5xl mx-auto">
                    <CoordinatorDashboardSkeleton />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                  <div className="max-w-5xl mx-auto space-y-6">
                    {/* Stats row */}
                    <motion.div
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      {[
                        {
                          label: 'Total Reports',
                          value: stats.total,
                          iconBg: 'bg-blue-50 text-blue-500',
                          icon: FileText
                        },
                        {
                          label: 'Drafts',
                          value: stats.drafts,
                          iconBg: 'bg-gray-100 text-gray-500',
                          icon: Edit3
                        },
                        {
                          label: 'Submitted',
                          value: stats.submitted,
                          iconBg: 'bg-amber-50 text-amber-500',
                          icon: Layers
                        },
                        {
                          label: 'Approved',
                          value: stats.approved,
                          iconBg: 'bg-green-50 text-green-500',
                          icon: Check
                        },
                        {
                          label: 'Returned',
                          value: stats.returned,
                          iconBg: 'bg-red-50 text-red-500',
                          icon: AlertTriangle
                        }
                      ].map((s) => {
                        const StatIcon = s.icon
                        return (
                          <motion.div
                            key={s.label}
                            variants={staggerItem}
                            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md hover:border-sig-green/30 transition-all duration-200"
                          >
                            <div className={`p-2.5 ${s.iconBg} rounded-xl shrink-0`}>
                              <StatIcon className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider block leading-none mb-1">
                                {s.label}
                              </span>
                              <span className="text-xl font-black text-navy-blue leading-none">
                                {s.value}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </motion.div>

                    {/* Quick actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="flex items-center gap-2 bg-navy-blue text-white text-xs font-semibold px-4 py-2.5 rounded-xl border-b-2 border-sig-green hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>View My Reports</span>
                      </button>
                    </div>

                    {/* Upcoming Events Calendar Schedule Widget */}
                    <UpcomingEventsSchedule
                      events={eventsList}
                      orgs={orgsList}
                      onViewEvent={(evt) => {
                        setSelectedViewEvent(evt)
                        setIsViewEventModalOpen(true)
                      }}
                    />
                  </div>
                </div>
              )
            )}

            {/* ── WORD EDITOR ── */}
            <div
              className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'editor' ? '' : 'hidden'}`}
            >
              {isOffline ? (
                <DocumentEditorSkeleton />
              ) : (
                <TextEditor
                  user={user}
                  isOffline={isOffline}
                  workspaceReportId={workspaceReportId}
                  setWorkspaceReportId={setWorkspaceReportId}
                  workspaceReportAY={workspaceReportAY}
                  setWorkspaceReportAY={setWorkspaceReportAY}
                  workspaceReportSem={workspaceReportSem}
                  setWorkspaceReportSem={setWorkspaceReportSem}
                  workspaceReportType={workspaceReportType}
                  setWorkspaceReportType={setWorkspaceReportType}
                  workspaceReportEventId={workspaceReportEventId}
                  setWorkspaceReportEventId={setWorkspaceReportEventId}
                  workspaceReportTitle={workspaceReportTitle}
                  setWorkspaceReportTitle={setWorkspaceReportTitle}
                  workspaceReportDate={workspaceReportDate}
                  setWorkspaceReportDate={setWorkspaceReportDate}
                  workspaceReportLocation={workspaceReportLocation}
                  setWorkspaceReportLocation={setWorkspaceReportLocation}
                  workspaceReportBenef={workspaceReportBenef}
                  setWorkspaceReportBenef={setWorkspaceReportBenef}
                  workspaceReportOrgId={workspaceReportOrgId}
                  setWorkspaceReportOrgId={setWorkspaceReportOrgId}
                  workspaceReportPhotos={workspaceReportPhotos}
                  setWorkspaceReportPhotos={setWorkspaceReportPhotos}
                  workspaceIsReadOnly={workspaceIsReadOnly}
                  setWorkspaceIsReadOnly={setWorkspaceIsReadOnly}
                  workspaceFeedback={workspaceFeedback}
                  linkToEvent={linkToEvent}
                  setLinkToEvent={setLinkToEvent}
                  loading={loading}
                  setLoading={setLoading}
                  saveStatus={saveStatus}
                  setSaveStatus={setSaveStatus}
                  autoSave={autoSave}
                  setAutoSave={setAutoSave}
                  reportsList={reportsList}
                  orgsList={orgsList}
                  eventsList={eventsList}
                  onSave={handleSave}
                  onResetForm={resetForm}
                  onOpenReport={openReport}
                  onLoadData={loadData}
                  setActiveTab={setActiveTab}
                  editorOrigin={editorOrigin}
                  workspaceReportStatus={workspaceReportStatus}
                  onBack={() => {
                    const target = previousTab || 'reports'
                    setActiveTab(target === 'editor' ? 'reports' : target)
                    setEditorOrigin(null)
                  }}
                  StatusBadge={StatusBadge}
                />
              )}
            </div>

            {/* ── COMPILED REPORTS ── */}
            {activeTab === 'reports' && (
              isOffline ? (
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-4xl mx-auto">
                    <ReportsSkeleton />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                  <div className="max-w-4xl mx-auto space-y-4">
                    {/* Header with Title and Segmented Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">Compiled Reports</h1>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                        {/* Segmented Status Navigation Control */}
                        <div className="bg-gray-100/90 p-1 rounded-full flex items-center gap-1 border border-gray-200/80 shadow-2xs">
                          {/* Draft Tab */}
                          <button
                            type="button"
                            onClick={() => setCompiledReportsTab('draft')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none ${
                              compiledReportsTab === 'draft'
                                ? 'bg-navy-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-navy-blue hover:bg-white/50'
                            }`}
                          >
                            <span>Draft</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none inline-flex items-center justify-center ${
                                compiledReportsTab === 'draft'
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {stats.drafts}
                            </span>
                          </button>

                          {/* Submitted Tab (Pending Admin Review) */}
                          <button
                            type="button"
                            onClick={() => setCompiledReportsTab('submitted')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none ${
                              compiledReportsTab === 'submitted'
                                ? 'bg-navy-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-navy-blue hover:bg-white/50'
                            }`}
                          >
                            <span>Submitted</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none inline-flex items-center justify-center ${
                                stats.submitted > 0
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : compiledReportsTab === 'submitted'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {stats.submitted}
                            </span>
                          </button>

                          {/* Returned Tab */}
                          <button
                            type="button"
                            onClick={() => setCompiledReportsTab('returned')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none ${
                              compiledReportsTab === 'returned'
                                ? 'bg-navy-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-navy-blue hover:bg-white/50'
                            }`}
                          >
                            <span>Returned</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none inline-flex items-center justify-center ${
                                stats.returned > 0
                                  ? 'bg-red-500 text-white shadow-xs'
                                  : compiledReportsTab === 'returned'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {stats.returned}
                            </span>
                          </button>

                          {/* Approved Tab */}
                          <button
                            type="button"
                            onClick={() => setCompiledReportsTab('approved')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 select-none ${
                              compiledReportsTab === 'approved'
                                ? 'bg-navy-blue text-white shadow-sm'
                                : 'text-gray-600 hover:text-navy-blue hover:bg-white/50'
                            }`}
                          >
                            <span>Approved</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center leading-none inline-flex items-center justify-center ${
                                compiledReportsTab === 'approved'
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {stats.approved}
                            </span>
                          </button>
                        </div>

                        {/* Action Buttons: New Report (Editor) and Upload (Direct) */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              resetForm()
                              setPreviousTab('reports')
                              setEditorOrigin('new')
                              setActiveTab('editor')
                            }}
                            className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-bold px-3.5 py-2 rounded-full border-b-2 border-sig-green hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer shadow-sm shrink-0"
                            title="Create new report in Document Editor"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>New Report</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsDocxUploadModalOpen(true)}
                            className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-bold px-3.5 py-2 rounded-full border-b-2 border-sig-green hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer shadow-sm shrink-0"
                            title="Upload report document (.docx, .pdf)"
                          >
                            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Upload</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* View Modes with Motion Transition */}
                    <AnimatePresence mode="wait">
                      {compiledReportsTab === 'draft' && (
                        <motion.div
                          key="coordinator-drafts-tab"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="space-y-4"
                        >
                          {(() => {
                            const draftReports = myReports
                              .filter((r) => r.status === 'draft')
                              .sort((a, b) => getReportTimestamp(a, 'draft') - getReportTimestamp(b, 'draft'))

                            if (draftReports.length === 0) {
                              return (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                  No draft reports yet. Click &quot;New Report&quot; to get started.
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-3">
                                {draftReports.map((rep) => {
                                  const ev = eventsList.find((e) => e.id === rep.eventId)
                                  const org = orgsList.find((o) => o.id === rep.organizationId)
                                  const author = usersList.find((u) => u.uid === rep.authorId)
                                  return (
                                    <div
                                      key={rep.id}
                                      className="bg-white rounded-2xl border border-gray-100 hover:border-sig-green/30 p-4 flex flex-col md:flex-row md:items-center justify-between transition-all duration-200 group shadow-xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={rep.status} />
                                          {org && (
                                            <span className="text-[10px] text-navy-blue font-bold">
                                              {org.name} ({org.abbreviation})
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-sm font-bold text-navy-blue">
                                          {ev?.name || rep.activityTitle || 'Untitled Draft'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400">
                                          Created by{' '}
                                          <span className="font-semibold text-gray-700">
                                            {author ? author.name : 'Coordinator'}
                                          </span>{' '}
                                          · Draft dated {new Date(getReportTimestamp(rep, 'draft')).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="mt-3 md:mt-0 flex items-center gap-2">
                                        <button
                                          onClick={() => setSelectedViewerReport(rep)}
                                          className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>View</span>
                                        </button>
                                        <button
                                          onClick={() => compileReportDOCX(rep)}
                                          className="flex items-center gap-1 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                          title="Export Draft to DOCX"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>DOCX</span>
                                        </button>
                                        <button
                                          onClick={() => compileReportPDF(rep)}
                                          className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                          title="Export Draft to PDF"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Export PDF</span>
                                        </button>
                                        <button
                                          onClick={() => openReport(rep)}
                                          className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer shadow-xs"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>Edit</span>
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </motion.div>
                      )}

                      {compiledReportsTab === 'submitted' && (
                        <motion.div
                          key="coordinator-submitted-tab"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="space-y-4"
                        >
                          {(() => {
                            const submittedReports = myReports
                              .filter((r) => r.status === 'submitted')
                              .sort((a, b) => getReportTimestamp(a, 'submitted') - getReportTimestamp(b, 'submitted'))

                            if (submittedReports.length === 0) {
                              return (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                  No submitted reports pending review.
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-3">
                                {submittedReports.map((rep) => {
                                  const ev = eventsList.find((e) => e.id === rep.eventId)
                                  const org = orgsList.find((o) => o.id === rep.organizationId)
                                  const author = usersList.find((u) => u.uid === rep.authorId)
                                  const isDocxUpload = rep.submissionType === 'docx_upload' || Boolean(rep.originalDocxUrl)

                                  return (
                                    <div
                                      key={rep.id}
                                      className="bg-white rounded-2xl border border-amber-100 hover:border-amber-300 p-4 flex flex-col md:flex-row md:items-center justify-between transition-all duration-200 group shadow-xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={rep.status} />
                                          {org && (
                                            <span className="text-[10px] text-navy-blue font-bold">
                                              {org.name} ({org.abbreviation})
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-sm font-bold text-navy-blue">
                                          {ev?.name || rep.activityTitle || 'Untitled Report'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400">
                                          Submitted by{' '}
                                          <span className="font-semibold text-gray-700">
                                            {author ? author.name : 'Coordinator'}
                                          </span>{' '}
                                          · Submitted on {new Date(getReportTimestamp(rep, 'submitted')).toLocaleDateString()}
                                          {rep.originalDocxName && (
                                            <span className="ml-1 text-gray-500 font-medium truncate inline-block max-w-[200px] align-bottom">
                                              ({rep.originalDocxName})
                                            </span>
                                          )}
                                        </p>
                                        {rep.comment && (
                                          <p className="text-[11px] text-gray-600 bg-gray-50 border border-gray-150 rounded-lg px-2.5 py-1 mt-1 italic inline-block">
                                            &ldquo;{rep.comment}&rdquo;
                                          </p>
                                        )}
                                      </div>
                                      <div className="mt-3 md:mt-0 flex items-center gap-2">
                                        <button
                                          onClick={() => setSelectedViewerReport(rep)}
                                          className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>View</span>
                                        </button>
                                        {Boolean(isDocxUpload && rep.originalDocxUrl) ? (
                                          <div className="flex items-center gap-1.5">
                                            {Boolean(rep.fileType !== 'pdf' && !rep.originalDocxName?.toLowerCase().endsWith('.pdf')) && (
                                              <button
                                                onClick={() =>
                                                  downloadFileFromUrl(
                                                    rep.originalDocxUrl,
                                                    rep.originalDocxName || `${rep.activityTitle || 'Report'}.docx`
                                                  )
                                                }
                                                className="flex items-center gap-1 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                                title="Download Original DOCX Document"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>DOCX</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                              title="Export and Download as PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => compileReportDOCX(rep)}
                                              className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                              title="Download DOCX Document"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Download DOCX</span>
                                            </button>
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                              title="Export Report PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </motion.div>
                      )}

                      {compiledReportsTab === 'returned' && (
                        <motion.div
                          key="coordinator-returned-tab"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="space-y-4"
                        >
                          {(() => {
                            const returnedReports = myReports
                              .filter((r) => r.status === 'returned')
                              .sort((a, b) => getReportTimestamp(a, 'returned') - getReportTimestamp(b, 'returned'))

                            if (returnedReports.length === 0) {
                              return (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                  No returned reports for revision.
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-3">
                                {returnedReports.map((rep) => {
                                  const ev = eventsList.find((e) => e.id === rep.eventId)
                                  const org = orgsList.find((o) => o.id === rep.organizationId)
                                  const author = usersList.find((u) => u.uid === rep.authorId)
                                  return (
                                    <div
                                      key={rep.id}
                                      className="bg-white rounded-2xl border border-red-100 hover:border-red-300 p-4 flex flex-col md:flex-row md:items-center justify-between transition-all duration-200 group shadow-xs"
                                    >
                                      <div className="space-y-1.5 max-w-2xl">
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={rep.status} />
                                          {org && (
                                            <span className="text-[10px] text-navy-blue font-bold">
                                              {org.name} ({org.abbreviation})
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-sm font-bold text-navy-blue">
                                          {ev?.name || rep.activityTitle || 'Untitled Report'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400">
                                          Submitted by{' '}
                                          <span className="font-semibold text-gray-700">
                                            {author ? author.name : 'Coordinator'}
                                          </span>{' '}
                                          · Returned on {new Date(getReportTimestamp(rep, 'returned')).toLocaleDateString()}
                                        </p>
                                        {rep.adminFeedback && (
                                          <div className="bg-red-50/80 border border-red-150 rounded-xl p-2.5 mt-1 text-[11px] text-red-700 font-medium flex items-start gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                                            <div>
                                              <span className="font-bold block text-red-800 text-[10px] uppercase tracking-wider">
                                                Admin Revision Feedback:
                                              </span>
                                              {rep.adminFeedback}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                      <div className="mt-3 md:mt-0 flex items-center gap-2 shrink-0">
                                        <button
                                          onClick={() => setSelectedViewerReport(rep)}
                                          className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>View</span>
                                        </button>
                                        {Boolean(rep.submissionType === 'docx_upload' || rep.originalDocxUrl) ? (
                                          <div className="flex items-center gap-1.5">
                                            {Boolean(rep.fileType !== 'pdf' && !rep.originalDocxName?.toLowerCase().endsWith('.pdf')) && (
                                              <button
                                                onClick={() =>
                                                  downloadFileFromUrl(
                                                    rep.originalDocxUrl,
                                                    rep.originalDocxName || `${rep.activityTitle || 'Report'}.docx`
                                                  )
                                                }
                                                className="flex items-center gap-1 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                                title="Download Original DOCX Document"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>DOCX</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                              title="Export and Download as PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => compileReportDOCX(rep)}
                                              className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                              title="Download DOCX Document"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Download DOCX</span>
                                            </button>
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                              title="Export Report PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        )}
                                        <button
                                          onClick={() => openReport(rep)}
                                          className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer shadow-xs"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                          <span>Edit & Revise</span>
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </motion.div>
                      )}

                      {compiledReportsTab === 'approved' && (
                        <motion.div
                          key="coordinator-approved-tab"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="space-y-4"
                        >
                          {/* Live Search Input */}
                          <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={approvedSearchQuery}
                              onChange={(e) => setApprovedSearchQuery(e.target.value)}
                              placeholder="Search approved reports by title, author, venue, program, department, beneficiaries..."
                              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs text-navy-blue placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-navy-blue/20 focus:border-navy-blue transition duration-150 shadow-2xs"
                            />
                            {approvedSearchQuery && (
                              <button
                                onClick={() => setApprovedSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-blue p-0.5 rounded-full"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {(() => {
                            const approvedReports = myReports
                              .filter((r) => r.status === 'approved')
                              .sort((a, b) => getReportTimestamp(a, 'approved') - getReportTimestamp(b, 'approved'))

                            const filteredApproved = approvedReports.filter((rep) => {
                              if (!approvedSearchQuery.trim()) return true
                              const query = approvedSearchQuery.toLowerCase().trim()
                              const searchableText = getReportSearchableText(rep)
                              return searchableText.includes(query)
                            })

                            if (approvedReports.length === 0) {
                              return (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                  No approved reports yet.
                                </div>
                              )
                            }

                            if (filteredApproved.length === 0) {
                              return (
                                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                                  No approved reports match your search criteria &quot;{approvedSearchQuery}&quot;.
                                </div>
                              )
                            }

                            return (
                              <div className="space-y-3">
                                {filteredApproved.map((rep) => {
                                  const ev = eventsList.find((e) => e.id === rep.eventId)
                                  const org = orgsList.find((o) => o.id === rep.organizationId)
                                  const author = usersList.find((u) => u.uid === rep.authorId)
                                  return (
                                    <div
                                      key={rep.id}
                                      className="bg-white rounded-2xl border border-gray-100 hover:border-sig-green/30 p-4 flex flex-col md:flex-row md:items-center justify-between transition-all duration-200 group shadow-xs"
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <StatusBadge status={rep.status} />
                                          {org && (
                                            <span className="text-[10px] text-navy-blue font-bold">
                                              {org.name} ({org.abbreviation})
                                            </span>
                                          )}
                                        </div>
                                        <h4 className="text-sm font-bold text-navy-blue">
                                          {ev?.name || rep.activityTitle || 'Untitled Report'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400">
                                          Submitted by{' '}
                                          <span className="font-semibold text-gray-700">
                                            {author ? author.name : 'Coordinator'}
                                          </span>{' '}
                                          · Approved on {new Date(getReportTimestamp(rep, 'approved')).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="mt-3 md:mt-0 flex items-center gap-2">
                                        <button
                                          onClick={() => setSelectedViewerReport(rep)}
                                          className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>View</span>
                                        </button>
                                        {Boolean(rep.submissionType === 'docx_upload' || rep.originalDocxUrl) ? (
                                          <div className="flex items-center gap-1.5">
                                            {Boolean(rep.fileType !== 'pdf' && !rep.originalDocxName?.toLowerCase().endsWith('.pdf')) && (
                                              <button
                                                onClick={() =>
                                                  downloadFileFromUrl(
                                                    rep.originalDocxUrl,
                                                    rep.originalDocxName || `${rep.activityTitle || 'Report'}.docx`
                                                  )
                                                }
                                                className="flex items-center gap-1 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                                title="Download Original DOCX Document"
                                              >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>DOCX</span>
                                              </button>
                                            )}
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                              title="Export and Download as PDF"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              onClick={() => compileReportDOCX(rep)}
                                              className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-3.5 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                              title="Download DOCX Document"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>DOCX</span>
                                            </button>
                                            <button
                                              onClick={() => compileReportPDF(rep)}
                                              className="flex items-center gap-1.5 bg-sig-green text-navy-blue text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-sig-green-600 transition-all duration-150 cursor-pointer shadow-xs"
                                            >
                                              <Download className="w-3.5 h-3.5" />
                                              <span>Export PDF</span>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )
            )}
            {/* ── ABOUT MODULE ── */}
            {activeTab === 'about' && (
              isOffline ? (
                <div className="flex-1 overflow-y-auto p-8 text-left">
                  <div className="max-w-5xl mx-auto">
                    <AboutSkeleton />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-8 text-left">
                  <div className="max-w-5xl mx-auto space-y-6">

                    {/* ── 1. PAGE HEADER ─────────────────────────────── */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h1 className="text-xl font-extrabold text-navy-blue tracking-tight">
                        About DommUnity
                      </h1>
                      <AboutVersionCard />
                    </div>

                    {/* ── 2. SYSTEM DESCRIPTION (full-width) ─────────── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">
                        System Description
                      </h2>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                          Project Overview
                        </span>
                        <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                          DommUnity is a desktop-based management system developed for the
                          Community Extension & Services (CES) Office of Dominican College of
                          Tarlac, Inc. It is designed to simplify inventory management,
                          donor management, organization management, and report generation for the
                          Community Extension Services Office.
                        </p>
                      </div>
                    </div>

                    {/* ── 3. CES OFFICE — Vision / Mission / Goal ────── */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
                      <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">
                        Community Extension & Services (CES) Office
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Vision */}
                        <div className="group bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-navy-blue/20 transition-all duration-300 flex flex-col items-center text-center">
                          {/* Main Icon Badge */}
                          <div className="w-14 h-14 rounded-full bg-navy-blue flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
                            <Eye className="w-7 h-7 text-sig-green" />
                          </div>
                          <h3 className="text-base font-extrabold text-navy-blue uppercase tracking-wider mb-2.5">
                            Vision
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed flex-1">
                            The Community Extensions Services (CES) Office of the Dominican College of Tarlac envisions socially awareness,
                            sensitive and responsive students through active involvement in community extensions, service learning and outreach
                            activities towards community development.
                          </p>
                        </div>

                        {/* Mission */}
                        <div className="group bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-sig-green/30 transition-all duration-300 flex flex-col items-center text-center">
                          {/* Main Icon Badge */}
                          <div className="w-14 h-14 rounded-full bg-sig-green flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
                            <Rocket className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-base font-extrabold text-navy-blue uppercase tracking-wider mb-2.5">
                            Mission
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed flex-1">
                            The Community and Extension Services Office Shall: Participate in optimistic and relevant social activities for the
                            promotion of passion for truth and compassion for humanity. Sustain holistic development of communities which are humane,
                            self-reliant, and sustainable. Encourage volunteerism among the DCT Community for the noble and worthwhile extension activities
                            thereby cultivating the same spirit in the client partner communities.
                          </p>
                        </div>

                        {/* Goal */}
                        <div className="group bg-gradient-to-b from-slate-50/80 via-white to-white rounded-2xl p-6 border border-gray-100 shadow-2xs hover:shadow-md hover:border-navy-blue/20 transition-all duration-300 flex flex-col items-center text-center">
                          {/* Main Icon Badge */}
                          <div className="w-14 h-14 rounded-full bg-navy-blue flex items-center justify-center mb-4 shadow-sm transition-transform duration-300 group-hover:scale-105">
                            <Target className="w-7 h-7 text-sig-green" />
                          </div>
                          <h3 className="text-base font-extrabold text-navy-blue uppercase tracking-wider mb-2.5">
                            Goal
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed flex-1">
                            We aim to provide Community Extension Services program for the improvement of our target clientele in accordance with the
                            Gospel Values to become a productive, self-reliant, and sustainable member of the society.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── 4. Organizational Chart ─────── */}
                    <OrganizationalChart />

                    {/* ── 5. Developers ─────── */}
                    <DevelopersChart />
                  </div>
                </div>
              )
            )}
          </AnimatedPage>
        </main>
      </div>

      {selectedViewerReport && (
        <DocumentViewer
          report={selectedViewerReport}
          onClose={() => setSelectedViewerReport(null)}
          eventsList={eventsList}
          orgsList={orgsList}
          usersList={usersList}
          compileReportPDF={compileReportPDF}
        />
      )}

      {exportingReport && (
        <div className="fixed top-0 left-0 w-[816px] h-screen pointer-events-none select-none opacity-0 z-[-9999] overflow-hidden">
          <DocumentViewer
            report={exportingReport}
            onClose={() => setExportingReport(null)}
            eventsList={eventsList}
            orgsList={orgsList}
            usersList={usersList}
            isExportOnly={true}
            exportFormat="pdf"
            onExportFinished={() => setExportingReport(null)}
          />
        </div>
      )}

      {exportingDocxReport && (
        <div className="fixed top-0 left-0 w-[816px] h-screen pointer-events-none select-none opacity-0 z-[-9999] overflow-hidden">
          <DocumentViewer
            report={exportingDocxReport}
            onClose={() => setExportingDocxReport(null)}
            eventsList={eventsList}
            orgsList={orgsList}
            usersList={usersList}
            isExportOnly={true}
            exportFormat="docx"
            onExportFinished={() => setExportingDocxReport(null)}
          />
        </div>
      )}

      {/* Event Details View Modal */}
      <AnimatedModal
        isOpen={isViewEventModalOpen}
        onClose={() => {
          setIsViewEventModalOpen(false)
          setSelectedViewEvent(null)
        }}
        overlayClassName="fixed inset-0 z-[99999] flex items-center justify-center p-4 glass-modal-overlay"
        contentClassName="glass-modal rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-white/80 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {selectedViewEvent &&
          (() => {
            const org = orgsList.find((o) => o.id === selectedViewEvent.assignedOrganizationId)
            const dateObj = new Date(selectedViewEvent.scheduleDate)
            return (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-3.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-navy-blue/5 text-navy-blue rounded-xl">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-navy-blue text-base">Event Details</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewEventModalOpen(false)
                      setSelectedViewEvent(null)
                    }}
                    className="text-gray-400 hover:text-navy-blue transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Event Details Content */}
                <div className="space-y-4 text-left">
                  {/* Event Name */}
                  <div>
                    <h4 className="text-lg font-black text-navy-blue leading-snug break-words whitespace-normal">
                      {selectedViewEvent.name}
                    </h4>
                  </div>

                  {/* Status & Type Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex items-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${selectedViewEvent.status === 'completed' ||
                        selectedViewEvent.status === 'successful'
                        ? 'bg-green-100 text-green-800'
                        : selectedViewEvent.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : selectedViewEvent.status === 'planned'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      Status: {selectedViewEvent.status}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-navy-blue/5 text-navy-blue">
                      Type: {selectedViewEvent.eventType}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    {/* Department / Org */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Assigned Department / Org
                      </span>
                      <span className="text-xs text-navy-blue font-bold flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-navy-blue shrink-0" />
                        <span className="break-words whitespace-normal">
                          {selectedViewEvent.eventType === 'organization'
                            ? `${selectedViewEvent.organizationName} (${org ? org.abbreviation : 'All'})`
                            : org
                              ? `${org.name} (${org.abbreviation})`
                              : 'All'}
                        </span>
                      </span>
                    </div>

                    {/* Location/Venue */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Venue / Location
                      </span>
                      <span className="text-xs text-navy-blue font-bold flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-sig-green shrink-0" />
                        <span className="break-words whitespace-normal">
                          {selectedViewEvent.location}
                        </span>
                      </span>
                    </div>

                    {/* Scheduled Date */}
                    <div className="space-y-1 md:col-span-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Date & Time
                      </span>
                      <span className="text-xs text-navy-blue font-bold flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-navy-blue shrink-0" />
                        <span>{dateObj.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedViewEvent.description && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                        Description / Narrative
                      </span>
                      <div className="bg-white border border-gray-150 rounded-xl p-3 text-xs text-gray-650 leading-relaxed font-medium break-words whitespace-pre-wrap">
                        {selectedViewEvent.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-gray-100 pt-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewEventModalOpen(false)
                      setSelectedViewEvent(null)
                    }}
                    className="bg-navy-blue hover:bg-navy-blue/90 text-white rounded-xl text-xs font-semibold py-2 px-5 shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </>
            )
          })()}
      </AnimatedModal>

      {/* ── DOCX DIRECT UPLOAD MODAL ── */}
      <DocxUploadModal
        isOpen={isDocxUploadModalOpen}
        onClose={() => setIsDocxUploadModalOpen(false)}
        onSubmit={handleDocxUploadSubmit}
        eventsList={eventsList}
        isSubmitting={isDocxUploading}
      />
    </div>
  )
}
