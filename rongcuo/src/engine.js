// 画布动画引擎：每一帧都是时间 t 的纯函数，可逐帧渲染。
// 三层：L 发光层（金线、光点，统一做泛光）→ T 文字层（标签、红色印章）→ 顶部字幕。
(function () {
  const W = 1080, H = 1920;
  const TM = window.TIMING;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const E = {
    lin: p => p,
    out: p => 1 - Math.pow(1 - p, 3),
    in: p => p * p * p,
    inout: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: p => { const c = 1.9, c3 = c + 1; return 1 + c3 * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  };
  // 从 a 开始、持续 d 秒的进度
  const k = (t, a, d, e = 'out') => E[e](clamp((t - a) / Math.max(d, 1e-4)));
  // a 时淡入、b 时淡出
  const win = (t, a, b, fi = .4, fo = .4) => Math.min(k(t, a, fi, 'inout'), 1 - k(t, b - fo, fo, 'inout'));
  // 关键帧插值 [[t, v], ...]
  function kf(t, keys, e = 'inout') {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
        return lerp(v0, v1, E[e](clamp((t - t0) / Math.max(t1 - t0, 1e-4))));
      }
    }
    return keys[keys.length - 1][1];
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ---------- 时间轴辅助 ----------
  const S = i => TM.lines[i].start;
  const EN = i => TM.lines[i].end;
  function C(i, sub, off = 0) {
    const L = TM.lines[i]; const j = L.text.indexOf(sub);
    if (j < 0) throw new Error(`C(): "${sub}" 不在第 ${i} 句`);
    return L.chars[Math.min(L.chars.length - 1, j + off)];
  }

  // ---------- 路径 ----------
  function catmull(pts, seg = 14) {
    if (pts.length < 3) return pts.map(p => [p[0], p[1]]);
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let s = 0; s < seg; s++) {
        const u = s / seg, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map(d => .5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3)));
      }
    }
    out.push([pts[pts.length - 1][0], pts[pts.length - 1][1]]);
    return out;
  }
  class Path {
    constructor(pts, smooth = true) {
      this.p = smooth ? catmull(pts) : pts.map(p => [p[0], p[1]]);
      this.c = [0];
      for (let i = 1; i < this.p.length; i++) this.c.push(this.c[i - 1] + Math.hypot(this.p[i][0] - this.p[i - 1][0], this.p[i][1] - this.p[i - 1][1]));
      this.len = this.c[this.c.length - 1] || 1;
    }
    at(u) {
      const s = clamp(u) * this.len; let lo = 0, hi = this.c.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.c[m] < s) lo = m; else hi = m; }
      const a = this.p[lo], b = this.p[hi], f = (s - this.c[lo]) / Math.max(this.c[hi] - this.c[lo], 1e-6);
      return { x: lerp(a[0], b[0], f), y: lerp(a[1], b[1], f), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    }
    trace(c, u0, u1) {
      u0 = clamp(u0); u1 = clamp(u1); if (u1 <= u0) return false;
      const s0 = u0 * this.len, s1 = u1 * this.len;
      const a = this.at(u0); c.beginPath(); c.moveTo(a.x, a.y);
      for (let i = 0; i < this.p.length; i++) if (this.c[i] > s0 && this.c[i] < s1) c.lineTo(this.p[i][0], this.p[i][1]);
      const b = this.at(u1); c.lineTo(b.x, b.y);
      return true;
    }
  }

  // ---------- 画布 ----------
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  let out, O, Lc, L, Tc, T, b1, B1, b2, B2, tmpC, TMP, grain = [];
  let SA = 1; // 当前场景的整体透明度
  const cam = { x: W / 2, y: H / 2, s: 1, r: 0 };

  const GOLD = [244, 222, 182], GOLDH = [255, 196, 120], RED = [226, 52, 44], GREY = [150, 140, 128];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${clamp(a)})`;
  const mixc = (a, b, p) => a.map((v, i) => Math.round(lerp(v, b[i], p)));
  const FONT = '"NSerif", "Noto Serif CJK SC", serif';

  function setCam(x, y, s = 1, r = 0) { cam.x = x; cam.y = y; cam.s = s; cam.r = r; }
  function applyCam(c) { c.setTransform(1, 0, 0, 1, 0, 0); c.translate(W / 2, H / 2); c.rotate(cam.r); c.scale(cam.s, cam.s); c.translate(-cam.x, -cam.y); }

  // 金线
  function line(path, u0, u1, o = {}) {
    const a = (o.a ?? 1) * SA; if (a <= 0.003) return;
    if (!path.trace(L, u0, u1)) return;
    L.lineCap = 'round'; L.lineJoin = 'round';
    L.strokeStyle = rgba(o.col || GOLD, a); L.lineWidth = o.w ?? 3;
    if (o.dash) L.setLineDash(o.dash); else L.setLineDash([]);
    L.stroke(); L.setLineDash([]);
  }
  function seg(x0, y0, x1, y1, o = {}) { line(new Path([[x0, y0], [x1, y1]], false), 0, o.p ?? 1, o); }
  // 光点
  function dot(x, y, r = 7, o = {}) {
    const a = (o.a ?? 1) * SA; if (a <= 0.003 || r <= 0) return;
    const col = o.col || GOLD;
    const hr = r * (o.halo ?? 5);
    const g = L.createRadialGradient(x, y, 0, x, y, hr);
    const hc = o.col ? col : GOLDH;
    g.addColorStop(0, rgba(hc, .55 * a)); g.addColorStop(.25, rgba(hc, .18 * a)); g.addColorStop(1, rgba(hc, 0));
    L.fillStyle = g; L.beginPath(); L.arc(x, y, hr, 0, 7); L.fill();
    L.fillStyle = rgba(mixc(col, [255, 255, 255], .45), a); L.beginPath(); L.arc(x, y, r, 0, 7); L.fill();
  }
  function ring(x, y, r, o = {}) {
    const a = (o.a ?? 1) * SA; if (a <= 0.003) return;
    L.strokeStyle = rgba(o.col || GOLD, a); L.lineWidth = o.w ?? 2;
    L.beginPath(); L.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (o.p ?? 1)); L.stroke();
  }
  // 大光晕
  function flare(x, y, r, a = 1, col = GOLDH) {
    a *= SA; if (a <= 0.003) return;
    const g = L.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(col, .5 * a)); g.addColorStop(.3, rgba(col, .12 * a)); g.addColorStop(1, rgba(col, 0));
    L.fillStyle = g; L.beginPath(); L.arc(x, y, r, 0, 7); L.fill();
  }
  function arrowHead(x, y, ang, sz = 16, o = {}) {
    const a = (o.a ?? 1) * SA; if (a <= .003) return;
    L.save(); L.translate(x, y); L.rotate(ang);
    L.strokeStyle = rgba(o.col || GOLD, a); L.lineWidth = o.w ?? 3; L.lineCap = 'round'; L.lineJoin = 'round';
    L.beginPath(); L.moveTo(-sz, -sz * .6); L.lineTo(0, 0); L.lineTo(-sz, sz * .6); L.stroke(); L.restore();
  }

  // 文字标签（文字层，跟随镜头）
  function text(str, x, y, o = {}) {
    const a = (o.a ?? 1) * SA; if (a <= 0.003) return;
    const c = o.layer === 'L' ? L : T;
    c.save();
    c.font = `${o.w ?? 700} ${o.s ?? 34}px ${FONT}`;
    c.textAlign = o.al || 'center'; c.textBaseline = 'middle';
    c.globalAlpha = a;
    if (o.blur > 0.05) c.filter = `blur(${o.blur}px)`;
    const tx = x + (o.dx || 0), ty = y + (o.dy || 0);
    if (o.sc && o.sc !== 1 || o.rot) { c.translate(tx, ty); c.rotate(o.rot || 0); c.scale(o.sc || 1, o.sc || 1); c.translate(-tx, -ty); }
    if (o.glow) { c.shadowColor = rgba(o.glowc || o.c || [255, 255, 255], o.glow); c.shadowBlur = o.gb ?? 24; }
    c.fillStyle = rgba(o.c || [240, 236, 228], 1);
    if (o.ls) {
      // 字间距
      const chars = [...str]; const ws = chars.map(ch => c.measureText(ch).width);
      const tot = ws.reduce((s, v) => s + v, 0) + o.ls * (chars.length - 1);
      let cx = c.textAlign === 'center' ? tx - tot / 2 : c.textAlign === 'right' ? tx - tot : tx;
      c.textAlign = 'left';
      chars.forEach((ch, i) => { c.fillText(ch, cx, ty); cx += ws[i] + o.ls; });
    } else c.fillText(str, tx, ty);
    c.restore();
  }
  // 红色印章字：砸入（模糊→清晰），可选消散
  function stamp(str, x, y, t, t0, o = {}) {
    if (t < t0) return;
    const p = k(t, t0, o.d ?? .22, 'out');
    let sc = lerp(o.from ?? 1.9, 1, p), blur = lerp(10, o.rest ?? 1.4, p), a = clamp((t - t0) / .08);
    if (o.t1 != null && t > o.t1) {
      const q = k(t, o.t1, o.d1 ?? .7, 'out');
      sc *= 1 + .25 * q; blur += 14 * q; a *= 1 - q;
    }
    // 落地冲击：轻微抖动
    const sh = (1 - k(t, t0 + .2, .35, 'out')) * (t > t0 + .18 ? 1 : 0) * (o.shake ?? 6);
    const dx = Math.sin(t * 90) * sh, dy = Math.cos(t * 77) * sh;
    const base = { s: o.s ?? 96, w: 900, c: RED, rot: o.rot ?? -.06, al: 'center' };
    text(str, x + dx, y + dy, { ...base, a: a * .85, blur: blur + 10, sc: sc * 1.04, c: [200, 30, 26] });
    text(str, x + dx, y + dy, { ...base, a, blur, sc, glow: .8, glowc: [255, 40, 30], gb: 40 });
    // 砸地闪光
    if (o.flash !== false) flareT(x, y, (o.s ?? 96) * 2.2, (1 - k(t, t0 + .1, .5)) * (t > t0 + .1 ? .9 : 0));
  }
  function flareT(x, y, r, a) {
    a *= SA; if (a <= 0.003) return;
    const g = T.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,70,50,${.35 * a})`); g.addColorStop(1, 'rgba(255,40,30,0)');
    T.fillStyle = g; T.beginPath(); T.arc(x, y, r, 0, 7); T.fill();
  }

  // ---------- 场景 ----------
  const scenes = [];
  function scene(t0, t1, draw, o = {}) { scenes.push({ t0, t1, draw, fi: o.fi ?? .6, fo: o.fo ?? .6 }); }

  // ---------- 字幕 ----------
  function splitLine(s) {
    const body = s.replace(/[，。；：！？]$/, '');
    const L0 = [...s].length;
    if (L0 <= 13) return [s];
    let best = -1, bd = 1e9;
    for (let i = 0; i < body.length - 1; i++) if ('，、：'.includes(body[i])) { const d = Math.abs(i + 1 - L0 / 2); if (d < bd) { bd = d; best = i + 1; } }
    if (best < 0) best = Math.ceil(L0 / 2);
    return [s.slice(0, best), s.slice(best)];
  }
  function subtitles(t) {
    const ls = TM.lines;
    for (let i = 0; i < ls.length; i++) {
      const Ln = ls[i];
      const next = ls[i + 1];
      const hide = next ? Math.min(next.start - .12, Ln.end + 1.4) : Ln.end + .9;
      if (t < Ln.chars[0] - .2 || t > hide + .3) continue;
      const fo = 1 - k(t, hide, .3, 'inout');
      const rows = splitLine(Ln.text);
      O.save();
      O.font = `700 50px ${FONT}`; O.textBaseline = 'middle'; O.textAlign = 'left';
      let ci = 0;
      rows.forEach((row, r) => {
        const chars = [...row]; const ws = chars.map(ch => O.measureText(ch).width);
        const tot = ws.reduce((s, v) => s + v, 0) + 3 * (chars.length - 1);
        let x = W / 2 - tot / 2; const y = 214 + r * 76;
        chars.forEach((ch, j) => {
          const tc = Ln.chars[ci + j] - .1;
          const p = k(t, tc, .32, 'out');
          if (p > 0) {
            O.globalAlpha = p * fo;
            O.filter = p < .98 ? `blur(${(1 - p) * 9}px)` : 'none';
            O.shadowColor = 'rgba(0,0,0,.6)'; O.shadowBlur = 12;
            O.fillStyle = '#f3efe8';
            O.fillText(ch, x - (1 - p) * 10, y);
          }
          x += ws[j] + 3;
        });
        ci += chars.length;
      });
      O.restore();
    }
  }

  // ---------- 背景 ----------
  function background(t) {
    O.setTransform(1, 0, 0, 1, 0, 0); O.globalAlpha = 1; O.globalCompositeOperation = 'source-over';
    O.fillStyle = '#060504'; O.fillRect(0, 0, W, H);
    const br = .85 + .15 * Math.sin(t * .4);
    const g = O.createRadialGradient(W / 2, H * .52, 0, W / 2, H * .52, H * .62);
    g.addColorStop(0, `rgba(58,42,24,${.55 * br})`); g.addColorStop(.45, 'rgba(30,22,14,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    O.fillStyle = g; O.fillRect(0, 0, W, H);
  }

  function render(t) {
    background(t);
    for (const c of [L, T]) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1; c.filter = 'none'; }
    for (const sc of scenes) {
      if (t < sc.t0 - .01 || t > sc.t1 + .01) continue;
      SA = Math.min(sc.t0 <= 0 ? 1 : k(t, sc.t0, sc.fi, 'inout'), 1 - k(t, sc.t1 - sc.fo, sc.fo, 'inout'));
      if (SA <= 0) continue;
      setCam(W / 2, H / 2, 1, 0); applyCam(L); applyCam(T);
      sc.draw(t, t - sc.t0);
      SA = 1;
    }
    for (const c of [L, T]) c.setTransform(1, 0, 0, 1, 0, 0);
    // 泛光：缩小后模糊再叠加
    B1.clearRect(0, 0, b1.width, b1.height); B1.filter = 'blur(5px)'; B1.drawImage(Lc, 0, 0, b1.width, b1.height); B1.filter = 'none';
    B2.clearRect(0, 0, b2.width, b2.height); B2.filter = 'blur(7px)'; B2.drawImage(Lc, 0, 0, b2.width, b2.height); B2.filter = 'none';
    O.globalCompositeOperation = 'lighter';
    O.globalAlpha = .95; O.drawImage(b2, 0, 0, W, H);
    O.globalAlpha = .9; O.drawImage(b1, 0, 0, W, H);
    O.globalAlpha = 1; O.globalCompositeOperation = 'source-over';
    O.drawImage(Lc, 0, 0);
    O.drawImage(Tc, 0, 0);
    subtitles(t);
    // 暗角
    const v = O.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)');
    O.fillStyle = v; O.fillRect(0, 0, W, H);
    // 颗粒
    O.globalAlpha = .06; O.globalCompositeOperation = 'overlay';
    O.drawImage(grain[Math.floor(t * 24) % grain.length], 0, 0, W, H);
    O.globalAlpha = 1; O.globalCompositeOperation = 'source-over';
    // 开头/结尾黑场
    const blk = Math.max(1 - k(t, 0, .5), k(t, TM.duration - 1.2, 1.2, 'inout'));
    if (blk > 0) { O.fillStyle = `rgba(0,0,0,${blk})`; O.fillRect(0, 0, W, H); }
  }

  async function init() {
    out = document.getElementById('out'); O = out.getContext('2d');
    Lc = mk(W, H); L = Lc.getContext('2d');
    Tc = mk(W, H); T = Tc.getContext('2d');
    b1 = mk(W / 4, H / 4); B1 = b1.getContext('2d');
    b2 = mk(W / 12, H / 12); B2 = b2.getContext('2d');
    tmpC = mk(W, H); TMP = tmpC.getContext('2d');
    const r = rng(7);
    for (let n = 0; n < 6; n++) {
      const g = mk(W / 2, H / 2), gc = g.getContext('2d'), id = gc.createImageData(g.width, g.height);
      for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
      gc.putImageData(id, 0, 0); grain.push(g);
    }
    for (const [w, f] of [[500, 'medium'], [700, 'bold'], [900, 'black']]) {
      const ff = new FontFace('NSerif', `url(../assets/serif-${f}.woff2)`, { weight: String(w) });
      await ff.load(); document.fonts.add(ff);
    }
    await document.fonts.ready;
    window.buildScenes();
    render(0);
  }

  window.ENGINE = { init, seek: render, get duration() { return TM.duration; } };
  Object.assign(window, {
    W, H, TM, clamp, lerp, E, k, win, kf, rng, S, EN, C, Path, catmull, line, seg, dot, ring, flare, arrowHead, text, stamp,
    scene, setCam, applyCam, GOLD, GOLDH, RED, GREY, rgba, mixc, FONT,
  });
  for (const [n, f] of Object.entries({ L: () => L, T: () => T, TMP: () => TMP, tmpC: () => tmpC, SA: () => SA }))
    Object.defineProperty(window, n, { get: f, configurable: true });
})();
