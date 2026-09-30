import React, { useState, useEffect } from 'react'
import {
  ExternalLink,
  Copy,
  Check,
  Link2,
  FileCode2,
  Send,
  HelpCircle,
  X,
  AlertCircle,
  FileText,
  ChevronRight,
  Plus,
  Save,
  Globe
} from 'lucide-react'

// Professional Google Docs Brand Icon SVG
export const GoogleDocsIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 48 48"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M30 4H14C11.7909 4 10 5.79086 10 8V40C10 42.2091 11.7909 44 14 44H34C36.2091 44 38 42.2091 38 40V12L30 4Z"
      fill="#4285F4"
    />
    <path d="M30 4V12H38L30 4Z" fill="#A1C2FA" />
    <path d="M16 22H32V24H16V22Z" fill="white" />
    <path d="M16 28H32V30H16V28Z" fill="white" />
    <path d="M16 34H26V36H16V34Z" fill="white" />
  </svg>
)

export default function GoogleDocsModal({
  isOpen,
  onClose,
  editor,
  docTitle,
  workspaceReportId,
  googleDocsUrl,
  onSaveGoogleDocsUrl,
  onSaveDraft,
  onSubmitToAdmin,
  user
}) {
  const [activeTab, setActiveTab] = useState('launch') // 'launch' | 'script' | 'sync'
  const getPersistedDocUrl = () => {
    if (googleDocsUrl) return googleDocsUrl
    if (workspaceReportId) {
      const perReport = localStorage.getItem(`dommunity_gdocs_${workspaceReportId}`)
      if (perReport) return perReport
    }
    return localStorage.getItem('dommunity_saved_gdoc_url') || ''
  }

  const [inputUrl, setInputUrl] = useState(() => getPersistedDocUrl())
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedContent, setCopiedContent] = useState(false)
  const [savedUrlSuccess, setSavedUrlSuccess] = useState(false)
  const [draftSavedSuccess, setDraftSavedSuccess] = useState(false)
  const [webAppUrl, setWebAppUrl] = useState(() => {
    return localStorage.getItem('dommunity_gdocs_webapp_url') || ''
  })
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => {
    const url = getPersistedDocUrl()
    if (url) {
      setInputUrl(url)
    }
  }, [googleDocsUrl, workspaceReportId])

  if (!isOpen) return null

  // Helper to open links in system browser (or new window)
  const openExternalUrl = (url) => {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Handle direct launch - reopens the saved doc if one exists
  const handleLaunchGoogleDocs = (targetUrl) => {
    const current = inputUrl.trim()
    if (current) {
      handleSaveUrl(current)
    }
    const saved = current || getPersistedDocUrl()
    const finalUrl = targetUrl || saved || 'https://docs.new'
    openExternalUrl(finalUrl)
  }

  // Copy rich text & HTML content to clipboard
  const handleCopyContentAndOpen = async () => {
    try {
      const current = inputUrl.trim()
      if (current) {
        handleSaveUrl(current)
      }
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

      setCopiedContent(true)
      setTimeout(() => setCopiedContent(false), 3000)

      // Direct to Google Docs after small delay
      setTimeout(() => {
        handleLaunchGoogleDocs()
      }, 500)
    } catch (err) {
      console.error('Failed to copy document content:', err)
      handleLaunchGoogleDocs()
    }
  }

  // Save the connected Google Doc URL permanently
  const handleSaveUrl = (customUrl) => {
    const trimmed = (customUrl !== undefined ? customUrl : inputUrl).trim()
    setInputUrl(trimmed)
    if (onSaveGoogleDocsUrl) {
      onSaveGoogleDocsUrl(trimmed)
    }
    if (trimmed) {
      localStorage.setItem('dommunity_saved_gdoc_url', trimmed)
      if (workspaceReportId) {
        localStorage.setItem(`dommunity_gdocs_${workspaceReportId}`, trimmed)
      }
    } else {
      localStorage.removeItem('dommunity_saved_gdoc_url')
      if (workspaceReportId) {
        localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
      }
    }
    setSavedUrlSuccess(true)
    setTimeout(() => setSavedUrlSuccess(false), 2500)
  }

  // Push content to Google Apps Script Web App - updates existing doc if available
  const handleSyncToWebApp = async () => {
    if (!webAppUrl.trim()) {
      setSyncStatus({ state: 'error', message: 'Please enter a valid Google Apps Script Web App URL.' })
      return
    }

    localStorage.setItem('dommunity_gdocs_webapp_url', webAppUrl.trim())

    const currentDocUrl = inputUrl.trim() || getPersistedDocUrl()
    const docIdMatch = currentDocUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)
    const existingDocId = docIdMatch ? docIdMatch[1] : null

    setSyncStatus({
      state: 'loading',
      message: existingDocId ? 'Updating saved Google Doc via Apps Script...' : 'Creating new Google Doc via Apps Script...'
    })

    try {
      const html = editor?.getHTML() || ''
      const payload = existingDocId
        ? {
            action: 'update_doc',
            docId: existingDocId,
            replace: true,
            title: docTitle || 'Dommunity Report',
            html: html,
            author: user?.displayName || user?.name || user?.email || 'Dommunity User',
            reportId: workspaceReportId || ''
          }
        : {
            action: 'create_doc',
            title: docTitle || 'Dommunity Report',
            html: html,
            author: user?.displayName || user?.name || user?.email || 'Dommunity User',
            reportId: workspaceReportId || ''
          }

      const response = await fetch(webAppUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()
      if (result.success && (result.docUrl || currentDocUrl)) {
        const targetDocUrl = result.docUrl || currentDocUrl
        setSyncStatus({
          state: 'success',
          message: existingDocId ? 'Saved Google Doc updated successfully!' : 'Google Doc created & linked successfully!'
        })
        setInputUrl(targetDocUrl)
        localStorage.setItem('dommunity_saved_gdoc_url', targetDocUrl)
        if (workspaceReportId) {
          localStorage.setItem(`dommunity_gdocs_${workspaceReportId}`, targetDocUrl)
        }
        if (onSaveGoogleDocsUrl) onSaveGoogleDocsUrl(targetDocUrl)
        openExternalUrl(targetDocUrl)
      } else {
        throw new Error(result.error || 'Failed to update document.')
      }
    } catch (err) {
      console.error('Apps Script Sync Error:', err)
      setSyncStatus({
        state: 'error',
        message: 'Sync failed: ' + (err.message || 'Make sure your Web App deployment is set to "Anyone".')
      })
    }
  }

  // Google Apps Script source code
  const googleScriptCode = `/**
 * DOMMUNITY GOOGLE DOCS INTEGRATION SCRIPT
 * Add-on Menu & REST API Bridge for Dommunity App
 */
var DEFAULT_FIREBASE_PROJECT = 'dommunity-app';
var DEFAULT_COLLECTION = 'narrative_reports';

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Dommunity')
    .addItem('📤 Sync Document to Dommunity', 'exportToDommunity')
    .addItem('📥 Import Report from Dommunity', 'importFromDommunity')
    .addSeparator()
    .addItem('📄 Insert CES Narrative Report Template', 'insertDommunityTemplate')
    .addSeparator()
    .addItem('⚙️ Configure Dommunity / Firebase', 'configureDommunity')
    .addItem('ℹ️ Help & Connection Info', 'showHelpDialog')
    .addToUi();
}

function exportToDommunity() {
  var ui = DocumentApp.getUi();
  var doc = DocumentApp.getActiveDocument();
  var title = doc.getName() || 'Untitled Dommunity Report';
  var html = convertDocToHtml(doc.getBody());
  
  var props = PropertiesService.getUserProperties();
  var proj = props.getProperty('DOMMUNITY_PROJECT_ID') || DEFAULT_FIREBASE_PROJECT;
  var key = props.getProperty('DOMMUNITY_API_KEY') || '';

  try {
    saveToFirestore(proj, key, '', {
      title: title,
      narrative: html,
      googleDocsUrl: doc.getUrl(),
      status: 'draft',
      updatedAt: new Date().toISOString()
    });
    ui.alert('Success', '✅ Synced to Dommunity successfully!\\nDoc: ' + title, ui.ButtonSet.OK);
  } catch (e) {
    showExportModal(title, html, doc.getUrl());
  }
}

function insertDommunityTemplate() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  
  var h = body.appendParagraph('DOMINICAN COLLEGE OF TARLAC\\nCOMMUNITY EXTENSION SERVICES (CES)\\nOFFICIAL NARRATIVE REPORT');
  h.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  h.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendHorizontalRule();

  body.appendTable([
    ['Project Title:', 'Community Outreach & Digital Inclusion Initiative'],
    ['Implementing Organization:', 'College Student Council'],
    ['Date & Venue:', new Date().toLocaleDateString() + ' | Community Outreach Center'],
    ['Academic Year:', 'A.Y. 2025-2026 | 2nd Semester']
  ]);

  var s1 = body.appendParagraph('\\nI. EXECUTIVE SUMMARY & BACKGROUND');
  s1.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Detail the context, community needs, and volunteer participation here.');

  var s2 = body.appendParagraph('\\nII. OBJECTIVES & OUTCOMES');
  s2.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendListItem('Empower community participants with actionable skills.');
  body.appendListItem('Foster active Dominican volunteerism.');

  var s3 = body.appendParagraph('\\nIII. DETAILED NARRATIVE');
  s3.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Chronological narrative of the activities conducted.');

  var s4 = body.appendParagraph('\\nIV. SIGNATORIES');
  s4.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendTable([
    ['Prepared by:\\n\\n\\n__________________\\nProject Coordinator', 'Approved by:\\n\\n\\n__________________\\nCES Director']
  ]);

  DocumentApp.getUi().alert('Template Applied', '✅ Official CES Narrative Report template inserted!', DocumentApp.getUi().ButtonSet.OK);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || '{}');
    if (data.action === 'create_doc') {
      var doc = DocumentApp.create(data.title || 'Dommunity Document');
      var body = doc.getBody();
      if (data.author) {
        body.appendParagraph('Author: ' + data.author + ' | Dommunity Integrated').setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
        body.appendHorizontalRule();
      }
      if (data.html) insertHtmlIntoDoc(body, data.html);
      return ContentService.createTextOutput(JSON.stringify({ success: true, docId: doc.getId(), docUrl: doc.getUrl() })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function convertDocToHtml(body) {
  var html = [];
  for (var i = 0; i < body.getNumChildren(); i++) {
    var c = body.getChild(i);
    if (c.getType() === DocumentApp.ElementType.PARAGRAPH) {
      var text = c.asParagraph().getText();
      var head = c.asParagraph().getHeading();
      if (head === DocumentApp.ParagraphHeading.HEADING1 || head === DocumentApp.ParagraphHeading.TITLE) html.push('<h1>' + text + '</h1>');
      else if (head === DocumentApp.ParagraphHeading.HEADING2) html.push('<h2>' + text + '</h2>');
      else if (head === DocumentApp.ParagraphHeading.HEADING3) html.push('<h3>' + text + '</h3>');
      else html.push('<p>' + (text || '<br>') + '</p>');
    } else if (c.getType() === DocumentApp.ElementType.LIST_ITEM) {
      html.push('<ul><li>' + c.asListItem().getText() + '</li></ul>');
    }
  }
  return html.join('\\n');
}

function insertHtmlIntoDoc(body, html) {
  var lines = html.replace(/<br\\s*\\/?>/gi, '\\n').split(/<\\/(?:p|h1|h2|h3|li)>/i);
  lines.forEach(function(l) {
    var text = l.replace(/<[^>]*>/g, '').trim();
    if (!text) return;
    if (/<h1/i.test(l)) body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING1);
    else if (/<h2/i.test(l)) body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    else if (/<h3/i.test(l)) body.appendParagraph(text).setHeading(DocumentApp.ParagraphHeading.HEADING3);
    else if (/<li/i.test(l)) body.appendListItem(text);
    else body.appendParagraph(text);
  });
}

function saveToFirestore(projectId, apiKey, reportId, data) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + DEFAULT_COLLECTION;
  if (apiKey) url += '?key=' + apiKey;
  var fields = {};
  for (var k in data) fields[k] = { stringValue: String(data[k]) };
  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  });
}

function showExportModal(title, html, docUrl) {
  var out = HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;padding:12px;">' +
    '<h3>Ready to Sync to Dommunity</h3>' +
    '<textarea style="width:100%;height:140px;font-size:11px;" readonly>' + html + '</textarea><br><br>' +
    '<button onclick="navigator.clipboard.writeText(document.querySelector(\\'textarea\\').value); alert(\\'Copied!\\');" style="padding:8px 16px;background:#1e3a8a;color:white;border:none;border-radius:4px;cursor:pointer;">Copy HTML</button>' +
    '</div>'
  ).setWidth(480).setHeight(300);
  DocumentApp.getUi().showModalDialog(out, 'Dommunity Sync Content');
}`

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(googleScriptCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-blue via-[#17306b] to-[#1e3a8a] px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <GoogleDocsIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-base tracking-tight">
                  Google Docs Connection & Script
                </h3>
                <span className="text-[10px] font-semibold bg-[#4285F4]/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                  Integration
                </span>
              </div>
              <p className="text-gray-300 text-xs mt-0.5">
                Directly open Google Docs, sync reports, and connect via Google Apps Script.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-200 bg-neutral-50 px-6 gap-2 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('launch')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'launch'
                ? 'border-[#4285F4] text-[#1a73e8] bg-white rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Launch & Link Doc
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'script'
                ? 'border-[#4285F4] text-[#1a73e8] bg-white rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Google Apps Script
          </button>
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'sync'
                ? 'border-[#4285F4] text-[#1a73e8] bg-white rounded-t-lg'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Web App Direct Sync
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: LAUNCH & LINK */}
          {activeTab === 'launch' && (
            <div className="space-y-5">
              {/* Primary Direct Actions Card */}
              <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-blue flex items-center gap-1.5 mb-3">
                  <ExternalLink className="w-4 h-4 text-[#4285F4]" />
                  Direct Actions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Reopen saved doc button or direct button */}
                  <button
                    onClick={() => handleLaunchGoogleDocs()}
                    className="w-full bg-[#1a73e8] hover:bg-[#1557b0] text-white p-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer group"
                  >
                    <GoogleDocsIcon className="w-5 h-5 bg-white rounded p-0.5 shrink-0" />
                    <span className="flex-1 text-left">
                      <span className="block font-bold">
                        {(inputUrl.trim() || getPersistedDocUrl()) ? 'Reopen Saved Google Doc' : 'Direct to Google Docs'}
                      </span>
                      <span className="text-[10px] text-blue-100 font-normal truncate block">
                        {(inputUrl.trim() || getPersistedDocUrl()) ? 'Open saved document in Browser ↗' : 'Open docs.new in Browser ↗'}
                      </span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-blue-200 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  {/* Copy & Go to Docs */}
                  <button
                    onClick={handleCopyContentAndOpen}
                    className="w-full bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-800 p-3.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {copiedContent ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </div>
                    <span className="flex-1 text-left">
                      <span className="block font-bold">
                        {copiedContent ? 'Copied to Clipboard!' : 'Copy Content & Open Docs'}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        Ready to paste (Ctrl+V) formatted
                      </span>
                    </span>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-600 pt-2 border-t border-blue-100">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-neutral-400" />
                    Need the main dashboard?
                  </span>
                  <button
                    onClick={() => openExternalUrl('https://docs.google.com/document/u/0/')}
                    className="text-[#1a73e8] hover:underline font-semibold cursor-pointer flex items-center gap-1"
                  >
                    Open Google Docs Home ↗
                  </button>
                </div>
              </div>

              {/* Connect Specific Document Link */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-neutral-500" />
                    Link Existing Google Doc to this Report
                  </h4>
                  {inputUrl && (
                    <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Linked
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 text-xs mb-3">
                  Paste the URL of your Google Doc (e.g. from your browser address bar) to associate it with this Dommunity report:
                </p>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/YOUR_DOC_ID/edit"
                    className="flex-1 border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={handleSaveUrl}
                    className="px-4 py-2 bg-navy-blue hover:bg-navy-blue/90 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {savedUrlSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        Saved!
                      </>
                    ) : (
                      'Save Link'
                    )}
                  </button>
                </div>

                {inputUrl && (
                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => handleLaunchGoogleDocs(inputUrl)}
                      className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Reopen this saved Google Doc in Browser
                    </button>
                    <span className="text-neutral-300">•</span>
                    <button
                      onClick={() => {
                        setInputUrl('')
                        localStorage.removeItem('dommunity_saved_gdoc_url')
                        if (workspaceReportId) {
                          localStorage.removeItem(`dommunity_gdocs_${workspaceReportId}`)
                        }
                        if (onSaveGoogleDocsUrl) onSaveGoogleDocsUrl('')
                      }}
                      className="text-xs text-neutral-400 hover:text-red-500 transition cursor-pointer"
                    >
                      Clear link
                    </button>
                  </div>
                )}
              </div>

              {/* Save to Compiled Reports as Draft Card */}
              <div className="bg-gradient-to-br from-neutral-50 to-blue-50/40 border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-navy-blue flex items-center gap-1.5">
                      <Save className="w-4 h-4 text-blue-600" />
                      Save to Compiled Reports
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Save this document directly into your Compiled Reports under Drafts, or submit it to the Admin.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    onClick={async () => {
                      const trimmed = inputUrl.trim()
                      if (trimmed) {
                        handleSaveUrl(trimmed)
                      }
                      if (onSaveDraft) {
                        onClose()
                        await onSaveDraft(trimmed)
                        setDraftSavedSuccess(true)
                        setTimeout(() => setDraftSavedSuccess(false), 3000)
                      }
                    }}
                    className="px-4 py-2.5 bg-navy-blue hover:bg-navy-blue/90 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                  >
                    {draftSavedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span>Saved as Draft!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as Draft to Compiled Reports</span>
                      </>
                    )}
                  </button>

                  {onSubmitToAdmin && (
                    <button
                      onClick={async () => {
                        const trimmed = inputUrl.trim()
                        if (trimmed) {
                          handleSaveUrl(trimmed)
                        }
                        onClose()
                        await onSubmitToAdmin(trimmed)
                      }}
                      className="px-4 py-2.5 bg-sig-green hover:bg-sig-green-600 text-navy-blue font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                      title="Submit this report to Admin"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit to Admin 🚀</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE APPS SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">How to connect using this Google Apps Script:</span>
                  <ol className="list-decimal list-inside mt-1.5 space-y-1 text-amber-800">
                    <li>Open Google Docs (<span className="font-mono text-[11px]">docs.new</span>)</li>
                    <li>Click <span className="font-semibold">Extensions &gt; Apps Script</span> in the Google Docs top menu</li>
                    <li>Delete any code in <span className="font-mono text-[11px]">Code.gs</span> and paste this script below</li>
                    <li>Click <span className="font-semibold">Save (💾)</span> and refresh your Google Doc</li>
                    <li>A new <span className="font-semibold text-blue-700">"Dommunity"</span> menu will appear with Export, Import & Template tools!</li>
                  </ol>
                </div>
              </div>

              {/* Script Box */}
              <div className="border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-[#1E1E1E]">
                <div className="bg-[#2D2D2D] px-4 py-2 flex items-center justify-between border-b border-neutral-700">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                    <span className="text-neutral-400 text-xs font-mono ml-2">DommunityGoogleScript.gs</span>
                  </div>
                  <button
                    onClick={handleCopyScriptCode}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied Script!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script Code</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-4 text-[11px] font-mono text-gray-200 overflow-x-auto max-h-72 leading-relaxed selection:bg-blue-600">
                  {googleScriptCode}
                </pre>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 pt-1">
                <span>File saved in project: <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-mono">src/renderer/src/components/editor/google-docs/DommunityGoogleScript.js</code></span>
                <button
                  onClick={handleCopyScriptCode}
                  className="text-[#1a73e8] font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: WEB APP DIRECT SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5 mb-1 text-navy-blue">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  Automated Web App Sync (Optional)
                </span>
                Deploy your Google Apps Script as a <strong>Web App</strong> (Deploy &gt; New deployment &gt; Web app &gt; Access: Anyone). Paste the generated Web App URL below to automatically generate Google Docs directly from this editor without copy-pasting!
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700 block">
                  Google Apps Script Web App URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 border border-neutral-300 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <button
                    onClick={handleSyncToWebApp}
                    disabled={syncStatus.state === 'loading'}
                    className="px-5 py-2 bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-neutral-300 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                  >
                    {syncStatus.state === 'loading' ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Pushing…
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Push to Google Docs
                      </>
                    )}
                  </button>
                </div>
              </div>

              {syncStatus.message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    syncStatus.state === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {syncStatus.state === 'success' ? (
                    <Check className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => handleLaunchGoogleDocs()}
            className="text-xs text-[#1a73e8] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <GoogleDocsIcon className="w-3.5 h-3.5" />
            {(inputUrl.trim() || getPersistedDocUrl()) ? 'Reopen Saved Google Doc ↗' : 'Direct to docs.new ↗'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => handleLaunchGoogleDocs()}
              className="px-4 py-1.5 text-xs font-bold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {(inputUrl.trim() || getPersistedDocUrl()) ? 'Open Saved Doc in Google Docs' : 'Open in Google Docs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
