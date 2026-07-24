import { X, AlertTriangle, Upload } from 'lucide-react';
import mammoth from 'mammoth';
import { parseDocxLayout } from '../utils/editorHelpers';
import GlassDatePicker from '../../GlassDatePicker';

/**
 * FindReplaceDialog — Modal for find & replace functionality.
 */
export function FindReplaceDialog({ show, onClose, findText, setFindText, replaceText, setReplaceText, onFind, onReplaceAll }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-200 w-80" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-blue text-sm">Find & Replace</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2.5">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5 block">Find</label>
            <input
              value={findText} onChange={e => setFindText(e.target.value)}
              placeholder="Search text…" autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase mb-0.5 block">Replace With</label>
            <input
              value={replaceText} onChange={e => setReplaceText(e.target.value)}
              placeholder="Replacement…"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onFind}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold py-2 rounded-lg transition cursor-pointer">
              Find Next
            </button>
            <button onClick={onReplaceAll}
              className="flex-1 bg-navy-blue text-white text-xs font-semibold py-2 rounded-lg hover:bg-navy-blue/90 transition cursor-pointer">
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * WordCountDialog — Modal showing document statistics.
 */
export function WordCountDialog({ show, onClose, wordCount, charCount, editor }) {
  if (!show) return null;
  const text = editor?.getText() || '';
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-72" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-navy-blue text-sm">Word Count</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2">
          {[
            { label: 'Words', value: wordCount },
            { label: 'Characters (no spaces)', value: text.replace(/\s/g, '').length },
            { label: 'Characters (with spaces)', value: charCount },
            { label: 'Paragraphs', value: (text.match(/\n/g) || []).length + 1 },
            { label: 'Lines', value: Math.max(1, Math.ceil(charCount / 80)) },
          ].map(s => (
            <div key={s.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-600">{s.label}</span>
              <span className="text-sm font-bold text-navy-blue">{s.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-4 bg-navy-blue text-white text-xs font-semibold py-2 rounded-xl hover:bg-navy-blue/90 transition cursor-pointer">
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * OpenReportDialog — Modal for selecting a report to open.
 */
export function OpenReportDialog({ show, onClose, reports, eventsList, onOpen, StatusBadge }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-gray-200 w-[480px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="font-bold text-navy-blue text-sm">Open Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-y-auto space-y-2.5">
          {reports.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 italic">No reports found.</p>
          ) : reports.map(rep => {
            const ev = eventsList.find(e => e.id === rep.eventId);
            return (
              <button key={rep.id} onClick={() => onOpen(rep)}
                className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={rep.status} />
                    <span className="text-[9px] text-gray-400">{rep.semester}</span>
                  </div>
                  <span className="text-[9px] text-gray-400">{new Date(rep.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-semibold text-navy-blue mt-1">{ev?.name || rep.activityTitle || 'Untitled'}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * DocPropertiesDialog — Modal for editing document metadata.
 */
export function DocPropertiesDialog({
  show, onClose,
  workspaceReportAY, setWorkspaceReportAY,
  workspaceReportSem, setWorkspaceReportSem,
  workspaceReportType, setWorkspaceReportType,
  workspaceReportOrgId, setWorkspaceReportOrgId,
  workspaceReportBenef, setWorkspaceReportBenef,
  workspaceReportEventId, setWorkspaceReportEventId,
  workspaceReportTitle, setWorkspaceReportTitle,
  workspaceReportDate, setWorkspaceReportDate,
  workspaceReportLocation, setWorkspaceReportLocation,
  workspaceIsReadOnly,
  workspaceFeedback,
  linkToEvent, setLinkToEvent,
  orgsList, eventsList,
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 shadow-2xl border border-gray-200 w-[520px] max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h3 className="font-bold text-navy-blue text-sm">Document Properties</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {workspaceFeedback && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p><strong>Admin Feedback:</strong> {workspaceFeedback}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Academic Year</label>
            <select value={workspaceReportAY} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportAY(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20">
              {['2024-2025', '2025-2026', '2026-2027', '2027-2028'].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Semester</label>
            <select value={workspaceReportSem} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportSem(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20">
              {['1st Semester', '2nd Semester', 'Summer'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Category</label>
            <select value={workspaceReportType} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20">
              <option value="outreach">Community Outreach</option>
              <option value="community_service">Community Service</option>
              <option value="blood_donation">Blood Donation</option>
              <option value="department_program">Department Extension</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Collaborator Org</label>
            <select value={workspaceReportOrgId} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportOrgId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20">
              <option value="">-- Main CES Office --</option>
              {orgsList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Beneficiaries</label>
            <input type="text" value={workspaceReportBenef} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportBenef(e.target.value)}
              placeholder="e.g. 120 students" className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" checked={linkToEvent} disabled={workspaceIsReadOnly} onChange={e => setLinkToEvent(e.target.checked)}
                className="rounded border-gray-300 text-navy-blue" />
              Link to scheduled event
            </label>
          </div>
          {linkToEvent ? (
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Select Event</label>
              <select value={workspaceReportEventId} disabled={workspaceIsReadOnly}
                onChange={e => {
                  setWorkspaceReportEventId(e.target.value);
                  const ev = eventsList.find(x => x.id === e.target.value);
                  if (ev) setWorkspaceReportOrgId(ev.assignedOrganizationId || '');
                }}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20">
                <option value="">-- Select --</option>
                {eventsList.map(e => <option key={e.id} value={e.id}>{e.name} ({new Date(e.scheduleDate).toLocaleDateString()})</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Activity Title</label>
                <input type="text" value={workspaceReportTitle} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Date</label>
                <GlassDatePicker
                  value={workspaceReportDate}
                  disabled={workspaceIsReadOnly}
                  onChange={(val) => setWorkspaceReportDate(val)}
                  showTime={false}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Location</label>
                <input type="text" value={workspaceReportLocation} disabled={workspaceIsReadOnly} onChange={e => setWorkspaceReportLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20" />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-xs font-semibold py-2 rounded-xl hover:bg-gray-50 transition cursor-pointer">
            Cancel
          </button>
          <button onClick={onClose}
            className="flex-1 bg-navy-blue text-white text-xs font-semibold py-2 rounded-xl hover:bg-navy-blue/90 transition cursor-pointer">
            Save Properties
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * TemplatesDialog — Modal for starting new documents from a list of presets or custom saved templates.
 */
export function TemplatesDialog({
  show,
  onClose,
  templates,
  onSelectTemplate,
  onDeleteTemplate,
  onRenameTemplate,
  onDuplicateTemplate,
  onSetDefaultTemplate,
  defaultTemplateId,
  onImportTemplate,
}) {
  if (!show) return null;

  const handleImportDocx = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      try {
        const layout = await parseDocxLayout(arrayBuffer);
        const result = await mammoth.convertToHtml({ arrayBuffer }, {
          convertImage: mammoth.images.imgElement((image) => {
            return image.readAsBase64String().then((base64String) => {
              return {
                src: `data:${image.contentType};base64,${base64String}`
              };
            });
          })
        });
        const html = result.value;
        
        let tplName = file.name.replace(/\.[^/.]+$/, "");
        const enteredName = window.prompt("Import Template — Enter Template Name:", tplName);
        if (enteredName === null) return;
        if (enteredName.trim()) tplName = enteredName.trim();

        onImportTemplate({
          name: tplName,
          html,
          paperKey: layout?.paperKey || 'A4',
          orientation: layout?.orientation || 'portrait',
          marginKey: layout?.marginKey || 'Normal',
          lineSpacing: "1.5",
          showHeader: !!layout?.showHeader,
          showFooter: !!layout?.showFooter,
          headerText: layout?.headerText || '',
          footerText: layout?.footerText || '',
        });
      } catch (err) {
        console.error("Error parsing .docx template:", err);
        alert("Failed to parse the .docx template. Please check the file format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  // Preset definitions
  const presets = [
    {
      id: 'preset-blank',
      name: 'Blank Document',
      description: 'Start with a clean page',
      isPreset: true,
      paperKey: 'A4',
      orientation: 'portrait',
      marginKey: 'Normal',
      lineSpacing: '1.5',
      html: '<p></p>',
      fontFamily: 'Calibri, sans-serif',
      fontSize: '11px',
    },
    {
      id: 'preset-outreach',
      name: 'CES Outreach Report',
      description: 'Narrative template for community outreach',
      isPreset: true,
      paperKey: 'A4',
      orientation: 'portrait',
      marginKey: 'Normal',
      lineSpacing: '1.5',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      html: `
        <h1 style="text-align: center;">COMMUNITY OUTREACH PROJECT REPORT</h1>
        <p style="text-align: center; font-style: italic; color: #6b7280;">DommUnity Community Extension Services (CES) Office</p>
        <hr />
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            <tr>
              <td style="width: 50%; font-weight: bold; background-color: #f3f4f6; padding: 6px;">Activity Title:</td>
              <td style="width: 50%; padding: 6px;">[Enter Activity Name]</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f3f4f6; padding: 6px;">Date & Location:</td>
              <td style="padding: 6px;">[Enter Date] @ [Enter Venue]</td>
            </tr>
            <tr>
              <td style="font-weight: bold; background-color: #f3f4f6; padding: 6px;">Beneficiaries:</td>
              <td style="padding: 6px;">[Number and description of beneficiaries]</td>
            </tr>
          </tbody>
        </table>
        <p></p>
        <h2>1. Executive Summary</h2>
        <p>Provide a brief description of the community outreach activity. Highlight the goal, organizers, collaborator organizations, and immediate achievements of the program.</p>
        <p></p>
        <h2>2. Project Objectives</h2>
        <p>State the specific objective criteria of the community extension activity:</p>
        <ul>
          <li>Objective 1: To address core community concerns and program actions...</li>
          <li>Objective 2: To promote collaborative volunteering...</li>
        </ul>
        <p></p>
        <h2>3. Narrative Report & Chronology</h2>
        <p>Detail the step-by-step description of the execution of the project. Mention the preparation stages, resource collection, actual project operations, and community participation highlights.</p>
        <p></p>
        <h2>4. Key Outcomes & Recommendations</h2>
        <p>Detail what went well and outline areas of recommendation for CES programs in the future.</p>
      `,
    },
    {
      id: 'preset-proposal',
      name: 'CES Project Proposal',
      description: 'Template for submitting new project ideas',
      isPreset: true,
      paperKey: 'A4',
      orientation: 'portrait',
      marginKey: 'Normal',
      lineSpacing: '1.5',
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      html: `
        <h1 style="text-align: center; color: #1e3a8a;">COMMUNITY EXTENSION PROJECT PROPOSAL</h1>
        <p style="text-align: center; font-style: italic;">Proposed Academic Year: 2026-2027</p>
        <hr />
        <h2>I. General Information</h2>
        <p><strong>Proposed Project Title:</strong> [Enter Project Title]</p>
        <p><strong>Target Community / Sector:</strong> [Enter Barangay or Group Name]</p>
        <p><strong>Estimated Budget:</strong> PHP [Enter Amount]</p>
        <p></p>
        <h2>II. Rationale & Problem Identification</h2>
        <p>Explain the background of the target community and why this project is critical. Identify the gaps or opportunities this program seeks to fill.</p>
        <p></p>
        <h2>III. Project Activities & Timeline</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; font-weight: bold;">Activity Detail</th>
              <th style="padding: 8px; font-weight: bold;">Target Date</th>
              <th style="padding: 8px; font-weight: bold;">Key Responsible Person</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px;">1. Community Needs Assessment</td>
              <td style="padding: 8px;">Month 1</td>
              <td style="padding: 8px;">CES Team / Coordinator</td>
            </tr>
            <tr>
              <td style="padding: 8px;">2. Resource Mobilization</td>
              <td style="padding: 8px;">Month 2</td>
              <td style="padding: 8px;">Collaborating Partners</td>
            </tr>
            <tr>
              <td style="padding: 8px;">3. Direct Activity Launch</td>
              <td style="padding: 8px;">Month 3</td>
              <td style="padding: 8px;">Office Coordinators</td>
            </tr>
          </tbody>
        </table>
      `,
    },
    {
      id: 'preset-minutes',
      name: 'Meeting Minutes',
      description: 'Record CES coordinator sync discussions',
      isPreset: true,
      paperKey: 'Letter',
      orientation: 'portrait',
      marginKey: 'Moderate',
      lineSpacing: '1.15',
      fontFamily: 'Calibri, sans-serif',
      fontSize: '11px',
      html: `
        <h2>CES Coordination Sync - Meeting Minutes</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Facilitator:</strong> Jonnel B. Manio, CES Office Coordinator</p>
        <p><strong>Attendees:</strong> CES Staff, Org Volunteers</p>
        <hr />
        <h3>1. Meeting Agenda</h3>
        <ul>
          <li>Review of pending narrative reports</li>
          <li>Upcoming outreach event coordination</li>
          <li>Collaboration with student organizations</li>
        </ul>
        <p></p>
        <h3>2. Key Decisions & Action Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 6px; font-weight: bold;">Action Item</th>
              <th style="padding: 6px; font-weight: bold;">Assigned To</th>
              <th style="padding: 6px; font-weight: bold;">Deadline</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 6px;">Submit draft outreach narratives</td>
              <td style="padding: 6px;">All Coordinators</td>
              <td style="padding: 6px;">End of week</td>
            </tr>
            <tr>
              <td style="padding: 6px;">Update CES inventory log</td>
              <td style="padding: 6px;">Ces Staff</td>
              <td style="padding: 6px;">Within 3 days</td>
            </tr>
          </tbody>
        </table>
      `,
    }
  ];

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-gray-200 w-[720px] max-h-[85vh] flex flex-col animate-in fade-in-0 zoom-in-95" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-navy-blue text-sm">Start a New Document</h3>
            <p className="text-[10px] text-gray-400">Choose a default preset template or load one of your custom template styles</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gallery Scroll Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          
          {/* Section 1: Presets */}
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Default Presets</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {presets.map(p => {
                const isDefault = defaultTemplateId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectTemplate(p)}
                    className={`border rounded-2xl p-4 bg-gray-50 hover:bg-blue-50/50 hover:border-blue-300 transition cursor-pointer flex flex-col justify-between min-h-[140px] relative group border-gray-200 shadow-xs`}
                  >
                    {isDefault && (
                      <span className="absolute top-2 right-2 bg-blue-600 text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-xs mb-3 group-hover:scale-110 transition">
                      <span className="text-navy-blue font-bold text-xs">DOC</span>
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-navy-blue leading-tight truncate">{p.name}</h5>
                      <p className="text-[9px] text-gray-400 leading-tight mt-1 line-clamp-2">{p.description}</p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => { e.stopPropagation(); onSetDefaultTemplate(p.id); }}
                        className="text-[9px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        {isDefault ? 'Remove Default' : 'Make Default'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Saved Templates */}
          <div>
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>My Custom Templates</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-normal lowercase italic text-gray-400">Created from existing documents</span>
                <label className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-navy-blue hover:bg-blue-800 text-white px-2.5 py-1 rounded-full cursor-pointer transition shadow-xs">
                  <Upload className="w-2.5 h-2.5" />
                  Import .docx
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleImportDocx}
                    className="hidden"
                  />
                </label>
              </div>
            </h4>
            
            {templates.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                No custom templates saved yet. You can save your document as a template from the "File" menu.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {templates.map(t => {
                  const isDefault = defaultTemplateId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTemplate(t)}
                      className={`border rounded-2xl p-4 bg-white hover:bg-blue-50/30 hover:border-blue-300 transition cursor-pointer flex flex-col justify-between min-h-[140px] relative group border-gray-200 shadow-xs`}
                    >
                      {isDefault && (
                        <span className="absolute top-2 right-2 bg-blue-600 text-white text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      
                      <div className="h-10 w-10 bg-navy-blue rounded-xl flex items-center justify-center shadow-xs mb-3 group-hover:scale-110 transition">
                        <span className="text-white font-bold text-xs">TPL</span>
                      </div>
                      
                      <div>
                        <h5 className="text-[11px] font-bold text-navy-blue leading-tight truncate">{t.name}</h5>
                        <p className="text-[9px] text-gray-400 mt-0.5">Saved {new Date(t.createdAt).toLocaleDateString()}</p>
                      </div>

                      {/* Hover action bar */}
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => { e.stopPropagation(); onSetDefaultTemplate(t.id); }}
                          className="text-[8px] text-blue-600 hover:underline font-semibold cursor-pointer whitespace-nowrap"
                        >
                          {isDefault ? 'Clear Default' : 'Set Default'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newN = window.prompt('Rename Template:', t.name);
                            if (newN && newN.trim()) onRenameTemplate(t.id, newN.trim());
                          }}
                          className="text-[8px] text-gray-500 hover:underline font-semibold cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicateTemplate(t.id); }}
                          className="text-[8px] text-gray-500 hover:underline font-semibold cursor-pointer animate-pulse"
                        >
                          Clone
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this template?')) onDeleteTemplate(t.id); }}
                          className="text-[8px] text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

