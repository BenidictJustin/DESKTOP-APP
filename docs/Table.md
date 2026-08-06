# Tiptap Extension Specification: Table Structure & Horizontal Positioning

This technical reference manual provides the exact layout configuration to implement structured HTML tables and multi-position alignment controls (Left, Center, Right) using **Tiptap + React + ElectronJS**.

---

## 📋 Overview & Module Summary

| Target Technology | Version / Module | Primary Functionality |
| :--- | :--- | :--- |
| **Tiptap Core** | `@tiptap/react` | React wrapper and editor hook initialization |
| **Table Base** | `@tiptap/extension-table` | Table node engine with resizable column hooks |
| **Table Structure** | `@tiptap/extension-table-row`, `-cell`, `-header` | HTML `<table>`, `<tr>`, `<td>`, and `<th>` DOM rendering |
| **Alignment Engine** | `@tiptap/extension-alignment` | Horizontal positioning (`data-align` attribute) for blocks |

---

## 📦 1. Required Packages

Run this installation command in your application project root folder:

```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-alignment
```

### Package Manifest

| Package Name | Purpose | Recommended Version |
| :--- | :--- | :---: |
| `@tiptap/extension-table` | Core table node configuration & column resize handler | `^2.0.0` |
| `@tiptap/extension-table-row` | Defines table row (`<tr>`) schema rules | `^2.0.0` |
| `@tiptap/extension-table-cell` | Defines table body cell (`<td>`) schema rules | `^2.0.0` |
| `@tiptap/extension-table-header` | Defines table header cell (`<th>`) schema rules | `^2.0.0` |
| `@tiptap/extension-alignment` | Text & block-level horizontal alignment (`left`, `center`, `right`) | `^2.0.0` |

---

## ⚙️ 2. Editor Setup Configuration

Register the table nodes and the alignment engine inside your React component configuration file. The `Alignment` module must be explicitly configured to accept `table` node blocks.

```javascript
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

// Table Architecture Modules
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

// Alignment Positioning Module
import Alignment from '@tiptap/extension-alignment'

const editor = useEditor({
  extensions: [
    StarterKit,
    // Enable structural table nodes with responsive resizing hooks
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    // Configure alignment nodes to safely control table elements
    Alignment.configure({
      types: ['heading', 'paragraph', 'table'], 
    }),
  ],
})
```

> [!NOTE]
> Ensure `'table'` is added to the `types` array in `Alignment.configure()` so Tiptap injects alignment attributes directly onto table wrapper nodes.

---

## 🎛️ 3. Interactive Toolbar Action Component

This toolbar block includes the **Microsoft Word-style dimensions hover grid picker** along with dynamic positioning action buttons to align your tables left, center, or right.

### Control Actions & Features

| Control Element | Action Type | Result / Payload |
| :--- | :--- | :--- |
| **Insert Table Matrix** | Hover Grid Dropdown (Up to 8x8) | `editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()` |
| **Left Alignment** | Button Click | `editor.chain().focus().setTextAlign('left').run()` |
| **Center Alignment** | Button Click | `editor.chain().focus().setTextAlign('center').run()` |
| **Right Alignment** | Button Click | `editor.chain().focus().setTextAlign('right').run()` |

