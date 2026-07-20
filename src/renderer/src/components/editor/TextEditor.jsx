// import React, { useState, useRef, useCallback, useEffect } from 'react';
// import { useEditor } from '@tiptap/react';
// import {
//   Plus, FolderOpen, Save, Send, Printer, FileDown, Download, RefreshCw,
//   FileText, Check, X, ChevronDown,
// } from 'lucide-react';
// import { getEditorExtensions } from './extensions';
// import RibbonHome from './ui/RibbonHome';
// import RibbonInsert from './ui/RibbonInsert';
// import RibbonLayout from './ui/RibbonLayout';
// import RibbonReview from './ui/RibbonReview';
// import RibbonView from './ui/RibbonView';
// import FloatingToolbar from './ui/FloatingToolbar';
// import DocumentCanvas from './ui/DocumentCanvas';
// import StatusBar from './ui/StatusBar';
// import CommentsPanel from './ui/CommentsPanel';
// import NavigationPane from './ui/NavigationPane';
// import { FindReplaceDialog, WordCountDialog, OpenReportDialog, DocPropertiesDialog, TemplatesDialog } from './ui/Dialogs';
// import { DropdownWrapper } from './ui/DropdownWrapper';
// import { RichTextProvider } from 'reactjs-tiptap-editor';
// import 'reactjs-tiptap-editor/style.css';
// import mammoth from 'mammoth';
// import JSZip from 'jszip';
// import {
//   handleExportPDF, handleExportDOCX, handleExportTXT,
//   handleFind as doFind, handleReplaceAll as doReplaceAll,
//   parseDocxLayout,
// } from './utils/editorHelpers';
// 
// /**
//  * TextEditor — Complete document editor component.
//  * Integrates all ribbon tabs, document canvas, floating toolbar, and panels.
// export default function TextEditor({
// State passed from parent
//   user,
//   workspaceReportId, setWorkspaceReportId,
//   workspaceReportAY, setWorkspaceReportAY,
//   workspaceReportSem, setWorkspaceReportSem,
//   workspaceReportType, setWorkspaceReportType,
//   workspaceReportEventId, setWorkspaceReportEventId,
//   workspaceReportTitle, setWorkspaceReportTitle,
//   workspaceReportDate, setWorkspaceReportDate,
//   workspaceReportLocation, setWorkspaceReportLocation,
//   workspaceReportBenef, setWorkspaceReportBenef,
//   workspaceReportOrgId, setWorkspaceReportOrgId,
//   workspaceReportPhotos, setWorkspaceReportPhotos,
//   workspaceIsReadOnly, setWorkspaceIsReadOnly,
//   workspaceFeedback,
//   linkToEvent, setLinkToEvent,
//   loading, setLoading,
//   saveStatus, setSaveStatus,
//   autoSave, setAutoSave,
// Data
//   reportsList, orgsList, eventsList,
// Callbacks
//   onSave, onResetForm, onOpenReport, onLoadData,
//   setActiveTab: setParentActiveTab,
// StatusBadge component
//   StatusBadge,
// }) {
//   const [hasBeenEdited, setHasBeenEdited] = useState(false);
// 
// ── Editor ──
//   const editor = useEditor({
//     extensions: getEditorExtensions(),
//     content: '<p></p>',
//     editable: true,
//     editorProps: {
//       attributes: {
//         spellcheck: 'true',
//         class: 'focus:outline-none',
//       },
//     },
//     onCreate: ({ editor: ed }) => {
//       if (ed.getText().trim()) {
//         setHasBeenEdited(true);
//       }
//     },
//     onFocus: () => {
//       setHasBeenEdited(true);
//     },
//     onUpdate: ({ editor: ed }) => {
//       setHasBeenEdited(true);
//       const txt = ed.getText();
//       const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
//       setWordCount(words);
//       setCharCount(txt.length);
//     },
//   });
// 
//   const [activeEditingArea, setActiveEditingArea] = useState('body'); // 'body' | 'header' | 'footer'
// 
//   const headerEditor = useEditor({
//     extensions: getEditorExtensions().filter(ext => ext.name !== 'pageFlow'),
//     content: '<p></p>',
//     editable: true,
//     editorProps: {
//       attributes: {
//         class: 'focus:outline-none text-[10px] text-gray-800 font-sans',
//       },
//     },
//     onUpdate: ({ editor: ed }) => {
//       setHeaderText(ed.getHTML());
//     },
//   });
// 
//   const footerEditor = useEditor({
//     extensions: getEditorExtensions().filter(ext => ext.name !== 'pageFlow'),
//     content: '<p></p>',
//     editable: true,
//     editorProps: {
//       attributes: {
//         class: 'focus:outline-none text-[10px] text-gray-800 font-sans',
//       },
//     },
//     onUpdate: ({ editor: ed }) => {
//       setFooterText(ed.getHTML());
//     },
//   });
// 
// ── Editor Config State ──
//   const [activeRibbonTab, setActiveRibbonTab] = useState('Home');
//   const [showFileMenu, setShowFileMenu] = useState(false);
//   const [lineSpacing, setLineSpacing] = useState('1.5');
//   const [marginKey, setMarginKey] = useState('Normal');
//   const [orientation, setOrientation] = useState('portrait');
//   const [paperKey, setPaperKey] = useState('A4');
//   const [columns, setColumns] = useState(1);
//   const [zoom, setZoom] = useState(100);
//   const [showRuler, setShowRuler] = useState(true);
//   const [showGridlines, setShowGridlines] = useState(false);
//   const [showNavPane, setShowNavPane] = useState(false);
//   const [showLineNumbers, setShowLineNumbers] = useState(false);
//   const [readingMode, setReadingMode] = useState(false);
//   const [showHeader, setShowHeader] = useState(false);
//   const [showFooter, setShowFooter] = useState(false);
//   const [headerText, setHeaderText] = useState('');
//   const [footerText, setFooterText] = useState('');
//   const [trackChanges, setTrackChanges] = useState(false);
//   const [wordCount, setWordCount] = useState(0);
//   const [charCount, setCharCount] = useState(0);
// 
// ── Templates System State ──
//   const [showTemplatesModal, setShowTemplatesModal] = useState(false);
//   const [customTemplates, setCustomTemplates] = useState([]);
//   const [defaultTemplateId, setDefaultTemplateId] = useState(null);
// 
// ── Page Count States ──
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [docxBuffer, setDocxBuffer] = useState(null);
// 
// ── Modals ──
//   const [showFindReplace, setShowFindReplace] = useState(false);
//   const [showWordCount, setShowWordCount] = useState(false);
//   const [showOpenModal, setShowOpenModal] = useState(false);
//   const [showDocProps, setShowDocProps] = useState(false);
//   const [showComments, setShowComments] = useState(false);
// 
// 
// 
// ── Find & Replace ──
//   const [findText, setFindText] = useState('');
//   const [replaceText, setReplaceText] = useState('');
// 
// ── Comments ──
//   const [comments, setComments] = useState([]);
//   const [commentInput, setCommentInput] = useState('');
// 
// ── Refs ──
//   const canvasRef = useRef(null);
//   const imageInputRef = useRef(null);
//   const docxInputRef = useRef(null);
//   const fileMenuRef = useRef(null);
//   const autoSaveTimer = useRef(null);
// 
// ── Sync editor editable state ──
//   useEffect(() => {
//     const isReadOnly = !!workspaceIsReadOnly;
//     if (editor) {
//       editor.setEditable(!isReadOnly && activeEditingArea === 'body');
//     }
//     if (headerEditor) {
//       headerEditor.setEditable(!isReadOnly && activeEditingArea === 'header');
//     }
//     if (footerEditor) {
//       footerEditor.setEditable(!isReadOnly && activeEditingArea === 'footer');
//     }
//   }, [editor, headerEditor, footerEditor, workspaceIsReadOnly, activeEditingArea]);
// 
// ── Expose editor to parent for resetForm/openReport ──
//   useEffect(() => {
//     if (editor && window.__dommunityEditor !== editor) {
//       window.__dommunityEditor = editor;
//     }
//   }, [editor]);
// 
// ── Callback for dynamic page updates ──
//   const handlePageChange = useCallback((cur, tot) => {
//     setCurrentPage(cur);
//     setTotalPages(tot);
//   }, []);
// 
// ── Sync page flow settings to TipTap PageFlow extension ──
//   useEffect(() => {
//     if (editor && !editor.isDestroyed && editor.commands.updatePageFlowOptions) {
//       editor.commands.updatePageFlowOptions({
//         paperKey,
//         orientation,
//         marginKey,
//         headerText,
//         footerText,
//         showHeader,
//         showFooter,
//         onPageChange: handlePageChange,
//       });
//     }
//   }, [editor, paperKey, orientation, marginKey, headerText, footerText, showHeader, showFooter, handlePageChange]);
// 
// ── Load template library on mount ──
//   useEffect(() => {
//     const saved = localStorage.getItem('dommunity_doc_templates');
//     if (saved) {
//       try {
//         setCustomTemplates(JSON.parse(saved));
//       } catch (e) {
//         console.error('Failed to parse templates:', e);
//       }
//     }
//     const defId = localStorage.getItem('dommunity_default_template_id');
//     if (defId) {
//       setDefaultTemplateId(defId);
//     }
//   }, []);
// 
// ── Template Selection Handler ──
//   const handleSelectTemplate = useCallback((tpl) => {
//     if (tpl.paperKey) setPaperKey(tpl.paperKey);
//     if (tpl.orientation) setOrientation(tpl.orientation);
//     if (tpl.marginKey) setMarginKey(tpl.marginKey);
//     if (tpl.lineSpacing) setLineSpacing(tpl.lineSpacing);
//     if (tpl.columns) setColumns(tpl.columns || 1);
//     setShowHeader(!!tpl.showHeader);
//     setShowFooter(!!tpl.showFooter);
//     setDocxBuffer(null);
//     if (tpl.headerText !== undefined) {
//       setHeaderText(tpl.headerText);
//       headerEditor?.commands.setContent(tpl.headerText);
//     } else {
//       setHeaderText('');
//       headerEditor?.commands.setContent('<p></p>');
//     }
//     if (tpl.footerText !== undefined) {
//       setFooterText(tpl.footerText);
//       footerEditor?.commands.setContent(tpl.footerText);
//     } else {
//       setFooterText('');
//       footerEditor?.commands.setContent('<p></p>');
//     }
// 
//     if (editor) {
//       if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
//       editor.setEditable(true);
//       editor.commands.setContent(tpl.html || '<p></p>');
// 
//       if (tpl.fontFamily) {
//         editor.commands.setFontFamily(tpl.fontFamily);
//       }
//       if (tpl.fontSize) {
//         editor.commands.setFontSize(tpl.fontSize);
//       }
// 
//       editor.chain().focus('start').run();
// 
// Update options immediately inside extension view
//       setTimeout(() => {
//         if (editor.commands.updatePageFlowOptions) {
//           editor.commands.updatePageFlowOptions({
//             paperKey: tpl.paperKey || 'A4',
//             orientation: tpl.orientation || 'portrait',
//             marginKey: tpl.marginKey || 'Normal',
//             headerText: tpl.headerText || '',
//             footerText: tpl.footerText || '',
//             showHeader: !!tpl.showHeader,
//             showFooter: !!tpl.showFooter,
//           });
//         }
//         editor.chain().focus('start').run();
//       }, 80);
//     }
//     setShowTemplatesModal(false);
//   }, [editor, headerEditor, footerEditor, setWorkspaceIsReadOnly]);
// 
// ── Load Default Template on Load for new document ──
//   useEffect(() => {
//     if (editor && !workspaceReportId) {
//       const defId = localStorage.getItem('dommunity_default_template_id');
//       if (defId) {
//         const saved = localStorage.getItem('dommunity_doc_templates');
//         let tpls = [];
//         if (saved) {
//           try { tpls = JSON.parse(saved); } catch (e) {}
//         }
//         const found = tpls.find(x => x.id === defId);
//         if (found) {
//           handleSelectTemplate(found);
//         } else {
// Check presets
//           const presets = [
//             { id: 'preset-blank', paperKey: 'A4', orientation: 'portrait', marginKey: 'Normal', lineSpacing: '1.5', html: '<p></p>', fontFamily: 'Calibri, sans-serif', fontSize: '11px' },
//             { id: 'preset-outreach', paperKey: 'A4', orientation: 'portrait', marginKey: 'Normal', lineSpacing: '1.5', fontFamily: 'Arial, sans-serif', fontSize: '12px' },
//             { id: 'preset-proposal', paperKey: 'A4', orientation: 'portrait', marginKey: 'Normal', lineSpacing: '1.5', fontFamily: 'Georgia, serif', fontSize: '11px' },
//             { id: 'preset-minutes', paperKey: 'Letter', orientation: 'portrait', marginKey: 'Moderate', lineSpacing: '1.15', fontFamily: 'Calibri, sans-serif', fontSize: '11px' },
//           ];
//           const presetFound = presets.find(x => x.id === defId);
//           if (presetFound) {
// Reconstruct full presets html for loading
//             if (presetFound.id === 'preset-outreach') {
//               presetFound.html = `
//                 <h1 style="text-align: center;">COMMUNITY OUTREACH PROJECT REPORT</h1>
//                 <p style="text-align: center; font-style: italic; color: #6b7280;">DommUnity Community Extension Services (CES) Office</p>
//                 <hr />
//                 <table style="width: 100%; border-collapse: collapse;">
//                   <tbody>
//                     <tr>
//                       <td style="width: 50%; font-weight: bold; background-color: #f3f4f6; padding: 6px;">Activity Title:</td>
//                       <td style="width: 50%; padding: 6px;">[Enter Activity Name]</td>
//                     </tr>
//                     <tr>
//                       <td style="font-weight: bold; background-color: #f3f4f6; padding: 6px;">Date & Location:</td>
//                       <td style="padding: 6px;">[Enter Date] @ [Enter Venue]</td>
//                     </tr>
//                     <tr>
//                       <td style="font-weight: bold; background-color: #f3f4f6; padding: 6px;">Beneficiaries:</td>
//                       <td style="padding: 6px;">[Number and description of beneficiaries]</td>
//                     </tr>
//                   </tbody>
//                 </table>
//                 <p></p>
//                 <h2>1. Executive Summary</h2>
//                 <p>Provide a brief description of the community outreach activity. Highlight the goal, organizers, collaborator organizations, and immediate achievements of the program.</p>
//                 <p></p>
//                 <h2>2. Project Objectives</h2>
//                 <p>State the specific objective criteria of the community extension activity:</p>
//                 <ul>
//                   <li>Objective 1: To address core community concerns and program actions...</li>
//                   <li>Objective 2: To promote collaborative volunteering...</li>
//                 </ul>
//                 <p></p>
//                 <h2>3. Narrative Report & Chronology</h2>
//                 <p>Detail the step-by-step description of the execution of the project. Mention the preparation stages, resource collection, actual project operations, and community participation highlights.</p>
//                 <p></p>
//                 <h2>4. Key Outcomes & Recommendations</h2>
//                 <p>Detail what went well and outline areas of recommendation for CES programs in the future.</p>
//               `;
//             }
//             handleSelectTemplate(presetFound);
//           }
//         }
//       }
//     }
//   }, [editor, workspaceReportId, handleSelectTemplate]);
// 
// ── Template CRUD actions ──
//   const handleSaveAsTemplate = useCallback(() => {
//     if (!editor) return;
//     const name = window.prompt('Save Current Document as Template — Enter Name:');
//     if (!name || !name.trim()) return;
// 
//     const currentFont = editor.getAttributes('textStyle').fontFamily || 'Calibri, sans-serif';
//     const currentSize = editor.getAttributes('textStyle').fontSize || '11px';
// 
//     const newTpl = {
//       id: 'tpl-' + Math.random().toString(36).substr(2, 9),
//       name: name.trim(),
//       createdAt: new Date().toISOString(),
//       paperKey,
//       orientation,
//       marginKey,
//       lineSpacing,
//       columns,
//       showHeader,
//       showFooter,
//       headerText,
//       footerText,
//       html: docxBuffer ? (document.querySelector('.docx-editor-container')?.innerHTML || '') : editor.getHTML(),
//       fontFamily: currentFont,
//       fontSize: currentSize,
//     };
// 
//     setCustomTemplates(prev => {
//       const updated = [...prev, newTpl];
//       localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
//       return updated;
//     });
//     alert(`Template "${name}" saved to library successfully!`);
//   }, [editor, paperKey, orientation, marginKey, lineSpacing, columns, showHeader, showFooter, headerText, footerText]);
// 
//   const handleDeleteTemplate = useCallback((id) => {
//     setCustomTemplates(prev => {
//       const updated = prev.filter(x => x.id !== id);
//       localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
//       return updated;
//     });
//     if (defaultTemplateId === id) {
//       setDefaultTemplateId(null);
//       localStorage.removeItem('dommunity_default_template_id');
//     }
//   }, [defaultTemplateId]);
// 
//   const handleRenameTemplate = useCallback((id, newName) => {
//     setCustomTemplates(prev => {
//       const updated = prev.map(x => x.id === id ? { ...x, name: newName } : x);
//       localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
//       return updated;
//     });
//   }, []);
// 
//   const handleDuplicateTemplate = useCallback((id) => {
//     const target = customTemplates.find(x => x.id === id);
//     if (!target) return;
//     const cloned = {
//       ...target,
//       id: 'tpl-' + Math.random().toString(36).substr(2, 9),
//       name: `${target.name} (Copy)`,
//       createdAt: new Date().toISOString(),
//     };
//     setCustomTemplates(prev => {
//       const updated = [...prev, cloned];
//       localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
//       return updated;
//     });
//   }, [customTemplates]);
// 
//   const handleSetDefaultTemplate = useCallback((id) => {
//     if (defaultTemplateId === id) {
//       setDefaultTemplateId(null);
//       localStorage.removeItem('dommunity_default_template_id');
//     } else {
//       setDefaultTemplateId(id);
//       localStorage.setItem('dommunity_default_template_id', id);
//     }
//   }, [defaultTemplateId]);
//   const handleImportTemplate = useCallback((tplData) => {
//     const newTpl = {
//       id: 'tpl-' + Math.random().toString(36).substr(2, 9),
//       createdAt: new Date().toISOString(),
//       ...tplData,
//     };
//     setCustomTemplates(prev => {
//       const updated = [...prev, newTpl];
//       localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
//       return updated;
//     });
//     alert(`Template "${tplData.name}" imported successfully!`);
//   }, []);
// 
// ── Open local .docx — load directly into editor ──
//   const handleOpenLocalDocx = useCallback((e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
// 
//     const reader = new FileReader();
//     reader.onload = async (event) => {
//       const arrayBuffer = event.target.result;
//       try {
//         const [layout, result] = await Promise.all([
//           parseDocxLayout(arrayBuffer),
//           mammoth.convertToHtml({ arrayBuffer }, {
//             convertImage: mammoth.images.imgElement((image) => {
//               return image.readAsBase64String().then((base64String) => {
//                 return {
//                   src: `data:${image.contentType};base64,${base64String}`
//                 };
//               });
//             })
//           }),
//         ]);
//         const html = result.value;
// 
//         if (editor) {
// Put the editor in edit mode immediately
//           if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
//           editor.setEditable(true);
// 
// Update active document title
//           if (setWorkspaceReportTitle) {
//             setWorkspaceReportTitle(file.name.replace(/\.[^/.]+$/, ''));
//           }
// 
// Reset report ID so it is loaded as the active new draft
//           if (setWorkspaceReportId) {
//             setWorkspaceReportId(null);
//           }
// 
//           const paper = layout?.paperKey || 'A4';
//           const orient = layout?.orientation || 'portrait';
//           const margin = layout?.marginKey || 'Normal';
//           const sHeader = !!layout?.showHeader;
//           const sFooter = !!layout?.showFooter;
//           const headerTxt = layout?.headerText || '';
//           const footerTxt = layout?.footerText || '';
// 
//           setPaperKey(paper);
//           setOrientation(orient);
//           setMarginKey(margin);
//           setLineSpacing('1.5');
//           setColumns(1);
//           setDocxBuffer(arrayBuffer);
//           setHasBeenEdited(true);
//         }
//       } catch (err) {
//         console.error('Error loading .docx into editor:', err);
//         alert('Failed to open the document. Please check the file format.');
//       }
//     };
//     reader.readAsArrayBuffer(file);
//     e.target.value = '';
//   }, [editor, headerEditor, footerEditor, setWorkspaceIsReadOnly, setWorkspaceReportTitle, setWorkspaceReportId]);
// 
// ── Save handler wrapper ──
//   const handleSave = useCallback(async (status, silent = false) => {
//     if (!editor) return;
//     let html = '';
//     if (docxBuffer) {
//       const container = document.querySelector('.docx-editor-container');
//       html = container ? container.innerHTML : '';
//     } else {
//       html = editor.getHTML();
//     }
//     if (!html || html === '<p></p>') {
//       if (!silent) alert('Please write some content before saving.');
//       return;
//     }
//     await onSave(status, html, silent);
//   }, [editor, docxBuffer, onSave]);
// 
// ── AutoSave ──
//   useEffect(() => {
//     if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
//     if (autoSave && workspaceReportId) {
//       autoSaveTimer.current = setInterval(() => {
//         handleSave('draft', true);
//       }, 30000);
//     }
//     return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
//   }, [autoSave, workspaceReportId, handleSave]);
// 
// ── Zoom & Keyboard Shortcuts ──
//   useEffect(() => {
//     const handleWheel = (e) => {
//       if (e.ctrlKey) {
//         e.preventDefault();
//         setZoom(z => e.deltaY < 0 ? Math.min(200, z + 10) : Math.max(50, z - 10));
//       }
//     };
//     const handleKeyDown = (e) => {
//       if (e.ctrlKey) {
//         if (e.key === '=' || e.key === '+') { e.preventDefault(); setZoom(z => Math.min(200, z + 10)); }
//         else if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(50, z - 10)); }
//         else if (e.key === 's' || e.key === 'S') { e.preventDefault(); handleSave('draft'); }
//         else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); window.print(); }
//         else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setShowFindReplace(true); }
//         else if (e.key === 'k' || e.key === 'K') {
//           e.preventDefault();
//           if (editor) {
//             const prev = editor.getAttributes('link').href;
//             const url = window.prompt('Enter URL:', prev || 'https://');
//             if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
//           }
//         }
//       }
//     };
//     window.addEventListener('wheel', handleWheel, { passive: false });
//     window.addEventListener('keydown', handleKeyDown);
//     return () => {
//       window.removeEventListener('wheel', handleWheel);
//       window.removeEventListener('keydown', handleKeyDown);
//     };
//   }, [editor, handleSave]);
// 
// ── Comment handler ──
//   const handleAddComment = useCallback(() => {
//     if (!commentInput.trim()) return;
//     const sel = editor?.state.selection;
//     const selectedText = sel ? editor.state.doc.textBetween(sel.from, sel.to) : '';
//     setComments(prev => [...prev, {
//       id: Date.now(),
//       text: commentInput,
//       selectedText,
//       author: user.name,
//       time: new Date().toLocaleTimeString(),
//       resolved: false,
//       replies: [],
//     }]);
//     setCommentInput('');
//   }, [commentInput, editor, user.name]);
// 
// ── My reports ──
//   const myReports = reportsList.filter(r => r.authorId === user.uid);
// 
// ── File menu actions ──
//   const fileMenuItems = [
//     { icon: Plus, l: 'New Document…', fn: () => setShowTemplatesModal(true) },
//     { icon: FolderOpen, l: 'Open…', fn: () => docxInputRef.current?.click() },
//     { icon: Save, l: 'Save Draft (Ctrl+S)', fn: () => handleSave('draft') },
//     { icon: Save, l: 'Save as Template…', fn: () => handleSaveAsTemplate() },
//     { icon: Send, l: 'Submit to Admin', fn: () => handleSave('submitted') },
//     null,
//     { icon: Printer, l: 'Print (Ctrl+P)', fn: () => window.print() },
//     { icon: FileDown, l: 'Export as PDF', fn: () => handleExportPDF(canvasRef, workspaceReportTitle || 'Report') },
//     { icon: Download, l: 'Export as DOCX', fn: () => handleExportDOCX(editor, workspaceReportTitle || 'Report') },
//     { icon: Download, l: 'Export as TXT', fn: () => handleExportTXT(editor, workspaceReportTitle || 'Report') },
//     null,
//     { icon: RefreshCw, l: autoSave ? 'AutoSave: ON' : 'AutoSave: OFF', fn: () => setAutoSave(a => !a), active: autoSave },
//     null,
//     { icon: FileText, l: 'Document Properties', fn: () => setShowDocProps(true) },
//   ];
// 
// ── Open report handler ──
//   const handleOpenReport = useCallback((rep) => {
//     onOpenReport(rep, editor);
//     setShowOpenModal(false);
//   }, [editor, onOpenReport]);
// 
//   const activeEditor = (activeEditingArea === 'header' && headerEditor)
//     ? headerEditor
//     : (activeEditingArea === 'footer' && footerEditor)
//       ? footerEditor
//       : editor;
// 
//   const docTitle = workspaceReportTitle || eventsList.find(x => x.id === workspaceReportEventId)?.name || 'Document1';
// 
//   return (
//     <RichTextProvider editor={editor}>
//       <div className="flex flex-col h-full overflow-hidden">
// 
//       {/* ── Title Bar ── */}
//       <div className="bg-navy-blue text-white flex items-center justify-between px-4 py-1.5 shrink-0">
//         <div className="flex items-center gap-2.5">
//           <div className="bg-white text-navy-blue rounded w-5 h-5 flex items-center justify-center font-bold text-xs shadow-sm">W</div>
//           <span className="text-xs font-semibold text-gray-100 truncate max-w-xs">
//             {docTitle} – DommUnity Word
//           </span>
//           {workspaceIsReadOnly && (
//             <span className="text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Read-Only</span>
//           )}
//         </div>
//         <div className="flex items-center gap-3 text-[10px] text-gray-300">
//           {saveStatus === 'saving' && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />Saving…</span>}
//           {saveStatus === 'saved' && <span className="flex items-center gap-1 text-green-400"><Check className="w-3 h-3" />Saved</span>}
//           {saveStatus === 'error' && <span className="text-red-400">Save failed</span>}
//           {autoSave && <span className="text-sig-green font-semibold">AutoSave ON</span>}
//         </div>
//       </div>
// 
//       {/* ── Ribbon Tab Switcher ── */}
//       <div className="bg-gray-50 border-b border-gray-200 flex items-center px-2 shrink-0">
//         {/* File menu */}
//         <div className="relative" ref={fileMenuRef}>
//           <button
//             onClick={() => setShowFileMenu(!showFileMenu)}
//             className="px-3 py-1.5 text-xs font-bold bg-navy-blue text-white rounded-sm mr-1 hover:bg-navy-blue/90 transition cursor-pointer"
//           >
//             File
//           </button>
//           <DropdownWrapper open={showFileMenu} onClose={() => setShowFileMenu(false)} triggerRef={fileMenuRef} width={240}>
//             <div className="py-1 w-56">
//               {fileMenuItems.map((item, i) => {
//                 if (!item) return <div key={i} className="my-1 border-t border-gray-100" />;
//                 return (
//                   <button
//                     key={item.l}
//                     onClick={() => { item.fn(); setShowFileMenu(false); }}
//                     className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-blue-50 cursor-pointer transition ${item.active ? 'text-blue-600 font-bold' : ''}`}
//                   >
//                     <item.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
//                     <span>{item.l}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </DropdownWrapper>
//         </div>
// 
//         {/* Ribbon tabs */}
//         {['Home', 'Insert', 'Layout', 'Review', 'View'].map(tab => (
//           <button
//             key={tab}
//             onClick={() => setActiveRibbonTab(tab)}
//             className={`px-3 py-1.5 text-xs font-semibold transition cursor-pointer rounded-sm
//               ${activeRibbonTab === tab
//                 ? 'bg-white text-navy-blue border-b-2 border-blue-600 shadow-sm'
//                 : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
//           >
//             {tab}
//           </button>
//         ))}
//       </div>
// 
//       {/* ── Ribbon Toolbar Content ── */}
//       <div className="bg-white border-b border-gray-200 px-3 py-2 shrink-0 overflow-visible z-30">
//         {activeRibbonTab === 'Home' && (
//           <RibbonHome editor={activeEditor} lineSpacing={lineSpacing} setLineSpacing={setLineSpacing} onOpenFindReplace={() => setShowFindReplace(true)} />
//         )}
//         {activeRibbonTab === 'Insert' && (
//           <RibbonInsert
//             editor={activeEditor} imageInputRef={imageInputRef}
//             showHeader={showHeader} setShowHeader={setShowHeader}
//             showFooter={showFooter} setShowFooter={setShowFooter}
//             onOpenComments={() => { setShowComments(true); setActiveRibbonTab('Review'); }}
//           />
//         )}
//         {activeRibbonTab === 'Layout' && (
//           <RibbonLayout
//             editor={activeEditor}
//             marginKey={marginKey} setMarginKey={setMarginKey}
//             orientation={orientation} setOrientation={setOrientation}
//             paperKey={paperKey} setPaperKey={setPaperKey}
//             columns={columns} setColumns={setColumns}
//             showLineNumbers={showLineNumbers} setShowLineNumbers={setShowLineNumbers}
//             onOpenDocProps={() => setShowDocProps(true)}
//           />
//         )}
//         {activeRibbonTab === 'Review' && (
//           <RibbonReview
//             editor={activeEditor}
//             showComments={showComments} setShowComments={setShowComments}
//             trackChanges={trackChanges} setTrackChanges={setTrackChanges}
//             onOpenWordCount={() => setShowWordCount(true)}
//             workspaceFeedback={workspaceFeedback}
//           />
//         )}
//         {activeRibbonTab === 'View' && (
//           <RibbonView
//             zoom={zoom} setZoom={setZoom}
//             readingMode={readingMode} setReadingMode={setReadingMode}
//             showRuler={showRuler} setShowRuler={setShowRuler}
//             showGridlines={showGridlines} setShowGridlines={setShowGridlines}
//             showNavPane={showNavPane} setShowNavPane={setShowNavPane}
//           />
//         )}
//       </div>
// 
//       {/* ── Editor Body ── */}
//       <div className="flex flex-1 overflow-hidden">
//         <NavigationPane show={showNavPane} editor={activeEditor} />
//         <CommentsPanel
//           show={showComments} onClose={() => setShowComments(false)}
//           comments={comments} setComments={setComments}
//           commentInput={commentInput} setCommentInput={setCommentInput}
//           onAddComment={handleAddComment}
//         />
//         <DocumentCanvas
//           editor={editor} canvasRef={canvasRef}
//           paperKey={paperKey} orientation={orientation} marginKey={marginKey}
//           zoom={zoom} lineSpacing={lineSpacing} columns={columns}
//           showRuler={showRuler} showGridlines={showGridlines} showLineNumbers={showLineNumbers}
//           showHeader={showHeader} headerText={headerText} setHeaderText={setHeaderText}
//           showFooter={showFooter} footerText={footerText} setFooterText={setFooterText}
//           workspaceIsReadOnly={workspaceIsReadOnly} trackChanges={trackChanges}
//           totalPages={totalPages}
//           hasBeenEdited={hasBeenEdited}
//           activeEditingArea={activeEditingArea}
//           setActiveEditingArea={setActiveEditingArea}
//           headerEditor={headerEditor}
//           footerEditor={footerEditor}
//           docxBuffer={docxBuffer}
//           setDocxBuffer={setDocxBuffer}
//           setTotalPages={setTotalPages}
//           setCurrentPage={setCurrentPage}
//           setWordCount={setWordCount}
//           setCharCount={setCharCount}
//         />
//       </div>
// 
//       {/* ── Floating Toolbar ── */}
//       <FloatingToolbar editor={activeEditor} />
// 
//       {/* ── Status Bar ── */}
//       <StatusBar
//         wordCount={wordCount} charCount={charCount}
//         paperKey={paperKey} orientation={orientation} marginKey={marginKey}
//         zoom={zoom} setZoom={setZoom}
//         loading={loading} workspaceIsReadOnly={workspaceIsReadOnly}
//         onSaveDraft={() => handleSave('draft')}
//         onSubmit={() => handleSave('submitted')}
//         currentPage={currentPage}
//         totalPages={totalPages}
//       />
// 
//       {/* ── Dialogs ── */}
//       <FindReplaceDialog
//         show={showFindReplace} onClose={() => setShowFindReplace(false)}
//         findText={findText} setFindText={setFindText}
//         replaceText={replaceText} setReplaceText={setReplaceText}
//         onFind={() => doFind(editor, findText)}
//         onReplaceAll={() => doReplaceAll(editor, findText, replaceText)}
//       />
//       <WordCountDialog
//         show={showWordCount} onClose={() => setShowWordCount(false)}
//         wordCount={wordCount} charCount={charCount} editor={editor}
//       />
//       <OpenReportDialog
//         show={showOpenModal} onClose={() => setShowOpenModal(false)}
//         reports={myReports} eventsList={eventsList}
//         onOpen={handleOpenReport} StatusBadge={StatusBadge}
//       />
//       <DocPropertiesDialog
//         show={showDocProps} onClose={() => setShowDocProps(false)}
//         workspaceReportAY={workspaceReportAY} setWorkspaceReportAY={setWorkspaceReportAY}
//         workspaceReportSem={workspaceReportSem} setWorkspaceReportSem={setWorkspaceReportSem}
//         workspaceReportType={workspaceReportType} setWorkspaceReportType={setWorkspaceReportType}
//         workspaceReportOrgId={workspaceReportOrgId} setWorkspaceReportOrgId={setWorkspaceReportOrgId}
//         workspaceReportBenef={workspaceReportBenef} setWorkspaceReportBenef={setWorkspaceReportBenef}
//         workspaceReportEventId={workspaceReportEventId} setWorkspaceReportEventId={setWorkspaceReportEventId}
//         workspaceReportTitle={workspaceReportTitle} setWorkspaceReportTitle={setWorkspaceReportTitle}
//         workspaceReportDate={workspaceReportDate} setWorkspaceReportDate={setWorkspaceReportDate}
//         workspaceReportLocation={workspaceReportLocation} setWorkspaceReportLocation={setWorkspaceReportLocation}
//         workspaceIsReadOnly={workspaceIsReadOnly}
//         workspaceFeedback={workspaceFeedback}
//         linkToEvent={linkToEvent} setLinkToEvent={setLinkToEvent}
//         orgsList={orgsList} eventsList={eventsList}
//       />
//       <TemplatesDialog
//         show={showTemplatesModal}
//         onClose={() => setShowTemplatesModal(false)}
//         templates={customTemplates}
//         onSelectTemplate={handleSelectTemplate}
//         onDeleteTemplate={handleDeleteTemplate}
//         onRenameTemplate={handleRenameTemplate}
//         onDuplicateTemplate={handleDuplicateTemplate}
//         onSetDefaultTemplate={handleSetDefaultTemplate}
//         defaultTemplateId={defaultTemplateId}
//         onImportTemplate={handleImportTemplate}
//       />
//       <input
//         type="file"
//         ref={docxInputRef}
//         accept=".docx"
//         style={{ display: 'none' }}
//         onChange={handleOpenLocalDocx}
//       />
//       </div>
//     </RichTextProvider>
//   );
// }
// 
// ─────────────────────────────────────────────────────────────────────────────
// ── NEW IMPLEMENTATION: RICH GOOGLE DOCS STYLE EDITOR ──────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

