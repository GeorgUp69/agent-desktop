'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startShop, sessionEvent, placeOrder, linkFrom, fakeTransport } = require('./helpers');
const { loadConfig, assertProductionReady } = require('../src/config');
const { PUBLIC_PAGES } = require('../src/app');

describe('Seiten, Links und Sicherheit', () => {
  let shop;
  before(async () => { shop = await startShop(); });
  after(() => shop.close());

  test('alle öffentlichen Seiten antworten mit 200 und haben Titel und Meta-Beschreibung', async () => {
    for (const p of PUBLIC_PAGES) {
      const r = await shop.get(p);
      assert.equal(r.status, 200, p);
      const body = await r.text();
      assert.match(body, /<title>[^<]{5,}<\/title>/, p);
      assert.match(body, /<meta name="description" content="[^"]{20,}">/, p);
      assert.match(body, /<link rel="canonical"/, p);
    }
  });

  test('alle internen Links aller Seiten sind erreichbar', async () => {
    const seen = new Set();
    for (const p of PUBLIC_PAGES) {
      const body = await (await shop.get(p)).text();
      for (const m of body.matchAll(/href="(\/[^"#?]*)/g)) seen.add(m[1]);
      for (const m of body.matchAll(/src="(\/[^"?]+)/g)) seen.add(m[1]);
      for (const m of body.matchAll(/srcset="(\/[^" ]+)/g)) seen.add(m[1]);
    }
    for (const link of seen) {
      const r = await shop.get(link);
      assert.ok(r.status === 200, `${link} -> ${r.status}`);
    }
    assert.ok(seen.size > 30);
  });

  test('Footer enthält Widerrufsfunktion, Impressum, Datenschutz und keinen OS-Plattform-Link', async () => {
    const body = await (await shop.get('/')).text();
    assert.match(body, /href="\/vertrag-widerrufen">Vertrag widerrufen</);
    assert.match(body, /href="\/impressum"/);
    assert.match(body, /href="\/datenschutz"/);
    assert.doesNotMatch(body, /ec\.europa\.eu\/consumers\/odr/);
  });

  test('Sicherheits-Header sind gesetzt', async () => {
    const r = await shop.get('/');
    assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.equal(r.headers.get('x-powered-by'), null);
  });

  test('ohne Pixel-ID wird kein Tracking geladen und kein Banner gezeigt', async () => {
    const body = await (await shop.get('/')).text();
    assert.doesNotMatch(body, /data-pixel/);
    assert.doesNotMatch(body, /id="consent"/);
  });

  test('Kleinunternehmer-Preisangabe ohne „inkl. MwSt.“', async () => {
    const body = await (await shop.get('/finanzcockpit')).text();
    assert.match(body, /Gemäß § 19 UStG wird keine Umsatzsteuer berechnet/);
    assert.doesNotMatch(body, /inkl\. 19 % USt/);
    assert.match(body, /29 €/);
    assert.match(body, /49 €/);
  });

  test('strukturierte Daten: Product mit Angeboten, ohne Bewertungen', async () => {
    const body = await (await shop.get('/finanzcockpit')).text();
    const blocks = [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    const product = blocks.find((b) => b['@type'] === 'Product');
    assert.ok(product);
    assert.equal(product.offers.length, 2);
    assert.equal(product.aggregateRating, undefined);
    assert.equal(product.review, undefined);
  });

  test('POST ohne passenden Origin wird abgelehnt', async () => {
    const r = await shop.post('/kontakt', { name: 'A', email: 'a@example.org', message: 'Hallo Test' }, { origin: 'https://evil.example' });
    assert.equal(r.status, 403);
  });

  test('robots.txt und sitemap.xml', async () => {
    assert.match(await (await shop.get('/robots.txt')).text(), /Disallow: \/downloads\//);
    const sm = await (await shop.get('/sitemap.xml')).text();
    assert.match(sm, /\/finanzcockpit<\/loc>/);
    assert.doesNotMatch(sm, /\/admin/);
  });

  test('Admin nur mit Passwort', async () => {
    assert.equal((await shop.get('/admin')).status, 401);
    const auth = 'Basic ' + Buffer.from('admin:falsch').toString('base64');
    assert.equal((await shop.get('/admin', { authorization: auth })).status, 401);
    const ok = 'Basic ' + Buffer.from('admin:sehr-geheimes-passwort').toString('base64');
    const r = await shop.get('/admin', { authorization: ok });
    assert.equal(r.status, 200);
    assert.match(await r.text(), /Shop-Dashboard/);
  });
});

