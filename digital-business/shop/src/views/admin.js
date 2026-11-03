'use strict';
const { html, formatDateTime } = require('../util');
const { EDITIONS, formatEuro, vatInfo } = require('../catalog');
const { layout } = require('./layout');

function stats(db, cfg, from, to) {
  const paidStates = "('paid','delivered')";
  const orders = db.prepare(`SELECT edition, COUNT(*) n, SUM(amount_paid_cents) gross, SUM(COALESCE(stripe_fee_cents,0)) fees,
      SUM(CASE WHEN stripe_fee_cents IS NULL THEN 1 ELSE 0 END) unknown_fees
    FROM orders WHERE status IN ${paidStates} AND paid_at >= ? AND paid_at < ? GROUP BY edition`).all(from, to);
  const refunds = db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(amount_paid_cents),0) gross FROM orders WHERE status = 'refunded' AND refunded_at >= ? AND refunded_at < ?`).get(from, to);
  const started = db.prepare('SELECT COUNT(*) n FROM orders WHERE created_at >= ? AND created_at < ?').get(from, to).n;
  const views = db.prepare(`SELECT COALESCE(SUM(count),0) n FROM page_views WHERE page IN ('/finanzcockpit','/') AND day >= ? AND day < ?`)
    .get(from.slice(0, 10), to.slice(0, 10)).n;
  const ads = db.prepare('SELECT COALESCE(SUM(amount_cents),0) c FROM ad_spend WHERE day >= ? AND day < ?').get(from.slice(0, 10), to.slice(0, 10)).c;
  const gross = orders.reduce((s, o) => s + (o.gross || 0), 0);
  const fees = orders.reduce((s, o) => s + (o.fees || 0), 0);
  const unknownFees = orders.reduce((s, o) => s + (o.unknown_fees || 0), 0);
  const paid = orders.reduce((s, o) => s + o.n, 0);
  const net = vatInfo(cfg.business, gross).netCents;
  return { orders, gross, net, fees, unknownFees, paid, refunds, started, views, ads, profit: net - fees - ads };
}

function adminPage(cfg, db, { from, to, csrf }) {
  const s = stats(db, cfg, from, to);
  const latest = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 25').all();
  const withdrawals = db.prepare('SELECT * FROM withdrawals ORDER BY received_at DESC LIMIT 10').all();
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 10').all();
  const failedMail = db.prepare(`SELECT * FROM outbox WHERE status = 'failed' OR (status='queued' AND attempts > 0) ORDER BY id DESC LIMIT 10`).all();
  const errors = db.prepare(`SELECT * FROM events WHERE level != 'info' ORDER BY id DESC LIMIT 15`).all();
  const ads = db.prepare('SELECT * FROM ad_spend ORDER BY day DESC LIMIT 15').all();
  const nl = db.prepare('SELECT COUNT(*) n FROM newsletter WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL').get().n;
  const conv = s.views ? (s.paid / s.views) : null;
  const kpi = (label, value, hint) => html`<div class="kpi"><span>${label}</span><b>${value}</b>${hint ? html`<span>${hint}</span>` : ''}</div>`;
  const body = html`<div class="wrap" style="padding:32px 16px 64px">
  <h1 style="font-size:2rem">Shop-Dashboard</h1>
  <form method="get" action="/admin" style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
    <div><label for="from">Von</label><input id="from" type="date" name="from" value="${from.slice(0, 10)}"></div>
    <div><label for="to">Bis (exklusiv)</label><input id="to" type="date" name="to" value="${to.slice(0, 10)}"></div>
    <button class="btn btn-dark btn-small" type="submit">Anzeigen</button>
    <a class="btn btn-ghost btn-small" href="/admin/export/orders.csv?from=${from.slice(0, 10)}&to=${to.slice(0, 10)}">Bestellungen CSV</a>
    <a class="btn btn-ghost btn-small" href="/admin/export/newsletter.csv">Newsletter CSV</a>
  </form>
  <div class="kpis">
    ${kpi('Umsatz brutto', formatEuro(s.gross))}
    ${kpi('Umsatz netto', formatEuro(s.net), cfg.business.vat_mode === 'regel' ? 'nach 19 % USt' : 'Kleinunternehmer')}
    ${kpi('Bezahlte Bestellungen', String(s.paid))}
    ${kpi('Conversion', conv === null ? '–' : (conv * 100).toFixed(2) + ' %', `${s.views} Aufrufe Start/Produkt`)}
    ${kpi('Checkout-Starts', String(s.started))}
    ${kpi('Erstattungen', `${s.refunds.n} · ${formatEuro(s.refunds.gross)}`)}
    ${kpi('Stripe-Gebühren', formatEuro(s.fees), s.unknownFees ? `${s.unknownFees} noch ohne Gebührendaten` : 'aus Stripe übernommen')}
    ${kpi('Werbekosten', formatEuro(s.ads), 'manuell erfasst')}
    ${kpi('Geschätzter Gewinn', formatEuro(s.profit), 'netto − Gebühren − Werbung')}
    ${kpi('Newsletter (bestätigt)', String(nl))}
  </div>
  <h2 style="font-size:1.3rem">Verkäufe nach Edition</h2>
  <table class="data"><thead><tr><th>Edition</th><th>Anzahl</th><th>Brutto</th></tr></thead>
  <tbody>${s.orders.map((o) => html`<tr><td>${EDITIONS[o.edition] ? EDITIONS[o.edition].name : o.edition}</td><td>${String(o.n)}</td><td>${formatEuro(o.gross || 0)}</td></tr>`)}</tbody></table>

  <h2 style="font-size:1.3rem;margin-top:28px">Werbekosten erfassen</h2>
  <form class="form" method="post" action="/admin/ad-spend" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));align-items:end">
    <input type="hidden" name="csrf" value="${csrf}">
    <div><label for="ad-day">Tag</label><input id="ad-day" type="date" name="day" required></div>
    <div><label for="ad-ch">Kanal</label><select id="ad-ch" name="channel"><option>TikTok Ads</option><option>Meta Ads</option><option>Pinterest Ads</option><option>Google Ads</option><option>Sonstiges</option></select></div>
    <div><label for="ad-amt">Betrag (€)</label><input id="ad-amt" type="number" step="0.01" min="0" name="amount" required></div>
    <div><label for="ad-note">Notiz</label><input id="ad-note" type="text" name="note" maxlength="200"></div>
    <button class="btn btn-dark btn-small" type="submit">Speichern</button>
  </form>
  <table class="data" style="margin-top:10px"><tbody>${ads.map((a) => html`<tr><td>${a.day}</td><td>${a.channel}</td><td>${formatEuro(a.amount_cents)}</td><td>${a.note || ''}</td></tr>`)}</tbody></table>

  <h2 style="font-size:1.3rem;margin-top:28px">Letzte Bestellungen</h2>
  <div class="table-wrap"><table class="data"><thead><tr><th>Datum</th><th>Nr.</th><th>Edition</th><th>Status</th><th>Betrag</th><th>Rechnung</th><th>Sofort?</th><th>Land</th></tr></thead>
  <tbody>${latest.map((o) => html`<tr><td>${formatDateTime(o.created_at)}</td><td>${o.order_number}</td><td>${o.edition}</td><td><span class="status ${o.status}">${o.status}</span></td>
  <td>${o.amount_paid_cents != null ? formatEuro(o.amount_paid_cents) : '–'}</td><td>${o.invoice_number || '–'}</td><td>${o.consent_early_delivery ? 'ja' : 'nein'}</td><td>${o.billing_country || '–'}</td></tr>`)}</tbody></table></div>

  <h2 style="font-size:1.3rem;margin-top:28px">Widerrufe</h2>
  <table class="data"><tbody>${withdrawals.length ? withdrawals.map((w) => html`<tr><td>${formatDateTime(w.received_at)}</td><td>${w.id}</td><td>${w.name}</td><td>${w.email}</td><td>${w.order_number || '–'}</td></tr>`) : html`<tr><td>Keine</td></tr>`}</tbody></table>

  <h2 style="font-size:1.3rem;margin-top:28px">Kontaktanfragen</h2>
  <table class="data"><tbody>${messages.length ? messages.map((m) => html`<tr><td>${formatDateTime(m.created_at)}</td><td>${m.name}</td><td>${m.email}</td><td>${m.message.slice(0, 160)}</td></tr>`) : html`<tr><td>Keine</td></tr>`}</tbody></table>

  <h2 style="font-size:1.3rem;margin-top:28px">E-Mail-Probleme</h2>
  <table class="data"><tbody>${failedMail.length ? failedMail.map((m) => html`<tr><td>${m.kind}</td><td>${m.to_addr}</td><td>${m.status}</td><td>${String(m.attempts)}</td><td>${m.last_error || ''}</td></tr>`) : html`<tr><td>Keine</td></tr>`}</tbody></table>

  <h2 style="font-size:1.3rem;margin-top:28px">Warnungen &amp; Fehler</h2>
  <table class="data"><tbody>${errors.length ? errors.map((e) => html`<tr><td>${formatDateTime(e.at)}</td><td>${e.level}</td><td>${e.type}</td><td>${e.order_id || ''}</td><td>${(e.detail || '').slice(0, 200)}</td></tr>`) : html`<tr><td>Keine</td></tr>`}</tbody></table>
  </div>`;
  return layout(cfg, { title: 'Admin', description: 'Admin', path: '/admin', body, noindex: true });
}

function ordersCsv(db, from, to) {
  const rows = db.prepare(`SELECT order_number, invoice_number, edition, status, email, amount_paid_cents, stripe_fee_cents, billing_country,
    created_at, paid_at, refunded_at, consent_early_delivery FROM orders WHERE created_at >= ? AND created_at < ? ORDER BY created_at`).all(from, to);
  const head = ['Bestellnummer', 'Rechnungsnummer', 'Edition', 'Status', 'E-Mail', 'Betrag_EUR', 'Stripe_Gebuehr_EUR', 'Land', 'Bestellt', 'Bezahlt', 'Erstattet', 'Sofortbereitstellung'];
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    const safe = /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
    return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = rows.map((r) => [r.order_number, r.invoice_number, r.edition, r.status, r.email,
    r.amount_paid_cents != null ? (r.amount_paid_cents / 100).toFixed(2).replace('.', ',') : '',
    r.stripe_fee_cents != null ? (r.stripe_fee_cents / 100).toFixed(2).replace('.', ',') : '',
    r.billing_country, r.created_at, r.paid_at, r.refunded_at, r.consent_early_delivery ? 'ja' : 'nein'].map(esc).join(';'));
  return '﻿' + [head.join(';'), ...lines].join('\r\n');
}

function newsletterCsv(db) {
  const rows = db.prepare('SELECT email, requested_at, confirmed_at, consent_text_version FROM newsletter WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL').all();
  return '﻿' + ['E-Mail;Angemeldet;Bestaetigt;Einwilligungstext', ...rows.map((r) => [r.email, r.requested_at, r.confirmed_at, r.consent_text_version].join(';'))].join('\r\n');
}

module.exports = { adminPage, ordersCsv, newsletterCsv, stats };
