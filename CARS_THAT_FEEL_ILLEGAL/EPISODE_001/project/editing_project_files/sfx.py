"""Engine track and sound effects, all synthesized."""
import numpy as np
from dsp import SR, lp, hp, bp, reverb_ir, convolve_stereo, place, stereo, t_axis, db, smooth
from timeline import TOTAL, ENGINE_EVENTS as E, IMPACTS, WHOOSHES
import engine

rng = np.random.default_rng(23)
N = int(TOTAL * SR)


def impact(level=1.0, big=False):
    t = t_axis(3.0 if big else 2.2)
    f = 32 + 95 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (1.6 if big else 2.4))
    crack = bp(rng.standard_normal(len(t)), 200, 6000) * np.exp(-t * 22) * 0.45
    x = np.tanh((boom + crack) * 1.6) * 0.8
    return stereo(x * level)


def whoosh(dur=0.9, level=1.0, direction=1):
    t = t_axis(dur)
    n = len(t)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    centers = np.geomspace(300, 4500, 24) if direction > 0 else np.geomspace(4500, 300, 24)
    seg = n // 24
    for i, c in enumerate(centers):
        sl = slice(i * seg, (i + 1) * seg + seg)
        out[sl] += bp(noise[sl], c * 0.7, min(c * 1.4, 20000))[: len(out[sl])] * np.hanning(len(out[sl]))
    env = np.sin(np.pi * t / dur) ** 2
    pan = np.linspace(-0.7, 0.7, n) * direction
    x = out * env * 0.22 * level
    return np.stack([x * np.cos((pan + 1) * np.pi / 4) * 1.4, x * np.sin((pan + 1) * np.pi / 4) * 1.4], 1)


def riser(dur, level=1.0):
    t = t_axis(dur)
    noise = rng.standard_normal(len(t))
    env = (t / dur) ** 2.2
    x = np.zeros(len(t))
    steps = 30
    seg = len(t) // steps
    for i in range(steps):
        c = 400 * (12000 / 400) ** (i / steps)
        sl = slice(i * seg, min((i + 2) * seg, len(t)))
        x[sl] += bp(noise[sl], c * 0.6, min(c * 1.3, 22000)) * np.hanning(len(x[sl]))
    tone_f = 110 * 2 ** (3 * t / dur)
    tone = np.sin(2 * np.pi * np.cumsum(tone_f) / SR) * 0.3
    return stereo((x * 0.2 + tone * 0.15) * env * level)


def mech_ambience(dur):
    t = t_axis(dur)
    hum = (np.sin(2 * np.pi * 50 * t) * 0.3 + np.sin(2 * np.pi * 100 * t) * 0.15) * 0.05
    air = lp(rng.standard_normal(len(t)), 500) * 0.06
    clinks = np.zeros(len(t))
    for c in rng.uniform(0, dur, int(dur * 0.8)):
        i = int(c * SR)
        k = np.sin(2 * np.pi * rng.uniform(1800, 4200) * t_axis(0.25)) * np.exp(-t_axis(0.25) * 30) * 0.05
        clinks[i:i + len(k)] += k[: len(clinks[i:i + len(k)])]
    return np.stack([hum + air + clinks, hum + air[::-1] + clinks * 0.6], 1)


def engine_track():
    track = np.zeros((N, 2))
    place(track, engine.starter(0.75) * 0.9, E["starter"])
    s = E["fire"]
    startup, _, _ = engine.render([(0, 220, 0.2), (0.08, 900, 0.9), (0.32, 3200, 0.75), (0.55, 2200, 0.05), (1.05, 1100, 0.12),
                                   (1.50, 1100, 0.12), (1.80, 5800, 1.0), (1.90, 5800, 0.0), (2.40, 1150, 0.10), (13.0, 1100, 0.12)],
                                  13.0, pops=0.25)
    duck = np.ones(len(startup))
    tt = np.arange(len(startup)) / SR
    duck = np.where(tt > 2.55, db(-17), 1.0)
    duck = smooth(duck, 0.25)
    place(track, startup * 0.85 * duck[:, None], s)
    rev, _, _ = engine.render([(0, 1100, 0.15), (0.12, 1300, 1.0), (1.05, 8500, 1.0), (1.12, 8250, 1.0), (1.2, 8500, 1.0), (1.28, 8300, 1.0),
                               (1.34, 8450, 0.0), (2.2, 1300, 0.05), (3.3, 1100, 0.10)], 3.3, pops=0.45)
    rev *= np.clip((3.3 - np.arange(len(rev)) / SR) / 0.8, 0, 1)[:, None]
    place(track, rev * 1.0, E["big_rev"])
    fly, _, _ = engine.render([(0, 6400, 1.0), (0.9, 8200, 1.0), (0.95, 8200, 0.2), (1.0, 6300, 1.0), (2.4, 7900, 1.0), (2.5, 7900, 0.0), (3.0, 4000, 0.0)],
                              3.0, pops=0.2)
    place(track, engine.doppler(fly, 3.0, speed=55, closest=7, tc=1.25) * 1.6, E["flyby"])
    pull, _, _ = engine.render([(0, 2600, 0.6), (0.1, 3000, 1.0), (0.6, 8400, 1.0), (0.64, 8400, 0.3), (0.68, 6500, 1.0), (1.05, 7900, 1.0),
                                (1.12, 7900, 0.0), (2.0, 2500, 0.0)], 2.0, pops=0.3)
    pe = np.ones(len(pull))
    pt = np.arange(len(pull)) / SR
    pe = smooth(np.where(pt > 1.0, db(-12), 1.0), 0.15) * np.clip((2.0 - pt) / 0.5, 0, 1)
    place(track, pull * pe[:, None], E["pull"])
    fin, _, _ = engine.render([(0, 1100, 0.1), (0.1, 1200, 1.0), (0.65, 8400, 1.0), (0.72, 8400, 0.0), (1.6, 1500, 0.0), (3.6, 1000, 0.05)],
                              3.6, pops=0.5)
    fin *= np.clip((3.6 - np.arange(len(fin)) / SR) / 1.6, 0, 1)[:, None]
    place(track, fin * 0.95, E["final_rev"])
    room = reverb_ir(1.4, 1.1, 4000, seed=9)
    track = track + convolve_stereo(track, room) * 0.18
    return track


def sfx_track():
    track = np.zeros((N, 2))
    for i, t in enumerate(IMPACTS):
        big = i in (0, 5, 6)
        place(track, impact(1.0 if big else 0.6, big), t)
    for i, t in enumerate(WHOOSHES):
        place(track, whoosh(0.8, 0.8, 1 if i % 2 else -1), t - 0.4)
    place(track, riser(3.3, 0.8), 59.45)
    place(track, riser(2.0, 0.5), 3.4)
    place(track, mech_ambience(5.6) * 0.8, 0.0)
    place(track, mech_ambience(9.0) * 0.5, 63.0)
    place(track, mech_ambience(11.5) * 0.6, 76.5)
    t = np.arange(N) / SR
    open_ = np.clip(t / 0.25, 0, 1)
    track *= open_[:, None]
    verb = reverb_ir(2.4, 2.0, 7000, seed=4)
    return track + convolve_stereo(track, verb) * 0.25


if __name__ == "__main__":
    import soundfile as sf, sys
    e = engine_track()
    s = sfx_track()
    sf.write(sys.argv[1], e.astype(np.float32), SR, subtype="FLOAT")
    sf.write(sys.argv[2], s.astype(np.float32), SR, subtype="FLOAT")
    print("engine peak", np.max(np.abs(e)), "sfx peak", np.max(np.abs(s)))
