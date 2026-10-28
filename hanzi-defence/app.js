/* Hanzi Defence V1.3 */
(function () {
  'use strict';
  const W = 1280, H = 720;
  const FIELD_TOP = 112, FIELD_BOT = 618;
  const SHIELD_X = 182, BASE_X = 78, CAVE_X = 1130, ACTIVE_X = 1045, TUR_X = 120;
  const ALERT_X = SHIELD_X + 250;
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
    swivel: { name: 'AGILE BARREL', icon: '↻', col: '#7dffb0', dark: '#2fae68' },
    rail: { name: 'RAIL MODULE', icon: '⇕', col: '#5ff0ff', dark: '#1f9cc0' },
    shield: { name: 'SHIELD REPAIR', icon: '+', col: '#9fc2ff', dark: '#4a72c8' },
    aim: { name: 'AIM LINE · 15s', icon: '◎', col: '#ff9df0', dark: '#c04fb0' }
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

  /* ---------- key bindings ---------- */
  const ACTIONS = [
    ['up', 'Aim up'], ['down', 'Aim down'], ['fire', 'Fire'],
    ['railUp', 'Rail up'], ['railDown', 'Rail down'], ['pause', 'Pause']
  ];
  const DEFAULT_BINDS = {
    up: ['ArrowUp', ''], down: ['ArrowDown', ''], fire: ['KeyF', 'Space'],
    railUp: ['KeyW', ''], railDown: ['KeyS', ''], pause: ['KeyP', '']
  };
  const STORE = 'hanziDefence.keys.v1';
  let binds = loadBinds();
  function loadBinds() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && ACTIONS.every(([a]) => Array.isArray(s[a]) && s[a].length === 2)) return s;
    } catch (e) { }
    return JSON.parse(JSON.stringify(DEFAULT_BINDS));
  }
  function saveBinds() { try { localStorage.setItem(STORE, JSON.stringify(binds)); } catch (e) { } }
  function keyName(c) {
    if (!c) return '—';
    const map = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Space', Enter: 'Enter', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift', ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl', AltLeft: 'L-Alt', AltRight: 'R-Alt', Backspace: 'Backspace', Tab: 'Tab' };
    if (map[c]) return map[c];
    return c.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ');
  }
  const actionOf = code => { for (const [a] of ACTIONS) if (binds[a].includes(code)) return a; return null; };
  function keyLabel(a) { return binds[a].filter(Boolean).map(keyName).join(' / ') || '—'; }
  function renderKeySummary() {
    const k = a => binds[a].filter(Boolean).map(c => `<kbd>${keyName(c)}</kbd>`).join('');
    $('keySummary').innerHTML =
      `<div>${k('up')}${k('down')} Aim turret</div>` +
      `<div>${k('fire')} Fire</div>` +
      `<div>${k('railUp')}${k('railDown')} Move turret <small>(unlock with Rail Module)</small></div>` +
      `<div>${k('pause')}<kbd>Esc</kbd> Pause</div>`;
  }

  let waiting = null, settingsFrom = 'menu';
  function renderSettings() {
    const tb = $('setBody'); tb.innerHTML = '';
    ACTIONS.forEach(([a, label]) => {
      const tr = document.createElement('tr');
      const td = document.createElement('td'); td.textContent = label; tr.appendChild(td);
      [0, 1].forEach(slot => {
        const c = document.createElement('td');
        const b = document.createElement('button'); b.type = 'button';
        const isWait = waiting && waiting.a === a && waiting.slot === slot;
        b.className = 'keybtn' + (isWait ? ' wait' : '') + (!binds[a][slot] && !isWait ? ' empty' : '');
        b.textContent = isWait ? 'Press a key…' : keyName(binds[a][slot]);
        b.addEventListener('click', () => { waiting = { a, slot }; $('setMsg').textContent = 'Press a key (Esc to cancel, Backspace to clear backup).'; renderSettings(); });
        c.appendChild(b); tr.appendChild(c);
      });
      tb.appendChild(tr);
    });
  }
  function openSettings(from) {
    settingsFrom = from; waiting = null;
    $('setMsg').textContent = '';
    renderSettings();
    $(from === 'pause' ? 'pause' : 'menu').classList.add('hidden');
    $('settings').classList.remove('hidden');
  }
  function closeSettings() {
    waiting = null; saveBinds(); renderKeySummary();
    $('settings').classList.add('hidden');
    $(settingsFrom === 'pause' ? 'pause' : 'menu').classList.remove('hidden');
  }
  function captureKey(e) {
    e.preventDefault();
    const { a, slot } = waiting;
    if (e.code === 'Escape') { waiting = null; $('setMsg').textContent = 'Cancelled.'; renderSettings(); return; }
    if (e.code === 'Backspace' && slot === 1) { binds[a][1] = ''; waiting = null; $('setMsg').textContent = 'Backup key cleared.'; renderSettings(); return; }
    const owner = actionOf(e.code);
    if (owner && !(owner === a && binds[a][slot] === e.code)) {
      const name = ACTIONS.find(x => x[0] === owner)[1];
      $('setMsg').textContent = `${keyName(e.code)} is already used for "${name}". Choose another key.`;
      return;
    }
    binds[a][slot] = e.code; waiting = null;
    $('setMsg').textContent = `${ACTIONS.find(x => x[0] === a)[1]} → ${keyName(e.code)}`;
    renderSettings(); saveBinds();
  }
  $('btnSettingsMenu').addEventListener('click', () => openSettings('menu'));
  $('btnSettingsPause').addEventListener('click', () => openSettings('pause'));
  $('btnSetDone').addEventListener('click', closeSettings);
  $('btnSetDefault').addEventListener('click', () => {
    binds = JSON.parse(JSON.stringify(DEFAULT_BINDS)); waiting = null; saveBinds();
    $('setMsg').textContent = 'Default keys restored.'; renderSettings();
  });
  renderKeySummary();

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
  function charCount(h) { return Array.from(String(h).replace(/[\s\/／·.,，。、!?！？]/g, '')).length; }
  function buildPool(lists) {
    const seen = new Set(), out = [];
    lists.forEach(l => (l.words || []).forEach(w => {
      if (!w || !w.hanzi || !w.english || seen.has(w.hanzi)) return;
      seen.add(w.hanzi);
      out.push({ hanzi: w.hanzi, pinyin: w.pinyin || '', english: w.english, keys: enParts(w.english), n: charCount(w.hanzi) });
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
  function noise(d, v, freq = 900) {
    const a = ac(); if (!a) return;
    const buf = a.createBuffer(1, Math.floor(a.sampleRate * d), a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / ch.length);
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq;
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
    count: () => tone(880, 0.12, 'sine', 0.1),
    go: () => tone(1320, 0.25, 'triangle', 0.12),
    pop: () => { noise(0.3, 0.16, 1400); tone(500, 0.2, 'triangle', 0.06, 120); },
    boom: () => { noise(1.4, 0.4, 500); tone(90, 1.2, 'sawtooth', 0.15, 30); },
    alarm: () => tone(700, 0.25, 'square', 0.05, 500),
    win: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.12), i * 110)); },
    lose: () => { [400, 300, 200, 120].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sawtooth', 0.08), i * 160)); }
  };
  function playMusic() { if (musicOn) { const p = bgm.play(); if (p) p.catch(() => { }); } }
  $('btnMusic').addEventListener('click', () => {
    musicOn = !musicOn; $('btnMusic').textContent = musicOn ? '♪ ON' : '♪ OFF';
    if (musicOn) playMusic(); else bgm.pause();
    $('btnMusic').blur();
  });
  function goFull() { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); }
  $('btnFull').addEventListener('click', () => {
    if (!document.fullscreenElement) goFull(); else document.exitFullscreen();
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
    // alert zone
    b.save();
    b.beginPath(); b.rect(SHIELD_X + 2, FIELD_TOP, ALERT_X - SHIELD_X - 2, FIELD_BOT - FIELD_TOP); b.clip();
    const ag = b.createLinearGradient(SHIELD_X, 0, ALERT_X, 0);
    ag.addColorStop(0, 'rgba(255,60,80,0.10)'); ag.addColorStop(1, 'rgba(255,60,80,0.015)');
    b.fillStyle = ag; b.fillRect(SHIELD_X, FIELD_TOP, ALERT_X - SHIELD_X, FIELD_BOT - FIELD_TOP);
    b.strokeStyle = 'rgba(255,80,100,0.045)'; b.lineWidth = 10;
    for (let x = SHIELD_X - 600; x < ALERT_X + 50; x += 34) { b.beginPath(); b.moveTo(x, FIELD_BOT); b.lineTo(x + 520, FIELD_TOP); b.stroke(); }
    b.restore();
    b.save(); b.setLineDash([12, 10]); b.strokeStyle = 'rgba(255,90,110,0.45)'; b.lineWidth = 2;
    b.beginPath(); b.moveTo(ALERT_X, FIELD_TOP); b.lineTo(ALERT_X, FIELD_BOT); b.stroke(); b.restore();
    b.fillStyle = 'rgba(255,120,135,0.55)'; b.font = `700 12px ${EN}`; b.textAlign = 'center';
    b.fillText('ALERT ZONE', (SHIELD_X + ALERT_X) / 2, FIELD_TOP + 14);
    // cave
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
  const down = a => binds[a].some(c => c && keys[c]);
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
      bugs: [], swarm: [], shots_: [], parts: [], smoke: [], floats: [], flyers: [], holes: [],
      tur: { y: 365, a: 0, av: 0, vy: 0, cd: 0, recoil: 0, kick: 0, flash: 0, ready: true },
      lv: { swivel: 0, rail: 0 }, aimT: 0,
      reward: null, rewardT: 8,
      spawnT: 0.5, recent: [],
      target: null, lastTarget: null, orderT: 1.6, orderAnim: 0, alertOrder: false,
      recovered: {}, review: {}, t: 0, endT: 0, endClock: 0, toast: null, shake: 0,
      banner: null, baseFlash: 0, whiteout: 0, baseGone: false, countT: 0
    };
  }

  /* ---------- bug geometry by type ---------- */
  // type: 'scarab' (1 char), 'stalker' (2 chars), 'crawler' (3+ chars)
  const typeFor = n => n <= 1 ? 'scarab' : (n === 2 ? 'stalker' : 'crawler');
  function extents(type, bw, s) {
    if (type === 'scarab') { const bodyW = Math.max(bw / 2 + 14, 46 * s); return { front: bodyW + 30 * s, back: bodyW + 4 }; }
    if (type === 'stalker') { const bodyW = bw / 2 + 18; return { front: bodyW + 40 * s, back: bodyW + 22 * s }; }
    return { front: bw / 2 + 52 * s, back: bw / 2 + 34 * s };
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
      const y = rand(FIELD_TOP + 55, FIELD_BOT - 45);
      const dmin = Math.min(999, ...G.bugs.filter(b => b.x > 850).map(b => Math.abs(b.y - y)));
      if (dmin > best) { best = dmin; by = y; }
    }
    G.bugs.push(makeBug(w, 1250, by, false));
    return true;
  }
  function makeBug(w, x, y, mini) {
    ctx.font = `${mini ? 36 : 40}px ${HZ}`;
    const tw = ctx.measureText(w.hanzi).width;
    const bw = Math.max(tw + 28, mini ? 64 : 76);
    const s = mini ? 0.78 : 1;
    const type = typeFor(w.n || charCount(w.hanzi));
    const ex = extents(type, bw, s);
    return {
      w, x, y, ty: y, mini, bw, bh: mini ? 50 : 56, s, type, front: ex.front, back: ex.back,
      v: G.d.speed * (mini ? 1.3 : 1) * rand(0.85, 1.15),
      wander: rand(2, 5), phase: rand(0, 7), flash: 0, knock: 0, dead: false, swell: 0,
      blink: rand(1, 4), shrink: 0, hue: rand(-1, 1)
    };
  }
  function box(b) { return { x0: b.x - b.front + 8, x1: b.x + b.back - 4, y0: b.y - b.bh / 2 - 16, y1: b.y + b.bh / 2 + 16 }; }

  /* ---------- burrow (reward) bug ---------- */
  function spawnReward() {
    for (let i = 0; i < 25; i++) {
      const life = rand(5, 10), speed = rand(38, 52);
      const x0 = rand(560, 980), y = rand(FIELD_TOP + 50, FIELD_BOT - 45);
      const x1 = Math.max(290, x0 - life * speed);
      const clear = G.bugs.every(b => b.dead || (Math.hypot(b.x - x0, b.y - y) > 130 && Math.hypot(b.x - x1, b.y - y) > 100));
      if (!clear) continue;
      G.reward = { x: x0, y, x0, x1, phase: 'warn', t: 0, life, speed: (x0 - x1) / life, p: 0, spin: 0, swell: 0 };
      G.holes.push({ x: x0, y: y + 16, t: 0, life: life + 2.5 });
      SFX.dig();
      return true;
    }
    return false;
  }
  function rewardBox(r) { return { x0: r.x - 46, x1: r.x + 50, y0: r.y - 46, y1: r.y + 24 }; }
  function updateReward(dt) {
    const r = G.reward; if (!r) return;
    r.t += dt; r.p += dt * 7;
    r.spin += dt * (r.phase === 'out' ? 8 : 26);
    if (r.phase === 'warn' && r.t >= 1) { r.phase = 'rise'; r.t = 0; }
    else if (r.phase === 'rise' && r.t >= 0.45) { r.phase = 'out'; r.t = 0; }
    else if (r.phase === 'out') {
      r.x = r.x0 - r.speed * r.t;
      if (r.t >= r.life - 1 && !r.exitHole) { r.exitHole = true; G.holes.push({ x: r.x1, y: r.y + 16, t: 0, life: 2.2 }); }
      if (r.t >= r.life) { r.phase = 'dive'; r.t = 0; SFX.dig(); }
    } else if (r.phase === 'dive' && r.t >= 0.45) { G.reward = null; G.rewardT = rand(20, 25); }
  }
  function collectReward(r) {
    G.reward = null; G.rewardT = rand(20, 25);
    burst(r.x, r.y, '#ffd25a', 30);
    const opts = ['aim'];
    if (G.lv.swivel < MAX_SWIVEL) opts.push('swivel');
    if (G.lv.rail < MAX_RAIL) opts.push('rail');
    if (G.shield < 5) opts.push('shield', 'shield');
    G.flyers.push({ x: r.x, y: r.y - 30, t: 0, kind: 'gear', g: pick(opts) });
    G.gears++;
  }
  function applyGear(k) {
    let text = GEAR[k].name;
    if (k === 'swivel') { G.lv.swivel++; text += ' Lv' + G.lv.swivel; }
    else if (k === 'rail') { G.lv.rail++; text = G.lv.rail === 1 ? 'RAIL UNLOCKED · ' + keyLabel('railUp') + ' / ' + keyLabel('railDown') : 'RAIL SPEED Lv' + G.lv.rail; }
    else if (k === 'shield') { G.shield = Math.min(5, G.shield + 2); }
    else if (k === 'aim') { G.aimT = AIM_TIME; }
    G.toast = { text, col: GEAR[k].col, t: 2 };
    SFX.gear();
  }

  /* ---------- observer (with alert-zone priority) ---------- */
  function activeBugs() { return G.bugs.filter(b => !b.dead && b.x < ACTIVE_X); }
  const inAlert = b => b.x - b.front < ALERT_X;
  const uniqWords = list => [...new Map(list.map(b => [b.w.hanzi, b.w])).values()];
  function chooseTarget() {
    const act = activeBugs();
    if (act.length < Math.min(2, G.field)) return;
    const alertBugs = act.filter(inAlert);
    let words = uniqWords(act), fromAlert = false;
    const alertWords = uniqWords(alertBugs);
    if (alertWords.length >= 2) { words = alertWords; fromAlert = true; }
    else if (alertWords.length === 1 && Math.random() < 0.6) { words = alertWords; fromAlert = true; }
    if (words.length > 1) words = words.filter(w => w.hanzi !== G.lastTarget);
    G.target = pick(words); G.lastTarget = G.target.hanzi;
    G.alertOrder = fromAlert;
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
    for (let i = 0; i < 9; i++) {
      const sp = rand(20, 70), a = T.a + rand(-0.9, 0.9);
      G.smoke.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp - 15, vy: Math.sin(a) * sp - rand(5, 25), r: rand(7, 15), grow: rand(10, 22), life: rand(0.8, 1.4), max: 1.4, bubble: false });
    }
    for (let i = 0; i < 6; i++) {
      G.smoke.push({ x: m.x + rand(-8, 8), y: m.y + rand(-8, 8), vx: rand(-25, 25), vy: rand(-45, -15), r: rand(2.5, 5), grow: 0, life: rand(0.8, 1.5), max: 1.5, bubble: true });
    }
    for (const s of [-1, 1]) G.smoke.push({ x: TUR_X - Math.cos(T.a) * 18, y: T.y + s * 20, vx: -30, vy: s * 25, r: 6, grow: 14, life: 0.7, max: 0.9, bubble: false });
    G.shots++; SFX.fire();
  }

  /* ---------- hit resolution ---------- */
  function burst(x, y, col, n, spd = 260) {
    for (let i = 0; i < n; i++) { const a = rand(0, 7), s = rand(60, spd); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.9), col, r: rand(2, 5) }); }
  }
  function floatText(x, y, lines, border, life = 1.6) { G.floats.push({ x, y, lines, border, life, max: life }); }

  function onHit(b) {
    if (b === G.reward) return collectReward(b);
    G.hits++;
    const ok = G.target && b.w.hanzi === G.target.hanzi;
    if (ok) {
      G.correct++; b.dead = true; G.kills++;
      G.combo++; G.best = Math.max(G.best, G.combo);
      burst(b.x, b.y, '#5ff0ff', 26); SFX.good();
      floatText(b.x, b.y - 30, [
        { t: b.w.pinyin, f: EN, s: 20, c: '#5ff0ff', w: 700 },
        { t: b.w.hanzi, f: HZ, s: 38, c: '#ffc24a', w: 400 }
      ], '#ffc24a');
      if (!b.mini) {
        G.capsules++;
        G.score += 100 + (G.combo - 1) * 10;
        G.recovered[b.w.hanzi] = G.recovered[b.w.hanzi] || { w: b.w, n: 0 };
        G.recovered[b.w.hanzi].n++;
        G.flyers.push({ x: b.x, y: b.y, slot: G.capsules - 1, t: 0, w: b.w, kind: 'cap' });
      } else {
        G.score += 30;
      }
      G.reloadPing = 1.2;
      G.target = null;
      if (G.capsules >= G.goal) return winGame();
      G.orderT = 0.75;
    } else {
      G.combo = 0;
      if (G.target) G.review[G.target.hanzi] = G.target;
      SFX.bad();
      floatText(b.x, b.y - 46, [{ t: '✕  ' + b.w.pinyin, f: EN, s: 22, c: '#ff9f9f', w: 700 }], '#ff8a8a', 1.8);
      if (!b.mini) {
        const alive = G.bugs.filter(x => !x.dead).length;
        if (alive + 1 > MAX_BUGS) { damage(b.x, b.y, true); b.knock = 1; b.shrink = 1; }
        else {
          b.dead = true; SFX.split(); burst(b.x, b.y, '#b59cff', 18);
          const m1 = makeBug(b.w, b.x + 12, clamp(b.y - 50, FIELD_TOP + 40, FIELD_BOT - 40), true);
          const m2 = makeBug(b.w, b.x + 12, clamp(b.y + 50, FIELD_TOP + 40, FIELD_BOT - 40), true);
          m1.flash = m2.flash = 0.5; G.bugs.push(m1, m2);
        }
      } else { b.knock = 1; b.flash = 0.4; b.shrink = 1; }
    }
  }
  function damage(x, y, fromPenalty) {
    if (G.shield > 0) {
      G.shield--; if (G.shield === 0) G.shieldBroken = true;
      G.shake = 0.3; SFX.hitShield(); burst(fromPenalty ? x : SHIELD_X, y, '#8fdcff', 16);
    } else {
      G.base--; G.baseHurt = true; G.shake = 0.5; G.baseFlash = 0.6; SFX.hitShield(); burst(BASE_X, y, '#ff9d6a', 24);
      if (G.base <= 0) loseGame();
    }
  }

  /* ---------- end sequences ---------- */
  function winGame() {
    state = 'won'; G.target = null; G.endClock = 0; SFX.win();
    const list = shuffle(G.bugs.filter(b => !b.dead));
    if (G.reward && G.reward.phase !== 'warn') list.push(G.reward);
    else G.reward = null;
    list.forEach((b, i) => { b.boomAt = 0.6 + i * 0.15; });
    G.boomList = list;
    G.endT = (list.length ? list[list.length - 1].boomAt : 0.6) + 0.9;
    G.bannerAt = G.endT;
    G.endT += 1.8;
  }
  function loseGame() {
    state = 'lost'; G.target = null; G.endClock = 0; SFX.lose();
    G.reward = null; G.aimEnd = null;
    G.bugs.forEach(b => { b.rush = rand(200, 280); });
    const types = ['scarab', 'stalker', 'crawler'];
    for (let i = 0; i < 34; i++) {
      const type = pick(types), s = rand(0.62, 0.8), bw = type === 'scarab' ? 70 : type === 'stalker' ? 100 : 140;
      G.swarm.push({ x: rand(1180, 1300), y: rand(FIELD_TOP + 30, FIELD_BOT - 30), v: rand(240, 340), delay: rand(0, 2.2), phase: rand(0, 7), out: false, dead: false, s, type, bw, cap: Math.random() < 0.85 });
    }
    G.boomAt = 3.4; G.bannerAt = 4.4; G.endT = 6.4;
  }
  function updateEnd(dt) {
    G.endClock += dt;
    const c = G.endClock;
    if (state === 'won') {
      G.boomList.forEach(b => {
        if (b.exploded) return;
        b.swell = clamp(1 - (b.boomAt - c) / 0.35, 0, 1);
        if (c >= b.boomAt) {
          b.exploded = true;
          if (b === G.reward) { burst(b.x, b.y, '#ffd25a', 40, 320); G.reward = null; }
          else { b.dead = true; burst(b.x, b.y, '#b59cff', 34, 330); burst(b.x, b.y, '#ffffff', 10, 200); }
          G.shake = Math.max(G.shake, 0.15); SFX.pop();
        }
      });
      G.bugs = G.bugs.filter(b => !b.dead);
      if (c >= G.bannerAt && !G.banner) G.banner = { text: 'SECTOR SECURED', col: '#5ff0ff' };
    } else {
      G.bugs.forEach(b => {
        if (b.dead) return;
        b.phase += dt * 12; b.x -= b.rush * dt;
        if (b.x - b.front <= BASE_X && !G.baseGone) { b.dead = true; burst(BASE_X, b.y, '#ff9d6a', 12); G.baseFlash = 0.5; G.shake = Math.max(G.shake, 0.2); }
      });
      G.bugs = G.bugs.filter(b => !b.dead);
      G.swarm.forEach(s => {
        if (s.dead) return;
        if (c < s.delay) return;
        s.out = true; s.phase += dt * 14; s.x -= s.v * dt;
        if (s.x <= BASE_X + 30) {
          if (G.baseGone) { if (s.x <= -60) s.dead = true; }
          else { s.dead = true; burst(BASE_X + 10, s.y, '#ff9d6a', 8, 180); G.baseFlash = 0.5; G.shake = Math.max(G.shake, 0.25); }
        }
      });
      if (Math.floor((c - dt) / 0.45) !== Math.floor(c / 0.45) && c < G.boomAt) SFX.alarm();
      if (c >= G.boomAt && !G.baseGone) {
        G.baseGone = true; G.whiteout = 1; G.shake = 1; SFX.boom();
        for (let y = 120; y < 620; y += 40) { burst(rand(10, 90), y, '#ff9d6a', 14, 420); burst(rand(10, 90), y, '#ffe08a', 8, 300); }
        G.swarm.forEach(s => { if (!s.dead && s.out) { s.dead = true; burst(s.x, s.y, '#b59cff', 6); } });
        G.bugs.forEach(b => { b.dead = true; burst(b.x, b.y, '#b59cff', 10); });
      }
      if (c >= G.bannerAt && !G.banner) G.banner = { text: 'BASE BREACHED', col: '#ff8a8a' };
    }
    G.whiteout = Math.max(0, G.whiteout - dt * 1.2);
    G.endT -= dt;
    if (G.endT <= 0) showResults(state === 'won');
  }

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
    if (document.activeElement) document.activeElement.blur();
    newGame(pool, label, practise);
    ['menu', 'results', 'pause', 'settings'].forEach(s => $(s).classList.add('hidden'));
    $('briefText').textContent = `Recover ${G.goal} Hanzi Capsules`;
    $('readyHint').textContent = `Click the button or press ${keyLabel('fire')} to start`;
    $('brief').classList.remove('hidden');
    state = 'brief';
  }
  function beginCountdown() {
    if (state !== 'brief') return;
    $('brief').classList.add('hidden');
    if (document.activeElement) document.activeElement.blur();
    state = 'count'; G.countT = 1.8; G.lastCount = 4;
  }
  $('btnReady').addEventListener('click', beginCountdown);
  $('btnStart').addEventListener('click', () => {
    const pool = buildPool(chosenLists());
    if (pool.length < 4) return;
    goFull();
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
  function toMenu() { state = 'menu'; G = null; ['results', 'pause', 'brief', 'settings'].forEach(s => $(s).classList.add('hidden')); $('menu').classList.remove('hidden'); }
  function togglePause() {
    if (state === 'play') { state = 'paused'; $('pause').classList.remove('hidden'); }
    else if (state === 'paused' && $('settings').classList.contains('hidden')) {
      state = 'play'; $('pause').classList.add('hidden');
      if (document.activeElement) document.activeElement.blur();
    }
  }

  /* ---------- input ---------- */
  window.addEventListener('keydown', e => {
    if (waiting) { captureKey(e); return; }
    const code = e.code;
    const a = actionOf(code);
    if (state === 'brief' && a === 'fire') { e.preventDefault(); if (!e.repeat) beginCountdown(); return; }
    const inGame = ['play', 'count', 'won', 'lost'].includes(state);
    if (inGame && (a || code === 'Space' || code.startsWith('Arrow'))) e.preventDefault();
    if (state === 'paused' && code === 'Space') e.preventDefault();
    if (a === 'pause' || code === 'Escape') {
      if (!$('settings').classList.contains('hidden')) { if (code === 'Escape') closeSettings(); return; }
      if (state === 'play' || state === 'paused') togglePause();
      return;
    }
    keys[code] = true;
    if (a === 'fire' && !e.repeat && state === 'play') fire();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; if (state === 'play') togglePause(); });

  /* ---------- update ---------- */
  function inertia(v, dir, acc, max, dt) {
    if (dir) { v += dir * acc * dt; return clamp(v, -max, max); }
    const dec = acc * 1.4 * dt;
    return Math.abs(v) <= dec ? 0 : v - Math.sign(v) * dec;
  }
  function updateCount(dt) {
    G.t += dt; G.countT -= dt;
    const n = Math.ceil(G.countT / 0.6);
    if (n !== G.lastCount) { G.lastCount = n; if (n > 0) SFX.count(); }
    if (G.countT <= 0) { state = 'play'; SFX.go(); G.goFlash = 0.6; }
  }
  function update(dt) {
    G.t += dt;
    const T = G.tur;
    if (G.goFlash) G.goFlash = Math.max(0, G.goFlash - dt);
    if (state === 'play') {
      const lv = G.lv.swivel;
      const maxW = 0.42 + lv * 0.22, accW = 1.1 + lv * 0.7;
      const dirA = (down('down') ? 1 : 0) - (down('up') ? 1 : 0);
      T.av = inertia(T.av, dirA, accW, maxW, dt);
      T.a += T.av * dt;
      if (T.a < -1.05 || T.a > 1.05) { T.a = clamp(T.a, -1.05, 1.05); T.av = 0; }
      if (G.lv.rail > 0) {
        const rl = G.lv.rail - 1;
        const maxV = 70 + rl * 45, accV = 150 + rl * 90;
        const dirY = (down('railDown') ? 1 : 0) - (down('railUp') ? 1 : 0);
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

      G.spawnT -= dt;
      const alive = G.bugs.filter(b => !b.dead);
      if (G.spawnT <= 0 && alive.filter(b => !b.mini).length < G.field && alive.length < MAX_BUGS) {
        spawnBug(); G.spawnT = rand(0.4, 1.4);
      }
      if (!G.reward) { G.rewardT -= dt; if (G.rewardT <= 0 && !spawnReward()) G.rewardT = 1.5; }
      updateReward(dt);

      if (G.target && !targetAlive()) { G.target = null; G.orderT = 0.6; }
      if (!G.target) { G.orderT -= dt; if (G.orderT <= 0) chooseTarget(); }

      G.bugs.forEach(b => {
        if (b.dead) return;
        b.phase += dt * 6; b.flash = Math.max(0, b.flash - dt); b.knock = Math.max(0, b.knock - dt * 3);
        b.shrink = Math.max(0, b.shrink - dt * 3);
        b.blink -= dt; if (b.blink < -0.14) b.blink = rand(2, 5);
        b.x -= b.v * dt * (b.knock > 0 ? -1.5 : 1);
        b.x = Math.min(b.x, 1260);
        if (b.x < ACTIVE_X) {
          b.wander -= dt;
          if (b.wander <= 0) { b.ty = clamp(b.y + rand(-110, 110), FIELD_TOP + 45, FIELD_BOT - 45); b.wander = rand(2.5, 5.5); }
        }
        b.y += (b.ty - b.y) * Math.min(1, dt * 0.8);
        const limit = G.shield > 0 ? SHIELD_X + 10 : BASE_X + 8;
        if (b.x - b.front <= limit) { b.dead = true; burst(b.x - b.front, b.y, '#b59cff', 14); damage(b.x, b.y, false); }
      });
      const al = G.bugs.filter(b => !b.dead);
      for (let i = 0; i < al.length; i++) for (let j = i + 1; j < al.length; j++) {
        const a = al[i], c = al[j];
        const left = a.x < c.x ? a : c, right = a.x < c.x ? c : a;
        const ox = (left.back + right.front) + 10 - Math.abs(a.x - c.x), oy = 104 - Math.abs(a.y - c.y);
        if (ox > 0 && oy > 0) {
          const s = a.y < c.y ? -1 : 1, push = Math.min(oy, 60) * dt * 3;
          a.y = clamp(a.y + s * push, FIELD_TOP + 34, FIELD_BOT - 34); c.y = clamp(c.y - s * push, FIELD_TOP + 34, FIELD_BOT - 34);
          a.ty = a.y; c.ty = c.y;
        }
      }
      G.bugs = G.bugs.filter(b => !b.dead && b.x < 1400);
    } else {
      G.bugs.forEach(b => { b.flash = Math.max(0, b.flash - dt); if (state === 'won') b.phase += dt * 20; });
      if (G.reward) G.reward.p += dt * 20;
      updateEnd(dt);
    }
    T.recoil = Math.max(0, T.recoil - dt * 4);
    T.kick = Math.max(0, T.kick - dt * 6);
    T.flash = Math.max(0, T.flash - dt);
    G.orderAnim = Math.max(0, G.orderAnim - dt * 2);
    if (G.reloadPing) G.reloadPing = Math.max(0, G.reloadPing - dt);
    G.baseFlash = Math.max(0, G.baseFlash - dt);

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
        if (f.kind === 'cap') G.slots[f.slot] = f.w; else if (state === 'play') applyGear(f.g);
      }
    });
    G.flyers = G.flyers.filter(f => !f.done);
    if (G.toast) { G.toast.t -= dt; if (G.toast.t <= 0) G.toast = null; }
    if (G.shake) G.shake = Math.max(0, G.shake - dt);
  }
  function slotPos(i) {
    const n = G.goal, gap = Math.min(34, 560 / n), x0 = 640 - (n - 1) * gap / 2;
    return { x: x0 + i * gap, y: 674 };
  }

  /* ---------- draw helpers ---------- */
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function fitFont(text, max, size, family, weight = '700') {
    let s = size; ctx.font = `${weight} ${s}px ${family}`;
    while (ctx.measureText(text).width > max && s > 14) { s -= 1; ctx.font = `${weight} ${s}px ${family}`; }
    return s;
  }
  function drawPill(x, y, len, r, ang, colA, colB, opt = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const half = len / 2;
    if (opt.glow) { ctx.shadowColor = opt.glow; ctx.shadowBlur = opt.glowSize || 14; }
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(-half + r, -r); ctx.arc(-half + r, 0, r, -Math.PI / 2, Math.PI / 2, true); ctx.lineTo(0, r); ctx.closePath();
    ctx.fillStyle = colA; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.lineTo(half - r, -r); ctx.arc(half - r, 0, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(0, r); ctx.closePath();
    ctx.fillStyle = colB; ctx.fill();
    ctx.shadowBlur = 0;
    const sh = ctx.createLinearGradient(0, -r, 0, r);
    sh.addColorStop(0, 'rgba(255,255,255,0.45)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.05)'); sh.addColorStop(1, 'rgba(0,0,0,0.28)');
    rr(-half, -r, len, r * 2, r); ctx.fillStyle = sh; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.beginPath(); ctx.moveTo(0, -r + 1); ctx.lineTo(0, r - 1); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    rr(-half + r * 0.6, -r * 0.72, len - r * 1.6, r * 0.32, r * 0.16); ctx.fill();
    if (opt.text) {
      ctx.rotate(-ang);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `${opt.weight || 400} ${opt.size}px ${opt.font}`;
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(60,30,0,0.35)'; ctx.strokeText(opt.text, 0, 1);
      ctx.fillStyle = opt.textCol || '#fff'; ctx.fillText(opt.text, 0, 1);
    }
    ctx.restore();
  }
  const pillHanzi = (x, y, scale, text) => drawPill(x, y, 78 * scale, 22 * scale, 0, '#ffd77a', '#ff9d00', { glow: '#ffb52e', glowSize: 18, text, size: 24 * scale, font: HZ, textCol: '#fffbe9' });

  /* ---------- alien bodies (no text) ---------- */
  function jointLeg(hx, hy, kx, ky, fx, fy, col, w, jointCol) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    ctx.lineWidth = w * 0.55; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - w * 1.2, fy + Math.sign(fy - ky) * w * 0.8); ctx.stroke();
    if (jointCol) { ctx.fillStyle = jointCol; ctx.beginPath(); ctx.arc(kx, ky, w * 0.55, 0, 7); ctx.fill(); }
  }
  function eye(x, y, r, blinking, col) {
    if (blinking) { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.stroke(); return; }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0.5, x, y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, col); g.addColorStop(1, '#1a0830');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  }

  // 1 character: armoured scarab
  function drawScarab(bw, s, t, blink, breath) {
    const bodyW = Math.max(bw / 2 + 16, 48 * s), bodyH = 46 * s;
    // legs (3 pairs, alternating tripod gait)
    for (let i = 0; i < 3; i++) {
      const hx = -bodyW * 0.45 + i * bodyW * 0.45;
      for (const sd of [-1, 1]) {
        const ph = t + i * 2.1 + (sd > 0 ? Math.PI : 0), sw = Math.sin(ph) * 7 * s;
        jointLeg(hx, sd * bodyH * 0.55, hx + sw - 8 * s, sd * (bodyH + 10 * s), hx + sw * 1.4 - 16 * s + (i - 1) * 6 * s, sd * (bodyH + 22 * s), '#3d2f5c', 4.2 * s, '#7fe0ff');
      }
    }
    ctx.save(); ctx.scale(1, breath);
    // abdomen shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(4, 6, bodyW + 2, bodyH, 0, 0, 7); ctx.fill();
    // elytra halves
    for (const sd of [-1, 1]) {
      const g = ctx.createLinearGradient(0, sd * bodyH, 0, 0);
      g.addColorStop(0, '#3b2e5e'); g.addColorStop(0.6, '#7b68b0'); g.addColorStop(1, '#a796d8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, sd > 0 ? 0 : Math.PI, sd > 0 ? Math.PI : Math.PI * 2); ctx.closePath(); ctx.fill();
      // ridges
      ctx.strokeStyle = 'rgba(210,200,255,0.35)'; ctx.lineWidth = 1.5 * s;
      for (let k = 1; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(4 * s, 0, bodyW * (1 - k * 0.22), bodyH * (1 - k * 0.28), 0, sd > 0 ? 0.15 : Math.PI + 0.15, sd > 0 ? Math.PI - 0.15 : Math.PI * 2 - 0.15); ctx.stroke(); }
      // cyan spots
      ctx.fillStyle = 'rgba(95,240,255,0.85)';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(bodyW * (0.6 - k * 0.32), sd * bodyH * 0.72, 2.6 * s, 0, 7); ctx.fill(); }
    }
    ctx.strokeStyle = '#22183a'; ctx.lineWidth = 2.2 * s;
    ctx.beginPath(); ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-bodyW + 4, 0); ctx.lineTo(bodyW, 0); ctx.stroke();
    ctx.restore();
    // pronotum
    const px = -bodyW - 2 * s;
    const pg = ctx.createRadialGradient(px - 4, -6, 2, px, 0, 22 * s);
    pg.addColorStop(0, '#b6a6e6'); pg.addColorStop(1, '#4b3b78');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(px, 0, 16 * s, 30 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#22183a'; ctx.lineWidth = 2 * s; ctx.stroke();
    // head
    const hx = px - 18 * s;
    ctx.fillStyle = '#5a4890'; ctx.beginPath(); ctx.ellipse(hx, 0, 11 * s, 14 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    // horn
    ctx.fillStyle = '#c9bcff'; ctx.beginPath(); ctx.moveTo(hx - 8 * s, -3 * s); ctx.lineTo(hx - 20 * s, 0); ctx.lineTo(hx - 8 * s, 3 * s); ctx.fill();
    // 3 eyes
    eye(hx - 3 * s, -7 * s, 3 * s, blink, '#7fffd4'); eye(hx - 3 * s, 7 * s, 3 * s, blink, '#7fffd4'); eye(hx - 7 * s, 0, 2.4 * s, blink, '#ff9df0');
    // clubbed antennae
    const wob = Math.sin(t * 0.9) * 3 * s;
    ctx.strokeStyle = '#8a78c8'; ctx.lineWidth = 2 * s;
    for (const sd of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(hx - 5 * s, sd * 10 * s); ctx.quadraticCurveTo(hx - 16 * s, sd * 22 * s, hx - 22 * s + wob, sd * 26 * s); ctx.stroke();
      ctx.fillStyle = '#7fe0ff'; ctx.beginPath(); ctx.ellipse(hx - 23 * s + wob, sd * 27 * s, 3.5 * s, 2.4 * s, 0, 0, 7); ctx.fill();
    }
  }

  // 2 characters: mantis-like stalker
  function drawStalker(bw, s, t, blink, breath) {
    const bodyW = bw / 2 + 18, bodyH = 38 * s;
    // translucent wings (trembling)
    const tr = Math.sin(t * 5) * 0.04;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(-bodyW * 0.2, 0); ctx.rotate(sd * (0.16 + tr));
      const wg = ctx.createLinearGradient(0, 0, bodyW * 1.3, 0);
      wg.addColorStop(0, 'rgba(255,120,230,0.28)'); wg.addColorStop(1, 'rgba(160,120,255,0.08)');
      ctx.fillStyle = wg; ctx.strokeStyle = 'rgba(255,150,240,0.45)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(bodyW * 0.62, sd * 30 * s, bodyW * 0.8, 20 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, sd * 14 * s); ctx.lineTo(bodyW * 1.2, sd * 22 * s); ctx.stroke();
      ctx.restore();
    }
    // long thin walking legs (2 pairs)
    for (let i = 0; i < 2; i++) {
      const hx = -bodyW * 0.1 + i * bodyW * 0.55;
      for (const sd of [-1, 1]) {
        const sw = Math.sin(t + i * 2.4 + (sd > 0 ? Math.PI : 0)) * 8 * s;
        jointLeg(hx, sd * bodyH * 0.5, hx + 6 * s + sw, sd * (bodyH + 16 * s), hx + 22 * s + sw * 1.3, sd * (bodyH + 26 * s), '#2a1844', 3 * s, '#ff4fd8');
      }
    }
    ctx.save(); ctx.scale(1, breath);
    // abdomen segments (rear)
    for (let k = 3; k >= 0; k--) {
      const ax = bodyW * 0.2 + k * bodyW * 0.22;
      ctx.fillStyle = k % 2 ? '#3d2560' : '#4a2e74';
      ctx.beginPath(); ctx.ellipse(ax, 0, bodyW * 0.28, bodyH * (0.95 - k * 0.1), 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,79,216,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
    }
    // thorax
    const g = ctx.createLinearGradient(0, -bodyH, 0, bodyH);
    g.addColorStop(0, '#6c4aa0'); g.addColorStop(0.5, '#4a2e74'); g.addColorStop(1, '#2a1844');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-bodyW * 0.25, 0, bodyW * 0.75, bodyH, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1a0c2c'; ctx.lineWidth = 2; ctx.stroke();
    // magenta glow lines
    ctx.strokeStyle = 'rgba(255,79,216,0.75)'; ctx.lineWidth = 1.6 * s;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-bodyW * 0.9, sd * bodyH * 0.55); ctx.quadraticCurveTo(-bodyW * 0.2, sd * bodyH * 0.95, bodyW * 0.45, sd * bodyH * 0.5); ctx.stroke(); }
    ctx.restore();
    // neck + triangular head
    const nx = -bodyW - 4 * s;
    ctx.fillStyle = '#4a2e74'; ctx.fillRect(nx - 2, -5 * s, 14 * s, 10 * s);
    const hx = nx - 14 * s;
    ctx.fillStyle = '#5c3a8c';
    ctx.beginPath(); ctx.moveTo(hx + 10 * s, -16 * s); ctx.lineTo(hx + 10 * s, 16 * s); ctx.lineTo(hx - 14 * s, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#1a0c2c'; ctx.lineWidth = 2; ctx.stroke();
    eye(hx + 6 * s, -13 * s, 5.5 * s, blink, '#ff4fd8'); eye(hx + 6 * s, 13 * s, 5.5 * s, blink, '#ff4fd8');
    // raptorial forelegs (folded, twitching)
    const strike = Math.max(0, Math.sin(t * 0.6)) ** 6 * 6 * s;
    for (const sd of [-1, 1]) {
      const sx = -bodyW * 0.75, sy = sd * bodyH * 0.6;
      const ex = sx - 22 * s - strike, ey = sd * (bodyH + 8 * s);
      const tx = ex - 18 * s - strike, ty = sd * 10 * s;
      ctx.strokeStyle = '#6c4aa0'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#8a64c4'; ctx.lineWidth = 4 * s;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = '#ffb3f0';
      for (let k = 1; k <= 3; k++) {
        const px = ex + (tx - ex) * k / 4, py = ey + (ty - ey) * k / 4;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 2 * s, py - sd * 5 * s); ctx.lineTo(px + 4 * s, py); ctx.fill();
      }
      ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.arc(ex, ey, 2.6 * s, 0, 7); ctx.fill();
    }
    // long antennae
    const wob = Math.sin(t * 0.7) * 4 * s;
    ctx.strokeStyle = 'rgba(200,170,255,0.8)'; ctx.lineWidth = 1.3;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx - 6 * s, sd * 4 * s); ctx.quadraticCurveTo(hx - 26 * s, sd * 20 * s, hx - 34 * s + wob, sd * 40 * s); ctx.stroke(); }
  }

  // 3+ characters: segmented crawler
  function drawCrawler(bw, s, t, blink, breath) {
    const span = bw + 30 * s, segGap = 21 * s;
    const n = Math.max(4, Math.round(span / segGap) + 1);
    const x0 = -span / 2, segR = 36 * s;
    const wave = i => Math.sin(t * 0.55 + i * 0.7) * 3 * s;
    // legs
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (span / (n - 1)), y = wave(i);
      for (const sd of [-1, 1]) {
        const sw = Math.sin(t * 1.4 - i * 0.9 + (sd > 0 ? Math.PI : 0)) * 6 * s;
        jointLeg(x, y + sd * segR * 0.6, x + sw - 3 * s, y + sd * (segR + 9 * s), x + sw * 1.4 - 8 * s, y + sd * (segR + 18 * s), '#262759', 3.2 * s, '#b07cff');
      }
    }
    // tail cerci
    const tx = x0 + span, ty = wave(n - 1);
    ctx.strokeStyle = '#3e3f8a'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(tx + 8 * s, ty + sd * 6 * s); ctx.quadraticCurveTo(tx + 24 * s, ty + sd * 10 * s, tx + 32 * s, ty + sd * 22 * s); ctx.stroke(); }
    // segments back-to-front
    for (let i = n - 1; i >= 0; i--) {
      const x = x0 + i * (span / (n - 1)), y = wave(i);
      const r = segR * (i === n - 1 ? 0.8 : 1) * breath;
      const g = ctx.createRadialGradient(x - 5 * s, y - 8 * s, 2, x, y, r);
      g.addColorStop(0, '#6466c0'); g.addColorStop(0.7, '#34357a'); g.addColorStop(1, '#1d1d4a');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, Math.min(r * 0.62, 15 * s), r, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#121236'; ctx.lineWidth = 2; ctx.stroke();
      // plate ridge
      ctx.strokeStyle = 'rgba(180,170,255,0.35)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y - r * 0.8); ctx.lineTo(x, y + r * 0.8); ctx.stroke();
      // joint glow
      const gl = 0.45 + 0.35 * Math.sin(t * 0.8 + i);
      ctx.fillStyle = `rgba(176,124,255,${gl})`;
      ctx.beginPath(); ctx.arc(x, y - r * 0.82, 2.4 * s, 0, 7); ctx.arc(x, y + r * 0.82, 2.4 * s, 0, 7); ctx.fill();
    }
    // head
    const hx = x0 - 20 * s, hy = wave(0);
    const hg = ctx.createRadialGradient(hx - 4, hy - 6, 2, hx, hy, 20 * s);
    hg.addColorStop(0, '#7a7cd6'); hg.addColorStop(1, '#2a2b66');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.ellipse(hx, hy, 18 * s, 24 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#121236'; ctx.lineWidth = 2; ctx.stroke();
    // big mandibles
    const bite = Math.sin(t * 0.9) * 0.18;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(hx - 12 * s, hy + sd * 8 * s); ctx.rotate(sd * (0.25 + bite));
      ctx.fillStyle = '#c9b8ff';
      ctx.beginPath(); ctx.moveTo(0, -3 * s * sd); ctx.quadraticCurveTo(-18 * s, -sd * 6 * s, -22 * s, sd * 6 * s); ctx.quadraticCurveTo(-12 * s, sd * 2 * s, 0, sd * 4 * s); ctx.fill();
      ctx.restore();
    }
    eye(hx - 4 * s, hy - 9 * s, 3.4 * s, blink, '#ffd25a'); eye(hx - 4 * s, hy + 9 * s, 3.4 * s, blink, '#ffd25a');
    eye(hx + 4 * s, hy - 12 * s, 2.2 * s, blink, '#ffd25a'); eye(hx + 4 * s, hy + 12 * s, 2.2 * s, blink, '#ffd25a');
    const wob = Math.sin(t * 0.8) * 3 * s;
    ctx.strokeStyle = '#8f8fe6'; ctx.lineWidth = 1.8 * s;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx - 6 * s, hy + sd * 14 * s); ctx.quadraticCurveTo(hx - 18 * s, hy + sd * 34 * s, hx - 34 * s + wob, hy + sd * 38 * s); ctx.stroke(); }
  }

  function drawAlienBody(type, bw, s, t, blink, breath) {
    if (type === 'scarab') drawScarab(bw, s, t, blink, breath);
    else if (type === 'stalker') drawStalker(bw, s, t, blink, breath);
    else drawCrawler(bw, s, t, blink, breath);
  }

  function drawBug(b) {
    const sw = 1 + (b.swell || 0) * 0.25;
    const shrink = 1 - b.shrink * 0.12;
    const breath = 1 + Math.sin(G.t * 2.4 + b.phase * 0.1) * 0.03;
    ctx.save(); ctx.translate(b.x + (b.swell ? rand(-2, 2) * b.swell : 0), b.y);
    ctx.save(); ctx.scale(sw * shrink, sw * shrink);
    drawAlienBody(b.type, b.bw, b.s, b.phase, b.blink < 0, breath);
    ctx.restore();
    // stable signal board
    const bw = b.bw * sw, bh = b.bh * sw;
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
    rr(-bw / 2, -bh / 2, bw, bh, 10);
    ctx.fillStyle = 'rgba(5,8,22,0.95)'; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(205,190,255,0.9)'; ctx.stroke();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(95,240,255,0.35)';
    rr(-bw / 2 + 4, -bh / 2 + 4, bw - 8, bh - 8, 7); ctx.stroke();
    if (b.flash > 0) { rr(-bw / 2, -bh / 2, bw, bh, 10); ctx.fillStyle = `rgba(255,120,120,${b.flash})`; ctx.fill(); }
    if (b.swell) { rr(-bw / 2, -bh / 2, bw, bh, 10); ctx.fillStyle = `rgba(255,255,255,${0.5 * b.swell * (0.5 + 0.5 * Math.sin(G.t * 40))})`; ctx.fill(); }
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${(b.mini ? 36 : 40) * sw}px ${HZ}`;
    ctx.fillText(b.w.hanzi, 0, 2);
    ctx.restore();
  }

  function drawSwarmBug(s) {
    if (!s.out || s.dead) return;
    ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.s, s.s);
    drawAlienBody(s.type, s.bw, 1, s.phase, false, 1);
    ctx.restore();
    if (s.cap) drawPill(s.x, s.y, 50 * s.s * 1.1, 14 * s.s * 1.1, 0, '#ffd77a', '#ff9d00', { glow: '#ffb52e', glowSize: 10 });
  }

  function drawHoles() {
    G.holes.forEach(h => {
      const open = Math.min(1, h.t / 0.6), close = Math.min(1, (h.life - h.t) / 0.6);
      const k = Math.min(open, close);
      ctx.save(); ctx.translate(h.x, h.y);
      ctx.strokeStyle = `rgba(255,200,90,${0.5 * k})`; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05 + 0.3, l = 30 + (i % 2) * 14;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 18 * k, Math.sin(a) * 8 * k); ctx.lineTo(Math.cos(a) * l * k, Math.sin(a) * l * 0.4 * k); ctx.stroke();
      }
      ctx.fillStyle = `rgba(40,25,10,${0.9 * k})`;
      ctx.beginPath(); ctx.ellipse(0, 0, 40 * k, 13 * k, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(150,100,50,${k})`; ctx.lineWidth = 3; ctx.stroke();
      for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(120,85,45,${k})`; ctx.beginPath(); ctx.arc(Math.cos(i * 1.3) * 44 * k, Math.sin(i * 1.3) * 12 * k, 4, 0, 7); ctx.fill(); }
      ctx.restore();
    });
  }

  function drawReward() {
    const r = G.reward; if (!r || r.phase === 'warn') return;
    let rise = 1;
    if (r.phase === 'rise') rise = r.t / 0.45;
    if (r.phase === 'dive') rise = 1 - r.t / 0.45;
    const sw = 1 + (r.swell || 0) * 0.3;
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x - 110, r.y - 110, 230, 126); ctx.clip();
    ctx.translate(r.x, r.y + (1 - rise) * 80);
    ctx.scale(sw, sw);
    const t = r.p;
    const ring = 0.5 + 0.3 * Math.sin(G.t * 5);
    ctx.strokeStyle = `rgba(255,220,120,${ring})`; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 4, 50, 24, 0, 0, 7); ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 3; i++) {
      const lx = -20 + i * 20;
      for (const side of [-1, 1]) {
        const swing = Math.sin(t + i * 2 + (side > 0 ? 0 : Math.PI)) * 6;
        const kx = lx + swing - 4, ky = side * 22, fx = lx + swing * 1.4 - 10, fy = side * 32;
        ctx.strokeStyle = '#7a5a16'; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(lx, side * 10); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
        ctx.fillStyle = '#ffe08a'; ctx.beginPath(); ctx.arc(kx, ky, 2.6, 0, 7); ctx.fill();
      }
    }
    ctx.save(); ctx.translate(40, 0);
    ctx.fillStyle = '#9aa4b8';
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(30, 0); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4d5568'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const off = ((r.spin * 6 + i * 8) % 32);
      const hh = 12 * (1 - off / 30);
      if (hh > 0) { ctx.beginPath(); ctx.moveTo(off, -hh); ctx.lineTo(off + 5, hh); ctx.stroke(); }
    }
    ctx.restore();
    const g = ctx.createLinearGradient(0, -22, 0, 20);
    g.addColorStop(0, '#fff0b0'); g.addColorStop(0.45, '#f2b93a'); g.addColorStop(1, '#a8701a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 44, 21, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a5210'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(122,82,16,0.8)'; ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * 13, 0, 4, 19 - Math.abs(i) * 2, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.ellipse(-6, -11, 26, 5, -0.05, 0, 7); ctx.fill();
    for (const gx of [-18, 6, 28]) { ctx.fillStyle = '#5ff0ff'; ctx.beginPath(); ctx.arc(gx, 12, 2.6, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#d99a2b'; ctx.beginPath(); ctx.ellipse(-48, 2, 13, 12, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#7a5210'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = '#5a3a08'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-58, -3); ctx.quadraticCurveTo(-68, -2, -64, 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-58, 7); ctx.quadraticCurveTo(-68, 8, -64, 2); ctx.stroke();
    ctx.fillStyle = '#1a0f00'; ctx.beginPath(); ctx.arc(-52, -3, 3, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-53, -4, 1, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c4861c'; ctx.lineWidth = 2.2;
    const wob = Math.sin(G.t * 6) * 3;
    ctx.beginPath(); ctx.moveTo(-50, -8); ctx.quadraticCurveTo(-62, -30, -54 + wob, -40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-44, -9); ctx.quadraticCurveTo(-46, -32, -36 - wob, -40); ctx.stroke();
    ctx.save(); ctx.shadowColor = '#7dffb0'; ctx.shadowBlur = 10; ctx.fillStyle = '#c8ffe0';
    ctx.beginPath(); ctx.arc(-54 + wob, -40, 3.5, 0, 7); ctx.arc(-36 - wob, -40, 3.5, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#5d6678';
    ctx.fillRect(-20, -26, 5, 10); ctx.fillRect(15, -26, 5, 10);
    rr(-26, -20, 52, 5, 2); ctx.fill();
    ctx.restore();
    const bob = Math.sin(G.t * 4) * 1.5;
    if (rise > 0.35) drawPill(r.x, r.y + (1 - rise) * 80 - 33 * sw + bob, 54 * sw, 15 * sw, 0, '#c8ffe0', '#3ddc84', { glow: '#7dffb0', glowSize: 14, text: '?', size: 17 * sw, font: EN, weight: 800, textCol: '#0b3b22' });
    if (r.phase === 'out') {
      const left = 1 - r.t / r.life;
      rr(r.x - 30, r.y + 34, 60, 5, 3); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fill();
      rr(r.x - 30, r.y + 34, 60 * left, 5, 3); ctx.fillStyle = left < 0.3 ? '#ff8a8a' : '#7dffb0'; ctx.fill();
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
    if (G.baseGone) return;
    ctx.save();
    ctx.translate(TUR_X - Math.cos(T.a) * kick, T.y - Math.sin(T.a) * kick);
    ctx.save(); ctx.rotate(T.a);
    const rc = T.recoil * T.recoil * 16;
    ctx.fillStyle = '#2a6fa8'; rr(8 - rc * 0.4, -12, 26, 24, 6); ctx.fill();
    const bg2 = ctx.createLinearGradient(0, -8, 0, 8);
    bg2.addColorStop(0, '#d9f6ff'); bg2.addColorStop(0.5, '#9fdcff'); bg2.addColorStop(1, '#4a8fc4');
    ctx.fillStyle = bg2; rr(14 - rc, -7, BARREL - 14, 14, 4); ctx.fill();
    ctx.fillStyle = '#1d4f80';
    for (let i = 0; i < 3; i++) ctx.fillRect(28 - rc + i * 10, -7, 3, 14);
    ctx.fillStyle = '#5ff0ff'; rr(BARREL - 8 - rc, -10, 12, 20, 3); ctx.fill();
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
    const g = ctx.createRadialGradient(-6, -6, 4, 0, 0, 30);
    g.addColorStop(0, '#d9f6ff'); g.addColorStop(1, '#2a6fa8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5ff0ff'; ctx.lineWidth = 2; ctx.stroke();
    const rt = reloadTime();
    if (state === 'play') {
      if (T.cd > 0) { ctx.strokeStyle = '#ffc24a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - T.cd / rt)); ctx.stroke(); }
      else { ctx.strokeStyle = `rgba(95,240,255,${0.5 + 0.3 * Math.sin(G.t * 6)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.stroke(); }
    }
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

  function drawAlertPulse() {
    if (state !== 'play') return;
    const any = G.bugs.some(b => !b.dead && inAlert(b));
    if (!any) return;
    const a = 0.06 + 0.05 * Math.sin(G.t * 5);
    ctx.fillStyle = `rgba(255,60,80,${a})`;
    ctx.fillRect(SHIELD_X + 2, FIELD_TOP, ALERT_X - SHIELD_X - 2, FIELD_BOT - FIELD_TOP);
  }

  function drawBaseFx() {
    let a = 0;
    if (state === 'lost' && !G.baseGone) a = 0.25 + 0.25 * Math.abs(Math.sin(G.endClock * 7));
    a = Math.max(a, G.baseFlash);
    if (a > 0) { ctx.fillStyle = `rgba(255,40,40,${a})`; ctx.fillRect(0, 84, BASE_X + 4, 560); }
    if (G.baseGone) {
      ctx.fillStyle = 'rgba(20,10,10,0.85)'; ctx.fillRect(0, 84, BASE_X + 4, 560);
      for (let i = 0; i < 8; i++) {
        const y = 120 + i * 65 + Math.sin(G.t * 3 + i) * 6;
        const fg = ctx.createRadialGradient(40, y, 2, 40, y, 40);
        fg.addColorStop(0, 'rgba(255,170,80,0.7)'); fg.addColorStop(1, 'rgba(255,80,40,0)');
        ctx.fillStyle = fg; ctx.fillRect(0, y - 40, 90, 80);
      }
    }
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
    const pulse = state === 'lost' ? 0.5 + Math.sin(G.t * 10) * 0.3 : 0.35 + Math.sin(G.t * 2) * 0.15;
    ctx.strokeStyle = state === 'lost' ? `rgba(255,90,120,${pulse})` : `rgba(181,156,255,${pulse})`; ctx.lineWidth = 3;
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
    const eyeG = ctx.createRadialGradient(ox, oy, 2, ox, oy, 12);
    eyeG.addColorStop(0, '#ffffff'); eyeG.addColorStop(1, G.target ? (G.alertOrder ? '#ff8a8a' : '#5ff0ff') : '#2a6fa8');
    ctx.fillStyle = eyeG; ctx.beginPath(); ctx.arc(ox, oy, 11, 0, 7); ctx.fill();
    if (!G.target && state === 'play') { ctx.strokeStyle = 'rgba(95,240,255,0.6)'; ctx.beginPath(); ctx.arc(ox, oy, 16 + (G.t * 30 % 14), 0, 7); ctx.stroke(); }
    const cx = 110, cw = 500;
    rr(cx, 10, cw, 68, 12); ctx.fillStyle = '#0c2347'; ctx.fill();
    ctx.lineWidth = 2 + G.orderAnim * 3; ctx.strokeStyle = G.target ? '#5ff0ff' : '#2a4a74'; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.font = `700 12px ${EN}`; ctx.fillStyle = '#7fd8ff';
    let lab = G.target ? 'OBSERVER · LOCK TARGET' : 'OBSERVER · SCANNING…';
    if (state === 'count') lab = 'OBSERVER · STAND BY';
    if (state === 'won') lab = 'OBSERVER · SWARM DESTROYED';
    if (state === 'lost') lab = 'OBSERVER · WARNING!';
    ctx.fillText(lab, cx + 16, 24);
    if (G.target) {
      fitFont(G.target.english, cw - 32, 32, EN, '700');
      ctx.fillStyle = '#ffffff'; ctx.fillText(G.target.english, cx + 16, 53);
    } else if (state === 'lost') {
      ctx.font = `700 26px ${EN}`; ctx.fillStyle = '#ff8a8a'; ctx.fillText('Swarm breaking through!', cx + 16, 53);
    } else {
      ctx.font = `700 26px ${EN}`; ctx.fillStyle = '#3d5d88'; ctx.fillText('· · ·', cx + 16, 53);
    }
    const rt = reloadTime();
    let gx = 628;
    const ping = G.reloadPing > 0;
    rr(gx, 18, 104, 50, 10); ctx.fillStyle = ping ? '#3a2c0a' : '#123a5c'; ctx.fill();
    ctx.strokeStyle = '#ffc24a'; ctx.lineWidth = ping ? 3 : 1.5; ctx.stroke();
    ctx.textAlign = 'left'; ctx.font = `700 11px ${EN}`; ctx.fillStyle = '#ffc24a'; ctx.fillText(rt <= RELOAD_MIN ? 'RELOAD · MAX' : 'RELOAD', gx + 10, 31);
    ctx.font = `700 21px ${EN}`; ctx.fillStyle = '#fff'; ctx.fillText(rt.toFixed(1) + 's', gx + 10, 53);
    gx += 114;
    gearChip(gx, 'BARREL', 'Lv' + G.lv.swivel, GEAR.swivel.col, G.lv.swivel > 0); gx += 100;
    gearChip(gx, 'RAIL', G.lv.rail ? 'Lv' + G.lv.rail : 'LOCK', GEAR.rail.col, G.lv.rail > 0); gx += 100;
    gearChip(gx, 'AIM LINE', G.aimT > 0 ? Math.ceil(G.aimT) + 's' : 'OFF', GEAR.aim.col, G.aimT > 0);
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
    ctx.textAlign = 'center'; ctx.fillStyle = '#ffc24a'; ctx.font = `700 12px ${EN}`;
    ctx.fillText(`HANZI CAPSULES  ${G.capsules} / ${G.goal}`, 640, 652);
    for (let i = 0; i < G.goal; i++) {
      const p = slotPos(i);
      if (G.slots[i]) drawPill(p.x, p.y, 30, 9, Math.PI / 2, '#ffd77a', '#ff9d00', { glow: '#ffb52e', glowSize: 8 });
      else {
        rr(p.x - 9, p.y - 15, 18, 30, 9); ctx.fillStyle = '#101d38'; ctx.fill();
        ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x - 7, p.y); ctx.lineTo(p.x + 7, p.y); ctx.stroke();
      }
    }
    ctx.textAlign = 'right'; ctx.font = `600 12px ${EN}`; ctx.fillStyle = '#5f7396';
    ctx.fillText(`${keyLabel('up')} ${keyLabel('down')} aim · ${keyLabel('fire')} fire · ${keyLabel('pause')} pause`, 1120, 700);
  }

  function drawFloat(f) {
    ctx.globalAlpha = Math.min(1, f.life / (f.max * 0.4));
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const widths = f.lines.map(l => { ctx.font = `${l.w} ${l.s}px ${l.f}`; return ctx.measureText(l.t).width; });
    const bw = Math.max(...widths) + 32, bh = f.lines.reduce((a, l) => a + l.s + 6, 12);
    const x = clamp(f.x, bw / 2 + 200, CAVE_X - bw / 2), y0 = clamp(f.y - bh, FIELD_TOP, FIELD_BOT - bh);
    rr(x - bw / 2, y0, bw, bh, 10); ctx.fillStyle = 'rgba(6,12,30,0.9)'; ctx.fill(); ctx.strokeStyle = f.border; ctx.lineWidth = 2; ctx.stroke();
    let yy = y0 + 6;
    f.lines.forEach(l => { ctx.font = `${l.w} ${l.s}px ${l.f}`; ctx.fillStyle = l.c; yy += l.s / 2 + 3; ctx.fillText(l.t, x, yy); yy += l.s / 2 + 3; });
    ctx.globalAlpha = 1;
  }

  function drawCountdown() {
    const n = Math.ceil(G.countT / 0.6);
    const frac = (G.countT % 0.6) / 0.6;
    ctx.fillStyle = 'rgba(4,10,28,0.35)'; ctx.fillRect(0, 90, W, 550);
    ctx.save(); ctx.translate(640, 360); const sc = 1 + frac * 0.5; ctx.scale(sc, sc);
    ctx.globalAlpha = 0.4 + 0.6 * frac;
    ctx.font = `800 120px ${EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(4,10,28,0.8)'; ctx.strokeText(String(Math.max(1, n)), 0, 0);
    ctx.fillStyle = '#5ff0ff'; ctx.shadowColor = '#00d0ff'; ctx.shadowBlur = 30; ctx.fillText(String(Math.max(1, n)), 0, 0);
    ctx.restore(); ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.save();
    if (G && G.shake) ctx.translate(rand(-8, 8) * G.shake, rand(-8, 8) * G.shake);
    ctx.drawImage(bg, 0, 0);
    if (!G) { ctx.restore(); return; }
    drawBaseFx();
    drawAlertPulse();
    drawShield();
    drawHoles();
    drawReward();
    G.bugs.forEach(drawBug);
    G.swarm.forEach(drawSwarmBug);
    drawCaveFog();
    drawTurret();
    drawSmoke();
    G.shots_.forEach(s => {
      ctx.strokeStyle = '#bff8ff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.shadowColor = '#5ff0ff'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(s.x - s.dx * 34, s.y - s.dy * 34); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.shadowBlur = 0;
    });
    G.parts.forEach(p => { ctx.globalAlpha = Math.max(0, Math.min(1, p.life)); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); });
    ctx.globalAlpha = 1;
    G.flyers.forEach(f => {
      if (f.kind === 'cap') pillHanzi(f.x, f.y, f.t > 0.7 ? Math.max(0.45, 1 - (f.t - 0.7) * 0.8) : 1, f.w.hanzi);
      else {
        const B = GEAR[f.g];
        drawPill(f.x, f.y, 56, 17, 0, B.col, B.dark, { glow: B.col, glowSize: 16, text: B.icon, size: 18, font: EN, weight: 800, textCol: '#ffffff' });
      }
    });
    G.floats.forEach(drawFloat);
    drawHUD();
    if (state === 'count') drawCountdown();
    if (G.goFlash > 0) {
      ctx.globalAlpha = Math.min(1, G.goFlash * 2);
      ctx.font = `800 90px ${EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffc24a'; ctx.shadowColor = '#ff9d00'; ctx.shadowBlur = 24; ctx.fillText('DEFEND!', 640, 360); ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    if (G.toast) {
      ctx.globalAlpha = Math.min(1, G.toast.t);
      ctx.font = `800 28px ${EN}`; ctx.textAlign = 'center';
      const tw = ctx.measureText(G.toast.text).width + 50;
      rr(640 - tw / 2, 110, tw, 50, 14); ctx.fillStyle = 'rgba(6,14,36,0.92)'; ctx.fill(); ctx.strokeStyle = G.toast.col; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = G.toast.col; ctx.textBaseline = 'middle'; ctx.fillText(G.toast.text, 640, 136);
      ctx.globalAlpha = 1;
    }
    if (G.whiteout > 0) { ctx.fillStyle = `rgba(255,220,180,${G.whiteout * 0.8})`; ctx.fillRect(0, 0, W, H); }
    if (G.banner) {
      ctx.font = `800 64px ${EN}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(4,10,28,0.8)'; ctx.strokeText(G.banner.text, 640, 360);
      ctx.fillStyle = G.banner.col; ctx.fillText(G.banner.text, 640, 360);
    }
    ctx.restore();
  }

  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (G && state === 'count') updateCount(dt);
    else if (G && (state === 'play' || state === 'won' || state === 'lost')) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.__hd = { add: (h, x, y, mini) => { const w = { hanzi: h, pinyin: 'test', english: 'test', keys: ['zz' + h], n: charCount(h) }; const b = makeBug(w, x, y, mini); G.bugs.push(b); return b; }, get G() { return G; }, get state() { return state; }, win: () => winGame(), lose: () => { G.base = 0; loseGame(); } };
})();
