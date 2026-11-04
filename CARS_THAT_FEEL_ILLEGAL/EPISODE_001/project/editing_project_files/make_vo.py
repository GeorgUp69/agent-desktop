import sys, re, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
from kokoro_onnx.tokenizer import Tokenizer
from vo_lines import LINES, OVERRIDES
voice_spec, speed, outdir = sys.argv[1], float(sys.argv[2]), sys.argv[3]
k = Kokoro('../models/kokoro-v1.0.onnx', '../models/voices-v1.0.bin')
tok = Tokenizer()
def voice(spec):
    parts = [p.split(':') for p in spec.split('+')]
    return sum(k.get_voice_style(n) * float(w) for n, w in parts)
style = voice(voice_spec)
def phon(text):
    out = []
    for w in text.split(' '):
        key = w.rstrip(',.:?')
        tail = w[len(key):]
        out.append(OVERRIDES[key] + tail if key in OVERRIDES else tok.phonemize(w, 'en-us'))
    return ' '.join(out)
import os; os.makedirs(outdir, exist_ok=True)
for name, text in LINES:
    p = phon(text)
    a, sr = k.create(p, voice=style, speed=speed, is_phonemes=True)
    sf.write(f'{outdir}/{name}.wav', a, sr)
    print(name, round(len(a)/sr, 2), p if 'Koenig' in text or 'Jesko' in text else '')
