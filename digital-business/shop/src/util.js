'use strict';
const crypto = require('crypto');

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const html = (strings, ...values) => raw(
  strings.reduce((out, s, i) => {
    if (i === 0) return s;
    const v = values[i - 1];
    const rendered = v === false || v == null ? '' : v.__raw !== undefined ? v.__raw
      : Array.isArray(v) ? v.map((x) => (x && x.__raw !== undefined ? x.__raw : escapeHtml(x))).join('')
        : escapeHtml(v);
    return out + rendered + s;
  }, ''));

function raw(s) {
  return { __raw: String(s), toString() { return this.__raw; } };
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function sha256(s) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function hmac(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;
function normalizeEmail(s) {
  const e = String(s || '').trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short' });
}

function berlinDay(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(date);
}

module.exports = { escapeHtml, html, raw, randomToken, sha256, safeEqual, hmac, normalizeEmail, formatDate, formatDateTime, berlinDay };
