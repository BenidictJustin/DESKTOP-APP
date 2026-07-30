# Walkthrough - Microsoft Word Redesign for Report Workplace

This walkthrough details the redesign of the **Office Coordinator Dashboard** (`OfficeCoordinatorDashboard.jsx`) to replicate a **Microsoft Word**-style interface. All sidebars, property forms, and event select menus have been integrated into Word's backstage view to focus 100% on a clean A4 document page.

## word interface architecture

### 1. Left Sidebar (Admin-matching Style)

- Logo block: "DommUnity" + "CES Office Coordinator"
- Nav items: Dashboard, Start New Document, Compiled Reports
- Bottom footer: avatar, name, role, Logout button
- Same CSS classes and design as the Admin dashboard sidebar.

### 2. Dashboard Page

- Stat cards (Total, Drafts, Submitted, Approved, Returned).
- Quick action buttons ("New Report", "View My Reports").
- List of recent reports.
- Clean design with no default welcome headers or descriptive placeholder copy.

### 3. Start New Document (Word Editor)

- High-fidelity **Microsoft Word/Google Docs–style ribbon interface** with fully functional tabs: File, Home, Insert, Layout, Review, View.
- Center-aligned document canvas representing the selected paper size (A4, Letter, Legal) and margins (Normal, Narrow, Moderate, Wide).
- **Blank Document Initialization**: Clean canvas with no default text, titles, headings, or placeholder instructions, ready for immediate typing.
- **Margin-Area-Click-to-Focus**: Clicking anywhere on the document canvas or its margin area immediately focuses the editable text cursor so typing can begin.
- **AutoSave & Save As**: Save As duplicates documents in the local database, while AutoSave periodically posts draft changes.
- **Functional Illustrations & Media**: Inserts real shape entities (shapes, icons, process diagrams, progress data charts), screenshot capture mockups, and online video embeds.
- **Line & Paragraph Spacing, Margin Setup, and Column layouts**: Native column layouts (1, 2, or 3 columns) and block indentation are fully supported.
- **Ctrl + Wheel Zoom**: Zooming using the toolbar, `Ctrl + Mouse Wheel`, and pinch gestures dynamically scales text sizing and scrollbars using browser `zoom`.

### 4. Compiled Reports

- Simple and elegant overview list of compiled reports.
- Quick link buttons to open and edit/inspect reports.

---

## Verification Results

### Ribbon Dropdown Clipping Fix

- Changed the main ribbon wrapper from `overflow-x-auto` to `overflow-visible z-30`.
- Changed all individual ribbon tab wrappers (Home, Insert, Layout, Review, View) to `overflow-visible` to allow all ribbon dropdown menus to render on top of the document page without cropping.

### Insert Ribbon Crash Fix

- Added missing `Sparkles` icon import from `lucide-react` to prevent reference error crash when navigating to the "Insert" ribbon tab.

### Mount & State Persistence Fixes

- Kept the Tiptap editor mounted in the background DOM, toggling visibility with the CSS class `.hidden` when not in the Editor tab. This completely avoids unmounting race conditions and restores editability upon clicking "Edit" in Compiled Reports.
- Explicitly synchronized `editor.setEditable(...)` inside the `resetForm` and `openReport` callbacks.
- Transitioned zoom layout to an absolute-translated scale viewport with a ResizeObserver measuring dynamic page heights, ensuring pixel-perfect alignment and mouse click tracking.
- Set standard document `spellcheck="true"` in the editor properties.

### Build Success

The project builds successfully and passes all compilation checks, confirming that all Tiptap v3 named exports, document links, line-spacing, and backstage menus render without errors.
