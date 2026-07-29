/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import AnimatedPage from '../../components/motion/AnimatedPage'
import { staggerContainer, staggerItem } from '../../components/motion/motionConfig'
import { getReports, subscribeReports, addReport, updateReport, getOrganizations, getEvents } from '../../services/db'
import logo from '../../assets/logo.png'
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
  Download
} from 'lucide-react'
import TextEditor from '../../components/editor/TextEditor'
import DocumentViewer from '../../components/DocumentViewer'
import AnimatedSidebar from '../../components/AnimatedSidebar'
import { sanitizeOklchInDocument, loadInitialContentAndResetHistory, exportElementToPDF } from '../../components/editor/utils/editorHelpers'

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

  // ── Database ──
  const [reportsList, setReportsList] = useState([])
  const [orgsList, setOrgsList] = useState([])
  const [eventsList, setEventsList] = useState([])

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      const [reports, orgs, events] = await Promise.all([
        getReports(),
        getOrganizations(),
        getEvents()
      ])
      setReportsList(reports)
      setOrgsList(orgs)
      setEventsList(events)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadData()
    const unsubscribeReports = subscribeReports((reports) => {
      setReportsList(reports)
    })
    return () => {
      if (typeof unsubscribeReports === 'function') unsubscribeReports()
    }
  }, [loadData])

  // Body scroll lock effect whenever any modal/dialog is open
  useEffect(() => {
    if (selectedViewerReport || exportingReport) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedViewerReport, exportingReport])

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
          isTemplateActive: layoutOptions.isTemplateActive !== undefined ? layoutOptions.isTemplateActive : true
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

    setTimeout(async () => {
      const input = document.getElementById('report-pdf-target')
      if (!input) {
        setExportingReport(null)
        alert('PDF template target element not found.')
        return
      }

      // Wait for images inside target to load
      const imgs = Array.from(input.querySelectorAll('img'))
      await Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve()
              else {
                img.onload = resolve
                img.onerror = resolve
              }
            })
        )
      )

      try {
        await exportElementToPDF(
          input,
          `CES_Narrative_Report_${report.academicYear || 'AY'}_${(report.id || 'doc').substring(0, 6)}`,
          { isDocument: true }
        )
      } catch (err) {
        console.error('PDF export failed:', err)
        alert('PDF export failed: ' + (err.message || 'Error compiling report'))
      } finally {
        setExportingReport(null)
      }
    }, 500)
  }, [eventsList, orgsList])

  // ── Derived ──
  const myReports = reportsList.filter((r) => {
    if (r.authorId !== user.uid) return false
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
            className="text-navy-blue hover:opacity-85 transition cursor-pointer p-1"
            title="Document Editor"
          >
            <FileText className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="text-navy-blue hover:opacity-85 transition cursor-pointer p-1"
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
                      color: 'text-navy-blue',
                      bg: 'bg-blue-50'
                    },
                    {
                      label: 'Drafts',
                      value: stats.drafts,
                      color: 'text-gray-700',
                      bg: 'bg-gray-100'
                    },
                    {
                      label: 'Submitted',
                      value: stats.submitted,
                      color: 'text-amber-700',
                      bg: 'bg-amber-50'
                    },
                    {
                      label: 'Approved',
                      value: stats.approved,
                      color: 'text-green-700',
                      bg: 'bg-green-50'
                    },
                    {
                      label: 'Returned',
                      value: stats.returned,
                      color: 'text-red-700',
                      bg: 'bg-red-50'
                    }
                  ].map((s) => (
                    <motion.div
                      key={s.label}
                      variants={staggerItem}
                      className={`${s.bg} rounded-xl p-4 border border-gray-200/60 shadow-sm transition-all duration-150 hover:shadow-md`}
                    >
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                        {s.label}
                      </p>
                      <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Quick actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      resetForm()
                      setActiveTab('editor')
                    }}
                    className="flex items-center gap-2 bg-navy-blue text-white text-xs font-semibold px-4 py-2.5 rounded-xl border-b-2 border-sig-green hover:bg-navy-blue/90 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Report</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="flex items-center gap-2 bg-white text-navy-blue text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>View My Reports</span>
                  </button>
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
                        return (
                          <div
                            key={rep.id}
                            className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={rep.status} />
                                <span className="text-[10px] text-gray-400">
                                  {rep.semester} | AY {rep.academicYear}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-navy-blue">
                                {ev?.name || rep.activityTitle || 'Untitled'}
                              </p>
                            </div>
                            {rep.status === 'submitted' || rep.status === 'approved' ? (
                              <button
                                onClick={() => setSelectedViewerReport(rep)}
                                className="text-[10px] font-semibold text-navy-blue hover:text-sig-green transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                            ) : (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => setSelectedViewerReport(rep)}
                                  className="text-[10px] font-semibold text-navy-blue hover:text-sig-green transition cursor-pointer flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
                                </button>
                                <button
                                  onClick={() => openReport(rep)}
                                  className="text-[10px] font-semibold text-navy-blue hover:text-sig-green transition cursor-pointer flex items-center gap-1"
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
            <div className="flex-1 overflow-y-auto p-8 bg-surface-soft">
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-lg font-bold text-navy-blue">Compiled Reports</h1>
                  <button
                    onClick={() => {
                      resetForm()
                      setActiveTab('editor')
                    }}
                    className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-3 py-2 rounded-xl border-b-2 border-sig-green hover:bg-navy-blue/90 transition cursor-pointer"
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
                      return (
                        <div
                          key={rep.id}
                          className="bg-white rounded-2xl border border-gray-100 hover:border-sig-green/30 p-4 flex flex-col md:flex-row md:items-center justify-between transition group shadow-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={rep.status} />
                              <span className="text-[10px] text-gray-400">
                                {rep.semester} · AY {rep.academicYear}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-navy-blue">
                              {ev?.name || rep.activityTitle || 'Untitled Report'}
                            </h4>
                            <p className="text-[10px] text-gray-400">
                              Updated {new Date(rep.updatedAt).toLocaleDateString()}
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
                                className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition cursor-pointer shadow-xs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedViewerReport(rep)}
                                  className="flex items-center gap-1.5 bg-white text-navy-blue border border-gray-250 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-55 transition cursor-pointer shadow-2xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => openReport(rep)}
                                  className="flex items-center gap-1.5 bg-navy-blue text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition cursor-pointer shadow-xs"
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
            <div className="flex-1 overflow-y-auto p-8 bg-[#F1EFEC] text-left">
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Header section */}
                <h1 className="text-xl font-extrabold text-navy-blue tracking-tight pb-1">
                  About DommUnity
                </h1>

                {/* System & Office Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column - System and CES Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">System Information</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">System Name</span>
                          <span className="text-sm font-semibold text-navy-blue">DommUnity</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Version</span>
                          <span className="text-sm font-semibold text-navy-blue">1.0.0</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Project Description</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          DommUnity is a desktop-based management system developed for the Community Extension & Services (CES) Office of Dominican College of Tarlac, Inc. It streamlines community extension operations by automating inventory tracking (with FIFO & expiration management), donor records, event scheduling, and narrative report generation.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">Community Extension & Services (CES) Office</h2>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Vision & Mission</span>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          The Community Extension & Services (CES) Office is responsible for community involvement, engagement, and reform towards sustainable development. It transforms both institutional and academic values into ground-level exposure and applications, addressing significant and relevant challenges and problems of the local community, making education a pertinent medium for social and ecological improvement.
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Core Advocacy Areas (CEAP JEEPGY)</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {['Justice and Peace', 'Care for the Environment', 'Active Citizenship', 'Poverty Awareness', 'Gender Equality', 'Youth Empowerment'].map((adv, idx) => (
                            <span key={idx} className="bg-sig-green/10 text-navy-blue text-xs font-semibold px-3 py-1 rounded-full">
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
                      <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">CES Org Hierarchy</h2>
                      <div className="space-y-3">
                        {[
                          { name: 'Sr. Lorna I. Ablog, O.P.', role: 'School Administrator' },
                          { name: 'Dr. Augusto R. Dela Cruz', role: 'Vice President of Academic Affairs' },
                          { name: 'Mrs. Faithful Anne F. Arugay', role: 'Head of the CES Office' },
                          { name: 'Mr. Jonnel B. Manio', role: 'Coordinator of the CES Office' }
                        ].map((person, idx) => (
                          <div key={idx} className="p-2 border-b border-gray-50 last:border-0 text-left">
                            <p className="text-xs font-bold text-navy-blue">{person.name}</p>
                            <p className="text-[9px] text-gray-400 font-medium mt-0.5">{person.role}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Developers section */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
                      <h2 className="text-lg font-bold text-navy-blue border-b border-gray-200/60 pb-3">Development Team</h2>
                      <div className="space-y-3">
                        {[
                          { name: 'Benidict Justin Salunga', role: 'Lead Programmer' },
                          { name: 'Mc Harry Tolentino', role: 'Project Manager' },
                          { name: 'Aron Stefan Taruc', role: 'UI-UX Designer' },
                          { name: 'John Harold Santos', role: 'Tester' }
                        ].map((dev, idx) => (
                          <div key={idx} className="p-2 border-b border-gray-50 last:border-0 text-left">
                            <p className="text-xs font-bold text-navy-blue">{dev.name}</p>
                            <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{dev.role}</p>
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
          usersList={[user]}
          compileReportPDF={compileReportPDF}
        />
      )}

      {/* ==================================================== */}
      {/* HIDDEN CES OFFICIAL PDF TEMPLATE CONVERTER */}
      {/* ==================================================== */}
      {exportingReport && (
        <div className="absolute top-[-9999px] left-[-9999px]">
          <div
            id="report-pdf-target"
            className="w-200 bg-white p-12 text-gray-900 font-poppins relative"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header Block */}
            <div className="text-center border-b-2 border-sig-green pb-4 mb-6">
              <h2 className="text-xl font-bold text-navy-blue tracking-wide">
                DOMINICAN COLLEGE OF TARLAC, INC.
              </h2>
              <h3 className="text-sm font-semibold text-gray-700">
                Community Extension & Services (CES) Office
              </h3>
              <p className="text-[10px] text-gray-400">
                Tarlac, Philippines · Official Document Archive
              </p>
            </div>

            {/* Document Details Metadata */}
            <div className="grid grid-cols-2 gap-4 border border-gray-100 p-4 rounded-xl bg-gray-50/50 text-xs mb-6">
              <div>
                <strong className="text-navy-blue">Extension Outreach Program:</strong>
                <p className="text-sm font-bold text-gray-800">
                  {eventsList.find((e) => e.id === exportingReport.eventId)?.name ||
                    exportingReport.activityTitle ||
                    'Outreach'}
                </p>
              </div>
              <div>
                <strong className="text-navy-blue">Academic Schedule:</strong>
                <p className="text-xs font-semibold text-gray-800">
                  {exportingReport.semester} | AY {exportingReport.academicYear}
                </p>
              </div>
              <div>
                <strong className="text-navy-blue">Department / Organization:</strong>
                <p className="text-xs font-semibold text-gray-800">
                  {orgsList.find((o) => o.id === exportingReport.organizationId)?.name ||
                    (exportingReport.organizationId ? 'Unknown' : 'CES Office')}
                </p>
              </div>
              <div>
                <strong className="text-navy-blue">Activity Details:</strong>
                <p className="text-xs font-semibold text-gray-800">
                  {exportingReport.activityDate
                    ? new Date(exportingReport.activityDate).toLocaleDateString()
                    : ''}
                  {exportingReport.location ? ` @ ${exportingReport.location}` : ''}
                </p>
              </div>
            </div>

            {/* Narrative text description */}
            <div className="space-y-4 text-xs leading-relaxed text-gray-800 border-b border-gray-100 pb-6 mb-6">
              <style>{`
                #report-pdf-target table { border-collapse: collapse; width: 100%; margin: 12px 0; }
                #report-pdf-target th, #report-pdf-target td { border: 1px solid #c0c0c0; padding: 6px 10px; font-size: 11px; text-align: left; }
                #report-pdf-target th { background: #f3f4f6; font-weight: 600; }
                #report-pdf-target ul { list-style: disc; padding-left: 20px; margin-bottom: 8px; }
                #report-pdf-target ol { list-style: decimal; padding-left: 20px; margin-bottom: 8px; }
                #report-pdf-target p { margin-bottom: 8px; }
                #report-pdf-target img { max-width: 100%; height: auto; border-radius: 4px; }
              `}</style>
              <h4 className="text-sm font-bold text-navy-blue mb-2">
                Activity Description Narrative
              </h4>
              <div
                className="prose prose-sm text-xs max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: exportingReport.narrative }}
              />
            </div>

            {/* Photos collage */}
            {exportingReport.photos && exportingReport.photos.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-navy-blue mb-3">
                  Photographic Documentation
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {exportingReport.photos.map((p, idx) => (
                    <div key={idx} className="border border-gray-100 p-1.5 rounded-lg bg-gray-50">
                      <img
                        src={p.url}
                        className="w-full h-44 object-cover rounded"
                        alt="evidence"
                      />
                      <p className="text-center text-[9px] text-gray-400 font-semibold mt-1">
                        Photo Documentation {idx + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
