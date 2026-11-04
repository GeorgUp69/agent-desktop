import sys, json, math, subprocess, os
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, uniform_filter1d
import soundfile as sf
from shots import SHOTS, CREDITS, STUDIO, FLASH_AT
from timeline import TOTAL, FPS
import graphics

Image.MAX_IMAGE_PIXELS = None
W, H = 1080, 1920
NF = int(round(TOTAL * FPS))
_cache = {}


def plate(name):
    if name not in _cache:
        img = Image.open(f"plates/{name}_plate.png").convert("RGB")
        m = None
        if os.path.exists(f"plates/{name}_platemask.png"):
            m = Image.open(f"plates/{name}_platemask.png").convert("L")
        meta = json.load(open(f"plates/{name}_plate.json"))
        top = None
        if name == "p5":
            a = np.asarray(m) > 128
            cols = np.arange(a.shape[1])
            has = a.any(0)
            top = np.where(has, a.argmax(0), -1).astype(np.float32)
            valid = top >= 0
            top = np.interp(cols, cols[valid], top[valid])
            top = gaussian_filter(top, 25)
            x0, x1 = cols[valid].min(), cols[valid].max()
            top[:x0] = top[x0]
            top[x1:] = top[x1]
            top = (top, x0, x1)
        _cache[name] = (img, m, meta, top)
    return _cache[name]


def engine_env():
    x, sr = sf.read("stems/engine.wav")
    x = np.abs(x).mean(1)
    hop = sr // FPS
    env = np.array([np.sqrt(np.mean(x[i * hop:(i + 1) * hop] ** 2) + 1e-12) for i in range(NF)])
    env = env / env.max()
    return env


ENV = engine_env()
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
VIGNETTE = np.clip(1 - (((XX - W / 2) / (W * 0.75)) ** 2 + ((YY - H * 0.48) / (H * 0.62)) ** 2) ** 1.3 * 0.55, 0.25, 1)[..., None]
RNG = np.random.default_rng(5)
GRAIN = [gaussian_filter(RNG.standard_normal((H, W)).astype(np.float32), 0.7) for _ in range(6)]


def cam_at(shot, t):
    u = (t - shot["t0"]) / (shot["t1"] - shot["t0"])
    u = min(max(u, 0), 1.15)
    e = 0.5 * u + 0.5 * (0.5 - 0.5 * math.cos(math.pi * min(u, 1)))
    c = [a + (b - a) * e for a, b in zip(shot["c0"], shot["c1"])]
    return c


def shake_offset(fi, amount):
    if amount <= 0:
        return 0.0, 0.0
    e = ENV[fi] ** 1.5 * amount
    return (math.sin(fi * 2.1) + 0.6 * math.sin(fi * 5.3)) * 14 * e, (math.cos(fi * 1.7) + 0.5 * math.sin(fi * 4.1)) * 10 * e


PLATE_GRADE = {"p1": ((0.86, 0.90, 1.0), 1.05), "p2": ((0.74, 0.76, 0.80), 1.12), "p4": ((0.76, 0.78, 0.82), 1.12),
               "p5": ((1.0, 1.0, 1.0), 1.0), "p8": ((0.95, 0.95, 0.97), 1.05), "p9": ((0.92, 0.92, 0.95), 1.05)}
SCRIM = [(0.35, 5.2, 0.35), (6.0, 10.6, 0.30), (19.6, 27.1, 0.55), (27.5, 29.6, 0.40), (38.3, 45.1, 0.40), (48.6, 54.4, 0.40),
         (54.9, 62.0, 0.50), (69.8, 75.9, 0.55), (80.6, 88.1, 0.45)]
SCRIM_PROFILE = np.clip((1150 - YY[:, :1]) / 450, 0, 1)[..., None][:, :, 0:1]


def scrim_strength(t):
    s = 0.12
    for a, b, k in SCRIM:
        if a - 0.3 <= t <= b + 0.3:
            s = max(s, k * min(1, (t - a + 0.3) / 0.3, (b + 0.3 - t) / 0.3))
    return s


