'use strict';
const { html, raw } = require('../util');

function layout(cfg, { title, description, path = '/', body, noindex = false, jsonLd = [], ogImage = '/img/og.png', bodyClass = '' }) {
  const b = cfg.business;
  const brand = b.brand || 'Freikontor';
  const canonical = cfg.baseUrl + path;
  const fullTitle = path === '/' ? title : `${title} | ${brand}`;
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization', name: brand, url: cfg.baseUrl,
    logo: cfg.baseUrl + '/img/logo-mark.svg', email: b.email.includes('BITTE') ? undefined : b.email,
  };
  const ld = [org, ...jsonLd].map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  return '<!doctype html>' + html`
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${fullTitle}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}">
${noindex ? raw('<meta name="robots" content="noindex, nofollow">') : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="de_DE">
<meta property="og:site_name" content="${brand}">
<meta property="og:title" content="${fullTitle}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${cfg.baseUrl + ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#14213D">
<link rel="icon" href="/img/logo-mark.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/inter-latin-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/site.css?v=1">
${raw(ld)}
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${brand} Startseite"><img src="/img/logo-mark.svg" alt="" width="30" height="30">${brand}</a>
    <nav class="nav" aria-label="Hauptnavigation">
      <a href="/finanzcockpit">Finanzcockpit</a>
      <a href="/steuerruecklage-rechner">Rücklage-Rechner</a>
      <a href="/finanzcockpit#preise">Preise</a>
      <a href="/faq">FAQ</a>
      <a class="btn btn-primary btn-small" href="/finanzcockpit#preise">Jetzt kaufen</a>
    </nav>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav" data-menu>Menü</button>
  </div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile Navigation">
    <a href="/finanzcockpit">Finanzcockpit</a>
    <a href="/steuerruecklage-rechner">Rücklage-Rechner</a>
    <a href="/finanzcockpit#preise">Preise</a>
    <a href="/faq">FAQ</a>
    <a href="/meine-downloads">Meine Downloads</a>
  </nav>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div>
        <a class="brand" href="/" style="color:#fff"><img src="/img/logo-mark.svg" alt="" width="30" height="30">${brand}</a>
        <p style="margin-top:12px;max-width:30em">Klare Finanzen für Selbstständige. Werkzeuge zur Organisation und Schätzung – keine Steuerberatung.</p>
        <form class="newsletter-form" method="post" action="/newsletter">
          <label for="nl-email" style="color:#fff">Newsletter: neue Jahresausgaben &amp; Steueränderungen</label>
          <input id="nl-email" type="email" name="email" required autocomplete="email" placeholder="deine@email.de">
          <label class="check"><input type="checkbox" name="consent" value="1" required><span>Ja, ich möchte den Newsletter per E-Mail erhalten. Abmeldung jederzeit möglich. Hinweise in der <a href="/datenschutz">Datenschutzerklärung</a>.</span></label>
          <div class="hp" aria-hidden="true"><label>Firma<input type="text" name="company" tabindex="-1" autocomplete="off"></label></div>
          <button class="btn btn-ghost btn-small" style="color:#fff;border-color:#55627E" type="submit">Anmelden</button>
        </form>
      </div>
      <div><h4>Produkt</h4><ul>
        <li><a href="/finanzcockpit">Finanzcockpit 2026</a></li>
        <li><a href="/steuerruecklage-rechner">Steuerrücklage-Rechner</a></li>
        <li><a href="/faq">FAQ</a></li>
        <li><a href="/meine-downloads">Meine Downloads</a></li>
      </ul></div>
      <div><h4>Unternehmen</h4><ul>
        <li><a href="/ueber-uns">Über uns</a></li>
        <li><a href="/kontakt">Kontakt</a></li>
        <li><a href="/zahlung-und-lieferung">Zahlung &amp; Lieferung</a></li>
      </ul></div>
      <div><h4>Rechtliches</h4><ul>
        <li><a href="/impressum">Impressum</a></li>
        <li><a href="/datenschutz">Datenschutz</a></li>
        <li><a href="/agb">AGB</a></li>
        <li><a href="/widerrufsbelehrung">Widerrufsbelehrung</a></li>
        ${cfg.tiktokPixelId ? raw('<li><a href="#" data-consent-open>Cookie-Einstellungen</a></li>') : ''}
      </ul>
      <a class="withdraw-link" href="/vertrag-widerrufen">Vertrag widerrufen</a></div>
    </div>
    <p class="legal-line">© ${String(new Date().getFullYear())} ${b.legal_name}. Alle Preise sind Endpreise${b.vat_mode === 'regel' ? ' inkl. gesetzlicher USt.' : '; gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'} Keine Versandkosten, digitale Lieferung.</p>
  </div>
</footer>
${cfg.tiktokPixelId ? html`
<div class="consent" id="consent" hidden role="dialog" aria-labelledby="consent-title">
  <strong id="consent-title">Darf TikTok messen, ob unsere Werbung funktioniert?</strong>
  <p style="margin:6px 0 0">Mit deiner Einwilligung laden wir das TikTok Pixel. Dabei werden Daten an TikTok (auch in Drittländer) übermittelt. Ohne Einwilligung funktioniert alles genauso. Details in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
  <div class="row"><button class="btn btn-ghost btn-small" data-consent="deny" type="button">Ablehnen</button><button class="btn btn-ghost btn-small" data-consent="allow" type="button">Akzeptieren</button></div>
</div>` : ''}
<script src="/js/site.js?v=1" defer ${cfg.tiktokPixelId ? raw(`data-pixel="${cfg.tiktokPixelId.replace(/[^A-Z0-9]/gi, '')}"`) : ''}></script>
</body>
</html>`;
}

module.exports = { layout };
