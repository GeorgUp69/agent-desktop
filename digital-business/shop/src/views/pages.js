'use strict';
const { html, raw, formatDate, formatDateTime } = require('../util');
const { EDITIONS, formatEuro, vatInfo } = require('../catalog');
const legal = require('../legal');
const { layout } = require('./layout');
const { FAQ, COMPARE } = require('./content');

function shot(name, alt, eager = false) {
  return html`<picture><source media="(max-width: 760px)" srcset="/img/${name}-760.webp"><img src="/img/${name}.webp" alt="${alt}" ${raw(eager ? 'fetchpriority="high"' : 'loading="lazy"')} width="1400" height="934"></picture>`;
}

function priceTag(cfg, ed) {
  return html`<p class="price">${formatEuro(ed.priceCents).replace(',00', '')}<small> einmalig</small></p><p class="vat">${vatInfo(cfg.business, ed.priceCents).label} Keine Abo-Kosten. Digitale Lieferung.</p>`;
}

function pricing(cfg) {
  return html`<div class="pricing">${['basis', 'pro'].map((id) => {
    const ed = EDITIONS[id];
    return html`<div class="price-card ${ed.recommended ? 'rec' : ''}">
      ${ed.recommended ? raw('<span class="badge">Empfohlen</span>') : ''}
      <h3>${ed.name}</h3>
      <p class="muted">${ed.summary}</p>
      ${priceTag(cfg, ed)}
      <ul class="ticks">${ed.features.map((f) => html`<li>${f}</li>`)}</ul>
      <a class="btn ${ed.recommended ? 'btn-primary' : 'btn-dark'} btn-block" href="/kasse/${id}">${ed.name.replace('Finanzcockpit 2026 ', '')} wählen</a>
    </div>`;
  })}</div>
  <p class="muted" style="margin-top:16px;font-size:.9rem">Schon Basis gekauft? <a href="/kasse/upgrade">Upgrade auf PRO für ${formatEuro(EDITIONS.upgrade.priceCents)}</a>.</p>`;
}

function faqBlock(items) {
  return html`${items.map(([q, a]) => html`<details><summary>${q}</summary><div><p>${a}</p></div></details>`)}`;
}

function productLd(cfg) {
  return {
    '@context': 'https://schema.org', '@type': 'Product', name: 'Freikontor Finanzcockpit 2026',
    description: 'Excel-Finanzcockpit für Selbstständige: Einnahmen, Ausgaben, EÜR, Umsatzsteuer, Steuerrücklage nach § 32a EStG und Kleinunternehmer-Monitor.',
    image: [cfg.baseUrl + '/img/dashboard-ku.webp'], brand: { '@type': 'Brand', name: cfg.business.brand || 'Freikontor' },
    offers: ['basis', 'pro'].map((id) => ({
      '@type': 'Offer', name: EDITIONS[id].name, price: (EDITIONS[id].priceCents / 100).toFixed(2), priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock', url: `${cfg.baseUrl}/kasse/${id}`,
    })),
  };
}

