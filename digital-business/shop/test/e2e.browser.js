'use strict';
// Browser-Ende-zu-Ende-Test mit Playwright (nicht Teil von `npm test`, da ein Browser nötig ist).
// Aufruf: NODE_PATH=$(npm root -g) node --disable-warning=ExperimentalWarning test/e2e.browser.js <screenshot-ordner>
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium, devices } = require('playwright');
const { startShop, sessionEvent, linkFrom } = require('./helpers');

const out = path.resolve(process.argv[2] || 'e2e-screens');
fs.mkdirSync(out, { recursive: true });
const results = [];
const step = async (name, fn) => {
  try { await fn(); results.push(['OK', name]); } catch (e) { results.push(['FEHLER', name + ': ' + e.message]); }
};

(async () => {
  const shop = await startShop();
  const origCreate = shop.stripe.checkout.sessions.create;
  shop.stripe.checkout.sessions.create = async (...a) => ({ ...(await origCreate(...a)), url: shop.base + '/__stripe-checkout-attrappe' });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(e.message));

  let order;
  await step('Startseite lädt, Kauf-Button führt zur Produktseite', async () => {
    await page.goto(shop.base + '/');
    await page.screenshot({ path: path.join(out, '01-start-desktop.png') });
    await page.click('text=Ab 29 € einmalig');
    await page.waitForURL(/finanzcockpit#preise/);
  });
  await step('PRO wählen öffnet die Kasse', async () => {
    await page.click('a[href="/kasse/pro"]');
    await page.waitForURL(/\/kasse\/pro/);
    await page.screenshot({ path: path.join(out, '02-kasse.png'), fullPage: true });
  });
  await step('Absenden ohne AGB wird vom Browser bzw. Server verhindert', async () => {
    await page.fill('#email', 'e2e@example.org');
    await page.click('button[type=submit]');
    assert.match(page.url(), /\/kasse\/pro/);
    assert.equal(shop.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 0);
  });
  await step('Mit AGB und beiden Zustimmungen: Weiterleitung zu Stripe', async () => {
    await page.check('input[name=terms]');
    await page.check('input[name=early_start]');
    await page.check('input[name=early_knowledge]');
    await Promise.all([page.waitForURL(/__stripe-checkout-attrappe/), page.click('button[type=submit]')]);
    order = shop.db.prepare('SELECT * FROM orders').get();
    assert.equal(order.status, 'pending');
    assert.equal(order.consent_early_delivery, 1);
  });
  await step('Signierter Webhook schaltet frei, Danke-Seite zeigt Bestellnummer', async () => {
    const r = await shop.webhook(sessionEvent(shop, order));
    assert.equal(r.status, 200);
    await page.goto(`${shop.base}/bestellung/danke?nr=${order.order_number}`);
    assert.ok(await page.isVisible(`text=${order.order_number}`));
    await page.screenshot({ path: path.join(out, '03-danke.png') });
  });
  await step('Download über den Link aus der E-Mail', async () => {
    await shop.flushMail();
    const mail = shop.transport.sent.find((m) => /Bestellbestätigung/.test(m.subject));
    assert.ok(mail, 'Bestellbestätigung versendet');
    const link = linkFrom(mail.text, /http:\/\/127\.0\.0\.1:\d+\/downloads\/[A-Za-z0-9_-]+/);
    await page.goto(link);
    await page.screenshot({ path: path.join(out, '04-downloads.png') });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=herunterladen')]);
    assert.equal(dl.suggestedFilename(), 'Freikontor-Finanzcockpit-2026-PRO.zip');
    const file = path.join(out, 'download.zip');
    await dl.saveAs(file);
    assert.equal(fs.readFileSync(file, 'utf8'), 'PRO-ZIP');
    fs.unlinkSync(file);
  });
  await step('Rechnung ist im Browser abrufbar', async () => {
    const mail = shop.transport.sent.find((m) => /Bestellbestätigung/.test(m.subject));
    await page.goto(linkFrom(mail.text, /http:\/\/127\.0\.0\.1:\d+\/rechnung\/[A-Za-z0-9_-]+/));
    assert.ok(await page.isVisible('text=Gesamtbetrag (bezahlt)'));
    await page.screenshot({ path: path.join(out, '05-rechnung.png'), fullPage: true });
  });
  await step('Widerrufsfunktion zweistufig mit Bestätigungsseite', async () => {
    await page.goto(shop.base + '/vertrag-widerrufen');
    await page.fill('#w-name', 'E2E Test');
    await page.fill('#w-email', 'e2e@example.org');
    await page.fill('#w-order', order.order_number);
    await page.click('text=Weiter zur Bestätigung');
    await page.waitForSelector('text=Widerruf bestätigen');
    await page.click('text=Widerruf bestätigen');
    await page.waitForSelector('text=Dein Widerruf ist eingegangen');
    await page.screenshot({ path: path.join(out, '06-widerruf.png') });
  });
  await step('Rücklage-Rechner rechnet wie die Referenz (Tarif 2026)', async () => {
    await page.goto(shop.base + '/steuerruecklage-rechner');
    const cases = [[30000, 0, 6000, '2.587'], [24000, 38000, 7600, '7.797'], [60000, 0, 10000, '10.548']];
    for (const [g, a, sa, expected] of cases) {
      await page.fill('#c-gewinn', String(g));
      await page.fill('#c-andere', String(a));
      await page.fill('#c-sa', String(sa));
      const txt = await page.textContent('#r-mehr');
      assert.ok(txt.includes(expected), `${g}/${a}/${sa}: ${txt} erwartet ${expected}`);
    }
  });
  const phone = await browser.newPage({ ...devices['iPhone 13'] });
  phone.on('pageerror', (e) => consoleErrors.push(e.message));
  await step('Mobil: keine horizontale Scrollbar auf allen Hauptseiten, Menü funktioniert', async () => {
    for (const p of ['/', '/finanzcockpit', '/kasse/basis', '/faq', '/steuerruecklage-rechner', '/agb', '/datenschutz', '/vertrag-widerrufen']) {
      await phone.goto(shop.base + p);
      const w = await phone.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(w <= 390, `${p}: scrollWidth ${w}`);
    }
    await phone.goto(shop.base + '/');
    await phone.click('[data-menu]');
    assert.ok(await phone.isVisible('#mobile-nav a[href="/faq"]'));
    await phone.screenshot({ path: path.join(out, '07-mobil-menue.png') });
    await phone.goto(shop.base + '/finanzcockpit');
    await phone.screenshot({ path: path.join(out, '08-mobil-produkt.png') });
    await phone.goto(shop.base + '/kasse/basis');
    await phone.screenshot({ path: path.join(out, '09-mobil-kasse.png'), fullPage: true });
  });
  await step('Keine JavaScript- oder CSP-Fehler in der Konsole', async () => {
    assert.deepEqual(consoleErrors.filter((e) => !/favicon|status of (422|404)/.test(e)), []);
  });

  await browser.close();
  await shop.close();
  for (const [s, n] of results) console.log(`${s}  ${n}`);
  const failed = results.filter((r) => r[0] !== 'OK').length;
  console.log(`\n${results.length - failed}/${results.length} Schritte erfolgreich`);
  process.exit(failed ? 1 : 0);
})();
