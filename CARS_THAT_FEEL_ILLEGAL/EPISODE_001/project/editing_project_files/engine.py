"""Physically-inspired flat-plane twin-turbo V8 synthesizer.

Firing: 8 cylinders over 720 deg -> 4 firing pulses per crank revolution.
Flat-plane crank alternates banks every firing, so pulses alternate L/R exhaust.
Rev limit 8500 rpm (Koenigsegg spec). Turbo whine follows lagged boost.
"""
import numpy as np
from scipy.signal import fftconvolve, lfilter
from dsp import SR, lp, hp, bp, smooth, stereo, db

rng = np.random.default_rng(7)


def damped(freqs_decays, dur=0.08):
    t = np.arange(int(dur * SR)) / SR
    ir = np.zeros_like(t)
    for f, d, a in freqs_decays:
        ir += a * np.sin(2 * np.pi * f * t) * np.exp(-t / d)
    return ir / np.max(np.abs(ir))


IR_DARK = damped([(88, 0.030, 1.0), (176, 0.020, 0.7), (310, 0.012, 0.45), (620, 0.006, 0.25)])
IR_BRIGHT = damped([(110, 0.022, 0.8), (260, 0.016, 0.9), (540, 0.010, 0.8), (1150, 0.006, 0.6), (2400, 0.003, 0.35)])
IR_POP = damped([(180, 0.010, 1.0), (900, 0.006, 0.8), (2800, 0.002, 0.6)], 0.04)


def keyframes(points, n):
    ts = np.array([p[0] for p in points])
    rpm = np.array([p[1] for p in points])
    load = np.array([p[2] for p in points])
    t = np.arange(n) / SR
    r = np.interp(t, ts, rpm)
    l = np.interp(t, ts, load)
    return smooth(r, 0.03), smooth(l, 0.02)


def render(points, dur, pops=0.0, level=1.0):
    n = int(dur * SR)
    rpm, load = keyframes(points, n)
    rev = np.cumsum(rpm / 60.0) / SR
    fire_phase = rev * 4.0
    idx = np.nonzero(np.diff(np.floor(fire_phase)) > 0)[0] + 1
    cyl_var = 1.0 + 0.10 * rng.standard_normal(8)
    trains = {k: np.zeros((n, 2)) for k in ("dark", "bright")}
    for k, i in enumerate(idx):
        c = k % 8
        bank = 1 if k % 2 else -1
        amp = cyl_var[c] * (0.25 + 0.75 * load[i]) * (0.6 + 0.4 * rpm[i] / 8500) * (1 + 0.05 * rng.standard_normal())
        g = np.array([0.62 if bank < 0 else 0.38, 0.38 if bank < 0 else 0.62])
        trains["dark"][i] += amp * (1.0 - 0.5 * load[i]) * g
        trains["bright"][i] += amp * (0.25 + 0.9 * load[i] * rpm[i] / 8500) * g
    out = np.zeros((n, 2))
    for c in range(2):
        out[:, c] = fftconvolve(trains["dark"][:, c], IR_DARK)[:n] + fftconvolve(trains["bright"][:, c], IR_BRIGHT)[:n]
    fire_env = np.zeros(n)
    fire_env[idx] = 1.0
    fire_env = lfilter([1], [1, -np.exp(-1 / (0.004 * SR))], fire_env)
    combustion = bp(rng.standard_normal(n), 300, 5000) * fire_env * (0.15 + 0.5 * load)
    out += np.stack([combustion, combustion], 1) * 0.6
    mech = bp(rng.standard_normal(n), 1500, 7000) * 0.025 * (rpm / 8500)
    out += np.stack([mech, mech[::-1]], 1)
    boost = smooth(np.clip(load * (rpm - 2000) / 6500, 0, 1), 0.35)
    tphase = np.cumsum(2200 + 5200 * boost) / SR
    whine = (np.sin(2 * np.pi * tphase) + 0.3 * np.sin(4 * np.pi * tphase)) * boost ** 1.5 * 0.055
    out += np.stack([whine, whine], 1)
    lift = np.clip(-np.gradient(load) * SR * 0.05, 0, 1)
    lift_env = lfilter([1], [1, -np.exp(-1 / (0.5 * SR))], lift) * smooth(boost, 0.05)
    lift_env = np.clip(lift_env, 0, 1)
    flutter = bp(rng.standard_normal(n), 900, 4500) * lift_env * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 17 * np.arange(n) / SR)))
    out += np.stack([flutter, flutter], 1) * 0.35
    if pops > 0:
        overrun = (load < 0.08) & (rpm > 2500)
        cand = idx[overrun[idx]]
        pick = cand[rng.random(len(cand)) < pops]
        ptrain = np.zeros(n)
        ptrain[pick] = rng.uniform(0.6, 1.4, len(pick))
        p = fftconvolve(ptrain, IR_POP)[:n]
        pan = rng.uniform(-0.4, 0.4)
        out += stereo(p, pan) * 0.9
    out = np.tanh(out * 1.6) / 1.6
    out = hp(out, 28)
    return out * level, rpm, load


def starter(dur=0.75):
    n = int(dur * SR)
    t = np.arange(n) / SR
    whirr = (np.sin(2 * np.pi * 410 * t) * 0.3 + bp(rng.standard_normal(n), 300, 2500) * 0.6)
    chug = 0.55 + 0.45 * np.sin(2 * np.pi * 11.5 * t) ** 2
    e = np.minimum(t / 0.05, 1) * np.minimum((dur - t) / 0.05, 1)
    x = whirr * chug * e * 0.12
    return np.stack([x, x], 1)


def doppler(sig, dur_pass, speed=60.0, closest=9.0, tc=None):
    n = len(sig)
    t = np.arange(n) / SR
    tc = dur_pass / 2 if tc is None else tc
    x = speed * (t - tc)
    r = np.sqrt(x ** 2 + closest ** 2)
    delay = r / 343.0
    src_t = t - delay + delay.min()
    mono = sig.mean(1)
    warped = np.interp(src_t, t, mono)
    amp = closest / r
    air = np.clip(r / 120, 0, 1)
    dark = lp(warped, 1200)
    warped = warped * (1 - air) + dark * air
    pan = np.clip(x / 25, -1, 1)
    l = np.cos((pan + 1) * np.pi / 4) * 1.414
    rr = np.sin((pan + 1) * np.pi / 4) * 1.414
    return np.stack([warped * amp * l, warped * amp * rr], 1)
