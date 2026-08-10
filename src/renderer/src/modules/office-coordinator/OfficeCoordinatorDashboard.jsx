/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import AboutVersionCard from '../../components/AboutVersionCard'
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
  subscribeUsers
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
  Download,
  Layers,
  Calendar,
  X,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react'
import TextEditor from '../../components/editor/TextEditor'
import DocumentViewer from '../../components/DocumentViewer'
import AnimatedSidebar from '../../components/AnimatedSidebar'
import AnimatedModal from '../../components/motion/AnimatedModal'
import {
  sanitizeOklchInDocument,
  loadInitialContentAndResetHistory,
  exportElementToPDF,
  resolveHeaderHtml,
  parseNarrativePages
} from '../../components/editor/utils/editorHelpers'
import { PAPER, MARGINS } from '../../components/editor/constants'

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
  // ── Navigation ──
  const [activeTab, setActiveTab] = useState('dashboard')

  // ── Report metadata ──
  const [workspaceReportId, setWorkspaceReportId] = useState(null)
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
  const [selectedViewEvent, setSelectedViewEvent] = useState(null)
  const [isViewEventModalOpen, setIsViewEventModalOpen] = useState(false)

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
    const unsubReports = subscribeReports((reports) => setReportsList(reports))
    const unsubOrgs = subscribeOrganizations((orgs) => setOrgsList(orgs))
    const unsubEvents = subscribeEvents((events) => setEventsList(events))
    const unsubUsers = subscribeUsers((users) => setUsersList(users))
    return () => {
      if (typeof unsubReports === 'function') unsubReports()
      if (typeof unsubOrgs === 'function') unsubOrgs()
      if (typeof unsubEvents === 'function') unsubEvents()
      if (typeof unsubUsers === 'function') unsubUsers()
    }
  }, [loadData])

  // Body scroll lock effect whenever any modal/dialog is open
  useEffect(() => {
    if (selectedViewerReport || exportingReport || isViewEventModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedViewerReport, exportingReport, isViewEventModalOpen])

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
    setActiveTab('editor')
  }, [])

  // ── Save/Submit handler ──
  const handleSave = useCallback(
    async (status, html, silent = false, layoutOptions = {}) => {
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
          status,
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

        setSaveStatus('saved')
        if (!silent) {
          alert(
            status === 'draft'
              ? 'Draft saved successfully!'
              : 'Report submitted to Admin successfully!'
          )
          resetForm()
          if (status === 'submitted') {
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
      linkToEvent,
      eventsList,
      user,
      resetForm,
      loadData
    ]
  )

  const compileReportPDF = useCallback((report) => {
    setExportingReport(report)
  }, [])

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

  const completedEvents = eventsList
    .filter((e) => {
      const s = (e.status || '').toLowerCase().trim()
      return (
        s === 'completed' ||
        s === 'complete' ||
        s === 'successful' ||
        s === 'success' ||
        s === 'done' ||
        s === 'finished'
      )
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduleDate || a.date || 0).getTime()
      const dateB = new Date(b.scheduleDate || b.date || 0).getTime()
      return dateB - dateA
    })

  // ─────────────────────────────────────────────────────────────────────────────
  // ── RENDER ────────────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen max-h-screen flex flex-col font-poppins selection:bg-sig-green/20 selection:text-navy-blue overflow-hidden bg-[#F1EFEC]">
      {/* Top Glass Header Bar */}
      <header className="mx-4 mt-4 glass-header rounded-2xl flex items-center justify-between px-6 py-2.5 shrink-0 shadow-glass-sm">
        {/* Left: Logo and Title */}
        <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-2 pr-4 rounded-xl border border-white/60">
          <div className="h-11 w-11 rounded-lg bg-white/90 flex items-center justify-center border border-white/80 overflow-hidden shrink-0 shadow-2xs">
            <img src={logo} alt="CES Logo" className="h-9 w-9 object-contain" />
          </div>
          <div className="flex flex-col text-left leading-none">
            <span className="text-[12px] font-bold text-navy-blue tracking-wide uppercase leading-tight">
              COMMUNITY EXTENSION & SERVICES
            </span>
            <span className="text-[10px] font-semibold text-sig-green tracking-wide uppercase mt-0.5 leading-tight">
              DOMINICAN COLLEGE OF TARLAC
            </span>
          </div>
        </div>

        {/* Right: Info, Home, Profile info */}
        <div className="flex items-center space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className="text-navy-blue hover:opacity-85 transition-all duration-150 cursor-pointer p-1"
            title="Document Editor"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-navy-blue hover:opacity-85 transition-all duration-150 cursor-pointer p-1"
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm p-2 pr-4 pl-3 rounded-xl border border-white/60">
            <div className="w-9 h-9 rounded-lg border border-navy-blue/15 flex items-center justify-center text-navy-blue bg-white shadow-2xs">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-none">
              <div className="text-xs font-bold text-navy-blue">
                {user.username || user.name || 'coordinator123'}
              </div>
              <div className="text-[9px] text-gray-400 font-medium mt-0.5">{user.email}</div>
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
          setActiveTab={setActiveTab}
          disabled={Boolean(selectedViewerReport)}
          onLogout={onLogout}
          user={user}
        />

        {/* Main Panel Content Area */}
        <main className="flex-1 my-4 mx-4 glass-panel rounded-2xl shadow-glass-md overflow-hidden flex flex-col">
          <AnimatedPage pageKey={activeTab} className="h-full flex flex-col">
            {/* ── DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Stats row */}
                  <motion.div
                    className="grid grid-cols-2 md:grid-cols-5 gap-4"
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
                      onClick={() => {
                        resetForm()
                        setActiveTab('editor')
                      }}
                      className="flex items-center gap-2 bg-navy-blue text-white text-xs font-semibold px-4 py-2.5 rounded-xl border-b-2 border-sig-green hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Report</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('reports')}
                      className="flex items-center gap-2 bg-white text-navy-blue text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-150 cursor-pointer"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>View My Reports</span>
                    </button>
                  </div>

                  {/* Completed Events Section */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 space-y-4 text-left">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xs font-bold text-navy-blue uppercase tracking-wide">
                          Completed Events
                        </h3>
                        <span className="bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-green-200/60">
                          {completedEvents.length}
                        </span>
                      </div>
                    </div>

                    {completedEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-xs font-medium">
                        No completed or successful events found.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedEvents.map((evt) => {
                          const org = orgsList.find((o) => o.id === evt.assignedOrganizationId)
                          const orgDisplay =
                            evt.eventType === 'organization'
                              ? `${evt.organizationName || 'Organization'} (${org ? org.abbreviation : 'All'})`
                              : org
                                ? `${org.name} (${org.abbreviation})`
                                : 'All'
                          const eventDateDisplay = evt.scheduleDate
                            ? new Date(evt.scheduleDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })
                            : 'N/A'

                          return (
                            <div
                              key={evt.id}
                              onClick={() => {
                                setSelectedViewEvent(evt)
                                setIsViewEventModalOpen(true)
                              }}
                              className="bg-gray-50/60 hover:bg-white rounded-2xl p-4 border border-gray-200/80 hover:border-navy-blue/30 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 group text-left"
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-bold text-navy-blue group-hover:text-sig-green transition-colors leading-snug line-clamp-2">
                                    {evt.name}
                                  </h4>
                                  <span className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200/60 shrink-0">
                                    {evt.status}
                                  </span>
                                </div>

                                <div className="space-y-1 text-[11px] text-gray-600 font-medium">
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <Users className="w-3.5 h-3.5 text-navy-blue shrink-0" />
                                    <span className="truncate">{orgDisplay}</span>
                                  </div>
                                  <div className="flex items-center space-x-1.5 truncate">
                                    <MapPin className="w-3.5 h-3.5 text-sig-green shrink-0" />
                                    <span className="truncate">
                                      {evt.location || 'No location set'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3 text-navy-blue" />
                                  <span>{eventDateDisplay}</span>
                                </div>
                                <span className="text-navy-blue group-hover:text-sig-green font-bold flex items-center gap-0.5">
                                  View Details &rarr;
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent reports */}
                  {myReports.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
                      <h3 className="text-xs font-bold text-navy-blue uppercase tracking-wide mb-4">
                        Recent Reports
                      </h3>
                      <div className="space-y-2.5">
                        {myReports.slice(0, 5).map((rep) => {
                          const ev = eventsList.find((e) => e.id === rep.eventId)
                          const author = usersList.find((u) => u.uid === rep.authorId)
                          return (
                            <div
                              key={rep.id}
                              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={rep.status} />
                                </div>
                                <p className="text-xs font-semibold text-navy-blue">
                                  {ev?.name || rep.activityTitle || 'Untitled'}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Submitted by{' '}
                                  <span className="font-semibold text-gray-600">
                                    {author ? author.name : 'Coordinator'}
                                  </span>
                                </p>
                              </div>
                              {rep.status === 'submitted' || rep.status === 'approved' ? (
                                <button
                                  onClick={() => setSelectedViewerReport(rep)}
                                  className="text-[10px] font-semibold text-navy-blue hover:text-sig-green transition-colors duration-150 cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </button>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => setSelectedViewerReport(rep)}
                                    className="text-[10px] font-semibold text-navy-blue hover:text-sig-green transition-colors duration-150 cursor-pointer flex items-center gap-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    View
                                  </button>
                                  <button
                                    onClick={() => openReport(rep)}
                                    className="text-[10px] font-semibold text-navy-blue hover:text-sig-green transition-colors duration-150 cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Edit
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── WORD EDITOR ── */}
            <div
              className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'editor' ? '' : 'hidden'}`}
            >
              <TextEditor
                user={user}
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
                StatusBadge={StatusBadge}
              />
            </div>

            {/* ── COMPILED REPORTS ── */}
            {activeTab === 'reports' && (
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-lg font-bold text-navy-blue">Compiled Reports</h1>
                    <button
                      onClick={() => {
                        resetForm()
                        setActiveTab('editor')
                      }}
                      className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-3 py-2 rounded-xl border-b-2 border-sig-green hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Report</span>
                    </button>
                  </div>

                  {myReports.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                      No reports yet. Click "New Report" to get started.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myReports.map((rep) => {
                        const ev = eventsList.find((e) => e.id === rep.eventId)
                        const author = usersList.find((u) => u.uid === rep.authorId)
                        return (
                          <div
                            key={rep.id}
                            className="bg-white rounded-2xl border border-gray-100 hover:border-sig-green/30 p-4 flex flex-col md:flex-row md:items-center justify-between transition-all duration-200 group shadow-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={rep.status} />
                              </div>
                              <h4 className="text-sm font-bold text-navy-blue">
                                {ev?.name || rep.activityTitle || 'Untitled Report'}
                              </h4>
                              <p className="text-[10px] text-gray-400">
                                Submitted by{' '}
                                <span className="font-semibold text-gray-700">
                                  {author ? author.name : 'Coordinator'}
                                </span>{' '}
                                · Updated {new Date(rep.updatedAt).toLocaleDateString()}
                              </p>
                              {rep.status === 'returned' && rep.adminFeedback && (
                                <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="w-3 h-3" />
                                  {rep.adminFeedback}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 md:mt-0">
                              {rep.status === 'submitted' || rep.status === 'approved' ? (
                                <button
                                  onClick={() => setSelectedViewerReport(rep)}
                                  className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer shadow-xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedViewerReport(rep)}
                                    className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-50 transition-all duration-150 cursor-pointer shadow-2xs"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </button>
                                  <button
                                    onClick={() => openReport(rep)}
                                    className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-navy-blue/90 transition-all duration-150 cursor-pointer shadow-xs"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* ── ABOUT MODULE ── */}
            {activeTab === 'about' && (
              <div className="flex-1 overflow-y-auto p-8 text-left">
                <div className="max-w-5xl mx-auto space-y-6">
                  {/* Header section */}
                  <h1 className="text-xl font-extrabold text-navy-blue tracking-tight pb-1">
                    About DommUnity
                  </h1>

                  {/* System & Office Info Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - System and CES Details */}
                    <div className="lg:col-span-2 space-y-6">
                      <AboutVersionCard />

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">
                          System Description
                        </h2>
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            Project Overview
                          </span>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            DommUnity is a desktop-based management system developed for the
                            Community Extension & Services (CES) Office of Dominican College of
                            Tarlac, Inc. It streamlines community extension operations by automating
                            inventory tracking (with FIFO & expiration management), donor records,
                            event scheduling, and narrative report generation.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">
                          Community Extension & Services (CES) Office
                        </h2>
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            Vision & Mission
                          </span>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            The Community Extension & Services (CES) Office is responsible for
                            community involvement, engagement, and reform towards sustainable
                            development. It transforms both institutional and academic values into
                            ground-level exposure and applications, addressing significant and
                            relevant challenges and problems of the local community, making
                            education a pertinent medium for social and ecological improvement.
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                            Core Advocacy Areas (CEAP JEEPGY)
                          </span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {[
                              'Justice and Peace',
                              'Care for the Environment',
                              'Active Citizenship',
                              'Poverty Awareness',
                              'Gender Equality',
                              'Youth Empowerment'
                            ].map((adv, idx) => (
                              <span
                                key={idx}
                                className="bg-sig-green/10 text-navy-blue text-xs font-semibold px-3 py-1 rounded-full"
                              >
                                {adv}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Org Chart & Proponents */}
                    <div className="space-y-6">
                      {/* CES Organizational Chart */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">
                          CES Org Hierarchy
                        </h2>
                        <div className="space-y-3">
                          {[
                            { name: 'Sr. Lorna I. Ablog, O.P.', role: 'School Administrator' },
                            {
                              name: 'Dr. Augusto R. Dela Cruz',
                              role: 'Vice President of Academic Affairs'
                            },
                            {
                              name: 'Mrs. Faithful Anne F. Arugay',
                              role: 'Head of the CES Office'
                            },
                            { name: 'Mr. Jonnel B. Manio', role: 'Coordinator of the CES Office' }
                          ].map((person, idx) => (
                            <div
                              key={idx}
                              className="p-2 border-b border-gray-50 last:border-0 text-left"
                            >
                              <p className="text-xs font-bold text-navy-blue">{person.name}</p>
                              <p className="text-[9px] text-gray-400 font-medium mt-0.5">
                                {person.role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Developers section */}
                      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                        <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">
                          Development Team
                        </h2>
                        <div className="space-y-3">
                          {[
                            { name: 'Benidict Justin Salunga', role: 'Lead Programmer' },
                            { name: 'Mc Harry Tolentino', role: 'Project Manager' },
                            { name: 'Aron Stefan Taruc', role: 'UI-UX Designer' },
                            { name: 'John Harold Santos', role: 'Tester' }
                          ].map((dev, idx) => (
                            <div
                              key={idx}
                              className="p-2 border-b border-gray-50 last:border-0 text-left"
                            >
                              <p className="text-xs font-bold text-navy-blue">{dev.name}</p>
                              <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                                {dev.role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            onExportFinished={() => setExportingReport(null)}
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
    </div>
  )
}