```jsx
import React, { useState } from 'react';

export function TableToolbarControls({ editor }) {
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [hoveredGrid, setHoveredGrid] = useState({ rows: 0, cols: 0 });

  const maxRows = 8;
  const maxCols = 8;

  if (!editor) return null;

  const handleCreateGridTable = (rows, cols) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setIsGridOpen(false);
    setHoveredGrid({ rows: 0, cols: 0 });
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '8px' }}>
      
      {/* SECTION A: WORD-STYLE GRID SELECTOR */}
      <div style={{ position: 'relative' }}>
        <button 
          type="button"
          onClick={() => setIsGridOpen(!isGridOpen)}
          style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}
        >
          📊 Insert Table Matrix
        </button>

        {isGridOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 50, background: '#fff', 
            border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textAlign: 'center', fontWeight: 'bold' }}>
              {hoveredGrid.rows > 0 ? `${hoveredGrid.cols} x ${hoveredGrid.rows} Grid` : 'Choose Area Dimensions'}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${maxCols}, 1fr)`, gap: '3px' }}>
              {Array.from({ length: maxRows }).map((_, rowIndex) => {
                const r = rowIndex + 1;
                return Array.from({ length: maxCols }).map((_, colIndex) => {
                  const c = colIndex + 1;
                  const isHighlighted = r <= hoveredGrid.rows && c <= hoveredGrid.cols;
                  return (
                    <div
                      key={`${r}-${c}`}
                      onMouseEnter={() => setHoveredGrid({ rows: r, cols: c })}
                      onClick={() => handleCreateGridTable(r, c)}
                      style={{
                        width: '18px', height: '18px', border: '1px solid #cbd5e1', cursor: 'pointer', borderRadius: '2px',
                        backgroundColor: isHighlighted ? '#2563eb' : '#fff'
                      }}
                    />
                  );
                });
              })}
            </div>
          </div>
        )}
      </div>

      <div style={{ width: '1px', height: '24px', background: '#cbd5e1' }} />

      {/* SECTION B: HORIZONTAL POSITIONING TOGGLES */}
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          type="button"
          title="Align Table Left"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
        >
          ⬅️ Left
        </button>
        
        <button
          type="button"
          title="Center Table Container"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
        >
          ↔️ Center
        </button>
        
        <button
          type="button"
          title="Align Table Right"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
        >
          ➡️ Right
        </button>
      </div>

    </div>
  );
}
```

---

## 🎨 4. High-Contrast Render Stylesheet (Screen & Print Layer)

Add these styling declarations directly into your application layout's CSS sheet (`index.css` or `App.css`). This resolves loose alignment anomalies and enforces crisp, visible table borders during local interaction and inside the generated Electron PDF.

### CSS Selector Layout Rules Summary

| Selector | Media Scope | Key Styling / Behavior |
| :--- | :--- | :--- |
| `.tiptap table` | Screen | `border-collapse: collapse`, `width: 100%`, `table-layout: fixed` |
| `.tiptap table[data-align="left"]` | Screen | `margin-right: auto`, `margin-left: 0`, `width: 70%` |
| `.tiptap table[data-align="center"]` | Screen | `margin-right: auto`, `margin-left: auto`, `width: 70%` |
| `.tiptap table[data-align="right"]` | Screen | `margin-right: 0`, `margin-left: auto`, `width: 70%` |
| `.tiptap td, .tiptap th` | Screen | `border: 2px solid #0f172a`, `padding: 12px 14px`, `vertical-align: top` |
| `.tiptap th` | Screen | `background-color: #f1f5f9`, `font-weight: bold`, `border-bottom: 3px solid #000000` |
| `@media print` | Print / PDF | `-webkit-print-color-adjust: exact`, page break prevention on `tr` |

```css
/* Core Screen Canvas Display Layout Rules */
.tiptap table {
  border-collapse: collapse !important;
  margin: 20px 0 !important;
  width: 100% !important;
  table-layout: fixed;
}

/* Base Alignment positioning overrides for Tiptap structural blocks */
.tiptap table[data-align="left"] {
  margin-right: auto !important;
  margin-left: 0 !important;
  width: 70% !important; /* Scaled down layout to make positioning visible */
}

.tiptap table[data-align="center"] {
  margin-right: auto !important;
  margin-left: auto !important;
  width: 70% !important;
}

.tiptap table[data-align="right"] {
  margin-right: 0 !important;
  margin-left: auto !important;
  width: 70% !important;
}

/* Distinct high-visibility border outlines around cell boxes */
.tiptap td, 
.tiptap th {
  border: 2px solid #0f172a !important; /* Bold Slate-Black outline color */
  padding: 12px 14px !important;       /* Comfortable cellular spacing */
  min-width: 1em;
  vertical-align: top;
  text-align: left;
}

/* Structural Header Highlighting formatting */
.tiptap th {
  background-color: #f1f5f9 !important; /* Smooth soft-gray fill grid */
  font-weight: bold !important;
  border-bottom: 3px solid #000000 !important; /* Thick emphasis baseline line */
}

/* 🖨️ Electron PDF Print Layout Preservation Layer */
@media print {
  .tiptap table, 
  .tiptap td, 
  .tiptap th {
    /* Guarantees the Chromium engine draws custom cell colors and bold line weights */
    -webkit-print-color-adjust: exact !important; 
    print-color-adjust: exact !important;         
    border: 2px solid #000000 !important; /* Pure black line stroke configuration */
  }

  .tiptap th {
    background-color: #cbd5e1 !important;
  }

  /* Prevent row cells from split-tearing vertically across physical pages */
  .tiptap tr {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
}
```

---

## ⚡ 5. Common Table API Reference

| Action | Chainable Command |
| :--- | :--- |
| **Insert Table** | `editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()` |
| **Add Column Before** | `editor.chain().focus().addColumnBefore().run()` |
| **Add Column After** | `editor.chain().focus().addColumnAfter().run()` |
| **Delete Column** | `editor.chain().focus().deleteColumn().run()` |
| **Add Row Before** | `editor.chain().focus().addRowBefore().run()` |
| **Add Row After** | `editor.chain().focus().addRowAfter().run()` |
| **Delete Row** | `editor.chain().focus().deleteRow().run()` |
| **Delete Table** | `editor.chain().focus().deleteTable().run()` |
| **Toggle Header Row** | `editor.chain().focus().toggleHeaderRow().run()` |
| **Set Cell Alignment** | `editor.chain().focus().setTextAlign('left' \| 'center' \| 'right').run()` |
