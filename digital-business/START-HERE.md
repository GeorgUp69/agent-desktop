# START HERE – Freikontor Digital-Business

Ein vollständiges Geschäft mit digitalen Produkten: ein geprüftes Produkt, ein Shop mit automatischer Auslieferung, 10 fertige TikTok-Videos, Rechtstexte als Entwurf und ein Marketingplan. **Live gehen kannst du, sobald du die persönlichen Angaben, Konten und Freigaben aus der Checkliste unten erledigt hast.**

## Auf einen Blick

| | |
|---|---|
| **Produkt** | Freikontor Finanzcockpit 2026: Excel-Arbeitsmappe für Selbstständige mit Einnahmen, Ausgaben, EÜR, Umsatzsteuer, **Steuerrücklage nach echtem Tarif § 32a EStG 2025/2026** (inkl. Gehalt, Splitting, Soli, KiSt, GewSt mit § 35-Anrechnung), **Kleinunternehmer-Monitor nach den Regeln ab 2025**, Reverse Charge (§ 13b), Dashboard |
| **Zielgruppe** | Solo-Selbstständige, Freelancer und Nebenberufler im 1.–5. Jahr, 22–40 Jahre, Deutschland |
| **Marke** | Freikontor (Markenrecherche steht noch aus) |
| **Preise** | Basis 29 €, PRO 49 €, Upgrade 20 € (Endpreise, einmalig) |
| **Marge (geschätzt)** | Deckungsbeitrag vor Werbung ca. 23 € (Basis) bzw. 39 € (PRO) bei Regelbesteuerung, als Kleinunternehmer ca. 28 € bzw. 48 €. Variable Kosten: nur Stripe-Gebühren. Fixkosten ca. 6–25 €/Monat (Server, E-Mail, Domain). |
| **Warum dieses Produkt** | Höchste Punktzahl in der Bewertungsmatrix (`research/01-marktanalyse.md`). Kostenlose Vorlagen rechnen keine Rücklage nach Tarif, Abo-Software kostet ca. 100–400 €/Jahr. |
| **Technik** | Produkt: Python/openpyxl, geprüft mit LibreOffice. Shop: Node.js 22 (Express 5, eingebautes SQLite, Stripe 23, Nodemailer 10), servergerendertes HTML ohne Frontend-Framework. Videos: eigene HTML-Engine, Playwright, FFmpeg. |

## Projektstruktur

```
digital-business/
├── START-HERE.md                 ← diese Datei
├── research/                     Phase 1: Marktanalyse, Bewertungsmatrix, Entscheidung
├── product/                      Phase 2: Produkt
│   ├── release/                  ★ die beiden Verkaufs-ZIPs (Basis, PRO)
│   ├── dist/                     Einzeldateien (xlsx, PDFs, ics)
│   ├── screenshots/              echte Ansichten (für Shop/Marketing)
│   ├── build/                    Generator + Referenz-Steuerberechnung
│   ├── docs-src/                 Quelltexte Handbuch/Checklisten
│   └── tests/                    Formel-Tests (LibreOffice)
├── shop/                         Phase 3/4/9: Online-Shop, Zahlung, Auslieferung, Dashboard
│   ├── src/legal.js              Rechtstexte (Entwurf, prüfen lassen!)
│   ├── src/emails.js             alle E-Mail-Vorlagen
│   ├── test/                     30 automatisierte Tests + Browser-E2E
│   └── Dockerfile, docker-compose.yml, Caddyfile
├── marketing/
│   ├── tiktok/videos/            ★ 10 fertige MP4 (1080×1920)
│   ├── tiktok/scripts/           Skripte mit Szenenplan, VO, Musik, CTA, Caption, Hashtags
│   ├── tiktok/{captions,thumbnails,images,werbetexte,audio,engine}/
│   └── strategie-und-30-tage-plan.md   Phase 7: SEO, Kanäle, 30-Tage-Plan
├── legal/rechtliche-anforderungen.md    Phase 6: Anforderungen mit Quellen
├── brand/                        Logo, Farben, Tonalität
└── tests/testbericht.md          Phase 8: Testbericht
```

## Installation (lokal testen)

Voraussetzungen: Node.js ≥ 22.13. Für den Neubau des Produkts außerdem Python 3 mit openpyxl, LibreOffice und Playwright.

