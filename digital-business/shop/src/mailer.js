'use strict';
// Transaktions-E-Mails laufen über eine Warteschlange (outbox) mit Wiederholungen,
// damit kein Download-Link verloren geht, wenn der SMTP-Server kurz nicht erreichbar ist.
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const BACKOFF_MIN = [1, 5, 15, 60, 180, 720];

function createTransport(cfg) {
  if (cfg.smtp) return nodemailer.createTransport(cfg.smtp);
  const dir = path.join(cfg.dataDir, 'mail-preview');
  fs.mkdirSync(dir, { recursive: true });
  const json = nodemailer.createTransport({ jsonTransport: true });
  return {
    async sendMail(msg) {
      const info = await json.sendMail(msg);
      const file = path.join(dir, `${Date.now()}-${String(msg.subject).replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.json`);
      fs.writeFileSync(file, info.message);
      return info;
    },
  };
}

function createMailer(db, cfg, log, transport = createTransport(cfg)) {
  const insert = db.prepare(`INSERT INTO outbox(kind, dedupe_key, to_addr, subject, text, html, next_attempt_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(dedupe_key) DO NOTHING`);

  function enqueue({ kind, dedupeKey = null, to, subject, text, html = null }) {
    const now = new Date().toISOString();
    const r = insert.run(kind, dedupeKey, to, subject, text, html, now, now);
    if (r.changes === 0) log.info('mail.duplicate_suppressed', { kind, dedupeKey });
    return r.changes === 1;
  }

  let running = false;
  async function processQueue(now = new Date()) {
    if (running) return 0;
    running = true;
    let sent = 0;
    try {
      const due = db.prepare(`SELECT * FROM outbox WHERE status = 'queued' AND next_attempt_at <= ? ORDER BY id LIMIT 20`)
        .all(now.toISOString());
      for (const m of due) {
        try {
          await transport.sendMail({ from: cfg.mailFrom, to: m.to_addr, subject: m.subject, text: m.text, html: m.html || undefined });
          db.prepare(`UPDATE outbox SET status = 'sent', sent_at = ?, attempts = attempts + 1, last_error = NULL WHERE id = ?`)
            .run(new Date().toISOString(), m.id);
          log.info('mail.sent', { id: m.id, kind: m.kind });
          sent++;
        } catch (e) {
          const attempts = m.attempts + 1;
          const failed = attempts >= BACKOFF_MIN.length;
          const next = new Date(now.getTime() + BACKOFF_MIN[Math.min(attempts, BACKOFF_MIN.length - 1)] * 60000);
          db.prepare(`UPDATE outbox SET attempts = ?, last_error = ?, next_attempt_at = ?, status = ? WHERE id = ?`)
            .run(attempts, String(e.message).slice(0, 500), next.toISOString(), failed ? 'failed' : 'queued', m.id);
          log.error('mail.failed', { id: m.id, kind: m.kind, attempts, error: e.message, final: failed });
        }
      }
    } finally {
      running = false;
    }
    return sent;
  }

  return { enqueue, processQueue, transport };
}

module.exports = { createMailer, createTransport };
