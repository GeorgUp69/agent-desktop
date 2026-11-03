'use strict';

function createLogger(db, { silent = false } = {}) {
  const insert = db.prepare('INSERT INTO events(at, level, type, order_id, detail) VALUES (?, ?, ?, ?, ?)');
  function write(level, type, detail = {}, orderId = null) {
    const at = new Date().toISOString();
    const clean = JSON.stringify(detail, (k, v) => (/secret|password|token/i.test(k) ? '[redacted]' : v));
    try {
      insert.run(at, level, type, orderId, clean);
    } catch (e) {
      if (!silent) console.error(JSON.stringify({ at, level: 'error', type: 'log.write_failed', error: e.message }));
    }
    if (!silent) console.log(JSON.stringify({ at, level, type, orderId, ...detail }));
  }
  return {
    info: (type, detail, orderId) => write('info', type, detail, orderId),
    warn: (type, detail, orderId) => write('warn', type, detail, orderId),
    error: (type, detail, orderId) => write('error', type, detail, orderId),
  };
}

module.exports = { createLogger };