function home(cfg) {
  const body = html`
<section class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow">Für Selbstständige, Freelancer &amp; Nebenberufler</span>
    <h1>Wie viel Steuer musst du zurücklegen? Dein Finanzcockpit rechnet es aus.</h1>
    <p class="lead">Einnahmen, Ausgaben, EÜR, Umsatzsteuer und Kleinunternehmergrenze in einer Excel-Datei. Mit echter Steuerberechnung nach Tarif 2025/2026 statt pauschal „30 %“. Einmal kaufen, kein Abo.</p>
    <div class="hero-cta"><a class="btn btn-primary" href="/finanzcockpit#preise">Ab 29 € einmalig</a><a class="btn btn-ghost" href="/steuerruecklage-rechner">Kostenlos Rücklage schätzen</a></div>
    <ul class="hero-note"><li>Excel, LibreOffice, Google Sheets</li><li>Daten bleiben bei dir</li><li>Sofort-Download möglich</li></ul>
  </div>
  <div><div class="frame"><div class="frame-bar"><span></span><span></span><span></span></div>${shot('dashboard-ku', 'Dashboard des Finanzcockpits mit Gewinn, Soll-Rücklage und Kleinunternehmer-Status', true)}</div>
  <p class="caption">Echte Ansicht der Datei mit fiktiven Beispieldaten.</p></div>
</div></section>

<section class="block white"><div class="wrap">
  <div class="section-head"><h2>Die Nachzahlung kommt. Die Frage ist, ob du vorbereitet bist.</h2>
  <p class="muted">Nach der ersten Steuererklärung kommen oft zwei Beträge auf einmal: die Nachzahlung fürs Vorjahr und Vorauszahlungen fürs laufende Jahr. Wer unterjährig nicht weiß, wo er steht, merkt es zu spät.</p></div>
  <div class="grid-3">
    <div class="card pain"><h3>„Reichen 30 %?“</h3><p class="muted">Pauschalen passen selten. Mit Gehalt im Hauptjob kann deine Rücklagequote deutlich höher liegen, als Gründer mit kleinem Gewinn deutlich niedriger.</p></div>
    <div class="card pain"><h3>„Bin ich noch Kleinunternehmer?“</h3><p class="muted">Seit 2025 gelten 25.000 € und 100.000 €. Über 100.000 € endet die Regelung sofort, im Gründungsjahr gilt die 25.000-€-Grenze.</p></div>
    <div class="card pain"><h3>„Was ist mit Meta- und Google-Werbung?“</h3><p class="muted">Rechnungen aus Irland ohne USt lösen Reverse Charge aus. Diese Umsatzsteuer schulden auch Kleinunternehmer.</p></div>
  </div>
</div></section>

<section class="block"><div class="wrap grid-2">
  <div><h2>Echte Zahlen statt Bauchgefühl</h2>
  <p>Das Finanzcockpit rechnet zweimal: einmal mit deiner Selbstständigkeit, einmal ohne. Die Differenz ist die Steuer, die dein Gewinn tatsächlich auslöst – inklusive Gehalt, Splitting, Solidaritätszuschlag, Kirchensteuer und Gewerbesteuer mit § 35-Anrechnung.</p>
  <p>Daraus entsteht deine persönliche Faustregel: <strong>„x % jeder Zahlung zurücklegen“</strong> – und der Abgleich mit deinem Rücklagekonto.</p>
  <a class="btn btn-dark" href="/finanzcockpit">Alle Funktionen ansehen</a></div>
  <div class="frame">${shot('ruecklage-ku', 'Blatt Steuerrücklage mit Vergleich mit und ohne Selbstständigkeit')}</div>
</div></section>

<section class="block white"><div class="wrap">
  <div class="section-head"><h2>Warum nicht einfach eine kostenlose Vorlage?</h2><p class="muted">Kostenlose Vorlagen sind gut zum Erfassen. Abo-Software ist gut für Rechnungen und Bankabgleich. Das Finanzcockpit schließt die Lücke dazwischen: Es sagt dir, was am Ende übrig bleibt.</p></div>
  <div class="table-wrap"><table class="compare"><thead><tr><th>Funktion</th><th>Kostenlose EÜR-Vorlage</th><th>Buchhaltungs-Abo</th><th class="us">Freikontor Finanzcockpit</th></tr></thead>
  <tbody>${COMPARE.map((r) => html`<tr><td>${r[0]}</td>${r.slice(1).map((v, i) => html`<td class="${i === 2 ? 'us' : ''} ${v === 'yes' ? 'yes' : v === 'no' ? 'no' : ''}">${v === 'yes' ? '✓ ja' : v === 'no' ? '– nein' : v}</td>`)}</tr>`)}</tbody></table></div>
  <p class="caption">Vergleich mit typischen Produktkategorien, nicht mit einzelnen Anbietern. Abo-Preise: Listenpreise gängiger Anbieter für Selbstständige, Stand 2026.</p>
</div></section>

<section class="block" id="preise"><div class="wrap">
  <div class="section-head"><h2>Einmal zahlen. Das ganze Jahr Überblick.</h2></div>
  ${pricing(cfg)}
</div></section>

<section class="block white"><div class="wrap" style="max-width:820px">
  <h2>Häufige Fragen</h2>
  ${faqBlock(FAQ.slice(0, 5))}
  <p><a href="/faq">Alle Fragen ansehen →</a></p>
</div></section>`;
  return layout(cfg, {
    title: 'Freikontor – Finanzcockpit für Selbstständige: Steuerrücklage, EÜR, Kleinunternehmer',
    description: 'Excel-Finanzcockpit für Selbstständige: Steuerrücklage nach Tarif 2026, EÜR, Umsatzsteuer und Kleinunternehmer-Monitor. Einmalig ab 29 €, kein Abo, Daten bleiben bei dir.',
    path: '/', body, jsonLd: [productLd(cfg)],
  });
}

