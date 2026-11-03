# Verkaufsstrategie, SEO und 30-Tage-Plan

Dieser Plan enthält **keine Umsatzprognosen**. Für Klickraten, Conversion und Kosten pro Kauf gibt es vor dem ersten Test keine belastbaren Daten. Der Plan arbeitet deshalb mit kleinen Budgets, festen Messpunkten und Abbruchkriterien.

## 1. Positionierung in einem Satz

> Das Finanzcockpit sagt Selbstständigen jederzeit, wie viel von ihrem Gewinn dem Finanzamt gehört – nach echtem Tarif, ohne Abo, offline.

## 2. Funnel

```
TikTok/Reels (organisch + Ads) ─┐
Pinterest (Pins auf Ratgeber)  ─┼─> /steuerruecklage-rechner (kostenlos, Aha-Zahl) ─> /finanzcockpit ─> /kasse
Google (SEO, Rechner + Ratgeber)┘                       └─> Newsletter (Double-Opt-in)
```

- **Kalter Traffic** geht auf den kostenlosen Rechner. Er liefert eine persönliche Zahl, baut Vertrauen auf und führt zum Produkt.
- **Warmer Traffic** (Retargeting, nur mit Pixel-Einwilligung) geht direkt auf `/finanzcockpit#preise`.

## 3. SEO (umgesetzt und geplant)

**Technisch umgesetzt:** serverseitig gerendertes HTML, saubere URLs (`/finanzcockpit`, `/steuerruecklage-rechner`), Title und Meta-Description je Seite, Canonical, Open Graph, `robots.txt` (sperrt Kasse, Downloads, Admin), `sitemap.xml`, JSON-LD (Organization, Product mit Offers ohne erfundene Bewertungen, FAQPage, WebApplication), selbst gehostete Schriften mit Preload, WebP-Bilder mit Mobile-Varianten, Lazy Loading, keine Drittanbieter-Skripte ohne Einwilligung, mobile Darstellung getestet.

**Keywords** (Suchvolumen nicht gemessen, da kein Keyword-Tool verfügbar war; vor dem Content-Ausbau mit Google Search Console oder Keyword-Planer prüfen):

| Cluster | Beispiel-Suchbegriffe | Zielseite |
|---|---|---|
| Rücklage | steuerrücklage selbstständige, wie viel steuern zurücklegen selbstständig, steuerrücklage rechner | `/steuerruecklage-rechner` |
| Kleinunternehmer | kleinunternehmerregelung 2026 grenze, 25000 euro grenze überschritten, kleinunternehmer gründungsjahr | Ratgeberseite (geplant) |
| Vorlage | eür vorlage excel 2026, einnahmen ausgaben excel selbstständige, finanzplaner selbstständige excel | `/finanzcockpit` |
| Nebenjob | nebengewerbe steuern rechner, nebenberuflich selbstständig steuern | Ratgeberseite (geplant) |
| § 13b | reverse charge kleinunternehmer meta, google ads umsatzsteuer kleinunternehmer | Ratgeberseite (geplant) |

**Content-Plan (Monat 2–3):** vier Ratgeberseiten mit 1.200–1.800 Wörtern, je einem Rechenbeispiel und Quellenangaben: Kleinunternehmerregelung 2026, Steuerrücklage im Nebenjob, Reverse Charge für Kleinunternehmer, Vorauszahlungen erklärt. Jede Seite verlinkt Rechner und Produkt. Neue Seiten in `PUBLIC_PAGES` (Sitemap) aufnehmen.

## 4. Kanäle

| Kanal | Rolle | Taktik |
|---|---|---|
| **TikTok organisch** | Reichweite, Vertrauen | 1 Video pro Tag in den ersten 30 Tagen: die 10 fertigen Spots, dazu gefilmte Varianten („Rechne mit mir“-Screen-Recording, Kommentar-Antworten). Fragen aus den Kommentaren werden zu neuen Videos. |
| **TikTok Ads** | Skalierung bewährter Hooks | Erst die organischen Gewinner (hohe Watch-Time) als Spark Ads bewerben. Ziel: Traffic bzw. Conversions, sobald genug Daten vorliegen. |
| **Instagram Reels** | Zweitverwertung | Dieselben MP4s. Die eigene Musik ist lizenzfrei, die TikTok-CML gilt dort **nicht**. |
| **Pinterest** | Langfristiger Suchtraffic | Statische Pins aus den Screenshots und Headlines (siehe Werbetexte), verlinkt auf Rechner bzw. Ratgeber. |
| **E-Mail** | Wiederkauf, Upsell | Nur mit Double-Opt-in: Willkommensmail, Steuerfristen-Erinnerungen (Mehrwert), Ankündigung der Ausgabe 2027. Bestandskunden ohne Einwilligung nur nach § 7 Abs. 3 UWG mit Widerspruchshinweis. |

