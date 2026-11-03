// Rendert die HTML-Dokumente des Produkts als PDF (Chromium über Playwright).
// Aufruf: node render_pdfs.js
const path = require('path');
const { chromium } = require('playwright');

const SRC = path.resolve(__dirname, '../docs-src');
const DIST = path.resolve(__dirname, '../dist');
const footer = `<div style="width:100%;font:8px Inter,sans-serif;color:#6B7280;padding:0 16mm;display:flex;justify-content:space-between">
  <span>Freikontor Finanzcockpit 2026</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const jobs = [
  ['handbuch.html', ['basis/Handbuch.pdf', 'pro/Handbuch.pdf']],
  ['schnellstart.html', ['basis/Schnellstart.pdf', 'pro/Schnellstart.pdf']],
  ['checklisten.html', ['pro/Checklisten.pdf']],
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [file, outs] of jobs) {
    await page.goto('file://' + path.join(SRC, file), { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    for (const out of outs) {
      await page.pdf({
        path: path.join(DIST, out), format: 'A4', printBackground: true,
        displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: footer,
        margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
      });
      console.log('pdf', out);
    }
  }
  await browser.close();
})();
