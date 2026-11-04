"""Build graded studio plates from genuine photos.

The car pixels are the original photograph (graded only). The show-floor background is
replaced by a dark studio backdrop with a glossy floor reflection derived from the car itself.
"""
import sys, json
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, median_filter, map_coordinates

Image.MAX_IMAGE_PIXELS = None


def srgb_to_lin(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def lin_to_srgb(x):
    x = np.clip(x, 0, None)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * np.power(x, 1 / 2.4) - 0.055)


def grade_car(rgb, exposure=-0.25, sat=0.92, contrast=1.18):
    lin = srgb_to_lin(rgb) * 2 ** exposure
    lum = (lin * [0.2126, 0.7152, 0.0722]).sum(-1, keepdims=True)
    lin = lum + (lin - lum) * sat
    lin = lin / (1 + lin * 0.35)
    s = lin_to_srgb(lin)
    s = np.clip((s - 0.5) * contrast + 0.5, 0, 1)
    s = s ** 1.08
    shadow = np.clip(1 - s.mean(-1, keepdims=True) * 2.2, 0, 1)
    s = s + shadow * np.array([-0.012, 0.004, 0.018])
    return np.clip(s, 0, 1)


def studio_backdrop(h, w, cx, cy_top, floor_y):
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    base = np.array([0.018, 0.021, 0.027], np.float32)
    r = np.sqrt(((xx - cx) / (w * 0.55)) ** 2 + ((yy - floor_y) / (h * 0.30)) ** 2)
    glow = np.exp(-r ** 2 * 1.6)[..., None] * np.array([0.075, 0.085, 0.105], np.float32)
    strip_y = cy_top - h * 0.10
    strip = np.exp(-((yy - strip_y) / (h * 0.006)) ** 2) * np.exp(-((xx - cx) / (w * 0.36)) ** 6)
    strip_glow = gaussian_filter(strip, h * 0.02) * 2.2
    softbox = (strip * 0.55 + strip_glow * 0.35)[..., None] * np.array([0.92, 0.95, 1.0], np.float32)
    floor = np.clip((yy - floor_y) / (h * 0.25), 0, 1)[..., None]
    floor_col = np.array([0.012, 0.014, 0.018], np.float32)
    bg = base + glow + softbox
    bg = bg * (1 - floor * 0.6) + floor_col * floor * 0.6
    return bg


def build(src, mask_path, out_prefix, pad_top, pad_bottom, blur_boxes=(), exposure=-0.25):
    im = np.asarray(Image.open(src).convert('RGB'), np.float32) / 255.0
    for (x0, y0, x1, y1) in blur_boxes:
        patch = gaussian_filter(im[y0:y1, x0:x1], (40, 40, 0))
        yy0, xx0 = np.mgrid[0:y1 - y0, 0:x1 - x0]
        feather = np.minimum.reduce([yy0, xx0, (y1 - y0 - 1) - yy0, (x1 - x0 - 1) - xx0]) / 25.0
        feather = np.clip(feather, 0, 1)[..., None]
        dark = patch * 0.62
        im[y0:y1, x0:x1] = im[y0:y1, x0:x1] * (1 - feather) + dark * feather
    m = np.asarray(Image.open(mask_path).convert('L'), np.float32) / 255.0
    m = np.clip((m - 0.08) / 0.84, 0, 1)
    from scipy.ndimage import label
    lab, nlab = label(m > 0.5)
    if nlab > 1:
        sizes = np.bincount(lab.ravel())
        sizes[0] = 0
        keep = sizes >= sizes.max() * 0.02
        m = m * gaussian_filter(keep[lab].astype(np.float32), 2)
    h, w = m.shape
    car = grade_car(im, exposure=exposure)
    H = h + pad_top + pad_bottom
    canvas_m = np.zeros((H, w), np.float32)
    canvas_c = np.zeros((H, w, 3), np.float32)
    canvas_m[pad_top:pad_top + h] = m
    canvas_c[pad_top:pad_top + h] = car
    cols = np.where(canvas_m.max(0) > 0.5)[0]
    bottom = np.full(w, -1.0)
    for x in cols:
        ys = np.nonzero(canvas_m[:, x] > 0.5)[0]
        bottom[x] = ys.max()
    valid = bottom > 0
    xs = np.arange(w)
    bfill = np.interp(xs, xs[valid], bottom[valid])
    bfill = median_filter(bfill, size=max(5, w // 60))
    bfill = gaussian_filter(bfill, w / 400)
    top_y = np.nonzero(canvas_m.max(1) > 0.5)[0].min()
    floor_y = float(np.percentile(bfill[valid], 70))
    bg = studio_backdrop(H, w, w / 2, top_y, floor_y)
    yy, xx = np.mgrid[0:H, 0:w].astype(np.float32)
    d = yy - bfill[None, :]
    src_y = bfill[None, :] - d
    refl_c = np.stack([map_coordinates(canvas_c[..., c], [src_y, xx], order=1, mode='constant') for c in range(3)], -1)
    refl_m = map_coordinates(canvas_m, [src_y, xx], order=1, mode='constant')
    fall = np.clip(1 - d / (h * 0.32), 0, 1) ** 2 * (d > 0)
    refl_m = refl_m * fall * 0.32
    refl_c = gaussian_filter(refl_c, (6, 6, 0))
    shadow = np.zeros((H, w), np.float32)
    for x in cols:
        b = int(bfill[x])
        shadow[max(b - 6, 0):b + 14, x] = 1
    shadow = gaussian_filter(shadow, (h * 0.012, w * 0.006)) * 0.85
    shadow = np.clip(shadow, 0, 1)
    out = bg * (1 - shadow[..., None] * 0.9)
    out = out * (1 - refl_m[..., None]) + refl_c * refl_m[..., None]
    out = out * (1 - canvas_m[..., None]) + canvas_c * canvas_m[..., None]
    Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out_prefix + '_plate.png')
    Image.fromarray((canvas_m * 255).astype(np.uint8)).save(out_prefix + '_platemask.png')
    meta = dict(w=w, h=H, pad_top=pad_top, car_top=int(top_y), floor_y=floor_y,
                car_x0=int(cols.min()), car_x1=int(cols.max()))
    json.dump(meta, open(out_prefix + '_plate.json', 'w'))
    print(out_prefix, meta)


def build_raw(src, out_prefix, exposure=-0.15):
    im = np.asarray(Image.open(src).convert('RGB'), np.float32) / 255.0
    g = grade_car(im, exposure=exposure, sat=0.85, contrast=1.22)
    Image.fromarray((g * 255 + 0.5).astype(np.uint8)).save(out_prefix + '_plate.png')
    h, w = g.shape[:2]
    json.dump(dict(w=w, h=h), open(out_prefix + '_plate.json', 'w'))
    print(out_prefix, w, h)


if __name__ == '__main__':
    cfg = json.loads(sys.argv[1])
    if cfg.get('raw'):
        build_raw(cfg['src'], cfg['out'], cfg.get('exposure', -0.15))
    else:
        build(cfg['src'], cfg['mask'], cfg['out'], cfg['pad_top'], cfg['pad_bottom'],
              [tuple(b) for b in cfg.get('blur', [])], cfg.get('exposure', -0.25))
