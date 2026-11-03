# Rechtliche Anforderungen – Deutschland / EU

Stand: 03.11.2026. **Dies ist keine Rechtsberatung.** Der Bericht fasst die recherchierten Anforderungen zusammen und dokumentiert, was im Shop umgesetzt ist. Der Shop ist **nicht** anwaltlich geprüft und **nicht** „abmahnsicher“.

**Zur Recherche:** In der Entwicklungsumgebung waren direkte Seitenabrufe gesperrt, auch für gesetze-im-internet.de, bmf.de und eur-lex.europa.eu. Alle Quellen wurden am **03.11.2026 über eine Websuche** abgerufen. Wo möglich, sind amtliche Fundstellen verlinkt (gesetze-im-internet.de, BMF, IHK). Vor dem Start bitte jede Fundstelle im Originaltext prüfen.

Legende: **[T]** technisch umgesetzt · **[R]** rechtlich erforderlich · **[S]** von dir selbst zu ergänzen bzw. zu erledigen · **[P]** durch Rechtsanwalt bzw. Steuerberater prüfen lassen

---

## 1. Gründung, Gewerbe, Steuern

| Anforderung | Einordnung | Quelle |
|---|---|---|
| Der Verkauf digitaler Vorlagen ist in der Regel **gewerblich** (Handel mit digitalen Produkten, keine freiberufliche Katalogtätigkeit). Gewerbeanmeldung beim Gewerbeamt, danach Fragebogen zur steuerlichen Erfassung in ELSTER. | [R] [S] [P] | [IHK München – Kleinunternehmerregelung](https://www.ihk-muenchen.de/de/Service/Recht-und-Steuern/Steuerrecht/Umsatzsteuer/kleinunternehmerregelung/) · § 138 AO |
| **Kleinunternehmerregelung (§ 19 UStG, seit 2025):** Vorjahr ≤ 25.000 €, laufendes Jahr ≤ 100.000 €. Bei Überschreiten der 100.000 € gilt ab diesem Umsatz sofort die Regelbesteuerung. Im Gründungsjahr gilt die 25.000-€-Grenze. Ein Verzicht bindet 5 Jahre. | [R] [S] | [gesetze-im-internet.de § 19 UStG](https://www.gesetze-im-internet.de/ustg_1980/__19.html), [Lexware Hilfe](https://help.lexware.de/de-form/articles/548671-uberschreiten-sie-die-umsatzgrenze-fur-die-kleinunternehmerregelung), [NWB/UStAE 19.1](https://datenbank.nwb.de/Dokument/378652_19___1/) |
| Shop-Einstellung `vat_mode` in `business.json`: `kleinunternehmer` (Preise ohne USt-Ausweis, Hinweis § 19 UStG) oder `regel` (Preise inkl. 19 % USt, Rechnung mit Steuerausweis). | [T] | – |
| **EU-Verbraucher / OSS:** Bis 10.000 € netto EU-weiter B2C-Umsatz (Summe aller anderen EU-Länder) gilt die deutsche USt. Darüber gilt die USt des Kundenlandes über das OSS-Verfahren (BZSt). Die Kleinunternehmerregelung gilt nur in Deutschland. Der Shop speichert das Rechnungsland jeder Zahlung (aus Stripe), um die Schwelle überwachen zu können. Er berechnet aber **keine** ausländischen Steuersätze. | [T] teilweise, [S] [P] | [IHK Rhein-Neckar – OSS](https://www.ihk.de/rhein-neckar/recht/steuerrecht/e-commerce-one-stop-shop-verfahren-6844666), [IHK Stuttgart – elektronische Dienstleistungen](https://www.ihk.de/stuttgart/fuer-unternehmen/recht-und-steuern/steuerrecht/umsatzsteuer-international/dienstleistungen/abrechnung-elektronischer-dienstleistungen-5165062) |
| Für Verkäufe an Kunden außerhalb der EU gelten besondere Regeln zum Leistungsort. Die Optionen sind: Verkauf auf EU-Kunden beschränken, Stripe Tax nutzen (kostenpflichtig) oder steuerlich beraten lassen. | [S] [P] | – |
| **Rechnungen:** Alle Preise ≤ 250 € brutto, deshalb genügt eine **Kleinbetragsrechnung** (§ 33 UStDV). Diese ist von der E-Rechnungspflicht ausgenommen. Der Shop erzeugt automatisch fortlaufend nummerierte Rechnungen (FK-JJJJ-00001). | [T] [P] | [Handelskammer Hamburg – E-Rechnung](https://www.handelskammer-hamburg.de/recht-steuern/steuerrecht/allgemeine-informationen/die-e-rechnungspflicht-fuer-unternehmen-6680082) |
| **E-Rechnung:** Empfangspflicht seit 2025 für alle Unternehmen. Ausstellung im B2B ab 2027 (Vorjahresumsatz > 800.000 €) bzw. ab 2028 für alle. Deine **eingehenden** Rechnungen (Stripe, Hosting) musst du empfangen und archivieren können. | [R] [S] | [IHK Stuttgart](https://www.ihk.de/stuttgart/fuer-unternehmen/recht-und-steuern/steuerrecht/steuermeldungen/e-rechnungen-5864496), [PwC zum BMF-Schreiben](https://newsletter.pwc.de/umsatzsteuer/nl0029-2024-10-29/bmf-e-rechnung) |
| **Reverse Charge auf eigene Werbung:** Rechnungen von TikTok, Meta oder Google aus dem EU-Ausland lösen § 13b-USt aus, auch für Kleinunternehmer. | [R] [S] [P] | § 13b UStG (siehe Produkt-Handbuch) |
| Aufbewahrung: Rechnungen und Buchungsbelege nach § 147 AO bzw. § 257 HGB. Der Shop behält bezahlte Bestellungen dauerhaft. Exporte (CSV) für die Buchhaltung gibt es im Admin-Bereich. | [T] [S] | § 147 AO |

## 2. Impressum (§ 5 DDG)

| Anforderung | Einordnung | Quelle |
|---|---|---|
| Das DDG ersetzt das TMG (seit 14.05.2024). Pflichtangaben: Name bzw. Firma, ladungsfähige Anschrift, vertretungsberechtigte Person, schnelle elektronische Kontaktaufnahme (E-Mail **und** Telefon bzw. gleichwertig), USt-IdNr. bzw. W-IdNr. falls vorhanden, Registerangaben falls vorhanden. **Keine** Steuernummer im Impressum. | [R] [T] [S] | [IHK Chemnitz – Impressumspflicht](https://www.ihk.de/chemnitz/recht-und-steuern/rechtsinformationen/internetrecht/pflichtangaben-im-internet-die-impressumspflicht-4401580), [IHK München Merkblatt](https://ihk-muenchen.de/ihk/Merkblätter-WettbewerbsR/Pflichtangaben-Internetimpressum_Stand05_2024.pdf), [WBS Legal](https://www.wbs.legal/medienrecht/webseiten/impressum) |
| Umsetzung: `/impressum` wird aus `business.json` erzeugt. Fehlen Pflichtangaben, zeigt der Shop sichtbare Platzhalter `[[BITTE ERGÄNZEN …]]` und **startet im Produktivmodus nicht** (`npm run check-config`). | [T] | – |
| Verantwortlicher nach § 18 Abs. 2 MStV bei journalistisch-redaktionellen Inhalten (Ratgeber, Rechner-Erklärtexte). | [S] [P] | – |
| **OS-Plattform:** Die ODR-Verordnung ist zum 20.07.2025 aufgehoben (VO (EU) 2024/3228), deshalb gibt es **keinen** Link mehr. Ein verbliebener Link kann abgemahnt werden. Ein Test prüft, dass keiner vorhanden ist. Die VSBG-Erklärung bleibt („nicht bereit und nicht verpflichtet“). | [R] [T] | [IT-Recht Kanzlei](https://www.it-recht-kanzlei.de/abschaltung-os-plattform.html), [IHK Schwaben](https://www.ihk.de/schwaben/produktmarken/recht-und-steuern/onlinerecht/neue-informationspflichten-fuer-online-haendler-3067566), [Händlerbund](https://www.haendlerbund.de/de/ratgeber/recht/3993-odr-verordnung) |
| Auch Social-Media-Profile (TikTok, Instagram) brauchen ein Impressum, zum Beispiel einen Link „Impressum“ in der Bio, der zur Website führt. | [R] [S] | [IHK Chemnitz](https://www.ihk.de/chemnitz/recht-und-steuern/rechtsinformationen/internetrecht/pflichtangaben-im-internet-die-impressumspflicht-4401580) |

## 3. Bestellprozess, Button-Lösung, Vertragsschluss

| Anforderung | Einordnung | Quelle |
|---|---|---|
| **Button-Lösung (§ 312j Abs. 3 BGB):** Die bestellauslösende Schaltfläche muss „zahlungspflichtig bestellen“ oder eine gleich eindeutige Formulierung tragen. Im Shop löst der Button „Zahlungspflichtig bestellen“ das Angebot aus, danach folgt die Zahlung bei Stripe. Ein Button nur mit „Bezahlen“ gilt als riskant. | [R] [T] [P] | [IHK Frankfurt – Bestellablauf](https://www.frankfurt-main.ihk.de/recht/uebersicht-alle-rechtsthemen/vertragsrecht-und-e-commerce-recht/rechtliche-anforderungen-fuer-online-shops/gestaltung-des-bestellvorgangs-bei-vertraegen-mit-verbrauchern-5174184), [CMS – EuGH C-249/21](https://cms.law/de/deu/legal-updates/EuGH-Online-Bestellbutton-muss-Zahlungspflicht-ausweisen), [ra-plutte – LG Hildesheim](https://www.ra-plutte.de/lg-hildesheim-bestellbutton-mit-kreditkarte-bezahlen/amp/) |
| Unmittelbar vor dem Button stehen: Produkt, Gesamtpreis, Hinweis zur USt, Versand entfällt, Lieferumfang und Zahlungsweg. | [R] [T] | Art. 246a § 1 EGBGB, § 312j Abs. 2 BGB |
| **Prüfen lassen:** Vertragsschluss-Modell nach AGB § 3 (Angebot per Klick, Annahme per Bestellbestätigung nach Zahlungseingang, Bindung 24 h) und das Zusammenspiel mit dem Stripe-Button („Bezahlen“). | [P] | – |
| Vertragsbestätigung auf dauerhaftem Datenträger (§ 312f Abs. 2 BGB): Die Bestell-E-Mail enthält Bestelldaten, Anbieter, AGB und Widerrufsbelehrung im Volltext. | [R] [T] | § 312f BGB |
| Preisangaben (PAngV): Endpreise, bei Kleinunternehmern ohne „inkl. MwSt.“ (Test vorhanden), keine Versandkosten. Es gibt keine Rabatt-Streichpreise. Falls du später Rabatte zeigst, gilt § 11 PAngV (niedrigster Preis der letzten 30 Tage). | [R] [T] [S] | PAngV |

## 4. Widerrufsrecht bei digitalen Inhalten

| Anforderung | Einordnung | Quelle |
|---|---|---|
| 14 Tage Widerrufsrecht für Verbraucher. Es **erlischt vorzeitig** (§ 356 Abs. 5 BGB), wenn (1) der Verbraucher ausdrücklich zugestimmt hat, dass vor Fristablauf mit der Ausführung begonnen wird, (2) er seine Kenntnis vom Verlust des Widerrufsrechts bestätigt hat und (3) der Unternehmer eine Vertragsbestätigung auf dauerhaftem Datenträger (§ 312f Abs. 3 BGB) zur Verfügung gestellt hat. Ein bloßer Hinweis genügt nicht (LG Köln 31 O 372/17). | [R] | [IT-Recht Kanzlei – Widerrufsrecht digitale Inhalte](https://www.it-recht-kanzlei.de/widerrufsrecht-digitale-inhalte-dienstleistungen-2022.html), [LTO](https://www.lto.de/recht/hintergruende/h/lg-berlin-52o34015-online-dating-widerrufsrecht-verbraucher-digitale-inhalte-ideo-labs-agb), [IT-Recht Kanzlei – LG Köln](https://www.it-recht-kanzlei.de/lg-koeln-widerrufsrecht-verzicht-digitale-inhalte.html), [EVZ](https://www.evz.de/einkaufen-internet/gewaehrleistung-und-garantie/widerrufsrecht-bei-digitalen-produkten.html) |
| Umsetzung: **zwei getrennte, nicht vorausgewählte Checkboxen** (Zustimmung und Kenntnis). Eine allein wird abgelehnt (Test). Zeitpunkt und Textversion werden pro Bestellung gespeichert. Die Bestell-E-Mail bestätigt beide Erklärungen und das Erlöschen. | [T] | – |
| **Keine Pauschalklausel** „digitale Produkte vom Umtausch ausgeschlossen“. Wer **nicht** zustimmt, kauft trotzdem: Das Widerrufsrecht bleibt bestehen, und der Download wird nach Fristablauf automatisch versendet. Bei Widerruf vor Auslieferung erstattet der Shop automatisch über Stripe. | [T] [P] | – |
| **Widerrufsbutton (§ 356a BGB, seit 19.06.2026):** dauerhaft verfügbare, hervorgehobene Funktion „Vertrag widerrufen“, zweistufig mit Bestätigungsschaltfläche und unverzüglicher Eingangsbestätigung auf dauerhaftem Datenträger. Ob die Funktion bei wirksam erloschenem Widerrufsrecht entfallen darf, ist umstritten. Der Shop bietet sie deshalb immer an. | [R] [T] [P] | [Noerr](https://www.noerr.com/de/insights/umsetzungsgesetz-zum-widerrufsbutton-veroeffentlicht), [IHK Hannover](https://www.ihk.de/hannover/hauptnavigation/recht/wirtschafts-und-wettbewerbsrecht2/wettbewerbsrecht/widerrufs-button-6779328), [IHK Osnabrück](https://www.ihk.de/osnabrueck/recht-und-fair-play/recht/internetrecht/widerrufsbutton-ab-juni-2026-6975440), [IT-Recht Kanzlei – Widerrufsbutton digitale Inhalte](https://www.it-recht-kanzlei.de/widerrufsbutton-digitale-inhalte.html), [Händlerbund](https://ohn.haendlerbund.de/recht/rechtsfragen/widerrufsfunktion-digitale-gueter) |
| **Muster-Widerrufsbelehrung:** Die Anlage 1 EGBGB wurde zum 19.06.2026 um Gestaltungshinweise zur Widerrufsfunktion ergänzt. Der exakte amtliche Wortlaut konnte hier nicht abgerufen werden. Die Belehrung enthält einen Satz zur Widerrufsfunktion und muss **wörtlich gegen die aktuelle Anlage 1 und 2 EGBGB abgeglichen werden**. | [P] [S] | [Fieldfisher](https://www.fieldfisher.com/de-de/locations/germany/insights/der-elektronische-widerrufsbutton-kommt-worauf-unternehmen), [buzer.de – EGBGB](https://www.buzer.de/gesetz/5257/v166712.htm) |
| Mängelrechte digitale Produkte (§§ 327 ff. BGB) inklusive Aktualisierungspflicht (§ 327f BGB). Die AGB grenzen Jahreswerte von Aktualisierungen ab. | [R] [P] | §§ 327 ff. BGB |

## 5. Datenschutz (DSGVO, TDDDG)

| Anforderung | Einordnung | Quelle |
|---|---|---|
| Datenschutzerklärung (Art. 13 DSGVO) unter `/datenschutz`. Sie wird automatisch passend zur Konfiguration erzeugt, zum Beispiel erscheint der TikTok-Abschnitt nur bei aktivem Pixel. | [R] [T] [S] | Art. 13 DSGVO |
| **Cookies/Tracking (§ 25 TDDDG):** Standardmäßig setzt der Shop **keine** Cookies und lädt kein Tracking (Test). Das TikTok Pixel lädt nur nach aktivem Klick auf „Akzeptieren“. Ablehnen ist gleichwertig, der Widerruf ist über „Cookie-Einstellungen“ möglich. Die Reichweitenzählung läuft serverseitig ohne Cookies, ohne IP und nur aggregiert. | [R] [T] [P] | [DSK-Orientierungshilfe Telemedien](https://www.datenschutzkonferenz-online.de/orientierungshilfen.html) *(Fundstelle nicht abrufbar, bitte prüfen)* |
| **Auftragsverarbeitung (Art. 28 DSGVO):** AVV mit Hosting-Anbieter und E-Mail-Versanddienst abschließen. Stripe stellt ein Data Processing Agreement bereit und ist für Teile der Verarbeitung selbst verantwortlich. Für das TikTok Pixel gilt eine gemeinsame Verantwortlichkeit mit Vereinbarung nach Art. 26 (in den TikTok-Werbebedingungen). | [R] [S] [P] | – |
| Drittlandübermittlung: Stripe ist nach dem EU-U.S. Data Privacy Framework zertifiziert. Für TikTok sind Übermittlungen in Drittländer möglich. | [R] [S] [P] | – |
| **Datensparsamkeit:** Gespeichert werden nur E-Mail, Bestelldaten, Zustimmungen und das Rechnungsland. Keine Kartendaten, keine IPs in der Datenbank, Tokens nur als Hash. Die Caddy-Logs kürzen IPs und werden nach 7 Tagen gelöscht. | [T] | – |
| **Löschfristen** (automatisch, stündlicher Job): nicht abgeschlossene Bestellungen nach 30 Tagen, Kontaktanfragen nach 6 Monaten, unbestätigte Newsletter-Anmeldungen nach 30 Tagen, Abmeldungen nach 3 Jahren. Bezahlte Bestellungen bleiben wegen der Aufbewahrungspflicht. | [T] [P] | – |
| **Newsletter:** Double-Opt-in, Nachweis über Zeitpunkte und Textversion, Abmeldelink. Werbung an Bestandskunden **ohne** Einwilligung nur unter den Voraussetzungen von § 7 Abs. 3 UWG. Der Shop versendet von sich aus keine Werbe-Mails. | [R] [T] [S] | § 7 UWG |

## 6. Werbung, UWG, Urheberrecht

| Anforderung | Einordnung | Quelle |
|---|---|---|
| **Keine erfundenen Bewertungen, Kundenstimmen oder Verkaufszahlen** (UWG Anhang Nr. 23b/23c, § 5 UWG). Im Shop gibt es keine Bewertungen, und die strukturierten Daten enthalten bewusst kein `aggregateRating` (Test). | [R] [T] | § 5, § 5b UWG, Anhang zu § 3 Abs. 3 UWG |
| **Keine unbelegbaren Erfolgsversprechen:** Wir versprechen keine Steuerersparnis. Zahlen in Videos stammen aus den fiktiven Beispieldateien, sind als Beispiel gekennzeichnet und mit Tarif 2026 nachrechenbar. | [R] [T] | § 5 UWG |
| **Vergleichende Werbung (§ 6 UWG):** Der Vergleich auf der Startseite stellt Produkt**kategorien** gegenüber, keine benannten Wettbewerber. Die Abo-Preisspanne beruht auf Listenpreisen 2026 (siehe Marktanalyse). Vor dem Start erneut prüfen. | [R] [P] [S] | § 6 UWG |
| **Keine Steuerberatung (StBerG):** Das Produkt ist ein allgemeines Werkzeug ohne individuelle Hilfe in Steuersachen. In Werbung und Support keine Einzelfallberatung geben. Bei Fragen zur eigenen Situation an Steuerberatung verweisen. | [R] [P] | §§ 2, 5 StBerG |
| **Musik in TikTok-Werbung:** Für Unternehmen ist nur die Commercial Music Library (CML) zulässig, und diese Lizenz gilt nur auf TikTok. Unsere Videos nutzen **selbst synthetisierte Musik** ohne Fremdsamples. Für Reels und Pinterest gelten deren eigene Lizenzen. | [R] [T] | [TikTok – Commercial Music Library](https://ads.tiktok.com/resources/help/article/commercial-music-library), [Foxi Music](https://www.foximusic.com/blog/commercial-music-licensing-tiktok-guide/) |
| **Bilder und Schriften:** Alle Screenshots stammen aus dem eigenen Produkt. Die Schrift Inter steht unter der SIL Open Font License. Logo und Grafiken sind selbst erstellt. | [T] | – |
| **KI-generierte Inhalte:** Die Werbetexte wurden KI-gestützt erstellt. Die Videos zeigen keine realen Personen und keine täuschend echten Szenen. TikTok verlangt eine Kennzeichnung für realistisch wirkende KI-Inhalte. Bei diesen Motion-Graphics ist das voraussichtlich nicht nötig, prüfe aber die aktuellen TikTok-Richtlinien. Die Transparenzpflichten nach Art. 50 der KI-Verordnung gelten in Teilen ab 02.08.2026. | [S] [P] | TikTok-Community-Richtlinien, VO (EU) 2024/1689 |
| **Werbekennzeichnung:** Anzeigen sind auf TikTok automatisch als „Gesponsert“ markiert. Bei Kooperationen mit Creatorn Werbung kennzeichnen (§ 5a Abs. 4 UWG). | [R] [S] | § 5a UWG |
| **Marke:** Recherche „Freikontor“ in DPMAregister und EUIPO **vor** Domain- und Profilkauf. | [S] [P] | – |

## 7. Zahlungsanbieter

| Anforderung | Einordnung | Quelle |
|---|---|---|
| Stripe-Konto mit Verifizierung (KYC), Geschäftsangaben, Bankkonto. Zahlungsarten (Karten, Apple/Google Pay, PayPal über Stripe, ggf. SEPA) im Stripe-Dashboard aktivieren. | [S] | Stripe-Dashboard |
| Webhook nur über ein signiertes Geheimnis. Der Shop prüft die Signatur, gleicht Betrag, Währung und Session ab, verarbeitet doppelte Events nicht erneut und schaltet nichts frei, solange die Zahlung nicht bestätigt ist. Mit `STRIPE_REQUIRE_LIVEMODE=1` werden im Livebetrieb keine Testzahlungen angenommen. | [T] | [Stripe Docs – Checkout Policies](https://edge-docs.stripe.com/payments/checkout/customization/policies) |

---

## Persönliche To-do-Liste vor dem Start

1. [ ] Gewerbe anmelden, Fragebogen zur steuerlichen Erfassung abgeben, Entscheidung Kleinunternehmer ja/nein (mit Steuerberatung).
2. [ ] `shop/business.json` vollständig ausfüllen (Name, Anschrift, Telefon, E-Mail, ggf. USt-IdNr., Hosting- und E-Mail-Anbieter).
3. [ ] AVV mit Hosting- und E-Mail-Anbieter abschließen.
4. [ ] Markenrecherche „Freikontor“, Domain registrieren.
5. [ ] **Anwaltliche Prüfung** von AGB, Widerrufsbelehrung (Abgleich mit der aktuellen Anlage 1/2 EGBGB), Datenschutzerklärung, Checkout und Vertragsschluss-Modell sowie Widerrufsfunktion. Alternativ einen Rechtstexte-Dienst mit Update-Service nutzen (z. B. IT-Recht Kanzlei, Händlerbund, eRecht24; kostenpflichtig) und die Texte in `shop/src/legal.js` ersetzen.
6. [ ] **Steuerliche Prüfung** von Umsatzsteuer-Behandlung, OSS, Kunden außerhalb der EU, Rechnungsformat, Gewerbesteuer und Aufbewahrung.
7. [ ] Impressum-Link in TikTok- und Instagram-Bio.
8. [ ] Vor Rabattaktionen: Preisangabenverordnung (30-Tage-Tiefstpreis) beachten.
