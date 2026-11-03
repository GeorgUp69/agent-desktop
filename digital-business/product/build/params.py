"""Steuerparameter je Veranlagungsjahr. Quellen siehe legal/rechtliche-anforderungen.md, Abschnitt Steuerwerte."""

TAX_PARAMS = {
    2025: {
        "gfb": 12096, "z2": 17443, "a2": 932.30, "b2": 1400,
        "z3": 68480, "a3": 176.64, "b3": 2397, "c3": 1015.13,
        "z4": 277825, "c4": 10911.92, "c5": 19246.67,
        "soli_fg": 19950,
    },
    2026: {
        "gfb": 12348, "z2": 17799, "a2": 914.51, "b2": 1400,
        "z3": 69878, "a3": 173.10, "b3": 2397, "c3": 1034.87,
        "z4": 277825, "c4": 11135.63, "c5": 19470.38,
        "soli_fg": 20350,
    },
}

COMMON = {
    "soli_satz": 0.055, "soli_mild": 0.119,
    "gew_fb": 24500, "gew_mz": 0.035, "gew_faktor": 4.0,
    "ku_vj": 25000, "ku_lj": 100000,
}
