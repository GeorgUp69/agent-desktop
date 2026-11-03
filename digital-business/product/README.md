# Produkt: Freikontor Finanzcockpit 2026

| Edition | Inhalt | Paket |
|---|---|---|
| Basis (29 €) | Arbeitsmappe mit Start, Dashboard, Einnahmen, Ausgaben, EÜR, Umsatzsteuer, Steuerrücklage, Kleinunternehmer-Monitor und Monatsübersicht; 2 fiktive Beispieldateien; Handbuch (17 S.); Schnellstart | `release/Freikontor-Finanzcockpit-2026-Basis.zip` |
| PRO (49 €) | Alles aus Basis + Stundensatz- und Angebotsrechner, 12-Monats-Liquiditätsplan, Steuerfristen 2027 (Blatt und .ics), Checklisten-PDF (Gründung, Belege, Jahresabschluss, Wechsel zur Regelbesteuerung, Steuerbescheid) | `release/Freikontor-Finanzcockpit-2026-PRO.zip` |

## Neu bauen

```bash
cd product/build
python3 build_workbook.py ../dist          # Arbeitsmappen (openpyxl)
python3 -c "from deadlines import *; open('../dist/pro/Steuerfristen-2027.ics','w',newline='').write(to_ics(deadlines_2027()))"
python3 render_screens.py ../dist ../screenshots   # echte Ansichten via LibreOffice
node render_pdfs.js                         # Handbuch, Schnellstart, Checklisten (Playwright)
```

Danach die ZIPs in `release/` neu packen (siehe START-HERE.md) und nach `shop/storage/products/` kopieren.

## Tests

```bash
cd digital-business && python3 -m unittest discover -s product/tests -v
```

Die Tests bauen Arbeitsmappen, lassen LibreOffice alle Formeln neu berechnen und vergleichen die Ergebnisse mit einer unabhängigen Python-Implementierung (`build/taxcalc.py`): Tarif 2025/2026 an mehr als 600 Werten inklusive aller Zonengrenzen, EÜR-Gewinn, Steuerrücklage, § 13b, Stundensatz, Kleinunternehmer-Grenzfälle und Fristen.

## Neues Steuerjahr

1. In `build/params.py` die amtlichen Werte des neuen Jahres ergänzen (§ 32a EStG, Soli-Freigrenze).
2. Die Tests um bekannte Werte des neuen Jahres erweitern.
3. Version und Titel in `build_workbook.py` anpassen, dann neu bauen.