```bash
cd digital-business/shop
npm ci
npm run sync-products          # kopiert die ZIPs nach storage/products/
cp business.example.json business.json   # ausfüllen!
npm test                       # 30 Tests
npm run dev                    # http://localhost:3000
```

Ohne `.env` läuft der Shop im Entwicklungsmodus: Stripe ist nicht verbunden, und E-Mails werden als Datei unter `data/mail-preview/` abgelegt.

## Hosting (Empfehlung: EU-Server mit Docker)

1. Einen kleinen VPS bei einem EU-Anbieter mieten, z. B. 2 vCPU und 2–4 GB RAM, ca. 4–8 €/Monat. **Dies ist eine kostenpflichtige Entscheidung, die du treffen musst.** Einen AV-Vertrag mit dem Anbieter abschließen.
2. Domain registrieren (kostenpflichtig, erst nach der Markenrecherche) und A-Records für `deine-domain.de` und `www` auf den Server setzen.
3. Auf dem Server: Docker installieren, den Ordner `shop/` hochladen, dann:
   ```bash
   cp .env.example .env && nano .env         # alle Werte setzen
   cp business.example.json business.json && nano business.json
   mkdir -p storage/products && cp /pfad/zu/product/release/*.zip storage/products/
   sed -i 's/deine-domain.de/DEINEDOMAIN.de/g' Caddyfile
   docker compose run --rm shop node scripts/check-config.js   # muss "Konfiguration vollständig." melden
   docker compose up -d --build
   ```
4. `https://www.deine-domain.de/healthz` muss `"ok": true` liefern.
5. Backups: Den Ordner `shop/data/` (SQLite inklusive Bestellungen) täglich sichern, zum Beispiel mit der Snapshot-Funktion des Anbieters.

Der Shop **startet im Produktivmodus nicht**, solange Impressumsangaben, Stripe-Schlüssel, SMTP, `APP_SECRET` oder `ADMIN_PASSWORD` fehlen.

## Zahlungsanbieter einrichten (Stripe)