def render_shot(shot, t, fi):
    img, m, meta, top = plate(shot["plate"])
    cx, cy, ch = cam_at(shot, t)
    since = t - shot["t0"]
    if since < 0.15 and not shot["fx"].get("xfade"):
        ch /= 1 + 0.035 * (1 - since / 0.15) ** 2
    sx, sy = shake_offset(fi, shot["fx"].get("shake", 0))
    cw = ch * W / H
    cx += sx * cw / W
    cy += sy * ch / H
    x0, y0 = cx - cw / 2, cy - ch / 2
    pw, ph = img.size
    x0 = min(max(x0, 0), pw - cw)
    y0 = min(max(y0, 0), ph - ch)
    box = (x0, y0, x0 + cw, y0 + ch)
    fr = np.asarray(img.resize((W, H), Image.BILINEAR if cw < 1700 else Image.BOX, box=box, reducing_gap=None), np.float32) / 255
    mk = None
    if m is not None:
        mk = np.asarray(m.resize((W, H), Image.BILINEAR, box=box), np.float32)[..., None] / 255
    mul, gam = PLATE_GRADE[shot["plate"]]
    fr = np.power(fr * np.array(mul, np.float32), gam)
    fx = shot["fx"]
    if fx.get("speed") and mk is not None:
        blurred = uniform_filter1d(fr, 61, axis=1)
        fr = fr * mk + blurred * (1 - mk)
        streak = np.zeros((H, W), np.float32)
        r = np.random.default_rng(fi)
        for _ in range(26):
            y = r.uniform(0, H)
            x = r.uniform(-W, W)
            ln = r.uniform(200, 700)
            yi = int(y)
            xa, xb = int(max(x, 0)), int(min(x + ln, W))
            if xb > xa and 0 <= yi < H - 2:
                streak[yi:yi + 2, xa:xb] = r.uniform(0.15, 0.5)
        streak = gaussian_filter(streak, (1.2, 6))[..., None]
        fr = fr + streak * (1 - mk) * np.array([0.9, 0.95, 1.0])
    if fx.get("sweep") and mk is not None:
        u = (t - shot["t0"]) / (shot["t1"] - shot["t0"])
        pos = -0.4 + 1.8 * u
        d = (XX / W * 0.8 + YY / H * 0.45) - pos
        band = np.exp(-(d / 0.07) ** 2)[..., None]
        lum = fr.mean(-1, keepdims=True)
        fr = fr + band * mk * (0.10 + 0.35 * lum) * 0.8
    if fx.get("aero") and top is not None:
        fr = draw_aero(fr, t, box, top)
    if fx.get("ignite"):
        ti = fx["ignite"]
        if t < ti:
            k = 0.10 + 0.05 * math.sin(t * 30)
        else:
            k = min(1.0, 0.35 + (t - ti) * 1.2) * (1 + 0.12 * math.sin((t - ti) * 47) * math.exp(-(t - ti) * 3))
        fr = fr * k
    if fx.get("hook"):
        k = min(1.0, max(0.0, (t - 0.05) / 0.30))
        g = 1.0 + 3.0 * (1 - k)
        fr = np.power(np.clip(fr, 0, 1), g) * (0.35 + 0.65 * k)
    if fx.get("dim"):
        fr = fr * fx["dim"]
    if fx.get("outro"):
        u = (t - shot["t0"]) / (shot["t1"] - shot["t0"])
        fr = fr * (1 - 0.35 * max(0, u - 0.1))
    return fr


