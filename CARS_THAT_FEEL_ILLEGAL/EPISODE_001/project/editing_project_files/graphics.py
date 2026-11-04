import math
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from captions import CAPTIONS

W, H = 1080, 1920
FONT_DIR = "../fonts/"
AMBER = (255, 194, 74)
WHITE = (245, 246, 248)
GREY = (170, 176, 186)


@lru_cache(None)
def font(name, size, weight=None):
    f = ImageFont.truetype(FONT_DIR + name, size)
    if weight:
        try:
            f.set_variation_by_axes([weight] if name != "Inter.ttf" else [14, weight])
        except Exception:
            try:
                f.set_variation_by_axes([weight])
            except Exception:
                pass
    return f


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(u):
    u = clamp(u)
    return 1 - (1 - u) ** 3


def ease_io(u):
    u = clamp(u)
    return 0.5 - 0.5 * math.cos(math.pi * u)


def fade(t, t0, t1, fin=0.25, fout=0.25):
    if t < t0 or t > t1:
        return 0.0
    return clamp((t - t0) / fin) * clamp((t1 - t) / fout)


def text_w(f, s, tracking=0):
    return f.getlength(s) + tracking * max(len(s) - 1, 0)


def draw_text(d, xy, s, f, fill, alpha=1.0, tracking=0, anchor="l"):
    x, y = xy
    tw = text_w(f, s, tracking)
    if anchor == "c":
        x -= tw / 2
    elif anchor == "r":
        x -= tw
    a = int(255 * clamp(alpha))
    if tracking == 0:
        d.text((x, y), s, font=f, fill=fill + (a,))
        return tw
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill + (a,))
        x += f.getlength(ch) + tracking
    return tw


class Layer:
    def __init__(self):
        self.img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)
        self.used = False


def title_hook(L, t):
    if not (0.40 <= t <= 5.15):
        return
    L.used = True
    a = fade(t, 0.40, 5.15, 0.2, 0.35)
    f1 = font("Anton.ttf", 132)
    for i, (word, y, col) in enumerate([("THIS CAR", 300, WHITE), ("FEELS ILLEGAL.", 440, WHITE)]):
        st = 0.40 + i * 0.28
        u = ease_out((t - st) / 0.7)
        if u <= 0:
            continue
        tracking = 40 * (1 - u)
        draw_text(L.d, (W / 2, y + 30 * (1 - u)), word, f1, col, a * u, tracking, "c")
    u = ease_out((t - 1.1) / 0.8)
    if u > 0:
        lw = 520 * u
        L.d.rectangle([W / 2 - lw / 2, 612, W / 2 + lw / 2, 618], fill=AMBER + (int(255 * a),))


def series_badge(L, t):
    if not (5.6 <= t <= 84.1):
        return
    L.used = True
    a = fade(t, 5.6, 84.1, 0.5, 0.5) * 0.92
    f = font("Oswald.ttf", 25, 600)
    L.d.rectangle([60, 236, 66, 280], fill=AMBER + (int(255 * a),))
    draw_text(L.d, (80, 232), "CARS THAT FEEL ILLEGAL", f, WHITE, a, 3)
    draw_text(L.d, (80, 260), "EPISODE 001", font("Oswald.ttf", 19, 500), AMBER, a, 4)


def credit(L, t, text):
    if not text:
        return
    L.used = True
    f = font("Inter.ttf", 19, 500)
    draw_text(L.d, (W - 60, 246), text, f, GREY, 0.75, 0, "r")


def name_card(L, t):
    if not (6.0 <= t <= 10.6):
        return
    L.used = True
    a = fade(t, 6.0, 10.6, 0.25, 0.5)
    u1 = ease_out((t - 6.0) / 0.6)
    draw_text(L.d, (W / 2, 420 - 20 * (1 - u1)), "KOENIGSEGG", font("Oswald.ttf", 44, 500), GREY, a * u1, 18 - 8 * u1, "c")
    u2 = ease_out((t - 6.68) / 0.7)
    if u2 > 0:
        draw_text(L.d, (W / 2, 480 + 24 * (1 - u2)), "JESKO ABSOLUT", font("Anton.ttf", 128), WHITE, a * u2, 30 * (1 - u2), "c")
    u3 = ease_out((t - 7.0) / 0.8)
    if u3 > 0:
        lw = 600 * u3
        L.d.rectangle([W / 2 - lw / 2, 650, W / 2 + lw / 2, 655], fill=AMBER + (int(255 * a),))