1. Konto unter stripe.com anlegen und Unternehmen verifizieren. Zahlungsarten unter *Einstellungen → Zahlungsmethoden* aktivieren: Karten, Apple Pay, Google Pay, **PayPal** (über Stripe, keine eigene PayPal-Integration nötig) und optional SEPA-Lastschrift. Verzögerte Zahlungsarten unterstützt der Shop: Er liefert erst nach Bestätigung aus.
2. **Testmodus:** `STRIPE_SECRET_KEY=sk_test_...` eintragen. Webhook-Endpunkt `https://www.deine-domain.de/stripe/webhook` anlegen mit den Events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`. Das Signaturgeheimnis als `STRIPE_WEBHOOK_SECRET` eintragen.
3. **Testkauf** mit der Testkarte `4242 4242 4242 4242` (beliebiges künftiges Datum, beliebige CVC). Prüfen: Bestellbestätigung mit Download-Link, Rechnung und Download kommen an, und der Kauf erscheint im Dashboard `/admin`. Danach im Stripe-Dashboard erstatten: Der Zugang wird gesperrt. Lokal geht das auch ohne Server: `stripe listen --forward-to localhost:3000/stripe/webhook` (Stripe CLI).
4. **Livebetrieb:** Live-Schlüssel und einen neuen Live-Webhook eintragen, `STRIPE_REQUIRE_LIVEMODE=1` setzen.
5. Optional: Promotion-Codes im Stripe-Dashboard anlegen. Das Eingabefeld ist im Checkout aktiv.

## E-Mail einrichten

1. Einen SMTP-Anbieter mit Server in der EU und AV-Vertrag wählen, zum Beispiel das Postfach deines Domain-Hosters oder einen Transaktionsmail-Dienst. Viele haben ein kostenloses Kontingent, prüfe die Bedingungen.
2. Für die Absenderdomain **SPF, DKIM und DMARC** setzen, sonst landen Download-Links im Spam.
3. `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` und `OWNER_NOTIFY_EMAIL` in `.env` setzen.
4. Fällt der SMTP-Server aus, wiederholt der Shop den Versand automatisch bis zu 6-mal über ca. 16 Stunden. Fehlversuche stehen im Dashboard.

## Was automatisch läuft

Checkout → Stripe → signierter Webhook → Betragsprüfung → fortlaufende Rechnungsnummer → Bestellbestätigung (mit AGB, Widerrufsbelehrung und Bestätigung der Zustimmung) → zeitlich begrenzter Download-Link (30 Tage, max. 20 Downloads) → „Meine Downloads“ für neue Links. Außerdem: verzögerte Auslieferung nach 14 Tagen ohne Zustimmung, automatische Erstattung bei Widerruf vor der Auslieferung, Sperre bei Erstattung oder Zahlungsstreit, E-Mail-Wiederholungen, Löschfristen, Verkaufsbenachrichtigung, Dashboard mit Umsatz, Conversion, Gebühren, Werbekosten und Gewinnschätzung sowie CSV-Export für die Buchhaltung.

**Manuell bleiben:** Widerrufe nach bereits erfolgter Auslieferung prüfen (das Dashboard zeigt sie, und du bekommst eine Mail), Kontaktanfragen beantworten, Werbekosten im Dashboard eintragen, Buchhaltung.

## Rechtliche To-do-Liste (Kurzfassung)

Details mit Quellen in `legal/rechtliche-anforderungen.md`.

1. [ ] Gewerbe anmelden, steuerliche Erfassung, Entscheidung Kleinunternehmer ja/nein → `vat_mode` in `business.json`
2. [ ] `business.json` vollständig ausfüllen (Impressum)
3. [ ] AV-Verträge mit Hosting- und E-Mail-Anbieter
4. [ ] Markenrecherche „Freikontor“ (DPMA/EUIPO)
5. [ ] **Anwalt:** AGB, Widerrufsbelehrung (Abgleich mit der aktuellen Anlage 1/2 EGBGB nach der Änderung vom 19.06.2026), Datenschutzerklärung, Checkout und Vertragsschluss, Widerrufsfunktion
6. [ ] **Steuerberatung:** Umsatzsteuer, OSS (EU-Kunden), Kunden außerhalb der EU, Rechnungsformat, Buchhaltung
7. [ ] Impressum-Link in den Social-Media-Bios

Der Shop ist **nicht** rechtlich geprüft und nicht „abmahnsicher“. Die Texte sind sorgfältige Entwürfe auf Basis der recherchierten Rechtslage.

## Veröffentlichung Schritt für Schritt

1. Rechtliche To-dos 1–4 erledigen.
2. Server und Domain bestellen (deine Freigabe), Shop wie oben deployen.
3. Stripe im **Testmodus**: Testkauf, Erstattung, Widerruf ausprobieren und die E-Mails prüfen.
4. Anwaltliche und steuerliche Prüfung (To-dos 5–6) abschließen, Texte bei Bedarf in `shop/src/legal.js` anpassen und `LEGAL_VERSION` erhöhen.
5. Live-Schlüssel eintragen, ein echter Kauf mit eigener Karte, danach erstatten.
6. TikTok-Business-Konto anlegen, Bio mit Website und Impressum, nach Plan posten (`marketing/strategie-und-30-tage-plan.md`).
7. Werbebudget erst nach deiner Freigabe und erst nach der organischen Testwoche einsetzen.

## Produkt aktualisieren (z. B. Ausgabe 2027)

Siehe `product/README.md`: Werte in `build/params.py` ergänzen, Tests erweitern, `build_workbook.py` ausführen, Screenshots und PDFs rendern, ZIPs packen, `npm run sync-products`. Den Dateinamen in `shop/src/catalog.js` anpassen.

## Was nicht erledigt wurde und warum

- **Keine echte Stripe-Testzahlung:** In dieser Umgebung gab es weder Stripe-Konto noch Schlüssel noch Netzzugang zu Stripe. Webhooks wurden mit echten, kryptografisch signierten Stripe-Events getestet (Stripe-SDK), die Session-Erstellung mit einem Stellvertreter. Den Testkauf im Stripe-Testmodus musst du einmal selbst durchführen (Schritt 3 oben).
- **Kein echter E-Mail-Versand:** Kein SMTP-Zugang vorhanden. Die Warteschlange, Wiederholungen und Inhalte sind getestet.
- **Docker-Build nicht ausgeführt:** Docker war in dieser Umgebung nicht verfügbar. Der Shop selbst wurde direkt mit Node getestet.
- **Kein Voice-over:** Es gab kein TTS-Werkzeug in brauchbarer Qualität. Die Videos sind Text-Ads mit Musik, und die VO-Texte liegen zum Einsprechen bei.
- **Keine Live-Veröffentlichung, keine Domain, keine Anzeigen, keine kostenpflichtigen Dienste:** wie vorgegeben, nur mit deiner Freigabe.
