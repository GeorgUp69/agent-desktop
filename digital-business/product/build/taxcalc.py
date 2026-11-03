"""Unabhängige Referenzimplementierung der Rücklage-Logik.

Wird von den Tests genutzt, um die Excel-Formeln (nach Neuberechnung durch
LibreOffice) gegen eine zweite, getrennt geschriebene Berechnung zu prüfen.
"""
import math

from params import TAX_PARAMS, COMMON


def tarif(x, year):
    """Einkommensteuer nach § 32a Abs. 1 EStG für ein zvE x (volle Euro)."""
    p = TAX_PARAMS[year]
    x = math.floor(x)
    if x <= p["gfb"]:
        return 0
    if x <= p["z2"]:
        y = (x - p["gfb"]) / 10000
        return math.floor((p["a2"] * y + p["b2"]) * y)
    if x <= p["z3"]:
        z = (x - p["z2"]) / 10000
        return math.floor((p["a3"] * z + p["b3"]) * z + p["c3"])
    if x <= p["z4"]:
        return math.floor(0.42 * x - p["c4"])
    return math.floor(0.45 * x - p["c5"])


def est(zve, year, splitting):
    zve = max(0, math.floor(zve))
    if splitting:
        return 2 * tarif(math.floor(zve / 2), year)
    return tarif(zve, year)


def soli(base, year, splitting):
    fg = TAX_PARAMS[year]["soli_fg"] * (2 if splitting else 1)
    if base <= fg:
        return 0.0
    v = min(base * COMMON["soli_satz"], (base - fg) * COMMON["soli_mild"])
    return math.floor(v * 100) / 100


def scenario(gewinn, andere, sonderausgaben, year, splitting, gewerbe, hebesatz, kist_rate):
    zve = max(0, math.floor(gewinn + andere - sonderausgaben))
    e = est(zve, year, splitting)
    if gewerbe:
        ertrag = math.floor(max(0, gewinn) / 100) * 100
        mess = max(0, ertrag - COMMON["gew_fb"]) * COMMON["gew_mz"]
        gew = mess * hebesatz
        anr = min(COMMON["gew_faktor"] * mess, gew, e)
    else:
        mess = gew = anr = 0
    base = e - anr
    s = soli(base, year, splitting)
    k = math.floor(base * kist_rate * 100) / 100
    return {"zve": zve, "est": e, "gewst": gew, "anrechnung": anr, "est_fest": base,
            "soli": s, "kist": k, "summe": base + s + k + gew}
