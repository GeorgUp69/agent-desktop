# Testbericht

Stand: 03.11.2026 · Umgebung: Linux, Node.js 22.23, Python 3.13, LibreOffice (headless), Chromium über Playwright, FFmpeg.

## Zusammenfassung

| Bereich | Tests | Ergebnis |
|---|---|---|
| Produkt (Excel-Formeln über LibreOffice gegen Python-Referenz) | 16 | **16/16 bestanden** |
| Shop (Unit- und Integrationstests, HTTP, signierte Webhooks) | 30 | **30/30 bestanden** |
| Shop im Browser (Playwright, Desktop und iPhone 13) | 11 Schritte | **11/11 bestanden** |
| Videos (ffprobe, Lautheit, visuelle Kontrolle) | 10 Dateien | **10/10 technisch korrekt** |

Befehle:

```bash
python3 -m unittest discover -s product/tests -v                               # aus digital-business/
cd shop && npm test
NODE_PATH=$(npm root -g) node --disable-warning=ExperimentalWarning test/e2e.browser.js ../tests/e2e-screens
```

## Nicht getestet (ehrlich)

| Punkt | Warum | Was du tun musst |
|---|---|---|
| Echte Stripe-Testzahlung (Checkout-Seite von Stripe) | Kein Stripe-Konto und kein Netzzugang zu Stripe in der Umgebung | Testkauf im Stripe-Testmodus (START-HERE, Abschnitt Stripe) |
| Echter E-Mail-Versand und Zustellbarkeit | Kein SMTP-Zugang | Testkauf an eigene Adresse, SPF/DKIM/DMARC prüfen |
| Docker-Image bauen | Docker nicht verfügbar | `docker compose up -d --build` auf dem Server |
| Microsoft Excel und Google Sheets | Nicht installiert. Getestet wurde LibreOffice. Die Formeln vermeiden Funktionen, die nur in einzelnen Programmen existieren. | Die Datei einmal in Excel und Google Sheets öffnen und die Beispielwerte vergleichen (Dashboard Beispiel A: Gewinn 20.678 €, Soll-Rücklage 6.889 €) |
| Rechtliche Wirksamkeit | Kein Test, sondern anwaltliche Aufgabe | Siehe `legal/` |

## 1. Produkt

| Prüfung | Methode | Ergebnis |
|---|---|---|
| Einkommensteuertarif 2025 und 2026 | Über 600 zvE-Werte inklusive aller Zonengrenzen (12.096/12.348, 17.443/17.799, 68.480/69.878, 277.825), Excel-Formel nach LibreOffice-Neuberechnung gegen `taxcalc.py` | identisch |
| Bekannte Werte 2026 | zvE 17.799 → 1.034 €, 50.000 → 10.548 € | ok |
| Stetigkeit der Tarifzonen | Sprung an jeder Grenze ≤ 1 € | ok |
| Keine Formelfehler | Alle Zellen beider Beispieldateien (PRO) nach Neuberechnung ohne `#…`/`Err:` | ok |
| EÜR-Gewinn | Unabhängige Python-Berechnung aus den Beispielzeilen (Vorsteuer, Bewirtung 70 %, Geschenke, § 13b, USt-Zahlungen) | identisch |
| Steuerrücklage | Mit und ohne Selbstständigkeit, Splitting, Kirchensteuer, Gewerbesteuer mit § 35-Anrechnung, gegen `taxcalc.scenario` | identisch |
| Reverse Charge Kleinunternehmer | § 13b-Bemessungsgrundlage, Steuer = Zahllast, keine Vorsteuer | ok |
| Stundensatz | Der gefundene Gewinn deckt das Wunsch-Netto, der vorherige Wert nicht | ok |
| Kleinunternehmer-Grenzfälle | Gründungsjahr (25.000 €, benennt die Rechnung T-005), Vorjahr > 25.000 €, 25.000–100.000 €, > 100.000 € sofort (benennt T-004) | ok |
| Fristen 2027 | Ostern 2027, Verschiebung bei Wochenende und Feiertag (z. B. 31.07. → 02.08.2027), alle Fristen an Werktagen | ok |
| Datumsanzeige bei deutscher Spracheinstellung | PDF-Export unter `de_DE` | ok |

