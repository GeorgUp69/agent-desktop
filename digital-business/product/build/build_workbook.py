"""Erzeugt das Freikontor Finanzcockpit (Basis und Pro) als .xlsx.

Aufruf: python3 build_workbook.py <ausgabeordner>
Die Formeln vermeiden dynamische Arrays, LET, LAMBDA und XLOOKUP, damit die
Datei in Excel 2016+, Microsoft 365, LibreOffice und Google Sheets rechnet.
"""
import sys
from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.protection import SheetProtection

from params import COMMON, TAX_PARAMS
from sample_data import SAMPLES

VERSION = "2026.1"
YEARS = sorted(TAX_PARAMS)

INK = "14213D"
GREEN = "1F6F5C"
GREEN_LIGHT = "E4F1EC"
BRASS = "C8A24A"
PAPER = "F7F5F0"
INPUT = "FFF8E1"
GREY = "6B7280"
LINE = "D9D6CE"
RED_BG = "FDE8E8"
RED = "9B1C1C"
AMBER_BG = "FEF3C7"
OK_BG = "DEF7EC"

FONT = "Calibri"
EUR = '#,##0.00 "€";[Red]-#,##0.00 "€"'
EUR0 = '#,##0 "€";[Red]-#,##0 "€"'
PCT = "0.0%"
DATE = "DD.MM.YYYY"

EIN_FIRST, EIN_LAST = 5, 604
AUS_FIRST, AUS_LAST = 5, 1004

CAT_UMSATZ = "Umsatzerlöse"
CAT_AUSLAND = "Umsatzerlöse ohne deutsche USt (Ausland / Reverse Charge)"
CAT_ERSTATTUNG = "Umsatzsteuer-Erstattung vom Finanzamt"
CAT_SONST_E = "Sonstige Betriebseinnahme (z. B. Verkauf Anlagegut)"
EIN_CATS = [CAT_UMSATZ, CAT_AUSLAND, CAT_SONST_E, CAT_ERSTATTUNG]

CAT_BEWIRTUNG = "Bewirtung (70 % abzugsfähig)"
CAT_GESCHENK = "Geschenke über 50 € (nicht abzugsfähig)"
CAT_UST = "Umsatzsteuer-Zahlung an das Finanzamt"
AUS_CATS = [
    "Wareneinkauf / Material",
    "Fremdleistungen / Subunternehmer",
    "Personalkosten",
    "Geringwertige Wirtschaftsgüter (bis 800 € netto)",
    "Abschreibung (AfA, Jahresbetrag)",
    "Miete / Raumkosten",
    "Homeoffice-Pauschale",
    "Telefon & Internet",
    "Software, Lizenzen & Cloud",
    "Büromaterial & Porto",
    "Fortbildung & Fachliteratur",
    "Werbung & Marketing",
    "Reisekosten",
    "Fahrzeugkosten",
    CAT_BEWIRTUNG,
    "Geschenke bis 50 €",
    CAT_GESCHENK,
    "Versicherungen (betrieblich)",
    "Beratung & Steuerberatung",
    "Kontoführung & Zahlungsgebühren",
    "Beiträge (Kammer, Verbände)",
    "Sonstige Betriebsausgaben",
    CAT_UST,
]

USTSTATUS = ["Kleinunternehmer (§ 19 UStG)", "Regelbesteuerung"]
VERSTEUERUNG = ["Ist-Versteuerung (nach Zahlungseingang)", "Soll-Versteuerung (nach Rechnungsdatum)"]
TAETIGKEIT = ["Freiberuflich (keine Gewerbesteuer)", "Gewerblich (Gewerbesteuer)"]
VERANLAGUNG = ["Einzelveranlagung", "Zusammenveranlagung (Splitting)"]
KIRCHE = ["keine", "8 %", "9 %"]
JANEIN = ["Ja", "Nein"]
MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
          "September", "Oktober", "November", "Dezember"]

thin = Side(style="thin", color=LINE)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
BOTTOM = Border(bottom=Side(style="medium", color=GREEN))


def fill(color):
    return PatternFill("solid", start_color=color, end_color=color)


def font(size=11, bold=False, color=INK, italic=False):
    return Font(name=FONT, size=size, bold=bold, color=color, italic=italic)


def name(wb, key, ref):
    wb.defined_names[key] = DefinedName(key, attr_text=ref)


def title(ws, text, sub=None):
    ws.sheet_view.showGridLines = False
    ws["B1"] = text
    ws["B1"].font = font(20, True, INK)
    ws.row_dimensions[1].height = 34
    if sub:
        ws["B2"] = sub
        ws["B2"].font = font(10, False, GREY, True)
    ws.column_dimensions["A"].width = 2


def section(ws, cell, text):
    ws[cell] = text
    ws[cell].font = font(13, True, GREEN)
    ws[cell].border = BOTTOM


def header_row(ws, row, headers, first_col=1):
    for i, h in enumerate(headers):
        c = ws.cell(row=row, column=first_col + i, value=h)
        c.font = font(10, True, "FFFFFF")
        c.fill = fill(INK)
        c.alignment = Alignment(wrap_text=True, vertical="center")
        c.border = BORDER
    ws.row_dimensions[row].height = 32


def input_cell(c, fmt=None):
    c.fill = fill(INPUT)
    c.border = BORDER
    c.font = font(11)
    c.protection = Protection(locked=False)
    if fmt:
        c.number_format = fmt


def calc_cell(c, fmt=None, bold=False):
    c.border = BORDER
    c.font = font(11, bold)
    if fmt:
        c.number_format = fmt


def protect(ws):
    ws.protection = SheetProtection(sheet=True, objects=True, scenarios=True,
                                    formatCells=False, formatColumns=False, formatRows=False,
                                    autoFilter=False, sort=True, selectLockedCells=False,
                                    selectUnlockedCells=False)


def dv_list(ws, ref_name, rng, prompt=None):
    dv = DataValidation(type="list", formula1=f"={ref_name}", allow_blank=True)
    dv.error = "Bitte einen Wert aus der Liste wählen."
    dv.errorTitle = "Ungültiger Wert"
    if prompt:
        dv.prompt = prompt
        dv.showInputMessage = True
    ws.add_data_validation(dv)
    dv.add(rng)


def tarif_formula(x):
    """§ 32a Abs. 1 EStG für ein bereits auf volle Euro abgerundetes x."""
    return (
        f"IF({x}<=P_GFB,0,IF({x}<=P_Z2,ROUNDDOWN((P_A2*({x}-P_GFB)/10000+P_B2)*({x}-P_GFB)/10000,0),"
        f"IF({x}<=P_Z3,ROUNDDOWN((P_A3*({x}-P_Z2)/10000+P_B3)*({x}-P_Z2)/10000+P_C3,0),"
        f"IF({x}<=P_Z4,ROUNDDOWN(0.42*{x}-P_C4,0),ROUNDDOWN(0.45*{x}-P_C5,0)))))"
    )


