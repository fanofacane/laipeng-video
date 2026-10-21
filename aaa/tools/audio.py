"""Synthesize the score + sound effects for the 「啊」 video (numpy only).
120 BPM, chords Fmaj7 -> G6 -> Em7 -> Am7 (2 s each). Writes out/score_raw.wav."""
import numpy as np, wave, os

SR = 48000
DUR = 12.1
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))

B1, B2 = 3.8, 7.6
TS1, TS2 = 2.5, 11.4
INV = (6.95, 7.6)          # yellow inverted segment
SWEEP = (7.6, 8.35)        # giant sweep: drums stop

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    mix[i:i + len(sig), 0] += sig * gain * l * 1.414
    mix[i:i + len(sig), 1] += sig * gain * r * 1.414

def tt(d): return np.arange(int(d * SR)) / SR

def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / np.sqrt(1 + (f / fc) ** 8)
    return np.fft.irfft(X, len(x))

def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / np.sqrt(1 + (f / hi) ** 8)) * (1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 8))
    return np.fft.irfft(X, len(x))

def onepole_sweep(x, f0, f1):
    """time-varying one-pole lowpass, cutoff sweeps f0->f1 (exponential)"""
    n = len(x); fc = f0 * (f1 / f0) ** (np.arange(n) / n)
    a = np.exp(-2 * np.pi * fc / SR); y = np.zeros(n); s = 0.0
    for i in range(n):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y

# ---------------- drums ----------------
def kick():
    t = tt(0.45)
    f = 48 + 140 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(1.6 * np.sin(ph) * np.exp(-6.5 * t))

def clap():
    t = tt(0.25); n = rng.standard_normal(len(t))
    env = np.zeros(len(t))
    for d in (0, 0.011, 0.022):
        m = t >= d; env[m] += np.exp(-(t[m] - d) * (90 if d < 0.02 else 18))
    return bandpass(n, 900, 5000) * env * 0.9

def hat(d=0.05):
    t = tt(d); n = rng.standard_normal(len(t))
    return bandpass(n, 7000, 16000) * np.exp(-t * 70)

KICK, CLAP = kick(), clap()
beats = np.arange(0, DUR, 0.5)
kick_times = []
for b in beats:
    if SWEEP[0] <= b < SWEEP[1]: continue
    if INV[0] <= b < INV[1] and (b * 2) % 2 == 1: continue   # halve kicks in the yellow beat
    add(KICK, b, 0.95); kick_times.append(b)
for b in beats:
    if b >= 2.0 and (b % 2) in (0.5, 1.5) and not (SWEEP[0] <= b < SWEEP[1]):
        add(CLAP, b, 0.42, 0.05)
for e in np.arange(4.0, DUR, 0.25):
    if SWEEP[0] <= e < SWEEP[1]: continue
    add(hat(), e, 0.16 if (e * 4) % 2 == 0 else 0.1, 0.3)
for e in np.arange(8.375, DUR, 0.25):
    add(hat(0.03), e + 0.125, 0.07, -0.3)
kick_times = np.array(kick_times)

# sidechain envelope
tg = np.arange(N) / SR
idx = np.searchsorted(kick_times, tg, side='right') - 1
since = np.where(idx >= 0, tg - kick_times[np.clip(idx, 0, None)], 10)
duck = 1 - 0.65 * np.exp(-9 * since)

# ---------------- harmony ----------------
CHORDS = [[53, 57, 60, 64], [55, 59, 62, 67], [52, 55, 59, 62], [57, 60, 64, 67]]
ROOTS = [41, 43, 40, 45]
def saw(f, t, ph=0.0): return 2 * ((f * t + ph) % 1) - 1

pad = np.zeros(N)
for ci, c0 in enumerate(np.arange(0, DUR, 2.0)):
    ch = CHORDS[ci % 4]; t = tt(2.05); seg = np.zeros(len(t))
    for m in ch:
        for det in (-0.12, -0.04, 0.05, 0.13):
            seg += saw(mtof(m) * 2 ** (det / 12), t, rng.random())
    seg *= np.minimum(1, t / 0.05) * np.minimum(1, (2.05 - t) / 0.08)
    fc = 900 if c0 < 2.0 else (5000 if c0 >= 10.0 else 2600)
    seg = lowpass(seg, fc) / 16
    i = int(c0 * SR); seg = seg[:N - i]; pad[i:i + len(seg)] += seg
pad *= duck
pad[int(SWEEP[0] * SR):int(SWEEP[1] * SR)] *= np.linspace(1, 0.5, int(SWEEP[1] * SR) - int(SWEEP[0] * SR))
mix[:, 0] += pad * 0.55; mix[:, 1] += pad * 0.55

