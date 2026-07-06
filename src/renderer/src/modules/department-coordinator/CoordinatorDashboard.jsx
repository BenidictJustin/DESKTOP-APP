import React, { useState, useEffect } from 'react';
import { 
  getEvents, getReports, addReport, updateReport, uploadPhoto, getOrganizations,
  getPublishedForms, getFormRequests, addFormRequest
} from '../../services/db';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  FileText, Calendar, Info, LogOut, Check, Save, Send, AlertTriangle, 
  Upload, Image as ImageIcon, MessageSquare, Edit3, Eye, Clock, Plus, HelpCircle,
  ClipboardList, Search
} from 'lucide-react';import SearchableDropdown from '../../components/SearchableDropdown';

export default function CoordinatorDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('editor');
  
  // DB sync lists
  const [eventsList, setEventsList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [orgsList, setOrgsList] = useState([]);
  
  // Forms & Requests state
  const [formsList, setFormsList] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [formSubTab, setFormSubTab] = useState('browse'); // 'browse' vs 'history'
  const [formsSearch, setFormsSearch] = useState('');
  
  // Modal request state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [requestPurpose, setRequestPurpose] = useState('');
  const [requestTargetDate, setRequestTargetDate] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [requestIsUrgent, setRequestIsUrgent] = useState(false);
  
  // Action notifications
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Active editor states
  const [editingReportId, setEditingReportId] = useState(null); // If editing existing draft/returned
  const [reportEventId, setReportEventId] = useState('');
  const [reportType, setReportType] = useState('outreach');
  const [reportSem, setReportSem] = useState('1st Semester');
  const [reportAY, setReportAY] = useState('2026-2027');
  const [reportPhotos, setReportPhotos] = useState([]); // Array of {url, name}
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState(null);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Write your narrative diary report details here...</p>',
    editable: !isReadOnly
  });

  // Keep editor editable status synchronized
  useEffect(() => {
    if (editor) {
      editor.setEditable(!isReadOnly);
    }
  }, [isReadOnly, editor]);

  // Load database files
  const loadData = async () => {
    try {
      const ev = await getEvents();
      const rep = await getReports();
      const orgs = await getOrganizations();
      const forms = await getPublishedForms();
      const reqs = await getFormRequests(user.organizationId);
      
      setOrgsList(orgs);
      setFormsList(forms);
      setRequestsList(reqs);

      // Filter events scoped to the coordinator's assigned organization
      const deptEvents = ev.filter(e => e.assignedOrganizationId === user.organizationId);
      setEventsList(deptEvents);

      // Filter reports scoped to the coordinator's department
      const deptReports = rep.filter(r => r.organizationId === user.organizationId);
      setReportsList(deptReports);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const triggerError = (msg) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setErrorMsg(''), 6000);
  };

  const triggerSuccess = (msg) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // --- EDITOR ACTION WORKFLOWS ---

  // Drag and drop photo upload handler
  const handlePhotoDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || e.target.files || []);
    if (files.length === 0) return;

    // Check size limit: max 10 files overall
    if (reportPhotos.length + files.length > 10) {
      triggerError("Upload block: Standard report layouts support a maximum of 10 photos.");
      return;
    }

    // Validate formats: PNG & JPG only
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const invalidFile = files.find(f => !allowedTypes.includes(f.type));
    if (invalidFile) {
      triggerError("Format rejected: Only JPG and PNG image files are supported.");
      return;
    }

    setLoading(true);
    try {
      const uploadedList = [];
      for (const file of files) {
        // Expose uploadPhoto from db.js (converts to base64 in local/cloud storage URL in real)
        const downloadUrl = await uploadPhoto(reportAY, reportEventId || 'generic', file);
        uploadedList.push({ url: downloadUrl, uploadedAt: new Date().toISOString() });
      }
      setReportPhotos([...reportPhotos, ...uploadedList]);
      triggerSuccess(`${uploadedList.length} photo(s) attached successfully.`);
    } catch (err) {
      triggerError("Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = (idx) => {
    setReportPhotos(reportPhotos.filter((_, i) => i !== idx));
  };

  // Save report: Draft vs Submitted
  const handleSaveReport = async (status) => {
    if (!reportEventId) {
      triggerError("Please select the scheduled event you are documenting.");
      return;
    }

    const narrativeHtml = editor ? editor.getHTML() : '';
    if (!narrativeHtml || narrativeHtml === '<p></p>' || narrativeHtml.includes('Write your narrative diary')) {
      triggerError("Narrative prose cannot be empty.");
      return;
    }

    const payload = {
      eventId: reportEventId,
      organizationId: user.organizationId,
      type: reportType,
      semester: reportSem,
      academicYear: reportAY,
      narrative: narrativeHtml,
      photos: reportPhotos,
      status
    };

    setLoading(true);
    try {
      if (editingReportId) {
        // Updates existing draft
        await updateReport(editingReportId, payload, user.uid);
        triggerSuccess(`Report successfully saved as ${status}.`);
      } else {
        // Creates a new report
        await addReport(payload, user.uid);
        triggerSuccess(`Report initialized and saved as ${status}.`);
      }
      
      resetEditorForm();
      setActiveTab('history');
      loadData();
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetEditorForm = () => {
    setEditingReportId(null);
    setReportEventId('');
    setReportType('outreach');
    setReportSem('1st Semester');
    setReportAY('2026-2027');
    setReportPhotos([]);
    setIsReadOnly(false);
    setActiveFeedback(null);
    if (editor) {
      editor.commands.setContent('<p>Write your narrative diary report details here...</p>');
    }
  };

  // Select report from history to view / edit
  const handleSelectReport = (rep) => {
    setEditingReportId(rep.id);
    setReportEventId(rep.eventId);
    setReportType(rep.type);
    setReportSem(rep.semester);
    setReportAY(rep.academicYear);
    setReportPhotos(rep.photos || []);
    setActiveFeedback(rep.adminFeedback);
    
    // Status lock: only draft and returned reports can be edited
    const readOnly = rep.status === 'submitted' || rep.status === 'approved';
    setIsReadOnly(readOnly);
    
    if (editor) {
      editor.commands.setContent(rep.narrative);
    }
    
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-poppins selection:bg-sig-green selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-navy-blue flex flex-col justify-between shrink-0 relative">
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sig-green"></div>
        
        <div>
          {/* Logo header */}
          <div className="p-6 border-b border-white/10 flex items-center space-x-3 bg-navy-blue/90">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border-2 border-sig-green">
              <span className="text-navy-blue font-bold text-lg">D</span>
              <span className="text-sig-green font-bold text-sm -ml-0.5">U</span>
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">DommUnity</h2>
              <span className="text-[10px] text-sig-green font-semibold">Dept Coordinator</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'editor', label: 'Report Workspace', icon: FileText },
              { id: 'history', label: 'Reports Directory', icon: Clock },
              { id: 'forms', label: 'Forms & Requests', icon: ClipboardList }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'editor' && !editingReportId) {
                    resetEditorForm();
                  }
                  setActiveTab(tab.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer ${activeTab === tab.id ? 'bg-sig-green text-navy-blue' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-navy-blue/90">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-sig-green text-navy-blue flex items-center justify-center font-bold text-xs">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-white text-xs font-bold truncate">{user.name}</h4>
              <p className="text-[9px] text-gray-400 truncate">
                {orgsList.find(o => o.id === user.organizationId)?.abbreviation || 'Coordinator'} Dept
              </p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 py-2 px-4 rounded-full text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-8 overflow-y-auto h-screen bg-gray-50">
        <div className="flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto items-start w-full">
          {/* Left / Center Content Column */}
          <div className="flex-1 w-full space-y-6">
        
        {/* Banner Alert Prompts */}
        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-600 rounded-3xl border border-red-200 text-xs flex items-start space-x-2.5 animate-slide-in">
            <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-700 rounded-3xl border border-green-200 text-xs flex items-start space-x-2.5 animate-slide-in">
            <Check className="w-4.5 h-4.5 shrink-0 mt-0.5 bg-green-600 text-white rounded-full p-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* REPORT EDITOR TAB PANEL */}
        {/* ==================================================== */}
        {activeTab === 'editor' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-navy-blue">
                  {editingReportId ? (isReadOnly ? 'Inspect Narrative Report' : 'Revise Narrative Report') : 'Narrative Report Workspace'}
                </h1>
                <p className="text-gray-500 text-xs mt-1">Compile details, diary notes, and upload photo logs for outreach activities.</p>
              </div>
              
              {editingReportId && (
                <button
                  onClick={resetEditorForm}
                  className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-2 px-4 rounded-full text-xs mt-3 md:mt-0 cursor-pointer"
                >
                  Create New Report
                </button>
              )}
            </div>

            {/* Active Feedback display if returned */}
            {!isReadOnly && activeFeedback && (
              <div className="p-4 bg-amber-50 text-amber-800 rounded-3xl border border-amber-200 text-xs space-y-2">
                <div className="flex items-center space-x-2.5 font-bold">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Revision Instructions from Admin:</span>
                </div>
                <p className="text-gray-600 pl-6 leading-relaxed font-medium">{activeFeedback}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form details section */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Text Editor Container */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <h3 className="font-bold text-navy-blue text-sm">Narrative Journal Details</h3>
                  
                  {/* Tiptap Custom Toolbar */}
                  {editor && !isReadOnly && (
                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-50 rounded-xl border border-gray-100">
                      {[
                        { label: 'Bold', action: () => editor.chain().focus().toggleBold().run(), active: 'bold' },
                        { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run(), active: 'italic' },
                        { label: 'Bullet List', action: () => editor.chain().focus().toggleBulletList().run(), active: 'bulletList' },
                        { label: 'Ordered List', action: () => editor.chain().focus().toggleOrderedList().run(), active: 'orderedList' }
                      ].map((btn, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={btn.action}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            editor.isActive(btn.active) ? 'bg-navy-blue text-white' : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                      <div className="w-px h-5 bg-gray-200 mx-1"></div>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer"
                      >
                        Undo
                      </button>
                      <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-200 cursor-pointer"
                      >
                        Redo
                      </button>
                    </div>
                  )}

                  {/* Editor body content */}
                  <div className="border border-gray-100 rounded-xl bg-gray-50/50 shadow-inner">
                    <EditorContent editor={editor} className="min-h-[250px] text-xs text-gray-800" />
                  </div>
                </div>

                {/* Drag and Drop Image Dropzone */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-navy-blue text-sm">Outreach Gallery Upload (Max 10)</h3>
                    <span className="text-[10px] text-gray-400 font-medium">{reportPhotos.length}/10 uploaded</span>
                  </div>

                  {!isReadOnly && (
                    <div 
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handlePhotoDrop}
                      className="border-2 border-dashed border-gray-200 hover:border-sig-green rounded-2xl p-8 text-center bg-gray-50/20 hover:bg-sig-green/5 transition duration-200 relative cursor-pointer group"
                    >
                      <input
                        type="file"
                        multiple
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handlePhotoDrop}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-sig-green mx-auto mb-2 transition" />
                      <p className="text-xs font-bold text-navy-blue mb-1">Drag and drop activity photos here</p>
                      <p className="text-[10px] text-gray-400">PNG, JPG formats only. Select from local machine.</p>
                    </div>
                  )}

                  {/* Media uploads list */}
                  {reportPhotos.length > 0 && (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                      {reportPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group bg-black">
                          <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition" alt="evidence" />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(idx)}
                              className="absolute top-1 right-1 bg-red-600/90 text-white rounded-full p-0.5 text-[10px] font-bold hover:bg-red-700 transition"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Form controls */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                  <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3">Report Metadata</h3>
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">Document Academic Year</label>
                      <SearchableDropdown
                        value={reportAY}
                        disabled={isReadOnly}
                        onChange={(val) => setReportAY(val)}
                        options={[
                          { id: '2025-2026', name: 'AY 2025-2026' },
                          { id: '2026-2027', name: 'AY 2026-2027' },
                          { id: '2027-2028', name: 'AY 2027-2028' }
                        ]}
                        placeholder="Academic Year..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">Semester</label>
                      <SearchableDropdown
                        value={reportSem}
                        disabled={isReadOnly}
                        onChange={(val) => setReportSem(val)}
                        options={[
                          { id: '1st Semester', name: '1st Semester' },
                          { id: '2nd Semester', name: '2nd Semester' },
                          { id: 'Summer', name: 'Summer Term' }
                        ]}
                        placeholder="Semester..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">Report Category</label>
                      <SearchableDropdown
                        value={reportType}
                        disabled={isReadOnly}
                        onChange={(val) => setReportType(val)}
                        options={[
                          { id: 'outreach', name: 'Community Outreach' },
                          { id: 'blood_donation', name: 'Blood Donation Drive' },
                          { id: 'department_program', name: 'Department Extension Program' }
                        ]}
                        placeholder="Report Category..."
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 text-xs font-semibold mb-1">Select Scheduled Event</label>
                      <SearchableDropdown
                        value={reportEventId}
                        disabled={isReadOnly}
                        onChange={(val) => setReportEventId(val)}
                        options={eventsList.map(e => ({
                          id: e.id,
                          name: `${e.title || e.name} (${new Date(e.scheduleDate || e.date).toLocaleDateString()})`
                        }))}
                        placeholder="Select Event..."
                      />
                    </div>
                  </div>

                  {!isReadOnly && (
                    <div className="flex flex-col space-y-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => handleSaveReport('draft')}
                        disabled={loading}
                        className="w-full bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-2 rounded-full text-xs flex items-center justify-center space-x-2 transition cursor-pointer"
                        style={{ height: '38px' }}
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Draft</span>
                      </button>
                      <button
                        onClick={() => handleSaveReport('submitted')}
                        disabled={loading}
                        className="w-full bg-navy-blue text-white font-semibold py-2 rounded-full text-xs flex items-center justify-center space-x-2 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
                        style={{ height: '38px' }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit for Approval</span>
                      </button>
                    </div>
                  )}

                  {isReadOnly && (
                    <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400 font-medium flex items-center justify-center space-x-1.5 bg-gray-50 p-3 rounded-2xl">
                      <Check className="w-4 h-4 text-green-600 bg-green-50 p-0.5 rounded-full" />
                      <span>Document locked (Read-Only)</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* REPORT DIRECTORY TAB PANEL */}
        {/* ==================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl font-bold text-navy-blue">Reports Directory</h1>
              <p className="text-gray-500 text-xs mt-1">Review processing stage, view submissions, or modify draft narrative logs.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-navy-blue text-sm border-b border-gray-100 pb-3 mb-4">Submission logs</h3>
              
              <div className="space-y-3.5">
                {reportsList.map(rep => {
                  const event = eventsList.find(e => e.id === rep.eventId);
                  return (
                    <div key={rep.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-sig-green/30 hover:bg-white transition duration-200">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-block text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            rep.status === 'approved' ? 'bg-green-100 text-green-800' :
                            rep.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                            rep.status === 'returned' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {rep.status}
                          </span>
                          <span className="text-[10px] text-gray-500">{rep.semester} | AY {rep.academicYear}</span>
                        </div>
                        <h4 className="font-bold text-navy-blue text-sm">{event ? event.name : 'Outreach Narrative'}</h4>
                        <div className="text-[10px] text-gray-400">Last updated: {new Date(rep.updatedAt).toLocaleDateString()}</div>
                      </div>

                      <div className="mt-3 md:mt-0">
                        {rep.status === 'returned' && (
                          <div className="flex items-center space-x-3">
                            <span className="text-[10px] text-red-500 font-semibold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Action Required (Returned)</span>
                            </span>
                            <button
                              onClick={() => handleSelectReport(rep)}
                              className="bg-navy-blue text-white rounded-full text-xs font-semibold py-1.5 px-4 hover:opacity-90 transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit & Resubmit</span>
                            </button>
                          </div>
                        )}
                        {rep.status === 'draft' && (
                          <button
                            onClick={() => handleSelectReport(rep)}
                            className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 rounded-full text-xs font-semibold py-1.5 px-4 transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Draft</span>
                          </button>
                        )}
                        {(rep.status === 'submitted' || rep.status === 'approved') && (
                          <button
                            onClick={() => handleSelectReport(rep)}
                            className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 rounded-full text-xs font-semibold py-1.5 px-4 transition flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect View</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {reportsList.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">No reports compiled yet in this department directory.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* FORMS & REQUESTS TAB PANEL */}
        {/* ==================================================== */}
        {activeTab === 'forms' && (
          <div className="space-y-6 animate-fade-in w-full">
            {/* Header section */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-navy-blue">Forms & Requests</h1>
                <p className="text-gray-500 text-xs mt-1">Browse official extension office forms, submit requests, and monitor processing status.</p>
              </div>
              
              {/* Sub tabs */}
              <div className="flex items-center space-x-2 mt-4 md:mt-0 bg-gray-50 p-1 rounded-full border border-gray-100 self-start md:self-auto">
                <button
                  onClick={() => setFormSubTab('browse')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition duration-200 cursor-pointer ${
                    formSubTab === 'browse'
                      ? 'bg-sig-green text-navy-blue shadow-sm'
                      : 'text-gray-600 hover:text-navy-blue'
                  }`}
                >
                  Available Forms
                </button>
                <button
                  onClick={() => setFormSubTab('history')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition duration-200 cursor-pointer ${
                    formSubTab === 'history'
                      ? 'bg-sig-green text-navy-blue shadow-sm'
                      : 'text-gray-600 hover:text-navy-blue'
                  }`}
                >
                  My Requests ({requestsList.length})
                </button>
              </div>
            </div>

            {/* BROWSE SUB-TAB */}
            {formSubTab === 'browse' && (
              <div className="space-y-6">
                {/* Search and control bar */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="text-sm font-bold text-navy-blue">List of Forms</h2>
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or keyword..."
                      value={formsSearch}
                      onChange={(e) => setFormsSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-sig-green/30 font-medium text-navy-blue placeholder-gray-400 transition"
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

                {/* Scrollable list of form cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
                  {formsList
                    .filter(form => {
                      if (!formsSearch) return true;
                      const query = formsSearch.toLowerCase();
                      return (
                        form.title.toLowerCase().includes(query) ||
                        form.description.toLowerCase().includes(query) ||
                        form.category.toLowerCase().includes(query) ||
                        form.keywords.some(kw => kw.toLowerCase().includes(query))
                      );
                    })
                    .map(form => (
                      <div
                        key={form.id}
                        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:border-sig-green/30 hover:shadow-md transition duration-200"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-navy-blue/5 text-navy-blue font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {form.category}
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold">
                              Code: {form.id.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-navy-blue">{form.title}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                            {form.description}
                          </p>
                          {/* Display keywords */}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {form.keywords.map((kw, i) => (
                              <span key={i} className="text-[8px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-50 flex justify-end">
                          <button
                            onClick={() => {
                              setSelectedForm(form);
                              setIsRequestModalOpen(true);
                              setRequestPurpose('');
                              setRequestTargetDate('');
                              setRequestNotes('');
                              setRequestIsUrgent(false);
                            }}
                            className="bg-navy-blue text-white rounded-full text-xs font-semibold py-1.5 px-5 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3 animate-none" />
                            <span>Request Form</span>
                          </button>
                        </div>
                      </div>
                    ))}

                  {formsList.filter(form => {
                    if (!formsSearch) return true;
                    const query = formsSearch.toLowerCase();
                    return (
                      form.title.toLowerCase().includes(query) ||
                      form.description.toLowerCase().includes(query) ||
                      form.category.toLowerCase().includes(query) ||
                      form.keywords.some(kw => kw.toLowerCase().includes(query))
                    );
                  }).length === 0 && (
                    <div className="col-span-full bg-white rounded-3xl p-8 border border-gray-100 text-center text-gray-400 text-xs font-semibold">
                      No administrative forms match your search criteria.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REQUEST HISTORY SUB-TAB */}
            {formSubTab === 'history' && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                <h2 className="text-sm font-bold text-navy-blue border-b border-gray-100 pb-3 mb-2">My Department Requests</h2>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {requestsList.map(req => (
                    <div
                      key={req.id}
                      className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-sig-green/20 hover:bg-white transition duration-200 flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      <div className="space-y-2.5 max-w-xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                            req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            req.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800' // Completed
                          }`}>
                            {req.status}
                          </span>
                          {req.isUrgent && (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Urgent
                            </span>
                          )}
                          <span className="text-[10px] text-gray-400 font-medium">
                            Requested: {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-bold text-navy-blue text-sm">{req.formTitle}</h4>
                          <p className="text-xs text-gray-600 font-semibold mt-1">
                            Purpose: <span className="font-normal text-gray-500">{req.purpose}</span>
                          </p>
                          {req.notes && (
                            <p className="text-xs text-gray-600 font-semibold mt-1">
                              Additional Info: <span className="font-normal text-gray-500">{req.notes}</span>
                            </p>
                          )}
                        </div>

                        <div className="flex items-center text-[10px] text-gray-400 gap-4 font-medium">
                          <span>Target Date: {new Date(req.targetDate).toLocaleDateString()}</span>
                          {req.updatedAt && req.status !== 'Pending' && (
                            <span>Updated: {new Date(req.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>

                        {req.adminNotes && (
                          <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs mt-2">
                            <div className="font-bold text-amber-800 flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                              <span>CES Admin Remarks:</span>
                            </div>
                            <p className="text-gray-600 mt-1 font-medium leading-relaxed">{req.adminNotes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end shrink-0 justify-between h-full">
                        <span className="text-[10px] text-gray-400 font-semibold">
                          ID: {req.id.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {requestsList.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                      Your department hasn't submitted any form requests yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

          </div>

          {/* Right Sidebar Widget Panel */}
          {true && (
            <aside className="w-full xl:w-80 shrink-0 space-y-6">
              
              {/* Widget 1: Department Info & Stats */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Info className="w-4 h-4 text-navy-blue" />
                  <h3 className="font-bold text-navy-blue text-xs tracking-wide">My Department Summary</h3>
                </div>
                
                <div className="space-y-3.5">
                  <div>
                    <h4 className="font-bold text-navy-blue text-[11px] leading-tight">
                      {orgsList.find(o => o.id === user.organizationId)?.name || 'Active Department'}
                    </h4>
                    <span className="text-[9px] bg-sig-green text-navy-blue font-extrabold px-2 py-0.5 rounded-full inline-block mt-1">
                      {orgsList.find(o => o.id === user.organizationId)?.abbreviation || 'CES'} Coordinator
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                    <div className="p-2.5 bg-green-50/50 border border-green-100 rounded-xl text-center">
                      <span className="text-[9px] text-green-700 block font-semibold mb-0.5">Approved</span>
                      <span className="text-sm font-extrabold text-green-800">
                        {reportsList.filter(r => r.status === 'approved').length}
                      </span>
                    </div>
                    <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded-xl text-center">
                      <span className="text-[9px] text-amber-700 block font-semibold mb-0.5">Submitted</span>
                      <span className="text-sm font-extrabold text-amber-800">
                        {reportsList.filter(r => r.status === 'submitted').length}
                      </span>
                    </div>
                    <div className="p-2.5 bg-red-50/50 border border-red-100 rounded-xl text-center">
                      <span className="text-[9px] text-red-700 block font-semibold mb-0.5">Returned</span>
                      <span className="text-sm font-extrabold text-red-800">
                        {reportsList.filter(r => r.status === 'returned').length}
                      </span>
                    </div>
                    <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-center">
                      <span className="text-[9px] text-gray-500 block font-semibold mb-0.5">Drafts</span>
                      <span className="text-sm font-extrabold text-gray-700">
                        {reportsList.filter(r => r.status === 'draft').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: My Assigned Events */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <Calendar className="w-4 h-4 text-navy-blue" />
                  <h3 className="font-bold text-navy-blue text-xs tracking-wide">Assigned Schedule</h3>
                </div>
                
                <div className="space-y-3">
                  {eventsList.slice(0, 3).map(evt => (
                    <div key={evt.id} className="p-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[11px] space-y-1">
                      <div className="font-bold text-navy-blue truncate">{evt.name}</div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-gray-300" />
                          {new Date(evt.scheduleDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                        <span className="truncate max-w-[120px]">{evt.location}</span>
                      </div>
                    </div>
                  ))}
                  {eventsList.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-[10px]">
                      No events assigned to your department.
                    </div>
                  )}
                </div>
              </div>

              {/* Widget 3: CEAP JEEPGY Reference Manual */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4 w-full">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
                  <HelpCircle className="w-4 h-4 text-navy-blue" />
                  <h3 className="font-bold text-navy-blue text-xs tracking-wide">CEAP JEEPGY Reference</h3>
                </div>
                
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Support CEAP core advocacies in your narrative report journals:
                </p>
                
                <div className="space-y-2">
                  {[
                    { code: 'J', label: 'Justice and Peace', desc: 'Promoting human rights and active citizenship.' },
                    { code: 'E', label: 'Environmental Care', desc: 'Care for the environment and ecological advocacy.' },
                    { code: 'E', label: 'Economic Justice', desc: 'Poverty awareness and distribution outreach.' },
                    { code: 'P', label: 'Planet Sustainability', desc: 'Sustainable living and resource awareness.' },
                    { code: 'G', label: 'Gender Equality', desc: 'Promoting inclusive extension environments.' },
                    { code: 'Y', label: 'Youth Empowerment', desc: 'Empowering youth and community engagement.' }
                  ].map((adv, idx) => (
                    <div key={idx} className="flex items-start space-x-2 p-1.5 hover:bg-gray-50 rounded-xl transition">
                      <span className="h-5 w-5 bg-navy-blue/5 border border-navy-blue/10 text-navy-blue font-bold rounded-lg flex items-center justify-center text-[10px] shrink-0">
                        {adv.code}
                      </span>
                      <div className="text-[9.5px]">
                        <div className="font-bold text-navy-blue">{adv.label}</div>
                        <div className="text-gray-400 text-[8.5px] leading-tight">{adv.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </aside>
          )}

        </div>
      </main>

      {/* Interactive Request Form Modal */}
      {isRequestModalOpen && selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-blue/40 backdrop-blur-xs animate-fade-in p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-navy-blue text-sm">Submit Form Request</h3>
                <p className="text-gray-400 text-[10px] mt-0.5">Please provide request details for administrative review.</p>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-gray-400 hover:text-navy-blue transition cursor-pointer text-sm p-1 rounded-full hover:bg-gray-50 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1">Target Form</label>
                <input
                  type="text"
                  disabled
                  value={selectedForm.title}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold text-navy-blue"
                  style={{ height: '40px' }}
                />
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1">Purpose / Justification <span className="text-red-500">*</span></label>
                <textarea
                  placeholder="Explain why this form/resource is being requested..."
                  value={requestPurpose}
                  onChange={(e) => setRequestPurpose(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-xs font-semibold mb-1">Target Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={requestTargetDate}
                    onChange={(e) => setRequestTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue font-poppins"
                    style={{ height: '40px' }}
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={requestIsUrgent}
                      onChange={(e) => setRequestIsUrgent(e.target.checked)}
                      className="w-4 h-4 accent-rose-600 rounded border-gray-200 animate-none"
                    />
                    <span className="text-rose-600 flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Mark as Urgent
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-xs font-semibold mb-1">Additional Specifications / Notes</label>
                <textarea
                  placeholder="E.g., quantity of supplies, vehicle destination, invited speaker background, number of chairs, etc."
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-blue/15 font-semibold text-navy-blue min-h-[80px]"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="bg-white hover:bg-gray-50 text-navy-blue border border-gray-200 font-semibold py-2 px-5 rounded-full text-xs transition cursor-pointer"
                style={{ height: '36px' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!requestPurpose.trim()) {
                    triggerError('Please provide a purpose or justification for the request.');
                    return;
                  }
                  if (!requestTargetDate) {
                    triggerError('Please select a target date.');
                    return;
                  }

                  setLoading(true);
                  try {
                    const payload = {
                      formId: selectedForm.id,
                      formTitle: selectedForm.title,
                      organizationId: user.organizationId,
                      purpose: requestPurpose.trim(),
                      targetDate: requestTargetDate,
                      notes: requestNotes.trim(),
                      isUrgent: requestIsUrgent
                    };

                    await addFormRequest(payload, user.uid);
                    triggerSuccess('Form request submitted successfully for administrative review.');
                    setIsRequestModalOpen(false);
                    
                    // Reload data
                    await loadData();
                    setFormSubTab('history');
                  } catch (err) {
                    triggerError(err.message || 'Failed to submit form request.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="bg-navy-blue text-white font-semibold py-2 px-6 rounded-full text-xs flex items-center justify-center space-x-2 border-b-2 border-sig-green hover:bg-navy-blue/95 transition cursor-pointer"
                style={{ height: '36px' }}
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <Send className="w-3.5 h-3.5 font-bold" />
                )}
                <span>Submit Request</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
