# Internes Dashboard

Aufruf: `https://www.deine-domain.de/admin` (Benutzer `admin`, Passwort aus `ADMIN_PASSWORD`). Ohne Passwort ist das Dashboard deaktiviert (404).

`admin-dashboard-testdaten.png` zeigt das Dashboard mit simulierten Testbestellungen.

| Kennzahl | Quelle |
|---|---|
| Umsatz brutto/netto, bezahlte Bestellungen, Verkäufe je Edition | Bestellungen mit bestätigter Zahlung (Stripe-Webhook) |
| Checkout-Starts | Bestellungen, die die Kasse abgeschickt haben |
| Conversion | bezahlte Bestellungen ÷ Aufrufe von Start- und Produktseite (serverseitige Zählung ohne Cookies, Bots ausgefiltert) |
| Erstattungen | Stripe-Event `charge.refunded` |
| Stripe-Gebühren | Pro Zahlung aus der Stripe-Balance-Transaction übernommen (Gebühren erstatteter Zahlungen werden nicht mitgezählt) |
| Werbekosten | Manuelle Eingabe im Dashboard (TikTok-, Meta-, Pinterest-, Google-Abrechnungen) |
| Geschätzter Gewinn | Umsatz netto − Stripe-Gebühren − Werbekosten (ohne Fixkosten und Ertragsteuern) |

Außerdem: letzte Bestellungen mit Status, Rechnungsnummer, Sofort-Zustimmung und Land; Widerrufe; Kontaktanfragen; E-Mail-Probleme; Warnungen und Fehler aus dem Ereignisprotokoll; CSV-Export (Semikolon, UTF-8 mit BOM, Excel-tauglich, gegen Formel-Injection geschützt).
