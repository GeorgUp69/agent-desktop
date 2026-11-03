'use strict';
const { EDITIONS, formatEuro, vatInfo } = require('./catalog');
const legal = require('./legal');
const { escapeHtml, formatDate, formatDateTime } = require('./util');

function wrapHtml(text, cfg) {
  const body = escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    .replace(/\n/g, '<br>');
  return `<!doctype html><html lang="de"><body style="margin:0;background:#F7F5F0;font-family:Inter,Arial,sans-serif;color:#14213D">
<div style="max-width:620px;margin:0 auto;padding:28px 20px">
<div style="font-weight:700;font-size:18px;margin-bottom:20px"><span style="display:inline-block;width:22px;height:22px;background:#14213D;border-radius:6px;vertical-align:-5px;margin-right:8px"></span>${escapeHtml(cfg.business.brand || 'Freikontor')}</div>
<div style="background:#fff;border:1px solid #D9D6CE;border-radius:10px;padding:24px;font-size:15px;line-height:1.6">${body}</div>
<p style="font-size:12px;color:#6B7280;margin-top:16px">${escapeHtml(cfg.business.legal_name)} · ${escapeHtml(cfg.business.street)} · ${escapeHtml(cfg.business.zip)} ${escapeHtml(cfg.business.city)}</p>
</div></body></html>`;
}

function sellerBlock(b) {
  return `${b.legal_name}\n${b.street}\n${b.zip} ${b.city}\n${b.country}\nE-Mail: ${b.email} · Telefon: ${b.phone}`;
}

function contractAppendix(cfg) {
  return [
    '────────────────────────────────────────',
    'ALLGEMEINE GESCHÄFTSBEDINGUNGEN (Stand ' + legal.LEGAL_VERSION + ')',
    legal.htmlToText(legal.agb(cfg.business, cfg)),
    '',
    '────────────────────────────────────────',
    legal.htmlToText(legal.widerrufsbelehrung(cfg.business, cfg)),
  ].join('\n');
}

function orderSummary(order, cfg) {
  const ed = EDITIONS[order.edition];
  const amount = order.amount_paid_cents ?? order.price_cents;
  const v = vatInfo(cfg.business, amount);
  return [
    `Bestellnummer: ${order.order_number}`,
    `Bestellt am: ${formatDateTime(order.created_at)}`,
    `Produkt: ${ed.name} (digitaler Inhalt zum Download), Menge 1`,
    `Gezahlter Betrag: ${formatEuro(amount)} – ${v.label}`,
    `Rechnungsnummer: ${order.invoice_number}`,
  ].join('\n');
}

function confirmation(order, { accessUrl, invoiceUrl }, cfg) {
  const ed = EDITIONS[order.edition];
  const immediate = Boolean(order.consent_early_delivery);
  const lines = [
    'Hallo,',
    '',
    'vielen Dank für deine Bestellung. Deine Zahlung ist eingegangen, und hiermit bestätigen wir den Vertragsschluss.',
    '',
    orderSummary(order, cfg),
    '',
  ];
  if (immediate) {
    lines.push(
      'DEIN DOWNLOAD',
      `${accessUrl}`,
      `Der Link ist bis ${formatDate(addDays(new Date(), cfg.downloadLinkDays).toISOString())} gültig. Einen neuen Link bekommst du jederzeit unter ${cfg.baseUrl}/meine-downloads.`,
      `Enthalten: ${ed.fileLabel}`,
      '',
      'BESTÄTIGUNG DEINER ERKLÄRUNGEN',
      `Du hast im Bestellprozess am ${formatDateTime(order.terms_accepted_at)} ausdrücklich verlangt, dass wir vor Ablauf der Widerrufsfrist mit der Bereitstellung der digitalen Inhalte beginnen, und bestätigt, dass dir bekannt ist, dass du dadurch mit Beginn der Bereitstellung dein Widerrufsrecht verlierst. Mit dem Versand dieses Download-Links haben wir mit der Bereitstellung begonnen; dein Widerrufsrecht ist damit erloschen (§ 356 Abs. 5 BGB).`,
    );
  } else {
    lines.push(
      'BEREITSTELLUNG NACH ABLAUF DER WIDERRUFSFRIST',
      `Du hast der vorzeitigen Bereitstellung nicht zugestimmt. Dein 14-tägiges Widerrufsrecht bleibt daher bestehen. Den Download-Link senden wir dir automatisch am ${formatDate(order.delivery_available_at)}.`,
      `Widerrufen kannst du jederzeit innerhalb der Frist unter ${cfg.baseUrl}/vertrag-widerrufen.`,
    );
  }
  lines.push(
    '',
    'RECHNUNG',
    `${invoiceUrl}`,
    '',
    'ANBIETER',
    sellerBlock(cfg.business),
    '',
    'Hinweis: Das Finanzcockpit ist ein Werkzeug zur Organisation und Schätzung und ersetzt keine Steuerberatung.',
    '',
    'Viel Erfolg!',
    cfg.business.brand || 'Freikontor',
    '',
    contractAppendix(cfg),
  );
  const text = lines.join('\n');
  return { subject: `Bestellbestätigung ${order.order_number} – ${ed.name}`, text, html: wrapHtml(text, cfg) };
}

