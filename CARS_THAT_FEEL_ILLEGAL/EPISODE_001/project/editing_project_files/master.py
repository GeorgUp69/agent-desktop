import sys, numpy as np, soundfile as sf
from dsp import SR, smooth, db

stems = sys.argv[1]
vo, _ = sf.read(f"{stems}/vo_proc.wav", dtype="float64")
vo = vo.mean(1) if vo.ndim > 1 else vo
music, _ = sf.read(f"{stems}/music.wav", dtype="float64")
eng, _ = sf.read(f"{stems}/engine.wav", dtype="float64")
sfx, _ = sf.read(f"{stems}/sfx.wav", dtype="float64")
n = min(len(vo), len(music), len(eng), len(sfx))
vo, music, eng, sfx = vo[:n], music[:n], eng[:n], sfx[:n]

active = smooth((np.abs(vo) > 0.01).astype(float), 0.004)
active = smooth(np.clip(active * 40, 0, 1), 0.15)
music_gain = 1 - active * (1 - db(-9))
eng_gain = 1 - active * (1 - db(-7))
sfx_gain = 1 - active * (1 - db(-4))

vo_st = np.stack([vo, vo], 1)
mix = vo_st * db(0) + music * db(-7) * music_gain[:, None] + eng * db(-5) * eng_gain[:, None] + sfx * db(-6) * sfx_gain[:, None]
sf.write(f"{stems}/premaster.wav", mix.astype(np.float32), SR, subtype="FLOAT")
print("premaster peak", np.max(np.abs(mix)))