# ----------------------------------------------------------------- Kategorien
def build_lists(wb):
    ws = wb.create_sheet("Listen")
    title(ws, "Auswahllisten", "Diese Listen speisen die Dropdowns. Eigene Ausgabenkategorien können unten ergänzt werden.")
    ws.column_dimensions["B"].width = 58
    ws.column_dimensions["C"].width = 14
    ws.column_dimensions["D"].width = 42
    lists = [
        ("L_EinnKat", "Einnahmenkategorien", EIN_CATS),
        ("L_AusgKat", "Ausgabenkategorien", AUS_CATS + [""] * 5),
        ("L_USt", "USt-Sätze", [0.19, 0.07, 0]),
        ("L_UStStatus", "Umsatzsteuer-Status", USTSTATUS),
        ("L_Versteuerung", "Versteuerungsart", VERSTEUERUNG),
        ("L_Taetigkeit", "Tätigkeit", TAETIGKEIT),
        ("L_Veranlagung", "Veranlagung", VERANLAGUNG),
        ("L_Kirche", "Kirchensteuer", KIRCHE),
        ("L_JaNein", "Ja / Nein", JANEIN),
        ("L_Jahre", "Steuerjahre", YEARS),
        ("L_Ja", "Reverse Charge", ["Ja"]),
    ]
    row = 4
    for key, label, values in lists:
        section(ws, f"B{row}", label)
        start = row + 1
        for i, v in enumerate(values):
            c = ws.cell(row=start + i, column=2, value=v if v != "" else None)
            c.border = BORDER
            if isinstance(v, float) or v == 0 and key == "L_USt":
                c.number_format = "0%"
            if key == "L_AusgKat" and v == "":
                input_cell(c)
        end = start + len(values) - 1
        name(wb, key, f"Listen!$B${start}:$B${end}")
        row = end + 2
    ws["D5"] = "Hinweis: Die Kategorien orientieren sich an der Gliederung der Anlage EÜR, ersetzen aber nicht die Zuordnung im amtlichen Formular."
    ws["D5"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["D5"].font = font(10, False, GREY, True)
    ws.merge_cells("D5:D9")
    protect(ws)
    ws.sheet_state = "visible"
    return ws


# ---------------------------------------------------------------- Parameter
def build_params(wb):
    ws = wb.create_sheet("Parameter")
    title(ws, "Steuerparameter", "Amtliche Werte je Veranlagungsjahr. Spalte F zeigt die Werte des gewählten Steuerjahres.")
    ws.column_dimensions["B"].width = 50
    for col in "CDEF":
        ws.column_dimensions[col].width = 15
    ws.column_dimensions["G"].width = 60
    header_row(ws, 4, ["Parameter"] + [str(y) for y in YEARS] + ["", "Aktiv"], first_col=2)
    for i, y in enumerate(YEARS):
        ws.cell(row=4, column=3 + i, value=y)
    rows = [
        ("P_GFB", "Grundfreibetrag (§ 32a Abs. 1 Nr. 1 EStG)", "gfb", EUR0),
        ("P_Z2", "Ende 1. Progressionszone", "z2", EUR0),
        ("P_A2", "Faktor 1. Progressionszone", "a2", "0.00"),
        ("P_B2", "Konstante 1. Progressionszone", "b2", "0"),
        ("P_Z3", "Ende 2. Progressionszone", "z3", EUR0),
        ("P_A3", "Faktor 2. Progressionszone", "a3", "0.00"),
        ("P_B3", "Konstante 2. Progressionszone", "b3", "0"),
        ("P_C3", "Sockel 2. Progressionszone", "c3", "0.00"),
        ("P_Z4", "Ende 42-%-Zone", "z4", EUR0),
        ("P_C4", "Abzug 42-%-Zone", "c4", "0.00"),
        ("P_C5", "Abzug 45-%-Zone", "c5", "0.00"),
        ("P_SOLI_FG", "Soli-Freigrenze Einzelveranlagung (§ 3 Abs. 3 SolzG)", "soli_fg", EUR0),
    ]
    common_rows = [
        ("P_SOLI_SATZ", "Solidaritätszuschlag-Satz (§ 4 SolzG)", "soli_satz", "0.0%"),
        ("P_SOLI_MILD", "Milderungszone (§ 4 Satz 2 SolzG)", "soli_mild", "0.0%"),
        ("P_GEW_FB", "Gewerbesteuer-Freibetrag (§ 11 Abs. 1 GewStG)", "gew_fb", EUR0),
        ("P_GEW_MZ", "Steuermesszahl (§ 11 Abs. 2 GewStG)", "gew_mz", "0.0%"),
        ("P_GEW_FAKTOR", "Anrechnungsfaktor (§ 35 EStG)", "gew_faktor", "0.0"),
        ("P_KU_VJ", "Kleinunternehmer: Grenze Vorjahr (§ 19 UStG)", "ku_vj", EUR0),
        ("P_KU_LJ", "Kleinunternehmer: Grenze laufendes Jahr (§ 19 UStG)", "ku_lj", EUR0),
    ]
    yr = f"$C$4:${chr(ord('C') + len(YEARS) - 1)}$4"
    r = 5
    for key, label, k, fmt in rows + common_rows:
        ws.cell(row=r, column=2, value=label).border = BORDER
        for i, y in enumerate(YEARS):
            v = TAX_PARAMS[y][k] if k in TAX_PARAMS[y] else COMMON[k]
            c = ws.cell(row=r, column=3 + i, value=v)
            calc_cell(c, fmt)
        last = chr(ord("C") + len(YEARS) - 1)
        c = ws.cell(row=r, column=6, value=f"=INDEX($C{r}:${last}{r},1,MATCH(S_Jahr,{yr},0))")
        calc_cell(c, fmt, True)
        c.fill = fill(GREEN_LIGHT)
        name(wb, key, f"Parameter!$F${r}")
        r += 1
    ws.cell(row=5, column=7, value="Quellen: § 32a EStG in der für das jeweilige Jahr geltenden Fassung "
            "(BMF Lohnsteuer-Handbuch 2026), § 3, § 4 SolzG, § 11 GewStG, § 35 EStG, § 19 UStG. "
            "Neue Jahreswerte kommen als Update. Werte hier nur ändern, wenn Sie wissen, was Sie tun.")
    ws["G5"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["G5"].font = font(10, False, GREY, True)
    ws.merge_cells("G5:G12")

    r += 1
    section(ws, f"B{r}", "Interne Schalter (automatisch)")
    r += 1
    flags = [
        ("F_KU", "Kleinunternehmer?", '=Start!$C$7="' + USTSTATUS[0] + '"'),
        ("F_IST", "Ist-Versteuerung?", '=Start!$C$8="' + VERSTEUERUNG[0] + '"'),
        ("F_GEW", "Gewerblich?", '=Start!$C$9="' + TAETIGKEIT[1] + '"'),
        ("F_GRUEND", "Gründungsjahr?", '=Start!$C$11="Ja"'),
        ("F_SPLIT", "Splitting?", '=Start!$C$15="' + VERANLAGUNG[1] + '"'),
        ("F_KIST", "Kirchensteuersatz", '=IF(Start!$C$16="9 %",0.09,IF(Start!$C$16="8 %",0.08,0))'),
        ("F_HOCH", "Hochrechnung?", '=Start!$C$20<>"Nein"'),
        ("F_MONATE", "Monate für Hochrechnung",
         f'=IF(N(Start!$C$21)>0,MIN(12,Start!$C$21),MAX(1,MAX(Einnahmen!$O${EIN_FIRST}:$O${EIN_LAST}),'
         f'MAX(Ausgaben!$O${AUS_FIRST}:$O${AUS_LAST})))'),
        ("F_KULIMIT", "Maßgebliche KU-Grenze laufendes Jahr", "=IF(F_GRUEND,P_KU_VJ,P_KU_LJ)"),
        ("F_HEBESATZ", "Hebesatz", "=N(Start!$C$10)"),
    ]
    for key, label, f in flags:
        ws.cell(row=r, column=2, value=label).border = BORDER
        c = ws.cell(row=r, column=6, value=f)
        calc_cell(c)
        name(wb, key, f"Parameter!$F${r}")
        r += 1
    protect(ws)
    return ws


# --------------------------------------------------------------------- Start
def build_start(wb, edition):
    ws = wb.active
    ws.title = "Start"
    title(ws, "Freikontor Finanzcockpit 2026" + (" PRO" if edition == "pro" else ""),
          f"Version {VERSION} · Einnahmen, Ausgaben, EÜR, Umsatzsteuer, Steuerrücklage und Kleinunternehmer-Monitor")
    ws.column_dimensions["B"].width = 52
    ws.column_dimensions["C"].width = 40
    ws.column_dimensions["D"].width = 70
    ws.sheet_properties.tabColor = GREEN

    section(ws, "B4", "1  Grundeinstellungen")
    settings = [
        (5, "Steuerjahr", 2026, "L_Jahre", "0", "Für dieses Jahr werden alle Auswertungen berechnet."),
        (6, "Name / Firma (optional)", None, None, None, "Erscheint nur in dieser Datei."),
        (7, "Umsatzsteuer-Status", USTSTATUS[0], "L_UStStatus", None,
         "Kleinunternehmer weisen keine USt aus und ziehen keine Vorsteuer ab."),
        (8, "Versteuerungsart (nur bei Regelbesteuerung)", VERSTEUERUNG[0], "L_Versteuerung", None,
         "Ist-Versteuerung muss beim Finanzamt beantragt sein (§ 20 UStG)."),
        (9, "Tätigkeit", TAETIGKEIT[0], "L_Taetigkeit", None,
         "Freie Berufe (§ 18 EStG) zahlen keine Gewerbesteuer. Im Zweifel: Steuerberatung."),
        (10, "Gewerbesteuer-Hebesatz Ihrer Gemeinde", 4.0, None, "0%", "Nur bei gewerblicher Tätigkeit. Mindestens 200 %."),
        (11, "Tätigkeit in diesem Jahr aufgenommen?", "Nein", "L_JaNein", None,
         "Im Gründungsjahr gilt die 25.000-€-Grenze (Verwaltungsauffassung, Abschn. 19.1 UStAE)."),
        (12, "Gesamtumsatz im Vorjahr (netto)", 0, None, EUR, "Maßgeblich für die Kleinunternehmerregelung."),
    ]
    section(ws, "B14", "2  Angaben für die Steuerrücklage")
    settings += [
        (15, "Veranlagung", VERANLAGUNG[0], "L_Veranlagung", None,
         "Bei Zusammenveranlagung das zu versteuernde Einkommen des Partners in Zeile 17 ergänzen."),
        (16, "Kirchensteuer", "keine", "L_Kirche", None, "8 % in Bayern und Baden-Württemberg, sonst 9 %."),
        (17, "Andere Einkünfte im Jahr (z. B. Gehalt nach Werbungskosten)", 0, None, EUR,
         "Jahresbetrag. Bei Angestellten: Bruttolohn minus Werbungskosten (mind. Pauschbetrag)."),
        (18, "Sonderausgaben & Vorsorgeaufwendungen (geschätzt)", 0, None, EUR,
         "Jahresbetrag, z. B. Kranken-/Pflegeversicherung, Altersvorsorge."),
        (19, "Bereits gezahlte Steuer-Vorauszahlungen (ESt, Soli, KiSt, GewSt)", 0, None, EUR,
         "Summe der in diesem Jahr gezahlten Vorauszahlungen für dieses Jahr."),
        (20, "Gewinn auf das Jahr hochrechnen?", "Ja", "L_JaNein", None,
         "Ja: Gewinn bisher ÷ Monate × 12. Nein: nur der bisherige Gewinn."),
        (21, "Monate für die Hochrechnung (leer = automatisch)", None, None, "0",
         "Automatisch = letzter Monat mit Buchungen."),
        (22, "Aktueller Stand Ihres Rücklagekontos", 0, None, EUR,
         "Für den Abgleich Soll-Rücklage gegen Ist-Rücklage."),
    ]
    for row, label, default, lst, fmt, hint in settings:
        ws.cell(row=row, column=2, value=label).font = font(11)
        c = ws.cell(row=row, column=3, value=default)
        input_cell(c, fmt)
        if lst:
            dv_list(ws, lst, f"C{row}")
        h = ws.cell(row=row, column=4, value=hint)
        h.font = font(10, False, GREY)
        h.alignment = Alignment(wrap_text=True, vertical="center")
    name(wb, "S_Jahr", "Start!$C$5")

    section(ws, "B24", "3  So arbeiten Sie mit dem Cockpit")
    steps = [
        "1. Gelbe Felder sind Eingabefelder. Alle anderen Felder rechnen automatisch.",
        "2. Tragen Sie jede Rechnung im Blatt „Einnahmen“ ein. Sobald das Geld da ist, das Zahlungsdatum ergänzen.",
        "3. Tragen Sie jeden Beleg im Blatt „Ausgaben“ ein: Bruttobetrag laut Beleg, USt-Satz, Kategorie.",
        "4. Zahlungen an das Finanzamt (Umsatzsteuer) als Ausgabe mit Kategorie „Umsatzsteuer-Zahlung an das Finanzamt“ erfassen.",
        "5. Das „Dashboard“ zeigt Gewinn, offene Rechnungen und Ihre Soll-Rücklage auf einen Blick.",
        "6. Einmal im Monat: Soll-Rücklage mit dem Rücklagekonto abgleichen (Zeile 22).",
        "Das ausführliche Handbuch liegt als PDF bei.",
    ]
    for i, s in enumerate(steps):
        c = ws.cell(row=25 + i, column=2, value=s)
        c.font = font(11)
        ws.merge_cells(start_row=25 + i, start_column=2, end_row=25 + i, end_column=4)

    section(ws, "B33", "Wichtiger Hinweis")
    note = ("Das Finanzcockpit ist ein Werkzeug zur eigenen Organisation und Schätzung. Es ersetzt keine Steuerberatung "
            "und keine Steuererklärung. Die Rücklage ist eine Schätzung nach § 32a EStG, SolzG und GewStG mit "
            "vereinfachenden Annahmen (siehe Handbuch, Kapitel „Grenzen der Berechnung“). Maßgeblich ist allein der "
            "Steuerbescheid. Prüfen Sie wichtige Entscheidungen mit einer Steuerberaterin oder einem Steuerberater.")
    c = ws.cell(row=34, column=2, value=note)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    c.font = font(10, False, GREY)
    ws.merge_cells("B34:D37")
    ws.row_dimensions[34].height = 22
    protect(ws)
    ws.freeze_panes = "A4"
    return ws


# ----------------------------------------------------------------- Einnahmen
def build_income(wb):
    ws = wb.create_sheet("Einnahmen")
    title(ws, "Einnahmen & Rechnungsausgang",
          "Eine Zeile pro Rechnung. Zahlungsdatum ergänzen, sobald das Geld eingegangen ist (Zuflussprinzip).")
    headers = ["Rechnungs-\ndatum", "Rechnungs-Nr.", "Kunde", "Leistung", "Kategorie", "Netto €", "USt-Satz",
               "USt €", "Brutto €", "Zahlungs-\neingang", "Zahlungsziel\n(Tage, leer=14)", "Fällig am", "Status",
               "Zufluss-Jahr", "Zufluss-Monat", "USt-Datum", "USt-Jahr", "USt-Monat", "KU-Umsatz",
               "KU kumuliert", "KU-Grenze"]
    header_row(ws, 4, headers)
    widths = [12, 14, 24, 30, 30, 13, 9, 12, 13, 12, 12, 12, 22, 8, 8, 10, 8, 8, 11, 12, 18]
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    for col in "NOPQRSTU":
        ws.column_dimensions[col].hidden = True
    F, L = EIN_FIRST, EIN_LAST
    for r in range(F, L + 1):
        for col, fmt in (("A", DATE), ("B", None), ("C", None), ("D", None), ("E", None), ("F", EUR),
                         ("G", "0%"), ("J", DATE), ("K", "0")):
            input_cell(ws[f"{col}{r}"], fmt)
        ws[f"H{r}"] = f'=IF(F{r}="","",IF(F_KU,0,ROUND(F{r}*N(G{r}),2)))'
        ws[f"I{r}"] = f'=IF(F{r}="","",F{r}+H{r})'
        ws[f"L{r}"] = f'=IF(A{r}="","",A{r}+IF(K{r}="",14,K{r}))'
        ws[f"M{r}"] = (f'=IF(F{r}="","",IF(AND(NOT(F_KU),G{r}="",E{r}="{CAT_UMSATZ}"),"USt-Satz fehlt",'
                       f'IF(J{r}<>"","Bezahlt",IF(L{r}="","Offen",IF(TODAY()>L{r},"Überfällig ("&(TODAY()-L{r})&" Tage)","Offen")))))')
        ws[f"N{r}"] = f'=IF(J{r}="","",YEAR(J{r}))'
        ws[f"O{r}"] = f'=IF(N{r}=S_Jahr,MONTH(J{r}),"")'
        ws[f"P{r}"] = f'=IF(F_IST,IF(J{r}="","",J{r}),IF(A{r}="","",A{r}))'
        ws[f"Q{r}"] = f'=IF(P{r}="","",YEAR(P{r}))'
        ws[f"R{r}"] = f'=IF(Q{r}=S_Jahr,MONTH(P{r}),"")'
        ws[f"S{r}"] = f'=IF(AND(E{r}="{CAT_UMSATZ}",N{r}=S_Jahr),N(F{r}),0)'
        ws[f"T{r}"] = f'=IF(S{r}=0,"",SUMIFS($S${F}:$S${L},$J${F}:$J${L},"<="&J{r}))'
        ws[f"U{r}"] = f'=IF(T{r}="","",IF(AND(T{r}>F_KULIMIT,T{r}-S{r}<=F_KULIMIT),"Grenze überschritten",""))'
        for col, fmt in (("H", EUR), ("I", EUR), ("L", DATE), ("M", None)):
            calc_cell(ws[f"{col}{r}"], fmt)
        for col in "NOPQRSTU":
            ws[f"{col}{r}"].font = font(9, False, GREY)
        ws[f"P{r}"].number_format = DATE
    dv_list(ws, "L_EinnKat", f"E{F}:E{L}")
    dv_list(ws, "L_USt", f"G{F}:G{L}")
    dvd = DataValidation(type="date", operator="between", formula1="DATE(2000,1,1)", formula2="DATE(2100,12,31)",
                         allow_blank=True)
    dvd.error = "Bitte ein gültiges Datum eingeben (TT.MM.JJJJ)."
    ws.add_data_validation(dvd)
    dvd.add(f"A{F}:A{L}")
    dvd.add(f"J{F}:J{L}")
    ws.conditional_formatting.add(f"M{F}:M{L}", FormulaRule(formula=[f'LEFT($M{F},10)="Überfällig"'],
                                                            fill=fill(RED_BG), font=Font(color=RED, bold=True)))
    ws.conditional_formatting.add(f"M{F}:M{L}", FormulaRule(formula=[f'$M{F}="Bezahlt"'], fill=fill(OK_BG)))
    ws.conditional_formatting.add(f"M{F}:M{L}", FormulaRule(formula=[f'OR($M{F}="Offen",$M{F}="USt-Satz fehlt")'],
                                                            fill=fill(AMBER_BG)))
    ws.conditional_formatting.add(f"A{F}:M{L}", FormulaRule(formula=[f'$U{F}="Grenze überschritten"'],
                                                            fill=fill(RED_BG)))
    ws["E3"] = "Summe offen:"
    ws["E3"].alignment = Alignment(horizontal="right")
    ws["F3"] = f'=SUMIFS(I{F}:I{L},J{F}:J{L},"",F{F}:F{L},"<>")'
    ws["F3"].number_format = EUR
    ws["F3"].font = font(11, True)
    ws.freeze_panes = f"B{F}"
    ws.auto_filter.ref = f"A4:M{L}"
    protect(ws)
    return ws


# ------------------------------------------------------------------ Ausgaben
def build_expenses(wb):
    ws = wb.create_sheet("Ausgaben")
    title(ws, "Ausgaben & Belege",
          "Eine Zeile pro Beleg. Bruttobetrag laut Beleg eintragen. Vorsteuer und Nettobetrag rechnen automatisch.")
    headers = ["Datum", "Beleg-Nr.", "Lieferant", "Beschreibung", "Kategorie", "Brutto €\n(laut Beleg)",
               "USt-Satz", "Reverse\nCharge\n§ 13b", "Notiz", "Vorsteuer €", "Netto €", "Abzugs-\nfähig",
               "EÜR-Betrag €", "Jahr", "Monat", "§ 13b Netto", "§ 13b USt"]
    header_row(ws, 4, headers)
    ws.row_dimensions[4].height = 44
    widths = [12, 12, 22, 30, 36, 13, 9, 9, 22, 12, 12, 9, 13, 8, 8, 11, 11]
    for i, w in enumerate(widths):
        ws.column_dimensions[chr(65 + i)].width = w
    for col in "NOPQ":
        ws.column_dimensions[col].hidden = True
    F, L = AUS_FIRST, AUS_LAST
    for r in range(F, L + 1):
        for col, fmt in (("A", DATE), ("B", None), ("C", None), ("D", None), ("E", None), ("F", EUR),
                         ("G", "0%"), ("H", None), ("I", None)):
            input_cell(ws[f"{col}{r}"], fmt)
        ws[f"J{r}"] = (f'=IF(F{r}="","",IF(OR(F_KU,G{r}="",H{r}="Ja",E{r}="{CAT_UST}",E{r}="{CAT_GESCHENK}"),0,'
                       f'ROUND(F{r}-F{r}/(1+G{r}),2)))')
        ws[f"K{r}"] = f'=IF(F{r}="","",F{r}-J{r})'
        ws[f"L{r}"] = f'=IF(F{r}="","",IF(E{r}="{CAT_BEWIRTUNG}",0.7,IF(E{r}="{CAT_GESCHENK}",0,1)))'
        ws[f"M{r}"] = f'=IF(F{r}="","",ROUND(K{r}*L{r},2))'
        ws[f"N{r}"] = f'=IF(A{r}="","",YEAR(A{r}))'
        ws[f"O{r}"] = f'=IF(N{r}=S_Jahr,MONTH(A{r}),"")'
        ws[f"P{r}"] = f'=IF(AND(H{r}="Ja",N{r}=S_Jahr),N(K{r}),0)'
        ws[f"Q{r}"] = f'=ROUND(P{r}*0.19,2)'
        for col, fmt in (("J", EUR), ("K", EUR), ("L", "0%"), ("M", EUR)):
            calc_cell(ws[f"{col}{r}"], fmt)
        for col in "NOPQ":
            ws[f"{col}{r}"].font = font(9, False, GREY)
    dv_list(ws, "L_AusgKat", f"E{F}:E{L}")
    dv_list(ws, "L_USt", f"G{F}:G{L}")
    dv_list(ws, "L_Ja", f"H{F}:H{L}",
            "„Ja“ bei Rechnungen ausländischer Anbieter ohne USt, z. B. Meta, Google Ads (Irland).")
    dvd = DataValidation(type="date", operator="between", formula1="DATE(2000,1,1)", formula2="DATE(2100,12,31)",
                         allow_blank=True)
    ws.add_data_validation(dvd)
    dvd.add(f"A{F}:A{L}")
    ws.conditional_formatting.add(f"A{F}:M{L}", FormulaRule(formula=[f'AND($F{F}<>"",$E{F}="")'],
                                                            fill=fill(AMBER_BG)))
    ws["L3"] = "Summe Jahr:"
    ws["L3"].alignment = Alignment(horizontal="right")
    ws["M3"] = f'=SUMIFS(M{F}:M{L},N{F}:N{L},S_Jahr)'
    ws["M3"].number_format = EUR
    ws["M3"].font = font(11, True)
    ws.freeze_panes = f"B{F}"
    ws.auto_filter.ref = f"A4:M{L}"
    protect(ws)
    return ws


def ein(col):
    return f"Einnahmen!${col}${EIN_FIRST}:${col}${EIN_LAST}"


def aus(col):
    return f"Ausgaben!${col}${AUS_FIRST}:${col}${AUS_LAST}"


# ----------------------------------------------------------------------- EÜR
def build_euer(wb):
    ws = wb.create_sheet("EÜR")
    title(ws, "Einnahmen-Überschuss-Rechnung", "Jahresübersicht nach Zufluss- und Abflussprinzip (§ 4 Abs. 3, § 11 EStG).")
    ws.column_dimensions["B"].width = 58
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 60
    ws["B3"] = '="Steuerjahr "&S_Jahr'
    ws["B3"].font = font(11, True, GREEN)
    section(ws, "B5", "Betriebseinnahmen")
    r = 6
    first_e = r
    for cat in [CAT_UMSATZ, CAT_AUSLAND, CAT_SONST_E]:
        ws.cell(row=r, column=2, value=cat).border = BORDER
        c = ws.cell(row=r, column=3, value=f'=SUMIFS({ein("F")},{ein("E")},"{cat}",{ein("N")},S_Jahr)')
        calc_cell(c, EUR)
        r += 1
    ws.cell(row=r, column=2, value="Vereinnahmte Umsatzsteuer").border = BORDER
    calc_cell(ws.cell(row=r, column=3, value=f'=SUMIFS({ein("H")},{ein("N")},S_Jahr)'), EUR)
    r += 1
    ws.cell(row=r, column=2, value=CAT_ERSTATTUNG).border = BORDER
    calc_cell(ws.cell(row=r, column=3, value=f'=SUMIFS({ein("F")},{ein("E")},"{CAT_ERSTATTUNG}",{ein("N")},S_Jahr)'), EUR)
    last_e = r
    r += 1
    ws.cell(row=r, column=2, value="Summe Betriebseinnahmen").font = font(11, True)
    calc_cell(ws.cell(row=r, column=3, value=f"=SUM(C{first_e}:C{last_e})"), EUR, True)
    sum_e = r
    r += 2
    section(ws, f"B{r}", "Betriebsausgaben")
    r += 1
    first_a = r
    for cat in AUS_CATS:
        ws.cell(row=r, column=2, value=cat).border = BORDER
        c = ws.cell(row=r, column=3, value=f'=SUMIFS({aus("M")},{aus("E")},"{cat}",{aus("N")},S_Jahr)')
        calc_cell(c, EUR)
        r += 1
    ws.cell(row=r, column=2, value="Eigene Kategorien (Listen, Zeilen am Ende)").border = BORDER
    known = "+".join(f'SUMIFS({aus("M")},{aus("E")},"{c}",{aus("N")},S_Jahr)' for c in AUS_CATS)
    calc_cell(ws.cell(row=r, column=3,
                      value=f'=SUMIFS({aus("M")},{aus("N")},S_Jahr,{aus("E")},"<>")-({known})'), EUR)
    r += 1
    ws.cell(row=r, column=2, value="Gezahlte Vorsteuer").border = BORDER
    calc_cell(ws.cell(row=r, column=3, value=f'=SUMIFS({aus("J")},{aus("N")},S_Jahr)'), EUR)
    last_a = r
    r += 1
    ws.cell(row=r, column=2, value="Summe Betriebsausgaben").font = font(11, True)
    calc_cell(ws.cell(row=r, column=3, value=f"=SUM(C{first_a}:C{last_a})"), EUR, True)
    sum_a = r
    r += 2
    ws.cell(row=r, column=2, value="Gewinn / Verlust laut EÜR").font = font(13, True, GREEN)
    c = ws.cell(row=r, column=3, value=f"=C{sum_e}-C{sum_a}")
    calc_cell(c, EUR, True)
    c.fill = fill(GREEN_LIGHT)
    name(wb, "R_GewinnEUER", f"EÜR!$C${r}")
    r += 1
    ws.cell(row=r, column=2, value="Gewinn operativ (ohne Umsatzsteuer-Bewegungen)").font = font(11, True)
    ust_cat_row = first_a + AUS_CATS.index(CAT_UST)
    c = ws.cell(row=r, column=3, value=f"=C{first_e}+C{first_e+1}+C{first_e+2}-(C{sum_a}-C{last_a}-C{ust_cat_row})")
    calc_cell(c, EUR, True)
    name(wb, "R_GewinnOp", f"EÜR!$C${r}")
    d = ws.cell(row=r, column=4, value="Grundlage der Steuerrücklage. Umsatzsteuer ist ein durchlaufender Posten "
                "und gleicht sich übers Jahr aus. Zahlungen für das Vorjahr verzerren den EÜR-Gewinn, nicht diesen Wert.")
    d.font = font(10, False, GREY)
    d.alignment = Alignment(wrap_text=True)
    ws.row_dimensions[r].height = 42
    r += 2
    ws.cell(row=r, column=2, value="Beträge für Bewirtung sind bereits auf 70 % gekürzt, Geschenke über 50 € mit 0 % angesetzt. "
            "Die amtliche Anlage EÜR wird über ELSTER abgegeben.").font = font(10, False, GREY, True)
    protect(ws)
    return ws


# --------------------------------------------------------------- Umsatzsteuer
def build_ust(wb):
    ws = wb.create_sheet("Umsatzsteuer")
    title(ws, "Umsatzsteuer-Voranmeldung (Vorbereitung)",
          "Werte zum Übertragen in ELSTER. Kennzahlen zur Orientierung, bitte im Formular des Jahres prüfen.")
    headers = ["Zeitraum", "Umsätze 19 %\n(Kz 81)", "USt 19 %", "Umsätze 7 %\n(Kz 86)", "USt 7 %",
               "§ 13b Leistungen\n(Kz 46)", "§ 13b USt\n(Kz 47)", "Vorsteuer\n(Kz 66)", "Vorsteuer § 13b\n(Kz 67)",
               "Zahllast\n(Kz 83)", "Info: Umsätze ohne\ndt. USt"]
    header_row(ws, 4, headers, first_col=2)
    ws.row_dimensions[4].height = 44
    ws.column_dimensions["B"].width = 16
    for col in "CDEFGHIJKL":
        ws.column_dimensions[col].width = 15
    ws["B3"] = '=IF(F_KU,"Kleinunternehmer: keine USt-Ausweisung. Nur § 13b-Steuer (z. B. Meta/Google Ads aus dem EU-Ausland) ist abzuführen.","Regelbesteuerung, "&IF(F_IST,"Ist-Versteuerung","Soll-Versteuerung"))'
    ws["B3"].font = font(10, True, RED)

    def inc(rate, what, m):
        return (f'IF(F_KU,0,SUMIFS({ein(what)},{ein("R")},{m},{ein("G")},{rate},'
                f'{ein("E")},"<>{CAT_AUSLAND}",{ein("E")},"<>{CAT_ERSTATTUNG}"))')

    for i, mname in enumerate(MONTHS):
        r = 5 + i
        m = i + 1
        ws.cell(row=r, column=2, value=mname).border = BORDER
        vals = {
            "C": "=" + inc(0.19, "F", m),
            "D": "=" + inc(0.19, "H", m),
            "E": "=" + inc(0.07, "F", m),
            "F": "=" + inc(0.07, "H", m),
            "G": f'=SUMIFS({aus("P")},{aus("O")},{m})',
            "H": f'=SUMIFS({aus("Q")},{aus("O")},{m})',
            "I": f'=SUMIFS({aus("J")},{aus("O")},{m})',
            "J": f"=IF(F_KU,0,H{r})",
            "K": f"=D{r}+F{r}+H{r}-I{r}-J{r}",
            "L": f'=SUMIFS({ein("F")},{ein("R")},{m},{ein("E")},"{CAT_AUSLAND}")',
        }
        for col, f in vals.items():
            calc_cell(ws[f"{col}{r}"], EUR)
            ws[f"{col}{r}"] = f
        ws[f"K{r}"].font = font(11, True)
    r = 18
    section(ws, f"B{r}", "Quartale")
    for q in range(4):
        rr = 19 + q
        ws.cell(row=rr, column=2, value=f"Q{q+1}").border = BORDER
        for col in "CDEFGHIJKL":
            a, b = 5 + q * 3, 7 + q * 3
            calc_cell(ws[f"{col}{rr}"], EUR, col == "K")
            ws[f"{col}{rr}"] = f"=SUM({col}{a}:{col}{b})"
    ws.cell(row=23, column=2, value="Jahr").font = font(11, True)
    for col in "CDEFGHIJKL":
        calc_cell(ws[f"{col}23"], EUR, True)
        ws[f"{col}23"] = f"=SUM({col}5:{col}16)"
    name(wb, "R_ZahllastJahr", "Umsatzsteuer!$K$23")
    ws["B25"] = ("Hinweise: Bei Leistungen an Unternehmen im EU-Ausland (Reverse Charge) besteht zusätzlich die Pflicht zur "
                 "Zusammenfassenden Meldung. Bei Soll-Versteuerung zählt das Rechnungsdatum, bei Ist-Versteuerung der "
                 "Zahlungseingang. Vorsteuer wird nach Belegdatum zugeordnet.")
    ws["B25"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["B25"].font = font(10, False, GREY)
    ws.merge_cells("B25:L27")
    protect(ws)
    return ws


# ----------------------------------------------------------------- Monate
def build_months(wb):
    ws = wb.create_sheet("Monatsübersicht")
    title(ws, "Monatsübersicht", "Operative Zahlen nach Zahlungsdatum, ohne Umsatzsteuer-Bewegungen.")
    header_row(ws, 4, ["Monat", "Einnahmen netto", "Ausgaben", "Gewinn", "Gewinn kumuliert", "USt-Zahllast"], first_col=2)
    ws.column_dimensions["B"].width = 14
    for col in "CDEFG":
        ws.column_dimensions[col].width = 17
    for i, mname in enumerate(MONTHS):
        r = 5 + i
        m = i + 1
        ws.cell(row=r, column=2, value=mname).border = BORDER
        ws[f"C{r}"] = f'=SUMIFS({ein("F")},{ein("O")},{m})-SUMIFS({ein("F")},{ein("O")},{m},{ein("E")},"{CAT_ERSTATTUNG}")'
        ws[f"D{r}"] = f'=SUMIFS({aus("M")},{aus("O")},{m})-SUMIFS({aus("M")},{aus("O")},{m},{aus("E")},"{CAT_UST}")'
        ws[f"E{r}"] = f"=C{r}-D{r}"
        ws[f"F{r}"] = f"=E{r}" if i == 0 else f"=F{r-1}+E{r}"
        ws[f"G{r}"] = f"=Umsatzsteuer!K{r}"
        for col in "CDEFG":
            calc_cell(ws[f"{col}{r}"], EUR)
    ws["B17"] = "Summe"
    ws["B17"].font = font(11, True)
    for col in "CDEG":
        ws[f"{col}17"] = f"=SUM({col}5:{col}16)"
        calc_cell(ws[f"{col}17"], EUR, True)
    protect(ws)
    return ws


# --------------------------------------------------------- Steuerrücklage
def build_reserve(wb):
    ws = wb.create_sheet("Steuerrücklage")
    title(ws, "Steuerrücklage", "Wie viel Steuer verursacht Ihre Selbstständigkeit voraussichtlich, und wie viel sollte heute zurückgelegt sein?")
    ws.column_dimensions["B"].width = 56
    ws.column_dimensions["C"].width = 20
    ws.column_dimensions["D"].width = 20
    ws.column_dimensions["E"].width = 62
    ws["B3"] = '="Steuerjahr "&S_Jahr&" · "&IF(F_SPLIT,"Zusammenveranlagung","Einzelveranlagung")&" · "&IF(F_GEW,"gewerblich","freiberuflich")'
    ws["B3"].font = font(11, True, GREEN)
    header_row(ws, 5, ["Berechnung", "Mit Selbstständigkeit", "Ohne Selbstständigkeit", "Erläuterung"], first_col=2)
    rows = [
        ("Gewinn bisher (operativ)", "=R_GewinnOp", "=0", "Aus dem Blatt EÜR."),
        ("Monate für die Hochrechnung", "=F_MONATE", "=F_MONATE", "Automatisch oder laut Startblatt."),
        ("Jahresgewinn (Schätzung)", "=IF(F_HOCH,ROUND(C6/C7*12,2),C6)", "=0", "Hochrechnung: Gewinn ÷ Monate × 12."),
        ("Andere Einkünfte", "=N(Start!$C$17)", "=N(Start!$C$17)", "Laut Startblatt."),
        ("Sonderausgaben & Vorsorge", "=N(Start!$C$18)", "=N(Start!$C$18)", "Laut Startblatt."),
        ("Zu versteuerndes Einkommen (zvE)", "=MAX(0,ROUNDDOWN(C8+C9-C10,0))", "=MAX(0,ROUNDDOWN(D8+D9-D10,0))",
         "Vereinfachung: ohne Freibeträge, Verlustvorträge, außergewöhnliche Belastungen."),
        ("Tarif-Basis (bei Splitting halbes zvE)", "=ROUNDDOWN(IF(F_SPLIT,C11/2,C11),0)", "=ROUNDDOWN(IF(F_SPLIT,D11/2,D11),0)", "§ 32a Abs. 5 EStG."),
        ("Tarif auf Tarif-Basis", "=" + tarif_formula("C12"), "=" + tarif_formula("D12"), "§ 32a Abs. 1 EStG."),
        ("Einkommensteuer (tariflich)", "=IF(F_SPLIT,2*C13,C13)", "=IF(F_SPLIT,2*D13,D13)", ""),
        ("Gewerbeertrag (auf 100 € abgerundet)", "=IF(F_GEW,ROUNDDOWN(MAX(0,C8)/100,0)*100,0)", "=0",
         "Vereinfachung: Gewinn = Gewerbeertrag (ohne Hinzurechnungen/Kürzungen)."),
        ("Steuermessbetrag", "=MAX(0,C15-P_GEW_FB)*P_GEW_MZ", "=0", "Freibetrag 24.500 €, Messzahl 3,5 %."),
        ("Gewerbesteuer", "=C16*F_HEBESATZ", "=0", "Messbetrag × Hebesatz."),
        ("Anrechnung Gewerbesteuer (§ 35 EStG)", "=MIN(P_GEW_FAKTOR*C16,C17,C14)", "=0", "Vereinfachte Höchstbetragsprüfung."),
        ("Einkommensteuer nach Anrechnung", "=C14-C18", "=D14-D18", ""),
        ("Solidaritätszuschlag",
         "=IF(C19<=P_SOLI_FG*IF(F_SPLIT,2,1),0,ROUNDDOWN(MIN(C19*P_SOLI_SATZ,(C19-P_SOLI_FG*IF(F_SPLIT,2,1))*P_SOLI_MILD),2))",
         "=IF(D19<=P_SOLI_FG*IF(F_SPLIT,2,1),0,ROUNDDOWN(MIN(D19*P_SOLI_SATZ,(D19-P_SOLI_FG*IF(F_SPLIT,2,1))*P_SOLI_MILD),2))",
         "Freigrenze und Milderungszone (§§ 3, 4 SolzG)."),
        ("Kirchensteuer", "=ROUNDDOWN(C19*F_KIST,2)", "=ROUNDDOWN(D19*F_KIST,2)", "Ohne Kappung und Sonderausgabenabzug."),
        ("Steuern gesamt (Jahr)", "=C19+C20+C21+C17", "=D19+D20+D21+D17", ""),
    ]
    for i, (label, fc, fd, hint) in enumerate(rows):
        r = 6 + i
        ws.cell(row=r, column=2, value=label).border = BORDER
        calc_cell(ws.cell(row=r, column=3, value=fc), EUR)
        calc_cell(ws.cell(row=r, column=4, value=fd), EUR)
        h = ws.cell(row=r, column=5, value=hint)
        h.font = font(9, False, GREY)
    for r in (7, 11, 12, 15):
        ws[f"C{r}"].number_format = "0" if r == 7 else EUR0
        ws[f"D{r}"].number_format = "0" if r == 7 else EUR0
    for col in "CD":
        ws[f"{col}22"].font = font(11, True)

    section(ws, "B25", "Ergebnis")
    res = [
        (26, "Mehrsteuer durch die Selbstständigkeit (Jahr)", "=MAX(0,C22-D22)", EUR,
         "Differenz der beiden Spalten. Die Steuer auf andere Einkünfte (z. B. Lohnsteuer) ist hier nicht enthalten."),
        (27, "Rücklagequote auf den Gewinn", "=IF(C8>0,C26/C8,0)", PCT, "Von jedem Euro Gewinn diesen Anteil zurücklegen."),
        (28, "Grenzsteuersatz Einkommensteuer (ca.)",
         "=IF(F_SPLIT,(" + tarif_formula("(C12+500)") + "-C13)/500,(" + tarif_formula("(C12+1000)") + "-C13)/1000)", PCT,
         "Steuer auf den nächsten Euro Gewinn (ohne Soli, KiSt)."),
        (29, "Soll-Rücklage für den bisherigen Gewinn", "=MAX(0,ROUND(C27*C6,2))", EUR, ""),
        (30, "abzüglich bereits gezahlter Vorauszahlungen", "=N(Start!$C$19)", EUR, "Laut Startblatt."),
        (31, "Ertragsteuer-Rücklage heute", "=MAX(0,C29-C30)", EUR, ""),
        (32, "Umsatzsteuer noch abzuführen (Schätzung)",
         f'=MAX(0,R_ZahllastJahr-SUMIFS({aus("M")},{aus("E")},"{CAT_UST}",{aus("N")},S_Jahr)'
         f'+SUMIFS({ein("F")},{ein("E")},"{CAT_ERSTATTUNG}",{ein("N")},S_Jahr))', EUR,
         "Zahllast des Jahres minus geleistete USt-Zahlungen plus Erstattungen."),
        (33, "SOLL-RÜCKLAGE HEUTE", "=C31+C32", EUR, ""),
        (34, "Ist: Stand Ihres Rücklagekontos", "=N(Start!$C$22)", EUR, "Laut Startblatt."),
        (35, "Überdeckung (+) / Fehlbetrag (−)", "=C34-C33", EUR, ""),
        (36, "Voraussichtliche Nachzahlung Ertragsteuern zum Jahresende", "=MAX(0,C26-C30)", EUR,
         "Wenn keine weiteren Vorauszahlungen geleistet werden."),
    ]
    for r, label, f, fmt, hint in res:
        ws.cell(row=r, column=2, value=label).border = BORDER
        c = ws.cell(row=r, column=3, value=f)
        calc_cell(c, fmt, r in (26, 27, 33, 35))
        h = ws.cell(row=r, column=5, value=hint)
        h.font = font(9, False, GREY)
    ws["B33"].font = font(12, True, GREEN)
    ws["C33"].fill = fill(GREEN_LIGHT)
    ws["C33"].font = font(12, True, GREEN)
    ws.conditional_formatting.add("C35", FormulaRule(formula=["C35<0"], fill=fill(RED_BG), font=Font(color=RED, bold=True)))
    ws.conditional_formatting.add("C35", FormulaRule(formula=["C35>=0"], fill=fill(OK_BG)))
    name(wb, "R_Mehrsteuer", "Steuerrücklage!$C$26")
    name(wb, "R_Quote", "Steuerrücklage!$C$27")
    name(wb, "R_SollHeute", "Steuerrücklage!$C$33")
    name(wb, "R_Differenz", "Steuerrücklage!$C$35")
    name(wb, "R_Jahresgewinn", "Steuerrücklage!$C$8")
    ws["B38"] = '="Faustregel für jede neue Zahlung: "&TEXT(C27,"0%")&" des Nettobetrags als Rücklage"&IF(F_KU,""," plus die enthaltene Umsatzsteuer")&" auf das Rücklagekonto überweisen."'
    ws["B38"].font = font(12, True, INK)
    ws.merge_cells("B38:E38")
    ws["B40"] = ("Grenzen: keine Verlustvorträge, Freibeträge (z. B. Kinder), außergewöhnliche Belastungen, Progressionsvorbehalt, "
                 "Kapitalerträge, Kirchensteuer-Kappung. Gewerbeertrag vereinfacht. Ergebnis ist eine Schätzung, kein Bescheid.")
    ws["B40"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["B40"].font = font(10, False, GREY)
    ws.merge_cells("B40:E42")
    protect(ws)
    return ws


# ------------------------------------------------------------ KU-Monitor
def build_ku(wb):
    ws = wb.create_sheet("Kleinunternehmer")
    title(ws, "Kleinunternehmer-Monitor", "Prüft die Umsatzgrenzen des § 19 UStG in der seit 01.01.2025 geltenden Fassung.")
    ws.column_dimensions["B"].width = 56
    ws.column_dimensions["C"].width = 22
    ws.column_dimensions["D"].width = 60
    rows = [
        (5, "Gesamtumsatz Vorjahr (laut Startblatt)", "=N(Start!$C$12)", EUR),
        (6, "Gründungsjahr?", '=IF(F_GRUEND,"Ja","Nein")', None),
        (7, "Maßgebliche Grenze laufendes Jahr", "=F_KULIMIT", EUR0),
        (8, "Gesamtumsatz laufendes Jahr bis heute (vereinnahmt)", f"=SUM({ein('S')})", EUR),
        (9, "Spielraum bis 25.000 € (Grenze für das Folgejahr)", "=P_KU_VJ-C8", EUR),
        (10, "Spielraum bis zur Grenze im laufenden Jahr", "=C7-C8", EUR),
        (11, "Hochrechnung Jahresende", "=ROUND(C8/F_MONATE*12,2)", EUR),
        (12, "Ausschöpfung der 25.000-€-Grenze (entscheidet über das Folgejahr)", "=C8/P_KU_VJ", PCT),
    ]
    for r, label, f, fmt in rows:
        ws.cell(row=r, column=2, value=label).border = BORDER
        calc_cell(ws.cell(row=r, column=3, value=f), fmt)
    ws["B13"] = '=REPT("█",MIN(40,ROUND(C12*40,0)))&REPT("░",MAX(0,40-MIN(40,ROUND(C12*40,0))))'
    ws["B13"].font = Font(name="DejaVu Sans Mono", size=12, color=GREEN)
    section(ws, "B15", "Status")
    status = (
        '=IF(NOT(F_KU),"Sie haben Regelbesteuerung gewählt. Der Monitor dient dann nur der Information.",'
        'IF(AND(NOT(F_GRUEND),C5>P_KU_VJ),"Achtung: Vorjahresumsatz über 25.000 €. Die Kleinunternehmerregelung ist in diesem Jahr nicht anwendbar.",'
        'IF(C8>C7,"Grenze überschritten: Ab dem Umsatz, mit dem die Grenze überschritten wurde ("&C18&"), gilt die Regelbesteuerung. Rechnungen ab dann mit USt!",'
        'IF(C8>P_KU_VJ,"In diesem Jahr weiter Kleinunternehmer. Im Folgejahr gilt die Regelbesteuerung (Umsatz über 25.000 €).",'
        'IF(C11>P_KU_VJ,"Noch im Rahmen, aber die Hochrechnung liegt über 25.000 €. Planen Sie den Wechsel zur Regelbesteuerung im Folgejahr ein.",'
        '"Alles im Rahmen. Die Kleinunternehmerregelung bleibt nach aktuellem Stand auch im Folgejahr möglich.")))))'
    )
    ws["B16"] = status
    ws["B16"].font = font(12, True, INK)
    ws["B16"].alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells("B16:D17")
    ws.row_dimensions[16].height = 30
    ws.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,6)="Grenze"'], fill=fill(RED_BG)))
    ws.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,7)="Achtung"'], fill=fill(RED_BG)))
    ws.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,4)="Noch"'], fill=fill(AMBER_BG)))
    ws.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,8)="In diese"'], fill=fill(AMBER_BG)))
    ws.conditional_formatting.add("B16", FormulaRule(formula=['LEFT($B$16,5)="Alles"'], fill=fill(OK_BG)))
    ws["B18"] = "Rechnung, mit der die Grenze überschritten wurde"
    ws["C18"] = f'=IFERROR(INDEX({ein("B")},MATCH("Grenze überschritten",{ein("U")},0)),"–")'
    calc_cell(ws["C18"])
    ws["B20"] = ("Rechtsgrundlage: § 19 Abs. 1 UStG (25.000 € Vorjahr, 100.000 € laufendes Jahr, jeweils Gesamtumsatz "
                 "nach vereinnahmten Entgelten). Im Jahr der Gründung gilt nach Verwaltungsauffassung die 25.000-€-Grenze. "
                 "Gezählt werden hier Einnahmen der Kategorie „Umsatzerlöse“. Umsätze aus dem Verkauf von Anlagegütern zählen "
                 "nicht. Sonderfälle (steuerfreie Umsätze nach § 4 UStG) bitte mit der Steuerberatung klären.")
    ws["B20"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["B20"].font = font(10, False, GREY)
    ws.merge_cells("B20:D23")
    name(wb, "R_KUStatus", "Kleinunternehmer!$B$16")
    protect(ws)
    return ws


# --------------------------------------------------------------- Dashboard
def build_dashboard(wb):
    ws = wb.create_sheet("Dashboard", 1)
    title(ws, "Dashboard", None)
    ws["B2"] = '=IF(Start!$C$6="","","Für "&Start!$C$6&" · ")&"Steuerjahr "&S_Jahr&" · Stand "&TEXT(DAY(TODAY()),"00")&"."&TEXT(MONTH(TODAY()),"00")&"."&YEAR(TODAY())'
    ws["B2"].font = font(10, False, GREY, True)
    ws.sheet_properties.tabColor = BRASS
    for col in "BCDEFGH":
        ws.column_dimensions[col].width = 21
    tiles = [
        ("B", "Einnahmen netto", "=Monatsübersicht!C17", EUR0),
        ("D", "Ausgaben", "=Monatsübersicht!D17", EUR0),
        ("F", "Gewinn bisher", "=R_GewinnOp", EUR0),
        ("H", "Gewinnmarge", "=IF(Monatsübersicht!C17>0,R_GewinnOp/Monatsübersicht!C17,0)", PCT),
    ]
    tiles2 = [
        ("B", "Soll-Rücklage heute", "=R_SollHeute", EUR0),
        ("D", "Rücklage Über-/Unterdeckung", "=R_Differenz", EUR0),
        ("F", "Rücklagequote", "=R_Quote", PCT),
        ("H", "Offene Rechnungen", "=Einnahmen!F3", EUR0),
    ]
    for row, ts in ((4, tiles), (8, tiles2)):
        for col, label, f, fmt in ts:
            c1 = ws[f"{col}{row}"]
            c1.value = label
            c1.font = font(10, True, GREY)
            c1.fill = fill(PAPER)
            c2 = ws[f"{col}{row+1}"]
            c2.value = f
            c2.number_format = fmt
            c2.font = font(20, True, INK)
            c2.fill = fill(PAPER)
            ws.row_dimensions[row + 1].height = 34
            c3 = ws[f"{col}{row+2}"]
            c3.fill = fill(PAPER)
            c3.border = Border(bottom=Side(style="thick", color=GREEN))
    ws["D10"] = '=IF(R_Differenz<0,"Fehlbetrag – bitte auffüllen","gedeckt")'
    ws["D10"].font = font(9, True, GREEN)
    ws["H10"] = f'=COUNTIFS({ein("M")},"Überfällig*")&" überfällig"'
    ws["H10"].font = font(9, True, RED)
    ws["B10"] = '=IF(F_KU,"inkl. § 13b-USt, falls vorhanden","inkl. offener Umsatzsteuer")'
    ws["B10"].font = font(9, False, GREY)
    ws["B12"] = "Kleinunternehmer-Status"
    ws["B12"].font = font(10, True, GREY)
    ws["B13"] = "=R_KUStatus"
    ws["B13"].font = font(11, True, INK)
    ws["B13"].alignment = Alignment(wrap_text=True, vertical="top")
    ws.merge_cells("B13:H14")
    ws.row_dimensions[13].height = 24
    ws["B16"] = '="Faustregel: "&TEXT(R_Quote,"0%")&" jeder Zahlung (netto) zurücklegen."'
    ws["B16"].font = font(12, True, GREEN)

    ms = wb["Monatsübersicht"]
    chart = BarChart()
    chart.type = "col"
    chart.title = "Einnahmen und Ausgaben je Monat"
    chart.y_axis.title = "€"
    chart.y_axis.numFmt = "#,##0"
    data = Reference(ms, min_col=3, max_col=4, min_row=4, max_row=16)
    cats = Reference(ms, min_col=2, min_row=5, max_row=16)
    chart.add_data(data, titles_from_data=True)
    chart.set_categories(cats)
    chart.height = 8
    chart.width = 22
    chart.series[0].graphicalProperties.solidFill = GREEN
    chart.series[1].graphicalProperties.solidFill = BRASS
    ws.add_chart(chart, "B18")
    line = LineChart()
    line.title = "Gewinn kumuliert"
    line.y_axis.numFmt = "#,##0"
    line.add_data(Reference(ms, min_col=6, max_col=6, min_row=4, max_row=16), titles_from_data=True)
    line.set_categories(cats)
    line.height = 8
    line.width = 22
    line.series[0].graphicalProperties.line.solidFill = INK
    line.series[0].graphicalProperties.line.width = 28000
    ws.add_chart(line, "B35")
    protect(ws)
    return ws


# --------------------------------------------------------------------- PRO
def build_rate(wb):
    ws = wb.create_sheet("Stundensatz")
    title(ws, "Stundensatz- & Angebotsrechner (PRO)",
          "Welcher Stundensatz deckt Ihr Wunsch-Nettoeinkommen nach Steuern, Vorsorge und Kosten?")
    ws.column_dimensions["B"].width = 54
    ws.column_dimensions["C"].width = 18
    ws.column_dimensions["D"].width = 56
    section(ws, "B4", "Ihre Ziele und Kosten (Monatswerte)")
    inputs = [
        (5, "Wunsch-Nettoeinkommen pro Monat (zum Leben)", 3000, EUR),
        (6, "Kranken- & Pflegeversicherung pro Monat", 450, EUR),
        (7, "Altersvorsorge pro Monat", 400, EUR),
        (8, "Betriebskosten pro Monat (Software, Büro, Versicherungen …)", 350, EUR),
        (9, "Sicherheitspuffer auf den Umsatz", 0.10, "0%"),
    ]
    section(ws, "B11", "Arbeitszeit")
    inputs += [
        (12, "Urlaubstage pro Jahr", 30, "0"),
        (13, "Feiertage (Werktage) pro Jahr", 10, "0"),
        (14, "Krankheitstage pro Jahr (Annahme)", 10, "0"),
        (15, "Fortbildungstage pro Jahr", 5, "0"),
        (16, "Arbeitsstunden pro Tag", 8, "0.0"),
        (17, "Anteil abrechenbarer Stunden", 0.65, "0%"),
    ]
    for r, label, v, fmt in inputs:
        ws.cell(row=r, column=2, value=label)
        input_cell(ws.cell(row=r, column=3, value=v), fmt)
    section(ws, "B19", "Ergebnis")
    res = [
        (20, "Arbeitstage pro Jahr", "=260-C12-C13-C14-C15", "0", "260 Werktage minus Abwesenheit."),
        (21, "Abrechenbare Stunden pro Jahr", "=ROUND(C20*C16*C17,0)", "0", ""),
        (22, "Benötigter Jahresgewinn vor Steuern", "=IF(COUNTIF($K$6:$K$405,\"<\"&(C5*12))>=400,\"über 409.000 €\",INDEX($G$6:$G$405,COUNTIF($K$6:$K$405,\"<\"&(C5*12))+1))", EUR0,
         "Kleinster Gewinn, bei dem nach ESt, Soli, KiSt (laut Startblatt), Vorsorge und GewSt das Wunsch-Netto bleibt."),
        (23, "+ Betriebskosten pro Jahr", "=C8*12", EUR0, ""),
        (24, "+ Sicherheitspuffer", "=IFERROR(ROUND((C22+C23)*C9,0),0)", EUR0, ""),
        (25, "Benötigter Jahresumsatz (netto)", "=IFERROR(C22+C23+C24,0)", EUR0, ""),
        (26, "MINDEST-STUNDENSATZ (netto)", "=IFERROR(ROUNDUP(C25/C21,0),0)", EUR, ""),
        (27, "Mindest-Tagessatz (netto, 8 Std.)", "=C26*8", EUR, ""),
    ]
    for r, label, f, fmt, hint in res:
        ws.cell(row=r, column=2, value=label).border = BORDER
        calc_cell(ws.cell(row=r, column=3, value=f), fmt, r in (25, 26))
        ws.cell(row=r, column=4, value=hint).font = font(9, False, GREY)
    ws["B26"].font = font(12, True, GREEN)
    ws["C26"].fill = fill(GREEN_LIGHT)
    ws["C26"].font = font(14, True, GREEN)

    section(ws, "B30", "Angebotskalkulation")
    offer = [
        (31, "Geschätzte Stunden", 20, "0.0", True),
        (32, "Stundensatz (leer = Mindest-Stundensatz)", None, EUR, True),
        (33, "Fremdkosten / Material netto", 0, EUR, True),
        (34, "Risikoaufschlag", 0.10, "0%", True),
        (35, "Angebotspreis netto", "=ROUND((C31*IF(N(C32)>0,C32,C26)+C33)*(1+C34),2)", EUR, False),
        (36, "Umsatzsteuer", "=IF(F_KU,0,ROUND(C35*0.19,2))", EUR, False),
        (37, "Angebotspreis brutto", "=C35+C36", EUR, False),
    ]
    for r, label, v, fmt, is_input in offer:
        ws.cell(row=r, column=2, value=label).border = BORDER
        c = ws.cell(row=r, column=3, value=v)
        if is_input:
            input_cell(c, fmt)
        else:
            calc_cell(c, fmt, r == 37)
    ws["D36"] = '=IF(F_KU,"Kleinunternehmer: Hinweis auf § 19 UStG ins Angebot aufnehmen.","19 % USt")'
    ws["D36"].font = font(9, False, GREY)

    header_row(ws, 5, ["Gewinn", "zvE", "Steuer ESt", "Soli+KiSt+GewSt", "Netto"], first_col=7)
    for col in "GHIJK":
        ws.column_dimensions[col].width = 13
        ws.column_dimensions[col].hidden = True
    for i in range(400):
        r = 6 + i
        ws[f"G{r}"] = 10000 + i * 1000
        ws[f"H{r}"] = f"=MAX(0,ROUNDDOWN(G{r}-($C$6+$C$7)*12,0))"
        x = f"ROUNDDOWN(IF(F_SPLIT,H{r}/2,H{r}),0)"
        ws[f"I{r}"] = f"=IF(F_SPLIT,2,1)*" + tarif_formula(f"({x})")
        mess = f"IF(F_GEW,MAX(0,ROUNDDOWN(G{r}/100,0)*100-P_GEW_FB)*P_GEW_MZ,0)"
        est_net = f"(I{r}-MIN(P_GEW_FAKTOR*{mess},{mess}*F_HEBESATZ,I{r}))"
        fg = "P_SOLI_FG*IF(F_SPLIT,2,1)"
        soli = f"IF({est_net}<={fg},0,MIN({est_net}*P_SOLI_SATZ,({est_net}-{fg})*P_SOLI_MILD))"
        ws[f"J{r}"] = f"={soli}+{est_net}*F_KIST+{mess}*F_HEBESATZ-MIN(P_GEW_FAKTOR*{mess},{mess}*F_HEBESATZ,I{r})"
        ws[f"K{r}"] = f"=G{r}-I{r}-J{r}-($C$6+$C$7)*12"
    ws["B39"] = ("Annahmen: Vorsorge (Zeilen 6–7) voll als Sonderausgaben abziehbar, keine anderen Einkünfte. "
                 "Die Rechnung nutzt Steuerjahr, Veranlagung, Kirchensteuer und Tätigkeit aus dem Startblatt.")
    ws["B39"].font = font(9, False, GREY, True)
    ws.merge_cells("B39:D40")
    ws["B39"].alignment = Alignment(wrap_text=True, vertical="top")
    protect(ws)


def build_liquidity(wb):
    ws = wb.create_sheet("Liquidität")
    title(ws, "Liquiditätsplan 12 Monate (PRO)", "Reicht das Geld, auch wenn Steuervorauszahlungen und Umsatzsteuer fällig werden?")
    ws.column_dimensions["B"].width = 40
    for i in range(12):
        ws.column_dimensions[chr(ord("C") + i)].width = 12
    ws["B4"] = "Kontostand zu Beginn"
    input_cell(ws["C4"], EUR)
    ws["C4"] = 5000
    ws["B5"] = "Erster Planmonat"
    input_cell(ws["C5"], "MM/YYYY")
    ws["C5"] = date(2027, 1, 1)
    ws["B6"] = "Mindestreserve (Warnschwelle)"
    input_cell(ws["C6"], EUR)
    ws["C6"] = 2000
    hdr = ["Position"] + [None] * 12
    header_row(ws, 8, hdr, first_col=2)
    for i in range(12):
        c = ws.cell(row=8, column=3 + i, value=f"=EDATE($C$5,{i})")
        c.number_format = "MMM YY"
    lines = [
        (9, "Einnahmen (brutto, erwartet)", True, "=ROUND(Monatsübersicht!$C$17/F_MONATE*IF(F_KU,1,1.19),0)"),
        (10, "Betriebsausgaben (brutto, erwartet)", True, "=ROUND(Monatsübersicht!$D$17/F_MONATE,0)"),
        (11, "Privatentnahmen", True, None),
        (12, "ESt-Vorauszahlung (März, Juni, Sept., Dez.)", True, None),
        (13, "GewSt-Vorauszahlung (Feb., Mai, Aug., Nov.)", True, None),
        (14, "Umsatzsteuer-Zahllast", True, "=IF(F_KU,0,ROUND(R_ZahllastJahr/F_MONATE,0))"),
        (15, "Saldo des Monats", False, None),
        (16, "Kontostand am Monatsende", False, None),
        (17, "Warnung", False, None),
    ]
    for r, label, is_input, default in lines:
        ws.cell(row=r, column=2, value=label).border = BORDER
        for i in range(12):
            col = chr(ord("C") + i)
            c = ws[f"{col}{r}"]
            if is_input:
                input_cell(c, EUR0)
                if default:
                    c.value = default
                if r == 12:
                    c.value = f'=IF(OR(MONTH({col}$8)=3,MONTH({col}$8)=6,MONTH({col}$8)=9,MONTH({col}$8)=12),ROUND(R_Mehrsteuer/4,0),0)'
                if r == 13:
                    c.value = f'=IF(AND(F_GEW,OR(MONTH({col}$8)=2,MONTH({col}$8)=5,MONTH({col}$8)=8,MONTH({col}$8)=11)),ROUND(Steuerrücklage!$C$17/4,0),0)'
            elif r == 15:
                c.value = f"={col}9-{col}10-{col}11-{col}12-{col}13-{col}14"
                calc_cell(c, EUR0)
            elif r == 16:
                prev = "$C$4" if i == 0 else f"{chr(ord('C') + i - 1)}16"
                c.value = f"={prev}+{col}15"
                calc_cell(c, EUR0, True)
            elif r == 17:
                c.value = f'=IF({col}16<0,"Minus!",IF({col}16<$C$6,"knapp",""))'
                calc_cell(c)
    ws.conditional_formatting.add("C16:N16", FormulaRule(formula=["C16<0"], fill=fill(RED_BG), font=Font(color=RED, bold=True)))
    ws.conditional_formatting.add("C16:N16", FormulaRule(formula=["AND(C16>=0,C16<$C$6)"], fill=fill(AMBER_BG)))
    ws["B19"] = ("Gelbe Zellen sind mit Vorschlägen aus Ihren bisherigen Daten vorbelegt und dürfen überschrieben werden. "
                 "Vorauszahlungen stehen im Bescheid des Finanzamts; ohne Bescheid wird ein Viertel der geschätzten Mehrsteuer angesetzt.")
    ws["B19"].alignment = Alignment(wrap_text=True, vertical="top")
    ws["B19"].font = font(10, False, GREY)
    ws.merge_cells("B19:N21")
    protect(ws)


def build_deadlines(wb, deadlines):
    ws = wb.create_sheet("Fristen 2027")
    title(ws, "Steuerfristen 2027 (PRO)", "Bundesweite Fristen, bereits auf Werktage verschoben. Regionale Feiertage bitte selbst prüfen.")
    header_row(ws, 4, ["Datum", "Frist", "Betrifft", "Erledigt?"], first_col=2)
    ws.column_dimensions["B"].width = 14
    ws.column_dimensions["C"].width = 60
    ws.column_dimensions["D"].width = 34
    ws.column_dimensions["E"].width = 12
    for i, (d, what, who) in enumerate(deadlines):
        r = 5 + i
        c = ws.cell(row=r, column=2, value=d)
        calc_cell(c, DATE)
        calc_cell(ws.cell(row=r, column=3, value=what))
        calc_cell(ws.cell(row=r, column=4, value=who))
        input_cell(ws.cell(row=r, column=5))
    dv_list(ws, "L_Ja", f"E5:E{4 + len(deadlines)}")
    ws.conditional_formatting.add(f"B5:E{4+len(deadlines)}", FormulaRule(formula=['$E5="Ja"'], font=Font(color=GREY, strike=True)))
    protect(ws)


# -------------------------------------------------------------- Beispieldaten
def fill_sample(wb, sample):
    st = wb["Start"]
    for cell, v in sample["settings"].items():
        st[cell] = v
    ei = wb["Einnahmen"]
    for i, row in enumerate(sample["income"]):
        r = EIN_FIRST + i
        for col, v in zip("ABCDEFG", row[:7]):
            ei[f"{col}{r}"] = v
        ei[f"J{r}"] = row[7]
        ei[f"K{r}"] = row[8] if len(row) > 8 else None
    if "liquidity" in sample and "Liquidität" in wb.sheetnames:
        lq = wb["Liquidität"]
        for cell, v in sample["liquidity"].items():
            lq[cell] = v
    au = wb["Ausgaben"]
    for i, row in enumerate(sample["expenses"]):
        r = AUS_FIRST + i
        for col, v in zip("ABCDEFGHI", row):
            au[f"{col}{r}"] = v


def build(edition, out, sample=None, deadlines=None):
    wb = Workbook()
    build_start(wb, edition)
    build_lists(wb)
    build_params(wb)
    build_income(wb)
    build_expenses(wb)
    build_euer(wb)
    build_ust(wb)
    build_months(wb)
    build_reserve(wb)
    build_ku(wb)
    build_dashboard(wb)
    if edition == "pro":
        build_rate(wb)
        build_liquidity(wb)
        build_deadlines(wb, deadlines)
    order = ["Start", "Dashboard", "Einnahmen", "Ausgaben", "EÜR", "Umsatzsteuer", "Steuerrücklage",
             "Kleinunternehmer", "Monatsübersicht"]
    if edition == "pro":
        order += ["Stundensatz", "Liquidität", "Fristen 2027"]
    order += ["Listen", "Parameter"]
    wb._sheets = [wb[n] for n in order]
    wb.active = 0
    if sample:
        fill_sample(wb, sample)
    wb.properties.title = "Freikontor Finanzcockpit 2026"
    wb.properties.creator = "Freikontor"
    wb.calculation.fullCalcOnLoad = True
    wb.save(out)


if __name__ == "__main__":
    from deadlines import deadlines_2027
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "dist")
    (out / "basis").mkdir(parents=True, exist_ok=True)
    (out / "pro").mkdir(parents=True, exist_ok=True)
    dl = deadlines_2027()
    build("basis", out / "basis" / "Freikontor-Finanzcockpit-2026.xlsx")
    build("pro", out / "pro" / "Freikontor-Finanzcockpit-2026-PRO.xlsx", deadlines=dl)
    for key, s in SAMPLES.items():
        build("basis", out / "basis" / f"Beispiel-{key}.xlsx", sample=s)
        build("pro", out / "pro" / f"Beispiel-{key}-PRO.xlsx", sample=s, deadlines=dl)
    print("ok", out)