function deliveryReady(order, { accessUrl }, cfg) {
  const ed = EDITIONS[order.edition];
  const text = [
    'Hallo,',
    '',
    `die Widerrufsfrist für deine Bestellung ${order.order_number} ist abgelaufen. Hier ist dein Download:`,
    '',
    accessUrl,
    '',
    `Enthalten: ${ed.fileLabel}`,
    `Der Link ist ${cfg.downloadLinkDays} Tage gültig. Einen neuen Link bekommst du jederzeit unter ${cfg.baseUrl}/meine-downloads.`,
    '',
    cfg.business.brand || 'Freikontor',
  ].join('\n');
  return { subject: `Dein Download ist bereit – ${ed.name}`, text, html: wrapHtml(text, cfg) };
}

function accessLink(orders, links, cfg) {
  const text = [
    'Hallo,',
    '',
    'hier sind deine aktuellen Download-Links:',
    '',
    ...orders.map((o, i) => `${EDITIONS[o.edition].name} (Bestellung ${o.order_number}):\n${links[i]}\n`),
    `Die Links sind ${cfg.downloadLinkDays} Tage gültig.`,
    '',
    'Du hast diese E-Mail nicht angefordert? Dann kannst du sie ignorieren.',
    '',
    cfg.business.brand || 'Freikontor',
  ].join('\n');
  return { subject: 'Deine Download-Links', text, html: wrapHtml(text, cfg) };
}

function withdrawalReceipt(w, cfg) {
  const text = [
    `Hallo ${w.name},`,
    '',
    `wir bestätigen den Eingang deines Widerrufs am ${formatDateTime(w.received_at)} (Eingangs-ID ${w.id}).`,
    '',
    'Deine Erklärung:',
    w.statement,
    w.order_number ? `Bestellnummer: ${w.order_number}` : 'Bestellnummer: nicht angegeben',
    '',
    'Wir prüfen den Widerruf und melden uns. Ist dein Widerrufsrecht nicht erloschen, erstatten wir die Zahlung binnen 14 Tagen über das ursprüngliche Zahlungsmittel.',
    '',
    'ANBIETER',
    sellerBlock(cfg.business),
  ].join('\n');
  return { subject: `Eingangsbestätigung deines Widerrufs (${w.id})`, text, html: wrapHtml(text, cfg) };
}

function newsletterConfirm(link, unsub, cfg) {
  const text = [
    'Hallo,',
    '',
    'bitte bestätige deine Anmeldung zum Freikontor-Newsletter mit einem Klick:',
    link,
    '',
    'Wir schreiben selten: neue Jahresausgaben, wichtige Steueränderungen für Selbstständige und Angebote. Abmelden kannst du dich jederzeit mit einem Klick in jeder E-Mail.',
    '',
    'Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail – ohne Bestätigung senden wir nichts.',
    '',
    `Abmelden: ${unsub}`,
  ].join('\n');
  return { subject: 'Bitte bestätige deine Newsletter-Anmeldung', text, html: wrapHtml(text, cfg) };
}

function ownerNotice(subject, lines, cfg) {
  const text = lines.join('\n');
  return { subject: `[Shop] ${subject}`, text, html: wrapHtml(text, cfg) };
}

function refundNotice(order, cfg) {
  const text = [
    'Hallo,',
    '',
    `die Zahlung für deine Bestellung ${order.order_number} wurde erstattet. Der Download-Zugang ist damit deaktiviert.`,
    'Die Gutschrift erscheint je nach Zahlungsart in einigen Tagen auf deinem Konto.',
    '',
    cfg.business.brand || 'Freikontor',
  ].join('\n');
  return { subject: `Erstattung zu Bestellung ${order.order_number}`, text, html: wrapHtml(text, cfg) };
}

function addDays(d, n) {
  return new Date(d.getTime() + n * 86400000);
}

module.exports = { confirmation, deliveryReady, accessLink, withdrawalReceipt, newsletterConfirm, ownerNotice, refundNotice, wrapHtml, addDays };
