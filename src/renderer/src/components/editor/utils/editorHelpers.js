import JSZip from 'jszip';
import { EditorState } from 'prosemirror-state';
import { createDocument } from '@tiptap/core';

/**
 * Loads baseline content into a Tiptap editor and resets the ProseMirror undo/redo history state to 0 steps.
 * Prevents Ctrl+Z from undoing or erasing the loaded document/template/report content.
 */
export function loadInitialContentAndResetHistory(editor, content) {
  if (!editor || editor.isDestroyed) return;
  try {
    const docNode = createDocument(content || '<p></p>', editor.schema);
    const newState = EditorState.create({
      schema: editor.schema,
      doc: docNode,
      plugins: editor.state.plugins,
    });
    editor.view.updateState(newState);
  } catch (err) {
    console.warn('loadInitialContentAndResetHistory fallback:', err);
    try {
      const docNode = createDocument(content || '<p></p>', editor.schema);
      const tr = editor.state.tr;
      tr.replaceWith(0, editor.state.doc.content.size, docNode);
      tr.setMeta('addToHistory', false);
      editor.view.dispatch(tr);
    } catch (e) {
      editor.commands.setContent(content || '<p></p>');
    }
  }
}

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
  editor.chain().focus().insertContent({
    type: 'floatingTextBox',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Type your text here…'
          }
        ]
      }
    ]
  }).run();
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
  reader.onload = () => {
    editor.chain().focus().insertContent({
      type: 'floatingImage',
      attrs: { src: reader.result }
    }).run();
  };
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

/**
 * Sanitizes oklch() color functions in document stylesheets and inline styles
 * by converting them to browser-computed rgb()/rgba() strings for html2canvas compatibility.
 */
export function sanitizeOklchInDocument(doc) {
  if (!doc) return;
  let tempDiv = null;
  const colorCache = new Map();

  function convertOklch(match) {
    if (colorCache.has(match)) return colorCache.get(match);
    try {
      if (!tempDiv) {
        tempDiv = doc.createElement('div');
        tempDiv.style.display = 'none';
        (doc.body || doc.documentElement).appendChild(tempDiv);
      }
      tempDiv.style.color = match;
      const computed = doc.defaultView ? doc.defaultView.getComputedStyle(tempDiv).color : '';
      const result = (computed && computed !== 'transparent') ? computed : match;
      colorCache.set(match, result);
      return result;
    } catch {
      colorCache.set(match, match);
      return match;
    }
  }

  // 1. Convert oklch in <style> elements
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
      styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, convertOklch);
    }
  });

  // 2. Convert oklch in inline style attributes
  const elementsWithStyle = doc.querySelectorAll('[style*="oklch"]');
  elementsWithStyle.forEach((el) => {
    const styleAttr = el.getAttribute('style');
    if (styleAttr) {
      el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/g, convertOklch));
    }
  });

  if (tempDiv) tempDiv.remove();
}

