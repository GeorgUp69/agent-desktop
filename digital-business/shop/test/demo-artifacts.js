'use strict';
// Erzeugt Beispiel-E-Mails und einen Dashboard-Screenshot aus einem simulierten Testlauf (Testdaten, keine echten Kunden).
// Aufruf: NODE_PATH=$(npm root -g) node --disable-warning=ExperimentalWarning test/demo-artifacts.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { startShop, sessionEvent, placeOrder } = require('./helpers');

const ROOT = path.resolve(__dirname, '../..');
(async () => {
  const shop = await startShop();
  const a = await placeOrder(shop, 'pro', { email: 'testkunde-a@example.org' });
  await shop.webhook(sessionEvent(shop, a.order));
  const b = await placeOrder(shop, 'basis', { email: 'testkunde-b@example.org', early_start: '', early_knowledge: '' });
  await shop.webhook(sessionEvent(shop, b.order));
  const c = await placeOrder(shop, 'basis', { email: 'testkunde-c@example.org' });
  await shop.webhook(sessionEvent(shop, c.order));
  await shop.webhook({ id: 'evt_r', type: 'charge.refunded', data: { object: { payment_intent: 'pi_' + c.order.id, amount: 2900, amount_refunded: 2900 } } });
  await shop.post('/meine-downloads', { email: 'testkunde-a@example.org' });
  await shop.post('/vertrag-widerrufen', { name: 'Test Person', email: 'testkunde-b@example.org', order_number: b.order.order_number, statement: 'Hiermit widerrufe ich den Vertrag.', step: '2' });
  await shop.post('/newsletter', { email: 'testkunde-a@example.org', consent: '1' });
  for (const p of ['/', '/finanzcockpit', '/finanzcockpit', '/']) await shop.get(p);
  shop.db.prepare("INSERT INTO ad_spend(day, channel, amount_cents, note, created_at) VALUES (date('now'), 'TikTok Ads', 1500, 'Testeintrag', datetime('now'))").run();

  const outDir = path.join(ROOT, 'emails', 'beispiele');
  fs.mkdirSync(outDir, { recursive: true });
  const mails = shop.db.prepare('SELECT kind, to_addr, subject, text FROM outbox ORDER BY id').all();
  const seen = new Set();
  for (const m of mails) {
    const key = m.kind + (m.kind === 'order_confirmation' ? (m.text.includes('/downloads/') ? '-sofort' : '-nach-widerrufsfrist') : '');
    if (seen.has(key)) continue;
    seen.add(key);
    const text = m.text.replace(/http:\/\/127\.0\.0\.1:\d+/g, 'https://www.deine-domain.de');
    fs.writeFileSync(path.join(outDir, `${key}.txt`), `An: ${m.to_addr}\nBetreff: ${m.subject}\n\n${text}\n`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1320, height: 900 }, httpCredentials: { username: 'admin', password: 'sehr-geheimes-passwort' } });
  await page.goto(shop.base + '/admin');
  fs.mkdirSync(path.join(ROOT, 'dashboard'), { recursive: true });
  await page.screenshot({ path: path.join(ROOT, 'dashboard', 'admin-dashboard-testdaten.png'), fullPage: true });
  await browser.close();
  await shop.close();
  console.log('E-Mails:', [...seen].join(', '));
})();
