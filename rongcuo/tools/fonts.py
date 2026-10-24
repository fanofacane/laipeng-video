# 从 Noto Serif SC 里只截取用到的字，生成 assets/serif-*.woff2
#   python3 tools/fonts.py <NotoSerifSC-*.otf 所在目录>
import sys, os, glob
from fontTools import subset
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
chars = set()
for f in ['src/lines.txt', 'src/scenes.js']:
    chars |= set(open(os.path.join(ROOT, f), encoding='utf-8').read())
chars |= set('0123456789?+×，。：；、！？“”')
text = ''.join(sorted(c for c in chars if c.isprintable()))
for w in ['Medium', 'Bold', 'Black']:
    o = subset.Options(); o.flavor = 'woff2'; o.layout_features = ['*']
    fnt = subset.load_font(os.path.join(src, f'NotoSerifSC-{w}.otf'), o)
    s = subset.Subsetter(o); s.populate(text=text); s.subset(fnt)
    out = os.path.join(ROOT, f'assets/serif-{w.lower()}.woff2')
    subset.save_font(fnt, out, o); print(out, os.path.getsize(out))