# bass: eighths, root / octave alternating, from 2.0s
for k, e in enumerate(np.arange(2.0, DUR, 0.25)):
    if SWEEP[0] <= e < SWEEP[1]: continue
    r = ROOTS[int(e // 2) % 4] + (12 if k % 2 else 0)
    t = tt(0.22)
    s = lowpass(saw(mtof(r), t) + 0.6 * np.sin(2 * np.pi * mtof(r) * t), 700) * np.exp(-t * 9) * np.minimum(1, t / 0.004)
    add(s * duck[min(N - 1, int(e * SR))], e, 0.5)

# plucks on offbeats from 5.5s
for k, e in enumerate(np.arange(5.75, DUR, 0.5)):
    ch = CHORDS[int(e // 2) % 4]; m = ch[k % 4] + 12; t = tt(0.3)
    s = (np.sin(2 * np.pi * mtof(m) * t) + 0.3 * np.sin(4 * np.pi * mtof(m) * t)) * np.exp(-t * 14)
    add(s, e, 0.16, 0.4 if k % 2 else -0.4)

# chord stabs on the yellow punches
for e in (6.95, 7.1, 7.225, 7.35, 7.475):
    ch = CHORDS[int(e // 2) % 4]; t = tt(0.2); s = np.zeros(len(t))
    for m in ch: s += saw(mtof(m + 12), t) + saw(mtof(m + 12) * 1.004, t)
    add(lowpass(s, 4000) * np.exp(-t * 16) / 6, e, 0.5)

# ---------------- sound effects ----------------
def whoosh(d, up=True, gain=1.0):
    t = tt(d); n = rng.standard_normal(len(t))
    f0, f1 = (400, 6000) if up else (6000, 300)
    y = onepole_sweep(n, f0, f1)
    env = (t / d) ** 2.2 if up else np.exp(-t / (d * 0.35)) * np.minimum(1, t / 0.01)
    return y * env * gain * 2.2

def hit(f0=34, sweep=70):
    t = tt(0.9)
    f = f0 + sweep * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 4)
    nz = lowpass(rng.standard_normal(len(t)), 3000) * np.exp(-t * 22)
    return np.tanh(2.0 * body + 0.8 * nz)

def pop(f0=900, f1=1800, d=0.11):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 0.6

def riser(d):
    t = tt(d); f = 200 * (8) ** (t / d)
    s = saw(1, np.cumsum(f) / SR) * 0.4 + onepole_sweep(rng.standard_normal(len(t)), 300, 8000) * 1.5
    return s * (t / d) ** 2

for e in (1.9, 3.45, 5.2, 6.55, 9.2, 10.9, 11.93):
    d = 0.4 if e != 11.93 else 0.15
    add(whoosh(d, True), e, 0.35, -0.2)
for e in (0.0, 0.5, 3.8, 5.5, 5.75, 6.0, 6.25, 8.35, 9.5, 10.0, 10.5):
    add(whoosh(0.35, False), e, 0.3, 0.2 if e % 1 else -0.2)
add(whoosh(0.8, False), 7.6, 0.45)
for ts in (TS1, TS2):
    add(whoosh(0.3, True), ts - 0.3, 0.4)
    add(hit(), ts, 0.9)
    add(riser(1.0), ts - 1.0, 0.18)
add(hit(45, 50), 6.95, 0.5)
for e in (0.05, 0.15, 0.35, 3.85, 7.05, 7.15, 7.25, 7.35, 10.6, 10.7, 11.47):
    add(pop(), e, 0.22, 0.3)
for e in (2.0, 2.11, 2.22, 11.2, 11.31):
    add(pop(500, 1100, 0.07), e + 0.25, 0.2, -0.3)   # land of each dropped glyph
for e in (2.9, 3.25):
    add(pop(700, 1400, 0.09), e, 0.18)

# ---------------- master ----------------
ir_t = tt(1.8)
ir = rng.standard_normal((len(ir_t), 2)) * np.exp(-ir_t * 3.8)[:, None]
ir = np.stack([lowpass(ir[:, 0], 6000), lowpass(ir[:, 1], 6000)], 1)
wet = np.zeros_like(mix)
L2 = N + len(ir_t)
for ch in (0, 1):
    w = np.fft.irfft(np.fft.rfft(mix[:, ch], L2) * np.fft.rfft(ir[:, ch], L2), L2)[:N]
    wet[:, ch] = w / np.max(np.abs(w) + 1e-9) * np.max(np.abs(mix[:, ch]))
out = 0.78 * mix + 0.22 * wet
out = np.tanh(out / np.max(np.abs(out)) * 1.4)
fade = int(0.2 * SR); out[-fade:] *= np.linspace(1, 0, fade)[:, None]
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
with wave.open(os.path.join(ROOT, 'out/score_raw.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(out * 0.9, -1, 1) * 32767).astype(np.int16).tobytes())
print('ok', out.shape)