def spec_line(L, t, t_in, t_out, y, big, small, big_size=96, count_to=None, count_fmt="{:,}"):
    if not (t_in <= t <= t_out):
        return
    L.used = True
    a = fade(t, t_in, t_out, 0.2, 0.4)
    u = ease_out((t - t_in) / 0.5)
    x = 70 - 40 * (1 - u)
    L.d.rectangle([60, y + 8, 66, y + big_size + 4], fill=AMBER + (int(255 * a * u),))
    text = big
    if count_to is not None:
        c = ease_out((t - t_in) / 0.9)
        text = big.replace("{n}", count_fmt.format(int(round(count_to * c / 10.0)) * 10 if count_to >= 100 else count_to))
    draw_text(L.d, (x + 22, y - 6), text, font("Anton.ttf", big_size), WHITE, a * u)
    if small:
        draw_text(L.d, (x + 24, y + big_size + 6), small, font("Oswald.ttf", 30, 500), GREY, a * u, 2)


def footnote(L, t, t_in, t_out, y, s):
    if not (t_in <= t <= t_out):
        return
    L.used = True
    a = fade(t, t_in, t_out, 0.3, 0.4) * 0.85
    draw_text(L.d, (70, y), s, font("Inter.ttf", 22, 500), GREY, a)


def engine_specs(L, t):
    spec_line(L, t, 19.70, 27.05, 330, "5.0L TWIN-TURBO V8", "FLAT-PLANE CRANK · 9-SPEED LST", 84)
    spec_line(L, t, 22.50, 27.05, 500, "UP TO {n} HP", "ON E85 FUEL", 104, count_to=1600)
    spec_line(L, t, 25.30, 27.05, 690, "1,280 HP", "ON REGULAR GASOLINE", 64)
    footnote(L, t, 22.50, 27.05, 830, "Manufacturer figures · koenigsegg.com")


def rpm_hit(L, t, shake_xy):
    if not (27.55 <= t <= 29.55):
        return
    L.used = True
    a = fade(t, 27.55, 29.55, 0.08, 0.35)
    dx, dy = shake_xy
    u = ease_out((t - 27.55) / 0.35)
    f = font("Anton.ttf", int(150 + 40 * (1 - u)))
    draw_text(L.d, (W / 2 + dx, 420 + dy), "8,500 RPM", f, WHITE, a, 0, "c")
    draw_text(L.d, (W / 2 + dx * 0.5, 620 + dy * 0.5), "REV LIMIT", font("Oswald.ttf", 36, 500), AMBER, a, 10, "c")


def aero_specs(L, t):
    if 38.40 <= t <= 45.0:
        L.used = True
        a = fade(t, 38.40, 45.0, 0.2, 0.4)
        u = ease_out((t - 38.4) / 0.6)
        draw_text(L.d, (W / 2, 330), "DRAG COEFFICIENT", font("Oswald.ttf", 34, 500), GREY, a * u, 8, "c")
        draw_text(L.d, (W / 2, 380 + 20 * (1 - u)), "0.278", font("Anton.ttf", 190), WHITE, a * u, 0, "c")
        draw_text(L.d, (W / 2 + 255, 520), "Cd", font("Oswald.ttf", 44, 600), AMBER, a * u, 0, "c")
    if 41.10 <= t <= 45.0:
        L.used = True
        a = fade(t, 41.10, 45.0, 0.3, 0.4)
        draw_text(L.d, (W / 2, 640), "REAR WING DELETED VS. JESKO ATTACK", font("Oswald.ttf", 28, 500), WHITE, a, 3, "c")
        draw_text(L.d, (W / 2, 680), "DOWNFORCE: 1,400 KG  →  150 KG", font("Oswald.ttf", 28, 500), AMBER, a, 3, "c")
        draw_text(L.d, (W / 2, 728), "Manufacturer figures", font("Inter.ttf", 21, 500), GREY, a * 0.85, 0, "c")
    if 43.08 <= t <= 45.3:
        stamp(L, t, 43.08, 45.3, W / 2, 800, "THEORETICAL", (255, 255, 255))


