/* Hanzi Defence V1.1 */
(function () {
  'use strict';
  const W = 1280, H = 720;
  const FIELD_TOP = 112, FIELD_BOT = 618;
  const SHIELD_X = 182, BASE_X = 78, CAVE_X = 1130, ACTIVE_X = 1045, TUR_X = 120;
  const MAX_BUGS = 8;
  const RELOAD_START = 2.5, RELOAD_STEP = 0.1, RELOAD_MIN = 0.8;
  const HZ = '"Microsoft YaHei","微软雅黑","PingFang SC",sans-serif';
  const EN = '"Century Gothic","Segoe UI",Arial,sans-serif';
  const DIFF = {
    easy: { goal: 10, field: 3, speed: 20, label: 'Easy' },
    normal: { goal: 15, field: 4, speed: 27, label: 'Normal' },
    hard: { goal: 20, field: 5, speed: 34, label: 'Hard' }
  };
  const GEAR = {
    swivel: { name: 'AGILE BARREL', icon: '↻', col: '#7dffb0' },
    rail: { name: 'RAIL MODULE', icon: '⇕', col: '#5ff0ff' },
    shield: { name: 'SHIELD REPAIR', icon: '⛨', col: '#8fb8ff' },
    aim: { name: 'AIM LINE · 15s', icon: '⌖', col: '#ff9df0' }
  };
  const MAX_SWIVEL = 4, MAX_RAIL = 3, AIM_TIME = 15;

  const $ = id => document.getElementById(id);
  const cv = $('game'), ctx = cv.getContext('2d');
  const stage = $('stage');
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function fit() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  window.addEventListener('resize', fit); fit();

  /* ---------- vocabulary ---------- */
  const DATA = (window.CHINESE_VOCAB_DATA && window.CHINESE_VOCAB_DATA.years) || [];
  function enParts(en) {
    return String(en).toLowerCase().replace(/\([^)]*\)/g, ' ')
      .split(/[\/;,]/).map(s => s.replace(/^\s*to\s+/, '').replace(/[?!.]/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  function conflicts(a, b) {
    if (a.hanzi === b.hanzi) return true;
    return a.keys.some(k => b.keys.includes(k));
  }
  function buildPool(lists) {
    const seen = new Set(), out = [];
    lists.forEach(l => (l.words || []).forEach(w => {
      if (!w || !w.hanzi || !w.english || seen.has(w.hanzi)) return;
      seen.add(w.hanzi);
      out.push({ hanzi: w.hanzi, pinyin: w.pinyin || '', english: w.english, keys: enParts(w.english) });
    }));
    return out;
  }

  /* ---------- menu ---------- */
  let diff = 'easy', lastPool = null, lastLabel = '';
  const selYear = $('selYear'), selTopic = $('selTopic'), listBox = $('listBox'), poolInfo = $('poolInfo');
  const validTopics = y => (y.topics || []).filter(t => (t.lists || []).some(l => (l.words || []).length));
  const years = DATA.filter(y => validTopics(y).length);
  years.forEach((y, i) => selYear.add(new Option(y.name, i)));
  function fillTopics() {
    selTopic.innerHTML = '';
    const y = years[selYear.value]; if (!y) return;
    validTopics(y).forEach((t, i) => selTopic.add(new Option(t.name, i)));
    fillLists();
  }
  function curTopic() { const y = years[selYear.value]; return y ? validTopics(y)[selTopic.value] : null; }
  function fillLists() {
    listBox.innerHTML = '';
    const t = curTopic(); if (!t) return;
    t.lists.filter(l => (l.words || []).length).forEach((l, i) => {
      const lab = document.createElement('label'); lab.className = 'item';
      lab.innerHTML = `<input type="checkbox" value="${i}" ${i === 0 ? 'checked' : ''}> ${l.name} <small style="color:#7f93b5">(${l.words.length})</small>`;
      listBox.appendChild(lab);
    });
    updatePoolInfo();
  }
  function chosenLists() {
    const t = curTopic(); if (!t) return [];
    const ls = t.lists.filter(l => (l.words || []).length);
    return [...listBox.querySelectorAll('input:checked')].map(c => ls[+c.value]);
  }
  function updatePoolInfo() {
    const p = buildPool(chosenLists());
    const ok = p.length >= 4;
    poolInfo.textContent = ok ? `${p.length} unique words ready.` : 'Choose lists with at least 4 unique words.';
    poolInfo.className = 'pool-info' + (ok ? '' : ' bad');
    $('btnStart').disabled = !ok;
  }
  selYear.addEventListener('change', fillTopics);
  selTopic.addEventListener('change', fillLists);
  listBox.addEventListener('change', updatePoolInfo);
  document.querySelectorAll('.diff').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.diff').forEach(x => x.classList.remove('on'));
    b.classList.add('on'); diff = b.dataset.d;
  }));
  fillTopics();

  /* ---------- audio ---------- */
  let actx = null, musicOn = true;
  const bgm = $('bgm'); bgm.volume = 0.35;
  function ac() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } return actx; }
  function tone(f, d, type = 'sine', v = 0.12, f2) {
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d);
  }
  function noise(d, v) {
    const a = ac(); if (!a) return;
    const buf = a.createBuffer(1, a.sampleRate * d, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900;
    s.buffer = buf; g.gain.value = v; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  const SFX = {
    fire: () => { tone(320, 0.18, 'square', 0.07, 80); noise(0.25, 0.18); },
    good: () => { tone(660, 0.12, 'triangle', 0.12); setTimeout(() => tone(990, 0.2, 'triangle', 0.12), 90); },
    bad: () => tone(200, 0.3, 'sawtooth', 0.08, 90),
    split: () => tone(300, 0.25, 'square', 0.06, 600),
    hitShield: () => tone(140, 0.35, 'sawtooth', 0.1, 60),
    gear: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.15, 'triangle', 0.1), i * 70)); },
    dig: () => noise(0.4, 0.08),
    ready: () => tone(1500, 0.05, 'sine', 0.04),
    order: () => tone(1200, 0.08, 'sine', 0.06),
    win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.12), i * 110)); },
    lose: () => { [400, 300, 200, 120].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.08), i * 160)); }
  };
  function playMusic() { if (musicOn) { const p = bgm.play(); if (p) p.catch(() => { }); } }
  $('btnMusic').addEventListener('click', () => {
    musicOn = !musicOn; $('btnMusic').textContent = musicOn ? '♪ ON' : '♪ OFF';
    if (musicOn) playMusic(); else bgm.pause();
    $('btnMusic').blur();
  });
  $('btnFull').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
    else document.exitFullscreen();
    $('btnFull').blur();
  });

  /* ---------- background ---------- */
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
  (function drawBg() {
    const b = bg.getContext('2d');
    const g = b.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#060d24'); g.addColorStop(0.55, '#0b1838'); g.addColorStop(1, '#101c35');
    b.fillStyle = g; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { b.fillStyle = `rgba(200,230,255,${rand(0.15, 0.7)})`; b.fillRect(rand(0, W), rand(0, H * 0.6), rand(1, 2.2), rand(1, 2.2)); }
    const pg = b.createRadialGradient(640, 40, 10, 640, 40, 160);
    pg.addColorStop(0, 'rgba(120,90,200,0.35)'); pg.addColorStop(1, 'rgba(120,90,200,0)');
    b.fillStyle = pg; b.fillRect(400, 0, 480, 220);
    b.strokeStyle = 'rgba(80,200,255,0.06)'; b.lineWidth = 1;
    for (let x = 200; x < CAVE_X; x += 60) { b.beginPath(); b.moveTo(x, FIELD_TOP); b.lineTo(x, FIELD_BOT); b.stroke(); }
    for (let y = FIELD_TOP; y <= FIELD_BOT; y += 46) { b.beginPath(); b.moveTo(190, y); b.lineTo(CAVE_X, y); b.stroke(); }
    b.fillStyle = '#1a1430';
    b.beginPath(); b.moveTo(1100, 90); b.quadraticCurveTo(1150, 60, W, 70); b.lineTo(W, 650); b.quadraticCurveTo(1150, 670, 1100, 640);
    b.quadraticCurveTo(1060, 365, 1100, 90); b.fill();
    b.fillStyle = '#251c44';
    for (let i = 0; i < 14; i++) { b.beginPath(); b.ellipse(rand(1110, 1270), rand(90, 640), rand(8, 26), rand(6, 18), rand(0, 3), 0, 7); b.fill(); }
    const cg = b.createRadialGradient(1215, 365, 20, 1215, 365, 270);
    cg.addColorStop(0, '#000'); cg.addColorStop(0.6, '#08051a'); cg.addColorStop(1, 'rgba(8,5,26,0)');
    b.fillStyle = cg; b.beginPath(); b.ellipse(1205, 365, 95, 260, 0, 0, 7); b.fill();
    const fg = b.createLinearGradient(0, 0, BASE_X + 20, 0);
    fg.addColorStop(0, '#132a4f'); fg.addColorStop(1, '#1d3d6b');
    b.fillStyle = fg; b.fillRect(0, 84, BASE_X, 560);
    b.fillStyle = '#2a5a90';
    for (let y = 100; y < 640; y += 40) { b.fillRect(BASE_X - 10, y, 12, 26); }
    b.strokeStyle = '#4bb8ff55'; b.lineWidth = 2; b.strokeRect(6, 96, BASE_X - 20, 536);
  })();

  /* ---------- state ---------- */
  let G = null, state = 'menu', last = 0;
  const keys = {};
  const reloadTime = () => Math.max(RELOAD_MIN, Math.round((RELOAD_START - G.kills * RELOAD_STEP) * 10) / 10);

  function newGame(pool, label, practise) {
    const d = DIFF[diff];
    lastPool = pool; lastLabel = label;
    const field = practise ? clamp(Math.min(d.field, pool.length - 1), 2, d.field) : d.field;
    G = {
      d, pool, label, practise, field,
      goal: d.goal, capsules: 0, slots: [],
      score: 0, combo: 0, best: 0, shots: 0, hits: 0, correct: 0, kills: 0, gears: 0,
      shield: 5, base: 3, shieldBroken: false, baseHurt: false,
      bugs: [], shots_: [], parts: [], smoke: [], floats: [], flyers: [], holes: [],
      tur: { y: 365, a: 0, av: 0, vy: 0, cd: 0, recoil: 0, kick: 0, flash: 0, ready: true },
      lv: { swivel: 0, rail: 0 }, aimT: 0,
      reward: null, rewardT: 8,
      spawnT: 0.5, recent: [],
      target: null, lastTarget: null, orderT: 1.6, orderAnim: 0,
      recovered: {}, review: {}, t: 0, endT: 0, toast: null, shake: 0
    };
  }

  /* ---------- hanzi bugs ---------- */
  function fieldWords() { return G.bugs.filter(b => !b.dead).map(b => b.w); }
  function spawnBug() {
    const fw = fieldWords();
    let cands = G.pool.filter(w => !fw.some(f => conflicts(f, w)));
    const fresh = cands.filter(w => !G.recent.includes(w.hanzi));
    if (fresh.length) cands = fresh;
    if (!cands.length) return false;
    const w = pick(cands);
    G.recent.push(w.hanzi); if (G.recent.length > 3) G.recent.shift();
    let best = 0, by = 365;
    for (let i = 0; i < 8; i++) {
      const y = rand(FIELD_TOP + 50, FIELD_BOT - 40);
      const dmin = Math.min(999, ...G.bugs.filter(b => b.x > 850).map(b => Math.abs(b.y - y)));
      if (dmin > best) { best = dmin; by = y; }
    }
    G.bugs.push(makeBug(w, 1250, by, false));
    return true;
  }
  function makeBug(w, x, y, mini) {
    ctx.font = `${mini ? 36 : 40}px ${HZ}`;
    const tw = ctx.measureText(w.hanzi).width;
    const bw = Math.max(tw + 26, mini ? 64 : 76);
    return {
      w, x, y, ty: y, mini, bw, bh: mini ? 50 : 56,
      v: G.d.speed * (mini ? 1.3 : 1) * rand(0.85, 1.15),
      wander: rand(2, 5), phase: rand(0, 7), flash: 0, knock: 0, dead: false
    };
  }
  function box(b) { return { x0: b.x - b.bw / 2 - 6, x1: b.x + b.bw / 2 + 6, y0: b.y - b.bh / 2 - 14, y1: b.y + b.bh / 2 + 14 }; }

  /* ---------- burrow (reward) bug ---------- */
  function spawnReward() {
    for (let i = 0; i < 25; i++) {
      const life = rand(5, 10), speed = rand(38, 52);
      const x0 = rand(560, 980), y = rand(FIELD_TOP + 45, FIELD_BOT - 45);
      const x1 = Math.max(290, x0 - life * speed);
      const clear = G.bugs.every(b => b.dead || (Math.hypot(b.x - x0, b.y - y) > 120 && Math.hypot(b.x - x1, b.y - y) > 90));
      if (!clear) continue;
      G.reward = { x: x0, y, x0, x1, phase: 'warn', t: 0, life, speed: (x0 - x1) / life, p: 0, dead: false };
      G.holes.push({ x: x0, y: y + 14, t: 0, life: life + 2.5 });
      SFX.dig();
      return true;
    }
    return false;
  }
  function rewardBox(r) { return { x0: r.x - 38, x1: r.x + 38, y0: r.y - 30, y1: r.y + 26 }; }
  function updateReward(dt) {
    const r = G.reward; if (!r) return;
    r.t += dt; r.p += dt * 7;
    if (r.phase === 'warn' && r.t >= 1) { r.phase = 'rise'; r.t = 0; }
    else if (r.phase === 'rise' && r.t >= 0.4) { r.phase = 'out'; r.t = 0; }
    else if (r.phase === 'out') {
      r.x = r.x0 - r.speed * r.t;
      if (r.t >= r.life - 1 && !r.exitHole) { r.exitHole = true; G.holes.push({ x: r.x1, y: r.y + 14, t: 0, life: 2.2 }); }
      if (r.t >= r.life) { r.phase = 'dive'; r.t = 0; SFX.dig(); }
    } else if (r.phase === 'dive' && r.t >= 0.4) { G.reward = null; G.rewardT = rand(20, 25); }
  }
  function collectReward(r) {
    G.reward = null; G.rewardT = rand(20, 25);
    burst(r.x, r.y, '#ffd25a', 30);
    const opts = ['aim'];
    if (G.lv.swivel < MAX_SWIVEL) opts.push('swivel');
    if (G.lv.rail < MAX_RAIL) opts.push('rail');
    if (G.shield < 5) opts.push('shield', 'shield');
    G.flyers.push({ x: r.x, y: r.y - 20, t: 0, kind: 'gear', g: pick(opts) });
    G.gears++;
  }
  function applyGear(k) {
    let text = GEAR[k].name;
    if (k === 'swivel') { G.lv.swivel++; text += ' Lv' + G.lv.swivel; }
    else if (k === 'rail') { G.lv.rail++; text = G.lv.rail === 1 ? 'RAIL UNLOCKED · W/S' : 'RAIL SPEED Lv' + G.lv.rail; }
    else if (k === 'shield') { G.shield = Math.min(5, G.shield + 2); }
    else if (k === 'aim') { G.aimT = AIM_TIME; }
    G.toast = { text: GEAR[k].icon + '  ' + text, col: GEAR[k].col, t: 2 };
    SFX.gear();
  }

  /* ---------- observer ---------- */
  function activeBugs() { return G.bugs.filter(b => !b.dead && b.x < ACTIVE_X); }
  function chooseTarget() {
    const act = activeBugs();
    if (act.length < Math.min(2, G.field)) return;
    let words = [...new Map(act.map(b => [b.w.hanzi, b.w])).values()];
    if (words.length > 1) words = words.filter(w => w.hanzi !== G.lastTarget);
    G.target = pick(words); G.lastTarget = G.target.hanzi;
    G.orderAnim = 1; SFX.order();
  }
  function targetAlive() { return G.target && G.bugs.some(b => !b.dead && b.w.hanzi === G.target.hanzi); }

  /* ---------- turret & shots ---------- */
  const BARREL = 68;
  function muzzle() { const t = G.tur; return { x: TUR_X + Math.cos(t.a) * BARREL, y: t.y + Math.sin(t.a) * BARREL }; }
  function rayBox(ox, oy, dx, dy, bx) {
    let tmin = 0, tmax = 1e9;
    if (Math.abs(dx) < 1e-9) { if (ox < bx.x0 || ox > bx.x1) return null; } else {
      let t1 = (bx.x0 - ox) / dx, t2 = (bx.x1 - ox) / dx; if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    }
    if (Math.abs(dy) < 1e-9) { if (oy < bx.y0 || oy > bx.y1) return null; } else {
      let t1 = (bx.y0 - oy) / dy, t2 = (bx.y1 - oy) / dy; if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    }
    return tmax >= tmin ? tmin : null;
  }
  function raycast(ox, oy, dx, dy, maxT) {
    let hit = null, ht = maxT;
    G.bugs.forEach(b => {
      if (b.dead || b.x > ACTIVE_X + 15) return;
      const t = rayBox(ox, oy, dx, dy, box(b));
      if (t !== null && t < ht) { ht = t; hit = b; }
    });
    const r = G.reward;
    if (r && r.phase === 'out') {
      const t = rayBox(ox, oy, dx, dy, rewardBox(r));
      if (t !== null && t < ht) { ht = t; hit = r; }
    }
    return { hit, t: ht };
  }
  function fire() {
    const T = G.tur;
    if (T.cd > 0 || state !== 'play') return;
    const m = muzzle(), dx = Math.cos(T.a), dy = Math.sin(T.a);
    G.shots_.push({ x: m.x, y: m.y, dx, dy, life: 1.2 });
    T.cd = reloadTime(); T.ready = false;
    T.recoil = 1; T.kick = 1; T.flash = 0.09;
    // smoke puffs & bubbles near muzzle
    for (let i = 0; i < 9; i++) {
      const sp = rand(20, 70), a = T.a + rand(-0.9, 0.9);
      G.smoke.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp - 15, vy: Math.sin(a) * sp - rand(5, 25), r: rand(7, 15), grow: rand(10, 22), life: rand(0.8, 1.4), max: 1.4, bubble: false });
    }
    for (let i = 0; i < 6; i++) {
      G.smoke.push({ x: m.x + rand(-8, 8), y: m.y + rand(-8, 8), vx: rand(-25, 25), vy: rand(-45, -15), r: rand(2.5, 5), grow: 0, life: rand(0.8, 1.5), max: 1.5, bubble: true });
    }
    // side vents
    for (const s of [-1, 1]) G.smoke.push({ x: TUR_X - Math.cos(T.a) * 18, y: T.y + s * 20, vx: -30, vy: s * 25, r: 6, grow: 14, life: 0.7, max: 0.9, bubble: false });
    G.shots++; SFX.fire();
  }

  /* ---------- hit resolution ---------- */
  function burst(x, y, col, n) {
    for (let i = 0; i < n; i++) { const a = rand(0, 7), s = rand(60, 260); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.9), col, r: rand(2, 5) }); }
  }
  function floatText(x, y, lines, col, life = 1.6) { G.floats.push({ x, y, lines, col, life, max: life }); }

  function onHit(b) {
    if (b === G.reward) return collectReward(b);
    G.hits++;
    const ok = G.target && b.w.hanzi === G.target.hanzi;
    if (ok) {
      G.correct++; b.dead = true; G.kills++;
      G.combo++; G.best = Math.max(G.best, G.combo);
      burst(b.x, b.y, '#5ff0ff', 26); SFX.good();
      if (!b.mini) {
        G.capsules++;
        G.score += 100 + (G.combo - 1) * 10;
        G.recovered[b.w.hanzi] = G.recovered[b.w.hanzi] || { w: b.w, n: 0 };
        G.recovered[b.w.hanzi].n++;
        floatText(b.x, b.y - 30, [b.w.hanzi, b.w.pinyin, b.w.english], '#ffc24a');
        G.flyers.push({ x: b.x, y: b.y, slot: G.capsules - 1, t: 0, w: b.w, kind: 'cap' });
      } else {
        G.score += 30;
        floatText(b.x, b.y - 30, ['+30', 'swarm cleared'], '#5ff0ff', 1.1);
      }
      G.reloadPing = 1.2;
      G.target = null;
      if (G.capsules >= G.goal) return winGame();
      G.orderT = 0.75;
    } else {
      G.combo = 0;
      if (G.target) G.review[G.target.hanzi] = G.target;
      SFX.bad();
      floatText(b.x, b.y - 46, ['✕ ' + b.w.hanzi + ' = ' + b.w.english], '#ff8a8a', 1.8);
      if (!b.mini) {
        const alive = G.bugs.filter(x => !x.dead).length;
        if (alive + 1 > MAX_BUGS) { damage(b.x, b.y, true); b.knock = 1; }
        else {
          b.dead = true; SFX.split(); burst(b.x, b.y, '#b59cff', 18);
          const m1 = makeBug(b.w, b.x + 12, clamp(b.y - 48, FIELD_TOP + 40, FIELD_BOT - 40), true);
          const m2 = makeBug(b.w, b.x + 12, clamp(b.y + 48, FIELD_TOP + 40, FIELD_BOT - 40), true);
          m1.flash = m2.flash = 0.5; G.bugs.push(m1, m2);
        }
      } else { b.knock = 1; b.flash = 0.4; }
    }
  }
  function damage(x, y, fromPenalty) {
    if (G.shield > 0) {
      G.shield--; if (G.shield === 0) G.shieldBroken = true;
      G.shake = 0.3; SFX.hitShield(); burst(fromPenalty ? x : SHIELD_X, y, '#8fdcff', 16);
    } else {
      G.base--; G.baseHurt = true; G.shake = 0.5; SFX.hitShield(); burst(BASE_X, y, '#ff9d6a', 24);
      if (G.base <= 0) loseGame();
    }
  }

  /* ---------- end ---------- */
  function winGame() { state = 'won'; G.endT = 2.2; SFX.win(); G.target = null; }
  function loseGame() { state = 'lost'; G.endT = 2.2; SFX.lose(); G.target = null; }
  function showResults(win) {
    state = 'results';
    const acc = G.hits ? G.correct / G.hits : 0;
    let stars = 0;
    if (win) stars = (!G.shieldBroken && acc >= 0.8) ? 3 : (!G.baseHurt ? 2 : 1);
    $('resTitle').textContent = win ? 'CAPSULES RECOVERED' : 'BASE LOST';
    $('resTitle').className = 'res-title ' + (win ? 'win' : 'lose');
    $('resStars').innerHTML = [0, 1, 2].map(i => `<span class="${i < stars ? '' : 'off'}">★</span>`).join('');
    $('resStats').innerHTML = `<div>Capsules <b>${G.capsules}/${G.goal}</b></div><div>Accuracy <b>${Math.round(acc * 100)}%</b></div><div>Best combo <b>${G.best}</b></div><div>Final reload <b>${reloadTime().toFixed(1)}s</b></div><div>Gear <b>${G.gears}</b></div><div>Score <b>${G.score}</b></div>`;
    const wg = $('wallGood'), wr = $('wallReview');
    wg.innerHTML = ''; wr.innerHTML = '';
    const rec = Object.values(G.recovered);
    if (!rec.length) wg.innerHTML = '<span class="empty">No capsules recovered this time.</span>';
    rec.forEach(r => wg.appendChild(capEl(r.w, r.n, false)));
    const rv = Object.values(G.review);
    if (!rv.length) wr.innerHTML = '<span class="empty">Perfect — nothing to review!</span>';
    rv.forEach(w => wr.appendChild(capEl(w, 0, true)));
    $('detail').innerHTML = 'Click a capsule to review it.';
    $('btnPractise').disabled = rv.length === 0;
    $('results').classList.remove('hidden');
  }
  function capEl(w, n, rv) {
    const e = document.createElement('button'); e.type = 'button';
    e.className = 'cap' + (rv ? ' rv' : '');
    e.textContent = w.hanzi;
    if (n > 1) { const s = document.createElement('span'); s.className = 'n'; s.textContent = '×' + n; e.appendChild(s); }
    e.addEventListener('click', () => {
      $('detail').innerHTML = '';
      [['h', w.hanzi], ['p', w.pinyin], ['', w.english]].forEach(([c, t]) => { const s = document.createElement('span'); s.className = c; s.textContent = t; $('detail').appendChild(s); });
    });
    return e;
  }

  /* ---------- flow ---------- */
  function start(pool, label, practise) {
    ac(); playMusic();
    newGame(pool, label, practise);
    ['menu', 'results', 'pause'].forEach(s => $(s).classList.add('hidden'));
    $('briefText').textContent = `Recover ${G.goal} Hanzi Capsules`;
    $('brief').classList.remove('hidden');
    state = 'brief';
    setTimeout(() => { if (state === 'brief') { $('brief').classList.add('hidden'); state = 'play'; } }, 3400);
  }
  $('btnStart').addEventListener('click', () => {
    const pool = buildPool(chosenLists());
    if (pool.length < 4) return;
    const y = years[selYear.value], t = curTopic();
    start(pool, `${y.name} · ${t.name}`, false);
  });
  $('btnAgain').addEventListener('click', () => start(lastPool, lastLabel, false));
  $('btnPractise').addEventListener('click', () => {
    let pool = Object.values(G.review);
    if (pool.length < 3) {
      const extra = shuffle(lastPool.filter(w => !pool.some(p => conflicts(p, w))));
      for (const w of extra) { if (pool.length >= 3) break; if (!pool.some(p => conflicts(p, w))) pool.push(w); }
    }
    const keep = lastPool;
    start(pool, 'Review Practice', true); lastPool = keep;
  });
  $('btnMenu').addEventListener('click', toMenu);
  $('btnQuit').addEventListener('click', toMenu);
  $('btnResume').addEventListener('click', togglePause);
  function toMenu() { state = 'menu'; G = null; ['results', 'pause', 'brief'].forEach(s => $(s).classList.add('hidden')); $('menu').classList.remove('hidden'); }
  function togglePause() {
    if (state === 'play') { state = 'paused'; $('pause').classList.remove('hidden'); }
    else if (state === 'paused') { state = 'play'; $('pause').classList.add('hidden'); }
  }

  /* ---------- input ---------- */
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', ' '].includes(k) && state !== 'menu') e.preventDefault();
    if (k === 'p' || k === 'escape') { if (state === 'play' || state === 'paused') togglePause(); return; }
    keys[k] = true;
    if (k === 'f' && !e.repeat && state === 'play') fire();
  });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state === 'play') togglePause(); });

  /* ---------- update ---------- */
  function inertia(v, dir, acc, max, dt) {
    if (dir) { v += dir * acc * dt; return clamp(v, -max, max); }
    const dec = acc * 1.4 * dt;
    return Math.abs(v) <= dec ? 0 : v - Math.sign(v) * dec;
  }
  function update(dt) {
    G.t += dt;
    const T = G.tur;
    if (state === 'play') {
      // barrel rotation with inertia (slow at start)
      const lv = G.lv.swivel;
      const maxW = 0.42 + lv * 0.22, accW = 1.1 + lv * 0.7;
      const dirA = (keys['arrowdown'] ? 1 : 0) - (keys['arrowup'] ? 1 : 0);
      T.av = inertia(T.av, dirA, accW, maxW, dt);
      T.a += T.av * dt;
      if (T.a < -1.05 || T.a > 1.05) { T.a = clamp(T.a, -1.05, 1.05); T.av = 0; }
      // rail movement with inertia
      if (G.lv.rail > 0) {
        const rl = G.lv.rail - 1;
        const maxV = 70 + rl * 45, accV = 150 + rl * 90;
        const dirY = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
        T.vy = inertia(T.vy, dirY, accV, maxV, dt);
        T.y += T.vy * dt;
        if (T.y < FIELD_TOP + 30 || T.y > FIELD_BOT - 30) { T.y = clamp(T.y, FIELD_TOP + 30, FIELD_BOT - 30); T.vy = 0; }
      }
      if (T.cd > 0) {
        T.cd = Math.max(0, T.cd - dt);
        if (T.cd === 0 && !T.ready) { T.ready = true; SFX.ready(); }
        if (Math.random() < dt * 4) { const m = muzzle(); G.smoke.push({ x: m.x, y: m.y, vx: rand(-8, 8), vy: rand(-30, -15), r: rand(3, 5), grow: 8, life: 0.9, max: 1, bubble: false }); }
      }
      G.aimT = Math.max(0, G.aimT - dt);

      // spawn hanzi bugs
      G.spawnT -= dt;
      const alive = G.bugs.filter(b => !b.dead);
      if (G.spawnT <= 0 && alive.filter(b => !b.mini).length < G.field && alive.length < MAX_BUGS) {
        spawnBug(); G.spawnT = rand(0.4, 1.4);
      }
      // reward bug
      if (!G.reward) { G.rewardT -= dt; if (G.rewardT <= 0 && !spawnReward()) G.rewardT = 1.5; }
      updateReward(dt);

      if (G.target && !targetAlive()) { G.target = null; G.orderT = 0.6; }
      if (!G.target) { G.orderT -= dt; if (G.orderT <= 0) chooseTarget(); }
    }
    T.recoil = Math.max(0, T.recoil - dt * 4);
    T.kick = Math.max(0, T.kick - dt * 6);
    T.flash = Math.max(0, T.flash - dt);
    G.orderAnim = Math.max(0, G.orderAnim - dt * 2);
    if (G.reloadPing) G.reloadPing = Math.max(0, G.reloadPing - dt);

    G.bugs.forEach(b => {
      if (b.dead) return;
      b.phase += dt * 6; b.flash = Math.max(0, b.flash - dt); b.knock = Math.max(0, b.knock - dt * 3);
      if (state === 'won') { b.x += 420 * dt; return; }
      if (state !== 'play') return;
      b.x -= b.v * dt * (b.knock > 0 ? -1.5 : 1);
      b.x = Math.min(b.x, 1260);
      if (b.x < ACTIVE_X) {
        b.wander -= dt;
        if (b.wander <= 0) { b.ty = clamp(b.y + rand(-110, 110), FIELD_TOP + 40, FIELD_BOT - 40); b.wander = rand(2.5, 5.5); }
      }
      b.y += (b.ty - b.y) * Math.min(1, dt * 0.8);
      const limit = G.shield > 0 ? SHIELD_X + 14 : BASE_X + 8;
      if (b.x - b.bw / 2 <= limit) { b.dead = true; burst(b.x - b.bw / 2, b.y, '#b59cff', 14); damage(b.x, b.y, false); }
    });
    const al = G.bugs.filter(b => !b.dead);
    for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) {
      const a = al[i], c = al[j];
      const ox = (a.bw + c.bw) / 2 + 14 - Math.abs(a.x - c.x), oy = 84 - Math.abs(a.y - c.y);
      if (ox > 0 && oy > 0) {
        const s = a.y < c.y ? -1 : 1, push = Math.min(oy, 60) * dt * 3;
        a.y = clamp(a.y + s * push, FIELD_TOP + 30, FIELD_BOT - 30); c.y = clamp(c.y - s * push, FIELD_TOP + 30, FIELD_BOT - 30);
        a.ty = a.y; c.ty = c.y;
      }
    }
    G.bugs = G.bugs.filter(b => !b.dead && b.x < 1400);

    G.shots_.forEach(s => {
      const step = 1500 * dt;
      if (state === 'play') {
        const r = raycast(s.x, s.y, s.dx, s.dy, step);
        if (r.hit) { s.life = 0; burst(s.x + s.dx * r.t, s.y + s.dy * r.t, '#ffffff', 6); onHit(r.hit); return; }
      }
      s.x += s.dx * step; s.y += s.dy * step; s.life -= dt;
      if (s.x > W || s.y < FIELD_TOP - 30 || s.y > FIELD_BOT + 30) s.life = 0;
    });
    G.shots_ = G.shots_.filter(s => s.life > 0);

    G.aimEnd = null;
    if (state === 'play' && G.aimT > 0) {
      const m = muzzle(); const r = raycast(m.x, m.y, Math.cos(T.a), Math.sin(T.a), 1300);
      G.aimEnd = { x: m.x + Math.cos(T.a) * r.t, y: m.y + Math.sin(T.a) * r.t };
    }

    G.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94; p.life -= dt; });
    G.parts = G.parts.filter(p => p.life > 0);
    G.smoke.forEach(s => {
      s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.95; s.r += s.grow * dt; s.life -= dt;
      if (s.bubble) s.x += Math.sin(G.t * 8 + s.r * 3) * 0.6;
      if (s.x > 270) s.life = Math.min(s.life, 0.2);
    });
    G.smoke = G.smoke.filter(s => s.life > 0);
    G.holes.forEach(h => h.t += dt);
    G.holes = G.holes.filter(h => h.t < h.life);
    G.floats.forEach(f => { f.life -= dt; f.y -= 14 * dt; });
    G.floats = G.floats.filter(f => f.life > 0);
    G.flyers.forEach(f => {
      f.t += dt;
      const tgt = f.kind === 'cap' ? slotPos(f.slot) : { x: TUR_X, y: T.y };
      if (f.t > 0.7) { const k = Math.min(1, dt * 5); f.x += (tgt.x - f.x) * k; f.y += (tgt.y - f.y) * k; }
      else f.y -= 20 * dt;
      if (f.t > 0.7 && Math.hypot(tgt.x - f.x, tgt.y - f.y) < 8) {
        f.done = true;
        if (f.kind === 'cap') G.slots[f.slot] = f.w; else applyGear(f.g);
      }
    });
    G.flyers = G.flyers.filter(f => !f.done);
    if (G.toast) { G.toast.t -= dt; if (G.toast.t <= 0) G.toast = null; }
    if (G.shake) G.shake = Math.max(0, G.shake - dt);

    if (state === 'won' || state === 'lost') {
      G.endT -= dt;
      if (G.endT <= 0) showResults(state === 'won');
    }
  }
  function slotPos(i) {
    const n = G.goal, gap = Math.min(34, 560 / n), x0 = 640 - (n - 1) * gap / 2;
    return { x: x0 + i * gap, y: 672 };
  }

  /* ---------- draw ---------- */
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function fitFont(text, max, size, family, weight = '700') {
    let s = size; ctx.font = `${weight} ${s}px ${family}`;
    while (ctx.measureText(text).width > max && s > 14) { s -= 1; ctx.font = `${weight} ${s}px ${family}`; }
    return s;
  }

  function drawBug(b) {
    const t = b.phase, s = b.mini ? 0.78 : 1;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.strokeStyle = '#5b4a7a'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const sw = Math.sin(t + i * 2) * 6 * s;
      ctx.beginPath(); ctx.moveTo(i * 22 * s, 14 * s); ctx.lineTo(i * 22 * s + sw - 6, 34 * s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * 22 * s, -18 * s); ctx.lineTo(i * 22 * s - sw - 6, -36 * s); ctx.stroke();
    }
    const bodyW = Math.max(b.bw / 2 + 10, 50 * s);
    const g = ctx.createLinearGradient(0, -30 * s, 0, 30 * s);
    g.addColorStop(0, '#8a78b8'); g.addColorStop(1, '#4a3c6e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, bodyW, 30 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b5a96'; ctx.beginPath(); ctx.ellipse(-bodyW - 6 * s, 0, 16 * s, 14 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e6dcff'; ctx.beginPath(); ctx.arc(-bodyW - 12 * s, -5 * s, 3.5 * s, 0, 7); ctx.arc(-bodyW - 12 * s, 5 * s, 3.5 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#8a78b8'; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.moveTo(-bodyW - 14 * s, -10 * s); ctx.quadraticCurveTo(-bodyW - 28 * s, -24 * s, -bodyW - 22 * s, -32 * s + Math.sin(t) * 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-bodyW - 14 * s, 10 * s); ctx.quadraticCurveTo(-bodyW - 28 * s, 24 * s, -bodyW - 22 * s, 32 * s - Math.sin(t) * 3); ctx.stroke();
    const bw = b.bw, bh = b.bh;
    rr(-bw / 2, -bh / 2, bw, bh, 10);
    ctx.fillStyle = 'rgba(6,10,26,0.93)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(170,150,230,0.7)'; ctx.stroke();
    if (b.flash > 0) { ctx.fillStyle = `rgba(255,120,120,${b.flash})`; ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${b.mini ? 36 : 40}px ${HZ}`;
    ctx.fillText(b.w.hanzi, 0, 2);
    ctx.restore();
  }

  function drawHoles() {
    G.holes.forEach(h => {
      const open = Math.min(1, h.t / 0.6), close = Math.min(1, (h.life - h.t) / 0.6);
      const k = Math.min(open, close);
      ctx.save(); ctx.translate(h.x, h.y);
      // cracks
      ctx.strokeStyle = `rgba(255,200,90,${0.5 * k})`; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + 0.3, l = 30 + (i % 2) * 14;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18 * k, Math.sin(a) * 8 * k); ctx.lineTo(Math.cos(a) * l * k, Math.sin(a) * l * 0.4 * k); ctx.stroke();
      }
      ctx.fillStyle = `rgba(40,25,10,${0.9 * k})`;
      ctx.beginPath(); ctx.ellipse(0, 0, 34 * k, 12 * k, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(150,100,50,${k})`; ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
    });
  }

  function drawReward() {
    const r = G.reward; if (!r || r.phase === 'warn') return;
    let rise = 1;
    if (r.phase === 'rise') rise = r.t / 0.4;
    if (r.phase === 'dive') rise = 1 - r.t / 0.4;
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x - 80, r.y - 80, 160, 94); ctx.clip();
    ctx.translate(r.x, r.y + (1 - rise) * 60);
    const t = r.p;
    ctx.strokeStyle = '#8a6a20'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const sw = Math.sin(t + i * 2) * 5;
      ctx.beginPath(); ctx.moveTo(i * 14, 6); ctx.lineTo(i * 14 + sw - 4, 20); ctx.stroke();
    }
    const g = ctx.createLinearGradient(0, -24, 0, 14);
    g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#c78a1e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 32, 18, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff2c2'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#d9a33a'; ctx.beginPath(); ctx.ellipse(-34, 2, 11, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2400'; ctx.beginPath(); ctx.arc(-38, -1, 2.5, 0, 7); ctx.arc(-38, 5, 2.5, 0, 7); ctx.fill();
    // carried capsule
    const gl = 0.6 + Math.sin(G.t * 6) * 0.3;
    ctx.shadowColor = '#7dffb0'; ctx.shadowBlur = 16 * gl;
    const cg = ctx.createLinearGradient(0, -40, 0, -14);
    cg.addColorStop(0, '#e9fff2'); cg.addColorStop(1, '#3ddc84');
    ctx.fillStyle = cg; rr(-16, -40, 32, 22, 11); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0b3b22'; ctx.font = `800 15px ${EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, -29);
    ctx.restore();
    // time bar
    if (r.phase === 'out') {
      const left = 1 - r.t / r.life;
      rr(r.x - 26, r.y + 22, 52, 5, 3); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      rr(r.x - 26, r.y + 22, 52 * left, 5, 3); ctx.fillStyle = left < 0.3 ? '#ff8a8a' : '#7dffb0'; ctx.fill();
    }
  }

  function drawTurret() {
    const T = G.tur, kick = T.kick * 5;
    ctx.fillStyle = G.lv.rail ? '#1f4f7a' : '#16304f';
    rr(TUR_X - 8, FIELD_TOP + 6, 16, FIELD_BOT - FIELD_TOP - 12, 8); ctx.fill();
    if (G.lv.rail) { ctx.strokeStyle = '#5ff0ff88'; ctx.lineWidth = 2; ctx.stroke(); }
    if (G.aimEnd) {
      const m = muzzle();
      ctx.save(); ctx.setLineDash([8, 10]); ctx.lineDashOffset = -G.t * 40;
      ctx.strokeStyle = `rgba(255,157,240,${G.aimT < 3 ? 0.25 + 0.25 * Math.sin(G.t * 12) : 0.5})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(G.aimEnd.x, G.aimEnd.y); ctx.stroke(); ctx.restore();
    }
    ctx.save();
    ctx.translate(TUR_X - Math.cos(T.a) * kick, T.y - Math.sin(T.a) * kick);
    // barrel
    ctx.save(); ctx.rotate(T.a);
    const rc = T.recoil * T.recoil * 16;
    ctx.fillStyle = '#2a6fa8'; rr(8 - rc * 0.4, -12, 26, 24, 6); ctx.fill();
    const bg2 = ctx.createLinearGradient(0, -8, 0, 8);
    bg2.addColorStop(0, '#d9f6ff'); bg2.addColorStop(0.5, '#9fdcff'); bg2.addColorStop(1, '#4a8fc4');
    ctx.fillStyle = bg2; rr(14 - rc, -7, BARREL - 14, 14, 4); ctx.fill();
    ctx.fillStyle = '#1d4f80';
    for (let i = 0; i < 3; i++) ctx.fillRect(28 - rc + i * 10, -7, 3, 14);
    ctx.fillStyle = '#5ff0ff'; rr(BARREL - 8 - rc, -10, 12, 20, 3); ctx.fill();
    // charge glow while reloading
    if (T.cd > 0) {
      const p = 1 - T.cd / reloadTime();
      ctx.fillStyle = `rgba(255,194,74,${0.25 + 0.5 * p})`; ctx.fillRect(16 - rc, -3, (BARREL - 26) * p, 6);
    }
    if (T.flash > 0) {
      ctx.globalAlpha = T.flash / 0.09;
      const fg = ctx.createRadialGradient(BARREL + 10, 0, 2, BARREL + 10, 0, 34);
      fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.4, '#9ff6ff'); fg.addColorStop(1, 'rgba(95,240,255,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(BARREL + 10, 0, 34, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    // dome
    const g = ctx.createRadialGradient(-6, -6, 4, 0, 0, 30);
    g.addColorStop(0, '#d9f6ff'); g.addColorStop(1, '#2a6fa8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5ff0ff'; ctx.lineWidth = 2; ctx.stroke();
    const rt = reloadTime();
    if (T.cd > 0) { ctx.strokeStyle = '#ffc24a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - T.cd / rt)); ctx.stroke(); }
    else { ctx.strokeStyle = `rgba(95,240,255,${0.5 + 0.3 * Math.sin(G.t * 6)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.stroke(); }
    ctx.restore();
  }

  function drawSmoke() {
    G.smoke.forEach(s => {
      const a = Math.max(0, s.life / s.max);
      if (s.bubble) {
        ctx.strokeStyle = `rgba(190,245,255,${0.7 * a})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.6 * a})`; ctx.beginPath(); ctx.arc(s.x - s.r * 0.35, s.y - s.r * 0.35, s.r * 0.25, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(170,190,215,${0.28 * a})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      }
    });
  }

  function drawShield() {
    if (G.shield <= 0) return;
    const a = 0.15 + G.shield * 0.08 + Math.sin(G.t * 3) * 0.04;
    const g = ctx.createLinearGradient(SHIELD_X - 14, 0, SHIELD_X + 14, 0);
    g.addColorStop(0, 'rgba(95,240,255,0)'); g.addColorStop(0.5, `rgba(95,240,255,${a})`); g.addColorStop(1, 'rgba(95,240,255,0)');
    ctx.fillStyle = g; ctx.fillRect(SHIELD_X - 14, FIELD_TOP - 6, 28, FIELD_BOT - FIELD_TOP + 12);
    ctx.strokeStyle = `rgba(150,245,255,${a + 0.2})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(SHIELD_X, FIELD_TOP - 6); ctx.lineTo(SHIELD_X, FIELD_BOT + 6); ctx.stroke();
  }

  function drawCaveFog() {
    for (let i = 0; i < 5; i++) {
      const y = 365 + Math.sin(G.t * 0.7 + i * 1.3) * 120;
      const g = ctx.createRadialGradient(1215, y, 10, 1215, y, 140);
      g.addColorStop(0, 'rgba(120,70,190,0.45)'); g.addColorStop(1, 'rgba(60,30,110,0)');
      ctx.fillStyle = g; ctx.fillRect(1080, y - 140, 200, 280);
    }
    ctx.fillStyle = 'rgba(10,6,26,0.82)';
    ctx.beginPath(); ctx.ellipse(1215, 365, 80, 255, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(181,156,255,${0.35 + Math.sin(G.t * 2) * 0.15})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(1205, 365, 92, 262, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
  }

  function gearChip(x, label, val, col, on) {
    rr(x, 18, 92, 50, 10); ctx.fillStyle = on ? '#123a5c' : '#0a1a33'; ctx.fill();
    ctx.strokeStyle = on ? col : '#22385a'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `700 11px ${EN}`; ctx.fillStyle = on ? col : '#34507a'; ctx.fillText(label, x + 10, 31);
    ctx.font = `700 19px ${EN}`; ctx.fillStyle = on ? '#fff' : '#34507a'; ctx.fillText(val, x + 10, 53);
  }

  function drawHUD() {
    ctx.fillStyle = 'rgba(5,12,32,0.85)'; ctx.fillRect(0, 0, W, 88);
    ctx.fillStyle = 'rgba(95,240,255,0.25)'; ctx.fillRect(0, 88, W, 2);
    const ox = 56, oy = 44 + Math.sin(G.t * 2) * 3;
    ctx.fillStyle = '#1d3d6b'; ctx.beginPath(); ctx.ellipse(ox, oy, 34, 20, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5ff0ff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#5ff0ff'; ctx.fillRect(ox - 44, oy - 3, 10, 6); ctx.fillRect(ox + 34, oy - 3, 10, 6);
    const eye = ctx.createRadialGradient(ox, oy, 2, ox, oy, 12);
    eye.addColorStop(0, '#ffffff'); eye.addColorStop(1, G.target ? '#5ff0ff' : '#2a6fa8');
    ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(ox, oy, 11, 0, 7); ctx.fill();
    if (!G.target && state === 'play') { ctx.strokeStyle = 'rgba(95,240,255,0.6)'; ctx.beginPath(); ctx.arc(ox, oy, 16 + (G.t * 30 % 14), 0, 7); ctx.stroke(); }
    const cx = 110, cw = 500;
    rr(cx, 10, cw, 68, 12); ctx.fillStyle = '#0c2347'; ctx.fill();
    ctx.lineWidth = 2 + G.orderAnim * 3; ctx.strokeStyle = G.target ? '#5ff0ff' : '#2a4a74'; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `700 12px ${EN}`; ctx.fillStyle = '#7fd8ff';
    ctx.fillText(G.target ? 'OBSERVER · LOCK TARGET' : 'OBSERVER · SCANNING…', cx + 16, 24);
    if (G.target) {
      fitFont(G.target.english, cw - 32, 32, EN, '700');
      ctx.fillStyle = '#ffffff'; ctx.fillText(G.target.english, cx + 16, 53);
    } else {
      ctx.font = `700 26px ${EN}`; ctx.fillStyle = '#3d5d88'; ctx.fillText('· · ·', cx + 16, 53);
    }
    // gear & reload panel
    const rt = reloadTime();
    let gx = 628;
    const ping = G.reloadPing > 0;
    rr(gx, 18, 104, 50, 10); ctx.fillStyle = ping ? '#3a2c0a' : '#123a5c'; ctx.fill();
    ctx.strokeStyle = '#ffc24a'; ctx.lineWidth = ping ? 3 : 1.5; ctx.stroke();
    ctx.textAlign = 'left'; ctx.font = `700 11px ${EN}`; ctx.fillStyle = '#ffc24a'; ctx.fillText(rt <= RELOAD_MIN ? 'RELOAD · MAX' : 'RELOAD', gx + 10, 31);
    ctx.font = `700 21px ${EN}`; ctx.fillStyle = '#fff'; ctx.fillText(rt.toFixed(1) + 's', gx + 10, 53);
    gx += 114;
    gearChip(gx, '↻ BARREL', 'Lv' + G.lv.swivel, GEAR.swivel.col, G.lv.swivel > 0); gx += 100;
    gearChip(gx, '⇕ RAIL', G.lv.rail ? 'Lv' + G.lv.rail : 'LOCK', GEAR.rail.col, G.lv.rail > 0); gx += 100;
    gearChip(gx, '⌖ AIM', G.aimT > 0 ? Math.ceil(G.aimT) + 's' : 'OFF', GEAR.aim.col, G.aimT > 0);
    ctx.textAlign = 'right';
    ctx.font = `700 12px ${EN}`; ctx.fillStyle = '#7fd8ff'; ctx.fillText('SCORE', 1265, 24);
    ctx.font = `700 28px ${EN}`; ctx.fillStyle = '#fff'; ctx.fillText(G.score, 1265, 54);
    ctx.font = `700 12px ${EN}`; ctx.fillStyle = '#7fd8ff'; ctx.fillText('COMBO', 1160, 24);
    ctx.font = `700 28px ${EN}`; ctx.fillStyle = G.combo >= 5 ? '#ffc24a' : '#fff'; ctx.fillText('×' + G.combo, 1160, 54);
    ctx.textAlign = 'left'; ctx.font = `600 12px ${EN}`; ctx.fillStyle = '#7f93b5'; ctx.fillText(G.label + ' · ' + G.d.label, 628, 80);

    ctx.fillStyle = 'rgba(5,12,32,0.88)'; ctx.fillRect(0, 640, W, 80);
    ctx.fillStyle = 'rgba(95,240,255,0.25)'; ctx.fillRect(0, 640, W, 2);
    ctx.textAlign = 'left'; ctx.font = `700 12px ${EN}`; ctx.fillStyle = '#7fd8ff';
    ctx.fillText('SHIELD', 20, 660); ctx.fillText('BASE', 220, 660);
    for (let i = 0; i < 5; i++) { rr(20 + i * 34, 670, 28, 24, 5); ctx.fillStyle = i < G.shield ? '#5ff0ff' : '#14284a'; ctx.fill(); }
    for (let i = 0; i < 3; i++) { rr(220 + i * 34, 670, 28, 24, 5); ctx.fillStyle = i < G.base ? '#ff9d6a' : '#2a1a1a'; ctx.fill(); }
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffc24a';
    ctx.fillText(`HANZI CAPSULES  ${G.capsules} / ${G.goal}`, 640, 652);
    for (let i = 0; i < G.goal; i++) {
      const p = slotPos(i);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 11, 15, 0, 0, 7);
      if (G.slots[i]) { ctx.fillStyle = '#ffb52e'; ctx.fill(); ctx.strokeStyle = '#ffe7a8'; }
      else { ctx.fillStyle = '#101d38'; ctx.fill(); ctx.strokeStyle = '#3a4a6a'; }
      ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.textAlign = 'right'; ctx.font = `600 12px ${EN}`; ctx.fillStyle = '#5f7396';
    ctx.fillText('↑↓ aim · F fire · P pause', 1120, 700);
  }

  function drawCapsuleIcon(x, y) {
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 30);
    g.addColorStop(0, '#fff3cf'); g.addColorStop(1, '#ff9d00');
    ctx.fillStyle = g; ctx.shadowColor = '#ffb52e'; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 28, 0, 0, 7); ctx.fill();
    ctx.restore();
  }

  function draw() {
    ctx.save();
    if (G && G.shake) ctx.translate(rand(-6, 6) * G.shake, rand(-6, 6) * G.shake);
    ctx.drawImage(bg, 0, 0);
    if (!G) { ctx.restore(); return; }
    drawShield();
    drawHoles();
    drawReward();
    G.bugs.forEach(drawBug);
    drawCaveFog();
    drawTurret();
    drawSmoke();
    G.shots_.forEach(s => {
      ctx.strokeStyle = '#bff8ff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.shadowColor = '#5ff0ff'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(s.x - s.dx * 34, s.y - s.dy * 34); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.shadowBlur = 0;
    });
    G.parts.forEach(p => { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    G.flyers.forEach(f => {
      if (f.kind === 'cap') drawCapsuleIcon(f.x, f.y);
      else {
        const B = GEAR[f.g];
        ctx.save(); ctx.shadowColor = B.col; ctx.shadowBlur = 16; ctx.fillStyle = '#0c2347';
        ctx.beginPath(); ctx.arc(f.x, f.y, 20, 0, 7); ctx.fill(); ctx.strokeStyle = B.col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        ctx.fillStyle = B.col; ctx.font = `700 20px ${EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(B.icon, f.x, f.y + 1);
      }
    });
    G.floats.forEach(f => {
      ctx.globalAlpha = Math.min(1, f.life / (f.max * 0.4));
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const sizes = f.lines.length === 3 ? [34, 18, 17] : [20, 15];
      const fams = f.lines.length === 3 ? [HZ, EN, EN] : [HZ, EN];
      const widths = f.lines.map((l, i) => { ctx.font = `700 ${sizes[i]}px ${fams[i]}`; return ctx.measureText(l).width; });
      const bw = Math.max(...widths) + 28, bh = f.lines.reduce((a, l, i) => a + sizes[i] + 6, 14);
      const x = clamp(f.x, bw / 2 + 200, CAVE_X - bw / 2), y0 = clamp(f.y - bh, FIELD_TOP, FIELD_BOT - bh);
      rr(x - bw / 2, y0, bw, bh, 10); ctx.fillStyle = 'rgba(6,12,30,0.9)'; ctx.fill(); ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.stroke();
      let yy = y0 + 10;
      f.lines.forEach((l, i) => { ctx.font = `${i === 0 && f.lines.length === 3 ? 400 : 700} ${sizes[i]}px ${fams[i]}`; ctx.fillStyle = i === 0 ? f.col : '#e6f4ff'; yy += sizes[i] / 2 + 3; ctx.fillText(l, x, yy); yy += sizes[i] / 2 + 3; });
      ctx.globalAlpha = 1;
    });
    drawHUD();
    if (G.toast) {
      ctx.globalAlpha = Math.min(1, G.toast.t);
      ctx.font = `800 28px ${EN}`; ctx.textAlign = 'center';
      const tw = ctx.measureText(G.toast.text).width + 50;
      rr(640 - tw / 2, 110, tw, 50, 14); ctx.fillStyle = 'rgba(6,14,36,0.92)'; ctx.fill(); ctx.strokeStyle = G.toast.col; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = G.toast.col; ctx.textBaseline = 'middle'; ctx.fillText(G.toast.text, 640, 136);
      ctx.globalAlpha = 1;
    }
    if (state === 'won' || state === 'lost') {
      ctx.font = `800 64px ${EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = state === 'won' ? '#5ff0ff' : '#ff8a8a';
      ctx.fillText(state === 'won' ? 'SECTOR SECURED' : 'BASE BREACHED', 640, 360);
    }
    ctx.restore();
  }

  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (G && (state === 'play' || state === 'won' || state === 'lost')) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