function product(cfg) {
  const features = [
    ['€', 'Steuerrücklage nach Tarif', 'ESt nach § 32a EStG (2025/2026), Splitting, Soli, Kirchensteuer, Gewerbesteuer mit Freibetrag und § 35-Anrechnung. Mit Hochrechnung und Abgleich deines Rücklagekontos.'],
    ['§', 'Kleinunternehmer-Monitor', 'Grenzen seit 2025, Gründungsjahr-Regel, Hochrechnung und die Rechnung, mit der eine Grenze überschritten wird.'],
    ['↗', 'Einnahmen & offene Posten', 'Rechnungsausgangsbuch mit Zahlungsziel, „Überfällig“-Markierung und Summe offener Rechnungen.'],
    ['↘', 'Ausgaben ohne Rechnen', 'Bruttobetrag eintragen, Vorsteuer und Netto entstehen automatisch. Bewirtung 70 %, Geschenke und § 13b inklusive.'],
    ['Σ', 'EÜR & Umsatzsteuer', 'Jahresübersicht nach Kategorien der Anlage EÜR und Voranmeldungswerte pro Monat und Quartal.'],
    ['◎', 'Dashboard', 'Gewinn, Marge, Soll-Rücklage, offene Rechnungen und Monatsverlauf auf einen Blick.'],
  ];
  const body = html`
<section class="hero"><div class="wrap hero-grid">
  <div>
    <span class="eyebrow">Ausgabe 2026 · Steuerwerte 2025 &amp; 2026</span>
    <h1>Finanzcockpit 2026 für Selbstständige</h1>
    <p class="lead">Die Excel-Arbeitsmappe, die dir jederzeit sagt, wie viel Gewinn du gemacht hast, wie viel davon dem Finanzamt gehört und ob du noch Kleinunternehmer bist.</p>
    <div class="hero-cta"><a class="btn btn-primary" href="#preise">Edition wählen</a><a class="btn btn-ghost" href="#ansichten">Ansichten</a></div>
    <ul class="hero-note"><li>Keine Makros</li><li>Offline nutzbar</li><li>Handbuch mit 17 Seiten</li></ul>
  </div>
  <div class="frame"><div class="frame-bar"><span></span><span></span><span></span></div>${shot('ku-monitor', 'Kleinunternehmer-Monitor mit Fortschrittsbalken und Status', true)}</div>
</div></section>

<section class="block white"><div class="wrap">
  <div class="section-head"><h2>Was das Finanzcockpit für dich erledigt</h2></div>
  <div class="grid-3">${features.map(([i, t, d]) => html`<div class="card"><div class="icon" aria-hidden="true">${i}</div><h3>${t}</h3><p class="muted">${d}</p></div>`)}</div>
</div></section>

<section class="block" id="ansichten"><div class="wrap">
  <div class="section-head"><h2>So sieht es aus</h2><p class="muted">Echte Ansichten der Datei, gerendert aus den mitgelieferten Beispieldateien. Alle Namen und Beträge sind fiktiv.</p></div>
  <div class="gallery">
    <figure class="frame">${shot('dashboard-regel', 'Dashboard, Beispiel regelbesteuert')}</figure>
    <figure class="frame">${shot('ruecklage-regel', 'Steuerrücklage mit Gewerbesteuer und Splitting')}</figure>
    <figure class="frame">${shot('einnahmen', 'Einnahmen mit Status offen, bezahlt, überfällig')}</figure>
    <figure class="frame">${shot('ausgaben', 'Ausgaben mit Vorsteuer und Reverse Charge')}</figure>
    <figure class="frame">${shot('umsatzsteuer', 'Umsatzsteuer-Voranmeldung nach Monaten')}</figure>
    <figure class="frame">${shot('stundensatz', 'PRO: Stundensatzrechner')}</figure>
  </div>
</div></section>

<section class="block dark"><div class="wrap grid-2">
  <div><h2>Geprüft statt geschätzt</h2>
  <p class="muted">Jede Steuerformel wurde automatisiert gegen eine unabhängig geschriebene Referenzrechnung getestet: der Tarif an über 600 Einkommenswerten inklusive aller Zonengrenzen für 2025 und 2026, dazu EÜR, Rücklage, Reverse Charge und alle Kleinunternehmer-Grenzfälle.</p></div>
  <div><h2>Ehrlich bei den Grenzen</h2>
  <p class="muted">Das Cockpit ist keine Steuerberatung und gibt keine Erklärung ab. Was es vereinfacht (z. B. Kinderfreibeträge, Verlustvorträge, gewerbesteuerliche Hinzurechnungen), steht im Handbuch – nicht im Kleingedruckten.</p></div>
</div></section>

<section class="block" id="preise"><div class="wrap">
  <div class="section-head"><h2>Edition wählen</h2><p class="muted">Lieferumfang Basis: Arbeitsmappe (.xlsx), 2 Beispieldateien, Handbuch (PDF, 17 Seiten), Schnellstart (PDF). PRO zusätzlich: Stundensatz, Liquidität, Fristen 2027 (.xlsx-Blatt und .ics), Checklisten (PDF, 6 Seiten).</p></div>
  ${pricing(cfg)}
</div></section>

<section class="block white"><div class="wrap" style="max-width:820px"><h2>Fragen zum Produkt</h2>${faqBlock(FAQ.slice(0, 8))}</div></section>`;
  return layout(cfg, {
    title: 'Finanzcockpit 2026 – Excel-Vorlage für Steuerrücklage, EÜR & Kleinunternehmer',
    description: 'Excel-Vorlage für Selbstständige mit Steuerrücklage nach § 32a EStG 2026, EÜR, Umsatzsteuer-Voranmeldung, Kleinunternehmer-Monitor und Dashboard. Basis 29 €, PRO 49 €.',
    path: '/finanzcockpit', body, jsonLd: [productLd(cfg)],
  });
}

