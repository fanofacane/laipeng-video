# 合成背景音乐（低沉的氛围铺底 + 稀疏的钢琴音 + 红章落地的闷响），与配音混成 audio/mix.wav
#   python3 tools/audio.py
import json, os, subprocess, wave
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TM = json.loads(open(os.path.join(ROOT, 'src/timing.js'), encoding='utf-8').read()[len('window.TIMING='):-2])
SR = 48000; D = TM['duration']; N = int(D * SR); t = np.arange(N) / SR
rng = np.random.default_rng(1)
def C(i, sub):
    L = TM['lines'][i]; return L['chars'][L['text'].index(sub)]
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# 和弦进行（每 8 秒一换）：Am - F - C - G 的低音铺底
prog = [[45, 52, 57, 60, 64], [41, 48, 53, 57, 60], [48, 55, 60, 64, 67], [43, 50, 55, 59, 62]]
pad = np.zeros(N)
BAR = 8.0
for b in range(int(D / BAR) + 2):
    ch = prog[b % 4]; t0 = b * BAR
    s0, s1 = int(max(0, t0 - 2) * SR), int(min(D, t0 + BAR + 2) * SR)
    if s0 >= N: break
    tt = t[s0:s1] - t0
    env = np.clip((tt + 2) / 3, 0, 1) * np.clip((BAR + 2 - tt) / 3, 0, 1)
    for j, m in enumerate(ch):
        f = hz(m)
        v = sum(np.sin(2 * np.pi * f * (1 + d) * tt + rng.random() * 6) for d in (-.0025, 0, .0025)) / 3
        v += .25 * np.sin(2 * np.pi * 2 * f * tt)
        pad[s0:s1] += v * env * (.5 if j == 0 else .22)
# 柔化：慢速低通（简单的一阶滤波）
def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.
    # 分块向量化：用 lfilter 的等价写法
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x)
try:
    pad = lowpass(lowpass(pad, 900), 1400)
except ImportError:
    pass
pad *= .5 + .5 * np.clip((t - 1) / 6, 0, 1)

# 稀疏钢琴音（每 2 秒一个，取当前和弦的高音）
piano = np.zeros(N)
for b in range(int(D / 2)):
    t0 = b * 2 + 1.0
    if rng.random() < .35 or t0 > D - 3: continue
    ch = prog[int(t0 / BAR) % 4]
    m = ch[rng.integers(2, 5)] + 12
    s0 = int(t0 * SR); L = min(N - s0, int(4 * SR)); tt = np.arange(L) / SR
    f = hz(m)
    v = (np.sin(2 * np.pi * f * tt) + .4 * np.sin(4 * np.pi * f * tt) + .15 * np.sin(6 * np.pi * f * tt)) * np.exp(-tt * 1.6) * np.clip(tt / .006, 0, 1)
    piano[s0:s0 + L] += v * (.10 + .05 * rng.random())

# 红章落地：低频闷响 + 噪声
hits = [(0, '容错'), (5, '没有前途'), (6, '永远落后'), (7, '不会幸福'), (11, '一生失败'), (17, '挽回'),
        (20, '代价'), (23, '不值得'), (24, '没有能力'), (27, '全面否定')]
fx = np.zeros(N)
for i, s in hits:
    t0 = C(i, s) + .05; s0 = int(t0 * SR); L = int(1.5 * SR); tt = np.arange(L) / SR
    f = 55 * np.exp(-tt * 3) + 38
    v = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.5)
    nz = rng.standard_normal(L) * np.exp(-tt * 18) * .25
    fx[s0:s0 + L] += (v + nz) * (1.3 if s == '全面否定' else .9)

music = pad * .16 + piano + fx * .5
music *= np.clip((D - t) / 2.5, 0, 1)
music /= max(1e-9, np.abs(music).max()) / .7
out = os.path.join(ROOT, 'audio/music.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(music, -1, 1) * 32767).astype(np.int16).tobytes())
# 混音：配音 -16 LUFS，音乐压低到约 -29 LUFS；配音说话时音乐再自动让开一点
subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ROOT, 'audio/voice.wav'), '-i', out, '-filter_complex',
    '[0]loudnorm=I=-16:TP=-1.5:LRA=11,asplit[v][sc];[1]loudnorm=I=-28:TP=-6,aformat=channel_layouts=mono[m];'
    '[m][sc]sidechaincompress=threshold=0.03:ratio=3:attack=20:release=400[md];[v][md]amix=inputs=2:normalize=0,alimiter=limit=0.9[o]',
    '-map', '[o]', '-ar', str(SR), '-ac', '2', os.path.join(ROOT, 'audio/mix.wav')])
print('ok', out)
