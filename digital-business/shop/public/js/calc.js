(function () {
  'use strict';
  // Tarif 2026 nach § 32a Abs. 1 EStG; identisch mit der Formel im Finanzcockpit.
  var P = { gfb: 12348, z2: 17799, a2: 914.51, b2: 1400, z3: 69878, a3: 173.10, b3: 2397, c3: 1034.87, z4: 277825, c4: 11135.63, c5: 19470.38, soliFg: 20350 };
  function tarif(x) {
    x = Math.floor(x);
    if (x <= P.gfb) return 0;
    if (x <= P.z2) { var y = (x - P.gfb) / 10000; return Math.floor((P.a2 * y + P.b2) * y); }
    if (x <= P.z3) { var z = (x - P.z2) / 10000; return Math.floor((P.a3 * z + P.b3) * z + P.c3); }
    if (x <= P.z4) return Math.floor(0.42 * x - P.c4);
    return Math.floor(0.45 * x - P.c5);
  }
  function est(zve, split) { zve = Math.max(0, Math.floor(zve)); return split ? 2 * tarif(Math.floor(zve / 2)) : tarif(zve); }
  function soli(base, split) {
    var fg = P.soliFg * (split ? 2 : 1);
    if (base <= fg) return 0;
    return Math.floor(Math.min(base * 0.055, (base - fg) * 0.119) * 100) / 100;
  }
  function total(zve, split, kist) { var e = est(zve, split); return e + soli(e, split) + Math.floor(e * kist * 100) / 100; }
  var eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  var pct = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 });
  function num(id) { var v = parseFloat(document.getElementById(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function run() {
    var g = num('c-gewinn'), a = num('c-andere'), sa = num('c-sa');
    var split = document.getElementById('c-ver').value === '1';
    var kist = parseFloat(document.getElementById('c-kist').value) || 0;
    var zMit = Math.max(0, Math.floor(g + a - sa)), zOhne = Math.max(0, Math.floor(a - sa));
    var mehr = Math.max(0, total(zMit, split, kist) - total(zOhne, split, kist));
    var x = split ? Math.floor(zMit / 2) : zMit, step = split ? 500 : 1000;
    var grenz = (tarif(x + step) - tarif(x)) / step;
    document.getElementById('r-mehr').textContent = eur.format(mehr);
    document.getElementById('r-quote').textContent = g > 0 ? pct.format(mehr / g) : '–';
    document.getElementById('r-monat').textContent = eur.format(mehr / 12);
    document.getElementById('r-grenz').textContent = pct.format(grenz);
    document.getElementById('r-zve').textContent = eur.format(zMit) + ' / ' + eur.format(zOhne);
  }
  var form = document.getElementById('calc');
  if (!form) return;
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  form.addEventListener('input', run);
  run();
  window.__fkTarif = tarif;
})();
