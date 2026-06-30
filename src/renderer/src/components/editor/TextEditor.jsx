import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import {
  Plus, FolderOpen, Save, Send, Printer, FileDown, Download, RefreshCw,
  FileText, Check, X, ChevronDown,
} from 'lucide-react';
import { getEditorExtensions } from './extensions';
import RibbonHome from './ui/RibbonHome';
import RibbonInsert from './ui/RibbonInsert';
import RibbonLayout from './ui/RibbonLayout';
import RibbonReview from './ui/RibbonReview';
import RibbonView from './ui/RibbonView';
import FloatingToolbar from './ui/FloatingToolbar';
import DocumentCanvas from './ui/DocumentCanvas';
import StatusBar from './ui/StatusBar';
import CommentsPanel from './ui/CommentsPanel';
import NavigationPane from './ui/NavigationPane';
import { FindReplaceDialog, WordCountDialog, OpenReportDialog, DocPropertiesDialog, TemplatesDialog } from './ui/Dialogs';
import { DropdownWrapper } from './ui/DropdownWrapper';
import { RichTextProvider } from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import {
  handleExportPDF, handleExportDOCX, handleExportTXT,
  handleFind as doFind, handleReplaceAll as doReplaceAll,
  parseDocxLayout,
} from './utils/editorHelpers';

/**
 * TextEditor — Complete document editor component.
 * Integrates all ribbon tabs, document canvas, floating toolbar, and panels.
 */