function faqPage(cfg) {
  const body = html`<div class="wrap" style="max-width:860px;padding-top:40px;padding-bottom:64px"><h1>Häufige Fragen</h1>${faqBlock(FAQ)}
  <p>Deine Frage ist nicht dabei? <a href="/kontakt">Schreib uns</a>.</p></div>`;
  return layout(cfg, {
    title: 'FAQ – Fragen zum Finanzcockpit', description: 'Antworten zu Steuerrücklage, Kleinunternehmerregelung, Programmen, Download, Widerruf und Rechnung beim Freikontor Finanzcockpit.',
    path: '/faq', body,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
  });
}

function about(cfg) {
  const b = cfg.business;
  const body = html`<article class="prose"><h1>Über ${b.brand || 'Freikontor'}</h1>
  ${b.about_text ? html`<p>${b.about_text}</p>` : ''}
  <p>${b.brand || 'Freikontor'} entwickelt Werkzeuge, mit denen Selbstständige ihre Finanzen selbst im Griff behalten: verständlich, nachprüfbar und ohne Abo.</p>
  <h2>Woran wir uns halten</h2>
  <ul>
    <li><strong>Rechnen nach Gesetz, nicht nach Faustregel.</strong> Unsere Steuerberechnungen folgen den amtlichen Tarifformeln und werden automatisiert gegen eine unabhängige Referenzrechnung getestet.</li>
    <li><strong>Deine Daten gehören dir.</strong> Unsere Dateien funktionieren offline, ohne Makros und ohne Übertragung an uns.</li>
    <li><strong>Ehrlich bei Grenzen.</strong> Wir sagen klar, was ein Werkzeug kann und was nicht. Wir versprechen keine Steuerersparnis und ersetzen keine Steuerberatung.</li>
    <li><strong>Keine erfundenen Bewertungen.</strong> Auf dieser Website findest du keine ausgedachten Kundenstimmen oder Verkaufszahlen.</li>
  </ul>
  <h2>Anbieter</h2>
  <p>${b.legal_name}, ${b.city}. Alle Angaben im <a href="/impressum">Impressum</a>.</p></article>`;
  return layout(cfg, { title: 'Über uns', description: 'Freikontor entwickelt nachprüfbare Finanzwerkzeuge für Selbstständige – offline, ohne Abo, ohne erfundene Versprechen.', path: '/ueber-uns', body });
}

function legalPage(cfg, key) {
  const map = {
    impressum: ['Impressum', 'Anbieterkennzeichnung nach § 5 DDG.', legal.impressum(cfg.business)],
    datenschutz: ['Datenschutzerklärung', 'Informationen zur Verarbeitung personenbezogener Daten nach DSGVO.', legal.datenschutz(cfg.business, cfg)],
    agb: ['AGB', 'Allgemeine Geschäftsbedingungen für digitale Produkte.', legal.agb(cfg.business, cfg)],
    widerrufsbelehrung: ['Widerrufsbelehrung', 'Widerrufsrecht für digitale Inhalte und Muster-Widerrufsformular.', legal.widerrufsbelehrung(cfg.business, cfg)],
    'zahlung-und-lieferung': ['Zahlung und Lieferung', 'Zahlungsarten, Preise und digitale Lieferung.', legal.zahlungLieferung(cfg.business, cfg)],
  };
  const [title, description, content] = map[key];
  const warn = cfg.business.missing.length && !cfg.production
    ? html`<div class="placeholder-warning"><strong>Entwicklungsmodus:</strong> Es fehlen Unternehmensangaben in <code>business.json</code> (${cfg.business.missing.join(', ')}). Im Produktivbetrieb startet der Shop erst, wenn sie ergänzt sind.</div>` : '';
  return layout(cfg, { title, description, path: '/' + key, body: html`<article class="prose">${warn}${content}</article>` });
}

function checkboxes(values) {
  return html`
  <label class="check"><input type="checkbox" name="terms" value="1" ${values.terms ? raw('checked') : ''} required>
    <span>Ich habe die <a href="/agb" target="_blank">AGB</a> gelesen und akzeptiere sie. Die <a href="/widerrufsbelehrung" target="_blank">Widerrufsbelehrung</a> und die <a href="/datenschutz" target="_blank">Datenschutzerklärung</a> habe ich zur Kenntnis genommen.</span></label>
  <div class="fieldset">
    <strong>Sofort-Download (optional)</strong>
    <label class="check"><input type="checkbox" name="early_start" value="1" ${values.early_start ? raw('checked') : ''}><span>${legal.CONSENT_TEXTS.earlyStart}</span></label>
    <label class="check"><input type="checkbox" name="early_knowledge" value="1" ${values.early_knowledge ? raw('checked') : ''}><span>${legal.CONSENT_TEXTS.earlyKnowledge}</span></label>
    <span class="hint">Ohne diese beiden Häkchen behältst du dein 14-tägiges Widerrufsrecht. Den Download senden wir dir dann automatisch nach Ablauf der Widerrufsfrist.</span>
  </div>`;
}

