"""Prüft die Excel-Formeln nach Neuberechnung durch LibreOffice gegen eine unabhängige Python-Rechnung.

Aufruf: python3 -m unittest discover -s product/tests -v   (aus digital-business/)
Benötigt: LibreOffice (soffice) im PATH.
"""
import math
import random
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path

BUILD = Path(__file__).resolve().parents[1] / "build"
sys.path.insert(0, str(BUILD))

from openpyxl import load_workbook  # noqa: E402

import build_workbook as bw  # noqa: E402
import taxcalc  # noqa: E402
from deadlines import deadlines_2027, easter, next_workday  # noqa: E402
from sample_data import SAMPLES  # noqa: E402

TMP = Path(tempfile.mkdtemp(prefix="fk-test-"))


def recalc(path, lang=None):
    out = TMP / ("out-" + lang if lang else "out")
    out.mkdir(exist_ok=True)
    env = dict(__import__("os").environ)
    cmd = ["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", str(out), str(path)]
    if lang:
        env.update(LANG=lang, LC_ALL=lang)
        cmd.insert(1, "-env:UserInstallation=file://" + str(TMP / ("profile-" + lang)))
    subprocess.run(cmd, check=True, capture_output=True, timeout=180, env=env)
    return load_workbook(out / path.name, data_only=True)


def build_and_recalc(name, edition="basis", sample=None, extra=None):
    path = TMP / f"{name}.xlsx"
    bw.build(edition, path, sample=sample, deadlines=deadlines_2027())
    if extra:
        wb = load_workbook(path)
        extra(wb)
        wb.save(path)
    return recalc(path)


def expected_profit(sample, year=2026):
    ku = sample["settings"].get("C7", bw.USTSTATUS[0]) == bw.USTSTATUS[0]
    inc = 0.0
    for row in sample["income"]:
        paid = row[7]
        if paid and paid.year == year and row[4] != bw.CAT_ERSTATTUNG:
            inc += row[5]
    exp = 0.0
    for row in sample["expenses"]:
        d, cat, gross, rate, rc = row[0], row[4], row[5], row[6], row[7]
        if d.year != year or cat == bw.CAT_UST:
            continue
        vst = 0 if (ku or not rate or rc == "Ja" or cat == bw.CAT_GESCHENK) else round(gross - gross / (1 + rate), 2)
        quote = 0.7 if cat == bw.CAT_BEWIRTUNG else (0 if cat == bw.CAT_GESCHENK else 1)
        exp += round((gross - vst) * quote, 2)
    return round(inc - exp, 2)


class TarifTest(unittest.TestCase):
    def test_tarif_matches_reference_for_both_years(self):
        rnd = random.Random(7)
        xs = sorted(set([0, 1, 12095, 12096, 12097, 12347, 12348, 12349, 17443, 17444, 17799, 17800, 68480, 68481,
                         69878, 69879, 277825, 277826, 500000] + [rnd.randint(0, 320000) for _ in range(600)]))
        for year in (2025, 2026):
            def extra(wb, year=year):
                wb["Start"]["C5"] = year
                ws = wb.create_sheet("TarifTest")
                for i, x in enumerate(xs):
                    ws[f"A{i+1}"] = x
                    ws[f"B{i+1}"] = "=" + bw.tarif_formula(f"A{i+1}")
            wb = build_and_recalc(f"tarif{year}", extra=extra)
            ws = wb["TarifTest"]
            for i, x in enumerate(xs):
                self.assertEqual(ws[f"B{i+1}"].value, taxcalc.tarif(x, year), f"{year} zvE {x}")

    def test_known_values_2026(self):
        self.assertEqual(taxcalc.tarif(12348, 2026), 0)
        self.assertEqual(taxcalc.tarif(17799, 2026), 1034)
        self.assertEqual(taxcalc.tarif(50000, 2026), 10548)
        self.assertEqual(taxcalc.tarif(69878, 2026), math.floor(0.42 * 69878 - 11135.63))

    def test_zones_are_continuous(self):
        for year, p in taxcalc.TAX_PARAMS.items():
            for edge in (p["z2"], p["z3"], p["z4"]):
                self.assertLessEqual(abs(taxcalc.tarif(edge + 1, year) - taxcalc.tarif(edge, year)), 1, (year, edge))


class SampleTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.books = {k: build_and_recalc(f"sample-{k}", "pro", s) for k, s in SAMPLES.items()}

    def test_no_formula_errors_anywhere(self):
        for k, wb in self.books.items():
            for ws in wb:
                for row in ws.iter_rows():
                    for c in row:
                        if isinstance(c.value, str):
                            self.assertFalse(c.value.startswith(("#", "Err:")), f"{k} {ws.title}!{c.coordinate} {c.value}")

    def test_operative_profit_matches_independent_calculation(self):
        for k, s in SAMPLES.items():
            got = self.books[k]["EÜR"]
            row = next(r for r in range(1, 80) if got[f"B{r}"].value == "Gewinn operativ (ohne Umsatzsteuer-Bewegungen)")
            self.assertAlmostEqual(got[f"C{row}"].value, expected_profit(s), places=2, msg=k)

    def test_reserve_matches_reference_scenario(self):
        for k, s in SAMPLES.items():
            st = s["settings"]
            months = st.get("C21", 10)
            profit = expected_profit(s)
            gewinn = round(profit / months * 12, 2)
            split = st.get("C15") == bw.VERANLAGUNG[1]
            gew = st.get("C9") == bw.TAETIGKEIT[1]
            kist = {"9 %": 0.09, "8 %": 0.08}.get(st.get("C16"), 0)
            with_s = taxcalc.scenario(gewinn, st.get("C17", 0), st.get("C18", 0), 2026, split, gew, st.get("C10", 4.0), kist)
            without = taxcalc.scenario(0, st.get("C17", 0), st.get("C18", 0), 2026, split, False, 0, kist)
            ws = self.books[k]["Steuerrücklage"]
            self.assertAlmostEqual(ws["C22"].value, with_s["summe"], places=2, msg=k)
            self.assertAlmostEqual(ws["D22"].value, without["summe"], places=2, msg=k)
            self.assertAlmostEqual(ws["C26"].value, max(0, with_s["summe"] - without["summe"]), places=2, msg=k)

    def test_reverse_charge_tax_for_kleinunternehmer(self):
        s = SAMPLES["A-Kleinunternehmerin"]
        base = sum(r[5] for r in s["expenses"] if r[7] == "Ja" and r[0].year == 2026)
        ws = self.books["A-Kleinunternehmerin"]["Umsatzsteuer"]
        self.assertAlmostEqual(ws["G23"].value, base, places=2)
        self.assertAlmostEqual(ws["K23"].value, ws["H23"].value, places=2)
        self.assertEqual(ws["I23"].value, 0)

    def test_hourly_rate_covers_target_net(self):
        for k, wb in self.books.items():
            ws = wb["Stundensatz"]
            needed = ws["C22"].value
            row = next(r for r in range(6, 406) if ws[f"G{r}"].value == needed)
            self.assertGreaterEqual(ws[f"K{row}"].value, ws["C5"].value * 12, k)
            self.assertLess(ws[f"K{row-1}"].value, ws["C5"].value * 12, k)


class LocaleTest(unittest.TestCase):
    def test_dashboard_date_is_locale_independent(self):
        """Datum im Dashboard bei deutscher Spracheinstellung als TT.MM.JJJJ. Die Formel nutzt bewusst keine sprachabhängigen TEXT-Datumscodes."""
        import os
        path = TMP / "locale.xlsx"
        bw.build("basis", path, sample=SAMPLES["A-Kleinunternehmerin"])
        wb = load_workbook(path)
        for ws in wb:
            ws.sheet_state = "visible" if ws.title == "Dashboard" else "hidden"
        wb.active = wb.sheetnames.index("Dashboard")
        wb.save(path)
        env = {**os.environ, "LANG": "de_DE.UTF-8", "LC_ALL": "de_DE.UTF-8"}
        subprocess.run(["soffice", "-env:UserInstallation=file://" + str(TMP / "profile-de"), "--headless", "--convert-to", "pdf",
                        "--outdir", str(TMP), str(path)], check=True, capture_output=True, timeout=180, env=env)
        text = subprocess.run(["pdftotext", str(TMP / "locale.pdf"), "-"], capture_output=True, text=True, check=True).stdout
        self.assertRegex(text, r"Stand \d{2}\.\d{2}\.\d{4}")


class KleinunternehmerTest(unittest.TestCase):
    def _book(self, name, founding, prior, amounts):
        income = [[date(2026, 1 + i % 11, 10), f"T-{i+1:03d}", "Kunde (fiktiv)", "Leistung", bw.CAT_UMSATZ, a, 0,
                   date(2026, 1 + i % 11, 15 + i % 10), None] for i, a in enumerate(amounts)]
        sample = {"settings": {"C7": bw.USTSTATUS[0], "C11": "Ja" if founding else "Nein", "C12": prior},
                  "income": income, "expenses": []}
        return build_and_recalc(name, sample=sample)["Kleinunternehmer"]

    def test_founding_year_uses_25000_and_names_crossing_invoice(self):
        ws = self._book("ku-found", True, 0, [6000, 6000, 6000, 6000, 2000, 500])
        self.assertEqual(ws["C7"].value, 25000)
        self.assertEqual(ws["C18"].value, "T-005")
        self.assertTrue(ws["B16"].value.startswith("Grenze überschritten"))

    def test_between_25000_and_100000_keeps_status_this_year(self):
        ws = self._book("ku-mid", False, 20000, [10000, 10000, 10000])
        self.assertTrue(ws["B16"].value.startswith("In diesem Jahr weiter Kleinunternehmer"))
        self.assertEqual(ws["C18"].value, "–")

    def test_prior_year_above_limit(self):
        ws = self._book("ku-prior", False, 26000, [1000])
        self.assertTrue(ws["B16"].value.startswith("Achtung: Vorjahresumsatz"))

    def test_above_100000_switches_immediately(self):
        ws = self._book("ku-100k", False, 20000, [40000, 40000, 15000, 6000])
        self.assertEqual(ws["C18"].value, "T-004")
        self.assertTrue(ws["B16"].value.startswith("Grenze überschritten"))


class DeadlineTest(unittest.TestCase):
    def test_easter_2027(self):
        self.assertEqual(easter(2027), date(2027, 3, 28))

    def test_weekend_and_holiday_shift(self):
        self.assertEqual(next_workday(date(2027, 1, 10)), date(2027, 1, 11))
        self.assertEqual(next_workday(date(2027, 7, 31)), date(2027, 8, 2))
        self.assertEqual(next_workday(date(2027, 5, 1)), date(2027, 5, 3))

    def test_all_deadlines_on_workdays(self):
        for d, _, _ in deadlines_2027():
            self.assertLess(d.weekday(), 5)


def tearDownModule():
    shutil.rmtree(TMP, ignore_errors=True)


if __name__ == "__main__":
    unittest.main(verbosity=2)
