'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const REQUIRED_BUSINESS = [
  ['legal_name', 'Vollständiger Name bzw. Firma'],
  ['owner_name', 'Vertretungsberechtigte Person / Inhaber'],
  ['street', 'Straße und Hausnummer (ladungsfähige Anschrift, kein Postfach)'],
  ['zip', 'Postleitzahl'],
  ['city', 'Ort'],
  ['email', 'E-Mail-Adresse'],
  ['phone', 'Telefonnummer'],
  ['content_responsible', 'Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)'],
];

function placeholder(label) {
  return `[[BITTE ERGÄNZEN: ${label}]]`;
}

function loadBusiness(file) {
  const raw = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const b = { country: 'Deutschland', vat_mode: 'kleinunternehmer', ...raw };
  const missing = [];
  for (const [key, label] of REQUIRED_BUSINESS) {
    if (!b[key] || String(b[key]).includes('BITTE ERGÄNZEN')) {
      missing.push(label);
      b[key] = placeholder(label);
    }
  }
  if (b.vat_mode !== 'kleinunternehmer' && b.vat_mode !== 'regel') {
    throw new Error('business.json: vat_mode muss "kleinunternehmer" oder "regel" sein');
  }
  if (b.vat_mode === 'regel' && !b.vat_id && !b.tax_number) {
    missing.push('USt-IdNr. oder Steuernummer (für Rechnungen)');
  }
  b.missing = missing;
  return b;
}

function loadConfig(overrides = {}) {
  loadEnvFile(path.join(ROOT, '.env'));
  const env = { ...process.env, ...overrides.env };
  const production = env.NODE_ENV === 'production';
  const baseUrl = (env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const cfg = {
    root: ROOT,
    production,
    port: Number(env.PORT || 3000),
    baseUrl,
    dataDir: path.resolve(ROOT, env.DATA_DIR || 'data'),
    productsDir: path.resolve(ROOT, env.PRODUCTS_DIR || 'storage/products'),
    stripeSecretKey: env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
    requireLivemode: env.STRIPE_REQUIRE_LIVEMODE === '1',
    smtp: env.SMTP_HOST ? {
      host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === '1',
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    } : null,
    mailFrom: env.MAIL_FROM || 'Freikontor <noreply@localhost>',
    ownerNotifyEmail: env.OWNER_NOTIFY_EMAIL || '',
    adminPassword: env.ADMIN_PASSWORD || '',
    secret: env.APP_SECRET || '',
    tiktokPixelId: env.TIKTOK_PIXEL_ID || '',
    downloadLinkDays: Number(env.DOWNLOAD_LINK_DAYS || 30),
    maxDownloadsPerFile: Number(env.MAX_DOWNLOADS_PER_FILE || 20),
    withdrawalDays: 14,
    business: loadBusiness(path.resolve(ROOT, env.BUSINESS_FILE || 'business.json')),
    ...overrides.cfg,
  };
  return cfg;
}

function assertProductionReady(cfg) {
  const problems = [];
  if (!cfg.baseUrl.startsWith('https://')) problems.push('BASE_URL muss mit https:// beginnen');
  if (!cfg.stripeSecretKey) problems.push('STRIPE_SECRET_KEY fehlt');
  if (!cfg.stripeWebhookSecret) problems.push('STRIPE_WEBHOOK_SECRET fehlt');
  if (!cfg.smtp) problems.push('SMTP_HOST fehlt (ohne E-Mail keine Auslieferung)');
  if (!cfg.secret || cfg.secret.length < 32) problems.push('APP_SECRET fehlt oder ist kürzer als 32 Zeichen');
  if (!cfg.adminPassword || cfg.adminPassword.length < 12) problems.push('ADMIN_PASSWORD fehlt oder ist kürzer als 12 Zeichen');
  for (const m of cfg.business.missing) problems.push('business.json: ' + m);
  return problems;
}

module.exports = { loadConfig, assertProductionReady, placeholder };