function checkout(cfg, edition, { error, values = {}, cancelled } = {}) {
  const ed = EDITIONS[edition];
  const v = vatInfo(cfg.business, ed.priceCents);
  const body = html`<div class="wrap"><div class="checkout">
  <div class="card">
    <h1 style="font-size:2rem">Bestellung</h1>
    ${cancelled ? html`<div class="error-box" role="status">Die Zahlung wurde abgebrochen. Du kannst die Bestellung erneut absenden.</div>` : ''}
    ${error ? html`<div class="error-box" role="alert" id="form-error">${error}</div>` : ''}
    <form class="form" method="post" action="/kasse/${edition}" novalidate>
      <div><label for="email">E-Mail-Adresse für Download und Rechnung</label>
      <input id="email" type="email" name="email" autocomplete="email" required value="${values.email || ''}" ${error ? raw('aria-describedby="form-error"') : ''}>
      <span class="hint">An diese Adresse senden wir Bestellbestätigung, Download-Link und Rechnung.</span></div>
      ${ed.requiresEdition ? html`<div><label for="upgrade_of">Bestellnummer deiner Basis-Bestellung</label>
      <input id="upgrade_of" type="text" name="upgrade_of" required placeholder="FK-XXXX-XXXX" value="${values.upgrade_of || ''}">
      <span class="hint">Steht in deiner Bestellbestätigung. Die E-Mail-Adresse muss dieselbe sein.</span></div>` : ''}
      ${checkboxes(values)}
      <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn-primary btn-block" type="submit">Zahlungspflichtig bestellen</button>
      <p class="hint">Nach dem Klick wirst du zu unserem Zahlungsdienstleister Stripe weitergeleitet und schließt dort die Zahlung ab (z. B. Karte, Apple Pay, Google Pay, PayPal).</p>
    </form>
  </div>
  <aside class="card summary" aria-label="Bestellübersicht">
    <h2 style="font-size:1.25rem">Übersicht</h2>
    <div class="line"><span>${ed.name}</span><span>${formatEuro(ed.priceCents)}</span></div>
    ${cfg.business.vat_mode === 'regel' ? html`<div class="line muted"><span>enthaltene USt. (19 %)</span><span>${formatEuro(v.vatCents)}</span></div>` : ''}
    <div class="line muted"><span>Versand</span><span>entfällt (Download)</span></div>
    <div class="line total"><span>Gesamtpreis</span><span>${formatEuro(ed.priceCents)}</span></div>
    <p class="hint" style="margin-top:10px">${v.label}</p>
    <ul class="ticks" style="margin-top:12px">${ed.features.slice(0, 4).map((f) => html`<li>${f}</li>`)}</ul>
    <p class="hint">Lieferumfang: ${ed.fileLabel}</p>
    <p class="hint"><a href="/finanzcockpit">← Edition ändern</a></p>
  </aside>
  </div></div>`;
  return layout(cfg, { title: `Bestellung: ${ed.name}`, description: 'Bestellung des Freikontor Finanzcockpits.', path: `/kasse/${edition}`, body, noindex: true });
}

function thanks(cfg, order) {
  const body = html`<article class="prose"><h1>Danke für deine Bestellung!</h1>
  ${order ? html`<p>Bestellnummer: <strong>${order.order_number}</strong></p>` : ''}
  <div class="ok-box"><p style="margin:0">Sobald Stripe uns die Zahlung bestätigt, erhältst du automatisch eine E-Mail mit Bestellbestätigung und Rechnung${order && !order.consent_early_delivery ? ' – den Download-Link senden wir dir nach Ablauf der Widerrufsfrist' : ' und deinem Download-Link'}. Das dauert meist nur wenige Minuten.</p></div>
  <p style="margin-top:18px">Keine E-Mail erhalten? Prüfe den Spam-Ordner oder fordere unter <a href="/meine-downloads">Meine Downloads</a> einen neuen Link an. Bei Zahlungsarten wie Lastschrift kann die Bestätigung einige Tage dauern.</p></article>
  ${order ? raw(`<span hidden data-purchase="${(order.price_cents / 100).toFixed(2)}" data-edition="${order.edition}"></span>`) : ''}`;
  return layout(cfg, { title: 'Danke für deine Bestellung', description: 'Bestellbestätigung', path: '/bestellung/danke', body, noindex: true });
}

