"""Align the script (src/script.txt) to the ASR of the cut voice track and
write src/timing.js with per-line, per-char and subtitle timings."""
import json, re, difflib, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
asr = json.load(open(os.path.join(ROOT, 'tools/voice_asr.json')))
lines = [l.strip() for l in open(os.path.join(ROOT, 'src/script.txt'), encoding='utf-8') if l.strip()]
PUNCT = set('，。：；？！、“”‘’（）,.:;?!"\'() …—')
def norm(c): return c.lower()
# ASR chars with times
ac, at = [], []
for s in asr:
    for w in s['words']:
        t = [c for c in w['w'] if c not in PUNCT and not c.isspace()]
        if not t: continue
        d = (w['e'] - w['s']) / len(t)
        for i, c in enumerate(t):
            ac.append(norm(c)); at.append((w['s'] + i*d, w['s'] + (i+1)*d))
# script chars
sc, sidx = [], []  # normalized char, (line, pos)
for li, l in enumerate(lines):
    for pi, c in enumerate(l):
        if c in PUNCT or c.isspace(): continue
        sc.append(norm(c)); sidx.append((li, pi))
sm = difflib.SequenceMatcher(None, sc, ac, autojunk=False)
st = [None]*len(sc)
for a, b, n in sm.get_matching_blocks():
    for k in range(n): st[a+k] = at[b+k]
matched = sum(x is not None for x in st)
# interpolate gaps
i = 0
while i < len(st):
    if st[i] is None:
        j = i
        while j < len(st) and st[j] is None: j += 1
        t0 = st[i-1][1] if i > 0 else 0.0
        t1 = st[j][0] if j < len(st) else t0 + 0.2*(j-i)
        d = (t1 - t0) / (j - i)
        for k in range(i, j): st[k] = (t0 + (k-i)*d, t0 + (k-i+1)*d)
        i = j
    else: i += 1
# per line char time table (punct chars get time of next real char)
out = []
for li, l in enumerate(lines):
    ct = [None]*len(l)
    for k, (a, b) in enumerate(sidx):
        if a == li: ct[b] = st[k]
    nxt = None
    for p in range(len(l)-1, -1, -1):
        if ct[p] is None: ct[p] = nxt
        else: nxt = ct[p]
    prv = None
    for p in range(len(l)):
        if ct[p] is None: ct[p] = prv
        else: prv = ct[p]
    reals = [ct[p] for p in range(len(l)) if l[p] not in PUNCT and not l[p].isspace()]
    out.append({'text': l, 'start': round(reals[0][0], 3), 'end': round(reals[-1][1], 3),
                'chars': [round(c[0], 3) for c in ct]})
# subtitles: split by punctuation into clauses, merge to <= MAXC chars
MAXC = 17
subs = []
for li, o in enumerate(out):
    l = o['text']; parts = []; cur = ''; s0 = 0
    for p, c in enumerate(l):
        cur += c
        if c in '，。：；？！':
            parts.append((s0, p+1)); s0 = p+1; cur = ''
    if s0 < len(l): parts.append((s0, len(l)))
    merged = []
    for a, b in parts:
        if merged and (b - merged[-1][0]) <= MAXC and (merged[-1][1]-merged[-1][0]) < 8:
            merged[-1] = (merged[-1][0], b)
        else: merged.append((a, b))
    for a, b in merged:
        txt = l[a:b].strip()
        txt = re.sub(r'[，。：；、]+$', '', txt)
        txt = txt.replace('“', '').replace('”', '')
        if not txt: continue
        # time of first & last real char
        reals = [p for p in range(a, b) if l[p] not in PUNCT and not l[p].isspace()]
        t0 = o['chars'][reals[0]]; t1 = o['chars'][reals[-1]] + 0.18
        subs.append({'line': li, 'text': txt, 'start': round(t0, 3), 'end': round(t1, 3)})
# extend subs to fill small gaps
for a, b in zip(subs, subs[1:]):
    if b['start'] - a['end'] < 0.6: a['end'] = b['start']
dur = float(sys.argv[1]) if len(sys.argv) > 1 else out[-1]['end'] + 1
with open(os.path.join(ROOT, 'src/timing.js'), 'w', encoding='utf-8') as f:
    f.write('window.TIMING = ' + json.dumps({'duration': dur, 'lines': out, 'subs': subs}, ensure_ascii=False) + ';\n')
print(f'matched {matched}/{len(sc)} chars; {len(subs)} subtitles')
for o in out: print(f"{o['start']:7.2f}-{o['end']:7.2f} {o['text'][:30]}")
