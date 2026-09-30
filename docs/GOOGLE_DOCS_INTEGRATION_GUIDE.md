# Dommunity & Google Docs Integration Guide

This guide explains how to connect **Google Docs** with the **Dommunity Document Editor** and how to use the provided **Google Apps Script**.

---

## 🌟 Quick Overview

The integration allows you to:
1. **Directly open Google Docs** from the Dommunity Document Editor with 1 click (`docs.new` or a linked document).
2. **Copy formatted content** from Dommunity and paste it into Google Docs without losing headers, lists, or tables.
3. **Connect a Google Doc URL** to a specific report in Dommunity for easy back-and-forth collaboration.
4. **Use Google Apps Script** in Google Docs to:
   - Add a custom **Dommunity** menu to Google Docs.
   - Sync Google Docs documents straight into Dommunity's database (`narrative_reports` collection).
   - Import Dommunity reports directly into Google Docs.
   - Insert the official Dominican College of Tarlac CES Narrative Report template.
   - Optionally deploy as a Web App for automated bidirectional API sync.

---

## 🚀 How to Set Up the Google Apps Script in Google Docs

### Step 1: Open Google Docs
1. Go to [https://docs.new](https://docs.new) or open any existing Google Doc.

### Step 2: Open Google Apps Script Editor
1. In the Google Docs menu bar, click **Extensions** > **Apps Script**.
2. A new tab will open showing the Apps Script editor with a file named `Code.gs`.

### Step 3: Paste the Script
1. Delete any existing sample code inside `Code.gs`.
2. Copy the full script code from:
   `src/renderer/src/components/editor/google-docs/DommunityGoogleScript.js`
   *(or copy it directly using the "Copy Script" button inside the Dommunity Document Editor)*.
3. Paste the code into `Code.gs`.
4. Click the **Save** icon (💾 or `Ctrl + S` / `Cmd + S`).
5. (Optional) Rename the script project to **"Dommunity Sync"**.

### Step 4: Authorize and Refresh
1. Return to your Google Doc tab and refresh the page (`F5` or `Ctrl + R`).
2. After a few seconds, a new menu named **Dommunity** will appear in the top menu bar next to "Help".
3. Click **Dommunity** > **Sync Document to Dommunity** or **Insert CES Narrative Report Template**.
4. The first time you run any script action, Google will ask for permission:
   - Click **Continue**.
   - Choose your Google Account.
   - Click **Advanced** > **Go to Dommunity Sync (unsafe)**.
   - Click **Allow**.

---

## 📋 Features in the Google Docs "Dommunity" Menu

| Menu Item | Description |
| :--- | :--- |
| **📤 Sync Document to Dommunity** | Reads the active doc, formats it as HTML, and sends it directly to Dommunity's Firestore `narrative_reports` collection (or displays copyable payload). |
| **📥 Import Report from Dommunity** | Prompts for a Report ID and pulls the narrative report from Dommunity directly into Google Docs. |
| **📄 Insert CES Narrative Report Template** | Pre-populates the doc with the official Dominican College of Tarlac CES narrative structure (Title, Info Table, Objectives, Activities, Signatures). |
| **⚙️ Configure Dommunity / Firebase** | Configures Firebase Project ID (`VITE_FIREBASE_PROJECT_ID`) and API Key for direct Firestore synchronization. |
| **ℹ️ Help & Connection Info** | Displays connection info and active document status. |

---

## ⚡ (Optional) Deploying as a Web App for Automated API Sync

If you want the Dommunity desktop app to automatically create or update Google Docs via HTTP requests:

1. Inside the Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
3. Fill in the deployment details:
   - **Description**: `Dommunity API Sync`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(required for the desktop app to reach the endpoint)*
4. Click **Deploy** and copy the **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).
5. In the Dommunity Document Editor, click **Google Docs** > **Integration Settings**, and paste your Web App URL.
6. Now you can click **"Push to Google Docs"** to create a Google Doc directly from Dommunity!