// ── NEW IMPLEMENTATION: RICH GOOGLE DOCS STYLE EDITOR ──────────────────────────
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { TaskItem } from '@tiptap/extension-task-item';
import { TaskList } from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import ImageResize from 'tiptap-extension-resize-image';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDFJS worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

import logoImg from '../../assets/logo.png';
import logo2Img from '../../assets/logo2.png';

import {
  Plus, FolderOpen, Save, Send, Printer, FileDown, Download, RefreshCw,
  FileText, Check, X, ChevronDown, ZoomIn, ZoomOut
} from 'lucide-react';

import { useEditorStore } from './store/useEditorStore';
import { FontSizeExtension } from './extensions/fontSize';
import { LineHeightExtension } from './extensions/lineHeight';
import { Toolbar } from './ui/Toolbar';
import { Ruler } from './ui/Ruler';
import StatusBar from './ui/StatusBar';
import { DropdownWrapper } from './ui/DropdownWrapper';
import { DocPropertiesDialog } from './ui/Dialogs';
import { handleExportPDF, handleExportDOCX, handleExportTXT, docxToHtml, parseDocxLayout } from './utils/editorHelpers';
import DocumentCanvas from './ui/DocumentCanvas';
import PageFlow from './extensions/PageFlow';
import PageBreak from './extensions/PageBreak';
import FloatingImage from './extensions/FloatingImage';
import FloatingTextBox from './extensions/FloatingTextBox';
import FloatingToolbar from './ui/FloatingToolbar';
import { cn } from './utils/cn';

