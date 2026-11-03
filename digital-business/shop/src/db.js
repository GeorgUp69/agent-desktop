'use strict';
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  edition TEXT NOT NULL,
  email TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL DEFAULT 'pending',
  consent_early_delivery INTEGER NOT NULL DEFAULT 0,
  consent_text_version TEXT NOT NULL,
  terms_accepted_at TEXT NOT NULL,
  upgrade_of TEXT,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  stripe_fee_cents INTEGER,
  billing_country TEXT,
  withdrawn_at TEXT,
  invoice_number TEXT UNIQUE,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  delivery_available_at TEXT,
  delivered_at TEXT,
  refunded_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS orders_pi ON orders(stripe_payment_intent);
CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TEXT NOT NULL,
  processed_at TEXT,
  error TEXT
);
CREATE TABLE IF NOT EXISTS access_tokens (
  token_hash TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL REFERENCES orders(id),
  file TEXT NOT NULL,
  at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  dedupe_key TEXT UNIQUE,
  to_addr TEXT NOT NULL,
  subject TEXT NOT NULL,
  text TEXT NOT NULL,
  html TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT,
  created_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  order_number TEXT,
  statement TEXT NOT NULL,
  received_at TEXT NOT NULL,
  handled_at TEXT
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS newsletter (
  email TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  consent_text_version TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  confirmed_at TEXT,
  unsubscribed_at TEXT
);
CREATE TABLE IF NOT EXISTS ad_spend (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  channel TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS page_views (
  day TEXT NOT NULL,
  page TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, page)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  level TEXT NOT NULL,
  type TEXT NOT NULL,
  order_id TEXT,
  detail TEXT
);
`;

function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

function nextCounter(db, name) {
  db.prepare('INSERT INTO counters(name, value) VALUES (?, 0) ON CONFLICT(name) DO NOTHING').run(name);
  db.prepare('UPDATE counters SET value = value + 1 WHERE name = ?').run(name);
  return db.prepare('SELECT value FROM counters WHERE name = ?').get(name).value;
}

module.exports = { openDb, tx, nextCounter };
