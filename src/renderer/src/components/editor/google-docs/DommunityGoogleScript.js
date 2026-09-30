/**
 * ============================================================================
 * DOMMUNITY GOOGLE DOCS INTEGRATION SCRIPT (Google Apps Script)
 * ============================================================================
 * 
 * This script connects your Google Docs with the Dommunity desktop application.
 * It provides:
 *  1. A custom "Dommunity" menu in Google Docs to:
 *     - 📤 Export/Sync your Google Doc to Dommunity (via Firebase Firestore)
 *     - 📥 Pull a report from Dommunity into Google Docs
 *     - 📄 Insert the official Dommunity CES Narrative Report template
 *     - ⚙️ Configure Firebase Project credentials
 *  2. A Web App endpoint (doPost / doGet) allowing Dommunity to push content
 *     directly to Google Docs and create new documents automatically.
 *
 * HOW TO INSTALL IN GOOGLE DOCS:
 *  1. Open any Google Doc (or create one at https://docs.new)
 *  2. In the top menu, click: Extensions > Apps Script
 *  3. Delete any default code in Code.gs and paste this entire script.
 *  4. Click the Save icon (Ctrl + S / Cmd + S).
 *  5. Refresh your Google Doc. A new "Dommunity" menu will appear in the top bar!
 * ============================================================================
 */

// ── DEFAULT CONFIGURATION ──
var DEFAULT_FIREBASE_PROJECT = 'dommunity-app'; // Replace with your Firebase Project ID if needed
var DEFAULT_COLLECTION = 'narrative_reports';

/**
 * Triggered automatically when the Google Doc is opened.
 * Adds the "Dommunity" menu to the Google Docs toolbar.
 */
