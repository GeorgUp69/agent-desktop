'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const Stripe = require('stripe');
const { loadConfig } = require('../src/config');
const { openDb } = require('../src/db');
const { createLogger } = require('../src/log');
const { createMailer } = require('../src/mailer');
const { createOrderService } = require('../src/orders');
const { createApp } = require('../src/app');

const WEBHOOK_SECRET = 'whsec_test_secret_for_unit_tests';
const realStripe = Stripe('sk_test_dummy');

function fakeStripe() {
  const calls = { sessions: [], refunds: [] };
  let n = 0;
  return {
    calls,
    webhooks: realStripe.webhooks,
    checkout: { sessions: { create: async (params, opts) => {
      n++;
      const s = { id: `cs_test_${n}`, url: `https://checkout.stripe.com/c/pay/cs_test_${n}`, params, opts };
      calls.sessions.push(s);
      return s;
    } } },
    refunds: { create: async (params, opts) => { calls.refunds.push({ params, opts }); return { id: 're_1' }; } },
    paymentIntents: { retrieve: async () => ({ latest_charge: { balance_transaction: { fee: 69 } } }) },
  };
}

function fakeTransport({ failTimes = 0 } = {}) {
  const sent = [];
  let fails = failTimes;
  return {
    sent,
    async sendMail(msg) {
      if (fails > 0) { fails--; throw new Error('SMTP nicht erreichbar'); }
      sent.push(msg);
      return { messageId: String(sent.length) };
    },
  };
}

async function startShop({ business = {}, clock, transport = fakeTransport(), cfgOverrides = {} } = {}) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fk-shop-'));
  const products = path.join(tmp, 'products');
  fs.mkdirSync(products);
  fs.writeFileSync(path.join(products, 'Freikontor-Finanzcockpit-2026-Basis.zip'), 'BASIS-ZIP');
  fs.writeFileSync(path.join(products, 'Freikontor-Finanzcockpit-2026-PRO.zip'), 'PRO-ZIP');
  const bizFile = path.join(tmp, 'business.json');
  fs.writeFileSync(bizFile, JSON.stringify({
    brand: 'Freikontor', legal_name: 'Testfirma (Platzhalter)', owner_name: 'Test Person', street: 'Teststraße 1', zip: '12345',
    city: 'Teststadt', email: 'kontakt@example.org', phone: '+49 000 000000', content_responsible: 'Test Person',
    vat_mode: 'kleinunternehmer', ...business,
  }));
  const cfg = loadConfig({ env: { BUSINESS_FILE: bizFile, NODE_ENV: 'test' }, cfg: {
    baseUrl: 'http://127.0.0.1:0', dataDir: tmp, productsDir: products, stripeWebhookSecret: WEBHOOK_SECRET,
    secret: 'x'.repeat(40), adminPassword: 'sehr-geheimes-passwort', ownerNotifyEmail: 'owner@example.org', smtp: null, ...cfgOverrides,
  } });
  const db = openDb(':memory:');
  const log = createLogger(db, { silent: true });
  const mailer = createMailer(db, cfg, log, transport);
  const stripe = fakeStripe();
  const orders = createOrderService({ db, cfg, log, mailer, stripe, clock: clock || (() => new Date()) });
  const app = createApp({ cfg, db, log, mailer, orders, stripe });
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  cfg.baseUrl = base;
  const appWithBase = createApp({ cfg, db, log, mailer, orders, stripe });
  server.removeAllListeners('request');
  server.on('request', appWithBase);
  return {
    cfg, db, mailer, orders, stripe, transport, base, tmp,
    close: () => new Promise((r) => server.close(() => { fs.rmSync(tmp, { recursive: true, force: true }); r(); })),
    get: (p, headers = {}) => fetch(base + p, { redirect: 'manual', headers }),
    post: (p, form, headers = {}) => fetch(base + p, {
      method: 'POST', redirect: 'manual',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: base, ...headers },
      body: new URLSearchParams(form).toString(),
    }),
    webhook: (event, secret = WEBHOOK_SECRET) => {
      const payload = JSON.stringify(event);
      const sig = realStripe.webhooks.generateTestHeaderString({ payload, secret });
      return fetch(base + '/stripe/webhook', { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': sig }, body: payload });
    },
    flushMail: () => mailer.processQueue(new Date(Date.now() + 365 * 86400000)),
  };
}

function sessionEvent(shop, order, { id = 'evt_' + Math.random().toString(36).slice(2), type = 'checkout.session.completed', payment_status = 'paid', amount_total, currency = 'eur', sessionId } = {}) {
  return {
    id, type, object: 'event',
    data: { object: {
      id: sessionId || order.stripe_session_id, object: 'checkout.session', payment_status, currency,
      amount_total: amount_total ?? order.price_cents, payment_intent: 'pi_' + order.id, livemode: false,
      metadata: { order_id: order.id }, customer_details: { email: order.email, address: { country: 'DE' } },
    } },
  };
}

async function placeOrder(shop, edition = 'basis', extra = {}) {
  const form = { email: 'kunde@example.org', terms: '1', early_start: '1', early_knowledge: '1', ...extra };
  const res = await shop.post(`/kasse/${edition}`, form);
  const order = shop.db.prepare('SELECT * FROM orders ORDER BY created_at DESC, rowid DESC LIMIT 1').get();
  return { res, order };
}

function linkFrom(text, pattern) {
  const m = text.match(pattern);
  return m && m[0];
}

module.exports = { startShop, sessionEvent, placeOrder, linkFrom, fakeTransport, WEBHOOK_SECRET };
