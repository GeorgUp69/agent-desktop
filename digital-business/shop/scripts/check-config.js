'use strict';
// Prüft, ob alle Angaben für den Produktivbetrieb vorhanden sind.
const { loadConfig, assertProductionReady } = require('../src/config');
const cfg = loadConfig({ env: { NODE_ENV: 'production' } });
const problems = assertProductionReady({ ...cfg, production: true });
if (problems.length) {
  console.log('Noch offen:\n- ' + problems.join('\n- '));
  process.exit(1);
}
console.log('Konfiguration vollständig.');