function downloadsPage(cfg, order, token, files) {
  const ed = EDITIONS[order.edition];
  const body = html`<article class="prose"><h1>Deine Downloads</h1>
  <p>Bestellung <strong>${order.order_number}</strong> · ${ed.name}</p>
  ${files.map((f) => html`<p><a class="btn btn-primary" href="/downloads/${token}/datei/${f.id}">${f.label} herunterladen</a></p>`)}
  <p class="hint">Bitte speichere die Dateien dauerhaft. Dieser Link ist zeitlich begrenzt; einen neuen Link erhältst du jederzeit unter <a href="/meine-downloads">Meine Downloads</a>.</p>
  <h2>So geht es weiter</h2><ol><li>ZIP-Datei entpacken.</li><li><em>Schnellstart.pdf</em> öffnen (2 Minuten).</li><li>Arbeitsdatei öffnen und das Startblatt ausfüllen.</li></ol></article>`;
  return layout(cfg, { title: 'Deine Downloads', description: 'Downloads', path: '/downloads', body, noindex: true });
}

function message(cfg, title, text, { status = 'info', path = '/' } = {}) {
  const body = html`<article class="prose"><h1>${title}</h1><div class="${status === 'error' ? 'error-box' : 'ok-box'}"><p style="margin:0">${text}</p></div>
  <p style="margin-top:18px"><a href="/">Zur Startseite</a></p></article>`;
  return layout(cfg, { title, description: title, path, body, noindex: true });
}

function myDownloads(cfg, { sent, error } = {}) {
  const body = html`<article class="prose"><h1>Meine Downloads</h1>
  <p>Gib die E-Mail-Adresse deiner Bestellung ein. Wir senden dir neue, zeitlich begrenzte Download-Links.</p>
  ${sent ? html`<div class="ok-box" role="status">Wenn zu dieser Adresse ausgelieferte Bestellungen existieren, ist die E-Mail unterwegs.</div>` : ''}
  ${error ? html`<div class="error-box" role="alert">${error}</div>` : ''}
  <form class="form" method="post" action="/meine-downloads"><div><label for="email">E-Mail-Adresse</label><input id="email" type="email" name="email" required autocomplete="email"></div>
  <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
  <button class="btn btn-primary" type="submit">Links anfordern</button></form></article>`;
  return layout(cfg, { title: 'Meine Downloads', description: 'Download-Links für deine Bestellungen erneut anfordern.', path: '/meine-downloads', body, noindex: true });
}

function contact(cfg, { sent, error, values = {} } = {}) {
  const b = cfg.business;
  const body = html`<article class="prose"><h1>Kontakt</h1>
  <p>Fragen zum Produkt, zur Bestellung oder zur Rechnung? Schreib uns – wir antworten in der Regel innerhalb von zwei Werktagen.</p>
  <p>E-Mail: <a href="mailto:${b.email}">${b.email}</a></p>
  ${sent ? html`<div class="ok-box" role="status">Danke! Deine Nachricht ist angekommen.</div>` : ''}
  ${error ? html`<div class="error-box" role="alert">${error}</div>` : ''}
  <form class="form" method="post" action="/kontakt">
    <div><label for="name">Name</label><input id="name" name="name" type="text" required maxlength="120" value="${values.name || ''}" autocomplete="name"></div>
    <div><label for="email">E-Mail</label><input id="email" name="email" type="email" required value="${values.email || ''}" autocomplete="email"></div>
    <div><label for="message">Nachricht</label><textarea id="message" name="message" required maxlength="5000">${values.message || ''}</textarea></div>
    <div class="hp" aria-hidden="true"><label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
    <p class="hint">Wir verwenden deine Angaben nur zur Beantwortung. Mehr in der <a href="/datenschutz">Datenschutzerklärung</a>.</p>
    <button class="btn btn-primary" type="submit">Nachricht senden</button>
  </form>
  <p class="hint" style="margin-top:20px">Du möchtest einen Vertrag widerrufen? Nutze bitte die <a href="/vertrag-widerrufen">Widerrufsfunktion</a>.</p></article>`;
  return layout(cfg, { title: 'Kontakt', description: 'Kontakt zu Freikontor: Fragen zu Produkt, Bestellung und Rechnung.', path: '/kontakt', body });
}

