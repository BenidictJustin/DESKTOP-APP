import JSZip from 'jszip';

/**
 * Shared helper functions for the document editor.
 */

/** Insert a shape (Unicode character) into the editor. */
export function insertShape(editor, shapeHtml) {
  if (!editor) return;
  editor.chain().focus().insertContent(shapeHtml).run();
}

/** Insert an icon (emoji) into the editor. */
export function insertIcon(editor, iconChar) {
  if (!editor) return;
  editor.chain().focus().insertContent(iconChar).run();
}

/** Insert current date & time string. */
export function insertDateTime(editor) {
  if (!editor) return;
  editor.chain().focus().insertContent(new Date().toLocaleString()).run();
}

/** Insert a data table as a chart representation. */
export function insertChart(editor) {
  if (!editor) return;
  editor.chain().focus().insertContent(`
    <table style="border: 1px solid #c0c0c0; width: 100%; margin: 12px 0;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 8px; border: 1px solid #c0c0c0; font-weight: bold;">Category</th>
          <th style="padding: 8px; border: 1px solid #c0c0c0; font-weight: bold;">Value</th>
          <th style="padding: 8px; border: 1px solid #c0c0c0; font-weight: bold;">Progress</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding: 8px; border: 1px solid #c0c0c0;">Category A</td>
          <td style="padding: 8px; border: 1px solid #c0c0c0;">120</td>
          <td style="padding: 8px; border: 1px solid #c0c0c0;"><div style="background-color:#059669; width:80%; height:12px; border-radius:2px;"></div></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #c0c0c0;">Category B</td>
          <td style="padding: 8px; border: 1px solid #c0c0c0;">85</td>
          <td style="padding: 8px; border: 1px solid #c0c0c0;"><div style="background-color:#2563eb; width:57%; height:12px; border-radius:2px;"></div></td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #c0c0c0;">Category C</td>
          <td style="padding: 8px; border: 1px solid #c0c0c0;">45</td>
          <td style="padding: 8px; border: 1px solid #c0c0c0;"><div style="background-color:#ea580c; width:30%; height:12px; border-radius:2px;"></div></td>
        </tr>
      </tbody>
    </table>
  `).run();
}

/** Insert a SmartArt process diagram. */
export function insertSmartArt(editor) {
  if (!editor) return;
  editor.chain().focus().insertContent(`
    <div style="display: flex; gap: 8px; justify-content: center; margin: 16px 0; font-family: sans-serif;">
      <div style="background: #eff6ff; border: 1.5px solid #2563eb; border-radius: 6px; padding: 8px; width: 110px; text-align: center; font-size: 11px;">
        <div style="font-weight: bold; color: #1e3a8a;">1. PLANNING</div>
        <div style="color: #60a5fa; font-size: 9px; margin-top: 2px;">Draft Proposals</div>
      </div>
      <div style="align-self: center; font-size: 16px; color: #9ca3af;">➔</div>
      <div style="background: #ecfdf5; border: 1.5px solid #059669; border-radius: 6px; padding: 8px; width: 110px; text-align: center; font-size: 11px;">
        <div style="font-weight: bold; color: #064e3b;">2. EXECUTION</div>
        <div style="color: #34d399; font-size: 9px; margin-top: 2px;">Field Deployment</div>
      </div>
      <div style="align-self: center; font-size: 16px; color: #9ca3af;">➔</div>
      <div style="background: #fffbeb; border: 1.5px solid #d97706; border-radius: 6px; padding: 8px; width: 110px; text-align: center; font-size: 11px;">
        <div style="font-weight: bold; color: #78350f;">3. REPORT</div>
        <div style="color: #fbbf24; font-size: 9px; margin-top: 2px;">Submit Narrative</div>
      </div>
    </div>
  `).run();
}

/** Insert a text box with border. */
export function insertTextBox(editor) {
  if (!editor) return;
  editor.chain().focus().insertContent(`
    <div style="border: 2px solid #d1d5db; border-radius: 6px; padding: 16px; margin: 12px 0; min-height: 60px; background: #fafafa;">
      <p>Type your text here…</p>
    </div>
  `).run();
}

