'use strict';
// Kopiert die gebauten Produktpakete in den geschützten Speicher des Shops.
const fs = require('fs');
const path = require('path');
const src = path.resolve(__dirname, '../../product/release');
const dst = path.resolve(__dirname, '../storage/products');
fs.mkdirSync(dst, { recursive: true });
for (const f of fs.readdirSync(src).filter((x) => x.endsWith('.zip'))) {
  fs.copyFileSync(path.join(src, f), path.join(dst, f));
  console.log('kopiert', f, fs.statSync(path.join(dst, f)).size, 'Bytes');
}
