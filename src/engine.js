// Deterministic, seekable animation engine.
// Every visual state is a pure function of time t, so frames can be rendered one by one.
(function () {
  const TM = window.TIMING;
  const scenes = [];
  const chapters = [];
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const E = {
    out: p => 1 - Math.pow(1 - p, 3),
    inout: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: p => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
    lin: p => p,
  };

  const ln = i => TM.lines[i];
  function idx(li, sub, from = 0) {
    const i = TM.lines[li].text.indexOf(sub, from);
    if (i < 0) throw new Error(`[at] "${sub}" not found in line ${li}`);
    return i;
  }
  // time when the narrator starts saying `sub` in line li (k = char offset inside sub)
  function at(li, sub, k = 0) { const L = TM.lines[li]; return L.chars[Math.min(L.chars.length - 1, idx(li, sub) + k)]; }
  // time when the narrator finishes `sub`
  function atEnd(li, sub) { const L = TM.lines[li]; const i = idx(li, sub) + sub.length - 1; return L.chars[Math.min(L.chars.length - 1, i)] + 0.2; }
  // per-character times for `sub` in line li (for synced typing)
  function charTimes(li, sub) { const L = TM.lines[li]; const i = idx(li, sub); return L.chars.slice(i, i + sub.length); }

  let cur = null;
  function make(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    if (tpl.content.childNodes.length === 1 && tpl.content.firstElementChild) return tpl.content.firstElementChild;
    const d = document.createElement('div'); d.innerHTML = html; return d;
  }
  const ANCH = { c: '-50% -50%', tl: '0 0', l: '0 -50%', t: '-50% 0', r: '-100% -50%', tr: '-100% 0', b: '-50% -100%', bl: '0 -100%' };
  function put(html, x, y, opt = {}) {
    const el = typeof html === 'string' ? make(html) : html;
    el.style.position = 'absolute';
    el.style.left = x + 'px'; el.style.top = y + 'px';
    el.style.translate = ANCH[opt.a || 'c'];
    if (opt.w) el.style.width = opt.w + 'px';
    if (opt.h) el.style.height = opt.h + 'px';
    if (opt.css) Object.assign(el.style, opt.css);
    (opt.parent || cur.el).appendChild(el);
    return el;
  }
  function A(el, t, type = 'up', dur = 0.6, o = {}) {
    if (!el) throw new Error('A(): missing element for ' + type);
    cur.anims.push({ el, t, type, dur, o });
    cur.els.add(el);
    return el;
  }
  const q = (el, s) => el.querySelector(s);
  const qa = (el, s) => [...el.querySelectorAll(s)];

  function scene(a, b, build, opt = {}) {
    const t0 = opt.t0 ?? (a === 0 ? 0 : ln(a).start - 0.3);
    const t1 = opt.t1 ?? (b + 1 < TM.lines.length ? ln(b + 1).start - 0.3 : TM.duration + 1);
    const el = document.createElement('div');
    el.className = 'scene';
    document.getElementById('scenes').appendChild(el);
    const sc = { t0, t1, el, anims: [], els: new Set(), zoom: opt.zoom ?? 0.035 };
    cur = sc;
    build(sc);
    cur = null;
    scenes.push(sc);
    return sc;
  }

  function applyAnims(sc, t) {
    for (const el of sc.els) { el._op = 1; el._tf = ''; el._g = null; }
    for (const an of sc.anims) {
      const { el, type, dur, o } = an;
      const pl = clamp((t - an.t) / Math.max(dur, 1e-3));
      const p = (E[o.ease] || E.out)(pl);
      const d = o.d ?? 40;
      switch (type) {
        case 'fade': el._op *= p; break;
        case 'up': el._op *= clamp(pl * 1.6); el._tf += ` translateY(${(1 - p) * d}px)`; break;
        case 'down': el._op *= clamp(pl * 1.6); el._tf += ` translateY(${-(1 - p) * d}px)`; break;
        case 'left': el._op *= clamp(pl * 1.6); el._tf += ` translateX(${-(1 - p) * d}px)`; break;
        case 'right': el._op *= clamp(pl * 1.6); el._tf += ` translateX(${(1 - p) * d}px)`; break;
        case 'pop': el._op *= clamp(pl * 2.5); el._tf += ` scale(${0.55 + 0.45 * E.back(pl)})`; break;
        case 'zoom': el._op *= p; el._tf += ` scale(${1.18 - 0.18 * p})`; break;
        case 'wipe': el.style.clipPath = `inset(-20px ${(1 - p) * 100}% -20px -20px)`; break;
        case 'wipey': el.style.clipPath = `inset(-20px -20px ${(1 - p) * 100}% -20px)`; break;
        case 'grow': el._tf += ` scaleX(${p})`; break;
        case 'growy': el._tf += ` scaleY(${p})`; break;
        case 'move': el._tf += ` translate(${(1 - p) * (o.x || 0)}px,${(1 - p) * (o.y || 0)}px)`; break;
        case 'shift': el._tf += ` translate(${p * (o.x || 0)}px,${p * (o.y || 0)}px)`; break;
        case 'scale': el._tf += ` scale(${o.a + (o.b - o.a) * p})`; break;
        case 'dim': el._op *= 1 - (1 - (o.v ?? 0.3)) * p; break;
        case 'out': el._op *= 1 - p; if (o.d) el._tf += ` translateY(${-p * o.d}px)`; break;
        case 'strike': { const s = el.querySelector(':scope > .sl'); if (s) s.style.transform = `scaleX(${p})`; break; }
        case 'glow': el._g = (el._g ?? 0) + p; break;
        case 'unglow': el._g = (el._g ?? 0) - p; break;
        case 'cls': el.classList.toggle(o.c, t >= an.t); break;
        case 'draw': el.style.strokeDashoffset = String(1 - p); break;
        case 'type': {
          if (el._full == null) el._full = el.textContent;
          const n = Math.round(clamp(pl) * el._full.length);
          el.textContent = el._full.slice(0, n);
          break;
        }
        case 'typeT': { // typing synced to narration char times (o.times)
          if (el._full == null) el._full = el.textContent;
          let n = 0; for (let i = 0; i < o.times.length; i++) if (t >= o.times[i]) n = i + 1;
          el.textContent = el._full.slice(0, n);
          break;
        }
        case 'count': {
          const v = o.from + (o.to - o.from) * p;
          el.textContent = (o.pre || '') + v.toFixed(o.dec || 0) + (o.suf || '');
          break;
        }
      }
    }
    for (const el of sc.els) {
      el.style.opacity = el._op.toFixed(4);
      el.style.transform = el._tf;
      if (el._g != null) el.style.setProperty('--g', clamp(el._g).toFixed(3));
    }
  }

  // ---------- background ----------
  const bg = document.getElementById('bg');
  const ctx = bg.getContext('2d');
  function drawBg(t) {
    const W = 1920, H = 1080;
    ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, W, H);
    const blob = (x, y, r, c) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c); g.addColorStop(1, 'rgba(4,6,12,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    };
    blob(1450 + 160 * Math.sin(t * 0.07), 260 + 90 * Math.cos(t * 0.05), 950, 'rgba(40,120,255,0.13)');
    blob(380 + 140 * Math.cos(t * 0.06), 860 + 70 * Math.sin(t * 0.08), 900, 'rgba(120,90,255,0.11)');
    blob(960, 520, 700, 'rgba(70,224,255,0.035)');
    // dot grid with a slow diagonal light sweep
    const sp = 48;
    for (let y = sp / 2; y < H; y += sp) {
      for (let x = sp / 2; x < W; x += sp) {
        const w = Math.pow(Math.max(0, Math.sin((x * 0.6 + y) * 0.0032 - t * 0.35)), 12);
        const a = 0.07 + 0.32 * w;
        ctx.fillStyle = `rgba(150,190,255,${a.toFixed(3)})`;
        ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
      }
    }
    // vignette
    const v = ctx.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1150);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ---------- subtitles / HUD ----------
  const subEl = document.getElementById('subtext');
  const subBox = document.getElementById('sub');
  function drawSub(t) {
    const s = TM.subs.find(s => t >= s.start - 0.05 && t < s.end + 0.12);
    if (!s) { subEl.textContent = ''; return; }
    if (subEl.textContent !== s.text) subEl.textContent = s.text;
    const p = E.out(clamp((t - s.start + 0.05) / 0.16));
    subBox.style.opacity = p.toFixed(3);
    subBox.style.transform = `translateY(${(1 - p) * 10}px)`;
  }
  const chno = document.getElementById('chno'), chname = document.getElementById('chname'), prog = document.getElementById('prog');
  function drawHud(t) {
    let c = chapters[0];
    for (const ch of chapters) if (t >= ch.t) c = ch;
    if (c) { if (chno.textContent !== c.no) { chno.textContent = c.no; chname.textContent = c.name; } }
    prog.style.width = (clamp(t / TM.duration) * 100).toFixed(3) + '%';
  }

  function seek(t) {
    drawBg(t);
    for (const sc of scenes) {
      const vis = t >= sc.t0 - 0.25 && t <= sc.t1 + 0.35;
      sc.el.style.display = vis ? 'block' : 'none';
      if (!vis) continue;
      const fin = E.out(clamp((t - (sc.t0 - 0.2)) / 0.4));
      const fout = 1 - E.inout(clamp((t - (sc.t1 - 0.15)) / 0.4));
      const prog = clamp((t - sc.t0) / (sc.t1 - sc.t0));
      sc.el.style.opacity = (fin * fout).toFixed(4);
      const z = 1 + sc.zoom * prog + 0.04 * (1 - fin) + 0.03 * (1 - fout);
      sc.el.style.transform = `scale(${z.toFixed(5)})`;
      sc.el.style.filter = (fin < 1 || fout < 1) ? `blur(${((1 - fin) * 8 + (1 - fout) * 8).toFixed(2)}px)` : 'none';
      applyAnims(sc, t);
    }
    drawSub(t);
    drawHud(t);
  }

  async function init() {
    // make everything lay out once so all font subsets get requested
    const warm = document.createElement('div');
    warm.style.cssText = 'position:absolute;left:0;top:0;opacity:.01;font:700 44px var(--zh);white-space:nowrap';
    warm.textContent = TM.subs.map(s => s.text).join('');
    document.getElementById('stage').appendChild(warm);
    for (const sc of scenes) { sc.el.style.display = 'block'; sc.el.style.opacity = '0.01'; }
    document.body.getBoundingClientRect();
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 300));
    await document.fonts.ready;
    warm.remove();
    seek(0);
  }

  window.ENGINE = { init, seek, scene, put, A, q, qa, at, atEnd, charTimes, ln, chapters, TM, clamp };

  // live preview: open index.html?play  (needs the audio next to it)
  if (location.search.includes('play')) {
    window.addEventListener('load', () => {
      const au = new Audio('../audio/voice.wav');
      document.body.addEventListener('click', () => { au.paused ? au.play() : au.pause(); });
      const loop = () => { seek(au.currentTime); requestAnimationFrame(loop); };
      ENGINE.init().then(loop);
    });
  }
})();
