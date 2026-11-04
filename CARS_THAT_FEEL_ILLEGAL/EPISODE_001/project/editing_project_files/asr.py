import sys, json, glob, os
import soundfile as sf, numpy as np
from scipy.signal import resample_poly
def load(f):
    a, sr = sf.read(f, dtype='float32')
    a = a.mean(1) if a.ndim > 1 else a
    from math import gcd
    g = gcd(16000, sr)
    return resample_poly(a, 16000 // g, sr // g).astype(np.float32)
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8')
out = {}
for f in sorted(glob.glob(sys.argv[1] + '/*.wav')):
    segs, _ = m.transcribe(load(f), word_timestamps=True, beam_size=5)
    words = [dict(w=w.word.strip(), s=round(w.start, 3), e=round(w.end, 3)) for s in segs for w in s.words]
    out[os.path.basename(f)[:-4]] = words
    print(os.path.basename(f), ' '.join(x['w'] for x in words))
json.dump(out, open(sys.argv[2], 'w'), indent=0)