def draw_aero(fr, t, box, top_data):
    top, x0p, x1p = top_data
    bx0, by0, bx1, by1 = box
    sxs = (bx1 - bx0) / W
    sys_ = (by1 - by0) / H
    xs = np.arange(0, W, 2, dtype=np.float32)
    px = np.clip(bx0 + xs * sxs, 0, len(top) - 1).astype(int)
    base_y = (top[px] - by0) / sys_
    layer = np.zeros((H, W), np.float32)
    car_len = (x1p - x0p) / sxs
    for i in range(8):
        off = 16 + i * 30
        smooth_k = 2 + i * 7
        yline = gaussian_filter(base_y, smooth_k) - off * (1 + 0.18 * i)
        phase = (xs + t * 700 + i * 211) % 520
        pulse = np.exp(-((phase - 260) / 90) ** 2)
        alpha = (0.10 + 0.55 * pulse) * (1 - i * 0.08)
        yi = np.round(yline).astype(int)
        ok = (yi >= 1) & (yi < H - 1)
        layer[yi[ok], xs[ok].astype(int)] = np.maximum(layer[yi[ok], xs[ok].astype(int)], alpha[ok])
        layer[yi[ok], xs[ok].astype(int) + 1] = np.maximum(layer[yi[ok], xs[ok].astype(int) + 1], alpha[ok])
    layer = gaussian_filter(layer, 1.0) * 2.2 + gaussian_filter(layer, 6) * 3.0
    return fr + layer[..., None] * np.array([0.75, 0.88, 1.0], np.float32) * 0.6


def active_shots(t):
    out = []
    for i, s in enumerate(SHOTS):
        if s["t0"] <= t < s["t1"] or (i == len(SHOTS) - 1 and t >= s["t0"]):
            out.append(i)
    return out


def frame(fi):
    t = fi / FPS
    idx = active_shots(t)[0]
    shot = SHOTS[idx]
    fr = render_shot(shot, t, fi)
    xf = shot["fx"].get("xfade")
    if xf and t - shot["t0"] < xf and idx > 0:
        prev = render_shot(SHOTS[idx - 1], t, fi)
        a = (t - shot["t0"]) / xf
        a = a * a * (3 - 2 * a)
        fr = prev * (1 - a) + fr * a
    flash = 0.0
    for fa in FLASH_AT:
        if 0 <= t - fa < 0.5:
            flash = max(flash, math.exp(-(t - fa) * 9) * 0.35)
    fr = fr * (1 + flash)
    small = fr[::4, ::4]
    bright = np.clip(small - 0.6, 0, None)
    bloom = gaussian_filter(bright, (10, 10, 0))
    bloom = np.repeat(np.repeat(bloom, 4, 0), 4, 1)[:H, :W]
    fr = fr + bloom * 0.6
    fr = fr * VIGNETTE
    fr = fr * (1 - SCRIM_PROFILE * scrim_strength(t))
    lum = fr.mean(-1, keepdims=True)
    fr = fr + (1 - lum) * np.array([-0.006, 0.0, 0.010]) * (lum < 0.35) + lum * np.array([0.010, 0.004, -0.008]) * (lum > 0.5)
    fr = fr / (1 + np.maximum(fr - 0.85, 0) * 1.5)
    g = GRAIN[fi % 6][..., None] * (0.018 + 0.02 * (1 - np.clip(lum, 0, 1)))
    fr = fr + g
    fr = np.clip(fr, 0.008, 1)
    sx, sy = shake_offset(fi, shot["fx"].get("shake", 0))
    ov = graphics.compose(t, CREDITS.get(shot["plate"]), (sx * 0.6, sy * 0.6))
    out = Image.fromarray((fr * 255 + 0.5).astype(np.uint8))
    if ov is not None:
        out = Image.alpha_composite(out.convert("RGBA"), ov).convert("RGB")
    return out


def render_range(a, b, path):
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-g", "30", "-bf", "2",
           "-x264-params", "keyint=30:min-keyint=30:scenecut=0", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fi in range(a, b):
        p.stdin.write(frame(fi).tobytes())
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "still":
        for t in map(float, sys.argv[3:]):
            frame(int(round(t * FPS))).save(f"{sys.argv[2]}/still_{t:06.2f}.jpg", quality=90)
    elif mode == "range":
        render_range(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