export default function TextEditor({
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
  reportsList, orgsList, eventsList,
  onSave, onResetForm, onOpenReport, onLoadData,
  setActiveTab,
  StatusBadge,
}) {
  const [customTemplates, setCustomTemplates] = useState([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState(null);
  const [showDocProps, setShowDocProps] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // -- Pagination & Header/Footer States --
  const [activeEditingArea, setActiveEditingArea] = useState('body'); // 'body' | 'header' | 'footer'
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isTemplateActive, setIsTemplateActive] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [docxBuffer, setDocxBuffer] = useState(null);
  const [paperKey, setPaperKey] = useState('Letter');
  const [orientation, setOrientation] = useState('portrait');
  const [marginKey, setMarginKey] = useState('Normal');

  const fileMenuRef = useRef(null);
  const templatesMenuRef = useRef(null);
  const docxInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const templateInputRef = useRef(null);
  const canvasRef = useRef(null);
  const autoSaveTimer = useRef(null);
  const lastLoadedReportIdRef = useRef(null);

  const leftMargin = useEditorStore((state) => state.leftMargin);
  const rightMargin = useEditorStore((state) => state.rightMargin);
  const setEditor = useEditorStore((state) => state.setEditor);

  // ── Editor Instance ──
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
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' }),
      Highlight.configure({ multicolor: true }),
      FloatingImage,
      FloatingTextBox,
      Table.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
      TaskItem.configure({ nested: true }),
      TaskList,
      PageFlow,
      PageBreak,
    ],
    content: '<p></p>',
    editable: !workspaceIsReadOnly && activeEditingArea === 'body',
    onUpdate: ({ editor: ed }) => {
      const txt = ed.getText();
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      setWordCount(words);
      setCharCount(txt.length);
    },
  });

  // ── Header/Footer Editors ──
  const headerEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      Table.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
    ],
    content: '<p></p>',
    editable: !workspaceIsReadOnly && activeEditingArea === 'header',
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-[10px] text-gray-800 font-sans',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (ed.isFocused) {
        setHeaderText(ed.getHTML());
      }
    },
  });

  const footerEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Color,
      TextStyle,
      FontFamily,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image,
      Table.configure({ resizable: true }),
      TableCell,
      TableHeader,
      TableRow,
    ],
    content: '<p></p>',
    editable: !workspaceIsReadOnly && activeEditingArea === 'footer',
    editorProps: {
      attributes: {
        class: 'focus:outline-none text-[10px] text-gray-800 font-sans',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (ed.isFocused) {
        setFooterText(ed.getHTML());
      }
    },
  });

  // ── Sync Editable State ──
  useEffect(() => {
    const isReadOnly = !!workspaceIsReadOnly;
    if (editor) {
      editor.setEditable(!isReadOnly && activeEditingArea === 'body');
    }
    if (headerEditor) {
      headerEditor.setEditable(!isReadOnly && activeEditingArea === 'header');
    }
    if (footerEditor) {
      footerEditor.setEditable(!isReadOnly && activeEditingArea === 'footer');
    }
  }, [editor, headerEditor, footerEditor, workspaceIsReadOnly, activeEditingArea]);

  // ── Sync margins to ProseMirror DOM styles dynamically ──
  useEffect(() => {
    if (editor) {
      const pmNode = editor.view.dom;
      if (pmNode) {
        pmNode.style.paddingLeft = `${leftMargin}px`;
        pmNode.style.paddingRight = `${rightMargin}px`;
      }
    }
  }, [editor, leftMargin, rightMargin]);

  // ── Sync page flow settings to TipTap PageFlow extension ──
  const handlePageChange = useCallback((cur, tot) => {
    setCurrentPage(cur);
    setTotalPages(tot);
  }, []);

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
        onPageChange: handlePageChange,
      });
    }
  }, [editor, paperKey, orientation, marginKey, headerText, footerText, showHeader, showFooter, isTemplateActive, handlePageChange]);

  // ── Register editor globally ──
  useEffect(() => {
    if (editor) {
      setEditor(editor);
      window.__dommunityEditor = editor;
    }
    return () => {
      setEditor(null);
      window.__dommunityEditor = null;
    };
  }, [editor, setEditor]);

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

  // ── Built-in System Templates ──
  const systemTemplates = [
    {
      id: 'system-dct-narrative',
      name: 'DCT CES Narrative Report',
      description: 'Official multi-page narrative report template with Dominican College of Tarlac styling',
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
<table style="width:100%;border-collapse:collapse;border:1px solid #000;font-family:'Times New Roman',serif;background-color:#ffffff !important;">
  <tbody>
    <tr>
      <td style="width:50%;font-weight:bold;border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;">Program:</td>
      <td style="width:50%;border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;"> </td>
    </tr>
    <tr>
      <td style="font-weight:bold;border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;">Volunteer/s:</td>
      <td style="border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;"> </td>
    </tr>
    <tr>
      <td style="font-weight:bold;border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;">Venue:</td>
      <td style="border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;"> </td>
    </tr>
    <tr>
      <td style="font-weight:bold;border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;">Beneficiaries:</td>
      <td style="border:1px solid #000;padding:10px 12px;font-size:20pt;font-family:'Times New Roman',serif;vertical-align:middle;background-color:#ffffff !important;color:#000;"> </td>
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
  ];

  // ── Template Selection Handler ──
  const handleSelectTemplate = useCallback((tpl) => {
    if (editor) {
      if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
      editor.setEditable(true);
      editor.commands.setContent(tpl.html || '<p></p>');
      editor.chain().focus('start').run();

      // Mark whether this is a built-in system template
      const isSystem = !!(tpl.id && tpl.id.startsWith('system-'));
      setIsTemplateActive(isSystem);
      setActiveTemplateId(isSystem ? tpl.id : null);

      if (tpl.headerText !== undefined && tpl.headerText) {
        setHeaderText(tpl.headerText);
        headerEditor?.commands.setContent(tpl.headerText);
        setShowHeader(true);
      } else {
        setHeaderText('');
        headerEditor?.commands.setContent('<p></p>');
      }

      if (tpl.footerText !== undefined && tpl.footerText) {
        setFooterText(tpl.footerText);
        footerEditor?.commands.setContent(tpl.footerText);
        setShowFooter(true);
      } else {
        setFooterText('');
        footerEditor?.commands.setContent('<p></p>');
      }

      const pKey = tpl.paperKey || 'Letter';
      const orient = tpl.orientation || 'portrait';
      const mKey = tpl.marginKey || 'Normal';
      setPaperKey(pKey);
      setOrientation(orient);
      setMarginKey(mKey);

      editor.commands.updatePageFlowOptions({
        paperKey: pKey,
        orientation: orient,
        marginKey: mKey,
        showHeader: tpl.showHeader !== undefined ? tpl.showHeader : true,
        showFooter: tpl.showFooter !== undefined ? tpl.showFooter : true,
        headerText: tpl.headerText || '',
        footerText: tpl.footerText || '',
        isTemplateActive: isSystem,
      });

      if (setWorkspaceReportTitle) {
        setWorkspaceReportTitle(tpl.name || 'Untitled');
      }
      if (setWorkspaceReportId) {
        setWorkspaceReportId(null);
      }

      setActiveEditingArea('body');
    }
    setShowTemplatesMenu(false);
  }, [editor, headerEditor, footerEditor, setWorkspaceIsReadOnly, setWorkspaceReportTitle, setWorkspaceReportId, setPaperKey, setOrientation, setMarginKey, setIsTemplateActive, setActiveTemplateId]);

  // ── Load Default Template on mount for new docs ──
  useEffect(() => {
    if (editor && !workspaceReportId) {
      const defId = localStorage.getItem('dommunity_default_template_id');
      if (defId) {
        const saved = localStorage.getItem('dommunity_doc_templates');
        let tpls = [];
        if (saved) {
          try { tpls = JSON.parse(saved); } catch (e) { }
        }
        const found = tpls.find(x => x.id === defId);
        if (found) {
          handleSelectTemplate(found);
        }
      }
    }
  }, [editor, workspaceReportId, handleSelectTemplate]);

  // ── Load Report Layout configurations when workspaceReportId changes ──
  useEffect(() => {
    if (workspaceReportId && reportsList) {
      if (lastLoadedReportIdRef.current !== workspaceReportId) {
        const rep = reportsList.find((r) => r.id === workspaceReportId);
        if (rep) {
          const defaultHeader = `<table style="width:100%;border-collapse:collapse;border:none;margin:0;padding:0;font-family:'Times New Roman',serif;table-layout:fixed;"><tbody><tr><td style="width:0.85in;vertical-align:middle;border:none;padding:0;text-align:left;"><img src="${logo2Img}" style="height:0.85in;width:0.85in;object-fit:contain;display:block;" /></td><td style="width:1.1in;vertical-align:middle;border:none;padding:0 0.15in 0 0.1in;text-align:left;"><img src="${logoImg}" style="height:0.85in;width:0.85in;object-fit:contain;display:block;" /></td><td style="width:4.55in;text-align:left;vertical-align:middle;border:none;border-left:2px solid #555;padding:0 0 0 0.15in;line-height:1.25;"><div style="font-family:'Book Antiqua','Palatino',serif;font-size:14pt;font-weight:bold;color:#000;margin:0 0 1px 0;">DOMINICAN COLLEGE OF TARLAC, INC.</div><div style="font-family:'Times New Roman',serif;font-size:12pt;color:#000;margin:0 0 2px 0;">COMMUNITY EXTENSION SERVICES</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0 0 1px 0;">McArthur Highway, Poblacion (Sto. Rosario), Capas, 2315 Tarlac, Philippines</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0 0 1px 0;">Institutional Contact No.: +63938-918-4093</div><div style="font-family:'Times New Roman',serif;font-size:10pt;color:#333;margin:0;white-space:nowrap;">Website: dct.edu.ph | E-mail: <span style="color:#030e69;text-decoration:underline;">domct_2315@yahoo.com.ph / domct_2315@dct.edu.ph</span></div></td></tr></tbody></table><hr style="border:none;border-top:3px solid #000;margin:8px 0 0 0;width:110%;" />`;
          const defaultFooter = `<hr style="border:none;border-top:3px solid #000;margin:0 0 8px 0;width:100%;" /><div style="text-align:center;font-family:'Times New Roman',serif;line-height:1.25;color:#000;"><div style="font-size:12pt;font-weight:bold;margin:0 0 2px 0;">FIDES. PATRIA. SAPIENTIA.</div><div style="font-size:10pt;font-style:italic;margin:0 0 2px 0;">A God-loving educational community with passion for truth and compassion for humanity.</div><div style="font-size:10pt;margin:0;">Department/Office Facebook Page: www.facebook.com/dctces</div></div>`;

          const headerVal = rep.headerText !== undefined ? rep.headerText : defaultHeader;
          const footerVal = rep.footerText !== undefined ? rep.footerText : defaultFooter;
          const showHeaderVal = rep.showHeader !== undefined ? rep.showHeader : true;
          const showFooterVal = rep.showFooter !== undefined ? rep.showFooter : true;
          const paperKeyVal = rep.paperKey || 'Folio';
          const orientationVal = rep.orientation || 'portrait';
          const marginKeyVal = rep.marginKey || 'Narrative';
          const isTemplateActiveVal = rep.isTemplateActive !== undefined ? rep.isTemplateActive : true;

          setHeaderText(headerVal);
          headerEditor?.commands.setContent(headerVal || '<p></p>');
          setFooterText(footerVal);
          footerEditor?.commands.setContent(footerVal || '<p></p>');
          setShowHeader(showHeaderVal);
          setShowFooter(showFooterVal);
          setPaperKey(paperKeyVal);
          setOrientation(orientationVal);
          setMarginKey(marginKeyVal);
          setIsTemplateActive(isTemplateActiveVal);
          lastLoadedReportIdRef.current = workspaceReportId;
        }
      }
    } else if (!workspaceReportId) {
      lastLoadedReportIdRef.current = null;
    }
  }, [workspaceReportId, reportsList, headerEditor, footerEditor]);

  // ── Save current document as a template ──
  const handleSaveAsTemplate = useCallback(() => {
    if (!editor) return;
    const name = window.prompt('Save Current Document as Template — Enter Name:');
    if (!name || !name.trim()) return;

    const newTpl = {
      id: 'tpl-' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      html: editor.getHTML(),
      headerText,
      footerText,
      showHeader,
      showFooter,
    };

    setCustomTemplates(prev => {
      const updated = [...prev, newTpl];
      localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
      return updated;
    });
    alert(`Template "${name}" saved successfully!`);
  }, [editor, headerText, footerText, showHeader, showFooter]);

  // ── Import a .docx file as a template ──
  const handleImportTemplateFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      try {
        let layout = null;
        try {
          layout = await parseDocxLayout(arrayBuffer);
        } catch (err) {
          console.warn('Template layout parse failed:', err);
        }

        let html = '';
        try {
          html = await docxToHtml(arrayBuffer);
        } catch (err) {
          console.warn('docxToHtml failed, falling back to mammoth:', err);
          const result = await mammoth.convertToHtml({ arrayBuffer }, {
            convertImage: mammoth.images.imgElement((image) => {
              return image.readAsBase64String().then((b64) => ({
                src: `data:${image.contentType};base64,${b64}`
              }));
            })
          });
          html = result.value;
        }

        const tplName = file.name.replace(/\.[^/.]+$/, '');
        const newTpl = {
          id: 'tpl-' + Math.random().toString(36).substr(2, 9),
          name: tplName,
          createdAt: new Date().toISOString(),
          html,
          headerText: layout?.headerText || '',
          footerText: layout?.footerText || '',
          showHeader: layout?.showHeader || false,
          showFooter: layout?.showFooter || false,
        };

        setCustomTemplates(prev => {
          const updated = [...prev, newTpl];
          localStorage.setItem('dommunity_doc_templates', JSON.stringify(updated));
          return updated;
        });
        alert(`Template "${tplName}" added to your library!`);
      } catch (err) {
        console.error('Template import failed:', err);
        alert('Failed to import template. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, []);

  // ── Delete a template ──
  const handleDeleteTemplate = useCallback((id) => {
    if (!window.confirm('Remove this template from your library?')) return;
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

  // ── Open local .docx ──
  const handleOpenLocalDocx = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      setLoading(true);
      try {
        let layout = null;
        try {
          layout = await parseDocxLayout(arrayBuffer);
        } catch (e) {
          console.error('Failed to parse docx layout', e);
        }

        let html = '';
        try {
          html = await docxToHtml(arrayBuffer);
        } catch (err) {
          console.warn('High-fidelity parser failed, falling back to mammoth:', err);
          const result = await mammoth.convertToHtml({ arrayBuffer }, {
            convertImage: mammoth.images.imgElement((image) => {
              return image.readAsBase64String().then((base64String) => {
                return {
                  src: `data:${image.contentType};base64,${base64String}`
                };
              });
            })
          });
          html = result.value;
        }

        if (editor) {
          if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
          editor.setEditable(true);

          if (setWorkspaceReportTitle) {
            setWorkspaceReportTitle(file.name.replace(/\.[^/.]+$/, ''));
          }

          if (setWorkspaceReportId) {
            setWorkspaceReportId(null);
          }

          if (layout) {
            if (layout.headerText) {
              setHeaderText(layout.headerText);
              headerEditor?.commands.setContent(layout.headerText);
            } else {
              setHeaderText('');
              headerEditor?.commands.setContent('<p></p>');
            }

            if (layout.footerText) {
              setFooterText(layout.footerText);
              footerEditor?.commands.setContent(layout.footerText);
            } else {
              setFooterText('');
              footerEditor?.commands.setContent('<p></p>');
            }

            setShowHeader(layout.showHeader !== false);
            setShowFooter(layout.showFooter !== false);
          }

          editor.commands.setContent(html || '<p></p>');
          setActiveEditingArea('body');
        }
      } catch (err) {
        console.error('Error loading docx:', err);
        alert('Failed to open the document. Please check the file format.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [editor, headerEditor, footerEditor, setWorkspaceIsReadOnly, setWorkspaceReportTitle, setWorkspaceReportId, setLoading]);

  // ── Open local .pdf ──
  const handleOpenLocalPdf = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let html = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();

          // Reconstruct lines by grouping text items vertically
          let lastY = null;
          let lineText = '';

          for (const item of textContent.items) {
            const y = item.transform[5];
            const fontSize = Math.round(Math.abs(item.transform[3]));

            let itemStr = item.str;
            if (item.fontName) {
              const fnLower = item.fontName.toLowerCase();
              if (fnLower.includes('bold') || fnLower.includes('-bd') || fnLower.includes('_bd')) {
                itemStr = `<strong>${itemStr}</strong>`;
              }
              if (fnLower.includes('italic') || fnLower.includes('-it') || fnLower.includes('_it')) {
                itemStr = `<em>${itemStr}</em>`;
              }
            }

            const styledItem = fontSize && fontSize !== 16
              ? `<span style="font-size: ${fontSize}px;">${itemStr}</span>`
              : itemStr;

            if (lastY !== null && Math.abs(y - lastY) > 5) {
              if (lineText.trim()) {
                html += `<p>${lineText}</p>`;
              }
              lineText = styledItem;
            } else {
              lineText += (lineText ? ' ' : '') + styledItem;
            }
            lastY = y;
          }
          if (lineText.trim()) {
            html += `<p>${lineText}</p>`;
          }
        }

        if (editor) {
          if (setWorkspaceIsReadOnly) setWorkspaceIsReadOnly(false);
          editor.setEditable(true);

          if (setWorkspaceReportTitle) {
            setWorkspaceReportTitle(file.name.replace(/\.[^/.]+$/, ''));
          }

          if (setWorkspaceReportId) {
            setWorkspaceReportId(null);
          }

          // Clear headers and footers for PDF as it extracts layout directly into body
          setHeaderText('');
          headerEditor?.commands.setContent('<p></p>');
          setFooterText('');
          footerEditor?.commands.setContent('<p></p>');
          setShowHeader(false);
          setShowFooter(false);

          editor.commands.setContent(html || '<p></p>');
          setActiveEditingArea('body');
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        alert('Failed to parse PDF file. Ensure it contains selectable text.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [editor, headerEditor, footerEditor, setWorkspaceIsReadOnly, setWorkspaceReportTitle, setWorkspaceReportId, setLoading]);

  // ── Save/Submit handler ──
  const handleSave = useCallback(async (status, silent = false) => {
    if (!editor) return;
    const html = editor.getHTML();
    if (!html || html === '<p></p>') {
      if (!silent) alert('Please write some content before saving.');
      return;
    }
    await onSave(status, html, silent, {
      headerText,
      footerText,
      showHeader,
      showFooter,
      paperKey,
      orientation,
      marginKey,
      isTemplateActive
    });
  }, [editor, onSave, headerText, footerText, showHeader, showFooter, paperKey, orientation, marginKey, isTemplateActive]);

  // ── AutoSave ──
  useEffect(() => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    if (autoSave && workspaceReportId) {
      autoSaveTimer.current = setInterval(() => {
        handleSave('draft', true);
      }, 30000);
    }
    return () => {
      if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    };
  }, [autoSave, workspaceReportId, handleSave]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleSave('draft');
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          window.print();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, handleSave]);

  // ── File menu actions ──
  const fileMenuItems = [
    {
      icon: Plus,
      l: 'New Blank Document',
      fn: () => {
        if (editor) {
          // Helper to calculate insert position at the end of current page
          const getInsertPositionForBlankPage = () => {
            const { doc, selection } = editor.state;
            const cursorFrom = selection.from;

            // Paper configurations
            const PAPER = {
              Letter:    { w: 816,  h: 1056 },
              Folio:     { w: 816,  h: 1248 },
              Legal:     { w: 816,  h: 1344 },
              A4:        { w: 794,  h: 1122 },
            };

            const MARGINS = {
              Normal:    96,
              Narrow:    48,
              Moderate:  72,
              Wide:      128,
              Narrative: { top: 96, bottom: 96, left: 144, right: 96 },
            };

            const getMargins = (key) => {
              const preset = MARGINS[key] || MARGINS.Normal;
              if (typeof preset === 'number') {
                return { top: preset, bottom: preset, left: preset, right: preset };
              }
              return preset;
            };

            const getScale = (el) => {
              let parent = el;
              while (parent) {
                if (parent.style.transform && parent.style.transform.includes('scale')) {
                  const match = parent.style.transform.match(/scale\(([^)]+)\)/);
                  if (match) return parseFloat(match[1]) || 1;
                }
                parent = parent.parentElement;
              }
              return 1;
            };

            const paper = PAPER[paperKey] || PAPER.A4;
            const pageHeight = orientation === 'landscape' ? paper.w : paper.h;
            const margins = getMargins(marginKey);
            const padTopActual = (showHeader && isTemplateActive) ? 170 : margins.top;
            const usableHeight = pageHeight - (padTopActual + margins.bottom);

            let runningHeight = 0;
            let pageNum = 1;
            let cursorPage = 1;
            const nodePages = [];
            const scale = getScale(editor.view.dom);

            doc.forEach((node, offset) => {
              const dom = editor.view.nodeDOM(offset);
              let height = 0;
              let marginTop = 0;
              let marginBottom = 0;

              if (dom && dom.nodeType === 1) {
                const style = window.getComputedStyle(dom);
                marginTop = parseFloat(style.marginTop) || 0;
                marginBottom = parseFloat(style.marginBottom) || 0;
                const rect = dom.getBoundingClientRect();
                height = (rect.height / scale) + marginTop + marginBottom;
              } else {
                if (node.type.name === 'heading') {
                  height = node.attrs.level === 1 ? 40 : 30;
                } else if (node.type.name === 'paragraph') {
                  height = 20;
                } else if (node.type.name === 'table') {
                  height = 120;
                } else if (node.type.name === 'pageBreak') {
                  height = 1;
                } else {
                  height = 20;
                }
              }

              const forceBreak = node.type.name === 'pageBreak' || (dom && dom.nodeType === 1 && (
                dom.classList.contains('page-break') || 
                dom.querySelector('.page-break') !== null ||
                window.getComputedStyle(dom).pageBreakBefore === 'always' || 
                window.getComputedStyle(dom).breakBefore === 'page' ||
                dom.getAttribute('data-page-break') === 'true'
              ));

              if ((runningHeight + height > usableHeight || forceBreak) && runningHeight > 0) {
                pageNum++;
                const isBreakElementEmpty = (node.type.name === 'pageBreak' || (dom && dom.nodeType === 1 && dom.classList.contains('page-break'))) && height < 10;
                runningHeight = isBreakElementEmpty ? 0 : height;
              } else {
                runningHeight += height;
              }

              nodePages.push({ start: offset, end: offset + node.nodeSize, page: pageNum });
              if (offset <= cursorFrom) {
                cursorPage = pageNum;
              }
            });

            const currentNodes = nodePages.filter(n => n.page === cursorPage);
            if (currentNodes.length > 0) {
              return currentNodes[currentNodes.length - 1].end;
            }
            return cursorFrom;
          };

          const insertPos = getInsertPositionForBlankPage();
          const isAtEnd = (insertPos >= editor.state.doc.content.size - 2);

          if (isAtEnd) {
            editor.chain()
              .focus()
              .insertContentAt(insertPos, [
                { type: 'pageBreak' },
                { type: 'paragraph' }
              ])
              .setTextSelection(insertPos + 2)
              .run();
          } else {
            editor.chain()
              .focus()
              .insertContentAt(insertPos, [
                { type: 'pageBreak' },
                { type: 'paragraph' },
                { type: 'pageBreak' }
              ])
              .setTextSelection(insertPos + 2)
              .run();
          }
          setActiveEditingArea('body');
        }
      }
    },
    null,
    { icon: Save, l: 'Save Draft (Ctrl+S)', fn: () => handleSave('draft') },
    { icon: Send, l: 'Submit to Admin', fn: () => handleSave('submitted') },
    null,
    { icon: Printer, l: 'Print (Ctrl+P)', fn: () => window.print() },
    { icon: FileDown, l: 'Export as PDF', fn: () => handleExportPDF(canvasRef, workspaceReportTitle || 'Report') },
    { icon: Download, l: 'Export as DOCX', fn: () => handleExportDOCX(editor, workspaceReportTitle || 'Report') },
  ];

  const docTitle = workspaceReportTitle || eventsList.find(x => x.id === workspaceReportEventId)?.name || 'Document1';
  const activeEditor = (activeEditingArea === 'header' && headerEditor)
    ? headerEditor
    : (activeEditingArea === 'footer' && footerEditor)
      ? footerEditor
      : editor;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FAFBFD] border border-neutral-200 rounded-lg">

      {/* ── Title Bar ── */}
      <div className="bg-navy-blue text-white flex items-center justify-between px-4 py-2 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="bg-white text-navy-blue rounded w-6 h-6 flex items-center justify-center font-bold text-sm shadow">W</div>
          <span className="text-sm font-semibold text-gray-100 truncate max-w-md">
            {docTitle} – DommUnity Rich Editor
          </span>
          {workspaceIsReadOnly && (
            <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold">Read-Only</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-300">
          {saveStatus === 'saving' && <span className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Saving…</span>}
          {saveStatus === 'saved' && <span className="flex items-center gap-1.5 text-green-400"><Check className="w-3.5 h-3.5" />Saved</span>}
          {saveStatus === 'error' && <span className="text-red-400">Save failed</span>}
          {autoSave && <span className="text-green-400 font-semibold">AutoSave ON</span>}
        </div>
      </div>

      {/* ── Menu & Actions Row ── */}
      <div className="bg-neutral-100 border-b border-neutral-200 flex items-center px-4 py-1.5 gap-2 shrink-0 select-none print:hidden">
        {/* File Dropdown */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="px-3 py-1 text-xs font-semibold bg-navy-blue text-white rounded hover:bg-navy-blue/90 transition cursor-pointer"
          >
            File
          </button>
          <DropdownWrapper open={showFileMenu} onClose={() => setShowFileMenu(false)} triggerRef={fileMenuRef} width={240}>
            <div className="py-1 w-56 bg-white border border-neutral-200 shadow-lg rounded">
              {fileMenuItems.map((item, i) => {
                if (!item) return <div key={i} className="my-1 border-t border-neutral-100" />;
                return (
                  <button
                    key={item.l}
                    onClick={() => { item.fn(); setShowFileMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 hover:bg-neutral-100 cursor-pointer transition ${item.active ? 'text-blue-600 font-bold' : ''}`}
                  >
                    <item.icon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{item.l}</span>
                  </button>
                );
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
          <DropdownWrapper open={showTemplatesMenu} onClose={() => setShowTemplatesMenu(false)} triggerRef={templatesMenuRef} width={240}>
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
                  <span className="text-[9px] text-neutral-500 truncate pl-5.5">{tpl.description}</span>
                </button>
              ))}
            </div>
          </DropdownWrapper>
        </div>

        <div className="h-4 w-px bg-neutral-300 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-200/60 rounded px-1.5 py-0.5">
          <button
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            className="p-0.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/80 rounded transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-semibold text-neutral-700 min-w-[32px] text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="p-0.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/80 rounded transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Formatting Toolbar ── */}
      <div className="bg-white border-b border-neutral-200 px-4 py-1.5 shrink-0 print:hidden">
        <Toolbar />
      </div>

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
    </div>
  );
}