**Bei den Tests gefundene und behobene Fehler:**
- Das Dashboard zeigte „Stand DD.11.YYYY“: `TEXT(…;"DD.MM.YYYY")` hängt von der Sprache ab. Jetzt wird das Datum sprachunabhängig zusammengesetzt. Der automatische Test konnte den Fehler in LibreOffice headless nicht zuverlässig reproduzieren und prüft deshalb nur das korrekte Ergebnisformat.
- Der Fortschrittsbalken des Kleinunternehmer-Monitors bezog sich auf die 100.000-€-Grenze und zeigte bei Kleinunternehmern kaum Ausschlag. Jetzt bezieht er sich auf die 25.000-€-Grenze.

## 2. Shop

| Prüfung (Auszug aus 30 Tests) | Ergebnis |
|---|---|
| Alle 12 öffentlichen Seiten liefern 200 mit Titel, Meta-Beschreibung und Canonical | ok |
| **Alle internen Links und Bilder** aller Seiten erreichbar (Crawl, über 30 Ziele) | ok |
| Footer mit „Vertrag widerrufen“, Impressum, Datenschutz, **kein** OS-Plattform-Link | ok |
| Sicherheits-Header (CSP, nosniff, X-Frame-Options, kein X-Powered-By) | ok |
| Ohne Pixel-ID kein Tracking und kein Banner | ok |
| Kleinunternehmer-Preisangabe ohne „inkl. MwSt.“, Regelbesteuerung mit „inkl. 19 % USt.“ und Steuerausweis auf der Rechnung (24,37 € + 4,63 €) | ok |
| JSON-LD Product ohne Bewertungen | ok |
| POST mit fremdem Origin → 403 | ok |
| Admin nur mit Passwort (401/200) | ok |
| Checkout: Button „Zahlungspflichtig bestellen“, Checkboxen nicht vorausgewählt | ok |
| Ohne AGB-Häkchen, ungültige E-Mail oder nur einer der beiden Widerrufs-Zustimmungen → keine Bestellung | ok |
| Gültige Bestellung → 303 zu Stripe, Preis, Sprache und Metadaten korrekt, Idempotency-Key gesetzt | ok |
| Upgrade nur mit passender, bezahlter Basis-Bestellung und gleicher E-Mail | ok |
| **Webhook mit falscher Signatur** → 400, keine Freischaltung | ok |
| **Doppelte und wiederholte Events** → genau eine Bestätigung, genau eine Auslieferung | ok |
| **Falscher Betrag, falsche Währung, fremde Session** → keine Freischaltung | ok |
| Verzögerte Zahlung: erst nach `async_payment_succeeded` ausliefern, nach Fehlschlag nie | ok |
| Download-Link liefert die richtige Datei, falsche Tokens 404, Path-Traversal 404 | ok |
| Rechnung mit fortlaufender Nummer und § 19-Hinweis | ok |
| Erstattung sperrt den Zugang (410) und informiert per Mail | ok |
| „Meine Downloads“: gleiche Antwort für bekannte und unbekannte Adressen, Link nur für ausgelieferte Bestellungen | ok |
| Download-Limit pro Datei | ok |
| Ohne Zustimmung: kein Link bis Fristende, automatische Auslieferung danach, genau einmal | ok |
| Widerruf zweistufig, Eingangsbestätigung per Mail, automatische Erstattung vor Auslieferung, danach keine Auslieferung | ok |
| E-Mail-Warteschlange: SMTP-Ausfall, Wiederholung, keine verlorene und keine doppelte Mail | ok |
| Newsletter Double-Opt-in, Bestätigungslink nur einmal gültig, Abmeldung nur mit gültigem Token | ok |
| Produktivstart verweigert, solange Impressum, Stripe, SMTP usw. fehlen | ok |

