# E-Mails

Alle E-Mails versendet der Shop automatisch. Die Vorlagen liegen in `shop/src/emails.js`, der Versand läuft über eine Warteschlange mit Wiederholungen (`shop/src/mailer.js`). `beispiele/` enthält echte Ausgaben aus einem simulierten Testlauf mit Testdaten, Platzhalter-Firma und Platzhalter-Domain.

| Datei | Auslöser | Empfänger |
|---|---|---|
| `order_confirmation-sofort.txt` | Zahlung bestätigt, Zustimmung zur sofortigen Bereitstellung | Kunde |
| `order_confirmation-nach-widerrufsfrist.txt` | Zahlung bestätigt, ohne Zustimmung (Download folgt nach 14 Tagen) | Kunde |
| (delivery) | 15 Tage nach Zahlung ohne Widerruf | Kunde |
| `access_link.txt` | „Meine Downloads“ | Kunde |
| `refund.txt` | Erstattung in Stripe | Kunde |
| `withdrawal_receipt.txt` | Widerrufsfunktion | Kunde |
| `newsletter_doi.txt` | Newsletter-Anmeldung (Double-Opt-in) | Interessent |
| `owner_sale.txt`, `owner_withdrawal.txt` | Verkauf, Widerruf (außerdem Kontaktanfrage, Zahlungsstreit) | Du (`OWNER_NOTIFY_EMAIL`) |

Die Bestellbestätigung erfüllt zugleich die Vertragsbestätigung auf einem dauerhaften Datenträger (§ 312f BGB): Bestelldaten, Anbieter, Bestätigung der Zustimmung zum vorzeitigen Beginn, AGB und Widerrufsbelehrung im Volltext.

Newsletter-Inhalte selbst (Kampagnen) versendet der Shop nicht. Exportiere die bestätigten Adressen im Dashboard (`/admin` → Newsletter CSV) in ein Newsletter-Tool mit AVV und baue jeden Abmeldelink dort ein.
