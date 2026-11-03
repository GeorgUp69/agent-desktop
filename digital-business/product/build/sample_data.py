"""Fiktive Beispieldaten. Alle Namen und Beträge sind erfunden und dienen nur der Demonstration."""
import random
from datetime import date, timedelta

R = random.Random(2026)


def _d(m, day):
    return date(2026, m, min(day, 28))


def sample_ku():
    income = []
    clients = ["Café Morgenrot (fiktiv)", "Yoga Loft (fiktiv)", "Bäckerei Korn (fiktiv)", "Atelier Nord (fiktiv)",
               "Kanzlei Weber (fiktiv)", "Startup Flux (fiktiv)"]
    jobs = ["Logo-Design", "Social-Media-Grafiken", "Flyer & Print", "Website-Bilder", "Visitenkarten", "Brand-Workshop"]
    n = 1
    for m in range(1, 11):
        for _ in range(R.randint(2, 3)):
            inv = _d(m, R.randint(1, 26))
            amt = R.choice([450, 600, 780, 820, 950, 1100, 1250])
            paid = inv + timedelta(days=R.randint(5, 20))
            if m == 10 and n % 2 == 0:
                paid = None
            if paid and paid.year > 2026:
                paid = None
            income.append([inv, f"2026-{n:03d}", R.choice(clients), R.choice(jobs), "Umsatzerlöse", amt, 0, paid, None])
            n += 1
    income.append([date(2026, 9, 2), f"2026-{n:03d}", "Kanzlei Weber (fiktiv)", "Geschäftsausstattung", "Umsatzerlöse",
                   690, 0, None, 14])
    exp = []
    for m in range(1, 11):
        exp.append([_d(m, 3), f"A{m:02d}-1", "Adobe Systems Software Ireland (fiktiver Beleg)", "Creative Cloud",
                    "Software, Lizenzen & Cloud", 71.39, 0, "Ja", ""])
        exp.append([_d(m, 5), f"A{m:02d}-2", "Telekom (fiktiver Beleg)", "Mobilfunk, 50 % betrieblich",
                    "Telefon & Internet", 22.50, 0.19, None, "Anteil geschätzt"])
        if m % 2 == 0:
            exp.append([_d(m, 12), f"A{m:02d}-3", "Meta Platforms Ireland (fiktiver Beleg)", "Instagram-Werbung",
                        "Werbung & Marketing", R.choice([60, 80, 120]), 0, "Ja", "§ 13b"])
    exp += [
        [date(2026, 2, 14), "A02-9", "Elektromarkt (fiktiv)", "Grafiktablett", "Geringwertige Wirtschaftsgüter (bis 800 € netto)", 349.00, 0.19, None, ""],
        [date(2026, 4, 9), "A04-9", "Restaurant Linde (fiktiv)", "Kundengespräch Café Morgenrot", "Bewirtung (70 % abzugsfähig)", 64.80, 0.19, None, "Anlass notiert"],
        [date(2026, 6, 20), "A06-9", "Online-Akademie (fiktiv)", "Kurs Typografie", "Fortbildung & Fachliteratur", 189.00, 0.19, None, ""],
        [date(2026, 7, 13), "A07-9", "Finanzamt", "§ 13b-Steuer Q2", "Umsatzsteuer-Zahlung an das Finanzamt", 61.20, 0, None, ""],
    ]
    return {
        "settings": {"C6": "Beispiel A: Lena, Grafikdesign nebenberuflich (fiktiv)", "C7": "Kleinunternehmer (§ 19 UStG)",
                     "C12": 19400, "C17": 38000, "C18": 7600, "C22": 900, "C21": 10},
        "income": income, "expenses": exp,
        "liquidity": {f"{c}11": 300 for c in "CDEFGHIJKLMN"},
    }


