"""Rendert echte Ansichten der Beispiel-Arbeitsmappen (LibreOffice -> PDF -> PNG).

Aufruf: python3 render_screens.py <dist-ordner> <ausgabeordner>
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from openpyxl import load_workbook

SHOTS = [
    ("A-Kleinunternehmerin", "Dashboard", "B1:H33", "dashboard-ku"),
    ("B-Regelbesteuert-Gewerbe", "Dashboard", "B1:H33", "dashboard-regel"),
    ("A-Kleinunternehmerin", "Steuerrücklage", "B1:E38", "ruecklage-ku"),
    ("B-Regelbesteuert-Gewerbe", "Steuerrücklage", "B1:E38", "ruecklage-regel"),
    ("A-Kleinunternehmerin", "Kleinunternehmer", "B1:D20", "ku-monitor"),
    ("A-Kleinunternehmerin", "Einnahmen", "A1:M26", "einnahmen"),
    ("B-Regelbesteuert-Gewerbe", "Ausgaben", "A1:M26", "ausgaben"),
    ("B-Regelbesteuert-Gewerbe", "Umsatzsteuer", "B1:L23", "umsatzsteuer"),
    ("B-Regelbesteuert-Gewerbe", "EÜR", "B1:D46", "euer"),
    ("A-Kleinunternehmerin", "Stundensatz", "B1:D37", "stundensatz"),
    ("B-Regelbesteuert-Gewerbe", "Liquidität", "B1:N17", "liquiditaet"),
    ("A-Kleinunternehmerin", "Start", "B1:D37", "start"),
]


def main(dist, out):
    out.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="fk-shots-"))
    for sample, sheet, area, slug in SHOTS:
        wb = load_workbook(dist / "pro" / f"Beispiel-{sample}-PRO.xlsx")
        for ws in wb:
            ws.sheet_state = "visible" if ws.title == sheet else "hidden"
        ws = wb[sheet]
        wb.active = wb.sheetnames.index(sheet)
        ws.print_area = area
        ws.page_setup.orientation = "landscape"
        ws.page_setup.fitToWidth = 1
        ws.page_setup.fitToHeight = 1
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.print_options.gridLines = False
        ws.page_margins.left = ws.page_margins.right = 0.2
        ws.page_margins.top = ws.page_margins.bottom = 0.2
        ws.oddHeader.center.text = ""
        ws.oddFooter.center.text = ""
        x = tmp / f"{slug}.xlsx"
        wb.save(x)
        subprocess.run(["soffice", "-env:UserInstallation=file://" + str(tmp / "lo-profile"), "--headless", "--convert-to", "pdf", "--outdir", str(tmp), str(x)], env={**__import__("os").environ, "LANG": "de_DE.UTF-8", "LC_ALL": "de_DE.UTF-8"},
                       check=True, capture_output=True, timeout=180)
        subprocess.run(["pdftoppm", "-r", "200", "-png", "-singlefile", str(tmp / f"{slug}.pdf"), str(tmp / slug)],
                       check=True)
        subprocess.run(["convert", str(tmp / f"{slug}.png"), "-trim", "-bordercolor", "white", "-border", "40",
                        str(out / f"{slug}.png")], check=True)
        print("shot", slug)


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