/** Export the editor content as a PDF using html2canvas + jsPDF. */
export async function handleExportPDF(canvasRef, title) {
  if (!canvasRef?.current) return;
  try {
    const { default: html2canvas } = await import('html2canvas');
    const { default: jsPDF } = await import('jspdf');

    const element = canvasRef.current;
    
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        sanitizeOklchInDocument(clonedDoc);
      }
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfPageHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let leftHeight = imgHeight;
    let position = 0;

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
    leftHeight -= pdfPageHeight;

    while (leftHeight > 0) {
      position = leftHeight - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      leftHeight -= pdfPageHeight;
    }

    pdf.save(`${title || 'Document'}.pdf`);
  } catch (err) {
    console.error('PDF export failed:', err);
    alert('PDF export failed: ' + (err.message || 'Error generating PDF'));
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

    const files = Object.keys(zip.files);
    
    // Look for any header files and parse with high fidelity relationships
    const headerFileNames = files.filter(f => f.startsWith('word/header') && f.endsWith('.xml'));
    for (const hfName of headerFileNames) {
      const xmlStr = await zip.files[hfName].async('text');
      const relsMap = await getRelsMap(zip, hfName);
      const html = await parseXmlToHtml(xmlStr, zip, relsMap);
      if (html && html.trim() && html !== '<p>&nbsp;</p>') {
        headerText = html;
        showHeader = true;
        break;
      }
    }

    // Look for any footer files and parse with high fidelity relationships
    const footerFileNames = files.filter(f => f.startsWith('word/footer') && f.endsWith('.xml'));
    for (const ffName of footerFileNames) {
      const xmlStr = await zip.files[ffName].async('text');
      const relsMap = await getRelsMap(zip, ffName);
      const html = await parseXmlToHtml(xmlStr, zip, relsMap);
      if (html && html.trim() && html !== '<p>&nbsp;</p>') {
        footerText = html;
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

/** 
 * Resolves relationship properties mapping rId to image files specifically for a given XML file path.
 */
export async function getRelsMap(zip, xmlPath) {
  const relsMap = {};
  const parts = xmlPath.split('/');
  const fileName = parts.pop();
  const relsPath = parts.join('/') + '/_rels/' + fileName + '.rels';
  
  const relsFile = zip.file(relsPath);
  if (relsFile) {
    const xmlStr = await relsFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
    const rels = xmlDoc.getElementsByTagName('Relationship');
    for (let i = 0; i < rels.length; i++) {
      const id = rels[i].getAttribute('Id');
      const target = rels[i].getAttribute('Target');
      relsMap[id] = target;
    }
  }
  return relsMap;
}

/**
 * Parses any Open XML section (body, header, footer) and converts it to HTML.
 */
export async function parseXmlToHtml(xmlStr, zip, relsMap) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'application/xml');
  
  const rootNode = xmlDoc.getElementsByTagName('w:body')[0] || 
                   xmlDoc.getElementsByTagName('w:hdr')[0] || 
                   xmlDoc.getElementsByTagName('w:ftr')[0];
  
  if (!rootNode) return '';

  const getBase64Image = async (target) => {
    let path = target;
    if (!path.startsWith('word/')) {
      path = 'word/' + path;
    }
    const file = zip.file(path);
    if (!file) return '';
    const buffer = await file.async('uint8array');
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    const base64 = window.btoa(binary);
    let mime = 'image/png';
    if (path.endsWith('.jpeg') || path.endsWith('.jpg')) mime = 'image/jpeg';
    else if (path.endsWith('.gif')) mime = 'image/gif';
    else if (path.endsWith('.webp')) mime = 'image/webp';
    return `data:${mime};base64,${base64}`;
  };

  const processNode = async (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const tagName = node.tagName || node.localName;

    // Table Row
    if (tagName === 'w:tr') {
      let trHtml = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        trHtml += await processNode(node.childNodes[i]);
      }
      return `<tr>${trHtml}</tr>`;
    }

    // Table Cell
    if (tagName === 'w:tc') {
      let tcHtml = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        tcHtml += await processNode(node.childNodes[i]);
      }
      let cellStyle = 'border: 1px solid #c0c0c0; padding: 6px 10px; text-align: left; vertical-align: top;';
      const tcPr = node.getElementsByTagName('w:tcPr')[0];
      if (tcPr) {
        const shd = tcPr.getElementsByTagName('w:shd')[0];
        if (shd) {
          const fill = shd.getAttribute('w:fill');
          if (fill && fill !== 'auto') {
            cellStyle += ` background-color: #${fill};`;
          }
        }
        const tcW = tcPr.getElementsByTagName('w:tcW')[0];
        if (tcW) {
          const wVal = parseInt(tcW.getAttribute('w:w'));
          if (wVal) {
            cellStyle += ` width: ${Math.round(wVal / 15)}px;`;
          }
        }
      }
      return `<td style="${cellStyle}">${tcHtml}</td>`;
    }

    // Table
    if (tagName === 'w:tbl') {
      let tblHtml = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        tblHtml += await processNode(node.childNodes[i]);
      }
      return `<table style="border-collapse: collapse; width: 100%; margin: 12px 0; border: 1px solid #c0c0c0;">${tblHtml}</table>`;
    }

    // Paragraph
    if (tagName === 'w:p') {
      let styles = 'margin-bottom: 8px;';
      const pPr = node.getElementsByTagName('w:pPr')[0];
      if (pPr) {
        const jc = pPr.getElementsByTagName('w:jc')[0];
        if (jc) {
          const align = jc.getAttribute('w:val');
          if (align) styles += ` text-align: ${align};`;
        }
        const spacing = pPr.getElementsByTagName('w:spacing')[0];
        if (spacing) {
          const line = parseInt(spacing.getAttribute('w:line'));
          if (line) {
            styles += ` line-height: ${line / 240};`;
          }
        }
      }

      let pContent = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.tagName !== 'w:pPr') {
          pContent += await processNode(child);
        }
      }
      
      return `<p style="${styles}">${pContent || '&nbsp;'}</p>`;
    }

    // Run (formatted text)
    if (tagName === 'w:r') {
      let runStyles = '';
      const rPr = node.getElementsByTagName('w:rPr')[0];
      let isBold = false;
      let isItalic = false;
      let isUnderline = false;

      if (rPr) {
        const sz = rPr.getElementsByTagName('w:sz')[0];
        if (sz) {
          const sizeVal = parseInt(sz.getAttribute('w:val')) || 22;
          runStyles += ` font-size: ${Math.round(sizeVal * 0.5 * 1.33)}px;`;
        }
        const color = rPr.getElementsByTagName('w:color')[0];
        if (color) {
          const colorVal = color.getAttribute('w:val');
          if (colorVal && colorVal !== 'auto') {
            runStyles += ` color: #${colorVal};`;
          }
        }
        const rFonts = rPr.getElementsByTagName('w:rFonts')[0];
        if (rFonts) {
          const fontVal = rFonts.getAttribute('w:ascii') || rFonts.getAttribute('w:hAnsi');
          if (fontVal) {
            runStyles += ` font-family: '${fontVal}', sans-serif;`;
          }
        }
        const b = rPr.getElementsByTagName('w:b')[0];
        if (b && b.getAttribute('w:val') !== 'false' && b.getAttribute('w:val') !== '0') {
          isBold = true;
        }
        const it = rPr.getElementsByTagName('w:i')[0];
        if (it && it.getAttribute('w:val') !== 'false' && it.getAttribute('w:val') !== '0') {
          isItalic = true;
        }
        const u = rPr.getElementsByTagName('w:u')[0];
        if (u && u.getAttribute('w:val') !== 'none') {
          isUnderline = true;
        }
      }

      let runContent = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.tagName !== 'w:rPr') {
          runContent += await processNode(child);
        }
      }

      if (!runContent && !node.getElementsByTagName('w:drawing').length) return '';

      let out = runContent;
      if (isBold) out = `<strong>${out}</strong>`;
      if (isItalic) out = `<em>${out}</em>`;
      if (isUnderline) out = `<u>${out}</u>`;
      if (runStyles) {
        out = `<span style="${runStyles}">${out}</span>`;
      }
      return out;
    }

    if (tagName === 'w:t') {
      return node.textContent;
    }

    if (tagName === 'w:tab') {
      return '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    }

    if (tagName === 'w:drawing' || tagName === 'w:graphic' || tagName === 'w:pict') {
      const blips = node.getElementsByTagName('a:blip');
      let embedId = '';
      if (blips && blips.length > 0) {
        embedId = blips[0].getAttribute('r:embed') || blips[0].getAttribute('r:id');
      }
      if (!embedId) {
        const imageData = node.getElementsByTagName('v:imagedata');
        if (imageData && imageData.length > 0) {
          embedId = imageData[0].getAttribute('r:id') || imageData[0].getAttribute('r:href');
        }
      }
      if (embedId && relsMap[embedId]) {
        const b64 = await getBase64Image(relsMap[embedId]);
        if (b64) {
          let imgStyle = 'max-width: 100%; height: auto; display: inline-block; vertical-align: middle;';
          const extent = node.getElementsByTagName('wp:extent')[0];
          if (extent) {
            const cx = parseInt(extent.getAttribute('cx'));
            const cy = parseInt(extent.getAttribute('cy'));
            if (cx && cy) {
              const wPx = Math.round(cx / 9525);
              const hPx = Math.round(cy / 9525);
              imgStyle = `width: ${wPx}px; height: ${hPx}px; object-fit: contain; display: inline-block; vertical-align: middle;`;
            }
          } else {
            const shape = node.getElementsByTagName('v:shape')[0];
            if (shape) {
              const styleAttr = shape.getAttribute('style');
              if (styleAttr) {
                const wMatch = styleAttr.match(/width:\s*([\d\.]+)(pt|px|in)/i);
                const hMatch = styleAttr.match(/height:\s*([\d\.]+)(pt|px|in)/i);
                let wVal = '';
                let hVal = '';
                if (wMatch) {
                  const val = parseFloat(wMatch[1]);
                  const unit = wMatch[2].toLowerCase();
                  wVal = unit === 'pt' ? `${Math.round(val * 1.33)}px` : unit === 'in' ? `${Math.round(val * 96)}px` : `${val}px`;
                }
                if (hMatch) {
                  const val = parseFloat(hMatch[1]);
                  const unit = hMatch[2].toLowerCase();
                  hVal = unit === 'pt' ? `${Math.round(val * 1.33)}px` : unit === 'in' ? `${Math.round(val * 96)}px` : `${val}px`;
                }
                if (wVal && hVal) {
                  imgStyle = `width: ${wVal}; height: ${hVal}; object-fit: contain; display: inline-block; vertical-align: middle;`;
                }
              }
            }
          }
          return `<img src="${b64}" style="${imgStyle}" />`;
        }
      }
    }

    if (tagName === 'w:hyperlink') {
      const linkId = node.getAttribute('r:id');
      const href = linkId && relsMap[linkId] ? relsMap[linkId] : '#';
      let linkHtml = '';
      for (let i = 0; i < node.childNodes.length; i++) {
        linkHtml += await processNode(node.childNodes[i]);
      }
      return `<a href="${href}" class="doc-link" style="color: #2563eb; text-decoration: underline;">${linkHtml}</a>`;
    }

    let html = '';
    for (let i = 0; i < node.childNodes.length; i++) {
      html += await processNode(node.childNodes[i]);
    }
    return html;
  };

  let finalHtml = '';
  for (let i = 0; i < rootNode.childNodes.length; i++) {
    const child = rootNode.childNodes[i];
    if (child.tagName !== 'w:sectPr') {
      finalHtml += await processNode(child);
    }
  }

  return finalHtml;
}

/** 
 * High-fidelity client-side DOCX parser.
 * Reads Open XML relationships, document nodes, tables, paragraph styles, colors, and inline drawings,
 * and converts them directly into HTML with inline styles.
 */
export async function docxToHtml(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const relsMap = await getRelsMap(zip, 'word/document.xml');
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('Not a valid word document XML');
  const xmlStr = await docFile.async('text');
  return parseXmlToHtml(xmlStr, zip, relsMap);
}