/** Insert a hyperlink via prompt. */
export function handleLink(editor) {
  if (!editor) return;
  const prev = editor.getAttributes('link').href;
  const url = window.prompt('Enter URL:', prev || 'https://');
  if (url === null) return;
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

/** Insert an image from a file input event. */
export function handleInsertImage(editor, e) {
  const file = e.target.files?.[0];
  if (!file || !editor) return;
  const reader = new FileReader();
  reader.onload = () => editor.chain().focus().setImage({ src: reader.result }).run();
  reader.readAsDataURL(file);
  e.target.value = '';
}

/** Change paragraph indentation. */
export function changeIndent(editor, direction) {
  if (!editor) return;
  const { state } = editor;
  const { from } = state.selection;
  const node = state.doc.resolve(from).parent;
  let current = 0;
  if (node.attrs.style && node.attrs.style.includes('margin-left')) {
    const match = node.attrs.style.match(/margin-left:\s*(\d+)px/);
    if (match) current = parseInt(match[1], 10);
  }
  const next = direction === 'increase' ? current + 40 : Math.max(0, current - 40);
  editor.chain().focus().updateAttributes('paragraph', {
    style: next > 0 ? `margin-left: ${next}px` : null
  }).run();
}

/** Insert a page number indicator. */
export function insertPageNumber(editor) {
  if (!editor) return;
  editor.chain().focus().insertContent(
    '<p style="text-align:right;font-size:10px;color:#9ca3af;font-style:italic;">Page 1 of 1</p>'
  ).run();
}

/** Insert an equation/math symbol. */
export function insertEquation(editor, eqValue) {
  if (!editor) return;
  editor.chain().focus().insertContent(
    `<span style="font-family: 'Cambria Math', serif; font-style: italic;">${eqValue}</span>`
  ).run();
}

/** Insert an online video iframe. */
export function insertVideo(editor) {
  if (!editor) return;
  const url = window.prompt('Enter Video Embed URL (e.g. YouTube Embed):', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  if (!url) return;
  editor.chain().focus().insertContent(`
    <div style="text-align: center; margin: 16px 0;">
      <iframe src="${url}" width="480" height="270" style="border: 1px solid #d1d5db; border-radius: 6px; max-width: 100%;" allowfullscreen></iframe>
    </div>
  `).run();
}

/** Export the editor content as a plain text file. */
export function handleExportTXT(editor, title) {
  if (!editor) return;
  const text = editor.getText();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'Document'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export the editor content as a DOCX-compatible HTML file. */
export function handleExportDOCX(editor, title) {
  if (!editor) return;
  const html = editor.getHTML();
  const blob = new Blob([
    `<html><head><meta charset="utf-8"><style>body{font-family:Calibri,sans-serif;font-size:11pt;margin:2.54cm;}</style></head><body>${html}</body></html>`
  ], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'Document'}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export the editor content as a PDF using html2canvas + jsPDF. */
export async function handleExportPDF(canvasRef, title) {
  if (!canvasRef?.current) return;
  try {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');
    const canvas = await html2canvas(canvasRef.current, { useCORS: true, scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const w = 190;
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(imgData, 'PNG', 10, 10, w, h);
    pdf.save(`${title || 'Document'}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed.');
  }
}

/** Handle find text in editor. */
export function handleFind(editor, findText) {
  if (!editor || !findText) return false;
  const { doc } = editor.state;
  const text = doc.textContent;
  const idx = text.indexOf(findText);
  if (idx === -1) {
    alert(`"${findText}" not found.`);
    return false;
  }
  editor.chain().focus().setTextSelection({ from: idx + 1, to: idx + 1 + findText.length }).run();
  return true;
}

/** Handle replace all in editor. */
export function handleReplaceAll(editor, findText, replaceText) {
  if (!editor || !findText) return;
  const html = editor.getHTML();
  const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const newHtml = html.replace(new RegExp(escaped, 'g'), replaceText);
  editor.commands.setContent(newHtml);
}

/** Parse docx layout, margins, paper size, orientation, headers, and footers. */
export async function parseDocxLayout(arrayBuffer) {
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    let paperKey = 'A4';
    let orientation = 'portrait';
    let marginKey = 'Normal';
    let headerText = '';
    let footerText = '';
    let showHeader = false;
    let showFooter = false;

    // 1. Parse document.xml for page size and margins
    const docFile = zip.file('word/document.xml');
    if (docFile) {
      const docXmlStr = await docFile.async('text');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(docXmlStr, 'application/xml');
      
      const sectPrs = xmlDoc.getElementsByTagName('w:sectPr');
      if (sectPrs && sectPrs.length > 0) {
        const sectPr = sectPrs[sectPrs.length - 1]; // get final section properties
        
        // Page Size
        const pgSzs = sectPr.getElementsByTagName('w:pgSz');
        if (pgSzs && pgSzs.length > 0) {
          const pgSz = pgSzs[0];
          const wVal = parseInt(pgSz.getAttribute('w:w')) || 12240;
          const hVal = parseInt(pgSz.getAttribute('w:h')) || 15840;
          const orientVal = pgSz.getAttribute('w:orient') || 'portrait';
          
          orientation = orientVal;
          
          const aspect = wVal / hVal;
          if (Math.abs(wVal - 12240) < 500 && Math.abs(hVal - 15840) < 500) {
            paperKey = 'Letter';
          } else if (Math.abs(wVal - 11906) < 500 && Math.abs(hVal - 16838) < 500) {
            paperKey = 'A4';
          } else if (hVal > 18000) {
            paperKey = 'Legal';
          } else {
            paperKey = Math.abs(aspect - (8.5 / 11)) < Math.abs(aspect - (210 / 297)) ? 'Letter' : 'A4';
          }
        }
        
        // Margins
        const pgMars = sectPr.getElementsByTagName('w:pgMar');
        if (pgMars && pgMars.length > 0) {
          const pgMar = pgMars[0];
          const topVal = parseInt(pgMar.getAttribute('w:top')) || 1440;
          
          if (Math.abs(topVal - 1440) < 200) marginKey = 'Normal';
          else if (Math.abs(topVal - 720) < 200) marginKey = 'Narrow';
          else if (Math.abs(topVal - 1080) < 200) marginKey = 'Moderate';
          else if (Math.abs(topVal - 1920) < 200) marginKey = 'Wide';
          else marginKey = 'Normal';
        }
      }
    }

    const extractTextFromXml = (xmlStr) => {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
        const textNodes = xmlDoc.getElementsByTagName('w:t');
        let result = '';
        for (let i = 0; i < textNodes.length; i++) {
          result += textNodes[i].textContent;
        }
        return result.trim();
      } catch (e) {
        console.error('Error extracting text from xml:', e);
        return '';
      }
    };

    const files = Object.keys(zip.files);
    
    // Look for any header files
    const headerFileNames = files.filter(f => f.startsWith('word/header') && f.endsWith('.xml'));
    for (const hfName of headerFileNames) {
      const xmlStr = await zip.files[hfName].async('text');
      const txt = extractTextFromXml(xmlStr);
      if (txt) {
        headerText = txt;
        showHeader = true;
        break;
      }
    }

    // Look for any footer files
    const footerFileNames = files.filter(f => f.startsWith('word/footer') && f.endsWith('.xml'));
    for (const ffName of footerFileNames) {
      const xmlStr = await zip.files[ffName].async('text');
      const txt = extractTextFromXml(xmlStr);
      if (txt) {
        footerText = txt.replace(/PAGE|page|\{\s*PAGE\s*\}/g, '').trim();
        showFooter = true;
        break;
      }
    }

    return {
      paperKey,
      orientation,
      marginKey,
      headerText,
      footerText,
      showHeader,
      showFooter,
    };
  } catch (err) {
    console.error('Failed to parse docx layout:', err);
    return null;
  }
}
