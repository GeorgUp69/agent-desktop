"""Bundesweite Steuerfristen 2027, verschoben nach § 108 Abs. 3 AO (Wochenende, bundesweite Feiertage)."""
from datetime import date, timedelta


def easter(y):
    a = y % 19
    b, c = divmod(y, 100)
    d, e = divmod(b, 4)
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i, k = divmod(c, 4)
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return date(y, month, day)


def national_holidays(y):
    e = easter(y)
    return {
        date(y, 1, 1), e - timedelta(days=2), e + timedelta(days=1), date(y, 5, 1),
        e + timedelta(days=39), e + timedelta(days=50), date(y, 10, 3), date(y, 12, 25), date(y, 12, 26),
    }


def next_workday(d):
    hol = national_holidays(d.year)
    while d.weekday() >= 5 or d in hol:
        d += timedelta(days=1)
    return d


MONTHS = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
          "September", "Oktober", "November", "Dezember"]


def deadlines_2027():
    y = 2027
    out = []
    for m in range(1, 13):
        prev = MONTHS[(m - 2) % 12] + (" 2026" if m == 1 else "")
        out.append((next_workday(date(y, m, 10)), f"USt-Voranmeldung {prev} (monatlich, ohne Dauerfristverlängerung)",
                    "Regelbesteuerte, monatliche Abgabe"))
    for m, q in ((1, "Q4 2026"), (4, "Q1"), (7, "Q2"), (10, "Q3")):
        out.append((next_workday(date(y, m, 10)), f"USt-Voranmeldung {q} (vierteljährlich, ohne Dauerfristverlängerung)",
                    "Regelbesteuerte, vierteljährliche Abgabe"))
    for m in (3, 6, 9, 12):
        out.append((next_workday(date(y, m, 10)), "Einkommensteuer-Vorauszahlung (laut Bescheid)", "Alle mit Vorauszahlungsbescheid"))
    for m in (2, 5, 8, 11):
        out.append((next_workday(date(y, m, 15)), "Gewerbesteuer-Vorauszahlung (laut Bescheid)", "Gewerbetreibende mit Bescheid"))
    out.append((next_workday(date(y, 2, 10)), "Antrag Dauerfristverlängerung + Sondervorauszahlung 2027", "Monatliche USt-Abgabe"))
    for m in (1, 4, 7, 10):
        out.append((next_workday(date(y, m, 25)), "Zusammenfassende Meldung (vierteljährlich)", "Leistungen an Unternehmen im EU-Ausland"))
    out.append((next_workday(date(y, 7, 31)), "Steuererklärungen 2026 (ESt inkl. Anlage EÜR, USt, GewSt) ohne Steuerberatung",
                "Alle Selbstständigen (§ 149 Abs. 2 AO)"))
    out.sort(key=lambda t: t[0])
    return out


def to_ics(items):
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Freikontor//Steuerfristen 2027//DE", "CALSCALE:GREGORIAN",
             "X-WR-CALNAME:Steuerfristen 2027 (Freikontor)"]
    for i, (d, what, who) in enumerate(items):
        nxt = d + timedelta(days=1)
        lines += [
            "BEGIN:VEVENT",
            f"UID:freikontor-2027-{i}@freikontor.invalid",
            "DTSTAMP:20261103T000000Z",
            f"DTSTART;VALUE=DATE:{d:%Y%m%d}",
            f"DTEND;VALUE=DATE:{nxt:%Y%m%d}",
            "SUMMARY:" + what.replace(",", "\\,"),
            "DESCRIPTION:" + ("Betrifft: " + who + ". Frist auf Werktag verschoben. Regionale Feiertage selbst prüfen.").replace(",", "\\,"),
            "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", "DESCRIPTION:Steuerfrist in 3 Tagen", "END:VALARM",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"
