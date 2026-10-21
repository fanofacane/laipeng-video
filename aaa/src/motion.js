// 「啊」kinetic typography over the stitched footage.
// Pure function of time: window.setTime(t). Design stage 720x720, rendered at dsf 1.5 (1080x1080).
(async function () {
  const BLUE = '#3400F3', YEL = '#EFFF0C', INK = '#0B0820', WHITE = '#FFFFFF';
  const FPS = 30, B1 = 3.8, B2 = 7.6;

  // ---------- easing / helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const L = (a, b, p) => a + (b - a) * p;
  const expoOut = p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
  const expoIn = p => (p <= 0 ? 0 : Math.pow(2, 10 * p - 10));
  const cubicOut = p => 1 - Math.pow(1 - p, 3);
  const cubicInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const backOut = (p, s = 1.7) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  const qf = t => Math.round(t * FPS) / FPS; // whole-frame time (crisp, no motion blur)
  // beat punch: scale kick on each beat + alternating ±tilt
  function punch(t, beats, amp = 0.25, tilt = 4) {
    let s = 1, rz = 0;
    beats.forEach((b, i) => {
      if (t >= b) {
        const dt = t - b;
        s = 1 + amp * Math.exp(-12 * dt);
        const from = i === 0 ? 0 : (i % 2 ? tilt : -tilt);
        const to = i % 2 ? -tilt : tilt;
        rz = L(from, to, expoOut(P(dt, 0, 0.18)));
      }
    });
    return { s, rz };
  }

  await document.fonts.load('900 100px "Noto Sans SC"', '啊');
  await document.fonts.ready;

  // ---------- drawing ----------
  // each glyph is drawn into a canvas cropped to its ink box (x3 internal), so placement is by visual centre
  function glyph(size, style = 'solid', n = 1, ls = 0, lw) {
    const S = 3, c = document.createElement('canvas'), x = c.getContext('2d');
    const text = '啊'.repeat(n);
    const setF = () => { x.font = `900 ${size * S}px "Noto Sans SC"`; x.letterSpacing = (ls * size * S) + 'px'; };
    setF();
    const m = x.measureText(text);
    const ol = style === 'solid' ? size * 0.075 : style === 'stroke' ? (lw ?? 1.8) : 0;
    const pad = (ol + 3) * S;
    const Lb = m.actualBoundingBoxLeft, Rb = m.actualBoundingBoxRight, Ab = m.actualBoundingBoxAscent, Db = m.actualBoundingBoxDescent;
    c.width = Math.ceil(Lb + Rb + 2 * pad); c.height = Math.ceil(Ab + Db + 2 * pad);
    setF();
    const ox = pad + Lb, oy = pad + Ab;
    x.lineJoin = 'round';
    if (style === 'solid') {
      x.strokeStyle = BLUE; x.lineWidth = ol * 2 * S; x.strokeText(text, ox, oy);
      x.fillStyle = WHITE; x.fillText(text, ox, oy);
    } else if (style === 'stroke') {
      x.strokeStyle = WHITE; x.lineWidth = ol * S; x.strokeText(text, ox, oy);
    } else {
      x.fillStyle = { blue: BLUE, white: WHITE, yel: YEL }[style]; x.fillText(text, ox, oy);
    }
    c.style.width = c.width / S + 'px'; c.style.height = c.height / S + 'px';
    return c;
  }
  function star(r, color = YEL) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (-90 + 36 * i) * Math.PI / 180, rr = i % 2 ? r * 0.45 : r;
      pts.push(`${(r + rr * Math.cos(a)).toFixed(2)},${(r + rr * Math.sin(a)).toFixed(2)}`);
    }
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', 2 * r); s.setAttribute('height', 2 * r); s.setAttribute('viewBox', `0 0 ${2 * r} ${2 * r}`);
    s.innerHTML = `<polygon points="${pts.join(' ')}" fill="${color}"/>`;
    return s;
  }
  function label(size, style = 'white', bg = INK) {
    const d = document.createElement('div'); d.className = 'label'; d.style.background = bg;
    d.appendChild(glyph(size, style)); return d;
  }

  const fx = document.getElementById('fx');
  function mk(content, parent = fx) {
    const d = document.createElement('div'); d.className = 'abs'; d.style.display = 'none';
    if (content) d.appendChild(content);
    parent.appendChild(d); return d;
  }
  function set(el, o) {
    const op = o.o ?? 1;
    if (o.show === false || op <= 0.001) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.opacity = op < 1 ? op.toFixed(3) : '1';
    const c = o.center === false ? '' : ' translate(-50%,-50%)';
    el.style.transform = `translate(${(o.x || 0).toFixed(2)}px,${(o.y || 0).toFixed(2)}px)` +
      (o.p ? ` perspective(${o.p}px)` : '') +
      ` rotateY(${(o.ry || 0).toFixed(2)}deg) rotateZ(${(o.rz || 0).toFixed(2)}deg)` +
      (o.sk ? ` skewX(${o.sk}deg)` : '') + ` scale(${(o.s ?? 1).toFixed(4)})` + c;
  }
  const G = parent => mk(null, parent); // group: children use coordinates relative to its origin

  // ================= SCENE 1 (clip 1: 0 – 3.8) =================
  // 1a: 3D flip-in 啊 + star + label + coin-spin big star + matte slide 啊啊啊, whip-out at 1.9
  const M1 = G();
  const G1 = G(M1);
  const A1 = mk(glyph(190), G1);
  const s1 = mk(star(22), G1);
  const lb1 = mk(label(34), G1);
  const BS1 = mk(star(110), M1);
  const mask1 = G(M1);
  mask1.style.width = '720px'; mask1.style.height = '720px';
  mask1.style.clipPath = 'polygon(150px 420px, 680px 420px, 641px 640px, 111px 640px)';
  const matte = [{ x: 205, y: 548, s: 1.05 }, { x: 382, y: 532, s: 0.95 }, { x: 545, y: 518, s: 0.85 }]
    .map(m => ({ ...m, el: mk(glyph(150), mask1) }));

  // 1b: letter drop 啊啊啊 + giant slam 啊 + outline echoes, whip-out at 3.45
  const M2 = G();
  const DROP = 68, SLAM_FONT = 660, TS1 = 75 / FPS; // slam lands exactly on frame 75 (2.5s)
  const drops = [-150, -68, 14].map(x => ({ x, el: mk(glyph(DROP), M2) }));
  const slam1 = mk(glyph(SLAM_FONT), M2);
  const echoSlots = [-148, -74, 74, 148];
  const echo1 = [];
  [...drops.map(d => ({ x: d.x, size: DROP })), { x: 112, size: DROP * 1.25, slam: true }].forEach(L0 => {
    echoSlots.forEach(dy => echo1.push({ x: L0.x, dy, slam: L0.slam, el: mk(glyph(L0.size, 'stroke', 1, 0, 1.6), M2) }));
  });

  function scene1(t) {
    // --- 1a ---
    if (t < 2.32) {
      const w = expoIn(P(t, 1.9, 2.3));
      set(M1, { x: 360 - 70 * w, y: 360 + 190 * w, rz: -52 * w, s: 1 - 0.5 * w, center: false });
      const p = cubicOut(P(t, 0, 0.35)), pe = expoOut(P(t, 0, 0.45));
      set(G1, { x: -110 + L(-70, 0, pe), y: -135 + L(60, 0, pe), s: 1 + 0.06 * t, rz: -2 * t, center: false });
      set(A1, { p: 700, ry: L(-86, 0, p), s: L(0.85, 1, p), o: P(t, 0, 0.05) });
      const sp = P(t, 0.15, 0.45);
      set(s1, { x: -112, y: -95, s: 1.7 * backOut(sp), rz: 140 * t, o: sp > 0 ? 1 : 0 });
      const lp = expoOut(P(t, 0.35, 0.65));
      set(lb1, { x: 102, y: 92, s: L(0.5, 1.15, lp), rz: L(12, 3, lp), o: t >= 0.35 ? 1 : 0 });
      const cq = cubicInOut(P(t, 0.05, 0.45));
      set(BS1, { x: L(-260, 225, cq), y: L(250, -190, cq), p: 700, ry: 180 * cq, s: 0.95 - 0.38 * Math.sin(Math.PI * cq), rz: 25 * t, o: t >= 0.05 ? 1 : 0 });
      set(mask1, { x: -360, y: -360, center: false });
      matte.forEach((m, i) => {
        const p2 = expoOut(P(t, 0.5 + 0.065 * i, 1.4 + 0.065 * i));
        set(m.el, { x: m.x + 560 * (1 - p2) - 14 * Math.max(0, t - 1.4), y: m.y + 6 * Math.max(0, t - 1.0), s: m.s * (1 + 0.04 * t), rz: 0, sk: -12, o: t >= 0.5 + 0.065 * i ? 1 : 0 });
      });
    } else set(M1, { show: false });

    // --- 1b ---
    if (t >= 2.0 && t < B1) {
      const w = expoIn(P(t, 3.45, 3.8));
      set(M2, { x: 380 - 10 * (t - 2.0) - 70 * w, y: 330 + 190 * w, rz: -52 * w, s: (1 + 0.05 * Math.max(0, t - TS1)) * (1 - 0.5 * w), center: false });
      drops.forEach((d, i) => {
        const st = 2.0 + 0.11 * i, p = P(t, st, st + 0.29);
        set(d.el, { x: d.x, y: L(-370, 0, backOut(p, 1.2)), rz: L(-16, 0, p), o: t >= st ? 1 : 0 });
      });
      const tq = qf(t), k = Math.round((tq - TS1) * FPS);
      const base = DROP / SLAM_FONT;
      if (k < 0) set(slam1, { show: false });
      else if (k === 0) set(slam1, { x: 70, y: 10, s: 16 * base });
      else if (k === 1) set(slam1, { x: 120, y: -5, s: 9.5 * base });
      else {
        const lt = t - TS1 - 2 / FPS;
        set(slam1, { x: 112, y: -4, s: 1.25 * base * (1 + 0.1 * (1 - cubicOut(P(lt, 0, 0.22)))) });
      }
      echo1.forEach(e => {
        const tb = Math.abs(e.dy) < 100 ? 2.9 : 3.25;
        const p = expoOut(P(t, tb, tb + 0.3));
        set(e.el, { x: e.x, y: e.dy + (e.slam ? -4 : 0), s: L(1.4, 1, p), o: t >= tb ? 0.95 * p : 0 });
      });
    } else set(M2, { show: false });
  }

  // ================= SCENE 2 (clip 2: 3.8 – 7.6) =================
  const M3 = G();
  const A3 = mk(glyph(230), M3);
  const st3a = mk(star(34), M3), st3b = mk(star(24), M3);
  const DIRS = [
    { x: 215, y: 245, fx: -620, fy: 0, t: 5.5 }, { x: 505, y: 245, fx: 620, fy: 0, t: 5.75 },
    { x: 215, y: 485, fx: 0, fy: 620, t: 6.0 }, { x: 505, y: 485, fx: 0, fy: -620, t: 6.25 },
  ].map(d => ({ ...d, el: mk(glyph(130)) }));
  const CS = mk(star(20));
  // inverted yellow beat
  const Y1 = mk(glyph(220, 'blue'));
  const ystars = [[92, 92, 7.05], [628, 92, 7.15], [628, 628, 7.25], [92, 628, 7.35]].map(([x, y, tt]) => ({ x, y, t: tt, el: mk(star(26, BLUE)) }));
  const YBEATS = [7.1, 7.225, 7.35, 7.475];

  function scene2(t) {
    if (t >= B1 && t < 5.5) {
      const p = expoOut(P(t, B1, B1 + 0.55));
      const pu = punch(t, [4.5, 5.0], 0.25);
      const e = expoIn(P(t, 5.2, 5.45));
      set(M3, { x: 360 + L(-110, 0, p) - 420 * e, y: 290 + L(250, 0, p), rz: L(62, 0, p) + pu.rz, s: L(0.8, 1, p) * pu.s * L(1, 0.6, e), o: 1 - e, center: false });
      set(A3, {});
      const sp = expoOut(P(t, B1, B1 + 0.8));
      set(st3a, { x: -168, y: -122, s: L(3.2, 1, sp), rz: L(-260, 0, sp) + 40 * (t - B1) });
      set(st3b, { x: 172, y: 112, s: L(3.2, 1, sp), rz: L(-260, 0, sp) - 50 * (t - B1) });
    } else set(M3, { show: false });

    if (t >= 5.5 && t < 6.95) {
      const c = expoIn(P(t, 6.55, 6.9));
      const pu = punch(t, [5.5, 5.75, 6.0, 6.25], 0.18, 3);
      DIRS.forEach(d => {
        const p = expoOut(P(t, d.t, d.t + 0.32));
        const x = d.x + d.fx * (1 - p), y = d.y + d.fy * (1 - p);
        set(d.el, { x: L(x, 360, c), y: L(y, 360, c), rz: pu.rz + 200 * c, s: pu.s * (1 - c), o: t >= d.t ? 1 : 0 });
      });
    } else DIRS.forEach(d => set(d.el, { show: false }));

    if (t >= 6.5 && t < 6.98) {
      const g = expoIn(P(t, 6.55, 6.95));
      set(CS, { x: 360, y: 360, s: L(0.6, 70, g) * backOut(P(t, 6.5, 6.6)), rz: 90 * (t - 6.5) });
    } else set(CS, { show: false });

    if (t >= 6.95 && t < B2) {
      const p = expoOut(P(t, 6.95, 7.2));
      const pu = punch(t, YBEATS, 0.25);
      set(Y1, { x: 360, y: 360, s: L(1.6, 1, p) * pu.s, rz: -4 + pu.rz });
      ystars.forEach(s => {
        const sp = P(t, s.t, s.t + 0.25);
        set(s.el, { x: s.x, y: s.y, s: backOut(sp), rz: 160 * (t - s.t), o: t >= s.t ? 1 : 0 });
      });
    } else { set(Y1, { show: false }); ystars.forEach(s => set(s.el, { show: false })); }
  }

  // ================= SCENE 3 (clip 3: 7.6 – 12.1) =================
  const SW = mk(glyph(600));
  const SWi = mk(glyph(44));
  const rows = [0, 1, 2, 3, 4, 5, 6].map(i => ({ i, el: mk(glyph(66, i === 3 ? 'solid' : 'stroke', 16, 0.18, 1.8)) }));
  const M5 = G();
  const BL = mk(glyph(220), M5);
  const lb5 = mk(label(36), M5);
  const st5 = mk(star(28), M5);
  const BBEATS = [9.5, 10.0, 10.5], BOFF = [620, -620, 620];
  const M6 = G();
  const drops6 = [-150, -60].map(x => ({ x, el: mk(glyph(78), M6) }));
  const slam6 = mk(glyph(SLAM_FONT), M6);
  const TS2 = 342 / FPS; // 11.4s, on a whole frame
  const burst = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy]) => ({ dx, dy, el: mk(star(22), M6) }));

  function scene3(t) {
    if (t >= B2 && t < 8.36) {
      const p = cubicInOut(P(t, B2, 8.35));
      set(SW, { x: L(1070, -350, p), y: 360 });
    } else set(SW, { show: false });
    if (t >= B2 && t < 8.5) set(SWi, { x: 360, y: 360, o: 1 - P(t, 8.35, 8.5) });
    else set(SWi, { show: false });

    if (t >= 8.35 && t < 9.5) {
      rows.forEach(r => {
        const d = Math.abs(r.i - 3), dir = r.i % 2 ? 1 : -1;
        const e = expoOut(P(t, 8.35 + 0.06 * d, 8.95 + 0.06 * d));
        const x = expoIn(P(t, 9.2 + 0.04 * d, 9.5));
        set(r.el, { x: 360 + dir * 1400 * (1 - e) - dir * 160 * (t - 8.35) - dir * 1400 * x, y: 360 + (r.i - 3) * 92, o: t >= 8.35 + 0.06 * d ? 1 : 0 });
      });
    } else rows.forEach(r => set(r.el, { show: false }));

    if (t >= 9.5 && t < 11.2) {
      let bi = 0; BBEATS.forEach((b, i) => { if (t >= b) bi = i; });
      const b = BBEATS[bi], p = expoOut(P(t, b, b + 0.35));
      const pu = punch(t, BBEATS, 0.2);
      const z = expoIn(P(t, 10.9, 11.2));
      set(M5, { x: 360, y: 360, s: L(1, 7, z), o: 1 - P(t, 11.1, 11.2), center: false });
      set(BL, { x: BOFF[bi] * (1 - p), y: 0, rz: -4 + pu.rz * 0.5, s: pu.s });
      const lp = expoOut(P(t, 10.6, 10.9));
      set(lb5, { x: 140, y: 112, s: L(0.5, 1.15, lp), rz: L(12, 3, lp), o: t >= 10.6 ? 1 : 0 });
      const sp = P(t, 10.7, 10.95);
      set(st5, { x: -150, y: -125, s: 1.5 * backOut(sp), rz: 150 * (t - 10.7), o: t >= 10.7 ? 1 : 0 });
    } else set(M5, { show: false });

    if (t >= 11.2) {
      const pu = punch(t, [11.65, 11.9], 0.22);
      const z = expoIn(P(t, 11.93, 12.08));
      set(M6, { x: 360, y: 360, s: pu.s * L(1, 0.2, z), rz: t >= 11.65 ? pu.rz : 0, o: 1 - P(t, 12.03, 12.075), center: false });
      drops6.forEach((d, i) => {
        const st = 11.2 + 0.11 * i, p = P(t, st, st + 0.29);
        set(d.el, { x: d.x, y: L(-400, 0, backOut(p, 1.2)), rz: L(-16, 0, p), o: t >= st ? 1 : 0 });
      });
      const tq = qf(t), k = Math.round((tq - TS2) * FPS), base = 78 / SLAM_FONT;
      if (k < 0) set(slam6, { show: false });
      else if (k === 0) set(slam6, { x: 40, y: 0, s: 17 * base });
      else if (k === 1) set(slam6, { x: 95, y: -8, s: 10 * base });
      else {
        const lt = t - TS2 - 2 / FPS;
        set(slam6, { x: 52, y: -3, s: 1.25 * base * (1 + 0.1 * (1 - cubicOut(P(lt, 0, 0.22)))) });
      }
      burst.forEach(b => {
        const p = expoOut(P(t, TS2 + 2 / FPS, TS2 + 0.55));
        set(b.el, { x: b.dx * 290 * p, y: b.dy * 290 * p, s: 0.4 + 0.8 * p, rz: 200 * p, o: k >= 2 ? 1 : 0 });
      });
    } else set(M6, { show: false });
  }

  // ================= HUD + footage =================
  const hud = document.getElementById('hud');
  const corners = [[30, 26], [690, 26], [30, 694], [690, 694]];
  const hudW = corners.map(() => mk(glyph(15, 'white'), hud));
  const hudB = corners.map(() => mk(glyph(15, 'blue'), hud));
  const pillW = (() => { const d = document.createElement('div'); d.className = 'pill'; d.appendChild(glyph(13, 'white', 3, 0.12)); return mk(d, hud); })();
  const pillB = (() => { const d = document.createElement('div'); d.className = 'pill'; d.style.background = BLUE; d.appendChild(glyph(13, 'yel', 3, 0.12)); return mk(d, hud); })();
  const foot = document.getElementById('foot'), yel = document.getElementById('yel');

  function setTime(t) {
    const inv = t >= 6.95 && t < B2;
    yel.style.display = inv ? 'block' : 'none';
    foot.style.display = inv ? 'none' : 'block';
    let z = 1;
    for (const [b, a] of [[TS1, 0.08], [TS2, 0.08], [B1, 0.06], [B2, 0.06]]) if (t >= b) z += a * Math.exp(-9 * (t - b));
    foot.style.transform = `scale(${z.toFixed(4)})`;
    scene1(t); scene2(t); scene3(t);
    corners.forEach(([x, y], i) => { set(hudW[i], { x, y, show: !inv }); set(hudB[i], { x, y, show: inv }); });
    set(pillW, { x: 360, y: 690, show: !inv }); set(pillB, { x: 360, y: 690, show: inv });
  }
  async function setFrame(f) {
    const src = `../footage/frames/${String(f + 1).padStart(4, '0')}.jpg`;
    if (!foot.src.endsWith(src.slice(2))) { foot.src = src; await foot.decode(); }
  }
  window.setTime = setTime;
  window.setFrame = setFrame;
  setTime(0);
  window.READY = true;
})();