describe('Bestellprozess und Rechtliches im Checkout', () => {
  let shop;
  before(async () => { shop = await startShop(); });
  after(() => shop.close());

  test('Checkout-Seite hat Button „Zahlungspflichtig bestellen“ und ungesetzte Checkboxen', async () => {
    const body = await (await shop.get('/kasse/basis')).text();
    assert.match(body, />Zahlungspflichtig bestellen</);
    for (const name of ['terms', 'early_start', 'early_knowledge']) {
      const tag = body.match(new RegExp(`<input type="checkbox" name="${name}"[^>]*>`))[0];
      assert.doesNotMatch(tag, /checked/, name);
    }
    assert.match(body, /Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist/);
    assert.match(body, /Mir ist bekannt, dass ich durch diese Zustimmung/);
  });

  test('ohne AGB-Häkchen keine Bestellung', async () => {
    const r = await shop.post('/kasse/basis', { email: 'kunde@example.org' });
    assert.equal(r.status, 422);
    assert.equal(shop.db.prepare('SELECT COUNT(*) n FROM orders').get().n, 0);
  });

  test('nur eines der beiden Widerrufs-Häkchen wird abgelehnt', async () => {
    const r = await shop.post('/kasse/basis', { email: 'kunde@example.org', terms: '1', early_start: '1' });
    assert.equal(r.status, 422);
    assert.match(await r.text(), /beide Häkchen/);
  });

  test('ungültige E-Mail wird abgelehnt', async () => {
    const r = await shop.post('/kasse/basis', { email: 'kein-mail', terms: '1' });
    assert.equal(r.status, 422);
  });

  test('gültige Bestellung leitet zu Stripe weiter und speichert Zustimmungen', async () => {
    const { res, order } = await placeOrder(shop, 'pro');
    assert.equal(res.status, 303);
    assert.match(res.headers.get('location'), /^https:\/\/checkout\.stripe\.com\//);
    assert.equal(order.status, 'pending');
    assert.equal(order.consent_early_delivery, 1);
    assert.equal(order.price_cents, 4900);
    const s = shop.stripe.calls.sessions.at(-1);
    assert.equal(s.params.line_items[0].price_data.unit_amount, 4900);
    assert.equal(s.params.locale, 'de');
    assert.equal(s.params.metadata.order_id, order.id);
    assert.equal(s.opts.idempotencyKey, `checkout-${order.id}`);
  });

  test('Upgrade nur mit passender bezahlter Basis-Bestellung', async () => {
    const r = await shop.post('/kasse/upgrade', { email: 'kunde@example.org', terms: '1', upgrade_of: 'FK-NICH-TDA0' });
    assert.equal(r.status, 422);
    const { order } = await placeOrder(shop, 'basis');
    await shop.webhook(sessionEvent(shop, order));
    const wrongMail = await shop.post('/kasse/upgrade', { email: 'andere@example.org', terms: '1', upgrade_of: order.order_number });
    assert.equal(wrongMail.status, 422);
    const ok = await shop.post('/kasse/upgrade', { email: 'kunde@example.org', terms: '1', upgrade_of: order.order_number.toLowerCase() });
    assert.equal(ok.status, 303);
    assert.equal(shop.stripe.calls.sessions.at(-1).params.line_items[0].price_data.unit_amount, 2000);
  });
});

describe('Zahlung, Webhooks und Auslieferung', () => {
  let shop;
  before(async () => { shop = await startShop(); });
  after(() => shop.close());

  test('Webhook mit falscher Signatur wird abgelehnt und schaltet nichts frei', async () => {
    const { order } = await placeOrder(shop);
    const r = await shop.webhook(sessionEvent(shop, order), 'whsec_falsch');
    assert.equal(r.status, 400);
    assert.equal(shop.orders.byId(order.id).status, 'pending');
  });

  test('bezahlte Session liefert genau einmal aus – auch bei doppelten und wiederholten Events', async () => {
    const { order } = await placeOrder(shop);
    const ev = sessionEvent(shop, order, { id: 'evt_dupe_1' });
    assert.equal((await shop.webhook(ev)).status, 200);
    assert.equal((await shop.webhook(ev)).status, 200);
    assert.equal((await shop.webhook(sessionEvent(shop, order, { id: 'evt_dupe_2', type: 'checkout.session.async_payment_succeeded' }))).status, 200);
    const o = shop.orders.byId(order.id);
    assert.equal(o.status, 'delivered');
    assert.match(o.invoice_number, /^FK-\d{4}-\d{5}$/);
    assert.equal(o.billing_country, 'DE');
    const mails = shop.db.prepare(`SELECT * FROM outbox WHERE kind = 'order_confirmation' AND to_addr = ? AND dedupe_key = ?`).all(o.email, `confirm:${o.id}`);
    assert.equal(mails.length, 1);
    assert.match(mails[0].text, /\/downloads\/[A-Za-z0-9_-]{40,}/);
    assert.match(mails[0].text, /Widerrufsrecht ist damit erloschen/);
    assert.match(mails[0].text, /ALLGEMEINE GESCHÄFTSBEDINGUNGEN/);
    assert.match(mails[0].text, /Muster-Widerrufsformular/);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(shop.orders.byId(order.id).stripe_fee_cents, 69);
  });

  test('Download-Link funktioniert, Rechnung ist abrufbar, falsche Tokens nicht', async () => {
    const { order } = await placeOrder(shop);
    await shop.webhook(sessionEvent(shop, order));
    const mail = shop.db.prepare(`SELECT text FROM outbox WHERE dedupe_key = ?`).get(`confirm:${order.id}`).text;
    const link = linkFrom(mail, /http:\/\/127\.0\.0\.1:\d+\/downloads\/[A-Za-z0-9_-]+/);
    const page = await fetch(link);
    assert.equal(page.status, 200);
    const file = await fetch(link + '/datei/paket');
    assert.equal(file.status, 200);
    assert.equal(await file.text(), 'BASIS-ZIP');
    assert.match(file.headers.get('content-disposition'), /Freikontor-Finanzcockpit-2026-Basis\.zip/);
    assert.equal((await fetch(link + 'x')).status, 404);
    assert.equal((await fetch(link + '/datei/../../etc/passwd')).status, 404);
    const inv = linkFrom(mail, /http:\/\/127\.0\.0\.1:\d+\/rechnung\/[A-Za-z0-9_-]+/);
    const invBody = await (await fetch(inv)).text();
    assert.match(invBody, /Rechnung FK-\d{4}-\d{5}/);
    assert.match(invBody, /Gemäß § 19 UStG wird keine Umsatzsteuer berechnet/);
  });

  test('Betrag oder Währung passen nicht: keine Freischaltung', async () => {
    const { order } = await placeOrder(shop);
    await shop.webhook(sessionEvent(shop, order, { amount_total: order.price_cents + 100 }));
    assert.equal(shop.orders.byId(order.id).status, 'pending');
    await shop.webhook(sessionEvent(shop, order, { currency: 'usd' }));
    assert.equal(shop.orders.byId(order.id).status, 'pending');
    await shop.webhook(sessionEvent(shop, order, { sessionId: 'cs_fremd' }));
    assert.equal(shop.orders.byId(order.id).status, 'pending');
  });

  test('verzögerte Zahlung (z. B. Lastschrift): erst nach Bestätigung ausliefern, Fehlschlag liefert nie aus', async () => {
    const { order } = await placeOrder(shop);
    await shop.webhook(sessionEvent(shop, order, { payment_status: 'unpaid' }));
    assert.equal(shop.orders.byId(order.id).status, 'processing');
    assert.equal(shop.db.prepare('SELECT COUNT(*) n FROM access_tokens WHERE order_id = ?').get(order.id).n, 0);
    await shop.webhook(sessionEvent(shop, order, { type: 'checkout.session.async_payment_succeeded' }));
    assert.equal(shop.orders.byId(order.id).status, 'delivered');

    const second = await placeOrder(shop);
    await shop.webhook(sessionEvent(shop, second.order, { payment_status: 'unpaid' }));
    await shop.webhook(sessionEvent(shop, second.order, { type: 'checkout.session.async_payment_failed' }));
    assert.equal(shop.orders.byId(second.order.id).status, 'failed');
    await shop.webhook(sessionEvent(shop, second.order, { type: 'checkout.session.async_payment_succeeded' }));
    assert.equal(shop.orders.byId(second.order.id).status, 'failed');
  });

  test('Erstattung sperrt den Zugang', async () => {
    const { order } = await placeOrder(shop);
    await shop.webhook(sessionEvent(shop, order));
    const mail = shop.db.prepare(`SELECT text FROM outbox WHERE dedupe_key = ?`).get(`confirm:${order.id}`).text;
    const link = linkFrom(mail, /http:\/\/127\.0\.0\.1:\d+\/downloads\/[A-Za-z0-9_-]+/);
    assert.equal((await fetch(link)).status, 200);
    await shop.webhook({ id: 'evt_refund_1', type: 'charge.refunded', data: { object: { payment_intent: 'pi_' + order.id, amount: 2900, amount_refunded: 2900 } } });
    assert.equal(shop.orders.byId(order.id).status, 'refunded');
    assert.equal((await fetch(link)).status, 410);
    assert.equal(shop.db.prepare(`SELECT COUNT(*) n FROM outbox WHERE kind = 'refund'`).get().n, 1);
  });

  test('Meine Downloads: neue Links nur für ausgelieferte Bestellungen, gleiche Antwort für unbekannte Adressen', async () => {
    const before = shop.db.prepare(`SELECT COUNT(*) n FROM outbox WHERE kind = 'access_link'`).get().n;
    const known = await (await shop.post('/meine-downloads', { email: 'kunde@example.org' })).text();
    const unknown = await (await shop.post('/meine-downloads', { email: 'niemand@example.org' })).text();
    assert.match(known, /ist die E-Mail unterwegs/);
    assert.match(unknown, /ist die E-Mail unterwegs/);
    const after = shop.db.prepare(`SELECT COUNT(*) n FROM outbox WHERE kind = 'access_link'`).get().n;
    assert.equal(after - before, 1);
  });

  test('Download-Limit pro Datei greift', async () => {
    const { order } = await placeOrder(shop);
    await shop.webhook(sessionEvent(shop, order));
    for (let i = 0; i < shop.cfg.maxDownloadsPerFile; i++) assert.equal(shop.orders.countDownload(order.id, 'paket'), true);
    assert.equal(shop.orders.countDownload(order.id, 'paket'), false);
  });
});

describe('Ohne Zustimmung: Auslieferung erst nach Ablauf der Widerrufsfrist', () => {
  let shop;
  let now = new Date('2026-11-03T10:00:00Z');
  before(async () => { shop = await startShop({ clock: () => now }); });
  after(() => shop.close());

  test('bezahlt, aber kein Link bis Fristende; dann automatische Auslieferung', async () => {
    const { order } = await placeOrder(shop, 'basis', { early_start: '', early_knowledge: '' });
    assert.equal(order.consent_early_delivery, 0);
    await shop.webhook(sessionEvent(shop, order));
    let o = shop.orders.byId(order.id);
    assert.equal(o.status, 'paid');
    assert.equal(shop.db.prepare('SELECT COUNT(*) n FROM access_tokens WHERE order_id = ? AND token_hash NOT IN (SELECT token_hash FROM access_tokens WHERE expires_at LIKE \'9999%\')').get(order.id).n, 0);
    const conf = shop.db.prepare('SELECT text FROM outbox WHERE dedupe_key = ?').get(`confirm:${order.id}`).text;
    assert.match(conf, /Dein 14-tägiges Widerrufsrecht bleibt daher bestehen/);
    assert.doesNotMatch(conf, /\/downloads\//);
    now = new Date('2026-11-16T10:00:00Z');
    assert.equal(shop.orders.deliverDue(), 0);
    now = new Date('2026-11-18T10:01:00Z');
    assert.equal(shop.orders.deliverDue(), 1);
    assert.equal(shop.orders.deliverDue(), 0);
    o = shop.orders.byId(order.id);
    assert.equal(o.status, 'delivered');
    assert.match(shop.db.prepare('SELECT text FROM outbox WHERE dedupe_key = ?').get(`delivery:${order.id}`).text, /\/downloads\//);
  });

  test('Widerruf vor Auslieferung: Eingangsbestätigung, automatische Erstattung, keine spätere Auslieferung', async () => {
    now = new Date('2026-11-20T10:00:00Z');
    const { order } = await placeOrder(shop, 'pro', { early_start: '', early_knowledge: '' });
    await shop.webhook(sessionEvent(shop, order));
    const step1 = await shop.post('/vertrag-widerrufen', { name: 'Kim', email: 'kunde@example.org', order_number: order.order_number, statement: 'Ich widerrufe.', step: '1' });
    assert.match(await step1.text(), />Widerruf bestätigen</);
    assert.equal(shop.db.prepare('SELECT COUNT(*) n FROM withdrawals').get().n, 0);
    const step2 = await shop.post('/vertrag-widerrufen', { name: 'Kim', email: 'kunde@example.org', order_number: order.order_number, statement: 'Ich widerrufe.', step: '2' });
    assert.match(await step2.text(), /Dein Widerruf ist eingegangen/);
    const w = shop.db.prepare('SELECT * FROM withdrawals').get();
    assert.ok(w.received_at);
    assert.match(shop.db.prepare(`SELECT text FROM outbox WHERE kind = 'withdrawal_receipt'`).get().text, /Eingang deines Widerrufs/);
    assert.equal(shop.stripe.calls.refunds.length, 1);
    assert.equal(shop.stripe.calls.refunds[0].params.payment_intent, 'pi_' + order.id);
    now = new Date('2026-12-20T10:00:00Z');
    shop.orders.deliverDue();
    assert.notEqual(shop.orders.byId(order.id).status, 'delivered');
  });
});

describe('E-Mail-Warteschlange', () => {
  test('SMTP-Ausfall: Wiederholung, keine verlorene Mail, kein Duplikat', async () => {
    const transport = fakeTransport({ failTimes: 2 });
    const shop = await startShop({ transport });
    try {
      const { order } = await placeOrder(shop);
      await shop.webhook(sessionEvent(shop, order));
      await shop.mailer.processQueue(new Date());
      assert.equal(transport.sent.length, 0);
      await shop.flushMail();
      await shop.flushMail();
      await shop.flushMail();
      const confirm = transport.sent.filter((m) => /Bestellbestätigung/.test(m.subject));
      assert.equal(confirm.length, 1);
      assert.equal(confirm[0].to, 'kunde@example.org');
      assert.match(confirm[0].html, /<a href="http/);
    } finally {
      await shop.close();
    }
  });
});

describe('Newsletter mit Double-Opt-in', () => {
  test('Anmeldung erst nach Bestätigung aktiv, Abmeldung per Link', async () => {
    const shop = await startShop();
    try {
      assert.equal((await shop.post('/newsletter', { email: 'nl@example.org' })).status, 422);
      await shop.post('/newsletter', { email: 'nl@example.org', consent: '1' });
      let row = shop.db.prepare('SELECT * FROM newsletter').get();
      assert.equal(row.confirmed_at, null);
      const mail = shop.db.prepare(`SELECT text FROM outbox WHERE kind = 'newsletter_doi'`).get().text;
      const confirm = linkFrom(mail, /http:\/\/127\.0\.0\.1:\d+\/newsletter\/bestaetigen\/[A-Za-z0-9_-]+/);
      assert.equal((await fetch(confirm)).status, 200);
      assert.equal((await fetch(confirm)).status, 404);
      row = shop.db.prepare('SELECT * FROM newsletter').get();
      assert.ok(row.confirmed_at);
      const unsub = linkFrom(mail, /http:\/\/127\.0\.0\.1:\d+\/newsletter\/abmelden\?[^\s]+/);
      assert.equal((await fetch(unsub.replace(/t=[^&]+/, 't=falsch'))).status, 400);
      assert.equal((await fetch(unsub)).status, 200);
      assert.ok(shop.db.prepare('SELECT unsubscribed_at FROM newsletter').get().unsubscribed_at);
    } finally {
      await shop.close();
    }
  });
});

describe('Regelbesteuerung und Produktivkonfiguration', () => {
  test('Preise mit „inkl. 19 % USt.“ und Rechnung mit Steuerausweis', async () => {
    const shop = await startShop({ business: { vat_mode: 'regel', vat_id: 'DE000000000' } });
    try {
      assert.match(await (await shop.get('/kasse/basis')).text(), /enthaltene USt\. \(19 %\)/);
      const { order } = await placeOrder(shop);
      await shop.webhook(sessionEvent(shop, order));
      const mail = shop.db.prepare(`SELECT text FROM outbox WHERE dedupe_key = ?`).get(`confirm:${order.id}`).text;
      const inv = linkFrom(mail, /http:\/\/127\.0\.0\.1:\d+\/rechnung\/[A-Za-z0-9_-]+/);
      const body = await (await fetch(inv)).text();
      assert.match(body, /Umsatzsteuer 19 %/);
      assert.match(body, /24,37/);
      assert.match(body, /4,63/);
    } finally {
      await shop.close();
    }
  });

  test('Produktivstart wird verweigert, solange Pflichtangaben fehlen', () => {
    const cfg = loadConfig({ env: { NODE_ENV: 'production', BUSINESS_FILE: '/nicht/vorhanden.json', BASE_URL: 'http://x.de' } });
    const problems = assertProductionReady(cfg);
    assert.ok(problems.some((p) => /BASE_URL/.test(p)));
    assert.ok(problems.some((p) => /Straße/.test(p)));
    assert.ok(problems.some((p) => /STRIPE_SECRET_KEY/.test(p)));
    assert.ok(problems.some((p) => /SMTP/.test(p)));
  });
});
