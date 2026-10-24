// 分镜：每一段对应 lines.txt 里的一个小节。时间都从配音的逐字时间里取（S 句首、EN 句尾、C 某个词开始）。
window.buildScenes = function () {
  const cam = (x, y, s = 1, r = 0) => { setCam(x, y, s, r); applyCam(L); applyCam(T); };
  // 从 (x,y) 出发、位移 (dx,dy) 的弯曲枝条
  const br = (x, y, dx, dy, bend = .18) => new Path([[x, y], [x + dx * .5 - dy * bend, y + dy * .5 + dx * bend], [x + dx, y + dy]]);
  const label = (s, x, y, o = {}) => text(s, x, y, { s: 32, w: 700, ...o });
  const small = (s, x, y, o = {}) => text(s, x, y, { s: 26, w: 500, c: [170, 160, 146], ...o });
  const B = [0, S(3) - .7, S(8) - .7, S(13) - .7, S(17) - .7, S(20) - .7, S(23) - .7, S(25) - .7, S(28) - .7, S(30) - .7, TM.duration];
  const span = i => [B[i], B[i + 1] + .6];

  // 关系网（D、J 两段复用）
  const net = (() => {
    const r = rng(11), pts = [];
    for (let y = -600, row = 0; y < 2600; y += 150, row++)
      for (let x = 30 + (row % 2) * 70; x < 1100; x += 140) pts.push([x + (r() - .5) * 90, y + (r() - .5) * 90]);
    const edges = [], nb = pts.map(() => []);
    pts.forEach((p, i) => {
      const near = pts.map((q, j) => [Math.hypot(q[0] - p[0], q[1] - p[1]), j]).filter(d => d[1] > i && d[0] < 225).sort((a, b) => a[0] - b[0]).slice(0, 3);
      for (const [, j] of near) {
        const q = pts[j], b = (r() - .5) * .35;
        edges.push(new Path([p, [(p[0] + q[0]) / 2 - (q[1] - p[1]) * b, (p[1] + q[1]) / 2 + (q[0] - p[0]) * b], q]));
        nb[i].push(j); nb[j].push(i);
      }
    });
    return { pts, edges, nb };
  })();
  function drawNet(c, a, col = [214, 190, 150], w = 1.6) {
    c.strokeStyle = rgba(col, a); c.lineWidth = w; c.lineCap = 'round';
    for (const e of net.edges) { e.trace(c, 0, 1); c.stroke(); }
  }

  // 漂浮微尘（全程）
  {
    const r = rng(3), ps = Array.from({ length: 46 }, () => [r() * W, r() * H, .3 + r() * .7, r() * 6.28, 1 + r() * 2]);
    scene(0, TM.duration, (t) => {
      L.setTransform(1, 0, 0, 1, 0, 0);
      for (const [x, y, sp, ph, rr] of ps) {
        const yy = ((y - t * 14 * sp) % H + H) % H, xx = x + Math.sin(t * .3 + ph) * 30;
        const a = .25 + .25 * Math.sin(t * 1.3 + ph);
        L.fillStyle = rgba(GOLDH, a * .5); L.beginPath(); L.arc(xx, yy, rr, 0, 7); L.fill();
      }
    }, { fi: 0, fo: 0 });
  }

  // ===== A 开场：一条“理想人生”时间线 → 被标记“选错” → 长出分叉 → 一个决定 vs 众多力量 =====
  {
    const X = 540, ys = [1460, 1200, 940, 680];
    const ages = ['18 岁', '22 岁', '26 岁', '30 岁'], evs = ['选专业', '第一份工作', '一段感情', '换一座城市'];
    const trunk = new Path([[X, 1600], [X, 600]], false);
    const tStamp = C(0, '容错'), tBr = C(0, '大到'), tDec = C(1, '一个决定'), tFut = C(1, '未来'), tMany = S(2);
    const alts = [
      [[-1, '复读', -20], [1, '转专业', 40], [-1, '先去工作', 150]],
      [[1, '读研', -10], [-1, '换行业', 60], [1, '自己干', 160]],
      [[-1, '重新开始', 0], [1, '一个人走走', 90]],
      [[1, '回家乡', -10], [-1, '去远方', 50]],
    ];
    const branches = [];
    alts.forEach((list, i) => list.forEach(([d, s, up], j) => {
      const len = 190 + 40 * j;
      branches.push({ i, d, s, p: br(X, ys[i], d * len, -90 - up * .6, -d * .22), t0: tBr + i * .28 + j * .14 });
    }));
    const FUT = [540, 470];
    const futPath = new Path([[X, ys[0]], [X, FUT[1] + 30]], false);
    const infl = [[80, 820, '后来的选择'], [1000, 760, '遇见的人'], [100, 1190, '时代'], [985, 1140, '运气'], [150, 1580, '新的能力'], [930, 1520, '偶然']]
      .map(([x, y, s], i) => ({ x, y, s, t0: tMany + .15 + i * .2, p: new Path([[x, y], [lerp(x, FUT[0], .55) + (x < 540 ? -70 : 70), lerp(y, FUT[1], .55)], [FUT[0], FUT[1] + 6]]) }));

    scene(...span(0), (t) => {
      const s = kf(t, [[0, 1.75], [1.2, 1.75], [4.3, 1.0], [6.4, .9], [S(2), .9], [EN(2), .82]]);
      const cy = kf(t, [[0, 1470], [1.2, 1460], [4.3, 1090], [6.4, 1010], [S(2), 1010], [EN(2), 990]]);
      cam(X, cy, s);
      const g = k(t, .6, 3.6, 'inout');                 // 主干生长
      const tipY = lerp(1600, 600, g);
      const dim = 1 - .72 * k(t, S(1) - .2, .6);         // 第二句起整体变暗
      const dim2 = 1 - .5 * k(t, tMany, .6);
      // 起点光
      flare(X, 1600, 160, (1 - k(t, 1.2, 1.5)) * 1.2);
      line(trunk, 0, g, { w: 3, a: dim * dim2 });
      if (g > 0 && g < 1) dot(X, tipY, 5, { a: 1, halo: 8 });
      // 节点
      const redP = k(t, tStamp + .05, .2) * (1 - k(t, tDec, .5));
      ys.forEach((y, i) => {
        const a = clamp((1600 - tipY - (1600 - y)) / 40 + .001);
        if (a <= 0) return;
        const hi = i === 0 ? Math.max(dim, k(t, tDec, .4) * (1 - .3 * k(t, tMany, .6))) : dim * dim2;
        const col = i === 0 ? mixc(GOLD, RED, redP) : GOLD;
        const pop = 1 + .6 * (1 - k(t, (y === ys[0] ? 1.1 : 0) + .6 + (1600 - y) / 1000 * 3.6, .5));
        dot(X, y, 7 * pop, { a: a * hi, col: i === 0 && redP > 0 ? col : undefined });
        small(ages[i], X - 30, y, { al: 'right', a: a * hi * .9, dx: -(1 - a) * 12 });
        label(evs[i], X + 30, y, { al: 'left', a: a * hi, dx: (1 - a) * 12, c: i === 0 && redP > .01 ? mixc([240, 236, 228], [255, 120, 110], redP) : undefined });
      });
      // 红章：选错了
      stamp('选错了', X + 190, ys[0] - 120, t, tStamp, { s: 92, t1: tBr + .9, rot: -.08 });
      // 分叉
      for (const b of branches) {
        const p = k(t, b.t0, 1.1, 'inout'), a = dim * dim2 * .85;
        line(b.p, 0, p, { w: 2, a });
        const e = b.p.at(1);
        if (p > .9) {
          const q = k(t, b.t0 + .9, .4);
          dot(e.x, e.y, 4, { a: a * q });
          small(b.s, e.x + b.d * 16, e.y, { al: b.d > 0 ? 'left' : 'right', a: a * q, c: [205, 194, 176] });
        }
      }
      // 一个决定 → 未来
      const fp = k(t, tDec + .1, 1.4, 'inout');
      line(futPath, 0, fp, { w: 4, a: 1 - .45 * k(t, tMany, .6), col: GOLDH });
      if (fp > 0 && fp < 1) { const e = futPath.at(fp); dot(e.x, e.y, 6, { halo: 9 }); }
      if (t > tDec) label('一个决定', X - 30, ys[0] + 44, { al: 'right', s: 30, c: [255, 214, 160], a: k(t, tDec, .4) * (1 - .4 * k(t, tMany, .6)) });
      const fa = k(t, tFut - .2, .5);
      const pulse = 1 + .25 * k(t, C(2, '决定未来'), .3) * (1 - k(t, C(2, '决定未来') + .3, .8));
      ring(FUT[0], FUT[1], 30 * pulse, { a: fa, w: 2.5 });
      dot(FUT[0], FUT[1], 6, { a: fa });
      flare(FUT[0], FUT[1], 220 * pulse, fa * (.5 + .5 * k(t, tMany + 1, 1.2)));
      label('未来', FUT[0], FUT[1] - 70, { s: 46, a: fa, glow: .3 });
      // 众多力量汇入未来
      for (const f of infl) {
        const p = k(t, f.t0, 1.0, 'inout');
        line(f.p, 0, p, { w: 2.2, a: .9 });
        if (p > 0 && p < 1) { const e = f.p.at(p); dot(e.x, e.y, 4, { halo: 7 }); }
        const la = k(t, f.t0, .5);
        dot(f.x, f.y, 5, { a: la });
        label(f.s, f.x, f.y + (f.y > 1400 ? 44 : -40), { s: 30, a: la, al: 'center' });
      }
    });
  }

  // ===== B 恐惧的推演：一次选择 → 一生结局；三条“必然”链 =====
  {
    const X = 540, Y0 = 1320, Y1 = 560;
    const ticks = [[1110, '一年后'], [900, '五年后'], [700, '十年后']];
    const rows = [['选错专业', '没有前途', 5], ['错过机会', '永远落后', 6], ['关系失败', '不会幸福', 7]];
    const tShoot = C(4, '推演'), tEnd = C(4, '结局'), tRows = S(5) - .35;
    const vline = new Path([[X, Y0], [X, Y1]], false);
    scene(...span(1), (t) => {
      cam(540, 980, 1);
      const va = 1 - k(t, tRows, .5, 'inout');
      const ig = k(t, S(3) - .1, .6);
      flare(X, Y0, 200, ig * va * (.6 + .4 * Math.sin(t * 3) ** 2));
      dot(X, Y0, 8, { a: ig * va });
      label('一次选择', X, Y0 + 56, { s: 34, a: ig * va });
      const p = k(t, tShoot, .8, 'inout');
      const red = k(t, tEnd, .4);
      line(vline, 0, p, { w: 3, a: va, col: mixc(GOLD, RED, red * .8) });
      if (p > 0 && p < 1) { const e = vline.at(p); dot(e.x, e.y, 6, { halo: 8 }); }
      ticks.forEach(([y, s]) => {
        const a = clamp((Y0 - lerp(Y0, Y1, p) - (Y0 - y)) / 40) * va;
        seg(X - 14, y, X + 14, y, { w: 2, a: a * .8 });
        small(s, X + 32, y, { al: 'left', a });
      });
      const ea = k(t, tEnd - .1, .3) * va;
      seg(X - 130 * ea, Y1, X + 130 * ea, Y1, { w: 5, a: ea, col: RED });
      flare(X, Y1, 180, ea * .7, [255, 70, 50]);
      text('一生的结局', X, Y1 - 52, { s: 44, w: 900, a: ea, c: [255, 120, 108], glow: .5, glowc: [255, 40, 30] });
      // 三条链
      rows.forEach(([a0, b0, li], r) => {
        const y = 760 + r * 300;
        const t0 = S(li) - .05, ta = C(li, '就'), ts = C(li, b0);
        const dimr = 1 - .5 * k(t, S(li + 1) - .2, .5) * (r < 2 ? 1 : 0);
        const la = k(t, Math.max(t0, tRows), .45);
        label(a0, 250, y, { s: 46, w: 900, a: la * dimr, dx: -(1 - la) * 20 });
        const ap = k(t, ta, .35, 'inout');
        seg(400, y, 400 + 230 * ap, y, { w: 3, a: dimr });
        if (ap > .95) arrowHead(630, y, 0, 16, { a: dimr });
        if (t > ts) {
          stamp(b0, 820, y - 4, t, ts, { s: 76, rot: -.05, rest: 1.6, shake: 5 });
        }
      });
    });
  }

  // ===== C 你会继续行动：一条弯曲的路，经验、能力、下一次选择；假设的“此后不再改变” =====
  {
    const pts = [[540, 1580], [470, 1460], [560, 1340], [640, 1220], [560, 1100], [470, 1000], [540, 890], [630, 790], [570, 690], [520, 600], [560, 520]];
    const P = new Path(pts);
    const tCrack = C(8, '忽略'), tYou = S(9) - .2;
    const forks = [{ u: .42, d: 1, t: C(10, '选择') }, { u: .62, d: -1, t: C(10, '下一次') }];
    const tMis = C(11, '失误'), tLife = C(11, '一生失败'), tAss = C(12, '假设'), tNo = C(12, '没有改变');
    const chain = new Path([[340, 960], [740, 960]], false);
    const uOf = t => kf(t, [[tYou + .3, 0], [EN(9), .34], [forks[0].t + .25, .42], [forks[1].t + .2, .62], [EN(10) + .3, .7], [tAss + .5, .7], [EN(12), .86]], 'inout');
    const forkP = forks.map(f => { const a = P.at(f.u); return br(a.x, a.y, f.d * 230, -120, -f.d * .2); });
    const sparks = (() => { const r = rng(5); return Array.from({ length: 14 }, (_, i) => ({ a: r() * 6.28, d: 260 + r() * 200, w: i < 7 ? 0 : 1 })); })();
    scene(...span(2), (t) => {
      cam(540, 1040, 1);
      // 推理链（开头）
      const ca = k(t, S(8) - .1, .5) * (1 - k(t, tCrack + .25, .6));
      label('一次选择', 200, 960, { s: 40, w: 900, a: ca });
      text('一生的结局', 890, 960, { s: 40, w: 900, a: ca, c: [255, 120, 108] });
      const crack = k(t, tCrack, .3);
      line(chain, 0, .5 - .06 * crack, { w: 3, a: ca });
      line(chain, .5 + .06 * crack, 1, { w: 3, a: ca });
      arrowHead(740, 960, 0, 16, { a: ca });
      // 裂缝中出现的“你”，落到起点
      const fall = k(t, tCrack + .3, .9, 'inout');
      const dy = lerp(960, 1580, fall);
      const u = uOf(t);
      const youA = k(t, tCrack + .15, .3);
      const red = k(t, tLife, .5) * (1 - k(t, tAss, .6));
      const col = mixc(GOLD, RED, red * .85);
      line(P, 0, u, { w: 3.2, col });
      // 分叉
      forks.forEach((f, i) => {
        if (u < f.u - .005) return;
        const fp = k(t, f.t, .9, 'inout');
        line(forkP[i], 0, fp, { w: 2, a: .45, col });
        const n = P.at(f.u), e = forkP[i].at(1);
        const isMis = i === 0;
        const mr = isMis ? k(t, tMis, .3) : 0;
        dot(n.x, n.y, 7 + 3 * mr, { col: mr > 0 ? mixc(GOLD, RED, mr) : undefined });
        if (fp > .9) dot(e.x, e.y, 4, { a: .5 });
        small('选择', n.x - f.d * 26, n.y + 4, { al: f.d > 0 ? 'right' : 'left', a: k(t, f.t, .4) * (1 - mr) });
        if (isMis) text('失误', n.x - 28, n.y + 4, { s: 34, w: 900, al: 'right', a: mr, c: [255, 110, 98], glow: .5, glowc: [255, 40, 30] });
      });
      // 你
      const me = u > 0 ? P.at(u) : { x: 540, y: dy };
      const grow = 1 + .25 * k(t, C(9, '经验'), .4) + .25 * k(t, C(9, '能力'), .4);
      const frozen = k(t, tAss, .5) * (1 - k(t, tNo + .6, .5));
      dot(me.x, me.y, 9 * grow, { a: youA });
      flare(me.x, me.y, 170 * grow, youA * .8);
      label('你', me.x + 34, me.y - 2, { al: 'left', s: 36, a: youA * k(t, S(9), .4) });
      // 经验、能力：光粒飞入
      [['经验', C(9, '经验')], ['能力', C(9, '能力')]].forEach(([s, t0], w) => {
        for (const sp of sparks.filter(q => q.w === w)) {
          const p = k(t, t0 - .5, .7, 'in');
          if (p <= 0 || p >= 1) continue;
          const d = sp.d * (1 - p);
          dot(me.x + Math.cos(sp.a) * d, me.y + Math.sin(sp.a) * d, 3, { a: 1, halo: 6 });
        }
        const la = k(t, t0, .4) * (1 - k(t, t0 + 1.4, .6));
        text('+ ' + s, me.x - 40, me.y + 10 - k(t, t0, 2) * 60, { s: 34, w: 900, al: 'right', a: la, c: [255, 214, 160] });
      });
      // 一生失败
      stamp('一生失败', 820, 1180, t, tLife, { s: 80, t1: tAss + .2, rot: -.06 });
      // 假设的此后：灰色直线
      const n0 = P.at(forks[0].u);
      const ap = k(t, tAss, .8, 'inout');
      const ghost = new Path([[n0.x, n0.y], [n0.x, 430]], false);
      line(ghost, 0, ap, { w: 3, col: GREY, a: .9, dash: [10, 12] });
      if (ap > 0) {
        const e = ghost.at(ap);
        dot(e.x, e.y, 7, { col: GREY, a: .9, halo: 2 });
        small('此后的自己', e.x - 24, e.y, { al: 'right', a: k(t, tAss + .4, .4) * (1 - k(t, tNo + .1, .3)) });
      }
      const na = k(t, tNo, .4);
      text('假设：再也不会改变', n0.x, 385, { s: 30, w: 700, al: 'center', a: na, c: [168, 160, 150] });
      text('实际：一直在变', 330, 800, { s: 30, w: 700, al: 'center', a: k(t, tNo + .7, .5), c: [255, 214, 160] });
    });
  }

  // ===== D 没有提前的答案：黑暗中的关系网，认知像一圈光，越走越大 =====
  {
    // 在网上走一段路：先往左上，再调整方向往右上
    const start = net.pts.reduce((b, p, i) => Math.hypot(p[0] - 540, p[1] - 1450) < Math.hypot(net.pts[b][0] - 540, net.pts[b][1] - 1450) ? i : b, 0);
    const dirs = [-112, -118, -105, -55, -50, -70, -80];
    const walk = [start];
    for (const dgr of dirs) {
      const cur = net.pts[walk[walk.length - 1]], a = dgr * Math.PI / 180;
      let best = -1, bv = -9;
      for (const j of net.nb[walk[walk.length - 1]]) {
        if (walk.includes(j)) continue;
        const q = net.pts[j], ang = Math.atan2(q[1] - cur[1], q[0] - cur[0]);
        const v = Math.cos(ang - a); if (v > bv) { bv = v; best = j; }
      }
      if (best < 0) break; walk.push(best);
    }
    const WP = new Path(walk.map(i => net.pts[i]));
    const tAns = C(13, '所有答案'), tDo = C(14, '做决定'), tAdj = C(15, '调整方向'), tNew = C(16, '新认识');
    const n = walk.length - 1;
    const uOf = t => kf(t, [[tDo, 0], [tDo + 1.0, 1.4 / n], [tAdj - .2, 1.4 / n], [tAdj + 1.2, 3.2 / n], [S(16), 3.4 / n], [EN(16) + .6, 4.6 / n]], 'inout');
    const qs = (() => { const r = rng(9); return Array.from({ length: 14 }, () => [r() * 1000 + 40, r() * 1500 + 300, 40 + r() * 50]); })();
    scene(...span(3), (t) => {
      const u = uOf(t), me = WP.at(u), m0 = WP.at(0);
      const cx = lerp(540, me.x, .35), cy = lerp(m0.y - 120, me.y - 160, 1);
      const s = kf(t, [[S(13), 1.08], [S(15), 1.0], [EN(16), .9]]);
      cam(cx, cy, s);
      const R = kf(t, [[S(13) - .2, 0], [S(13) + .9, 150], [S(15), 160], [tAdj + .4, 290], [S(16), 300], [EN(16) + .5, 520]]);
      // 光照下才看得见的网
      TMP.setTransform(1, 0, 0, 1, 0, 0); TMP.clearRect(0, 0, W, H); applyCam(TMP);
      drawNet(TMP, .75);
      TMP.globalCompositeOperation = 'destination-in';
      const g = TMP.createRadialGradient(me.x, me.y, 0, me.x, me.y, Math.max(R, 1));
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.6, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      TMP.fillStyle = g; TMP.fillRect(-2000, -2000, 6000, 8000);
      TMP.globalCompositeOperation = 'source-over';
      L.save(); L.setTransform(1, 0, 0, 1, 0, 0); L.globalAlpha = SA; L.drawImage(tmpC, 0, 0); L.restore();
      flare(me.x, me.y, R * 1.15, .35);
      ring(me.x, me.y, R * .98, { a: .12, w: 1.5 });
      // 走过的路
      line(WP, 0, u, { w: 3.4, col: GOLDH });
      dot(me.x, me.y, 9, { a: k(t, S(13) - .3, .5) });
      // 黑暗里的问号
      for (const [x, y, sz] of qs) {
        const wy = y + m0.y - 1450 - 700;
        const d = Math.hypot(x - me.x, wy - me.y);
        const sy = H / 2 + (wy - cy) * s;
        const a = k(t, tAns + (x % 7) * .05, .6) * clamp((d - R) / 200) * .22 * clamp((sy - 420) / 120);
        text('?', x, wy + Math.sin(t + x) * 8, { s: sz, w: 500, a, c: [200, 190, 175], blur: 1.5 });
      }
      // 年龄
      const age = t < S(15) ? 20 : Math.round(kf(t, [[S(15), 20], [tAdj, 25]], 'lin'));
      const aa = k(t, S(14) - .1, .5);
      text(String(age), me.x - 70, me.y - 6, { s: 110, w: 900, al: 'right', a: aa, c: [245, 232, 205], glow: .25, glowc: [255, 190, 110] });
      text('岁', me.x - 32, me.y + 26, { s: 34, w: 700, al: 'center', a: aa });
      // 方向调整的箭头
      if (t > tAdj - .3) {
        const p = k(t, tAdj - .3, .6);
        const a1 = WP.at(Math.min(1, u + .04));
        arrowHead(a1.x, a1.y, a1.ang, 18, { a: p * (1 - k(t, S(16), .4)), col: GOLDH });
      }
      const nw = k(t, tNew, .5);
      label('新的认识', me.x + 160, me.y - 170, { s: 36, a: nw, c: [255, 214, 160] });
      for (let i = 0; i < 3; i++) { const p = k(t, tNew + i * .15, .6); dot(me.x + 160 + (i - 1) * 40, me.y - 130, 3, { a: p * nw }); }
    });
  }

  // ===== E 沉没成本：过去的投入挽回不了；看前方还有什么 =====
  {
    const X = 540, NOW = 1000;
    const past = new Path([[X, 1760], [515, 1590], [565, 1420], [520, 1240], [X, NOW]]);
    const costs = [[1640, '时间'], [1500, '精力'], [1360, '金钱'], [1220, '感情']];
    const tMore = C(17, '继续付出'), tBack = C(17, '挽回'), tAhead = C(18, '前方'), tPast = C(19, '过去');
    const fan = [[210, 560, '新的机会', 1], [360, 470, '成长', 1], [540, 440, '出路', 1], [720, 470, '风险', 0], [870, 560, '消耗', 0]];
    const NOW2 = 870;
    const fanP = fan.map(([x, y]) => new Path([[X, NOW2], [lerp(X, x, .35), lerp(NOW2, y, .55)], [x, y]]));
    scene(...span(4), (t) => {
      const s = kf(t, [[S(17), 1], [S(19), 1], [EN(19) + .5, 1.06]]);
      cam(540, kf(t, [[S(17), 1080], [S(18), 1060], [EN(19) + .5, 960]]), s);
      const pd = 1 - .82 * k(t, tPast, .7);               // 过去变暗
      const pb = 3 * k(t, tPast, .7);
      const gp = k(t, S(17) - .3, 1.2, 'inout');
      line(past, 0, gp, { w: 5, a: pd, col: GOLDH });
      costs.forEach(([y, s], i) => {
        const a = k(t, S(17) + .2 + i * .32, .4) * pd;
        seg(X - 40, y, X - 18, y, { w: 2, a });
        text(s, X - 56, y, { s: 34, w: 700, al: 'right', a, blur: pb });
      });
      text('已经付出的代价', X + 50, 1500, { s: 28, w: 500, al: 'left', a: k(t, C(17, '代价'), .5) * pd, c: [176, 166, 150], blur: pb });
      // 继续付出：往前硬推，代价叠加，但挽回不了
      const mp = k(t, tMore, 1.0, 'inout');
      const red = k(t, tMore, 1) * (1 - k(t, S(18), .6));
      seg(X, NOW, X, lerp(NOW, NOW2, mp), { w: 5, col: mixc(GOLDH, RED, red * .7), a: pd });
      [[960, '再投入'], [900, '再投入']].forEach(([y, s], i) => {
        const a = k(t, tMore + .2 + i * .35, .3) * (1 - k(t, S(18), .5));
        small('+ ' + s, X + 26, y, { al: 'left', a, c: [230, 140, 120] });
      });
      const me = lerp(NOW, NOW2, mp);
      dot(X, me, 9);
      flare(X, me, 160, .8);
      label('现在', X - 30, me, { al: 'right', s: 30, a: k(t, S(17), .5) * (1 - k(t, tAhead, .4)) });
      stamp('无法挽回', 540, 700, t, tBack, { s: 88, t1: S(18) - .1, rot: -.05 });
      // 前方
      fan.forEach(([x, y, s, good], i) => {
        const t0 = tAhead + i * .12;
        const p = k(t, t0, .9, 'inout');
        line(fanP[i], 0, p, { w: 2.4, col: good ? GOLD : GREY, a: good ? 1 : .7 });
        const la = k(t, t0 + .6, .4);
        dot(x, y, good ? 6 : 5, { a: la, col: good ? undefined : GREY, halo: good ? 5 : 2 });
        text(s, x, y - 40, { s: 32, w: 700, a: la, c: good ? [255, 228, 186] : [150, 142, 132] });
      });
      text('前方还有什么', X, 330, { s: 30, w: 500, a: 0 });
    });
  }

  // ===== F 错误有代价：一棵树，有的枝断了，但还会长出更多 =====
  {
    const r = rng(21), bs = [];
    const t0 = S(20) - .4;
    (function grow(x, y, ang, len, d, parent, tb) {
      const dx = Math.cos(ang) * len, dy = Math.sin(ang) * len;
      const b = { p: br(x, y, dx, dy, (r() - .5) * .3), d, parent, t0: tb, dur: d < 5 ? .55 : .5, kids: [] };
      bs.push(b); if (parent) parent.kids.push(b);
      if (d >= 6) return;
      const n = d < 1 ? 2 : (r() < .3 ? 3 : 2);
      for (let i = 0; i < n; i++) {
        const sp = (n === 2 ? (i ? 1 : -1) : (i - 1)) * (.36 + r() * .2);
        const nt = (d >= 4 || tb == null) ? null : tb + b.dur * .85;
        grow(x + dx, y + dy, ang + sp + (r() - .5) * .1, len * (.72 + r() * .08), d + 1, b, nt);
      }
    })(540, 1760, -Math.PI / 2, 290, 0, null, t0);
    // 第 5、6 层在“不等于失去全部可能”时才长出来
    const tMore = C(22, '不等于');
    for (const b of bs) if (b.t0 == null) b.t0 = tMore + (b.d - 5) * .5 + r() * .5;
    const d2 = bs.filter(b => b.d === 2);
    const lostA = d2[0], lostB = d2[d2.length - 1];
    const mark = (b, tag) => { b.lost = tag; b.kids.forEach(c => mark(c, tag)); };
    mark(lostA, 'A'); mark(lostB, 'B');
    const tErr = C(20, '错误'), tCost = C(20, '代价'), tA = C(21, '不会重来'), tB = C(21, '无法追回');
    scene(...span(5), (t) => {
      cam(540, kf(t, [[S(20), 1180], [tMore, 1150], [EN(22) + .5, 1080]]), kf(t, [[S(20), 1.0], [tMore, 1.0], [EN(22) + .5, .86]]));
      for (const b of bs) {
        let a = 1 - b.d * .07, col = GOLD;
        if (b.lost) {
          const tl = b.lost === 'A' ? tA : tB;
          const rr = b.lost === 'A' ? k(t, tErr, .3) : k(t, tB - .3, .3);
          col = mixc(GOLD, RED, rr * .9);
          a *= 1 - .85 * k(t, tl, .9);
        }
        const p = k(t, b.t0, b.dur, 'inout');
        line(b.p, 0, p, { w: Math.max(1.2, 4.2 - b.d * .55), a, col });
        if (!b.kids.length && p > .95 && b.d >= 4) {
          const e = b.p.at(1), tw = .6 + .4 * Math.sin(t * 2.3 + e.x);
          dot(e.x, e.y, b.d >= 5 ? 3 : 4, { a: a * k(t, b.t0 + b.dur, .3) * tw, col: b.lost ? col : undefined });
        }
      }
      const ea = lostA.p.at(1), eb = lostB.p.at(1);
      const ca = k(t, tErr, .25) * (1 - k(t, tErr + .4, .8));
      flare(ea.x, ea.y, 200, ca, [255, 70, 50]);
      stamp('代价', ea.x - 60, ea.y - 120, t, tCost, { s: 80, t1: tA - .2, rot: -.07 });
      text('不会重来', ea.x - 30, ea.y + 46, { s: 30, w: 900, al: 'center', a: k(t, tA, .4), c: [255, 110, 98] });
      text('无法追回', eb.x + 30, eb.y + 46, { s: 30, w: 900, al: 'center', a: k(t, tB, .4), c: [255, 110, 98] });
    });
  }

  // ===== G 失败不是证明：关系断了，“不值得被爱”消散；尝试跌落，“没有能力”消散 =====
  {
    const A = [320, 820], Bp = [760, 820], M = [540, 820];
    const tEnd = C(23, '结束'), tN = C(23, '不值得'), tF = C(24, '失败'), tN2 = C(24, '没有能力');
    const curve = new Path([[220, 1520], [360, 1420], [500, 1290], [590, 1255], [650, 1320], [700, 1470]]);
    const again = new Path([[700, 1470], [760, 1420], [820, 1330], [880, 1250]]);
    const L1 = new Path([A, M]), L2 = new Path([M, Bp]);
    scene(...span(6), (t) => {
      cam(540, 1080, 1);
      const a1 = k(t, S(23) - .2, .5);
      const snap = k(t, tEnd, .6);
      line(L1, 0, 1 - snap * .55, { w: 3, a: a1 });
      line(L2, snap * .55, 1, { w: 3, a: a1 * (1 - .5 * snap) });
      if (snap > 0 && snap < 1) for (let i = 0; i < 8; i++) {
        const an = i * .785 + .3, d = snap * 90;
        dot(M[0] + Math.cos(an) * d, M[1] + Math.sin(an) * d, 2.5, { a: 1 - snap, halo: 5 });
      }
      const youUp = k(t, EN(23), .6);
      dot(A[0], A[1], 9 * (1 + .3 * youUp), { a: a1 });
      flare(A[0], A[1], 160 + 120 * youUp, a1 * (.6 + .5 * youUp));
      label('你', A[0], A[1] + 50, { s: 34, a: a1 });
      dot(Bp[0] + snap * 30, Bp[1], 7, { a: a1 * (1 - .6 * snap) });
      stamp('不值得被爱', 540, 650, t, tN, { s: 84, t1: EN(23) + .05, d1: .9, rot: -.05 });
      // 下：一次尝试
      const gp = kf(t, [[S(24) - .2, 0], [tF - .1, .62], [tF + .5, 1]], 'inout');
      line(curve, 0, gp, { w: 3, a: k(t, S(24) - .3, .4) });
      const e = curve.at(gp);
      if (gp > 0) dot(e.x, e.y, 8, { col: gp > .9 ? mixc(GOLD, [230, 120, 100], k(t, tF, .4) * (1 - k(t, EN(24), .5))) : undefined });
      const ag = k(t, EN(24) + .1, 1.0, 'inout');
      line(again, 0, ag, { w: 3, col: GOLDH });
      if (ag > 0) { const q = again.at(ag); dot(q.x, q.y, 8, { halo: 7 }); flare(q.x, q.y, 160, .7); }
      if (gp > 0) small('一次尝试', 360, 1470, { a: k(t, S(24), .4) });
      stamp('没有能力', 540, 1130, t, tN2, { s: 84, t1: EN(24) + .05, d1: .9, rot: -.05 });
    });
  }

  // ===== H 处理具体的问题：红色的自我否定收缩成一个具体的点；承担、弥补、调整 =====
  {
    const r = rng(33);
    const words = ['我不行', '全完了', '都怪我', '一无是处', '没救了', '我就是失败者', '再也不会好'].map((s, i) => ({ s, x: 180 + r() * 720, y: 620 + r() * 760, sz: 44 + r() * 30, ph: r() * 6 }));
    const N = [540, 1300];
    const kids = [[290, 860, '承担', C(26, '承担')], [540, 760, '弥补', C(26, '弥补')], [790, 860, '调整', C(26, '调整')]];
    const kp = kids.map(([x, y]) => new Path([N, [lerp(N[0], x, .3), lerp(N[1], y, .55)], [x, y]]));
    const tC = C(25, '具体的问题'), tNeg = C(27, '全面否定');
    scene(...span(7), (t) => {
      cam(540, 1060, 1);
      const conv = k(t, tC - .3, 1.0, 'inout');
      for (const w of words) {
        const a = k(t, S(25) - .3 + w.ph * .08, .6) * (1 - conv);
        const x = lerp(w.x + Math.sin(t * .7 + w.ph) * 20, N[0], conv), y = lerp(w.y + Math.cos(t * .6 + w.ph) * 14, N[1], conv);
        text(w.s, x, y, { s: w.sz * (1 - .8 * conv), w: 900, a: a * .8, c: [214, 48, 40], blur: 3 + 3 * Math.sin(t + w.ph) ** 2, glow: .6, glowc: [255, 40, 30], gb: 30 });
      }
      const na = k(t, tC + .5, .4);
      const neg = k(t, tNeg - .1, .3) * (1 - k(t, tNeg + 1.2, .8));
      const nd = 1 - .55 * neg;
      dot(N[0], N[1], 10, { a: na * nd });
      flare(N[0], N[1], 200, na * .8 * nd);
      label('具体的问题', N[0], N[1] + 60, { s: 40, w: 900, a: na * nd });
      kids.forEach(([x, y, s, t0], i) => {
        const p = k(t, t0 - .15, .6, 'inout');
        line(kp[i], 0, p, { w: 2.6, a: nd });
        const a = k(t, t0 + .3, .4) * nd;
        dot(x, y, 8, { a });
        ring(x, y, 30, { a: a * .8, p: k(t, t0 + .3, .6) });
        label(s, x, y - 66, { s: 46, w: 900, a, glow: .25 });
        flare(x, y, 150, a * (.4 + .4 * k(t, tNeg + 1.4, .6)));
      });
      stamp('全面否定', 540, 1060, t, tNeg, { s: 150, t1: tNeg + 1.1, d1: 1.0, rot: -.06, shake: 10 });
    });
  }

  // ===== I 可修正的允许尝试；不可逆的保持慎重 =====
  {
    const up = new Path([[100, 820], [260, 790], [420, 850], [580, 800], [740, 840], [960, 800]]);
    const trials = [.22, .48, .72].map((u, i) => {
      const a = up.at(u), b = up.at(u + .1);
      return { u, p: new Path([[a.x, a.y], [a.x + 30, a.y - 50 - i * 8], [b.x - 30, b.y - 55 - i * 8], [b.x, b.y]]) };
    });
    const low = new Path([[100, 1440], [300, 1420], [500, 1450], [690, 1435]]);
    const BX = 790;
    const tTry = C(28, '允许尝试'), tRisk = C(29, '不可逆'), tCare = C(29, '保持慎重');
    scene(...span(8), (t) => {
      cam(540, 1100, 1);
      const uu = kf(t, [[S(28) - .2, 0], [EN(28) + .4, 1]], 'inout');
      line(up, 0, uu, { w: 3 });
      for (const tr of trials) if (uu > tr.u) {
        const p = clamp((uu - tr.u) / .1);
        line(tr.p, 0, p, { w: 2, a: .8, col: GOLDH });
      }
      const me = up.at(uu);
      if (uu > 0) { dot(me.x, me.y, 8); flare(me.x, me.y, 140, .7); }
      small('可修正的选择', 100, 700, { al: 'left', a: k(t, S(28), .5), c: [220, 205, 180], s: 30 });
      label('允许尝试', 540, 960, { s: 52, w: 900, a: k(t, tTry, .5), glow: .3, glowc: [255, 190, 110] });
      // 下半：不可逆的边界
      const ba = k(t, tRisk - .2, .5);
      L.fillStyle = rgba([120, 20, 16], .18 * ba * SA); L.fillRect(BX, 1150, 400, 560);
      seg(BX, 1170, BX, 1700, { w: 3, col: RED, a: ba, dash: [14, 10] });
      flare(BX, 1435, 260, ba * .5, [255, 60, 40]);
      text('不可逆', BX + 130, 1250, { s: 44, w: 900, a: ba, c: [255, 110, 98], glow: .6, glowc: [255, 40, 30] });
      small('重大的风险', 100, 1320, { al: 'left', a: k(t, S(29), .5), c: [220, 205, 180], s: 30 });
      const lu = kf(t, [[S(29) - .2, 0], [tCare, 1]], 'out');
      line(low, 0, lu, { w: 3 });
      const m2 = low.at(lu);
      if (lu > 0) dot(m2.x, m2.y, 8);
      const cp = k(t, tCare - .2, .5);
      for (let i = 0; i < 2; i++) { const ph = ((t - tCare) * .8 + i * .5) % 1; if (t > tCare) ring(m2.x, m2.y, 20 + ph * 70, { a: (1 - ph) * .6 * cp }); }
      label('保持慎重', 420, 1560, { s: 52, w: 900, a: cp, glow: .3, glowc: [255, 190, 110] });
    });
  }

  // ===== J 结尾：过去不必每步都对；继续向前；新的线从你身上长出来；回到片名 =====
  {
    const zz = [[540, 1880], [430, 1740], [640, 1600], [450, 1460], [630, 1320], [470, 1190], [540, 1060]];
    const past = new Path(zz, false);
    const reds = [2, 4];
    const fwd = new Path([[540, 1060], [575, 950], [520, 850], [540, 760]]);
    const ME = [540, 760];
    const tStep = C(30, '每一步'), tGo = C(31, '继续向前'), tRoom = S(32), tEnd = C(33, '不是最终结局');
    const rays = (() => { const r = rng(44); return Array.from({ length: 9 }, (_, i) => { const a = -Math.PI / 2 + (i - 4) * .36 + (r() - .5) * .15; const len = 190 + r() * 150; return br(ME[0], ME[1], Math.cos(a) * len, Math.sin(a) * len, (r() - .5) * .4); }); })();
    const rayLab = { 1: '重新开始', 3: '换个方向', 5: '再试一次', 7: '慢慢来' };
    const tCard = EN(33) + .6;
    const card = [['人生的', '容错率', '，'], ['大到超乎你的想象。']];
    scene(B[9], TM.duration, (t) => {
      const s = kf(t, [[S(30), 1], [tGo, 1], [S(33), .95], [tCard + 1, .72]]);
      const cy = kf(t, [[S(30), 1330], [tGo, 1330], [tGo + 1.4, 1060], [S(33), 1040], [tCard + 1, 1150]]);
      cam(540, cy, s);
      const cd = 1 - .7 * k(t, tCard, 1.0);             // 片尾压暗
      // 背景的网
      const na = k(t, S(33) - .2, 1.6) * .3 * cd;
      if (na > 0) { L.globalAlpha = SA; drawNet(L, na); L.globalAlpha = 1; }
      const pp = k(t, S(30) - .3, 1.4, 'inout');
      line(past, 0, pp, { w: 3, a: cd });
      zz.slice(1, -1).forEach(([x, y], i0) => {
        const i = i0 + 1;
        const a = clamp((pp * (zz.length - 1) - i) * 2 + .5) * cd;
        const isR = reds.includes(i);
        const hl = k(t, tStep + i0 * .18, .25) * (1 - k(t, tStep + i0 * .18 + .4, .5));
        const fadeR = k(t, tEnd, 1.0);
        dot(x, y, (isR ? 8 * (1 - .5 * fadeR) : 6) * (1 + .6 * hl), { a, col: isR ? mixc(RED, GOLD, fadeR * .6) : undefined, halo: isR ? 4 * (1 - .6 * fadeR) : 5 });
        if (isR) text('×', x + (x < 540 ? -34 : 34), y, { s: 34, w: 700, a: a * (1 - fadeR), c: [255, 110, 98] });
      });
      const gp = k(t, tGo - .1, 1.3, 'inout');
      line(fwd, 0, gp, { w: 3.6, col: GOLDH, a: cd });
      const me = gp > 0 ? fwd.at(gp) : { x: 540, y: 1060 };
      dot(me.x, me.y, 10, { a: k(t, S(30) - .3, .5) * cd });
      flare(me.x, me.y, 200 + 80 * k(t, tRoom, 1), .9 * cd);
      label('你', me.x + 36, me.y, { al: 'left', s: 34, a: k(t, S(30), .5) * (1 - k(t, tRoom, .4)) * cd });
      rays.forEach((ry, i) => {
        const t0 = tRoom + .15 + i * .09;
        const p = k(t, t0, 1.0, 'inout');
        line(ry, 0, p, { w: 2.2, a: cd });
        if (p > .9) {
          const e = ry.at(1); dot(e.x, e.y, 4, { a: cd });
          if (rayLab[i]) small(rayLab[i], e.x, e.y - 30, { a: k(t, t0 + .8, .4) * cd, c: [225, 212, 190], s: 28 });
        }
      });
      // 片尾字
      if (t > tCard) {
        T.save(); T.setTransform(1, 0, 0, 1, 0, 0);
        const ct = tCard + .2;
        T.font = `900 76px ${FONT}`; T.textBaseline = 'middle';
        let ci = 0;
        card.forEach((parts, r) => {
          const chars = []; parts.forEach((p, pi) => [...p].forEach(ch => chars.push([ch, pi === 1 && r === 0])));
          const ws = chars.map(([ch]) => T.measureText(ch).width);
          const tot = ws.reduce((a, b) => a + b, 0) + 6 * (chars.length - 1);
          let x = W / 2 - tot / 2; const y = 900 + r * 116;
          chars.forEach(([ch, red], j) => {
            const p = k(t, ct + (ci + j) * .07 + r * .25, .5);
            T.globalAlpha = p * SA * (1 - k(t, TM.duration - 1.4, 1.2));
            T.filter = p < .98 ? `blur(${(1 - p) * 12}px)` : 'none';
            T.shadowColor = red ? 'rgba(255,40,30,.8)' : 'rgba(0,0,0,.7)'; T.shadowBlur = red ? 30 : 14;
            T.fillStyle = red ? '#e2342c' : '#f3efe8';
            T.textAlign = 'left'; T.fillText(ch, x, y);
            x += ws[j] + 6;
          });
          ci += chars.length;
        });
        T.restore();
      }
    }, { fo: .01 });
  }
};
