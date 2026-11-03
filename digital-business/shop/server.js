'use strict';
const path = require('path');
const Stripe = require('stripe');
const { loadConfig, assertProductionReady } = require('./src/config');
const { openDb } = require('./src/db');
const { createLogger } = require('./src/log');
const { createMailer } = require('./src/mailer');
const { createOrderService } = require('./src/orders');
const { createApp } = require('./src/app');

const cfg = loadConfig();
if (cfg.production) {
  const problems = assertProductionReady(cfg);
  if (problems.length) {
    console.error('Der Shop startet nicht im Produktivmodus, weil Folgendes fehlt:\n- ' + problems.join('\n- '));
    process.exit(1);
  }
}

const db = openDb(path.join(cfg.dataDir, 'shop.db'));
const log = createLogger(db);
const stripe = cfg.stripeSecretKey
  ? Stripe(cfg.stripeSecretKey, { maxNetworkRetries: 2, appInfo: { name: 'freikontor-shop', version: '1.0.0' } })
  : {
    webhooks: Stripe('sk_test_unconfigured').webhooks,
    checkout: { sessions: { create: async () => { throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt'); } } },
    refunds: { create: async () => { throw new Error('STRIPE_SECRET_KEY ist nicht gesetzt'); } },
  };
const mailer = createMailer(db, cfg, log);
const orders = createOrderService({ db, cfg, log, mailer, stripe });
const app = createApp({ cfg, db, log, mailer, orders, stripe });

if (!cfg.secret) log.warn('config.app_secret_missing', { hint: 'APP_SECRET setzen, sonst sind Abmeldelinks nach Neustart ungültig' });
if (cfg.business.missing.length) log.warn('config.business_incomplete', { missing: cfg.business.missing });

const safe = (name, fn) => async () => {
  try { await fn(); } catch (e) { log.error('job.failed', { job: name, error: e.message }); }
};
const timers = [
  setInterval(safe('mail', () => mailer.processQueue()), 15000),
  setInterval(safe('delivery', () => orders.deliverDue()), 60000),
  setInterval(safe('housekeeping', () => orders.housekeeping()), 3600000),
];
safe('mail', () => mailer.processQueue())();
safe('delivery', () => orders.deliverDue())();

const server = app.listen(cfg.port, () => log.info('server.started', { port: cfg.port, baseUrl: cfg.baseUrl, production: cfg.production }));
function shutdown() {
  timers.forEach(clearInterval);
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
