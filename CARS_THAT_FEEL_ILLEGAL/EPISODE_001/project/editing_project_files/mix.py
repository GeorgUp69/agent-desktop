import sys, json, numpy as np, soundfile as sf
from scipy.signal import resample_poly
from dsp import SR, place, smooth, db
from timeline import VO, TOTAL

N = int(TOTAL * SR)
vo_dir, stems = sys.argv[1], sys.argv[2]


def load(p):
    x, sr = sf.read(p, dtype="float64")
    if sr != SR:
        x = resample_poly(x, SR // 1000, sr // 1000, axis=0)
    return x


vo = np.zeros(N)
spans = []
for name, start in VO.items():
    a = load(f"{vo_dir}/{name}.wav")
    a = a.mean(1) if a.ndim > 1 else a
    place(vo, a, start)
    spans.append((name, start, start + len(a) / SR))
sf.write(f"{stems}/vo_raw.wav", vo.astype(np.float32), SR, subtype="FLOAT")
json.dump(spans, open(f"{stems}/vo_spans.json", "w"), indent=1)
print("vo spans", [(n, round(a, 2), round(b, 2)) for n, a, b in spans])
