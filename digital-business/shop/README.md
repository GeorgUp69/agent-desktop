# Shop

Node.js 22 · Express 5 · eingebautes SQLite (`node:sqlite`) · Stripe Checkout · Nodemailer. Servergerendertes HTML, kein Frontend-Build.

```
server.js            Start, Hintergrundjobs (Mail 15 s, Auslieferung 60 s, Löschfristen stündlich)
src/app.js           Routen, Sicherheit (CSP, Origin-Prüfung, Rate-Limits), Webhook
src/orders.js        Bestellung, Checkout-Session, Webhook-Verarbeitung, Auslieferung, Erstattung, Widerruf
src/mailer.js        E-Mail-Warteschlange mit Wiederholungen
src/emails.js        E-Mail-Vorlagen
src/legal.js         Impressum, Datenschutz, AGB, Widerruf, Zahlung & Lieferung (ENTWURF)
src/catalog.js       Editionen und Preise
src/views/           Seiten, Layout, Admin-Dashboard
public/              CSS, JS (Menü, Consent, Rechner), Bilder, Schriften (Inter, OFL)
test/                npm test (30 Tests), e2e.browser.js (Playwright), demo-artifacts.js
```

Einrichtung, Hosting, Stripe und E-Mail: siehe `../START-HERE.md`.

**Preise ändern:** `src/catalog.js` (`priceCents`). **Rechtstexte ändern:** `src/legal.js`, danach `LEGAL_VERSION` erhöhen (wird pro Bestellung gespeichert). **Neue Seite:** Route in `src/app.js`, Pfad in `PUBLIC_PAGES` (Sitemap, Linktest).
