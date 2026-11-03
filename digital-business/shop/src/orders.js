'use strict';
const { EDITIONS } = require('./catalog');
const { tx, nextCounter } = require('./db');
const emails = require('./emails');
const { LEGAL_VERSION } = require('./legal');
const { randomToken, sha256 } = require('./util');

const PENDING_TTL_HOURS = 24;

function createOrderService({ db, cfg, log, mailer, stripe, clock = () => new Date() }) {
  const now = () => clock().toISOString();
  const byId = (id) => db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  const byNumber = (n) => db.prepare('SELECT * FROM orders WHERE order_number = ?').get(n);

  function newOrderNumber() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (;;) {
      const bytes = require('crypto').randomBytes(8);
      const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
      const n = `FK-${code.slice(0, 4)}-${code.slice(4)}`;
      if (!byNumber(n)) return n;
    }
  }

  function validateUpgrade(upgradeOf, email) {
    const base = upgradeOf && byNumber(String(upgradeOf).trim().toUpperCase());
    if (!base || base.email !== email || base.edition !== 'basis' || !['paid', 'delivered'].includes(base.status)) {
      return null;
    }
    return base;
  }

  function createOrder({ edition, email, consentEarly, upgradeOf }) {
    const ed = EDITIONS[edition];
    if (!ed) throw Object.assign(new Error('Unbekannte Edition'), { status: 400 });
    let base = null;
    if (ed.requiresEdition) {
      base = validateUpgrade(upgradeOf, email);
      if (!base) throw Object.assign(new Error('Wir finden keine bezahlte Basis-Bestellung mit dieser Bestellnummer und E-Mail-Adresse.'), { status: 422 });
    }
    const t = now();
    const order = {
      id: randomToken(12),
      order_number: newOrderNumber(),
      edition,
      email,
      price_cents: ed.priceCents,
      consent_early_delivery: consentEarly ? 1 : 0,
      consent_text_version: LEGAL_VERSION,
      terms_accepted_at: t,
      upgrade_of: base ? base.order_number : null,
      created_at: t,
      updated_at: t,
    };
    db.prepare(`INSERT INTO orders(id, order_number, edition, email, price_cents, consent_early_delivery, consent_text_version,
      terms_accepted_at, upgrade_of, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .run(order.id, order.order_number, order.edition, order.email, order.price_cents, order.consent_early_delivery,
        order.consent_text_version, order.terms_accepted_at, order.upgrade_of, order.created_at, order.updated_at);
    log.info('order.created', { edition, consentEarly: Boolean(consentEarly) }, order.id);
    return byId(order.id);
  }

  async function createCheckout(order) {
    const ed = EDITIONS[order.edition];
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'de',
      customer_email: order.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id, order_number: order.order_number },
      payment_intent_data: { metadata: { order_id: order.id, order_number: order.order_number } },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'eur',
          unit_amount: order.price_cents,
          product_data: { name: `Freikontor ${ed.name}`, description: ed.summary, metadata: { edition: ed.id } },
        },
      }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      submit_type: 'pay',
      expires_at: Math.floor(clock().getTime() / 1000) + 60 * 60,
      custom_text: { submit: { message: `Bestellung ${order.order_number} wurde bereits zahlungspflichtig aufgegeben. Hier schließt du die Zahlung ab.` } },
      success_url: `${cfg.baseUrl}/bestellung/danke?nr=${encodeURIComponent(order.order_number)}`,
      cancel_url: `${cfg.baseUrl}/kasse/${order.edition}?abgebrochen=1`,
    }, { idempotencyKey: `checkout-${order.id}` });
    db.prepare('UPDATE orders SET stripe_session_id = ?, updated_at = ? WHERE id = ?').run(session.id, now(), order.id);
    log.info('checkout.session_created', { session: session.id }, order.id);
    return session;
  }

  function issueAccess(orderId) {
    const token = randomToken(32);
    const expires = emails.addDays(clock(), cfg.downloadLinkDays).toISOString();
    db.prepare('INSERT INTO access_tokens(token_hash, order_id, expires_at, created_at) VALUES (?,?,?,?)')
      .run(sha256(token), orderId, expires, now());
    return `${cfg.baseUrl}/downloads/${token}`;
  }

  function invoiceUrl(order) {
    const token = randomToken(24);
    db.prepare('INSERT INTO access_tokens(token_hash, order_id, expires_at, created_at) VALUES (?,?,?,?)')
      .run(sha256('inv:' + token), order.id, '9999-12-31T00:00:00.000Z', now());
    return `${cfg.baseUrl}/rechnung/${token}`;
  }

  function sessionMatchesOrder(session, order) {
    if (!order) return 'order_not_found';
    if (session.id !== order.stripe_session_id) return 'session_mismatch';
    if (session.currency !== 'eur') return 'currency_mismatch';
    if (typeof session.amount_total !== 'number' || session.amount_total > order.price_cents || session.amount_total < 0) return 'amount_mismatch';
    if (cfg.requireLivemode && !session.livemode) return 'not_livemode';
    return null;
  }

  function markPaid(session) {
    const order = byId(session.metadata && session.metadata.order_id);
    const problem = sessionMatchesOrder(session, order);
    if (problem) {
      log.error('payment.rejected', { reason: problem, session: session.id }, order && order.id);
      return { ok: false, reason: problem };
    }
    const result = tx(db, () => {
      const t = now();
      const consent = Boolean(order.consent_early_delivery);
      const available = consent ? t : emails.addDays(clock(), cfg.withdrawalDays + 1).toISOString();
      const upd = db.prepare(`UPDATE orders SET status = 'paid', paid_at = ?, amount_paid_cents = ?, stripe_payment_intent = ?,
          billing_country = ?, delivery_available_at = ?, updated_at = ? WHERE id = ? AND status IN ('pending', 'processing')`)
        .run(t, session.amount_total, typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent && session.payment_intent.id) || null,
          (session.customer_details && session.customer_details.address && session.customer_details.address.country) || null,
          available, t, order.id);
      if (upd.changes !== 1) return { ok: true, duplicate: true };
      const year = t.slice(0, 4);
      const inv = `${cfg.business.invoice_prefix || 'FK'}-${year}-${String(nextCounter(db, 'invoice-' + year)).padStart(5, '0')}`;
      db.prepare('UPDATE orders SET invoice_number = ? WHERE id = ?').run(inv, order.id);
      const fresh = byId(order.id);
      const links = { invoiceUrl: invoiceUrl(fresh), accessUrl: consent ? issueAccess(order.id) : null };
      const mail = emails.confirmation(fresh, links, cfg);
      mailer.enqueue({ kind: 'order_confirmation', dedupeKey: `confirm:${order.id}`, to: fresh.email, ...mail });
      if (consent) db.prepare(`UPDATE orders SET status = 'delivered', delivered_at = ? WHERE id = ?`).run(t, order.id);
      if (cfg.ownerNotifyEmail) {
        mailer.enqueue({ kind: 'owner_sale', dedupeKey: `owner-sale:${order.id}`, to: cfg.ownerNotifyEmail,
          ...emails.ownerNotice(`Neuer Verkauf ${fresh.order_number}`, [`${EDITIONS[fresh.edition].name}: ${(session.amount_total / 100).toFixed(2)} €`, `Rechnung ${inv}`], cfg) });
      }
      return { ok: true, duplicate: false, invoice: inv };
    });
    log.info(result.duplicate ? 'payment.duplicate_ignored' : 'payment.confirmed', { session: session.id }, order.id);
    if (!result.duplicate) recordFee(order.id).catch(() => {});
    return result;
  }

  async function recordFee(orderId) {
    const o = byId(orderId);
    if (!o || !o.stripe_payment_intent || !stripe.paymentIntents) return;
    try {
      const pi = await stripe.paymentIntents.retrieve(o.stripe_payment_intent, { expand: ['latest_charge.balance_transaction'] });
      const fee = pi && pi.latest_charge && pi.latest_charge.balance_transaction && pi.latest_charge.balance_transaction.fee;
      if (typeof fee === 'number') db.prepare('UPDATE orders SET stripe_fee_cents = ? WHERE id = ?').run(fee, orderId);
    } catch (e) {
      log.warn('payment.fee_lookup_failed', { error: e.message }, orderId);
    }
  }

  function markStatus(sessionOrOrderId, status, allowedFrom) {
    const id = typeof sessionOrOrderId === 'string' ? sessionOrOrderId : sessionOrOrderId.metadata && sessionOrOrderId.metadata.order_id;
    const placeholders = allowedFrom.map(() => '?').join(',');
    const r = db.prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status IN (${placeholders})`)
      .run(status, now(), id, ...allowedFrom);
    if (r.changes) log.info('order.status', { status }, id);
    return r.changes === 1;
  }

  function revokeAccess(orderId) {
    db.prepare('UPDATE access_tokens SET revoked = 1 WHERE order_id = ?').run(orderId);
  }

  function handleRefund(charge) {
    const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent && charge.payment_intent.id;
    const order = pi && db.prepare('SELECT * FROM orders WHERE stripe_payment_intent = ?').get(pi);
    if (!order) return log.warn('refund.order_not_found', { pi });
    const full = charge.amount_refunded >= charge.amount;
    if (!full) return log.info('refund.partial', { amount: charge.amount_refunded }, order.id);
    const changed = db.prepare(`UPDATE orders SET status = 'refunded', refunded_at = ?, updated_at = ? WHERE id = ? AND status != 'refunded'`)
      .run(now(), now(), order.id).changes;
    revokeAccess(order.id);
    if (changed) {
      mailer.enqueue({ kind: 'refund', dedupeKey: `refund:${order.id}`, to: order.email, ...emails.refundNotice(order, cfg) });
      log.info('refund.processed', {}, order.id);
    }
  }

  function handleDispute(dispute) {
    const pi = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent && dispute.payment_intent.id;
    const order = pi && db.prepare('SELECT * FROM orders WHERE stripe_payment_intent = ?').get(pi);
    if (!order) return;
    db.prepare(`UPDATE orders SET status = 'disputed', updated_at = ? WHERE id = ?`).run(now(), order.id);
    revokeAccess(order.id);
    log.warn('dispute.created', { reason: dispute.reason }, order.id);
    if (cfg.ownerNotifyEmail) {
      mailer.enqueue({ kind: 'owner_dispute', dedupeKey: `dispute:${dispute.id}`, to: cfg.ownerNotifyEmail,
        ...emails.ownerNotice(`Zahlungsstreit zu ${order.order_number}`, ['Bitte im Stripe-Dashboard reagieren.', `Grund: ${dispute.reason}`], cfg) });
    }
  }

  function handleEvent(event) {
    const seen = db.prepare('INSERT INTO stripe_events(id, type, received_at) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING')
      .run(event.id, event.type, now());
    if (seen.changes === 0) {
      log.info('stripe.event_duplicate', { id: event.id, type: event.type });
      return { duplicate: true };
    }
    const obj = event.data && event.data.object;
    let result = { handled: true };
    switch (event.type) {
      case 'checkout.session.completed':
        if (obj.payment_status === 'paid' || obj.payment_status === 'no_payment_required') result = markPaid(obj);
        else markStatus(obj, 'processing', ['pending']);
        break;
      case 'checkout.session.async_payment_succeeded':
        result = markPaid(obj);
        break;
      case 'checkout.session.async_payment_failed':
        markStatus(obj, 'failed', ['pending', 'processing']);
        break;
      case 'checkout.session.expired':
        markStatus(obj, 'expired', ['pending']);
        break;
      case 'charge.refunded':
        handleRefund(obj);
        break;
      case 'charge.dispute.created':
        handleDispute(obj);
        break;
      default:
        result = { handled: false };
    }
    db.prepare('UPDATE stripe_events SET processed_at = ? WHERE id = ?').run(now(), event.id);
    return result;
  }

  function deliverDue() {
    const due = db.prepare(`SELECT * FROM orders WHERE status = 'paid' AND delivered_at IS NULL AND withdrawn_at IS NULL
      AND delivery_available_at <= ?`).all(now());
    for (const o of due) {
      tx(db, () => {
        const r = db.prepare(`UPDATE orders SET status = 'delivered', delivered_at = ?, updated_at = ? WHERE id = ? AND delivered_at IS NULL`)
          .run(now(), now(), o.id);
        if (r.changes !== 1) return;
        const mail = emails.deliveryReady(o, { accessUrl: issueAccess(o.id) }, cfg);
        mailer.enqueue({ kind: 'delivery', dedupeKey: `delivery:${o.id}`, to: o.email, ...mail });
      });
      log.info('delivery.released_after_withdrawal_period', {}, o.id);
    }
    return due.length;
  }

  function requestAccessLinks(email) {
    const orders = db.prepare(`SELECT * FROM orders WHERE email = ? AND status = 'delivered' ORDER BY created_at`).all(email);
    if (!orders.length) {
      log.info('access.request_no_orders', {});
      return false;
    }
    const links = orders.map((o) => issueAccess(o.id));
    mailer.enqueue({ kind: 'access_link', to: email, ...emails.accessLink(orders, links, cfg) });
    log.info('access.links_sent', { count: orders.length });
    return true;
  }

  function resolveAccess(token) {
    const row = db.prepare(`SELECT t.*, o.status AS order_status FROM access_tokens t JOIN orders o ON o.id = t.order_id WHERE t.token_hash = ?`)
      .get(sha256(token));
    if (!row) return { error: 'not_found' };
    if (row.revoked) return { error: 'revoked' };
    if (row.expires_at < now()) return { error: 'expired' };
    if (row.order_status !== 'delivered') return { error: 'not_available' };
    return { order: byId(row.order_id) };
  }

  function resolveInvoice(token) {
    const row = db.prepare('SELECT * FROM access_tokens WHERE token_hash = ?').get(sha256('inv:' + token));
    if (!row) return null;
    const o = byId(row.order_id);
    return o && o.invoice_number ? o : null;
  }

  function countDownload(orderId, file) {
    const n = db.prepare('SELECT COUNT(*) AS n FROM downloads WHERE order_id = ? AND file = ?').get(orderId, file).n;
    if (n >= cfg.maxDownloadsPerFile) return false;
    db.prepare('INSERT INTO downloads(order_id, file, at) VALUES (?,?,?)').run(orderId, file, now());
    return true;
  }

  async function autoRefundIfUndelivered(orderNumber, email) {
    const o = orderNumber && byNumber(String(orderNumber).trim().toUpperCase());
    if (!o || o.email !== email) return false;
    db.prepare('UPDATE orders SET withdrawn_at = COALESCE(withdrawn_at, ?) WHERE id = ?').run(now(), o.id);
    if (o.status !== 'paid' || o.delivered_at || !o.stripe_payment_intent) return false;
    try {
      await stripe.refunds.create({ payment_intent: o.stripe_payment_intent, reason: 'requested_by_customer',
        metadata: { order_id: o.id, reason: 'widerruf' } }, { idempotencyKey: `withdrawal-refund-${o.id}` });
      log.info('withdrawal.auto_refund_requested', {}, o.id);
      return true;
    } catch (e) {
      log.error('withdrawal.auto_refund_failed', { error: e.message }, o.id);
      return false;
    }
  }

  function housekeeping() {
    const cutoff = new Date(clock().getTime() - PENDING_TTL_HOURS * 3600000).toISOString();
    const abandoned = db.prepare(`UPDATE orders SET status = 'abandoned', updated_at = ? WHERE status IN ('pending') AND created_at < ?`)
      .run(now(), cutoff).changes;
    const purgeBefore = new Date(clock().getTime() - 30 * 86400000).toISOString();
    const purged = db.prepare(`DELETE FROM orders WHERE status IN ('abandoned', 'expired', 'failed') AND created_at < ?
      AND id NOT IN (SELECT order_id FROM access_tokens) AND id NOT IN (SELECT order_id FROM downloads)`).run(purgeBefore).changes;
    const contactBefore = new Date(clock().getTime() - 183 * 86400000).toISOString();
    const contacts = db.prepare('DELETE FROM contact_messages WHERE created_at < ?').run(contactBefore).changes;
    const nlBefore = new Date(clock().getTime() - 3 * 365 * 86400000).toISOString();
    db.prepare('DELETE FROM newsletter WHERE confirmed_at IS NULL AND requested_at < ?').run(new Date(clock().getTime() - 30 * 86400000).toISOString());
    db.prepare('DELETE FROM newsletter WHERE unsubscribed_at IS NOT NULL AND unsubscribed_at < ?').run(nlBefore);
    if (abandoned || purged || contacts) log.info('housekeeping', { abandoned, purged, contacts });
  }

  return { createOrder, createCheckout, handleEvent, markPaid, deliverDue, requestAccessLinks, resolveAccess, resolveInvoice,
    countDownload, autoRefundIfUndelivered, housekeeping, byId, byNumber, issueAccess };
}

module.exports = { createOrderService };
