// Scene definitions. Times come from the narration (at / atEnd), so every
// visual beat lands on the word that triggers it.
(function () {
  const { scene, put, A, q, qa, at, atEnd, charTimes, ln, chapters, TM } = ENGINE;

  // ---------- tiny icon / widget helpers ----------
  const I = {
    check: (s = 26, c = 'currentColor') => `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    x: (s = 24, c = 'currentColor') => `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="${c}" stroke-width="2.8" stroke-linecap="round"/></svg>`,
    file: (s = 30) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><path d="M6 3h8l5 5v13H6z" fill="none" stroke="#7cf0ff" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v5h5M9 13h7M9 17h5" fill="none" stroke="#7cf0ff" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    spark: (s = 30) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}"><path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" fill="url(#gsp)"/><defs><linearGradient id="gsp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cf0ff"/><stop offset="1" stop-color="#9b8bff"/></linearGradient></defs></svg>`,
  };
  const chk = (k = 'ok', s = 44) => `<span class="chk ${k}" style="width:${s}px;height:${s}px;color:${k === 'bad' ? '#ff5f87' : k === 'c' ? '#46e0ff' : '#3ef2b0'}">${k === 'bad' ? I.x(s * .55) : I.check(s * .6)}</span>`;
  const arrowR = (w = 160, c = '#46e0ff') => `<svg width="${w}" height="28" viewBox="0 0 ${w} 28"><defs><linearGradient id="ga${w}" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".1"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><path d="M2 14H${w - 6}" stroke="url(#ga${w})" stroke-width="3" stroke-linecap="round"/><path d="M${w - 18} 5l12 9-12 9" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const arrowD = (h = 90, c = '#46e0ff') => `<svg width="28" height="${h}" viewBox="0 0 28 ${h}"><path d="M14 2V${h - 6}" stroke="${c}" stroke-opacity=".7" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 9"/><path d="M5 ${h - 18}l9 12 9-12" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const logo = (s = 64) => `<div style="width:${s}px;height:${s}px;border-radius:${s * .28}px;background:linear-gradient(135deg,#46e0ff,#8b7bff);display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px rgba(70,224,255,.5)"><div style="width:${s * .42}px;height:${s * .42}px;border:${s * .07}px solid #050812;border-radius:${s * .1}px;transform:rotate(45deg)"></div></div>`;
  const stag = (els, t, step = 0.12, type = 'up', dur = 0.55) => els.forEach((e, i) => A(e, t + i * step, type, dur));

  chapters.push({ t: 0, no: 'CH.01', name: '认知差距' });
  chapters.push({ t: ln(14).start - 0.3, no: 'CH.02', name: '上手方法' });
  chapters.push({ t: ln(23).start - 0.3, no: 'CH.03', name: '稳定落地' });

  // ===== 0 · 超过 99% 的人 =====
  scene(0, 0, sc => {
    const g = put(`<div class="dots" style="grid-template-columns:repeat(10,22px)">${'<i></i>'.repeat(100)}</div>`, 560, 490);
    const dots = qa(g, 'i');
    dots.forEach((d, i) => A(d, 0.05 + ((i % 10) + Math.floor(i / 10)) * 0.025, 'pop', 0.4));
    const lab = put(`<div class="label">100 个人里</div>`, 378, 280, { a: 'bl' });
    A(lab, 0.3, 'up', 0.5);
    const tC = at(0, 'Claude Code');
    const me = dots[9];
    A(me, tC, 'cls', 0, { c: 'me' });
    A(me, tC, 'scale', 0.4, { a: 1.6, b: 1, ease: 'back' });
    const pill = put(`<div class="tag solid en" style="font-size:24px">Claude Code</div>`, 731, 262, { a: 'b' });
    A(pill, tC + 0.05, 'pop', 0.5);
    const t1 = put(`<div class="h3 subt">你就已经超过了</div>`, 1040, 330, { a: 'l' });
    A(t1, at(0, '你就'), 'up', 0.5);
    const n = put(`<div class="big g num">0%</div>`, 1030, 500, { a: 'l' });
    A(n, at(0, '99') - 0.05, 'up', 0.5);
    A(n, at(0, '99') - 0.05, 'count', 0.75, { from: 0, to: 99, suf: '%', ease: 'out' });
    const t2 = put(`<div class="h2">的人</div>`, 1048, 680, { a: 'l' });
    A(t2, at(0, '的人'), 'up', 0.5);
    dots.forEach((d, i) => { if (i !== 9) A(d, at(0, '超过'), 'dim', 0.6, { v: 0.45 }); });
  });

  // ===== 1 · 夸张说法 / 真正的差距 =====
  scene(1, 1, sc => {
    const t0 = sc.t0, tBut = at(1, '但真正');
    const big = put(`<div class="big g num strike">99%<i class="sl"></i></div>`, 960, 470);
    A(big, t0 + 0.1, 'zoom', 0.6);
    A(big, at(1, '夸张说法'), 'strike', 0.45);
    const tg = put(`<div class="tag bad" style="font-size:32px;padding:12px 26px">夸张说法</div>`, 1330, 300);
    A(tg, at(1, '夸张说法') + 0.15, 'pop', 0.5);
    A(big, tBut - 0.1, 'out', 0.4, { d: 30 }); A(tg, tBut - 0.1, 'out', 0.4, { d: 30 });

    const h = put(`<div class="h2">真正值得关注的，是<span class="g">差距</span></div>`, 960, 200);
    A(h, tBut, 'up', 0.6);
    const L = put(`<div class="card" style="width:640px;height:400px"></div>`, 580, 560);
    A(L, at(1, '有人还在'), 'left', 0.6, { d: 60 });
    put(`<div class="label">TYPE A · 还在提问</div>`, 50, 50, { a: 'tl', parent: L });
    const b1 = put(`<div class="bub me" style="font-size:44px">AI 能干什么？</div>`, 320, 200, { parent: L });
    A(b1, at(1, '问 AI'), 'pop', 0.5);
    const f1 = put(`<div class="t dimt">停留在问答</div>`, 50, 330, { a: 'tl', parent: L });
    A(f1, at(1, '能干什么') + 0.3, 'fade', 0.5);

    const vs = put(`<div class="mono" style="font:700 30px var(--mono);color:var(--dim)">VS</div>`, 960, 560);
    A(vs, at(1, '有人已经'), 'pop', 0.4);
    const R = put(`<div class="card hot" style="width:640px;height:400px"></div>`, 1340, 560);
    A(R, at(1, '有人已经'), 'right', 0.6, { d: 60 });
    put(`<div class="label c">TYPE B · 已在交付</div>`, 50, 50, { a: 'tl', parent: R });
    const rh = put(`<div class="h3">让它<span class="g">交付结果</span></div>`, 50, 100, { a: 'tl', parent: R });
    A(rh, at(1, '让它'), 'up', 0.5);
    const items = ['分析报告', '可用的代码', '整理好的表格'].map((s, i) =>
      put(`<div class="row" style="gap:16px">${chk('ok', 40)}<span class="t" style="color:var(--ink)">${s}</span></div>`, 50, 190 + i * 62, { a: 'tl', parent: R }));
    stag(items, at(1, '交付结果'), 0.18, 'left');
  });

  // ===== 2 · 卡帕西：编程方式的变化 =====
  scene(2, 2, sc => {
    const t0 = sc.t0;
    const C = put(`<div class="card" style="width:600px;height:460px"></div>`, 500, 500);
    A(C, t0 + 0.1, 'up', 0.6);
    const av = put(`<div style="width:132px;height:132px;border-radius:50%;padding:4px;background:var(--grad)"><div style="width:100%;height:100%;border-radius:50%;background:#0a0f20;display:flex;align-items:center;justify-content:center;font:900 46px var(--en)"><span class="g">AK</span></div></div>`, 60, 60, { a: 'tl', parent: C });
    put(`<div class="en" style="font:800 46px var(--en);white-space:nowrap">Andrej Karpathy</div>`, 60, 230, { a: 'tl', parent: C });
    const zh = put(`<div class="t">卡帕西</div>`, 60, 292, { a: 'tl', parent: C });
    A(zh, at(2, '卡帕西'), 'fade', 0.4);
    const tg = put(`<div class="tag c">前特斯拉 AI 总监</div>`, 60, 362, { a: 'tl', parent: C });
    A(tg, at(2, '特斯拉'), 'pop', 0.5);
    const tg2 = put(`<div class="tag">一次公开分享</div>`, 330, 362, { a: 'tl', parent: C });
    A(tg2, at(2, '公开分享'), 'pop', 0.5);

    const tW = at(2, '他的编程方式');
    const lab = put(`<div class="label c">编程方式 · 正在改变</div>`, 1340, 200);
    A(lab, tW, 'up', 0.5);
    const old = put(`<div class="term" style="width:780px;height:230px"><div class="bar"><i></i><i></i><i></i><span>过去 · editor.ts</span></div><div class="body" style="font-size:24px;line-height:1.6;padding:18px 30px"><div class="ln c1"></div><div class="ln c2"></div><div class="ln c3"></div></div></div>`, 1340, 380);
    A(old, tW + 0.1, 'up', 0.6);
    const code = ['function login(user) {', '  const token = sign(user.id);', '  return token;  // 一行行敲'];
    const tLine = at(2, '一行行');
    ['.c1', '.c2', '.c3'].forEach((s, i) => { const e = q(old, s); e.textContent = code[i]; A(e, tLine - 0.3 + i * 0.55, 'type', 0.55, { ease: 'lin' }); });
    const pl = put(`<div class="tag">一行行写代码</div>`, 1640, 290, { a: 'c' });
    A(pl, tLine, 'pop', 0.5);
    A(old, at(2, '变成'), 'dim', 0.6, { v: 0.4 });
    const ad = put(arrowD(80), 1340, 545);
    A(ad, at(2, '变成') - 0.1, 'wipey', 0.5);
    const now = put(`<div class="card hot glow" style="width:780px;height:180px;border-radius:22px"></div>`, 1340, 680);
    A(now, at(2, '变成'), 'up', 0.6);
    put(`<div class="row" style="gap:22px"><span class="tag solid mono" style="font-size:20px">TASK</span><span class="h3">把<span class="g">完整任务</span>交给 AI</span></div>`, 44, 90, { a: 'l', parent: now });
    A(now, at(2, '交给 AI'), 'glow', 0.5);
  });

  // ===== 3 · 完整任务流程 / 人与 AI 的分工 =====
  scene(3, 3, sc => {
    const t0 = sc.t0;
    const h = put(`<div class="h2">交给 AI 的，是一整套<span class="g">流程</span></div>`, 960, 190);
    A(h, t0 + 0.1, 'up', 0.6);
    const names = ['实现功能', '修改模块', '运行测试', '修复错误'];
    const keys = ['实现一个功能', '修改一个模块', '运行测试', '再把错误'];
    const xs = [450, 790, 1130, 1470];
    const line = put(`<div style="height:3px;width:1020px;background:linear-gradient(90deg,#46e0ff,#8b7bff);transform-origin:left center;box-shadow:0 0 12px rgba(70,224,255,.6)"></div>`, 450, 359, { a: 'l' });
    const tA = at(3, keys[0]), tD = at(3, keys[3]);
    A(line, tA, 'grow', tD - tA, { ease: 'inout' });
    names.forEach((n, i) => {
      const nd = put(`<div class="node"><div class="disc">0${i + 1}</div><div class="nm">${n}</div></div>`, xs[i], 300, { a: 't' });
      const t = at(3, keys[i]);
      A(nd, t - 0.15, 'up', 0.5); A(nd, t, 'cls', 0, { c: 'on' });
    });
    const tP = at(3, '人越来越');
    const P = put(`<div class="card" style="width:700px;height:200px"></div>`, 620, 720);
    A(P, tP, 'up', 0.6);
    put(`<div style="width:96px;height:96px;border-radius:50%;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;font:900 40px var(--zh);color:var(--sub)">人</div>`, 50, 100, { a: 'l', parent: P });
    put(`<div class="label">YOU</div>`, 175, 62, { a: 'l', parent: P });
    const p1 = put(`<div class="h3">交代任务</div>`, 175, 122, { a: 'l', parent: P });
    const p2 = put(`<div class="h3">· 检查结果</div>`, 345, 122, { a: 'l', parent: P });
    A(p1, at(3, '交代任务'), 'up', 0.45); A(p2, at(3, '检查结果'), 'up', 0.45);
    const tAI = at(3, 'AI 则');
    const R = put(`<div class="card hot" style="width:560px;height:200px"></div>`, 1300, 720);
    A(R, tAI - 0.1, 'up', 0.6);
    put(logo(90), 50, 100, { a: 'l', parent: R });
    put(`<div class="label c">AI</div>`, 175, 62, { a: 'l', parent: R });
    put(`<div class="h3">承担<span class="g">具体执行</span></div>`, 175, 122, { a: 'l', parent: R });
  });

  // ===== 4 · 评价两极 =====
  scene(4, 4, sc => {
    const t0 = sc.t0;
    const qm = put(`<div class="g num" style="font:900 300px/1 var(--en)">?</div>`, 960, 480);
    A(qm, t0 + 0.1, 'pop', 0.6);
    const l1 = put(`<div class="label">有人觉得</div>`, 330, 270, { a: 'l' });
    const b1 = put(`<div class="bub me" style="border-color:rgba(62,242,176,.55);font-size:46px">AI <span class="okt">改变了工作</span></div>`, 330, 350, { a: 'l' });
    A(l1, at(4, '有人觉得'), 'up', 0.4); A(b1, at(4, '有人觉得'), 'left', 0.55, { d: 60 });
    const l2 = put(`<div class="label">有人却觉得</div>`, 1590, 560, { a: 'r' });
    const b2 = put(`<div class="bub ai" style="border-color:rgba(255,95,135,.55);font-size:46px">一本正经地<span class="badt">胡说八道</span></div>`, 1590, 640, { a: 'r' });
    A(l2, at(4, '有人却'), 'up', 0.4); A(b2, at(4, '有人却'), 'right', 0.55, { d: 60 });
  });

  // ===== 5 · 用 AI ≠ 用 AI =====
  scene(5, 5, sc => {
    const t0 = sc.t0;
    const h = put(`<div class="h3 subt">大家嘴里的「用 AI」</div>`, 960, 250);
    A(h, t0 + 0.05, 'up', 0.5);
    const big = 'font:900 70px var(--zh);padding:28px 56px;border-radius:28px';
    const a = put(`<div class="tag" style="${big}">用 AI</div>`, 600, 480);
    const b = put(`<div class="tag c" style="${big}">用 AI</div>`, 1320, 480);
    A(a, at(5, '用 AI'), 'left', 0.5, { d: 50 }); A(b, at(5, '用 AI') + 0.12, 'right', 0.5, { d: 50 });
    const ne = put(`<div class="g num" style="font:900 150px/1 var(--en)">≠</div>`, 960, 470);
    A(ne, at(5, '根本不是'), 'pop', 0.5);
    const s1 = put(`<div class="t">聊天 · 问答</div>`, 600, 620), s2 = put(`<div class="t cy">进入工作 · 交付</div>`, 1320, 620);
    A(s1, at(5, '同一种'), 'up', 0.5); A(s2, at(5, '同一种') + 0.15, 'up', 0.5);
  });

  // ===== 6 · 聊天 vs 进入工作环境 =====
  scene(6, 6, sc => {
    const L = put(`<div class="card" style="width:640px;height:560px"></div>`, 450, 500);
    A(L, sc.t0 + 0.1, 'left', 0.6, { d: 60 });
    put(`<div class="label">用法 A · 聊天</div>`, 46, 46, { a: 'tl', parent: L });
    const q1 = put(`<div class="bub me" style="font-size:34px">起个标题</div>`, 594, 170, { a: 'r', parent: L });
    const q2 = put(`<div class="bub me" style="font-size:34px">回答一个问题</div>`, 594, 280, { a: 'r', parent: L });
    const r1 = put(`<div class="bub ai" style="font-size:34px;color:var(--sub)">…… 一段回复</div>`, 46, 420, { a: 'l', parent: L });
    A(q1, at(6, '起个标题'), 'pop', 0.45); A(q2, at(6, '回答一个问题'), 'pop', 0.45); A(r1, at(6, '一段回复'), 'pop', 0.45);
    const tB = at(6, '你把项目文件');
    A(L, tB, 'dim', 0.6, { v: 0.45 });
    const R = put(`<div class="card hot" style="width:900px;height:560px"></div>`, 1380, 500);
    A(R, tB - 0.1, 'right', 0.6, { d: 60 });
    put(`<div class="label c">用法 B · 进入工作环境</div>`, 46, 46, { a: 'tl', parent: R });
    const chips = [['项目文件', '项目文件'], ['任务要求', '任务要求'], ['操作权限', '操作权限']].map(([s, k], i) => {
      const c = put(`<div class="tag c" style="font-size:30px">${s}</div>`, 190 + i * 260, 150, { parent: R });
      A(c, at(6, k), 'pop', 0.45);
      return c;
    });
    const ad = put(arrowD(70), 450, 240, { parent: R });
    A(ad, at(6, '交给它'), 'wipey', 0.4);
    const env = put(`<div class="term glow" style="width:780px;height:190px;border-radius:18px"><div class="bar"><i></i><i></i><i></i><span>工作环境 · ~/project</span></div><div class="body" style="font-size:24px;padding:20px 30px"><div class="ln"><span class="p">></span> 读取文件 · 修改 · 运行</div><div class="bar-track" style="margin-top:14px;height:14px"><div class="bar-fill pf" style="background:var(--grad);width:100%"></div></div></div></div>`, 450, 400, { parent: R });
    A(env, at(6, '它才有条件'), 'up', 0.5);
    A(env, at(6, '进入工作环境'), 'glow', 0.5);
    A(q(env, '.pf'), at(6, '往下做') - 0.2, 'grow', 1.6, { ease: 'inout' });
    chips.forEach(c => A(c, at(6, '交给它'), 'shift', 0.5, { y: 20 }));
  });

  // ===== 7 · 官方说明 =====
  scene(7, 7, sc => {
    const C = put(`<div class="card" style="width:1060px;height:600px"></div>`, 960, 500);
    A(C, sc.t0 + 0.1, 'up', 0.6);
    put(`<div class="row" style="gap:24px">${logo(70)}<div class="col" style="gap:4px"><div class="en" style="font:800 42px var(--en)">Claude Code</div><div class="label">官方说明 · DOCS</div></div></div>`, 60, 90, { a: 'l', parent: C });
    const tg = put(`<div class="tag v" style="font-size:28px">写得很直接</div>`, 1000, 90, { a: 'r', parent: C });
    A(tg, at(7, '写得很直接'), 'pop', 0.5);
    put(`<div class="divider" style="width:940px"></div>`, 60, 170, { a: 'tl', parent: C });
    [['读取项目', 'Read'], ['修改文件', 'Edit'], ['运行命令', 'Bash']].forEach(([s, k], i) => {
      const r = put(`<div class="row" style="width:940px;justify-content:space-between"><div class="row">${chk('c', 56)}<span class="h2" style="font-size:48px">${s}</span></div><span class="kbd" style="font-size:26px">${k}</span></div>`, 60, 250 + i * 120, { a: 'l', parent: C });
      A(r, at(7, s) - 0.05, 'left', 0.5);
    });
  });

  // ===== 8 · 官方示例：写测试 → 运行 → 修复 =====
  scene(8, 8, sc => {
    const tg = put(`<div class="tag c">官方示例</div>`, 960, 170);
    A(tg, sc.t0 + 0.1, 'pop', 0.5);
    const T = put(`<div class="term" style="width:1240px;height:480px"><div class="bar"><i></i><i></i><i></i><span>claude — ~/my-project</span></div><div class="body" style="font-size:29px;line-height:1.85"></div></div>`, 960, 540);
    A(T, sc.t0 + 0.15, 'up', 0.6);
    const body = q(T, '.body');
    const L = (html) => { const d = document.createElement('div'); d.className = 'ln'; d.innerHTML = html; body.appendChild(d); return d; };
    const p = L(`<span class="p">&gt;</span> <span class="ty">给 auth 模块写测试，运行测试，再修复失败项</span>`);
    A(q(p, '.ty'), sc.t0 + 0.4, 'type', 1.0, { ease: 'lin' });
    const l1 = L(`<span class="p">●</span> 创建 tests/auth.test.ts <span class="dm">+48</span>`);
    const l2 = L(`<span class="p">●</span> 运行 npm test`);
    const l3 = L(`<span class="bad">FAIL</span> 2 failed <span class="dm">· 10 passed</span>`);
    const l4 = L(`<span class="p">●</span> 修复 src/auth/login.ts`);
    const l5 = L(`<span class="ok">PASS</span> 12 passed <span class="ok">✓</span>`);
    A(l1, at(8, '写测试'), 'left', 0.4, { d: 20 });
    A(l2, at(8, '运行测试'), 'left', 0.4, { d: 20 });
    A(l3, at(8, '运行测试') + 0.6, 'left', 0.4, { d: 20 });
    A(l4, at(8, '再修复'), 'left', 0.4, { d: 20 });
    A(l5, at(8, '失败项') + 0.15, 'left', 0.4, { d: 20 });
  });

  // ===== 9 · 不再来回复制，AI 自己循环 =====
  scene(9, 9, sc => {
    const win = (title, x) => put(`<div class="card" style="width:280px;height:210px;border-radius:16px"><div class="label" style="position:absolute;left:24px;top:22px">${title}</div><div style="position:absolute;left:24px;right:24px;top:72px;display:flex;flex-direction:column;gap:14px"><i style="display:block;height:10px;border-radius:5px;background:#26304c;width:80%"></i><i style="display:block;height:10px;border-radius:5px;background:#26304c;width:60%"></i><i style="display:block;height:10px;border-radius:5px;background:#26304c;width:70%"></i></div></div>`, x, 430);
    const w1 = win('聊天框', 280), w2 = win('软件', 780);
    A(w1, sc.t0 + 0.1, 'up', 0.5); A(w2, sc.t0 + 0.2, 'up', 0.5);
    const a1 = put(`<div class="col" style="align-items:center;gap:4px"><span class="label">复制</span>${arrowR(150, '#56617f')}</div>`, 530, 385);
    const a2 = put(`<div class="col" style="align-items:center;gap:4px;transform:scaleX(-1)">${arrowR(150, '#56617f')}</div>`, 530, 470);
    const a2l = put(`<span class="label">粘贴</span>`, 530, 505);
    A(a1, at(9, '聊天框'), 'fade', 0.4); A(a2, at(9, '软件'), 'fade', 0.4); A(a2l, at(9, '软件'), 'fade', 0.4);
    const X = put(`<div style="color:#ff5f87;filter:drop-shadow(0 0 16px rgba(255,95,135,.7))">${I.x(150)}</div>`, 530, 430);
    A(X, at(9, '来回复制'), 'pop', 0.45);
    const nx = put(`<div class="tag bad">不用来回复制</div>`, 530, 640);
    A(nx, at(9, '来回复制') + 0.2, 'up', 0.45);
    const tR = at(9, '它可以自己');
    [w1, w2, a1, a2, a2l, X, nx].forEach(e => A(e, tR, 'dim', 0.6, { v: 0.3 }));
    // loop
    const cx = 1400, cy = 430, r = 200;
    const svg = put(`<svg width="460" height="460" viewBox="0 0 460 460"><circle cx="230" cy="230" r="${r}" fill="none" stroke="rgba(140,170,255,.12)" stroke-width="3"/><circle class="lp" cx="230" cy="230" r="${r}" fill="none" stroke="url(#glp)" stroke-width="4" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" stroke-linecap="round" transform="rotate(-90 230 230)"/><defs><linearGradient id="glp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#46e0ff"/><stop offset="1" stop-color="#8b7bff"/></linearGradient></defs></svg>`, cx, cy);
    A(svg, tR - 0.1, 'fade', 0.4);
    A(q(svg, '.lp'), tR, 'draw', at(9, '继续修改') + 0.5 - tR, { ease: 'inout' });
    const core = put(`<div class="col" style="align-items:center;gap:6px"><div class="h2 g">AI</div><div class="label">自动循环</div></div>`, cx, cy);
    A(core, tR, 'pop', 0.5);
    [['自己动手', -90], ['拿到反馈', 30], ['继续修改', 150]].forEach(([k, ang]) => {
      const rad = ang * Math.PI / 180;
      const lab = { '自己动手': '动手', '拿到反馈': '反馈', '继续修改': '修改' }[k];
      const n = put(`<div class="tag c" style="font:700 32px var(--zh);padding:12px 26px;background:#0b1328">${lab}</div>`, cx + r * Math.cos(rad), cy + r * Math.sin(rad));
      A(n, at(9, k), 'pop', 0.45);
    });
    const you = put(`<div class="card okc" style="width:620px;height:110px;border-radius:18px"><div class="row" style="position:absolute;left:30px;top:50%;translate:0 -50%">${chk('ok', 50)}<span class="h3">你：检查最后的结果</span></div></div>`, cx, 780);
    A(you, at(9, '你再检查'), 'up', 0.5);
  });

  // ===== 10 · 不同任务，差距很大 =====
  scene(10, 10, sc => {
    const h = put(`<div class="h2">同样是 AI，<span class="g">不同任务</span>表现差很多</div>`, 960, 230);
    A(h, sc.t0 + 0.1, 'up', 0.6);
    const lb = put(`<div class="label">示意</div>`, 1520, 340, { a: 'r' });
    A(lb, sc.t0 + 0.4, 'fade', 0.5);
    const rows = [['写代码 · 跑测试', 0.92, 'var(--grad)'], ['整理数据', 0.68, 'linear-gradient(90deg,#5b6dff,#8b7bff)'], ['写文案 · 创意', 0.42, 'linear-gradient(90deg,#3a4566,#56617f)']];
    const t1 = at(10, '表现');
    rows.forEach(([n, v, bgc], i) => {
      const y = 430 + i * 110;
      const l = put(`<div class="h3" style="font-size:34px;color:var(--sub)">${n}</div>`, 640, y, { a: 'r' });
      const tr = put(`<div class="bar-track" style="width:880px"><div class="bar-fill" style="width:${v * 100}%;background:${bgc}"></div></div>`, 680, y, { a: 'l' });
      A(l, t1 - 0.4 + i * 0.12, 'up', 0.45); A(tr, t1 - 0.4 + i * 0.12, 'fade', 0.3);
      A(q(tr, '.bar-fill'), t1 - 0.2 + i * 0.15, 'grow', 0.9);
    });
    const gap = put(`<div class="tag v" style="font-size:30px">差距很大</div>`, 1440, 650);
    A(gap, at(10, '差距'), 'pop', 0.5);
  });

  // ===== 11 · 文案 vs 程序：反馈是否明确 =====
  scene(11, 11, sc => {
    const L = put(`<div class="card" style="width:720px;height:540px"></div>`, 540, 510);
    A(L, sc.t0 + 0.1, 'left', 0.6, { d: 60 });
    put(`<div class="label">写文案</div>`, 50, 50, { a: 'tl', parent: L });
    put(`<div class="h2" style="font-size:50px">有没有感染力？</div>`, 50, 96, { a: 'tl', parent: L });
    ['受众', '表达', '具体场景'].forEach((s, i) => {
      const tg = put(`<div class="tag" style="font-size:30px">${s === '具体场景' ? '场景' : s}</div>`, 50 + i * 150, 250, { a: 'tl', parent: L });
      A(tg, at(11, s), 'pop', 0.45);
    });
    const f1 = put(`<div class="col" style="gap:14px"><svg width="600" height="40" viewBox="0 0 600 40"><path d="M0 20 Q 25 0 50 20 T 100 20 T 150 20 T 200 20 T 250 20 T 300 20 T 350 20 T 400 20 T 450 20 T 500 20 T 550 20 T 600 20" fill="none" stroke="#56617f" stroke-width="3"/></svg><div class="t">反馈：见仁见智</div></div>`, 50, 380, { a: 'tl', parent: L });
    A(f1, at(11, '具体场景') + 0.5, 'up', 0.5);
    const tP = at(11, '但程序');
    A(L, tP, 'dim', 0.6, { v: 0.5 });
    const R = put(`<div class="card hot" style="width:720px;height:540px"></div>`, 1380, 510);
    A(R, tP - 0.1, 'right', 0.6, { d: 60 });
    put(`<div class="label c">写程序</div>`, 50, 50, { a: 'tl', parent: R });
    const r1 = put(`<div class="row" style="width:620px;justify-content:space-between"><span class="h3">有没有报错</span><span class="row" style="gap:12px"><span class="mono okt" style="font-size:26px">0 error</span>${chk('ok', 46)}</span></div>`, 50, 140, { a: 'l', parent: R });
    const r2 = put(`<div class="row" style="width:620px;justify-content:space-between"><span class="h3">测试有没有通过</span><span class="row" style="gap:12px"><span class="mono okt" style="font-size:26px">12/12 PASS</span>${chk('ok', 46)}</span></div>`, 50, 240, { a: 'l', parent: R });
    A(r1, at(11, '有没有报错'), 'left', 0.5); A(r2, at(11, '测试有没有'), 'left', 0.5);
    const f2 = put(`<div class="col" style="gap:14px"><svg width="600" height="40" viewBox="0 0 600 40"><path d="M0 20 H600" stroke="#3ef2b0" stroke-width="3"/><circle cx="600" cy="20" r="0"/></svg><div class="t okt">反馈：明确，可判断</div></div>`, 50, 380, { a: 'tl', parent: R });
    A(f2, at(11, '更明确'), 'up', 0.5);
  });

  // ===== 12 · 可验证 → 持续改进 =====
  scene(12, 12, sc => {
    const lb = put(`<div class="label c">KARPATHY · 讨论过</div>`, 260, 330, { a: 'l' });
    A(lb, sc.t0 + 0.1, 'up', 0.5);
    const h = put(`<div class="h1"><span class="g">可验证</span>的任务</div>`, 260, 440, { a: 'l' });
    A(h, at(12, '可验证'), 'up', 0.6);
    const s = put(`<div class="h3 subt">更容易形成 <span style="color:var(--ink)">持续改进</span></div>`, 260, 560, { a: 'l' });
    A(s, at(12, '更容易'), 'up', 0.5);
    const path = 'M0 380 H110 V320 H220 V255 H330 V200 H440 V140 H550 V90 H660 V50';
    const ch = put(`<svg width="720" height="420" viewBox="-20 0 720 420" overflow="visible"><path d="M0 0 V400 H700" fill="none" stroke="rgba(140,170,255,.2)" stroke-width="2"/><path class="st" d="${path}" fill="none" stroke="url(#gst)" stroke-width="5" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/><defs><linearGradient id="gst" x1="0" x2="1"><stop offset="0" stop-color="#46e0ff"/><stop offset="1" stop-color="#9b8bff"/></linearGradient></defs>${[[110, 320], [220, 255], [330, 200], [440, 140], [550, 90], [660, 50]].map(([x, y], i) => `<circle class="dt${i}" cx="${x}" cy="${y}" r="9" fill="#0b1328" stroke="#7cf0ff" stroke-width="3"/>`).join('')}</svg>`, 1330, 470);
    A(ch, at(12, '可验证'), 'fade', 0.5);
    const tS = at(12, '更容易'), dS = atEnd(12, '过程') - tS;
    A(q(ch, '.st'), tS, 'draw', dS, { ease: 'inout' });
    for (let i = 0; i < 6; i++) A(q(ch, '.dt' + i), tS + dS * (i + 1) / 6.5, 'fade', 0.2);
    const ax = put(`<div class="label">验证 → 修正 → 再验证</div>`, 1330, 720);
    A(ax, at(12, '持续改进'), 'up', 0.5);
  });

  // ===== 13 · 两种误判 =====
  scene(13, 13, sc => {
    const h = put(`<div class="h3 subt">别走两个极端</div>`, 960, 190);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const row = (y, cause, res, tc, tr, tsk) => {
      const b = put(`<div class="badt" style="font:900 64px var(--zh)">别</div>`, 210, y);
      const c = put(`<div class="card" style="width:600px;height:140px;border-radius:20px"><div class="h3" style="position:absolute;left:36px;top:50%;translate:0 -50%">${cause}</div></div>`, 600, y);
      const ar = put(arrowR(150), 1010, y);
      const r = put(`<div class="h2 strike" style="display:inline-block">${res}<i class="sl"></i></div>`, 1110, y, { a: 'l' });
      A(b, tc, 'pop', 0.45); A(c, tc, 'left', 0.5); A(ar, tr - 0.1, 'wipe', 0.4); A(r, tr, 'up', 0.5); A(r, tsk, 'strike', 0.4);
    };
    row(400, '写了一段不满意的文案', '什么都干不了', at(13, '别因为'), at(13, '就断定'), atEnd(13, '干不了'));
    row(640, '做出了一个页面', '什么都能接', at(13, '也别因为'), at(13, '就觉得'), atEnd(13, '都能接'));
  });

  // ===== 14 · PART 02 =====
  scene(14, 14, sc => {
    const lb = put(`<div class="label c" style="font-size:24px">PART 02 · 上手方法</div>`, 960, 330);
    A(lb, sc.t0 + 0.1, 'up', 0.5);
    const ln1 = put(`<div style="width:520px;height:2px;background:var(--grad);transform-origin:center"></div>`, 960, 380);
    A(ln1, sc.t0 + 0.2, 'grow', 0.7);
    const h = put(`<div class="h1">普通人，怎么把它<span class="g">真正用起来</span>？</div>`, 960, 480);
    A(h, sc.t0 + 0.2, 'up', 0.6);
    const tg = put(`<div class="tag v" style="font-size:30px">尤其是做自媒体的我们</div>`, 960, 620);
    A(tg, at(14, '自媒体'), 'pop', 0.5);
  }, { zoom: 0.05 });

  // ===== 15 · 先找一件事 =====
  scene(15, 15, sc => {
    const lb = put(`<div class="label c">STEP 01</div>`, 300, 380, { a: 'l' });
    A(lb, sc.t0 + 0.1, 'up', 0.4);
    const h = put(`<div class="h1">先找<span class="g">一件事</span></div>`, 300, 480, { a: 'l' });
    A(h, sc.t0 + 0.15, 'up', 0.5);
    const c1 = put(`<div class="card" style="width:600px;height:120px;border-radius:20px"><div class="row" style="position:absolute;left:32px;top:50%;translate:0 -50%">${chk('ok', 52)}<span class="h3">每周都得做</span></div></div>`, 1340, 400);
    const c2 = put(`<div class="card hot" style="width:600px;height:120px;border-radius:20px"><div class="row" style="position:absolute;left:32px;top:50%;translate:0 -50%">${chk('ok', 52)}<span class="h3">又特别耗时间</span></div></div>`, 1340, 560);
    A(c1, at(15, '每周'), 'right', 0.5); A(c2, at(15, '特别耗'), 'right', 0.5);
  });

  // ===== 16 · 复盘账号：过去 vs 现在 =====
  scene(16, 16, sc => {
    const h = put(`<div class="h2">比如：<span class="g">复盘账号</span></div>`, 960, 190);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const L = put(`<div class="card" style="width:680px;height:540px"></div>`, 560, 570);
    A(L, at(16, '过去'), 'left', 0.6, { d: 60 });
    put(`<div class="label">过去 · 全靠手动</div>`, 50, 50, { a: 'tl', parent: L });
    [['打开后台', '打开后台'], ['导出数据', '导出数据'], ['整理表格', '整理表格'], ['一条条比较', '一条条比较']].forEach(([s, k], i) => {
      const r = put(`<div class="row"><span class="mono dimt" style="font-size:24px">0${i + 1}</span><span class="h3" style="font-size:36px">${s}</span></div>`, 50, 150 + i * 95, { a: 'l', parent: L });
      A(r, at(16, k), 'left', 0.45);
    });
    const tN = at(16, '现在');
    A(L, tN, 'dim', 0.6, { v: 0.45 });
    const R = put(`<div class="card hot" style="width:680px;height:540px"></div>`, 1360, 570);
    A(R, tN - 0.1, 'right', 0.6, { d: 60 });
    put(`<div class="label c">现在 · 交给它</div>`, 50, 50, { a: 'tl', parent: R });
    const f = put(`<div class="tag" style="font:500 28px var(--mono);color:var(--ink)">${I.file(30)} 后台导出.csv</div>`, 340, 150, { parent: R });
    A(f, at(16, '导出的文件'), 'move', 0.6, { x: -260 }); A(f, at(16, '导出的文件'), 'fade', 0.3);
    const ad = put(arrowD(64), 340, 228, { parent: R });
    A(ad, at(16, '交给它'), 'wipey', 0.4);
    const ai = put(`<div class="row glow" style="gap:20px;padding:20px 34px;border-radius:20px;border:1px solid var(--line2);background:rgba(10,16,34,.9)">${logo(56)}<span class="en" style="font:800 36px var(--en);white-space:nowrap">Claude Code</span></div>`, 340, 330, { parent: R });
    A(ai, at(16, '交给它') - 0.1, 'pop', 0.5); A(ai, at(16, '交给它') + 0.3, 'glow', 0.4);
    const rq = put(`<div class="tag c" style="font-size:32px;padding:12px 28px">把要求说清楚</div>`, 340, 460, { parent: R });
    A(rq, at(16, '把要求'), 'pop', 0.5);
  });

  // ===== 17 · 提示词 → 复盘表 =====
  scene(17, 17, sc => {
    const P = put(`<div class="card vio" style="width:1560px;height:150px;border-radius:20px"></div>`, 960, 230);
    A(P, sc.t0 + 0.05, 'up', 0.5);
    put(`<div class="label" style="color:#b9b0ff">PROMPT</div>`, 40, 34, { a: 'tl', parent: P });
    const txt = ln(17).text.slice(1, -1);
    const ty = put(`<div style="font:500 31px var(--zh);color:var(--ink);white-space:nowrap">${txt}</div>`, 40, 98, { a: 'l', parent: P });
    A(ty, 0, 'typeT', 0, { times: charTimes(17, txt) });
    const T = put(`<div class="card" style="width:1360px;height:470px"></div>`, 960, 620);
    A(T, at(17, '按选题') + 0.2, 'up', 0.6);
    put(`<div class="row" style="gap:18px"><span class="h3">复盘表</span><span class="label">示例数据</span></div>`, 44, 52, { a: 'l', parent: T });
    const ok = put(`<div class="tag ok" style="font-size:24px">${I.check(22)} 已生成</div>`, 1316, 52, { a: 'r', parent: T });
    A(ok, at(17, '复盘表'), 'pop', 0.5);
    const data = [['工具教程', '12', '3.2 万', '6.1%', ''], ['行业观点', '9', '1.8 万', '4.3%', ''], ['案例拆解', '7', '2.5 万', '—', '缺互动数据'], ['日常记录', '5', '0.9 万', '2.0%', '']];
    const tb = put(`<table class="tbl" style="width:1272px"><tr><th>选题类型</th><th>条数</th><th>平均观看</th><th>互动率</th><th>备注</th></tr>${data.map(r => `<tr><td class="k" style="color:var(--ink)">${r[0]}</td><td class="n m">${r[1]}</td><td class="n m">${r[2]}</td><td class="n m ${r[3] === '—' ? 'cellhl miss x' : ''}">${r[3]}${r[3] === '—' ? '<b></b>' : ''}</td><td class="${r[4] ? 'miss x2' : ''}">${r[4]}</td></tr>`).join('')}</table>`, 44, 100, { a: 'tl', parent: T });
    stag(qa(tb, '.k'), at(17, '选题类型'), 0.1, 'left', 0.4);
    const ms = qa(tb, '.m');
    ms.forEach((e, i) => A(e, at(17, '比较') + (i % 3) * 0.25 + Math.floor(i / 3) * 0.08, 'fade', 0.35));
    const hl = q(tb, '.x b');
    A(hl, at(17, '标出数据缺失'), 'pop', 0.4);
    A(q(tb, '.x2'), at(17, '缺失'), 'left', 0.4);
  });

  // ===== 18 · 抽查 & 别急着总结爆款公式 =====
  scene(18, 18, sc => {
    const L = put(`<div class="card" style="width:780px;height:540px"></div>`, 560, 510);
    A(L, sc.t0 + 0.1, 'left', 0.6, { d: 60 });
    put(`<div class="label">做完以后 · 抽查原始数据</div>`, 44, 48, { a: 'tl', parent: L });
    const rows = ['工具教程 · 第 03 条', '行业观点 · 第 07 条', '案例拆解 · 第 02 条', '日常记录 · 第 05 条'];
    rows.forEach((s, i) => {
      const r = put(`<div class="row glow" style="width:690px;height:66px;padding:0 22px;border-radius:12px;border:1px solid var(--line);justify-content:space-between"><span class="t" style="font-size:27px;color:var(--ink)">${s}</span><span class="mono dimt" style="font-size:22px">RAW</span></div>`, 44, 110 + i * 80, { a: 'tl', parent: L });
      A(r, sc.t0 + 0.3 + i * 0.08, 'up', 0.4);
      if (i !== 1) A(r, at(18, '抽几条') + i * 0.15, 'glow', 0.4);
    });
    const c1 = put(`<div class="tag ok" style="font-size:28px">${I.check(24)} 有没有算错</div>`, 44, 474, { a: 'l', parent: L });
    const c2 = put(`<div class="tag ok" style="font-size:28px">${I.check(24)} 有没有分错</div>`, 330, 474, { a: 'l', parent: L });
    A(c1, at(18, '算错'), 'pop', 0.45); A(c2, at(18, '分错'), 'pop', 0.45);
    const tR = at(18, '遇到播放量');
    A(L, tR, 'dim', 0.6, { v: 0.45 });
    const R = put(`<div class="card badc" style="width:700px;height:540px"></div>`, 1390, 510);
    A(R, tR - 0.1, 'right', 0.6, { d: 60 });
    put(`<div class="label" style="color:#ff9ab3">播放量高 ≠ 规律</div>`, 44, 48, { a: 'tl', parent: R });
    const hh = put(`<div class="h2">“爆款公式”？</div>`, 44, 130, { a: 'l', parent: R });
    A(hh, at(18, '爆款公式'), 'up', 0.5);
    const sc3 = put(`<svg width="600" height="220" viewBox="0 0 600 220"><path d="M0 210 H600 M0 0 V210" stroke="rgba(140,170,255,.25)" stroke-width="2"/><circle cx="120" cy="160" r="12" fill="#56617f"/><circle cx="270" cy="150" r="12" fill="#56617f"/><circle cx="470" cy="40" r="16" fill="#46e0ff"/><text x="490" y="30" fill="#9aa6c4" font-size="22" font-family="JetBrains Mono">n = 3</text></svg>`, 44, 200, { a: 'tl', parent: R });
    A(sc3, at(18, '爆款公式') + 0.2, 'fade', 0.5);
    const w = put(`<div class="tag bad" style="font-size:28px">先看样本够不够</div>`, 44, 474, { a: 'l', parent: R });
    A(w, at(18, '先看有没有'), 'pop', 0.45);
  });

  // ===== 19 · 选题管理页面 =====
  scene(19, 19, sc => {
    const h = put(`<div class="h3">再往前一步：做个<span class="g">选题管理页面</span></div>`, 960, 170);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const W = put(`<div class="term" style="width:1180px;height:560px"><div class="bar"><i></i><i></i><i></i><span class="vt">选题管理 · v1</span></div></div>`, 790, 560);
    A(W, at(19, '选题管理页面') - 0.2, 'up', 0.6);
    const cols = ['标题', '参考素材', '脚本进度', '发布时间'];
    const cx = [40, 430, 650, 930];
    const rows = [['Claude Code 上手', '3 条链接', 0.8, '10-24'], ['AI 复盘账号', '2 条链接', 0.45, '10-28'], ['普通人怎么用 AI', '5 条链接', 0.2, '11-02']];
    cols.forEach((c, j) => {
      const t = at(19, c);
      const hd = put(`<div class="label" style="font-size:20px">${c}</div>`, cx[j], 100, { a: 'tl', parent: W });
      A(hd, t - 0.1, 'up', 0.4);
      rows.forEach((r, i) => {
        const y = 170 + i * 115;
        let html;
        if (j === 0) html = `<div class="h3" style="font-size:32px">${r[0]}</div>`;
        else if (j === 1) html = `<div class="tag" style="font-size:24px">${I.file(24)} ${r[1]}</div>`;
        else if (j === 2) html = `<div class="row" style="gap:14px"><div class="bar-track" style="width:170px;height:14px"><div class="bar-fill pf" style="width:${r[2] * 100}%;background:var(--grad)"></div></div><span class="mono subt" style="font-size:22px">${Math.round(r[2] * 100)}%</span></div>`;
        else html = `<div class="mono" style="font-size:26px;color:var(--c1)">${r[3]}</div>`;
        const cel = put(html, cx[j], y, { a: 'tl', parent: W });
        A(cel, t + i * 0.1, 'up', 0.4);
        if (j === 2) A(q(cel, '.pf'), t + i * 0.1, 'grow', 0.8);
      });
    });
    const steps = [['做出最需要的功能', '先把最需要'], ['自己用一遍', '自己用一遍'], ['再继续改', '再继续改']];
    steps.forEach(([s, k], i) => {
      const c = put(`<div class="tag ${i === 2 ? 'c' : ''}" style="font-size:28px;padding:14px 26px">${s}</div>`, 1640, 380 + i * 150);
      A(c, at(19, k), 'pop', 0.45);
      if (i < 2) { const ad = put(arrowD(60), 1640, 455 + i * 150); A(ad, at(19, steps[i + 1][1]) - 0.2, 'wipey', 0.3); }
    });
    const v2 = put(`<div class="tag solid mono" style="font-size:18px;padding:4px 12px">v2</div>`, 1340, 306);
    A(v2, at(19, '再继续改') + 0.2, 'pop', 0.45);
  });

  // ===== 20 · 不会写代码也可以 =====
  scene(20, 20, sc => {
    const h = put(`<div class="h2">不会写<span class="strike" style="display:inline-block">代码<i class="sl"></i></span>？也可以从<span class="g">小工具</span>开始</div>`, 960, 270);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    A(q(h, '.strike'), at(20, '也可以'), 'strike', 0.4);
    const lb = put(`<div class="label c">你需要逐步学会的</div>`, 960, 430);
    A(lb, at(20, '你需要'), 'up', 0.45);
    const c1 = put(`<div class="card hot" style="width:640px;height:220px"><div class="num g" style="position:absolute;left:44px;top:36px;font-size:40px">01</div><div class="h2" style="position:absolute;left:44px;top:104px;font-size:48px">把需求讲清楚</div></div>`, 600, 610);
    const c2 = put(`<div class="card vio" style="width:640px;height:220px"><div class="num g" style="position:absolute;left:44px;top:36px;font-size:40px">02</div><div class="h2" style="position:absolute;left:44px;top:104px;font-size:48px">看懂结果是否达标</div></div>`, 1320, 610);
    A(c1, at(20, '把需求'), 'up', 0.5); A(c2, at(20, '看懂结果'), 'up', 0.5);
  });

  // ===== 21-22 · 三件事 & 缺一样会怎样 =====
  scene(21, 22, sc => {
    const h = put(`<div class="h2">记住<span class="g">三件事</span></div>`, 960, 180);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const items = [
      ['材料在哪里', '材料在哪里', '把文件给全', '文件不给全', '理解错', '理解错'],
      ['要交付什么', '要交付什么', '说清目标和产出', '目标说不清', '做偏', '做偏'],
      ['怎样算完成', '怎样算完成', '定好验收标准', '没有验收标准', '看着厉害，用不上', '看着挺厉害'],
    ];
    items.forEach(([title, k, desc, fk, res, rk], i) => {
      const x = 440 + i * 520;
      const C = put(`<div class="card" style="width:470px;height:520px"></div>`, x, 560);
      A(C, at(21, k) - 0.1, 'up', 0.55);
      put(`<div class="num g" style="font-size:64px">0${i + 1}</div>`, 44, 40, { a: 'tl', parent: C });
      put(`<div class="h2" style="font-size:46px">${title}</div>`, 44, 150, { a: 'tl', parent: C });
      put(`<div class="t">${desc}</div>`, 44, 225, { a: 'tl', parent: C });
      const ft = put(`<div class="col" style="gap:18px"><div class="divider" style="width:382px;background:rgba(255,95,135,.35)"></div><div class="t" style="color:#ffc2d1">${fk}</div><div class="row" style="gap:14px">${chk('bad', 44)}<span class="h3" style="font-size:34px;color:var(--bad)">${res}</span></div></div>`, 44, 310, { a: 'tl', parent: C });
      const tf = at(22, fk);
      A(ft, tf, 'up', 0.5);
      A(C, tf, 'cls', 0, { c: 'badc' });
      A(q(ft, '.row'), at(22, rk), 'left', 0.4);
    });
  }, { zoom: 0.025 });

  // ===== 23 · 稳定用上的前提 =====
  scene(23, 23, sc => {
    const h = put(`<div class="h2">至于<span class="g">“稳定用上”</span></div>`, 960, 180);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const L = put(`<div class="card okc" style="width:680px;height:500px"></div>`, 580, 560);
    A(L, at(23, '先确认'), 'left', 0.6, { d: 60 });
    put(`<div class="label" style="color:#7dffd0">先确认 · 官方支持条件</div>`, 50, 50, { a: 'tl', parent: L });
    [['所在地符合', '所在地'], ['账号符合', '账号']].forEach(([s, k], i) => {
      const r = put(`<div class="row">${chk('ok', 56)}<span class="h2" style="font-size:46px">${s}</span></div>`, 50, 170 + i * 120, { a: 'l', parent: L });
      A(r, at(23, k), 'left', 0.45);
    });
    const tg = put(`<div class="tag ok" style="font-size:26px">以官方说明为准</div>`, 50, 430, { a: 'l', parent: L });
    A(tg, at(23, '官方支持'), 'pop', 0.45);
    const tR = at(23, '改语言');
    const R = put(`<div class="card badc" style="width:680px;height:500px"></div>`, 1340, 560);
    A(R, tR - 0.1, 'right', 0.6, { d: 60 });
    put(`<div class="label" style="color:#ff9ab3">这些都不是保证</div>`, 50, 50, { a: 'tl', parent: R });
    [['改语言', '改语言'], ['换时区', '换时区'], ['换付款方式', '付款方式']].forEach(([s, k], i) => {
      const r = put(`<div class="row">${chk('bad', 52)}<span class="h3" style="font-size:42px">${s}</span></div>`, 50, 150 + i * 95, { a: 'l', parent: R });
      A(r, at(23, k) - 0.05, 'left', 0.45);
    });
    const ft = put(`<div class="t" style="color:#ffc2d1">≠ 稳定使用的保证</div>`, 50, 440, { a: 'l', parent: R });
    A(ft, at(23, '都不能'), 'up', 0.45);
  });

  // ===== 24 · 接进日常工作 =====
  scene(24, 24, sc => {
    const h = put(`<div class="h2">更重要的一步：<span class="g">接进日常工作</span></div>`, 960, 230);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const xs = [420, 780, 1140, 1500], ns = ['选题', '脚本', '制作', '复盘'];
    const track = put(`<div style="width:1080px;height:3px;background:rgba(140,170,255,.25)"></div>`, 960, 600);
    A(track, sc.t0 + 0.2, 'grow', 0.8);
    ns.forEach((n, i) => {
      const e = put(`<div class="node"><div class="disc" style="width:120px;height:120px;font:700 34px var(--zh);color:var(--sub)">${n}</div></div>`, xs[i], 600);
      A(e, sc.t0 + 0.3 + i * 0.12, 'up', 0.45);
      A(e, at(24, '日常工作') + i * 0.12, 'cls', 0, { c: 'on' });
    });
    const cc = put(`<div class="row glow" style="gap:16px;padding:16px 28px;border-radius:18px;border:1px solid rgba(70,224,255,.6);background:rgba(10,16,34,.95)">${logo(48)}<span class="en" style="font:800 30px var(--en)">Claude Code</span></div>`, 960, 430);
    A(cc, at(24, '接进') - 0.3, 'move', 0.6, { y: -120 }); A(cc, at(24, '接进') - 0.3, 'fade', 0.3);
    A(cc, at(24, '接进'), 'glow', 0.4);
    const ad = put(arrowD(60), 960, 515);
    A(ad, at(24, '接进'), 'wipey', 0.3);
  });

  // ===== 25 · 从一件小事开始 =====
  scene(25, 25, sc => {
    const L = put(`<div class="card" style="width:560px;height:360px"></div>`, 430, 520);
    A(L, sc.t0 + 0.1, 'left', 0.5, { d: 60 });
    put(`<div class="label">不用第一天就</div>`, 44, 44, { a: 'tl', parent: L });
    const big = put(`<div class="h2 strike" style="display:inline-block;font-size:56px">做个大产品<i class="sl"></i></div>`, 44, 190, { a: 'l', parent: L });
    A(big, atEnd(25, '大产品'), 'strike', 0.4);
    A(L, at(25, '先让它'), 'dim', 0.6, { v: 0.4 });
    const steps = [['完成一件原本亲手做的事', '先让它完成'], ['检查结果', '检查结果'], ['修改要求', '修改要求'], ['把有效的做法留下来', '有效的做法']];
    steps.forEach(([s, k], i) => {
      const c = put(`<div class="card ${i === 3 ? 'hot' : ''}" style="width:860px;height:112px;border-radius:18px"><div class="row" style="position:absolute;left:32px;top:50%;translate:0 -50%;gap:26px"><span class="num g" style="font-size:34px">0${i + 1}</span><span class="h3" style="font-size:38px">${s}</span></div></div>`, 1320, 300 + i * 140);
      A(c, at(25, k) - 0.1, 'right', 0.5);
    });
    const sv = put(`<div class="tag solid" style="font-size:22px">沉淀成方法</div>`, 1700, 720);
    A(sv, atEnd(25, '留下来') - 0.1, 'pop', 0.45);
  });

  // ===== 26 · 真正的进步 =====
  scene(26, 26, sc => {
    const h = put(`<div class="h2">你和 AI 之间，<span class="g">真正的进步</span></div>`, 960, 190);
    A(h, sc.t0 + 0.1, 'up', 0.5);
    const L = put(`<div class="card dimc" style="width:640px;height:480px"></div>`, 560, 560);
    A(L, at(26, '不是'), 'left', 0.5, { d: 60 });
    put(`<div class="label">不是</div>`, 50, 50, { a: 'tl', parent: L });
    const cnt = put(`<div class="num dimt" style="font-size:120px">0</div>`, 50, 200, { a: 'l', parent: L });
    A(cnt, at(26, '聊了'), 'count', 1.0, { from: 0, to: 128, suf: ' 轮' });
    const t = put(`<div class="h2 strike" style="display:inline-block">聊了多少轮<i class="sl"></i></div>`, 50, 350, { a: 'l', parent: L });
    A(t, atEnd(26, '多少轮'), 'strike', 0.4);
    const tR = at(26, '而是');
    const R = put(`<div class="card hot" style="width:680px;height:480px"></div>`, 1340, 560);
    A(R, tR - 0.1, 'right', 0.5, { d: 60 });
    put(`<div class="label c">而是 · 真实的工作，已交给它完成</div>`, 50, 50, { a: 'tl', parent: R });
    ['账号复盘表', '选题管理页面', '原始数据核对', '每周数据周报'].forEach((s, i) => {
      const r = put(`<div class="row" style="gap:18px">${chk('ok', 46)}<span class="h3" style="font-size:36px">${s}</span></div>`, 50, 140 + i * 80, { a: 'l', parent: R });
      A(r, at(26, '真实的工作') + i * 0.45, 'left', 0.45);
    });
    const n = put(`<div class="num g" style="font-size:44px;white-space:nowrap">0 件</div>`, 630, 50, { a: 'tr', parent: R });
    A(n, at(26, '真实的工作'), 'count', 0.45 * 4, { from: 0, to: 4, suf: ' 件', ease: 'lin' });
  }, { t1: ln(26).end + 0.9 });

  // ===== outro =====
  scene(26, 26, sc => {
    const lg = put(logo(96), 960, 400);
    A(lg, sc.t0 + 0.1, 'pop', 0.6);
    const h = put(`<div class="h2">把真实的工作，<span class="g">交给它完成</span></div>`, 960, 540);
    A(h, sc.t0 + 0.25, 'up', 0.6);
    const lb = put(`<div class="label">AI WORKFLOW · CLAUDE CODE</div>`, 960, 630);
    A(lb, sc.t0 + 0.45, 'up', 0.6);
  }, { t0: ln(26).end + 0.9, t1: TM.duration + 1, zoom: 0.03 });
})();
