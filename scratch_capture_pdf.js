const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join('C:', 'Users', 'JOHN HAROLD SANTOS', '.gemini', 'antigravity-ide', 'brain', '2ecacd1b-e2bb-4ea0-8ca9-2d36ba2c9409');
const pdfPath = path.join(OUTPUT_DIR, 'test_absolute_shift_output.pdf');

app.whenReady().then(async () => {
  console.log('=== CAPTURING PDF SCREENSHOTS VIA ELECTRON PDF VIEWER ===');
  
  const win = new BrowserWindow({
    width: 850,
    height: 1300,
    show: false,
    webPreferences: {
      plugins: true
    }
  });

  try {
    await win.loadURL(`file://${pdfPath}`);
    await new Promise(r => setTimeout(r, 3000)); // wait for pdf viewer to load

    const image = await win.webContents.capturePage();
    const outImg = path.join(OUTPUT_DIR, 'pdf_rendered_page1.png');
    fs.writeFileSync(outImg, image.toPNG());
    console.log(`Saved PDF page 1 screenshot to: ${outImg}`);
    
  } catch (err) {
    console.error(err);
  } finally {
    win.destroy();
    app.quit();
  }
});