**Gegenprobe (Invert-Verify):** Die Statusprüfung gegen Doppelauslieferung und die Betragsprüfung wurden testweise entfernt. Die Tests schlugen jeweils fehl (29/30) und waren nach dem Zurücksetzen wieder grün (30/30).

**Bei den Tests gefundene und behobene Fehler:** In der Newsletter-Bestätigungsmail fehlte der Abmeldelink. Im echten Browser blockierte die strenge CSP Inline-Styles, deshalb ist `style-src 'unsafe-inline'` jetzt erlaubt (Skripte bleiben auf `'self'`). Lange Wörter verursachten auf dem Smartphone in der AGB horizontales Scrollen, jetzt greift `overflow-wrap`. Der „Jetzt kaufen“-Button im Header hatte dunkle Schrift auf Grün.

## 3. Browser-Ende-zu-Ende (Playwright)

Ablauf: Startseite → „Ab 29 €“ → Produktseite → PRO wählen → Absenden ohne AGB scheitert → mit AGB und beiden Zustimmungen Weiterleitung zum Zahlungsanbieter (Attrappe) → signierter Webhook → Danke-Seite mit Bestellnummer → Download über den Link aus der versendeten E-Mail (Datei korrekt) → Rechnung im Browser → Widerruf zweistufig → Rücklage-Rechner rechnet in drei Fällen exakt wie die Python-Referenz (2.587 €, 7.797 €, 10.548 €) → **iPhone 13: keine horizontale Scrollbar** auf 8 Hauptseiten, Menü funktioniert → **keine JavaScript- oder CSP-Fehler**.

Screenshots: `tests/e2e-screens/`.

## 4. Sicherheit (Review)

| Thema | Maßnahme |
|---|---|
| Zahlung | Signaturprüfung (Stripe-SDK), Abgleich von Betrag, Währung, Session und optional Livemode, idempotente Verarbeitung (Event-Tabelle + Statusübergang in Transaktion) |
| Zugriff auf Dateien | Dateien liegen außerhalb von `public/`. 256-Bit-Zufallstokens, nur als SHA-256-Hash gespeichert, Ablauf nach 30 Tagen, Sperre bei Erstattung oder Streit, Download-Limit, `path.basename` |
| Eingaben | Alle Ausgaben HTML-escaped, JSON-LD `<` escaped, SQL nur parametrisiert, Feldlängen begrenzt, Honeypots |
| Missbrauch | Origin-Prüfung für alle Formulare, Rate-Limits (Formulare, Checkout je E-Mail, Downloads, Admin-Login), CSRF-Token im Admin |
| Admin | Basic Auth über HTTPS, Vergleich in konstanter Zeit, deaktiviert ohne Passwort |
| Header | CSP ohne Fremdskripte (TikTok nur mit Pixel-ID), HSTS im Produktivbetrieb, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| Abhängigkeiten | 3 Laufzeitabhängigkeiten, `npm audit`: 0 Schwachstellen (Nodemailer auf 10.3.1 aktualisiert, 7.x hatte bekannte Lücken) |
| Restrisiken | Rate-Limits liegen im Arbeitsspeicher (bei mehreren Instanzen nicht geteilt). Die Rechnungslinks laufen nicht ab. Das Dashboard nutzt Basic Auth ohne 2FA, deshalb ein langes Passwort setzen. |

## 5. Videos

| Datei | Codec | Auflösung | fps | Länge | Lautheit |
|---|---|---|---|---|---|
| v01–v10 | H.264 High + AAC 192k | 1080 × 1920 | 30 | 20,6–26,8 s | −14,1 bis −14,3 LUFS |

Visuelle Kontrolle über Kontaktbögen (6 Frames je Video): Lesbarkeit, Safe-Zones, Markierungen. **Behoben:** Die Zeilenmarkierung in v02 saß eine Zeile zu hoch. Die Großschreibung machte aus „UStG“ ein „USTG“. In v06 brach die Zeile zwischen „37“ und „%“ um, jetzt stehen geschützte Leerzeichen vor % und €.