export default function TextEditor({
  // State passed from parent
  user,
  workspaceReportId, setWorkspaceReportId,
  workspaceReportAY, setWorkspaceReportAY,
  workspaceReportSem, setWorkspaceReportSem,
  workspaceReportType, setWorkspaceReportType,
  workspaceReportEventId, setWorkspaceReportEventId,
  workspaceReportTitle, setWorkspaceReportTitle,
  workspaceReportDate, setWorkspaceReportDate,
  workspaceReportLocation, setWorkspaceReportLocation,
  workspaceReportBenef, setWorkspaceReportBenef,
  workspaceReportOrgId, setWorkspaceReportOrgId,
  workspaceReportPhotos, setWorkspaceReportPhotos,
  workspaceIsReadOnly, setWorkspaceIsReadOnly,
  workspaceFeedback,
  linkToEvent, setLinkToEvent,
  loading, setLoading,
  saveStatus, setSaveStatus,
  autoSave, setAutoSave,
  // Data
  reportsList, orgsList, eventsList,
  // Callbacks
  onSave, onResetForm, onOpenReport, onLoadData,
  setActiveTab: setParentActiveTab,
  // StatusBadge component
  StatusBadge,
}) {
  const [hasBeenEdited, setHasBeenEdited] = useState(false);

  // ── Editor ──
  const editor = useEditor({
    extensions: getEditorExtensions(),
    content: '<p></p>',
    editable: true,
    editorProps: {
      attributes: {
        spellcheck: 'true',
        class: 'focus:outline-none',
      },
    },
    onCreate: ({ editor: ed }) => {
      if (ed.getText().trim()) {
        setHasBeenEdited(true);
      }
    },
    onFocus: () => {
      setHasBeenEdited(true);
    },
    onUpdate: ({ editor: ed }) => {
      setHasBeenEdited(true);
      const txt = ed.getText();
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(txt.length);
    },
  });

  // ── Editor Config State ──
  const [activeRibbonTab, setActiveRibbonTab] = useState('Home');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [lineSpacing, setLineSpacing] = useState('1.5');
  const [marginKey, setMarginKey] = useState('Normal');
  const [orientation, setOrientation] = useState('portrait');
  const [paperKey, setPaperKey] = useState('A4');
  const [columns, setColumns] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [showGridlines, setShowGridlines] = useState(false);
  const [showNavPane, setShowNavPane] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [trackChanges, setTrackChanges] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // ── Templates System State ──
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState(null);

  // ── Page Count States ──
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ── Modals ──
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showDocProps, setShowDocProps] = useState(false);
  const [showComments, setShowComments] = useState(false);



  // ── Find & Replace ──
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // ── Comments ──
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');

  // ── Refs ──
  const canvasRef = useRef(null);
  const imageInputRef = useRef(null);
  const docxInputRef = useRef(null);
  const fileMenuRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // ── Sync editor editable state ──
  useEffect(() => {
    if (editor) editor.setEditable(!workspaceIsReadOnly);
  }, [workspaceIsReadOnly, editor]);

  // ── Expose editor to parent for resetForm/openReport ──
  useEffect(() => {
    if (editor && window.__dommunityEditor !== editor) {
      window.__dommunityEditor = editor;
    }
  }, [editor]);

  // ── Callback for dynamic page updates ──
  const handlePageChange = useCallback((cur, tot) => {
    setCurrentPage(cur);
    setTotalPages(tot);
  }, []);

  // ── Sync page flow settings to TipTap PageFlow extension ──
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
        onPageChange: handlePageChange,
      });
    }
  }, [editor, paperKey, orientation, marginKey, headerText, footerText, showHeader, showFooter, handlePageChange]);

  // ── Load template library on mount ──
  useEffect(() => {
    const saved = localStorage.getItem('dommunity_doc_templates');
    if (saved) {
      try {
        setCustomTemplates(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse templates:', e);
      }
    }
    const defId = localStorage.getItem('dommunity_default_template_id');
    if (defId) {
      setDefaultTemplateId(defId);
    }
  }, []);

  // ── Template Selection Handler ──
  const handleSelectTemplate = useCallback((tpl) => {
    if (tpl.paperKey) setPaperKey(tpl.paperKey);
    if (tpl.orientation) setOrientation(tpl.orientation);
    if (tpl.marginKey) setMarginKey(tpl.marginKey);
    if (tpl.lineSpacing) setLineSpacing(tpl.lineSpacing);
    if (tpl.columns) setColumns(tpl.columns || 1);
    setShowHeader(!!tpl.showHeader);
    setShowFooter(!!tpl.showFooter);
    if (tpl.headerText !== undefined) setHeaderText(tpl.headerText);
    if (tpl.footerText !== undefined) setFooterText(tpl.footerText);

    if (editor) {
      if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
      editor.setEditable(true);
      editor.commands.setContent(tpl.html || '<p></p>');
      
      if (tpl.fontFamily) {
        editor.commands.setFontFamily(tpl.fontFamily);
      }
      if (tpl.fontSize) {
        editor.commands.setFontSize(tpl.fontSize);
      }

      editor.chain().focus('start').run();
      
      // Update options immediately inside extension view
      setTimeout(() => {
        if (editor.commands.updatePageFlowOptions) {
          editor.commands.updatePageFlowOptions({
            paperKey: tpl.paperKey || 'A4',
            orientation: tpl.orientation || 'portrait',
            marginKey: tpl.marginKey || 'Normal',
            headerText: tpl.headerText || '',
            footerText: tpl.footerText || '',
            showHeader: !!tpl.showHeader,
            showFooter: !!tpl.showFooter,
          });
        }
        editor.chain().focus('start').run();
      }, 80);
    }
    setShowTemplatesModal(false);
  }, [editor, setWorkspaceIsReadOnly]);

  // ── Load Default Template on Load for new document ──
  useEffect(() => {
    if (editor && !workspaceReportId) {
      const defId = localStorage.getItem('dommunity_default_template_id');
      if (defId) {
        const saved = localStorage.getItem('dommunity_doc_templates');
        let tpls = [];
        if (saved) {
          try { tpls = JSON.parse(saved); } catch (e) {}
        }
        const found = tpls.find(x => x.id === defId);
        if (found) {
          handleSelectTemplate(found);
        } else {
          // Check presets
          const presets = [
            { id: 'preset-blank', paperKey: 'A4', orientation: 'portrait', marginKey: 'Normal', lineSpacing: '1.5', html: '<p></p>', fontFamily: 'Calibri, sans-serif', fontSize: '11px' },
            { id: 'preset-outreach', paperKey: 'A4', orientation: 'portrait', marginKey: 'Normal', lineSpacing: '1.5', fontFamily: 'Arial, sans-serif', fontSize: '12px' },
            { id: 'preset-proposal', paperKey: 'A4', orientation: 'portrait', marginKey: 'Normal', lineSpacing: '1.5', fontFamily: 'Georgia, serif', fontSize: '11px' },
            { id: 'preset-minutes', paperKey: 'Letter', orientation: 'portrait', marginKey: 'Moderate', lineSpacing: '1.15', fontFamily: 'Calibri, sans-serif', fontSize: '11px' },
          ];
          const presetFound = presets.find(x => x.id === defId);
          if (presetFound) {
            // Reconstruct full presets html for loading
            if (presetFound.id === 'preset-outreach') {
              presetFound.html = `
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
              `;
            }
            handleSelectTemplate(presetFound);
          }
        }
      }
    }
  }, [editor, workspaceReportId]);

  // ── Template CRUD actions ──
  const handleSaveAsTemplate = useCallback(() => {
    if (!editor) return;
    const name = window.prompt('Save Current Document as Template — Enter Name:');
    if (!name || !name.trim()) return;

    const currentFont = editor.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif';
    const currentSize = editor.getAttributes('textStyle').fontSize || '11px';

    const newTpl = {
      id: 'tpl-' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      paperKey,
      orientation,
      marginKey,
      lineSpacing,
      columns,
      showHeader,
      showFooter,
      headerText,
      footerText,
      html: editor.getHTML(),
      fontFamily: currentFont,
      fontSize: currentSize,
    };

    setCustomTemplates(prev => {
      const updated = [...prev, newTpl];
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
      return updated;
    });
    alert(`Template "${name}" saved to library successfully!`);
  }, [editor, paperKey, orientation, marginKey, lineSpacing, columns, showHeader, showFooter, headerText, footerText]);

  const handleDeleteTemplate = useCallback((id) => {
    setCustomTemplates(prev => {
      const updated = prev.filter(x => x.id !== id);
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
      return updated;
    });
    if (defaultTemplateId === id) {
      setDefaultTemplateId(null);
      localStorage.removeItem('dommunity_default_template_id');
    }
  }, [defaultTemplateId]);

  const handleRenameTemplate = useCallback((id, newName) => {
    setCustomTemplates(prev => {
      const updated = prev.map(x => x.id === id ? { ...x, name: newName } : x);
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleDuplicateTemplate = useCallback((id) => {
    const target = customTemplates.find(x => x.id === id);
    if (!target) return;
    const cloned = {
      ...target,
      id: 'tpl-' + Math.random().toString(36).substr(2, 9),
      name: `${target.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    setCustomTemplates(prev => {
      const updated = [...prev, cloned];
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
      return updated;
    });
  }, [customTemplates]);

  const handleSetDefaultTemplate = useCallback((id) => {
    if (defaultTemplateId === id) {
      setDefaultTemplateId(null);
      localStorage.removeItem('dommunity_default_template_id');
    } else {
      setDefaultTemplateId(id);
      localStorage.setItem('dommunity_default_template_id', id);
    }
  }, [defaultTemplateId]);
  const handleImportTemplate = useCallback((tplData) => {
    const newTpl = {
      id: 'tpl-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...tplData,
    };
    setCustomTemplates(prev => {
      const updated = [...prev, newTpl];
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
      return updated;
    });
    alert(`Template "${tplData.name}" imported successfully!`);
  }, []);

  // ── Open local .docx — load directly into editor ──
  const handleOpenLocalDocx = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      try {
        const [layout, result] = await Promise.all([
          parseDocxLayout(arrayBuffer),
          mammoth.convertToHtml({ arrayBuffer }, {
            convertImage: mammoth.images.imgElement((image) => {
              return image.readAsBase64String().then((base64String) => {
                return {
                  src: `data:${image.contentType};base64,${base64String}`
                };
              });
            })
          }),
        ]);
        const html = result.value;

        if (editor) {
          // Put the editor in edit mode immediately
          if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
          editor.setEditable(true);

          // Update active document title
          if (setWorkspaceReportTitle) {
            setWorkspaceReportTitle(file.name.replace(/\.[^/.]+$/, ''));
          }

          // Reset report ID so it is loaded as the active new draft
          if (setWorkspaceReportId) {
            setWorkspaceReportId(null);
          }

          const paper = layout?.paperKey || 'A4';
          const orient = layout?.orientation || 'portrait';
          const margin = layout?.marginKey || 'Normal';
          const sHeader = !!layout?.showHeader;
          const sFooter = !!layout?.showFooter;
          const headerTxt = layout?.headerText || '';
          const footerTxt = layout?.footerText || '';

          setPaperKey(paper);
          setOrientation(orient);
          setMarginKey(margin);
          setLineSpacing('1.5');
          setColumns(1);
          setShowHeader(sHeader);
          setShowFooter(sFooter);
          setHeaderText(headerTxt);
          setFooterText(footerTxt);

          editor.commands.setContent(html || '<p></p>');
          editor.chain().focus('start').run();

          setTimeout(() => {
            if (editor.commands.updatePageFlowOptions) {
              editor.commands.updatePageFlowOptions({
                paperKey: paper,
                orientation: orient,
                marginKey: margin,
                lineSpacing: '1.5',
                showHeader: sHeader,
                showFooter: sFooter,
                headerText: headerTxt,
                footerText: footerTxt,
              });
            }
            editor.chain().focus('start').run();
          }, 80);

          setHasBeenEdited(true);
        }
      } catch (err) {
        console.error('Error loading .docx into editor:', err);
        alert('Failed to open the document. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [editor, setWorkspaceIsReadOnly, setWorkspaceReportTitle, setWorkspaceReportId]);

  // ── Save handler wrapper ──
  const handleSave = useCallback(async (status, silent = false) => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === '<p></p>') {
      if (!silent) alert('Please write some content before saving.');
      return;
    }
    await onSave(status, html, silent);
  }, [editor, onSave]);

  // ── AutoSave ──
  useEffect(() => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    if (autoSave && workspaceReportId) {
      autoSaveTimer.current = setInterval(() => {
        handleSave('draft', true);
      }, 30000);
    }
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [autoSave, workspaceReportId, handleSave]);

  // ── Zoom & Keyboard Shortcuts ──
  useEffect(() => {
    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom(z => e.deltaY < 0 ? Math.min(200, z + 10) : Math.max(50, z - 10));
      }
    };
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => Math.min(200, z + 10)); }
        else if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(50, z - 10)); }
        else if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSave('draft'); }
        else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); window.print(); }
        else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setShowFindReplace(true); }
        else if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          if (editor) {
            const prev = editor.getAttributes('link').href;
            const url = window.prompt('Enter URL:', prev || 'https://');
            if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
          }
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, handleSave]);

  // ── Comment handler ──
  const handleAddComment = useCallback(() => {
    if (!commentInput.trim()) return;
    const sel = editor?.state.selection;
    const selectedText = sel ? editor.state.doc.textBetween(sel.from, sel.to) : '';
    setComments(prev => [...prev, {
      id: Date.now(),
      text: commentInput,
      selectedText,
      author: user.name,
      time: new Date().toLocaleTimeString(),
      resolved: false,
      replies: [],
    }]);
    setCommentInput('');
  }, [commentInput, editor, user.name]);

  // ── My reports ──
  const myReports = reportsList.filter(r => r.authorId === user.uid);

  // ── File menu actions ──
  const fileMenuItems = [
    { icon: Plus, l: 'New Document…', fn: () => setShowTemplatesModal(true) },
    { icon: FolderOpen, l: 'Open…', fn: () => docxInputRef.current?.click() },
    { icon: Save, l: 'Save Draft (Ctrl+S)', fn: () => handleSave('draft') },
    { icon: Save, l: 'Save as Template…', fn: () => handleSaveAsTemplate() },
    { icon: Send, l: 'Submit to Admin', fn: () => handleSave('submitted') },
    null,
    { icon: Printer, l: 'Print (Ctrl+P)', fn: () => window.print() },
    { icon: FileDown, l: 'Export as PDF', fn: () => handleExportPDF(canvasRef, workspaceReportTitle || 'Report') },
    { icon: Download, l: 'Export as DOCX', fn: () => handleExportDOCX(editor, workspaceReportTitle || 'Report') },
    { icon: Download, l: 'Export as TXT', fn: () => handleExportTXT(editor, workspaceReportTitle || 'Report') },
    null,
    { icon: RefreshCw, l: autoSave ? 'AutoSave: ON' : 'AutoSave: OFF', fn: () => setAutoSave(a => !a), active: autoSave },
    null,
    { icon: FileText, l: 'Document Properties', fn: () => setShowDocProps(true) },
  ];

  // ── Open report handler ──
  const handleOpenReport = useCallback((rep) => {
    onOpenReport(rep, editor);
    setShowOpenModal(false);
  }, [editor, onOpenReport]);

  const docTitle = workspaceReportTitle || eventsList.find(x => x.id === workspaceReportEventId)?.name || 'Document1';

  return (
    <RichTextProvider editor={editor}>
      <div className="flex flex-col h-full overflow-hidden">

      {/* ── Title Bar ── */}
      <div className="bg-navy-blue text-white flex items-center justify-between px-4 py-1.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-white text-navy-blue rounded w-5 h-5 flex items-center justify-center font-bold text-xs shadow-sm">W</div>
          <span className="text-xs font-semibold text-gray-100 truncate max-w-xs">
            {docTitle} – DommUnity Word
          </span>
          {workspaceIsReadOnly && (
            <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Read-Only</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-300">
          {saveStatus === 'saving' && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Saving…</span>}
          {saveStatus === 'saved' && <span className="flex items-center gap-1 text-green-400"><Check className="w-3 h-3" />Saved</span>}
          {saveStatus === 'error' && <span className="text-red-400">Save failed</span>}
          {autoSave && <span className="text-sig-green font-semibold">AutoSave ON</span>}
        </div>
      </div>

      {/* ── Ribbon Tab Switcher ── */}
      <div className="bg-gray-50 border-b border-gray-200 flex items-center px-2 shrink-0">
        {/* File menu */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="px-3 py-1.5 text-xs font-bold bg-navy-blue text-white rounded-sm mr-1 hover:bg-navy-blue/90 transition cursor-pointer"
          >
            File
          </button>
          <DropdownWrapper open={showFileMenu} onClose={() => setShowFileMenu(false)} triggerRef={fileMenuRef} width={240}>
            <div className="py-1 w-56">
              {fileMenuItems.map((item, i) => {
                if (!item) return <div key={i} className="my-1 border-t border-gray-100" />;
                return (
                  <button
                    key={item.l}
                    onClick={() => { item.fn(); setShowFileMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-blue-50 cursor-pointer transition ${item.active ? 'text-blue-600 font-bold' : ''}`}
                  >
                    <item.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{item.l}</span>
                  </button>
                );
              })}
            </div>
          </DropdownWrapper>
        </div>

        {/* Ribbon tabs */}
        {['Home', 'Insert', 'Layout', 'Review', 'View'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveRibbonTab(tab)}
            className={`px-3 py-1.5 text-xs font-semibold transition cursor-pointer rounded-sm
              ${activeRibbonTab === tab
                ? 'bg-white text-navy-blue border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Ribbon Toolbar Content ── */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 shrink-0 overflow-visible z-30">
        {activeRibbonTab === 'Home' && (
          <RibbonHome editor={editor} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} onOpenFindReplace={() => setShowFindReplace(true)} />
        )}
        {activeRibbonTab === 'Insert' && (
          <RibbonInsert
            editor={editor} imageInputRef={imageInputRef}
            showHeader={showHeader} setShowHeader={setShowHeader}
            showFooter={showFooter} setShowFooter={setShowFooter}
            onOpenComments={() => { setShowComments(true); setActiveRibbonTab('Review'); }}
          />
        )}
        {activeRibbonTab === 'Layout' && (
          <RibbonLayout
            editor={editor}
            marginKey={marginKey} setMarginKey={setMarginKey}
            orientation={orientation} setOrientation={setOrientation}
            paperKey={paperKey} setPaperKey={setPaperKey}
            columns={columns} setColumns={setColumns}
            showLineNumbers={showLineNumbers} setShowLineNumbers={setShowLineNumbers}
            onOpenDocProps={() => setShowDocProps(true)}
          />
        )}
        {activeRibbonTab === 'Review' && (
          <RibbonReview
            editor={editor}
            showComments={showComments} setShowComments={setShowComments}
            trackChanges={trackChanges} setTrackChanges={setTrackChanges}
            onOpenWordCount={() => setShowWordCount(true)}
            workspaceFeedback={workspaceFeedback}
          />
        )}
        {activeRibbonTab === 'View' && (
          <RibbonView
            zoom={zoom} setZoom={setZoom}
            readingMode={readingMode} setReadingMode={setReadingMode}
            showRuler={showRuler} setShowRuler={setShowRuler}
            showGridlines={showGridlines} setShowGridlines={setShowGridlines}
            showNavPane={showNavPane} setShowNavPane={setShowNavPane}
          />
        )}
      </div>

      {/* ── Editor Body ── */}
      <div className="flex flex-1 overflow-hidden">
        <NavigationPane show={showNavPane} editor={editor} />
        <CommentsPanel
          show={showComments} onClose={() => setShowComments(false)}
          comments={comments} setComments={setComments}
          commentInput={commentInput} setCommentInput={setCommentInput}
          onAddComment={handleAddComment}
        />
        <DocumentCanvas
          editor={editor} canvasRef={canvasRef}
          paperKey={paperKey} orientation={orientation} marginKey={marginKey}
          zoom={zoom} lineSpacing={lineSpacing} columns={columns}
          showRuler={showRuler} showGridlines={showGridlines} showLineNumbers={showLineNumbers}
          showHeader={showHeader} headerText={headerText} setHeaderText={setHeaderText}
          showFooter={showFooter} footerText={footerText} setFooterText={setFooterText}
          workspaceIsReadOnly={workspaceIsReadOnly} trackChanges={trackChanges}
          totalPages={totalPages}
          hasBeenEdited={hasBeenEdited}
        />
      </div>

      {/* ── Floating Toolbar ── */}
      <FloatingToolbar editor={editor} />

      {/* ── Status Bar ── */}
      <StatusBar
        wordCount={wordCount} charCount={charCount}
        paperKey={paperKey} orientation={orientation} marginKey={marginKey}
        zoom={zoom} setZoom={setZoom}
        loading={loading} workspaceIsReadOnly={workspaceIsReadOnly}
        onSaveDraft={() => handleSave('draft')}
        onSubmit={() => handleSave('submitted')}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* ── Dialogs ── */}
      <FindReplaceDialog
        show={showFindReplace} onClose={() => setShowFindReplace(false)}
        findText={findText} setFindText={setFindText}
        replaceText={replaceText} setReplaceText={setReplaceText}
        onFind={() => doFind(editor, findText)}
        onReplaceAll={() => doReplaceAll(editor, findText, replaceText)}
      />
      <WordCountDialog
        show={showWordCount} onClose={() => setShowWordCount(false)}
        wordCount={wordCount} charCount={charCount} editor={editor}
      />
      <OpenReportDialog
        show={showOpenModal} onClose={() => setShowOpenModal(false)}
        reports={myReports} eventsList={eventsList}
        onOpen={handleOpenReport} StatusBadge={StatusBadge}
      />
      <DocPropertiesDialog
        show={showDocProps} onClose={() => setShowDocProps(false)}
        workspaceReportAY={workspaceReportAY} setWorkspaceReportAY={setWorkspaceReportAY}
        workspaceReportSem={workspaceReportSem} setWorkspaceReportSem={setWorkspaceReportSem}
        workspaceReportType={workspaceReportType} setWorkspaceReportType={setWorkspaceReportType}
        workspaceReportOrgId={workspaceReportOrgId} setWorkspaceReportOrgId={setWorkspaceReportOrgId}
        workspaceReportBenef={workspaceReportBenef} setWorkspaceReportBenef={setWorkspaceReportBenef}
        workspaceReportEventId={workspaceReportEventId} setWorkspaceReportEventId={setWorkspaceReportEventId}
        workspaceReportTitle={workspaceReportTitle} setWorkspaceReportTitle={setWorkspaceReportTitle}
        workspaceReportDate={workspaceReportDate} setWorkspaceReportDate={setWorkspaceReportDate}
        workspaceReportLocation={workspaceReportLocation} setWorkspaceReportLocation={setWorkspaceReportLocation}
        workspaceIsReadOnly={workspaceIsReadOnly}
        workspaceFeedback={workspaceFeedback}
        linkToEvent={linkToEvent} setLinkToEvent={setLinkToEvent}
        orgsList={orgsList} eventsList={eventsList}
      />
      <TemplatesDialog
        show={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        templates={customTemplates}
        onSelectTemplate={handleSelectTemplate}
        onDeleteTemplate={handleDeleteTemplate}
        onRenameTemplate={handleRenameTemplate}
        onDuplicateTemplate={handleDuplicateTemplate}
        onSetDefaultTemplate={handleSetDefaultTemplate}
        defaultTemplateId={defaultTemplateId}
        onImportTemplate={handleImportTemplate}
      />
      <input
        type="file"
        ref={docxInputRef}
        accept=".docx"
        style={{ display: 'none' }}
        onChange={handleOpenLocalDocx}
      />
      </div>
    </RichTextProvider>
  );
}