## 5. Angebot, Bundles, Upsell, Cross-Sell

| Hebel | Umsetzung |
|---|---|
| Good/Better | Basis 29 €, PRO 49 € (als „Empfohlen“ markiert) |
| Upsell | Upgrade Basis → PRO für 20 € (`/kasse/upgrade`, prüft Bestellnummer und E-Mail) |
| Rabatte | Stripe-Promotion-Codes sind im Checkout aktiviert (z. B. Launch-Code für Newsletter-Abonnenten). Bei Preisermäßigungen mit Referenzpreis § 11 PAngV beachten. |
| Wiederkauf | Jahresausgabe 2027 mit Bestandskundenpreis (per Code) |
| Cross-Sell (später) | Ratgeber-PDF „Erste Steuererklärung als Selbstständige“, Bundle mit Notion-Belegablage – nur bauen, wenn Umfragen oder Kommentare den Bedarf zeigen |

## 6. Messung

- **Shop-Dashboard (`/admin`):** Umsatz, bezahlte Bestellungen, Checkout-Starts, Seitenaufrufe Start/Produkt (ohne Cookies), Conversion = Käufe / Aufrufe, Erstattungen, Stripe-Gebühren, manuell erfasste Werbekosten, geschätzter Gewinn.
- **TikTok:** Aufrufe, durchschnittliche Wiedergabezeit, 2-Sekunden-Halterate, Klicks auf den Bio-Link. Bei Ads zusätzlich CPM, CPC und CTR. Das Pixel liefert Käufe nur mit Einwilligung, die Zahlen bleiben also unvollständig. Maßgeblich ist das Shop-Dashboard.
- **Wöchentliches Review** (30 Minuten): Was hatte die höchste Wiedergabezeit? Welcher Hook bringt Klicks? Welche Fragen kommen in den Kommentaren?

## 7. 30-Tage-Plan

| Tage | Ziel | Aufgaben | Budget |
|---|---|---|---|
| **Vorher** | Startklar | Rechtliche To-dos aus `legal/`, Stripe-Testkauf, Live-Schaltung, TikTok-Business-Konto mit Impressum in der Bio, Pixel nur mit Banner | 0 € |
| **1–7** | Hooks testen (organisch) | Täglich 1 Spot: v01, v07, v03, v06, v09, v02, v08. Kommentare innerhalb von 2 h beantworten. Rechner-Link in der Bio. | 0 € |
| **8–10** | Eigene Varianten | 3 gefilmte Screen-Recordings („Ich rechne deine Rücklage“) mit eigener Stimme, VO-Text aus den Skripten | 0 € |
| **11–17** | Erster Ads-Test | 3 Anzeigengruppen mit je einem Top-Hook (aus Woche 1), 10–15 € pro Tag gesamt, Ziel Traffic auf `/steuerruecklage-rechner`. Spots: v05, v10, v04 organisch weiter. | ca. 70–100 € |
| **18** | Entscheidung | **Abbruchkriterium:** CTR unter 0,8 % oder keine Rechner-Nutzung → Hooks überarbeiten, nicht skalieren. **Weiter:** Die beste Gruppe behalten, die anderen pausieren. | – |
| **19–24** | Conversion optimieren | Bestanden: Budget der Gewinner-Gruppe moderat erhöhen (max. +30 % alle 3 Tage). Produktseite: FAQ um echte Kommentarfragen ergänzen. Newsletter-Formular unter dem Rechner bewerben. | ca. 100–150 € |
| **25–28** | Pinterest und Reels | 10 Pins aus den Screenshots, 5 Reels (Zweitverwertung) | 0 € |
| **29–30** | Auswertung | Kosten pro Kauf = Werbekosten / Käufe (Dashboard). Deckungsbeitrag pro Kauf ca. 23 € (Basis) bzw. 39 € (PRO) bei Regelbesteuerung. Nur skalieren, wenn die Kosten pro Kauf klar darunter liegen. | – |

**Gesamtbudget im ersten Monat:** ca. 170–250 € Werbekosten (optional, nur nach deiner Freigabe). Es werden keine Ergebnisse versprochen. Der Plan ist darauf ausgelegt, mit wenig Geld herauszufinden, ob und welche Botschaft verkauft.

## 8. Saisonalität

Die Nachfrage nach Steuerthemen ist erfahrungsgemäß im **Januar bis Mai** (Steuererklärung, neue Jahreswerte) und rund um **Vorauszahlungsbescheide** hoch. Ein Start im November eignet sich für den organischen Aufbau. Das Werbebudget lohnt sich voraussichtlich am meisten ab Januar mit der Ausgabe 2027.
