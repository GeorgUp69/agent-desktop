/* Storyboards der 10 TikTok-Anzeigen. Zahlen stammen aus den fiktiven Beispieldateien des Produkts
   (Beispiel A: 38.000 € Gehalt, ca. 24.800 € Jahresgewinn, Einzelveranlagung, ohne Kirchensteuer, Tarif 2026). */
(typeof window !== "undefined" ? window : globalThis).STORYBOARDS = {
  'v01-doppelschlag': {
    title: 'Der Doppelschlag', concept: 'Problem-Lösung', bg: 'ink',
    music: { bpm: 96, root: 57, mood: 'spannend, dann auflösend' },
    caption: 'Die erste Steuererklärung als Selbstständige? Dann kommt oft der Doppelschlag. So siehst du ihn kommen 👇',
    hashtags: ['selbstständig', 'steuern', 'freelancer', 'steuertipps', 'kleinunternehmer', 'nebengewerbe', 'finanzen'],
    scenes: [
      { type: 'hook', dur: 2.8, lines: ['Erste Steuererklärung', 'als Selbstständige?'], accent: ['Steuererklärung'], vo: 'Deine erste Steuererklärung als Selbstständige steht an?' },
      { type: 'hook', dur: 3.0, lines: ['Dann kommen oft', 'ZWEI Rechnungen', 'auf einmal.'], accent: ['ZWEI'], vo: 'Dann kommen oft zwei Rechnungen auf einmal.' },
      { type: 'list', dur: 4.6, bg: 'paper', kicker: 'Der Doppelschlag', title: 'Was das Finanzamt schickt:', items: ['Nachzahlung fürs Vorjahr', 'Vorauszahlungen fürs laufende Jahr'], icon: 'num', gap: 0.9, vo: 'Die Nachzahlung fürs Vorjahr. Und Vorauszahlungen fürs laufende Jahr.' },
      { type: 'text', dur: 3.4, title: 'Wer unterjährig nicht weiß, wo er steht, merkt es zu spät.', accent: ['zu spät.'], vo: 'Wer unterjährig nicht weiß, wo er steht, merkt es zu spät.' },
      { type: 'shot', dur: 5.4, title: 'Das Finanzcockpit zeigt es dir jeden Monat.', accent: ['jeden Monat.'], accentCls: 'accent-green', img: "kpis-ku.png", h: 560, kb: [1.75, 1.95, 0, 0.45, 0, 0], cap: 'Gewinn · Soll-Rücklage · Fehlbetrag', capAt: 1.2, note: 'Echte Ansicht der Datei · fiktive Beispieldaten', vo: 'Das Finanzcockpit zeigt dir jeden Monat deinen Gewinn und wie viel auf dem Steuerkonto liegen sollte.' },
      { type: 'number', dur: 3.6, label: 'Soll-Rücklage heute im Beispiel:', to: 6889, suffix: ' €', body: 'berechnet nach Tarif 2026', note: 'Fiktives Beispiel A · keine Steuerberatung', vo: 'Im Beispiel: knapp 6.900 Euro, berechnet nach dem Tarif 2026.' },
      { type: 'cta', dur: 3.6, vo: 'Finanzcockpit 2026. Ab 29 Euro, einmalig. Link in der Bio.' },
    ],
  },

  'v02-demo': {
    title: 'In 3 Schritten zur Rücklage', concept: 'Produktdemonstration', bg: 'paper',
    music: { bpm: 108, root: 60, mood: 'leicht, produktiv' },
    caption: 'So rechnet das Finanzcockpit deine Steuerrücklage – in 3 Schritten. Echte Ansicht, fiktive Zahlen.',
    hashtags: ['excel', 'selbstständig', 'buchhaltung', 'steuern', 'freelancer', 'excelvorlage', 'eür'],
    scenes: [
      { type: 'hook', dur: 3.0, lines: ['Wie viel Steuer musst', 'du zurücklegen?', 'In 3 Schritten:'], accent: ['3', 'Schritten:'], accentCls: 'accent-green', vo: 'Wie viel Steuer musst du zurücklegen? In drei Schritten.' },
      { type: 'shot', dur: 4.6, num: '1', kicker: 'Schritt 1', title: 'Rechnungen eintragen', img: 'einnahmen.png', h: 640, kb: [1.6, 1.75, 0, 0.12, 0.15, 0.25], cap: 'Status „Überfällig“ kommt automatisch', capAt: 1.4, vo: 'Schritt eins: Rechnungen eintragen. Überfällige markiert das Cockpit automatisch.' },
      { type: 'shot', dur: 4.6, num: '2', kicker: 'Schritt 2', title: 'Belege eintragen', img: 'ausgaben-crop.png', h: 640, kb: [1.5, 1.7, 0, 0.22, 0.1, 0.25], cap: 'Vorsteuer & Netto rechnen sich selbst', capAt: 1.4, vo: 'Schritt zwei: Belege mit Bruttobetrag eintragen. Vorsteuer und Netto rechnen sich selbst.' },
      { type: 'shot', dur: 5.0, num: '3', kicker: 'Schritt 3', title: 'Rücklage ablesen', img: 'ergebnis-ku.png', h: 640, kb: [1.0, 1.04, 0, 0, 0, 0], hl: { x: 0.01, y: 0.66, w: 0.98, h: 0.07, at: 1.3 }, note: 'Echte Ansicht · fiktive Beispieldaten', vo: 'Schritt drei: Rücklage ablesen. Fertig.' },
      { type: 'text', dur: 4.0, kicker: 'Plus deine Faustregel', title: '33 % jeder Zahlung zurücklegen.', accent: ['33 %'], accentCls: 'accent-green', body: 'Persönlich berechnet – nicht pauschal.', note: 'Wert aus Beispiel A (fiktiv)', vo: 'Dazu bekommst du deine persönliche Faustregel. Im Beispiel: 33 Prozent jeder Zahlung.' },
      { type: 'cta', dur: 3.6, bg: 'ink', vo: 'Finanzcockpit 2026. Link in der Bio.' },
    ],
  },

  'v03-vorher-nachher': {
    title: 'Bauchgefühl vs. Berechnung', concept: 'Vorher-Nachher (Rechenbeispiel)', bg: 'ink',
    music: { bpm: 100, root: 55, mood: 'kontrastreich' },
    caption: 'Vorher: „Ich leg mal 20 % weg.“ Nachher: Die echte Zahl. Rechenbeispiel mit fiktiven Werten.',
    hashtags: ['steuern', 'nebenjob', 'selbstständig', 'finanztipps', 'steuerrücklage', 'freelancer'],
    scenes: [
      { type: 'hook', dur: 2.8, lines: ['Vorher vs. Nachher:', 'Steuerrücklage'], accent: ['Nachher:'], vo: 'Vorher, nachher: die Steuerrücklage.' },
      { type: 'compare', dur: 5.2, title: 'Nebenjob mit 24.800 € Gewinn', left: { label: 'Vorher', value: '„20 % reichen“', sub: 'Bauchgefühl' }, right: { label: 'Nachher', value: '32,6 %', sub: 'berechnet nach Tarif 2026' }, note: 'Beispiel A (fiktiv): 38.000 € Gehalt, Einzelveranlagung, ohne KiSt', vo: 'Vorher: 20 Prozent reichen doch. Nachher: 32,6 Prozent, berechnet nach Tarif 2026.' },
      { type: 'number', dur: 4.4, label: 'Im Beispiel hätten gefehlt:', to: 3133, suffix: ' €', color: 'accent-brass', body: '8.096 € Mehrsteuer statt 4.963 € Rücklage', note: 'Rechenbeispiel, fiktive Werte · keine Steuerberatung', vo: 'Im Beispiel hätten über 3.100 Euro gefehlt.' },
      { type: 'shot', dur: 5.2, title: 'Warum? Dein Gewinn kommt aufs Gehalt obendrauf.', accent: ['obendrauf.'], img: 'berechnung-ku.png', h: 700, kb: [1.0, 1.15, 0, 0.1, 0, 0.45], cap: 'Das Cockpit rechnet mit und ohne Selbstständigkeit', capAt: 1.3, vo: 'Warum? Dein Gewinn kommt auf das Gehalt obendrauf. Das Cockpit rechnet beides durch.' },
      { type: 'cta', dur: 3.6, vo: 'Rechne es aus. Link in der Bio.' },
    ],
  },

  'v04-brief': {
    title: 'Der Brief vom Finanzamt', concept: 'Emotional', bg: 'ink',
    music: { bpm: 72, root: 52, mood: 'ruhig, warm' },
    caption: 'Der Moment, wenn der Brief vom Finanzamt kommt. Und du die Zahl schon kennst.',
    hashtags: ['selbstständigkeit', 'steuern', 'finanzamt', 'freelancerlife', 'mindset', 'finanzen'],
    scenes: [
      { type: 'hook', dur: 3.2, lines: ['Dieser Moment,', 'wenn der Brief vom', 'Finanzamt kommt.'], accent: ['Finanzamt'], wordGap: 0.16, vo: 'Dieser Moment, wenn der Brief vom Finanzamt kommt.' },
      { type: 'text', dur: 3.2, title: 'Und du nicht weißt, was drinsteht.', vo: 'Und du nicht weißt, was drinsteht.' },
      { type: 'text', dur: 3.6, title: 'Stell dir vor, du kennst die Zahl schon.', accent: ['kennst'], accentCls: 'accent-green', vo: 'Stell dir vor, du kennst die Zahl schon.' },
      { type: 'shot', dur: 5.4, bg: 'paper', title: 'Monat für Monat.', img: "kpis-ku.png", h: 560, kb: [1.6, 1.8, 0.5, 0, 0, 0], note: 'Echte Ansicht · fiktive Beispieldaten', vo: 'Monat für Monat. Gewinn, Rücklage, offene Rechnungen.' },
      { type: 'text', dur: 3.6, title: 'Kein Bauchgefühl. Kein Schock. Nur Klarheit.', accent: ['Klarheit.'], vo: 'Kein Bauchgefühl. Kein Schock. Nur Klarheit.' },
      { type: 'cta', dur: 3.8, vo: 'Das Freikontor Finanzcockpit. Link in der Bio.' },
    ],
  },

  'v05-direkt': {
    title: '29 € statt Abo', concept: 'Direktes Verkaufsvideo', bg: 'green',
    music: { bpm: 118, root: 62, mood: 'energisch' },
    caption: 'Finanzcockpit 2026 für Selbstständige: 29 € einmalig, kein Abo. Excel, LibreOffice oder Google Sheets.',
    hashtags: ['excel', 'vorlage', 'selbstständig', 'kleinunternehmer', 'buchhaltung', 'freelancer', 'steuern'],
    scenes: [
      { type: 'hook', dur: 2.6, lines: ['Finanzcockpit 2026', 'für Selbstständige.'], accent: ['2026'], vo: 'Das Finanzcockpit 2026 für Selbstständige.' },
      { type: 'list', dur: 5.4, bg: 'ink', title: 'Drin:', items: ['Steuerrücklage nach Tarif 2026', 'Kleinunternehmer-Monitor', 'EÜR & Umsatzsteuer', 'Offene Rechnungen', 'Handbuch, 17 Seiten'], gap: 0.55, vo: 'Steuerrücklage nach Tarif 2026, Kleinunternehmer-Monitor, EÜR und Umsatzsteuer, offene Rechnungen, Handbuch.' },
      { type: 'hook', dur: 3.0, lines: ['29 € einmalig.', 'Kein Abo.'], accent: ['29 €'], vo: '29 Euro, einmalig. Kein Abo.' },
      { type: 'list', dur: 4.0, bg: 'paper', title: 'Läuft in:', items: ['Excel', 'LibreOffice (kostenlos)', 'Google Sheets'], gap: 0.4, vo: 'Läuft in Excel, LibreOffice und Google Sheets.' },
      { type: 'text', dur: 3.2, title: 'Deine Daten bleiben auf deinem Gerät.', accent: ['deinem Gerät.'], vo: 'Und deine Daten bleiben auf deinem Gerät.' },
      { type: 'cta', dur: 3.6, bg: 'ink', vo: 'Link in der Bio.' },
    ],
  },

  'v06-lena': {
    title: 'Lenas Nebenjob', concept: 'Storytelling', bg: 'paper',
    music: { bpm: 90, root: 57, mood: 'erzählend' },
    caption: 'Lena macht nebenbei Grafikdesign. Sie dachte, 20 % Rücklage reichen. (Fiktives Rechenbeispiel, Tarif 2026)',
    hashtags: ['nebengewerbe', 'nebenjob', 'grafikdesign', 'steuern', 'selbstständig', 'kleinunternehmer'],
    scenes: [
      { type: 'hook', dur: 3.0, lines: ['Lena macht nebenbei', 'Grafikdesign.'], accent: ['Grafikdesign.'], accentCls: 'accent-green', sub: 'Fiktives Beispiel', vo: 'Lena macht nebenbei Grafikdesign.' },
      { type: 'text', dur: 4.0, title: 'Job: 38.000 €. Nebenbei: ca. 24.800 € Gewinn.', accent: ['24.800 €'], accentCls: 'accent-green', vo: 'Im Job verdient sie 38.000 Euro. Nebenbei macht sie dieses Jahr etwa 24.800 Euro Gewinn.' },
      { type: 'text', dur: 3.4, title: 'Sie denkt: „20 % zurücklegen reicht.“', vo: 'Sie denkt: 20 Prozent zurücklegen reicht.' },
      { type: 'number', dur: 4.2, bg: 'ink', label: 'Tatsächliche Mehrsteuer:', to: 8096, suffix: ' €', color: 'accent-brass', body: 'Rücklagequote 32,6 %', note: 'Tarif 2026, Einzelveranlagung, ohne Kirchensteuer · fiktiv', vo: 'Tatsächlich löst ihr Nebenjob rund 8.100 Euro Steuer aus.' },
      { type: 'text', dur: 4.0, title: 'Weil der Gewinn aufs Gehalt obendrauf kommt.', body: 'Grenzsteuersatz im Beispiel: ca. 37 %.', bodyAccent: ['37 %'], vo: 'Weil der Gewinn auf das Gehalt obendrauf kommt. Grenzsteuersatz: etwa 37 Prozent.' },
      { type: 'bar', dur: 4.6, kicker: 'Und noch was', title: '90 % der 25.000-€-Grenze sind erreicht.', accent: ['90 %'], value: 22560, max: 25000, warn: true, body: 'Nächstes Jahr: wahrscheinlich keine Kleinunternehmerin mehr.', vo: 'Und: 90 Prozent der Kleinunternehmergrenze sind schon erreicht.' },
      { type: 'cta', dur: 3.6, bg: 'ink', title: 'Sei vorbereitet.', vo: 'Sei vorbereitet. Finanzcockpit 2026, Link in der Bio.' },
    ],
  },

  'v07-reverse-charge': {
    title: 'Meta-Ads und Kleinunternehmer', concept: 'Überraschungseffekt', bg: 'ink',
    music: { bpm: 112, root: 58, mood: 'überraschend' },
    caption: 'Kleinunternehmer und Werbung bei Meta oder Google? Diese Umsatzsteuer schuldest du trotzdem (§ 13b UStG). Lass deinen Fall prüfen.',
    hashtags: ['kleinunternehmer', 'umsatzsteuer', 'metaads', 'steuertipps', 'selbstständig', 'reversecharge'],
    scenes: [
      { type: 'hook', dur: 3.0, lines: ['Kleinunternehmer', 'mit Meta- oder', 'Google-Werbung?'], accent: ['Meta-', 'Google-Werbung?'], vo: 'Du bist Kleinunternehmer und schaltest Werbung bei Meta oder Google?' },
      { type: 'hook', dur: 3.0, lines: ['Dann schuldest du', 'trotzdem', 'Umsatzsteuer.'], accent: ['trotzdem'], vo: 'Dann schuldest du trotzdem Umsatzsteuer.' },
      { type: 'text', dur: 5.0, bg: 'paper', kicker: 'Reverse Charge · § 13b UStG', title: 'Die Rechnung kommt aus Irland – ohne USt.', size: 'm', body: 'Die Steuer schuldest dann du. Als Kleinunternehmer kannst du sie nicht als Vorsteuer abziehen.', vo: 'Die Rechnung kommt aus Irland, ohne Umsatzsteuer. Die Steuer schuldest dann du, und als Kleinunternehmer kannst du sie nicht abziehen.' },
      { type: 'shot', dur: 4.8, title: 'Im Cockpit: ein Häkchen.', accent: ['ein Häkchen.'], accentCls: 'accent-green', img: 'ausgaben-crop.png', h: 640, kb: [1.9, 2.0, 0.33, 0.4, 0.1, 0.2], cap: 'Spalte „Reverse Charge § 13b“', capAt: 1.2, vo: 'Im Finanzcockpit setzt du ein Häkchen. Den Rest rechnet es aus.' },
      { type: 'number', dur: 3.8, label: '§ 13b-Steuer im Beispiel:', to: 204, suffix: ' €', color: 'accent-brass', body: 'automatisch im Blatt Umsatzsteuer', note: 'Fiktives Beispiel A · Einzelfall bitte mit Steuerberatung prüfen', vo: 'Im Beispiel sind es 204 Euro, die sonst niemand auf dem Schirm hat.' },
      { type: 'cta', dur: 3.6, vo: 'Finanzcockpit 2026. Link in der Bio.' },
    ],
  },

  'v08-vorteile': {
    title: '5 Gründe', concept: 'Produktvorteile', bg: 'ink',
    music: { bpm: 122, root: 60, mood: 'schnell' },
    caption: '5 Gründe für das Finanzcockpit statt einer weiteren Abo-App.',
    hashtags: ['selbstständig', 'freelancer', 'excel', 'steuern', 'produktivität', 'kleinunternehmer'],
    scenes: [
      { type: 'hook', dur: 2.6, lines: ['5 Gründe für', 'dein Finanzcockpit'], accent: ['5'], vo: 'Fünf Gründe für dein Finanzcockpit.' },
      { type: 'text', dur: 2.8, num: '1', kicker: 'Grund 1', title: 'Echter Tarif statt pauschal 30 %.', accent: ['Echter Tarif'], vo: 'Eins: echter Tarif statt pauschal 30 Prozent.' },
      { type: 'text', dur: 2.8, num: '2', kicker: 'Grund 2', title: 'Kleinunternehmergrenzen nach den Regeln seit 2025.', accent: ['seit 2025.'], vo: 'Zwei: Kleinunternehmergrenzen nach den Regeln seit 2025.' },
      { type: 'text', dur: 2.8, num: '3', kicker: 'Grund 3', title: 'Deine Daten bleiben auf deinem Gerät.', accent: ['deinem Gerät.'], vo: 'Drei: Deine Daten bleiben auf deinem Gerät.' },
      { type: 'text', dur: 2.8, num: '4', kicker: 'Grund 4', title: 'Einmal 29 €. Kein Abo.', accent: ['Kein Abo.'], vo: 'Vier: einmal 29 Euro, kein Abo.' },
      { type: 'text', dur: 3.2, num: '5', kicker: 'Grund 5', title: 'Jede Formel automatisiert gegen eine Referenz getestet.', size: 'm', accent: ['getestet.'], vo: 'Fünf: Jede Steuerformel ist automatisiert gegen eine Referenzrechnung getestet.' },
      { type: 'cta', dur: 3.6, vo: 'Link in der Bio.' },
    ],
  },

  'v09-fragen': {
    title: '3 Fragen, die alle stellen', concept: 'Häufige Kundenprobleme', bg: 'paper',
    music: { bpm: 98, root: 55, mood: 'freundlich' },
    caption: '3 Fragen, die fast jede Selbstständige stellt – kurz beantwortet. Allgemeine Infos, keine Steuerberatung.',
    hashtags: ['steuerfragen', 'selbstständig', 'kleinunternehmer', 'vorauszahlung', 'steuern', 'freelancer'],
    scenes: [
      { type: 'hook', dur: 2.6, lines: ['3 Fragen, die fast', 'jede Selbstständige', 'stellt.'], accent: ['3'], accentCls: 'accent-green', vo: 'Drei Fragen, die fast jede Selbstständige stellt.' },
      { type: 'qa', dur: 5.2, bg: 'ink', q: 'Reichen 30 % Rücklage?', a: 'Kommt drauf an. Mit Gehalt oft mehr, mit kleinem Gewinn oft weniger.', accent: ['Kommt drauf an.'], vo: 'Reichen 30 Prozent Rücklage? Kommt drauf an. Mit Gehalt oft mehr, mit kleinem Gewinn oft weniger.' },
      { type: 'qa', dur: 5.6, bg: 'ink', q: 'Bin ich noch Kleinunternehmer?', a: 'Vorjahr max. 25.000 €, laufendes Jahr max. 100.000 €. Darüber: sofort Regelbesteuerung.', accent: ['sofort'], vo: 'Bin ich noch Kleinunternehmer? Vorjahr maximal 25.000 Euro, laufendes Jahr maximal 100.000. Darüber sofort Regelbesteuerung.' },
      { type: 'qa', dur: 5.2, bg: 'ink', q: 'Wann kommen Vorauszahlungen?', a: 'Laut Bescheid meist am 10.3., 10.6., 10.9. und 10.12.', accent: ['10.3., 10.6., 10.9. und 10.12.'], vo: 'Wann kommen Vorauszahlungen? Laut Bescheid meist am zehnten März, Juni, September und Dezember.' },
      { type: 'text', dur: 3.4, title: 'Das Finanzcockpit rechnet alle drei für dich mit.', accent: ['alle drei'], accentCls: 'accent-green', vo: 'Das Finanzcockpit rechnet alle drei für dich mit.' },
      { type: 'cta', dur: 3.6, bg: 'ink', vo: 'Link in der Bio.' },
    ],
  },

  'v10-brand': {
    title: 'Klarheit ist eine Zahl', concept: 'Premium-Brand-Werbung', bg: 'ink', noWatermark: true,
    music: { bpm: 64, root: 50, mood: 'edel, ruhig' },
    caption: 'Klarheit ist kein Zufall. Freikontor – klare Finanzen für Selbstständige.',
    hashtags: ['freikontor', 'selbstständig', 'finanzen', 'design', 'klarheit', 'freelancer'],
    scenes: [
      { type: 'logo', dur: 3.2, title: 'Freikontor', vo: '' },
      { type: 'hook', dur: 3.2, lines: ['Klarheit ist', 'kein Zufall.'], wordGap: 0.22, accent: ['Klarheit'], vo: 'Klarheit ist kein Zufall.' },
      { type: 'hook', dur: 3.0, lines: ['Sie ist eine Zahl.'], wordGap: 0.22, accent: ['Zahl.'], vo: 'Sie ist eine Zahl.' },
      { type: 'number', dur: 4.0, label: 'Deine Rücklagequote, zum Beispiel:', to: 32.6, decimals: 1, suffix: ' %', countDur: 2.2, note: 'Beispielwert (fiktiv)', vo: 'Deine Rücklagequote. Zum Beispiel 32,6 Prozent.' },
      { type: 'text', dur: 3.4, title: 'Klare Finanzen für Selbstständige.', vo: 'Freikontor. Klare Finanzen für Selbstständige.' },
      { type: 'cta', dur: 3.8, title: 'Finanzcockpit 2026', vo: 'Das Finanzcockpit 2026.' },
    ],
  },
};
if (typeof module !== "undefined") module.exports = globalThis.STORYBOARDS;