def stamp(L, t, t0, t1, cx, cy, label, col, size=40):
    L.used = True
    a = fade(t, t0, t1, 0.12, 0.3)
    u = ease_out((t - t0) / 0.25)
    s = 1.0 + 0.25 * (1 - u)
    f = font("Oswald.ttf", int(size * s), 600)
    tw = text_w(f, label, 6)
    pad = 18 * s
    box = [cx - tw / 2 - pad, cy - pad * 0.6, cx + tw / 2 + pad, cy + f.size * 1.25 + pad * 0.3]
    L.d.rectangle(box, outline=col + (int(255 * a),), width=4)
    draw_text(L.d, (cx, cy - 4), label, f, col, a, 6, "c")


def topspeed(L, t):
    if 48.68 <= t <= 54.30:
        L.used = True
        a = fade(t, 48.68, 54.30, 0.2, 0.35)
        u = ease_out((t - 48.68) / 0.6)
        draw_text(L.d, (W / 2, 330), "KOENIGSEGG SIMULATION", font("Oswald.ttf", 32, 500), GREY, a * u, 8, "c")
        draw_text(L.d, (W / 2, 380 + 24 * (1 - u)), "500+ KM/H", font("Anton.ttf", 170), WHITE, a * u, 0, "c")
        draw_text(L.d, (W / 2, 590), "≈ 310+ MPH", font("Oswald.ttf", 36, 500), GREY, a * u, 6, "c")
    if 51.68 <= t <= 54.30:
        stamp(L, t, 51.68, 54.30, W / 2, 680, "NOT VERIFIED", (255, 90, 80), 46)


def record(L, t):
    if not (54.98 <= t <= 62.0):
        return
    L.used = True
    a = fade(t, 54.98, 62.0, 0.15, 0.4)
    stamp(L, t, 54.98, 62.0, W / 2, 300, "VERIFIED RECORD", AMBER, 40)
    t_acc0, t_400, t_stop = 55.42, 57.12, 59.06
    if t < t_acc0:
        v, clock = 0, 0.0
    elif t < t_400:
        u = (t - t_acc0) / (t_400 - t_acc0)
        v = 400 * (1 - (1 - u) ** 1.6)
        clock = 16.77 * u
    elif t < t_stop:
        u = (t - t_400) / (t_stop - t_400)
        v = 400 * (1 - u)
        clock = 16.77 + 8.44 * u
    else:
        v, clock = 0, 25.21
    draw_text(L.d, (W / 2, 410), f"{int(round(v)):d}", font("Anton.ttf", 230), WHITE, a, 0, "c")
    draw_text(L.d, (W / 2, 670), "KM/H", font("Oswald.ttf", 40, 600), GREY, a, 12, "c")
    bx0, bx1, by = 140, 940, 760
    L.d.rectangle([bx0, by, bx1, by + 8], fill=(255, 255, 255, int(50 * a)))
    L.d.rectangle([bx0, by, bx0 + (bx1 - bx0) * v / 400, by + 8], fill=AMBER + (int(255 * a),))
    big = t >= 59.72
    clock_txt = f"{clock:05.2f} s"
    draw_text(L.d, (W / 2, 800), clock_txt, font("JetBrainsMono.ttf", 84 if big else 64, 700), AMBER if big else WHITE, a, 0, "c")
    draw_text(L.d, (W / 2, 915), "0–400–0 KM/H · RACELOGIC-VERIFIED", font("Oswald.ttf", 28, 500), WHITE, a, 3, "c")
    draw_text(L.d, (W / 2, 955), "Örebro, Sweden · 7 Aug 2025 · counter animation illustrative", font("Inter.ttf", 21, 500), GREY, a * 0.85, 0, "c")