function withdrawal(cfg, { step = 1, values = {}, error, receipt } = {}) {
  let inner;
  if (receipt) {
    inner = html`<div class="ok-box" role="status"><p><strong>Dein Widerruf ist eingegangen.</strong></p>
    <p style="margin:0">Eingang: ${formatDateTime(receipt.received_at)} · Eingangs-ID: ${receipt.id}. Eine Bestätigung mit diesen Angaben haben wir an ${receipt.email} gesendet.</p></div>`;
  } else if (step === 2) {
    inner = html`<p>Bitte prüfe deine Angaben und bestätige den Widerruf.</p>
    <div class="fieldset"><div><strong>Name:</strong> ${values.name}</div><div><strong>E-Mail:</strong> ${values.email}</div>
    <div><strong>Bestellnummer:</strong> ${values.order_number || 'nicht angegeben'}</div><div><strong>Erklärung:</strong> ${values.statement}</div></div>
    <form method="post" action="/vertrag-widerrufen" class="form" style="margin-top:16px">
      ${['name', 'email', 'order_number', 'statement'].map((k) => html`<input type="hidden" name="${k}" value="${values[k] || ''}">`)}
      <input type="hidden" name="step" value="2">
      <button class="btn btn-primary" type="submit">Widerruf bestätigen</button>
      <a href="/vertrag-widerrufen" class="hint">Angaben ändern</a>
    </form>`;
  } else {
    inner = html`<p>Hier kannst du einen über diese Website geschlossenen Vertrag widerrufen. Nach dem Absenden erhältst du sofort eine Eingangsbestätigung per E-Mail.</p>
    ${error ? html`<div class="error-box" role="alert">${error}</div>` : ''}
    <form method="post" action="/vertrag-widerrufen" class="form">
      <div><label for="w-name">Name</label><input id="w-name" name="name" type="text" required maxlength="120" value="${values.name || ''}" autocomplete="name"></div>
      <div><label for="w-email">E-Mail-Adresse (für die Eingangsbestätigung)</label><input id="w-email" name="email" type="email" required value="${values.email || ''}" autocomplete="email"></div>
      <div><label for="w-order">Bestellnummer (falls zur Hand)</label><input id="w-order" name="order_number" type="text" maxlength="20" placeholder="FK-XXXX-XXXX" value="${values.order_number || ''}"></div>
      <div><label for="w-statement">Erklärung</label><textarea id="w-statement" name="statement" maxlength="2000" required>${values.statement || 'Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Bereitstellung der folgenden digitalen Inhalte: Freikontor Finanzcockpit.'}</textarea></div>
      <input type="hidden" name="step" value="1">
      <button class="btn btn-dark" type="submit">Weiter zur Bestätigung</button>
    </form>`;
  }
  const body = html`<article class="prose"><h1>Vertrag widerrufen</h1>${inner}
  <p class="hint" style="margin-top:20px">Informationen zu Frist und Folgen findest du in der <a href="/widerrufsbelehrung">Widerrufsbelehrung</a>.</p></article>`;
  return layout(cfg, { title: 'Vertrag widerrufen', description: 'Widerrufsfunktion: Vertrag online widerrufen.', path: '/vertrag-widerrufen', body });
}

function invoice(cfg, order) {
  const b = cfg.business;
  const ed = EDITIONS[order.edition];
  const amount = order.amount_paid_cents;
  const v = vatInfo(b, amount);
  const body = html`<article class="prose" style="max-width:820px">
  <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap">
    <div><img src="/img/logo.svg" alt="${b.brand || 'Freikontor'}" style="height:36px;width:auto;margin-bottom:12px"><p class="hint">${b.legal_name} · ${b.street} · ${b.zip} ${b.city}</p></div>
    <div style="text-align:right"><p><strong>Rechnung ${order.invoice_number}</strong><br>Rechnungsdatum: ${formatDate(order.paid_at)}<br>Leistungsdatum: ${formatDate(order.paid_at)}<br>Bestellnummer: ${order.order_number}</p></div>
  </div>
  <p>Rechnungsempfänger: ${order.email}</p>
  <table class="data" style="margin:20px 0"><thead><tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th style="text-align:right">Betrag</th></tr></thead>
  <tbody><tr><td>1</td><td>${ed.name} – digitaler Inhalt (Download)</td><td>1</td><td style="text-align:right">${formatEuro(amount)}</td></tr></tbody></table>
  ${b.vat_mode === 'regel' ? html`<div class="kv"><span>Nettobetrag</span><span>${formatEuro(v.netCents)}</span></div>
  <div class="kv"><span>Umsatzsteuer 19 %</span><span>${formatEuro(v.vatCents)}</span></div>` : ''}
  <div class="kv" style="font-weight:700"><span>Gesamtbetrag (bezahlt)</span><span>${formatEuro(amount)}</span></div>
  <p style="margin-top:18px">${b.vat_mode === 'regel' ? `Im Gesamtbetrag sind 19 % Umsatzsteuer enthalten.` : 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.'} Der Betrag wurde per Stripe bezahlt.</p>
  <p class="hint">${b.vat_id ? `USt-IdNr.: ${b.vat_id} · ` : ''}${b.tax_number ? `Steuernummer: ${b.tax_number} · ` : ''}${b.email}</p>
  <p class="hint">Tipp: Über „Drucken“ → „Als PDF speichern“ kannst du die Rechnung ablegen.</p></article>`;
  return layout(cfg, { title: `Rechnung ${order.invoice_number}`, description: 'Rechnung', path: '/rechnung', body, noindex: true });
}

