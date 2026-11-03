'use strict';
const fs = require('fs');
const path = require('path');
const express = require('express');
const { EDITIONS } = require('./catalog');
const pages = require('./views/pages');
const admin = require('./views/admin');
const emails = require('./emails');
const { LEGAL_VERSION } = require('./legal');
const { normalizeEmail, randomToken, sha256, safeEqual, hmac, berlinDay } = require('./util');

const PUBLIC_PAGES = ['/', '/finanzcockpit', '/steuerruecklage-rechner', '/faq', '/ueber-uns', '/kontakt', '/impressum',
  '/datenschutz', '/agb', '/widerrufsbelehrung', '/zahlung-und-lieferung', '/vertrag-widerrufen'];

function createRateLimiter() {
  const hits = new Map();
  return function limit(key, max, windowMs, now = Date.now()) {
    const h = hits.get(key) || { n: 0, reset: now + windowMs };
    if (now > h.reset) { h.n = 0; h.reset = now + windowMs; }
    h.n++;
    hits.set(key, h);
    if (hits.size > 50000) hits.clear();
    return h.n <= max;
  };
}

function createApp({ cfg, db, log, mailer, orders, stripe }) {
  const app = express();
  const secret = cfg.secret || randomToken(32);
  const limit = createRateLimiter();
  app.disable('x-powered-by');
  if (cfg.trustProxy !== false) app.set('trust proxy', 'loopback, uniquelocal');

  const pixel = Boolean(cfg.tiktokPixelId);
  const csp = [
    "default-src 'self'",
    `script-src 'self'${pixel ? ' https://analytics.tiktok.com' : ''}`,
    `connect-src 'self'${pixel ? ' https://analytics.tiktok.com https://*.tiktok.com' : ''}`,
    `img-src 'self' data:${pixel ? ' https://*.tiktok.com' : ''}`,
    "style-src 'self' 'unsafe-inline'", "font-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'",
    "form-action 'self' https://checkout.stripe.com",
  ].join('; ');
  app.use((req, res, next) => {
    res.set({
      'Content-Security-Policy': csp,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'X-Frame-Options': 'DENY',
    });
    if (cfg.production) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  app.post('/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature') || '', cfg.stripeWebhookSecret);
    } catch (e) {
      log.warn('stripe.signature_invalid', { error: e.message });
      return res.status(400).send('Ungültige Signatur');
    }
    try {
      const r = orders.handleEvent(event);
      return res.json({ received: true, ...r });
    } catch (e) {
      log.error('stripe.event_failed', { id: event.id, type: event.type, error: e.message });
      db.prepare('DELETE FROM stripe_events WHERE id = ? AND processed_at IS NULL').run(event.id);
      return res.status(500).send('Fehler bei der Verarbeitung');
    }
  });

  app.use('/', express.static(path.join(cfg.root, 'public'), { maxAge: cfg.production ? '7d' : 0, index: false }));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));
  app.use((req, res, next) => { if (!req.body) req.body = {}; next(); });

  const baseHost = new URL(cfg.baseUrl).host;
  app.use((req, res, next) => {
    if (req.method !== 'POST') return next();
    const origin = req.get('origin') || req.get('referer') || '';
    let host = '';
    try { host = new URL(origin).host; } catch (e) { host = ''; }
    if (host !== baseHost) {
      log.warn('security.origin_rejected', { path: req.path, origin: origin.slice(0, 100) });
      return res.status(403).send(pages.message(cfg, 'Anfrage abgelehnt', 'Bitte sende das Formular direkt von unserer Website.', { status: 'error' }));
    }
    if (!limit(`${req.ip}:${req.path}`, 20, 10 * 60 * 1000)) {
      return res.status(429).send(pages.message(cfg, 'Zu viele Anfragen', 'Bitte warte ein paar Minuten und versuche es dann erneut.', { status: 'error' }));
    }
    return next();
  });

  const countView = db.prepare(`INSERT INTO page_views(day, page, count) VALUES (?, ?, 1)
    ON CONFLICT(day, page) DO UPDATE SET count = count + 1`);
  app.use((req, res, next) => {
    if (req.method === 'GET' && PUBLIC_PAGES.includes(req.path) && !/bot|crawl|spider|preview/i.test(req.get('user-agent') || '')) {
      try { countView.run(berlinDay(new Date()), req.path); } catch (e) { /* Zählung ist nicht kritisch */ }
    }
    next();
  });

  const send = (res, htmlStr, status = 200) => res.status(status).type('html').send(String(htmlStr));

  app.get('/', (req, res) => send(res, pages.home(cfg)));
  app.get('/finanzcockpit', (req, res) => send(res, pages.product(cfg)));
  app.get('/faq', (req, res) => send(res, pages.faqPage(cfg)));
  app.get('/ueber-uns', (req, res) => send(res, pages.about(cfg)));
  app.get('/steuerruecklage-rechner', (req, res) => send(res, pages.calculator(cfg)));
  for (const key of ['impressum', 'datenschutz', 'agb', 'widerrufsbelehrung', 'zahlung-und-lieferung']) {
    app.get('/' + key, (req, res) => send(res, pages.legalPage(cfg, key)));
  }

  app.get('/kasse/:edition', (req, res, next) => {
    if (!EDITIONS[req.params.edition]) return next();
    return send(res, pages.checkout(cfg, req.params.edition, { cancelled: req.query.abgebrochen === '1' }));
  });

  app.post('/kasse/:edition', async (req, res, next) => {
    const edition = req.params.edition;
    if (!EDITIONS[edition]) return next();
    const b = req.body || {};
    const values = { email: String(b.email || '').slice(0, 254), upgrade_of: String(b.upgrade_of || '').slice(0, 20),
      terms: b.terms === '1', early_start: b.early_start === '1', early_knowledge: b.early_knowledge === '1' };
    const fail = (error, status = 422) => send(res, pages.checkout(cfg, edition, { error, values }), status);
    if (b.website) return fail('Die Bestellung konnte nicht verarbeitet werden.', 400);
    const email = normalizeEmail(values.email);
    if (!email) return fail('Bitte gib eine gültige E-Mail-Adresse ein.');
    if (!values.terms) return fail('Bitte bestätige, dass du die AGB akzeptierst.');
    if (values.early_start !== values.early_knowledge) {
      return fail('Für den Sofort-Download bitte beide Häkchen setzen – oder keines, wenn du dein Widerrufsrecht behalten möchtest (Download nach 14 Tagen).');
    }
    if (!limit(`checkout:${email}`, 8, 60 * 60 * 1000)) return fail('Zu viele Bestellversuche. Bitte versuche es später erneut.', 429);
    let order;
    try {
      order = orders.createOrder({ edition, email, consentEarly: values.early_start && values.early_knowledge, upgradeOf: values.upgrade_of });
    } catch (e) {
      if (e.status) return fail(e.message, e.status);
      return next(e);
    }
    try {
      const session = await orders.createCheckout(order);
      return res.redirect(303, session.url);
    } catch (e) {
      log.error('checkout.stripe_failed', { error: e.message }, order.id);
      db.prepare(`UPDATE orders SET status = 'failed', updated_at = ? WHERE id = ?`).run(new Date().toISOString(), order.id);
      return fail('Die Bezahlseite ist gerade nicht erreichbar. Es wurde nichts berechnet. Bitte versuche es in ein paar Minuten erneut.', 503);
    }
  });

  app.get('/bestellung/danke', (req, res) => {
    const o = req.query.nr ? orders.byNumber(String(req.query.nr)) : null;
    return send(res, pages.thanks(cfg, o));
  });

  const filesFor = (order) => {
    const ed = EDITIONS[order.edition];
    return [{ id: 'paket', label: 'Gesamtpaket (ZIP)', file: ed.file }];
  };
  const accessError = {
    not_found: ['Link ungültig', 'Dieser Download-Link existiert nicht. Bitte fordere unter „Meine Downloads“ einen neuen an.'],
    expired: ['Link abgelaufen', 'Dieser Download-Link ist abgelaufen. Unter „Meine Downloads“ erhältst du sofort einen neuen.'],
    revoked: ['Zugang deaktiviert', 'Der Zugang zu dieser Bestellung wurde deaktiviert, z. B. nach einer Erstattung.'],
    not_available: ['Noch nicht verfügbar', 'Diese Bestellung ist noch nicht zur Auslieferung freigegeben.'],
  };

  app.get('/downloads/:token', (req, res) => {
    const r = orders.resolveAccess(req.params.token);
    if (r.error) {
      const [t, m] = accessError[r.error];
      return send(res, pages.message(cfg, t, m, { status: 'error' }), r.error === 'not_found' ? 404 : 410);
    }
    res.set('Cache-Control', 'no-store');
    return send(res, pages.downloadsPage(cfg, r.order, req.params.token, filesFor(r.order)));
  });

  app.get('/downloads/:token/datei/:file', (req, res) => {
    if (!limit(`dl:${req.ip}`, 60, 60 * 60 * 1000)) return res.status(429).send('Zu viele Downloads. Bitte später erneut versuchen.');
    const r = orders.resolveAccess(req.params.token);
    if (r.error) {
      const [t, m] = accessError[r.error];
      return send(res, pages.message(cfg, t, m, { status: 'error' }), r.error === 'not_found' ? 404 : 410);
    }
    const f = filesFor(r.order).find((x) => x.id === req.params.file);
    if (!f) return res.status(404).send('Datei nicht gefunden');
    const full = path.join(cfg.productsDir, path.basename(f.file));
    if (!fs.existsSync(full)) {
      log.error('download.file_missing', { file: f.file }, r.order.id);
      return send(res, pages.message(cfg, 'Datei vorübergehend nicht verfügbar', 'Wir wurden informiert. Bitte versuche es später erneut oder kontaktiere uns.', { status: 'error' }), 503);
    }
    if (!orders.countDownload(r.order.id, f.id)) {
      return send(res, pages.message(cfg, 'Download-Limit erreicht', 'Für diese Bestellung wurde die maximale Anzahl an Downloads erreicht. Bitte kontaktiere uns, wir helfen gern.', { status: 'error' }), 429);
    }
    log.info('download.served', { file: f.id }, r.order.id);
    res.set('Cache-Control', 'no-store');
    return res.download(full, f.file);
  });

  app.get('/rechnung/:token', (req, res) => {
    const o = orders.resolveInvoice(req.params.token);
    if (!o) return send(res, pages.message(cfg, 'Rechnung nicht gefunden', 'Bitte nutze den Link aus deiner Bestellbestätigung.', { status: 'error' }), 404);
    res.set('Cache-Control', 'no-store');
    return send(res, pages.invoice(cfg, o));
  });

  app.get('/meine-downloads', (req, res) => send(res, pages.myDownloads(cfg)));
  app.post('/meine-downloads', (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (!email || req.body.website) return send(res, pages.myDownloads(cfg, { error: 'Bitte gib eine gültige E-Mail-Adresse ein.' }), 422);
    if (limit(`access:${email}`, 3, 60 * 60 * 1000)) orders.requestAccessLinks(email);
    return send(res, pages.myDownloads(cfg, { sent: true }));
  });

  app.get('/kontakt', (req, res) => send(res, pages.contact(cfg)));
  app.post('/kontakt', (req, res) => {
    const values = { name: String(req.body.name || '').trim().slice(0, 120), email: String(req.body.email || '').slice(0, 254),
      message: String(req.body.message || '').trim().slice(0, 5000) };
    if (req.body.website) return send(res, pages.contact(cfg, { sent: true }));
    const email = normalizeEmail(values.email);
    if (!values.name || !email || values.message.length < 5) {
      return send(res, pages.contact(cfg, { error: 'Bitte fülle Name, gültige E-Mail und Nachricht aus.', values }), 422);
    }
    db.prepare('INSERT INTO contact_messages(name, email, message, created_at) VALUES (?,?,?,?)').run(values.name, email, values.message, new Date().toISOString());
    if (cfg.ownerNotifyEmail) {
      mailer.enqueue({ kind: 'owner_contact', to: cfg.ownerNotifyEmail,
        ...emails.ownerNotice(`Kontaktanfrage von ${values.name}`, [`Von: ${values.name} <${email}>`, '', values.message], cfg) });
    }
    log.info('contact.received', {});
    return send(res, pages.contact(cfg, { sent: true }));
  });

  app.get('/vertrag-widerrufen', (req, res) => send(res, pages.withdrawal(cfg)));
  app.post('/vertrag-widerrufen', async (req, res) => {
    const values = {
      name: String(req.body.name || '').trim().slice(0, 120),
      email: String(req.body.email || '').trim().slice(0, 254),
      order_number: String(req.body.order_number || '').trim().toUpperCase().slice(0, 20),
      statement: String(req.body.statement || '').trim().slice(0, 2000),
    };
    const email = normalizeEmail(values.email);
    if (!values.name || !email || !values.statement) {
      return send(res, pages.withdrawal(cfg, { values, error: 'Bitte gib Name, eine gültige E-Mail-Adresse und deine Erklärung an.' }), 422);
    }
    if (req.body.step !== '2') return send(res, pages.withdrawal(cfg, { step: 2, values: { ...values, email } }));
    const w = { id: 'W-' + randomToken(6).toUpperCase().replace(/[^A-Z0-9]/g, 'X'), name: values.name, email,
      order_number: values.order_number || null, statement: values.statement, received_at: new Date().toISOString() };
    db.prepare('INSERT INTO withdrawals(id, name, email, order_number, statement, received_at) VALUES (?,?,?,?,?,?)')
      .run(w.id, w.name, w.email, w.order_number, w.statement, w.received_at);
    mailer.enqueue({ kind: 'withdrawal_receipt', dedupeKey: `withdrawal:${w.id}`, to: email, ...emails.withdrawalReceipt(w, cfg) });
    const refunded = await orders.autoRefundIfUndelivered(w.order_number, email);
    if (cfg.ownerNotifyEmail) {
      mailer.enqueue({ kind: 'owner_withdrawal', to: cfg.ownerNotifyEmail, ...emails.ownerNotice(`Widerruf ${w.id}`,
        [`Name: ${w.name}`, `E-Mail: ${w.email}`, `Bestellnummer: ${w.order_number || '–'}`, `Eingang: ${w.received_at}`, '', w.statement, '',
          refunded ? 'Automatisch erstattet (Bestellung war noch nicht ausgeliefert).' : 'Bitte prüfen: Ist das Widerrufsrecht erloschen (Sofort-Download) oder ist eine Erstattung fällig?'], cfg) });
    }
    log.info('withdrawal.received', { id: w.id, autoRefund: refunded });
    return send(res, pages.withdrawal(cfg, { receipt: w }));
  });

  const unsubToken = (email) => hmac(secret, 'nl:' + email);
  app.post('/newsletter', (req, res) => {
    const email = normalizeEmail(req.body.email);
    if (req.body.company) return send(res, pages.message(cfg, 'Fast geschafft', 'Bitte bestätige deine Anmeldung über den Link in der E-Mail.'));
    if (!email || req.body.consent !== '1') {
      return send(res, pages.message(cfg, 'Anmeldung nicht möglich', 'Bitte gib eine gültige E-Mail-Adresse an und bestätige die Einwilligung.', { status: 'error' }), 422);
    }
    const existing = db.prepare('SELECT * FROM newsletter WHERE email = ?').get(email);
    if (!existing || existing.unsubscribed_at || !existing.confirmed_at) {
      const token = randomToken(24);
      db.prepare(`INSERT INTO newsletter(email, token_hash, consent_text_version, requested_at) VALUES (?,?,?,?)
        ON CONFLICT(email) DO UPDATE SET token_hash = excluded.token_hash, requested_at = excluded.requested_at, confirmed_at = NULL, unsubscribed_at = NULL, consent_text_version = excluded.consent_text_version`)
        .run(email, sha256(token), LEGAL_VERSION, new Date().toISOString());
      if (limit(`nl:${email}`, 3, 24 * 3600 * 1000)) {
        mailer.enqueue({ kind: 'newsletter_doi', to: email, ...emails.newsletterConfirm(`${cfg.baseUrl}/newsletter/bestaetigen/${token}`,
          `${cfg.baseUrl}/newsletter/abmelden?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`, cfg) });
      }
    }
    return send(res, pages.message(cfg, 'Fast geschafft', 'Bitte bestätige deine Anmeldung über den Link in der E-Mail, die wir dir gerade geschickt haben.'));
  });
  app.get('/newsletter/bestaetigen/:token', (req, res) => {
    const r = db.prepare('UPDATE newsletter SET confirmed_at = ? WHERE token_hash = ? AND confirmed_at IS NULL AND unsubscribed_at IS NULL')
      .run(new Date().toISOString(), sha256(req.params.token));
    if (!r.changes) return send(res, pages.message(cfg, 'Link ungültig', 'Dieser Bestätigungslink ist ungültig oder wurde bereits verwendet.', { status: 'error' }), 404);
    log.info('newsletter.confirmed', {});
    return send(res, pages.message(cfg, 'Anmeldung bestätigt', 'Danke! Du erhältst ab jetzt unseren Newsletter. Abmelden kannst du dich jederzeit über den Link in jeder E-Mail.'));
  });
  app.get('/newsletter/abmelden', (req, res) => {
    const email = normalizeEmail(req.query.e);
    if (!email || !safeEqual(unsubToken(email), String(req.query.t || ''))) {
      return send(res, pages.message(cfg, 'Link ungültig', 'Bitte nutze den Abmeldelink aus einer unserer E-Mails.', { status: 'error' }), 400);
    }
    db.prepare('UPDATE newsletter SET unsubscribed_at = ? WHERE email = ? AND unsubscribed_at IS NULL').run(new Date().toISOString(), email);
    return send(res, pages.message(cfg, 'Abgemeldet', 'Du wurdest vom Newsletter abgemeldet.'));
  });

  function requireAdmin(req, res, next) {
    if (!cfg.adminPassword) return res.status(404).send('Not found');
    const hdr = req.get('authorization') || '';
    const [user, pass] = Buffer.from(hdr.replace(/^Basic /, ''), 'base64').toString().split(':');
    if (!hdr.startsWith('Basic ') || user !== 'admin' || !safeEqual(pass || '', cfg.adminPassword)) {
      if (!limit(`admin:${req.ip}`, 10, 15 * 60 * 1000)) return res.status(429).send('Zu viele Versuche');
      res.set('WWW-Authenticate', 'Basic realm="Freikontor Admin", charset="UTF-8"');
      return res.status(401).send('Anmeldung erforderlich');
    }
    res.set('Cache-Control', 'no-store');
    return next();
  }
  const range = (q) => {
    const today = new Date();
    const from = /^\d{4}-\d{2}-\d{2}$/.test(q.from || '') ? q.from : new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const to = /^\d{4}-\d{2}-\d{2}$/.test(q.to || '') ? q.to : new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
    return { from: from + 'T00:00:00.000Z', to: to + 'T00:00:00.000Z' };
  };
  const csrf = hmac(secret, 'admin-csrf');
  app.get('/admin', requireAdmin, (req, res) => send(res, admin.adminPage(cfg, db, { ...range(req.query), csrf })));
  app.post('/admin/ad-spend', requireAdmin, (req, res) => {
    if (!safeEqual(req.body.csrf || '', csrf)) return res.status(403).send('CSRF');
    const amount = Math.round(parseFloat(String(req.body.amount).replace(',', '.')) * 100);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.day || '') || !Number.isFinite(amount) || amount < 0) return res.status(422).send('Ungültige Eingabe');
    db.prepare('INSERT INTO ad_spend(day, channel, amount_cents, note, created_at) VALUES (?,?,?,?,?)')
      .run(req.body.day, String(req.body.channel || 'Sonstiges').slice(0, 40), amount, String(req.body.note || '').slice(0, 200), new Date().toISOString());
    return res.redirect(303, '/admin');
  });
  app.get('/admin/export/orders.csv', requireAdmin, (req, res) => {
    const r = range(req.query);
    res.type('text/csv; charset=utf-8').attachment('bestellungen.csv').send(admin.ordersCsv(db, r.from, r.to));
  });
  app.get('/admin/export/newsletter.csv', requireAdmin, (req, res) => {
    res.type('text/csv; charset=utf-8').attachment('newsletter.csv').send(admin.newsletterCsv(db));
  });

  app.get('/robots.txt', (req, res) => res.type('text/plain').send(
    `User-agent: *\nDisallow: /admin\nDisallow: /downloads/\nDisallow: /rechnung/\nDisallow: /kasse/\nDisallow: /bestellung/\nSitemap: ${cfg.baseUrl}/sitemap.xml\n`));
  app.get('/sitemap.xml', (req, res) => {
    const urls = PUBLIC_PAGES.map((p) => `<url><loc>${cfg.baseUrl}${p}</loc><lastmod>2026-11-03</lastmod></url>`).join('');
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`);
  });
  app.get('/healthz', (req, res) => {
    const pendingMail = db.prepare(`SELECT COUNT(*) n FROM outbox WHERE status = 'queued'`).get().n;
    const failedMail = db.prepare(`SELECT COUNT(*) n FROM outbox WHERE status = 'failed'`).get().n;
    const productsOk = ['basis', 'pro'].every((e) => fs.existsSync(path.join(cfg.productsDir, EDITIONS[e].file)));
    res.status(productsOk ? 200 : 503).json({ ok: productsOk, pendingMail, failedMail, productsOk });
  });

  app.use((req, res) => send(res, pages.message(cfg, 'Seite nicht gefunden', 'Diese Seite gibt es nicht (mehr).', { status: 'error', path: req.path }), 404));
  app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    log.error('http.unhandled', { path: req.path, error: err.message });
    send(res, pages.message(cfg, 'Fehler', 'Da ist etwas schiefgelaufen. Bitte versuche es erneut.', { status: 'error' }), 500);
  });
  return app;
}

module.exports = { createApp, PUBLIC_PAGES };
