import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
RNG = np.random.default_rng(1)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), 'low', output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f / (SR / 2), 'high', output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x, axis=0)


def env_points(times, points, length):
    ts = [p[0] for p in points]
    vs = [p[1] for p in points]
    return np.interp(np.arange(length) / SR, ts, vs)


def smooth(x, tau):
    a = np.exp(-1.0 / (tau * SR))
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x)


def reverb_ir(dur=2.6, decay=2.2, bright=6000, seed=3, stereo=True):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    chans = []
    for c in range(2 if stereo else 1):
        noise = r.standard_normal(n) * np.exp(-t * 6.9 / decay)
        noise = lp(noise, bright)
        noise[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        chans.append(noise / np.sqrt(np.sum(noise ** 2)))
    return np.stack(chans, 1)


def convolve_stereo(x, ir):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    out = np.stack([fftconvolve(x[:, c], ir[:, c]) for c in range(2)], 1)
    return out[: len(x)]


def place(dst, src, start):
    i = int(round(start * SR))
    if i < 0:
        src = src[-i:]
        i = 0
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n]


def stereo(x, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    return np.stack([x * l * 1.414, x * r * 1.414], 1)


def db(x):
    return 10 ** (x / 20)
