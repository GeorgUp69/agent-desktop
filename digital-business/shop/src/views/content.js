'use strict';

const FAQ = [
  ['Ersetzt das Finanzcockpit meine Steuerberatung?',
    'Nein. Das Finanzcockpit ist ein Werkzeug, mit dem du deine Zahlen organisierst und deine Steuerlast realistisch einschätzt. Es gibt keine Steuererklärung ab und ersetzt keine individuelle Beratung. Viele nutzen es, um vorbereitet zur Steuerberatung zu gehen und unterjährig die richtige Rücklage zu bilden.'],
  ['Wie genau ist die Steuerrücklage?',
    'Die Einkommensteuer wird nach dem amtlichen Tarif des § 32a EStG für 2025 bzw. 2026 berechnet, inklusive Splitting, Solidaritätszuschlag mit Freigrenze und Milderungszone, Kirchensteuer und Gewerbesteuer mit Anrechnung nach § 35 EStG. Wir haben die Formeln automatisiert gegen eine unabhängige Referenzrechnung geprüft. Vereinfacht sind u. a. Kinderfreibeträge, Verlustvorträge und gewerbesteuerliche Hinzurechnungen; die vollständige Liste steht im Handbuch. Das Ergebnis ist eine Schätzung auf Basis deiner Eingaben.'],
  ['Welche Programme brauche ich?',
    'Microsoft Excel (ab 2016 oder Microsoft 365), LibreOffice Calc (kostenlos) oder Google Sheets. Apple Numbers funktioniert eingeschränkt. Die Datei enthält keine Makros.'],
  ['Wo werden meine Finanzdaten gespeichert?',
    'Nur in deiner Datei auf deinem Gerät bzw. in deinem eigenen Cloud-Speicher. Das Finanzcockpit hat keine Internetverbindung und sendet nichts an uns oder Dritte.'],
  ['Ist das Finanzcockpit für Kleinunternehmer geeignet?',
    'Ja. Der Kleinunternehmer-Monitor prüft die seit 2025 geltenden Grenzen (25.000 € Vorjahr, 100.000 € laufendes Jahr, 25.000 € im Gründungsjahr) und zeigt die Rechnung, mit der eine Grenze überschritten wird. Außerdem erkennt das Cockpit Reverse-Charge-Rechnungen (z. B. Meta- oder Google-Werbung), für die auch Kleinunternehmer Umsatzsteuer abführen müssen.'],
  ['Funktioniert es auch bei Regelbesteuerung und Gewerbe?',
    'Ja. Du wählst Regel- oder Kleinunternehmerbesteuerung, Ist- oder Soll-Versteuerung sowie freiberuflich oder gewerblich. Das Blatt Umsatzsteuer bereitet die Voranmeldung pro Monat und Quartal vor.'],
  ['Kann ich meine Rechnungen damit schreiben?',
    'Das Finanzcockpit ist kein Rechnungsprogramm. Es ist dein Rechnungsausgangsbuch mit offenen Posten. Ab 2027/2028 müssen Rechnungen an Unternehmen in Deutschland schrittweise als E-Rechnung ausgestellt werden; dafür brauchst du ein geeignetes Programm. Das Cockpit funktioniert unabhängig davon, womit du Rechnungen erstellst.'],
  ['Was ist der Unterschied zwischen Basis und PRO?',
    'Basis enthält das komplette Finanzcockpit. PRO ergänzt einen Stundensatz- und Angebotsrechner, einen 12-Monats-Liquiditätsplan, die Steuerfristen 2027 als Kalenderdatei und Checklisten für Gründung, Belege, Jahresabschluss, Regelbesteuerung und Steuerbescheid. Ein Upgrade von Basis auf PRO ist jederzeit für die Differenz möglich.'],
  ['Wann bekomme ich den Download?',
    'Wenn du im Bestellprozess der sofortigen Bereitstellung zustimmst, in der Regel innerhalb weniger Minuten nach Zahlungseingang per E-Mail. Ohne diese Zustimmung behältst du dein 14-tägiges Widerrufsrecht und erhältst den Download automatisch nach Ablauf der Frist.'],
  ['Habe ich ein Widerrufsrecht?',
    'Als Verbraucher hast du ein 14-tägiges Widerrufsrecht. Es erlischt, wenn du ausdrücklich zustimmst, dass wir vor Ablauf der Frist mit der Bereitstellung beginnen, und bestätigst, dass dir der Verlust des Widerrufsrechts bekannt ist. Ob du zustimmst, entscheidest du selbst. Details in der Widerrufsbelehrung.'],
  ['Bekomme ich eine Rechnung?',
    'Ja. Den Link zu deiner Rechnung findest du in der Bestellbestätigung. Du kannst sie im Browser als PDF speichern.'],
  ['Wie bezahle ich?',
    'Über Stripe, mit den auf der Bezahlseite angezeigten Zahlungsarten, z. B. Kreditkarte, Apple Pay, Google Pay oder PayPal.'],
  ['Gibt es Updates für 2027?',
    'Die Ausgabe 2026 rechnet mit den Werten für 2025 und 2026. Sobald die amtlichen Werte für 2027 feststehen, erscheint eine neue Jahresausgabe. Fehlerkorrekturen der Ausgabe 2026 stellen wir kostenlos bereit.'],
];

const COMPARE = [
  ['Einnahmen & Ausgaben erfassen', 'yes', 'yes', 'yes'],
  ['Steuerrücklage nach echtem Tarif (inkl. Gehalt, Splitting, Soli, KiSt, GewSt)', 'no', 'je nach Anbieter', 'yes'],
  ['Kleinunternehmergrenzen seit 2025 inkl. Gründungsjahr', 'no', 'je nach Anbieter', 'yes'],
  ['Reverse Charge (§ 13b) für Kleinunternehmer', 'no', 'je nach Anbieter', 'yes'],
  ['Kosten', 'kostenlos', 'ca. 100–400 € pro Jahr (netto, Listenpreise 2026)', 'einmalig 29 € / 49 €'],
  ['Daten bleiben auf deinem Gerät', 'yes', 'no', 'yes'],
  ['Rechnungen schreiben, E-Rechnung, Bankanbindung, ELSTER-Übermittlung', 'no', 'yes', 'no'],
];

module.exports = { FAQ, COMPARE };
