'use strict';

const EDITIONS = {
  basis: {
    id: 'basis',
    name: 'Finanzcockpit 2026 Basis',
    priceCents: 2900,
    file: 'Freikontor-Finanzcockpit-2026-Basis.zip',
    fileLabel: 'Finanzcockpit 2026 Basis (ZIP: Excel-Arbeitsmappe, 2 Beispieldateien, Handbuch, Schnellstart)',
    summary: 'Einnahmen, Ausgaben, EÜR, Umsatzsteuer, Steuerrücklage und Kleinunternehmer-Monitor in einer Excel-Datei.',
    features: [
      'Steuerrücklage nach echtem Tarif 2025/2026 (ESt, Soli, KiSt, GewSt mit § 35-Anrechnung, Splitting)',
      'Kleinunternehmer-Monitor nach den Regeln seit 2025, inklusive der Rechnung, mit der die Grenze kippt',
      'Einnahmen mit offenen Posten und Überfällig-Status',
      'Ausgaben mit automatischer Vorsteuer, Bewirtung 70 %, Geschenke und Reverse Charge (§ 13b)',
      'EÜR-Jahresübersicht und Umsatzsteuer-Voranmeldung (Vorbereitung)',
      'Dashboard mit Monatsverlauf',
      '2 fiktive Beispieldateien, Handbuch (17 Seiten), Schnellstart',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Finanzcockpit 2026 PRO',
    priceCents: 4900,
    file: 'Freikontor-Finanzcockpit-2026-PRO.zip',
    fileLabel: 'Finanzcockpit 2026 PRO (ZIP: Excel-Arbeitsmappe, 2 Beispieldateien, Handbuch, Schnellstart, Checklisten, Fristenkalender)',
    summary: 'Alles aus Basis plus Stundensatz-, Angebots- und Liquiditätsplanung, Fristenkalender 2027 und Checklisten.',
    features: [
      'Alles aus Basis',
      'Stundensatz- und Angebotsrechner: Mindestpreis aus Wunsch-Netto, Steuern, Vorsorge und Auslastung',
      'Liquiditätsplan über 12 Monate mit Steuer-Vorauszahlungen und Umsatzsteuer',
      'Steuerfristen 2027 als Tabellenblatt und Kalenderdatei (.ics) mit Erinnerung',
      'Checklisten-PDF: Gründung, Belege, Jahresabschluss, Wechsel zur Regelbesteuerung, Steuerbescheid',
    ],
    recommended: true,
  },
  upgrade: {
    id: 'upgrade',
    name: 'Upgrade Basis → PRO',
    priceCents: 2000,
    file: 'Freikontor-Finanzcockpit-2026-PRO.zip',
    fileLabel: 'Finanzcockpit 2026 PRO (ZIP)',
    summary: 'Für Käuferinnen und Käufer der Basis-Edition: Sie zahlen nur die Differenz.',
    features: ['Alle PRO-Inhalte', 'Gültig mit Ihrer Basis-Bestellnummer und derselben E-Mail-Adresse'],
    requiresEdition: 'basis',
    hidden: true,
  },
};

function formatEuro(cents) {
  return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function vatInfo(business, grossCents) {
  if (business.vat_mode === 'regel') {
    const net = Math.round(grossCents / 1.19);
    return { rate: 0.19, netCents: net, vatCents: grossCents - net, label: 'inkl. 19 % USt.' };
  }
  return { rate: 0, netCents: grossCents, vatCents: 0, label: 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.' };
}

module.exports = { EDITIONS, formatEuro, vatInfo };