def homologated(L, t):
    if 69.88 <= t <= 75.8:
        L.used = True
        a = fade(t, 69.88, 75.8, 0.2, 0.4)
        u = ease_out((t - 69.88) / 0.6)
        draw_text(L.d, (W / 2, 330 + 20 * (1 - u)), "FULLY HOMOLOGATED", font("Anton.ttf", 112), WHITE, a * u, 0, "c")
        draw_text(L.d, (W / 2, 475), "SERIES-PRODUCTION ROAD CAR", font("Oswald.ttf", 32, 500), AMBER, a * u, 8, "c")
    if 72.35 <= t <= 75.8:
        a = fade(t, 72.35, 75.8, 0.3, 0.4)
        draw_text(L.d, (W / 2, 560), "JESKO PRODUCTION: 125 CARS", font("Oswald.ttf", 34, 600), WHITE, a, 4, "c")
        draw_text(L.d, (W / 2, 605), "Attack + Absolut combined", font("Inter.ttf", 24, 500), GREY, a * 0.9, 0, "c")


def finale(L, t):
    if t >= 80.66:
        L.used = True
        a = clamp((t - 80.66) / 0.35)
        u = ease_out((t - 80.66) / 0.7)
        f = font("Anton.ttf", 150)
        y = 360 + 30 * (1 - u)
        draw_text(L.d, (W / 2, y), "WOULD YOU", f, WHITE, a, 24 * (1 - u), "c")
        x = W / 2
        w1 = text_w(f, "DRIVE ") + text_w(f, "IT?")
        sx = x - w1 / 2
        draw_text(L.d, (sx, y + 165), "DRIVE ", f, AMBER, a, 0)
        draw_text(L.d, (sx + text_w(f, "DRIVE "), y + 165), "IT?", f, WHITE, a, 0)
    if t >= 84.5:
        L.used = True
        a = clamp((t - 84.5) / 0.6)
        draw_text(L.d, (W / 2, 1060), "CARS THAT FEEL ILLEGAL", font("Oswald.ttf", 40, 600), WHITE, a, 8, "c")
        draw_text(L.d, (W / 2, 1115), "EPISODE 001  ·  FOLLOW FOR EPISODE 002", font("Oswald.ttf", 26, 500), AMBER, a, 4, "c")
        draw_text(L.d, (W / 2, 1180), "Photos: Calreyn88, D. Merrett, M. Blume, A. Migl via Wikimedia Commons", font("Inter.ttf", 19, 500), GREY, a * 0.8, 0, "c")
        draw_text(L.d, (W / 2, 1206), "(CC BY-SA 4.0 / CC BY 2.0) · backgrounds replaced · audio & music synthesized", font("Inter.ttf", 19, 500), GREY, a * 0.8, 0, "c")


def captions(L, t):
    for (s, e, text, hl) in CAPTIONS:
        if s - 0.02 <= t <= e:
            L.used = True
            u = ease_out((t - s + 0.02) / 0.14)
            a = clamp(u) * clamp((e - t) / 0.08 + 0.2)
            size = int(60 * (0.92 + 0.08 * u))
            f = font("Inter.ttf", size, 800)
            words = text.split(" ")
            space = f.getlength(" ")
            total = sum(f.getlength(w) for w in words) + space * (len(words) - 1)
            x = W / 2 - total / 2
            y = 1330 - size / 2
            for w in words:
                col = AMBER if w in hl else WHITE
                L.d.text((x, y), w, font=f, fill=col + (int(255 * a),))
                x += f.getlength(w) + space
            return


def compose(t, shot_credit, shake_xy=(0, 0)):
    L = Layer()
    title_hook(L, t)
    series_badge(L, t)
    if 5.6 <= t <= 84.1:
        credit(L, t, shot_credit)
    name_card(L, t)
    engine_specs(L, t)
    rpm_hit(L, t, shake_xy)
    aero_specs(L, t)
    topspeed(L, t)
    record(L, t)
    homologated(L, t)
    finale(L, t)
    captions(L, t)
    if not L.used:
        return None
    img = L.img
    alpha = img.getchannel("A")
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow.putalpha(alpha.point(lambda v: int(v * 0.85)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(7))
    out = Image.alpha_composite(shadow, img)
    return out
