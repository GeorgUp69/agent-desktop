"""Original score: dark cinematic electronic, 100 BPM, D minor. Fully synthesized here."""
import numpy as np
from dsp import SR, lp, hp, bp, reverb_ir, convolve_stereo, place, stereo, t_axis, db
from timeline import TOTAL, BEAT, GRID0

rng = np.random.default_rng(11)
BAR = BEAT * 4
N = int(TOTAL * SR)
PROG = [[38, 50, 53, 57, 62], [34, 46, 50, 53, 58], [31, 43, 46, 50, 55], [33, 45, 49, 52, 57]]


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, t, phase=0.0):
    return 2 * ((f * t + phase) % 1.0) - 1


def adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    if nd and na < n:
        e[na:na + nd] = np.linspace(1, s, len(e[na:na + nd]))
    if nr:
        e[-nr:] *= np.linspace(1, 0, len(e[-nr:]))
    return e


def supersaw(m, dur, cutoff, voices=7, detune=0.12):
    t = t_axis(dur)
    f = mtof(m)
    l = np.zeros_like(t)
    r = np.zeros_like(t)
    for v in range(voices):
        d = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune
        fv = f * 2 ** (d / 12)
        s = saw(fv, t, rng.random())
        pan = (v / (voices - 1)) * 2 - 1
        l += s * (1 - pan) / 2
        r += s * (1 + pan) / 2
    x = np.stack([l, r], 1) / voices
    return lp(x, cutoff, 2)


def kick(level=1.0):
    t = t_axis(0.6)
    f = 45 + 110 * np.exp(-t * 28)
    ph = np.cumsum(f) / SR
    x = np.sin(2 * np.pi * ph) * np.exp(-t * 6.5)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 300) * 0.25
    return stereo(np.tanh((x + click) * 1.8) * 0.8 * level)


def snare(level=1.0):
    t = t_axis(0.5)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.5
    noise = bp(rng.standard_normal(len(t)), 1200, 9000) * np.exp(-t * 14)
    return stereo((body + noise) * 0.45 * level)


def hat(open_=False, level=1.0):
    t = t_axis(0.35 if open_ else 0.06)
    x = hp(rng.standard_normal(len(t)), 7500) * np.exp(-t * (9 if open_ else 70))
    return stereo(x * 0.16 * level, rng.uniform(-0.3, 0.3))


def tick(level=1.0):
    t = t_axis(0.05)
    x = np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 160) + bp(rng.standard_normal(len(t)), 4000, 9000) * np.exp(-t * 200) * 0.4
    return stereo(x * 0.10 * level, 0.25)


def tom(m, level=1.0):
    t = t_axis(0.7)
    f = mtof(m) * (1 + 0.6 * np.exp(-t * 18))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)
    return stereo(np.tanh(x * 1.5) * 0.5 * level)


def bass_note(m, dur, cutoff=420, level=1.0):
    t = t_axis(dur)
    f = mtof(m)
    x = 0.65 * np.sin(2 * np.pi * f * t) + 0.35 * lp(saw(f, t), cutoff)
    return stereo(np.tanh(x * 1.4) * adsr(len(t), 0.004, 0.08, 0.7, 0.03) * 0.42 * level)


def pluck(m, dur, cutoff, level=1.0):
    t = t_axis(dur)
    f = mtof(m)
    x = saw(f, t) + saw(f * 1.006, t, 0.3)
    e = np.exp(-t * 9)
    x = lp(x * e, cutoff)
    return stereo(x * 0.11 * level, rng.uniform(-0.5, 0.5))


def section(t):
    for name, start, end in [("A", 0, 5.45), ("B", 5.45, 16.75), ("C", 16.75, 29.65), ("D", 29.65, 45.55),
                             ("E", 45.55, 62.75), ("F", 62.75, 76.3), ("G", 76.3, TOTAL + 1)]:
        if start <= t < end:
            return name
    return "G"