def sample_regel():
    income = []
    clients = ["Möbelhaus Ahorn GmbH (fiktiv)", "Fahrradwerk Süd (fiktiv)", "Weingut am Hang (fiktiv)",
               "Praxis Dr. Klar (fiktiv)", "Agentur Blau (fiktiv)"]
    jobs = ["Performance-Marketing Retainer", "Kampagnen-Setup", "Landingpage", "SEO-Audit", "Reporting"]
    n = 1
    for m in range(1, 11):
        for _ in range(R.randint(3, 4)):
            inv = _d(m, R.randint(1, 25))
            amt = R.choice([1200, 1800, 2200, 2500, 3100])
            paid = inv + timedelta(days=R.randint(7, 30))
            if paid.year > 2026 or (m == 10 and n % 3 == 0):
                paid = None
            income.append([inv, f"RE-26-{n:03d}", R.choice(clients), R.choice(jobs), "Umsatzerlöse", amt, 0.19, paid, 14])
            n += 1
    income.append([date(2026, 5, 6), f"RE-26-{n:03d}", "Studio Vienna GmbH (fiktiv, AT)", "Kampagnen-Setup",
                   "Umsatzerlöse ohne deutsche USt (Ausland / Reverse Charge)", 2400, 0, date(2026, 5, 20), 14])
    exp = []
    for m in range(1, 11):
        exp.append([_d(m, 1), f"B{m:02d}-1", "Coworking Hafen (fiktiv)", "Schreibtischmiete", "Miete / Raumkosten", 297.50, 0.19, None, ""])
        exp.append([_d(m, 4), f"B{m:02d}-2", "Google Ireland (fiktiver Beleg)", "Workspace", "Software, Lizenzen & Cloud", 16.80, 0, "Ja", ""])
        exp.append([_d(m, 8), f"B{m:02d}-3", "Freelancerin Texte (fiktiv)", "Texterstellung", "Fremdleistungen / Subunternehmer",
                    R.choice([595.00, 714.00, 952.00]), 0.19, None, ""])
        exp.append([_d(m, 10), f"B{m:02d}-4", "Finanzamt", "USt-Vorauszahlung Vormonat", "Umsatzsteuer-Zahlung an das Finanzamt",
                    R.choice([980, 1150, 1320, 1410]), 0, None, ""])
        exp.append([_d(m, 15), f"B{m:02d}-5", "Leasing-Partner (fiktiv)", "Leasingrate Pkw (betrieblicher Anteil)", "Fahrzeugkosten",
                    309.40, 0.19, None, ""])
    exp += [
        [date(2026, 3, 2), "B03-9", "IT-Versand (fiktiv)", "Notebook", "Abschreibung (AfA, Jahresbetrag)", 1428.00, 0.19, None, "Jahres-AfA vereinfacht"],
        [date(2026, 3, 20), "B03-8", "IHK (fiktiver Beleg)", "Beitrag 2026", "Beiträge (Kammer, Verbände)", 150.00, 0, None, ""],
        [date(2026, 5, 22), "B05-9", "Restaurant Hafen (fiktiv)", "Kundenessen Fahrradwerk", "Bewirtung (70 % abzugsfähig)", 142.80, 0.19, None, ""],
        [date(2026, 6, 30), "B06-9", "Steuerbüro (fiktiv)", "Jahresabschluss 2025", "Beratung & Steuerberatung", 1190.00, 0.19, None, ""],
        [date(2026, 9, 12), "B09-9", "Konferenz Online-Marketing (fiktiv)", "Ticket", "Fortbildung & Fachliteratur", 476.00, 0.19, None, ""],
    ]
    return {
        "settings": {"C6": "Beispiel B: Jonas, Online-Marketing gewerblich (fiktiv)", "C7": "Regelbesteuerung",
                     "C9": "Gewerblich (Gewerbesteuer)", "C10": 4.1, "C12": 61000, "C15": "Zusammenveranlagung (Splitting)",
                     "C16": "9 %", "C17": 30000, "C18": 14500, "C19": 6000, "C22": 9000, "C21": 10},
        "income": income, "expenses": exp,
        "liquidity": {f"{c}11": 3500 for c in "CDEFGHIJKLMN"},
    }


SAMPLES = {"A-Kleinunternehmerin": sample_ku(), "B-Regelbesteuert-Gewerbe": sample_regel()}