function calculator(cfg) {
  const body = html`<div class="wrap" style="padding-top:40px;padding-bottom:64px">
  <div class="section-head"><span class="eyebrow">Kostenlos · ohne Anmeldung · Tarif 2026</span>
  <h1>Steuerrücklage-Rechner für Selbstständige</h1>
  <p class="lead">Wie viel von deinem Gewinn solltest du für Einkommensteuer, Soli und Kirchensteuer zurücklegen? Schnelle Schätzung nach § 32a EStG 2026 – auch wenn du nebenbei angestellt bist.</p></div>
  <div class="calc">
    <form class="card form" id="calc">
      <div><label for="c-gewinn">Erwarteter Jahresgewinn aus der Selbstständigkeit (€)</label><input id="c-gewinn" type="number" inputmode="decimal" min="0" step="100" value="30000"></div>
      <div><label for="c-andere">Andere Einkünfte im Jahr, z. B. Gehalt nach Werbungskosten (€)</label><input id="c-andere" type="number" inputmode="decimal" min="0" step="100" value="0"></div>
      <div><label for="c-sa">Sonderausgaben &amp; Vorsorge, z. B. Krankenversicherung (€)</label><input id="c-sa" type="number" inputmode="decimal" min="0" step="100" value="6000"></div>
      <div><label for="c-ver">Veranlagung</label><select id="c-ver"><option value="0">Einzelveranlagung</option><option value="1">Zusammenveranlagung (Splitting)</option></select></div>
      <div><label for="c-kist">Kirchensteuer</label><select id="c-kist"><option value="0">keine</option><option value="0.08">8 % (BY, BW)</option><option value="0.09">9 %</option></select></div>
      <p class="hint">Der Rechner läuft vollständig in deinem Browser. Es werden keine Eingaben übertragen.</p>
    </form>
    <div class="card" aria-live="polite">
      <p class="muted" style="margin:0">Mehrsteuer durch deine Selbstständigkeit (Jahr)</p>
      <p class="result-big" id="r-mehr">–</p>
      <div class="kv"><span>Rücklagequote auf den Gewinn</span><strong id="r-quote">–</strong></div>
      <div class="kv"><span>Monatlich zurücklegen</span><strong id="r-monat">–</strong></div>
      <div class="kv"><span>Grenzsteuersatz (ca.)</span><span id="r-grenz">–</span></div>
      <div class="kv"><span>zvE mit / ohne Selbstständigkeit</span><span id="r-zve">–</span></div>
      <p class="hint" style="margin-top:14px">Nicht enthalten: Gewerbesteuer, Umsatzsteuer, Freibeträge für Kinder, Verlustvorträge. Das Finanzcockpit berücksichtigt zusätzlich Gewerbesteuer mit § 35-Anrechnung, Hochrechnung aus deinen echten Buchungen, Vorauszahlungen und den Abgleich mit deinem Rücklagekonto.</p>
      <a class="btn btn-primary btn-block" href="/finanzcockpit">Finanzcockpit ansehen</a>
    </div>
  </div>
  <article class="prose" style="margin-top:40px">
    <h2>Wie der Rechner rechnet</h2>
    <p>Wir berechnen die Einkommensteuer zweimal nach dem Tarif 2026 (§ 32a EStG, Grundfreibetrag 12.348 €): einmal mit deinem Gewinn, einmal ohne. Die Differenz – plus Solidaritätszuschlag (Freigrenze 20.350 € bzw. 40.700 € bei Zusammenveranlagung, mit Milderungszone) und Kirchensteuer – ist die Steuer, die deine Selbstständigkeit zusätzlich auslöst.</p>
    <h2>Warum pauschale 30 % oft nicht passen</h2>
    <p>Die Steuer steigt progressiv. Wer im Hauptjob bereits gut verdient, zahlt auf den Nebenverdienst den hohen Grenzsteuersatz. Wer nur von der Selbstständigkeit lebt und wenig Gewinn macht, liegt oft deutlich darunter. Deshalb rechnet der Rechner mit deinen anderen Einkünften.</p>
    <p class="hint">Schätzung ohne Gewähr, keine Steuerberatung.</p>
  </article></div>
  <script src="/js/calc.js?v=1" defer></script>`;
  return layout(cfg, {
    title: 'Steuerrücklage-Rechner 2026 für Selbstständige – kostenlos',
    description: 'Kostenloser Rechner: Wie viel Steuer musst du als Selbstständiger zurücklegen? Nach Tarif 2026 inkl. Gehalt, Splitting, Soli und Kirchensteuer.',
    path: '/steuerruecklage-rechner', body,
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebApplication', name: 'Steuerrücklage-Rechner 2026', applicationCategory: 'FinanceApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } }],
  });
}

module.exports = { home, product, faqPage, about, legalPage, checkout, thanks, downloadsPage, message, myDownloads, contact, withdrawal, invoice, calculator };