def build():
    dry = np.zeros((N, 2))
    wet_send = np.zeros((N, 2))
    pads = np.zeros((N, 2))
    nbars = int((TOTAL - GRID0) / BAR) + 2
    for b in range(-1, nbars):
        t0 = GRID0 + b * BAR
        chord = PROG[b % 4] if b >= 0 else PROG[0]
        sec = section(max(t0, 0))
        cutoff = {"A": 380, "B": 900, "C": 1300, "D": 1700, "E": 2300, "F": 3600, "G": 1100}[sec]
        lvl = {"A": 0.55, "B": 0.7, "C": 0.75, "D": 0.8, "E": 0.85, "F": 1.0, "G": 0.8}[sec]
        pad = sum(supersaw(m + 12, BAR + 0.6, cutoff) for m in chord[1:]) * 0.12 * lvl
        pad *= adsr(len(pad), 0.5 if sec in "AG" else 0.15, 0.3, 0.85, 0.6)[:, None]
        place(pads, pad, t0)
        sub = stereo(np.sin(2 * np.pi * mtof(chord[0]) * t_axis(BAR + 0.1)) * 0.22 * adsr(int((BAR + 0.1) * SR), 0.2, 0.1, 1, 0.1))
        place(dry, sub * (0.7 if sec in "AB" else 0.45), t0)
        for s in range(16):
            ts = t0 + s * BEAT / 4
            if ts < 0 or ts > TOTAL:
                continue
            sec = section(ts)
            beat_i, sub_i = divmod(s, 4)
            if sec in "AB" and sub_i % 2 == 0:
                place(dry, tick(0.7 if sub_i == 0 else 0.4), ts)
            if sec == "B" and s == 0:
                place(dry, kick(0.8), ts)
            if sec in "CD" and s in (0, 10):
                place(dry, kick(0.9), ts)
            if sec in "EF" and sub_i == 0:
                place(dry, kick(1.0), ts)
            if sec == "C" and s == 8:
                k = snare(0.8); place(dry, k, ts); place(wet_send, k * 0.6, ts)
            if sec in "DEF" and s in (4, 12):
                k = snare(0.9 if sec == "D" else 1.0); place(dry, k, ts); place(wet_send, k * 0.5, ts)
            if sec in "CD" and sub_i == 2:
                place(dry, hat(level=0.8), ts)
            if sec == "D" and sub_i in (1, 3):
                place(dry, hat(level=0.35), ts)
            if sec in "EF":
                place(dry, hat(open_=(sub_i == 2), level=0.9 if sub_i == 2 else 0.45), ts)
            if sec in "CDEF":
                if (sec in "CD" and sub_i in (0, 2)) or (sec in "EF"):
                    root = chord[0] + (12 if (sec in "EF" and sub_i == 2) else 0)
                    place(dry, bass_note(root, BEAT / 4 * (2 if sec in "CD" else 1) * 0.92, 380 if sec != "F" else 700), ts)
            if sec in "DEF":
                arp_notes = [chord[2], chord[3], chord[4], chord[3] + 12, chord[2] + 12, chord[4], chord[3], chord[1] + 12]
                m = arp_notes[s % 8] + 12
                p = pluck(m, 0.35, {"D": 1800, "E": 2800, "F": 4200}[sec], 0.9 if sec != "D" else 0.7)
                place(dry, p * 0.6, ts); place(wet_send, p * 0.8, ts)
            if sec == "G" and s in (0, 6, 12):
                p = pluck(chord[4] + 12 - (0 if s == 0 else 5 if s == 6 else 2), 1.2, 1400, 0.9)
                place(dry, p, ts); place(wet_send, p * 1.2, ts)
            if sec == "F" and b % 4 == 3 and s in (12, 13, 14, 15):
                place(dry, tom(45 - (s - 12) * 3, 0.9), ts)
    place(wet_send, pads, 0)
    wet = convolve_stereo(wet_send, reverb_ir(3.2, 2.8, 5000))
    mix = dry + pads * 0.9 + wet * 0.55
    t = np.arange(N) / SR
    gain = np.ones(N)
    for a, b, g in [(13.45, 16.7, db(-9)), (27.05, 29.6, db(-8)), (62.2, 62.75, db(-30)), (43.3, 45.5, db(-4))]:
        m = (t >= a) & (t < b)
        gain[m] = g
    from dsp import smooth
    gain = smooth(gain, 0.06)
    mix *= gain[:, None]
    fade = np.clip((TOTAL - t) / 3.5, 0, 1)
    mix *= fade[:, None]
    return mix


if __name__ == "__main__":
    import soundfile as sf, sys
    m = build()
    sf.write(sys.argv[1], (m / np.max(np.abs(m)) * 0.89).astype(np.float32), SR, subtype="FLOAT")
    print("music", m.shape, np.max(np.abs(m)))
