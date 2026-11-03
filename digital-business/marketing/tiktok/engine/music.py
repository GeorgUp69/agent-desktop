"""Synthetisiert lizenzfreie Hintergrundmusik und Übergangsgeräusche (eigene Erzeugung, keine Samples).

Aufruf: python3 music.py <bpm> <root_midi> <dauer_s> <cuts_kommagetrennt> <ausgabe.wav> [mood]
"""
import sys
import wave

import numpy as np

SR = 44100
PROG = [(0, 'm'), (-4, 'M'), (3, 'M'), (-2, 'M')]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a=0.01, r=0.3):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a)
    tail = int(r * SR)
    if tail < n:
        e[-tail:] *= np.linspace(1, 0, tail)
    return e


def tone(freq, dur, shape='pad'):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if shape == 'pad':
        s = sum(np.sin(2 * np.pi * freq * d * t + p) for d, p in ((1, 0), (1.004, 1.3), (0.996, 2.1)))
        s += 0.25 * np.sin(2 * np.pi * freq * 2 * t)
        return s / 3.5 * env(n, 0.4, min(0.8, dur / 2))
    if shape == 'bass':
        s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(2 * np.pi * freq * 2 * t)
        return s * env(n, 0.005, 0.12) * np.exp(-t * 2.5)
    if shape == 'pluck':
        s = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 3 * t) * np.exp(-t * 8)
        return s * np.exp(-t * 6) * env(n, 0.002, 0.05)
    raise ValueError(shape)


def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def hat(rng):
    n = int(0.06 * SR)
    noise = rng.standard_normal(n)
    noise = np.diff(np.concatenate([[0], noise]))
    return noise * np.exp(-np.arange(n) / SR * 70) * 0.25


def whoosh(rng, dur=0.45):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    a = 0.0
    for i in range(n):
        k = 0.02 + 0.5 * (i / n) ** 2
        a += k * (noise[i] - a)
        out[i] = a
    return out * np.sin(np.pi * np.arange(n) / n) * 0.6


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def render(bpm, root, dur, cuts, mood=''):
    rng = np.random.default_rng(int(bpm * 100 + root))
    total = int((dur + 0.5) * SR)
    music = np.zeros(total)
    beat = 60 / bpm
    bar = beat * 4
    calm = bpm < 80
    t = 0.0
    k = 0
    while t < dur:
        off, q = PROG[k % 4]
        r = root + off
        chord = [r, r + (3 if q == 'm' else 4), r + 7, r + 12]
        for note in chord:
            add(music, tone(midi(note), bar * 1.05, 'pad') * 0.10, t)
        for b in range(4):
            bt = t + b * beat
            add(music, tone(midi(r - 24), beat * 0.9, 'bass') * (0.22 if not calm else 0.14), bt)
            if not calm:
                add(music, kick() * 0.5, bt)
                add(music, hat(rng), bt + beat / 2)
            arp = chord[(b + k) % 4] + 12
            add(music, tone(midi(arp), beat * 0.8, 'pluck') * 0.05, bt + (beat / 2 if b % 2 else 0))
        t += bar
        k += 1
    sfx = np.zeros(total)
    for c in cuts:
        add(sfx, whoosh(rng) * 0.35, max(0, c - 0.2))
    mix = music[: int(dur * SR)] + sfx[: int(dur * SR)]
    fade = int(1.2 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix[: int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
    mix = np.tanh(mix * 1.4) / np.tanh(1.4)
    peak = np.max(np.abs(mix)) or 1
    return (mix / peak * 0.8)


def write(path, sig):
    stereo = np.stack([sig, np.roll(sig, 220)], axis=1)
    data = (stereo * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


if __name__ == '__main__':
    bpm, root, dur = float(sys.argv[1]), int(sys.argv[2]), float(sys.argv[3])
    cuts = [float(x) for x in sys.argv[4].split(',') if x]
    write(sys.argv[5], render(bpm, root, dur, cuts, sys.argv[6] if len(sys.argv) > 6 else ''))