function onOpen() {
  var ui = DocumentApp.getUi();
  ui.createMenu('Dommunity')
    .addItem('📤 Sync Document to Dommunity', 'exportToDommunity')
    .addItem('📥 Import Report from Dommunity', 'importFromDommunity')
    .addSeparator()
    .addItem('📄 Insert CES Narrative Report Template', 'insertDommunityTemplate')
    .addSeparator()
    .addItem('⚙️ Configure Dommunity / Firebase', 'configureDommunity')
    .addItem('ℹ️ Help & Connection Info', 'showHelpDialog')
    .addToUi();
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 1. EXPORT TO DOMMUNITY
 * ────────────────────────────────────────────────────────────────────────────
 * Reads the active document's title and contents, converts formatting
 * to clean HTML, and saves it into Dommunity's Firestore database.
 */
function exportToDommunity() {
  var ui = DocumentApp.getUi();
  var doc = DocumentApp.getActiveDocument();
  var title = doc.getName() || 'Untitled Dommunity Report';
  var body = doc.getBody();

  // Convert Google Doc contents to HTML
  var htmlContent = convertDocToHtml(body);

  var props = PropertiesService.getUserProperties();
  var projectId = props.getProperty('DOMMUNITY_PROJECT_ID') || DEFAULT_FIREBASE_PROJECT;
  var apiKey = props.getProperty('DOMMUNITY_API_KEY') || '';
  var reportId = props.getProperty('DOMMUNITY_CURRENT_REPORT_ID') || '';

  // Prompt the user for report action
  var promptResponse = ui.prompt(
    'Sync to Dommunity',
    'Enter target Report ID (or leave blank to create a new draft report in Dommunity):',
    ui.ButtonSet.OK_CANCEL
  );

  if (promptResponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  var inputReportId = promptResponse.getResponseText().trim();
  var targetReportId = inputReportId || reportId;

  // Attempt direct Firestore REST API sync
  try {
    var result = saveToFirestore(projectId, apiKey, targetReportId, {
      title: title,
      narrative: htmlContent,
      googleDocsUrl: doc.getUrl(),
      status: 'draft',
      updatedAt: new Date().toISOString()
    });

    if (result && result.success) {
      if (result.id) {
        props.setProperty('DOMMUNITY_CURRENT_REPORT_ID', result.id);
      }
      ui.alert(
        'Success',
        '✅ Successfully synced to Dommunity!\n\n' +
        'Report ID: ' + (result.id || targetReportId) + '\n' +
        'Title: ' + title + '\n\n' +
        'You can now view or submit this report inside the Dommunity desktop app.',
        ui.ButtonSet.OK
      );
      return;
    }
  } catch (err) {
    Logger.log('Direct Firestore sync failed: ' + err.toString());
  }

  // Fallback: If Firebase REST API is not directly accessible without auth,
  // display formatted HTML/JSON payload for one-click copy into Dommunity!
  showExportModal(title, htmlContent, doc.getUrl());
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 2. IMPORT FROM DOMMUNITY
 * ────────────────────────────────────────────────────────────────────────────
 * Pulls a report from Dommunity's Firestore database and inserts the content
 * directly into the active Google Doc.
 */
function importFromDommunity() {
  var ui = DocumentApp.getUi();
  var props = PropertiesService.getUserProperties();
  var projectId = props.getProperty('DOMMUNITY_PROJECT_ID') || DEFAULT_FIREBASE_PROJECT;
  var apiKey = props.getProperty('DOMMUNITY_API_KEY') || '';
  var lastReportId = props.getProperty('DOMMUNITY_CURRENT_REPORT_ID') || '';

  var promptResponse = ui.prompt(
    'Import from Dommunity',
    'Enter the Dommunity Report ID to import' + (lastReportId ? ' (default: ' + lastReportId + ')' : '') + ':',
    ui.ButtonSet.OK_CANCEL
  );

  if (promptResponse.getSelectedButton() !== ui.Button.OK) return;

  var reportId = promptResponse.getResponseText().trim() || lastReportId;
  if (!reportId) {
    ui.alert('Error', 'Please enter a valid Report ID.', ui.ButtonSet.OK);
    return;
  }

  try {
    var report = fetchFromFirestore(projectId, apiKey, reportId);
    if (!report) {
      ui.alert('Not Found', 'Could not find report with ID: ' + reportId, ui.ButtonSet.OK);
      return;
    }

    var doc = DocumentApp.getActiveDocument();
    if (report.title) {
      doc.setName(report.title);
    }

    var body = doc.getBody();
    // Ask if user wants to append or replace
    var replaceResponse = ui.alert(
      'Insert Content',
      'Do you want to replace all current document content with the Dommunity report?\n\n' +
      'Click YES to replace everything, or NO to append at the end.',
      ui.ButtonSet.YES_NO_CANCEL
    );

    if (replaceResponse === ui.Button.CANCEL) return;

    if (replaceResponse === ui.Button.YES) {
      body.clear();
    }

    // Insert title and metadata header
    var titlePar = body.appendParagraph(report.title || 'Dommunity Report');
    titlePar.setHeading(DocumentApp.ParagraphHeading.TITLE);

    if (report.reportType || report.academicYear || report.location) {
      var metaText = [];
      if (report.reportType) metaText.push('Type: ' + report.reportType);
      if (report.academicYear) metaText.push('A.Y.: ' + report.academicYear);
      if (report.semester) metaText.push('Semester: ' + report.semester);
      if (report.location) metaText.push('Venue: ' + report.location);
      var sub = body.appendParagraph(metaText.join(' | '));
      sub.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
      body.appendHorizontalRule();
    }

    // Parse narrative content and insert into Google Doc
    if (report.narrative) {
      insertHtmlIntoDoc(body, report.narrative);
    }

    props.setProperty('DOMMUNITY_CURRENT_REPORT_ID', reportId);
    ui.alert('Success', '✅ Dommunity report loaded successfully!', ui.ButtonSet.OK);

  } catch (err) {
    ui.alert('Import Failed', 'Failed to import report: ' + err.toString(), ui.ButtonSet.OK);
  }
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 3. INSERT CES NARRATIVE REPORT TEMPLATE
 * ────────────────────────────────────────────────────────────────────────────
 * Formats the active Google Doc with the official Dommunity CES Narrative
 * Report structure, complete with objectives, tables, and signature blocks.
 */
function insertDommunityTemplate() {
  var ui = DocumentApp.getUi();
  var confirm = ui.alert(
    'Insert Template',
    'Insert the official Dommunity Community Extension Service (CES) Narrative Report template into this document?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();

  // Header Title
  var header = body.appendParagraph('DOMINICAN COLLEGE OF TARLAC\nCOMMUNITY EXTENSION SERVICES (CES)\nOFFICIAL NARRATIVE REPORT');
  header.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  header.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendHorizontalRule();

  // Project Info Table
  var infoTable = body.appendTable([
    ['Project / Activity Title:', 'Community Literacy & Digital Empowerment Outreach'],
    ['Implementing Organization:', 'College Student Council & IT Society'],
    ['Target Beneficiaries:', 'Brgy. San Nicolas Residents & Youth Group'],
    ['Date & Venue of Implementation:', new Date().toLocaleDateString() + ' | Community Center'],
    ['Academic Year & Semester:', 'A.Y. 2025-2026 | 2nd Semester']
  ]);
  infoTable.setBorderColor('#CBD5E1');

  body.appendParagraph('');

  // Section 1: Executive Summary
  var s1 = body.appendParagraph('I. EXECUTIVE SUMMARY & BACKGROUND');
  s1.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(
    'Provide a brief narrative detailing the context, community needs addressed, and strategic rationale behind the activity. Highlight the Dominican charism of compassion, truth, and community service demonstrated during the execution.'
  );

  // Section 2: Objectives
  var s2 = body.appendParagraph('II. OBJECTIVES & ACHIEVED OUTCOMES');
  s2.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  var li1 = body.appendListItem('Equip 50+ participants with foundational digital skills.');
  li1.setGlyphType(DocumentApp.GlyphType.BULLET);
  var li2 = body.appendListItem('Foster active volunteerism and community solidarity among students.');
  li2.setGlyphType(DocumentApp.GlyphType.BULLET);
  var li3 = body.appendListItem('Establish sustainable community extension linkage with local barangay leaders.');
  li3.setGlyphType(DocumentApp.GlyphType.BULLET);

  // Section 3: Narrative of Activities
  var s3 = body.appendParagraph('III. DETAILED NARRATIVE & HIGHLIGHTS');
  s3.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph(
    'Document the chronological flow of activities, key speaker discussions, workshops, participant reactions, and notable milestones accomplished throughout the event.'
  );

  // Section 4: Photographic Evidence Placeholder
  var s4 = body.appendParagraph('IV. PHOTO DOCUMENTATION');
  s4.setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('[ Insert High-Resolution Activity Documentation Photos Here ]')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .setItalic(true);

  // Section 5: Signatories Table
  var s5 = body.appendParagraph('V. SIGNATORIES & ENDORSEMENTS');
  s5.setHeading(DocumentApp.ParagraphHeading.HEADING2);

  var sigTable = body.appendTable([
    ['Prepared by:', 'Checked by:', 'Approved by:'],
    ['\n\n___________________________\nProject Coordinator', '\n\n___________________________\nOrganization President', '\n\n___________________________\nCES Director / Dean']
  ]);
  sigTable.setBorderColor('#E2E8F0');

  ui.alert('Template Applied', '✅ CES Narrative Report template inserted successfully!', ui.ButtonSet.OK);
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 4. CONFIGURATION MODAL
 * ────────────────────────────────────────────────────────────────────────────
 */
function configureDommunity() {
  var ui = DocumentApp.getUi();
  var props = PropertiesService.getUserProperties();

  var currentProj = props.getProperty('DOMMUNITY_PROJECT_ID') || DEFAULT_FIREBASE_PROJECT;
  var currentKey = props.getProperty('DOMMUNITY_API_KEY') || '';

  var pPrompt = ui.prompt(
    'Configure Dommunity Firebase',
    'Enter your Firebase Project ID (currently: ' + currentProj + '):',
    ui.ButtonSet.OK_CANCEL
  );

  if (pPrompt.getSelectedButton() !== ui.Button.OK) return;
  var newProj = pPrompt.getResponseText().trim() || currentProj;
  props.setProperty('DOMMUNITY_PROJECT_ID', newProj);

  var kPrompt = ui.prompt(
    'Firebase Web API Key',
    'Enter Firebase Web API Key (optional, for Firestore REST API write access):',
    ui.ButtonSet.OK_CANCEL
  );

  if (kPrompt.getSelectedButton() === ui.Button.OK) {
    props.setProperty('DOMMUNITY_API_KEY', kPrompt.getResponseText().trim());
  }

  ui.alert('Saved', '✅ Dommunity settings updated successfully for project: ' + newProj, ui.ButtonSet.OK);
}

/**
 * Shows help and connectivity status
 */
function showHelpDialog() {
  var ui = DocumentApp.getUi();
  var props = PropertiesService.getUserProperties();
  var proj = props.getProperty('DOMMUNITY_PROJECT_ID') || DEFAULT_FIREBASE_PROJECT;
  var currentDoc = DocumentApp.getActiveDocument();

  var msg = 
    'Dommunity Google Docs Bridge\n' +
    '──────────────────────────────\n' +
    '• Connected Project: ' + proj + '\n' +
    '• Active Document ID: ' + currentDoc.getId() + '\n' +
    '• Active Document URL:\n  ' + currentDoc.getUrl() + '\n\n' +
    'FEATURES:\n' +
    '1. "Sync Document to Dommunity": Exports this Google Doc straight into Dommunity reports.\n' +
    '2. "Import Report from Dommunity": Loads existing reports from Dommunity into this Doc.\n' +
    '3. "Insert CES Template": Applies the official Dominican College of Tarlac narrative format.\n\n' +
    'Need two-way automated sync? Deploy this Apps Script as a Web App (Deploy > New Deployment > Web App) ' +
    'and paste the Web App URL into the Dommunity Document Editor.';

  ui.alert('Dommunity Integration Info', msg, ui.ButtonSet.OK);
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * 5. WEB APP API ENDPOINTS (doPost / doGet)
 * ────────────────────────────────────────────────────────────────────────────
 * When deployed as a Web App, Dommunity desktop app can send HTTP POST
 * requests to create or update Google Docs directly.
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: 'Dommunity Google Docs Bridge',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    var action = data.action || 'create_doc';

    if (action === 'create_doc') {
      var title = data.title || 'Dommunity Report - ' + new Date().toLocaleDateString();
      var doc = DocumentApp.create(title);
      var body = doc.getBody();

      if (data.author) {
        var authPar = body.appendParagraph('Author: ' + data.author + ' | Created via Dommunity');
        authPar.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
        body.appendHorizontalRule();
      }

      if (data.html) {
        insertHtmlIntoDoc(body, data.html);
      } else if (data.text) {
        body.appendParagraph(data.text);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        docId: doc.getId(),
        docUrl: doc.getUrl(),
        title: title
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'update_doc' && data.docId) {
      var doc = DocumentApp.openById(data.docId);
      var body = doc.getBody();

      if (data.replace) {
        body.clear();
      }

      if (data.html) {
        insertHtmlIntoDoc(body, data.html);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        docId: doc.getId(),
        docUrl: doc.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * HELPER: CONVERT GOOGLE DOC BODY TO CLEAN HTML (FOR DOMMUNITY)
 * ────────────────────────────────────────────────────────────────────────────
 */
function convertDocToHtml(body) {
  var html = [];
  var numChildren = body.getNumChildren();

  for (var i = 0; i < numChildren; i++) {
    var child = body.getChild(i);
    var type = child.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH) {
      var p = child.asParagraph();
      var heading = p.getHeading();
      var text = p.getText();

      if (!text.trim() && heading === DocumentApp.ParagraphHeading.NORMAL) {
        html.push('<p><br></p>');
        continue;
      }

      var innerHtml = escapeHtml(text);
      if (heading === DocumentApp.ParagraphHeading.TITLE || heading === DocumentApp.ParagraphHeading.HEADING1) {
        html.push('<h1>' + innerHtml + '</h1>');
      } else if (heading === DocumentApp.ParagraphHeading.HEADING2) {
        html.push('<h2>' + innerHtml + '</h2>');
      } else if (heading === DocumentApp.ParagraphHeading.HEADING3) {
        html.push('<h3>' + innerHtml + '</h3>');
      } else {
        html.push('<p>' + innerHtml + '</p>');
      }

    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      var item = child.asListItem();
      html.push('<ul><li>' + escapeHtml(item.getText()) + '</li></ul>');

    } else if (type === DocumentApp.ElementType.TABLE) {
      var table = child.asTable();
      var tHtml = ['<table style="border: 1px solid #ddd; width: 100%; border-collapse: collapse;">'];
      for (var r = 0; r < table.getNumRows(); r++) {
        tHtml.push('<tr>');
        var row = table.getRow(r);
        for (var c = 0; c < row.getNumCells(); c++) {
          var cell = row.getCell(c);
          var isHeader = (r === 0);
          var tag = isHeader ? 'th' : 'td';
          tHtml.push('<' + tag + ' style="border: 1px solid #ddd; padding: 6px 10px;">' + escapeHtml(cell.getText()) + '</' + tag + '>');
        }
        tHtml.push('</tr>');
      }
      tHtml.push('</table>');
      html.push(tHtml.join(''));

    } else if (type === DocumentApp.ElementType.HORIZONTAL_RULE) {
      html.push('<hr />');
    }
  }

  return html.join('\n');
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * HELPER: INSERT HTML INTO GOOGLE DOC BODY
 * ────────────────────────────────────────────────────────────────────────────
 */
function insertHtmlIntoDoc(body, html) {
  if (!html) return;

  // Basic HTML parser for Google Docs
  // Splits by major block tags
  var cleaned = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ');

  var blocks = cleaned.split(/<\/(?:p|h1|h2|h3|h4|li|tr)>/i);

  blocks.forEach(function(block) {
    var raw = block.trim();
    if (!raw) return;

    var isH1 = /<h1[^>]*>/i.test(raw);
    var isH2 = /<h2[^>]*>/i.test(raw);
    var isH3 = /<h3[^>]*>/i.test(raw);
    var isLi = /<li[^>]*>/i.test(raw);

    // Strip remaining tags for text insertion
    var text = raw.replace(/<[^>]*>/g, '').trim();
    if (!text) return;

    if (isH1) {
      var p = body.appendParagraph(text);
      p.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    } else if (isH2) {
      var p = body.appendParagraph(text);
      p.setHeading(DocumentApp.ParagraphHeading.HEADING2);
    } else if (isH3) {
      var p = body.appendParagraph(text);
      p.setHeading(DocumentApp.ParagraphHeading.HEADING3);
    } else if (isLi) {
      body.appendListItem(text);
    } else {
      body.appendParagraph(text);
    }
  });
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * HELPER: FIRESTORE REST API (READ & WRITE DIRECTLY TO DOMMUNITY DATABASE)
 * ────────────────────────────────────────────────────────────────────────────
 */
function saveToFirestore(projectId, apiKey, reportId, data) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + DEFAULT_COLLECTION;
  if (reportId) {
    url += '/' + reportId + (apiKey ? '?key=' + apiKey : '');
  } else if (apiKey) {
    url += '?key=' + apiKey;
  }

  var fields = {};
  for (var k in data) {
    fields[k] = { stringValue: String(data[k]) };
  }

  var options = {
    method: reportId ? 'patch' : 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ fields: fields }),
    muteHttpExceptions: true
  };

  var res = UrlFetchApp.fetch(url, options);
  var code = res.getResponseCode();
  if (code >= 200 && code < 300) {
    var json = JSON.parse(res.getContentText());
    var docName = json.name || '';
    var newId = docName.split('/').pop();
    return { success: true, id: newId };
  }

  throw new Error('Firestore API returned HTTP ' + code + ': ' + res.getContentText());
}

function fetchFromFirestore(projectId, apiKey, reportId) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/' + DEFAULT_COLLECTION + '/' + reportId;
  if (apiKey) url += '?key=' + apiKey;

  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) return null;

  var json = JSON.parse(res.getContentText());
  var result = { id: reportId };
  if (json.fields) {
    for (var k in json.fields) {
      var valObj = json.fields[k];
      result[k] = valObj.stringValue || valObj.integerValue || valObj.booleanValue || '';
    }
  }
  return result;
}

function showExportModal(title, html, docUrl) {
  var output = HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif; padding:16px;">' +
    '<h3>Ready to Sync to Dommunity</h3>' +
    '<p>Copy the HTML content below and paste it into Dommunity Document Editor:</p>' +
    '<textarea style="width:100%; height:160px; font-size:11px; padding:8px; border:1px solid #ccc; border-radius:6px;" readonly>' +
    escapeHtml(html) +
    '</textarea>' +
    '<br><br>' +
    '<button onclick="navigator.clipboard.writeText(document.querySelector(\'textarea\').value); alert(\'Copied!\');" ' +
    'style="padding:8px 16px; background:#1e3a8a; color:white; border:none; border-radius:6px; cursor:pointer;">' +
    '📋 Copy HTML to Clipboard' +
    '</button>' +
    '<p style="font-size:11px; color:#666; margin-top:12px;">Google Doc Link: <a href="' + docUrl + '" target="_blank">' + docUrl + '</a></p>' +
    '</body></html>'
  ).setWidth(520).setHeight(360);

  DocumentApp.getUi().showModalDialog(output, 'Dommunity Sync Content');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
