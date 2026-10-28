// Levels: '#' tree (blocked), '.' grass, 'R' robot start (facing right), '*' star.
// `blocks` lists the blocks unlocked on that level; `maxBlocks` caps program size.
const BASIC = ['forward', 'left', 'right'];
const LEVELS = [
  {
    name: 'Get the star!',
    hint: 'Tap the blue arrow to move forward, then press Go!',
    blocks: BASIC,
    map: [
      '.....',
      '.....',
      'R...*',
      '.....',
      '.....',
    ],
  },
  {
    name: 'Turn the corner',
    hint: 'Use a turn block to change direction.',
    blocks: BASIC,
    map: [
      '#####',
      'R..##',
      '##.##',
      '##..*',
      '#####',
    ],
  },
  {
    name: 'Zig zag',
    hint: 'Turn left and right to find the way.',
    blocks: BASIC,
    map: [
      '######',
      '#...*#',
      '#.####',
      '#...##',
      '###.##',
      'R...##',
    ],
  },
  {
    name: 'Staircase',
    hint: 'The same steps happen again and again. Put them inside a Repeat block!',
    blocks: [...BASIC, 'repeat'],
    maxBlocks: 6,
    map: [
      '#####*',
      '####..',
      '###..#',
      '##..##',
      '#..###',
      'R.####',
    ],
  },
];

// Blocks the player can use, with SVG icon paths. Text coding comes in later levels.
const BLOCKS = {
  forward: { label: 'Forward', icon: '<path d="M12 20V5"/><path d="M5 11l7-7 7 7"/>' },
  left: { label: 'Turn left', icon: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/>' },
  right: { label: 'Turn right', icon: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0-6 6v5"/>' },
  repeat: { label: 'Repeat', icon: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>' },
};

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // right, down, left, up
const MOVE_MS = 420;
const TURN_MS = 320;
const PAUSE_MS = 110;
const MIN_TIMES = 2;
const MAX_TIMES = 9;
const SIZE = 480; // board size in canvas pixels, before device scaling

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const levelsEl = document.getElementById('levels');
const paletteEl = document.getElementById('palette');
const programEl = document.getElementById('program');
const countEl = document.getElementById('count');
const bubbleEl = document.getElementById('bubble');
const statusEl = document.getElementById('status');
const runBtn = document.getElementById('run');
const clearBtn = document.getElementById('clear');
const soundBtn = document.getElementById('sound');
const winEl = document.getElementById('win');
const nextBtn = document.getElementById('next');
const replayBtn = document.getElementById('replay');

// The program is a list of blocks like { type: 'forward' }.
// A repeat block also has `times` and a `body` list of blocks.
let levelIndex = 0;
let program = [];
let target = null; // the repeat block new blocks go into, or null for the main program
let running = false;
let justAdded = null; // block to animate in on the next render
let errorBlock = null; // block where the robot bumped into something
let robot; // where the robot really is, in whole cells
let view; // where the robot is drawn, mid-animation
let goal;
let trail = [];
let confetti = [];
let completed = new Set(load('robotcode.completed', []));
let muted = load('robotcode.muted', false);

// ---------- Saving progress ----------

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Progress just won't be remembered.
  }
}

// ---------- Sounds ----------

let audio;

function tone(freq, dur, { type = 'sine', delay = 0, vol = 0.12 } = {}) {
  if (muted) return;
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    return;
  }
  const t = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const SOUNDS = {
  add: () => tone(660, 0.12, { type: 'triangle' }),
  remove: () => tone(300, 0.12, { type: 'triangle' }),
  move: () => tone(520, 0.08, { vol: 0.08 }),
  turn: () => tone(400, 0.08, { vol: 0.08 }),
  bonk: () => {
    tone(140, 0.25, { type: 'square', vol: 0.07 });
    tone(90, 0.3, { type: 'square', delay: 0.08, vol: 0.07 });
  },
  oops: () => {
    tone(392, 0.15, { type: 'triangle' });
    tone(330, 0.25, { type: 'triangle', delay: 0.15 });
  },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'triangle', delay: i * 0.1 })),
};

// ---------- Blocks and program ----------

function icon(type) {
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${BLOCKS[type].icon}</svg>`;
}

function makeBlock(type) {
  const el = document.createElement('button');
  el.className = `block ${type}`;
  el.innerHTML = `${icon(type)}<span>${BLOCKS[type].label}</span>`;
  return el;
}

function countBlocks(list) {
  return list.reduce((n, b) => n + 1 + (b.body ? countBlocks(b.body) : 0), 0);
}

function addBlock(type) {
  if (running) return;
  const max = LEVELS[levelIndex].maxBlocks;
  if (max && countBlocks(program) >= max) {
    setStatus(`You can only use ${max} blocks here. Try a Repeat block!`, 'oops');
    SOUNDS.oops();
    return;
  }
  const block = type === 'repeat' ? { type, times: 3, body: [] } : { type };
  (target ? target.body : program).push(block);
  if (type === 'repeat') target = block;
  justAdded = block;
  errorBlock = null;
  SOUNDS.add();
  render();
}

function removeBlock(list, i) {
  if (running) return;
  if (list[i] === target) target = null;
  list.splice(i, 1);
  errorBlock = null;
  SOUNDS.remove();
  render();
}

function render(active = null) {
  // No repeats inside repeats, to keep things simple.
  for (const el of paletteEl.children) {
    el.disabled = running || (el.classList.contains('repeat') && target !== null);
  }

  programEl.classList.toggle('selected', target === null && !running);
  if (program.length === 0) {
    programEl.innerHTML = '<div class="empty">Tap the blocks above to build your program 👆</div>';
  } else {
    programEl.replaceChildren(...program.map((block, i) =>
      block.type === 'repeat'
        ? renderRepeat(block, i, active)
        : renderStep(block, program, i, active)));
  }

  const max = LEVELS[levelIndex].maxBlocks;
  const used = countBlocks(program);
  countEl.textContent = max ? `${used} / ${max} blocks` : '';
  countEl.classList.toggle('full', Boolean(max) && used >= max);
  justAdded = null;
}

function renderStep(block, list, i, active) {
  const el = makeBlock(block.type);
  if (block === justAdded) el.classList.add('pop');
  if (block === errorBlock) el.classList.add('error');
  if (active && active.block === block) el.classList.add('active');
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBlock(list, i);
  });
  return el;
}

function renderRepeat(block, i, active) {
  const box = document.createElement('div');
  box.className = 'repeat-box';
  const selected = target === block && !running;
  const looping = active && active.loop && active.loop.block === block;
  box.classList.toggle('pop', block === justAdded);
  box.classList.toggle('selected', selected);
  box.classList.toggle('looping', Boolean(looping));

  const head = document.createElement('div');
  head.className = 'repeat-head';
  head.innerHTML = looping
    ? `${icon('repeat')} Repeat <span class="round">Round ${active.loop.round} of ${block.times}</span>`
    : `${icon('repeat')} Repeat
       <span class="stepper">
         <button class="less" aria-label="Fewer times">−</button>
         <span class="times">${block.times}</span>
         <button class="more" aria-label="More times">+</button>
       </span> times
       ${selected ? '<button class="done">✓ Done</button>' : ''}
       <button class="remove" aria-label="Remove repeat">✖</button>`;

  const body = document.createElement('div');
  body.className = 'repeat-body';
  if (block.body.length === 0) {
    body.innerHTML = '<div class="empty">Tap blocks to put them in here</div>';
  } else {
    body.append(...block.body.map((child, j) => renderStep(child, block.body, j, active)));
  }
  box.append(head, body);

  const on = (selector, fn) => head.querySelector(selector)?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!running) fn();
  });
  on('.less', () => {
    block.times = Math.max(MIN_TIMES, block.times - 1);
    SOUNDS.turn();
    render();
  });
  on('.more', () => {
    block.times = Math.min(MAX_TIMES, block.times + 1);
    SOUNDS.turn();
    render();
  });
  on('.done', () => {
    target = null;
    render();
  });
  on('.remove', () => removeBlock(program, i));
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    if (running) return;
    target = block;
    render();
  });
  return box;
}

function renderPalette() {
  paletteEl.replaceChildren(...LEVELS[levelIndex].blocks.map((type) => {
    const el = makeBlock(type);
    el.addEventListener('click', () => addBlock(type));
    return el;
  }));
}

function renderLevels() {
  const unlocked = Math.max(-1, ...completed) + 1;
  levelsEl.replaceChildren(...LEVELS.map((level, i) => {
    const el = document.createElement('button');
    el.className = 'level-pill';
    el.textContent = completed.has(i) ? '★' : i + 1;
    el.title = `Level ${i + 1}: ${level.name}`;
    el.setAttribute('aria-label', el.title);
    el.classList.toggle('done', completed.has(i));
    el.classList.toggle('current', i === levelIndex);
    el.classList.toggle('locked', i > unlocked);
    el.disabled = running || i > unlocked;
    el.addEventListener('click', () => loadLevel(i));
    return el;
  }));
}

// Turn the program into the list of single steps the robot will take.
function flatten(list, loop = null, steps = []) {
  for (const block of list) {
    if (block.type === 'repeat') {
      for (let round = 1; round <= block.times; round++) {
        flatten(block.body, { block, round }, steps);
      }
    } else {
      steps.push({ block, loop });
    }
  }
  return steps;
}

// ---------- Levels ----------

function loadLevel(i) {
  if (running) return;
  levelIndex = i;
  const level = LEVELS[i];
  document.getElementById('level-tag').textContent = `Level ${i + 1}`;
  document.getElementById('level-title').textContent = level.name;
  program = [];
  target = null;
  errorBlock = null;
  winEl.hidden = true;
  renderLevels();
  renderPalette();
  render();
  resetRobot();
}

function resetRobot() {
  LEVELS[levelIndex].map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'R') robot = { x, y, dir: 0 };
    if (c === '*') goal = { x, y };
  }));
  view = { x: robot.x, y: robot.y, angle: 0, hop: 0, bump: 0, shake: 0, dizzy: false, happy: false };
  trail = [{ x: robot.x, y: robot.y }];
  confetti = [];
  setStatus(LEVELS[levelIndex].hint);
}

function isBlocked(x, y) {
  const map = LEVELS[levelIndex].map;
  return y < 0 || y >= map.length || x < 0 || x >= map[0].length || map[y][x] === '#';
}

function setStatus(text, kind = '') {
  bubbleEl.className = `bubble ${kind}`;
  statusEl.textContent = text;
  statusEl.classList.remove('say');
  void statusEl.offsetWidth; // restart the pop-in animation
  statusEl.classList.add('say');
}

// ---------- Running the program ----------

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ease(t) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

function tween(ms, fn) {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / ms);
      fn(ease(t), t);
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

function setRunning(value) {
  running = value;
  runBtn.disabled = value;
  clearBtn.disabled = value;
  renderLevels();
  render();
}

async function run() {
  const steps = flatten(program);
  if (steps.length === 0) {
    setStatus('Tap some blocks first! 👆', 'oops');
    SOUNDS.oops();
    return;
  }
  target = null;
  errorBlock = null;
  resetRobot();
  setStatus('Go, robot, go! 🚀');
  setRunning(true);

  for (const step of steps) {
    render(step);
    const type = step.block.type;
    if (type === 'left' || type === 'right') {
      SOUNDS.turn();
      const turn = type === 'left' ? -1 : 1;
      robot.dir = (robot.dir + turn + 4) % 4;
      const from = view.angle;
      await tween(TURN_MS, (e) => { view.angle = from + turn * (Math.PI / 2) * e; });
    } else {
      const [dx, dy] = DIRS[robot.dir];
      if (isBlocked(robot.x + dx, robot.y + dy)) {
        SOUNDS.bonk();
        await tween(150, (e) => { view.bump = 0.2 * e; });
        view.dizzy = true;
        await tween(450, (e, t) => {
          view.bump = 0.2 * (1 - e);
          view.shake = Math.sin(t * Math.PI * 8) * (1 - t) * 6;
        });
        errorBlock = step.block;
        setRunning(false);
        setStatus('Bonk! 🌳 Something is in the way. Try again!', 'oops');
        return;
      }
      SOUNDS.move();
      const fromX = robot.x;
      const fromY = robot.y;
      robot.x += dx;
      robot.y += dy;
      await tween(MOVE_MS, (e, t) => {
        view.x = fromX + dx * e;
        view.y = fromY + dy * e;
        view.hop = Math.sin(t * Math.PI);
      });
      trail.push({ x: robot.x, y: robot.y });
    }
    await wait(PAUSE_MS);
  }

  setRunning(false);
  finish();
}

function finish() {
  if (robot.x !== goal.x || robot.y !== goal.y) {
    setStatus("So close! The robot didn't reach the star. Try again!", 'oops');
    SOUNDS.oops();
    return;
  }
  view.happy = true;
  completed.add(levelIndex);
  save('robotcode.completed', [...completed]);
  renderLevels();
  SOUNDS.win();
  spawnConfetti();
  setStatus('🎉 You got the star!', 'win');
  setTimeout(showWin, 900);
}

function showWin() {
  const last = levelIndex === LEVELS.length - 1;
  document.getElementById('win-title').textContent = last ? 'You did it! 🏆' : 'Super coding!';
  document.getElementById('win-text').textContent = last
    ? 'You finished every level. You are a coding star!'
    : `You solved "${LEVELS[levelIndex].name}" with ${countBlocks(program)} blocks.`;
  nextBtn.hidden = last;
  winEl.hidden = false;
  (last ? replayBtn : nextBtn).focus();
}

// ---------- Drawing the board ----------

function setupCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function layout() {
  const map = LEVELS[levelIndex].map;
  const cell = SIZE / Math.max(map.length, map[0].length);
  return {
    map,
    cell,
    ox: (SIZE - map[0].length * cell) / 2,
    oy: (SIZE - map.length * cell) / 2,
  };
}

function circle(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, w, h, r, fill, stroke, lineWidth) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

// A stable pseudo-random number per cell, so flowers stay put.
function cellHash(x, y) {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

function drawFlower(cx, cy, s, h) {
  const fx = cx + (h % 2 ? 0.24 : -0.24) * s;
  const fy = cy + 0.24 * s;
  const color = ['#ffffff', '#ffb3c7', '#ffe27a'][h % 3];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    circle(fx + Math.cos(a) * s * 0.04, fy + Math.sin(a) * s * 0.04, s * 0.035, color);
  }
  circle(fx, fy, s * 0.03, '#f0a500');
}

function drawTree(cx, cy, s) {
  ellipse(cx, cy + s * 0.32, s * 0.3, s * 0.08, 'rgba(0, 0, 0, 0.15)');
  roundRect(cx - s * 0.06, cy + s * 0.05, s * 0.12, s * 0.27, 3, '#8b5a2b');
  circle(cx - s * 0.16, cy - s * 0.02, s * 0.2, '#2f8f46');
  circle(cx + s * 0.16, cy - s * 0.02, s * 0.2, '#2f8f46');
  circle(cx, cy - s * 0.18, s * 0.24, '#3aa352');
  circle(cx - s * 0.07, cy - s * 0.24, s * 0.1, '#5cc46a');
  circle(cx - s * 0.2, cy - s * 0.05, s * 0.07, '#4fb85c');
}

function starPath(r1, r2, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? r2 : r1;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
}

function drawStar(cx, cy, s, time) {
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
  glow.addColorStop(0, 'rgba(255, 230, 80, 0.6)');
  glow.addColorStop(1, 'rgba(255, 230, 80, 0)');
  circle(cx, cy, s * 0.5, glow);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(Math.sin(time / 700) * 0.15);
  ctx.scale(1 + 0.08 * Math.sin(time / 260), 1 + 0.08 * Math.sin(time / 260));
  starPath(s * 0.3, s * 0.13);
  ctx.fillStyle = '#ffd23f';
  ctx.fill();
  ctx.strokeStyle = '#f0a500';
  ctx.lineWidth = s * 0.035;
  ctx.lineJoin = 'round';
  ctx.stroke();
  circle(-s * 0.07, -s * 0.07, s * 0.04, 'rgba(255, 255, 255, 0.85)');
  ctx.restore();
}

function drawRobot(cx, cy, s, time) {
  const lift = view.hop * s * 0.22;
  const bob = running ? 0 : Math.sin(time / 320) * s * 0.012;
  const y = cy - lift + bob;

  ellipse(cx, cy + s * 0.33, s * 0.26 * (1 - view.hop * 0.35), s * 0.07, 'rgba(0, 0, 0, 0.18)');

  // Arrow on the ground showing which way the robot faces.
  ctx.save();
  ctx.translate(cx, cy + s * 0.05);
  ctx.rotate(view.angle);
  ctx.beginPath();
  ctx.moveTo(s * 0.47, 0);
  ctx.lineTo(s * 0.35, -s * 0.1);
  ctx.lineTo(s * 0.35, s * 0.1);
  ctx.closePath();
  ctx.fillStyle = '#ff5a5f';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.025;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fill();
  ctx.restore();

  // Feet and body.
  ellipse(cx - s * 0.11, y + s * 0.3, s * 0.07, s * 0.04, '#3a4a66');
  ellipse(cx + s * 0.11, y + s * 0.3, s * 0.07, s * 0.04, '#3a4a66');
  roundRect(cx - s * 0.2, y + s * 0.07, s * 0.4, s * 0.22, s * 0.07, '#4c8dff', '#2f5fb8', s * 0.02);
  circle(cx, y + s * 0.18, s * 0.04, view.happy ? '#ffd23f' : '#9fd0ff');

  // Antenna with a blinking light.
  ctx.strokeStyle = '#5b6b88';
  ctx.lineWidth = s * 0.025;
  ctx.beginPath();
  ctx.moveTo(cx, y - s * 0.3);
  ctx.lineTo(cx, y - s * 0.4);
  ctx.stroke();
  const blink = 0.6 + 0.4 * Math.sin(time / 200);
  circle(cx, y - s * 0.42, s * 0.05, `rgba(255, 90, 95, ${blink})`);

  // Head and face screen.
  roundRect(cx - s * 0.27, y - s * 0.32, s * 0.54, s * 0.41, s * 0.12, '#eef3fb', '#5b6b88', s * 0.025);
  roundRect(cx - s * 0.2, y - s * 0.26, s * 0.4, s * 0.28, s * 0.08, '#263247');
  circle(cx - s * 0.14, y - s * 0.04, s * 0.025, 'rgba(255, 120, 160, 0.7)');
  circle(cx + s * 0.14, y - s * 0.04, s * 0.025, 'rgba(255, 120, 160, 0.7)');

  // Eyes look the way the robot faces.
  const ex = Math.cos(view.angle) * s * 0.035;
  const ey = Math.sin(view.angle) * s * 0.025;
  ctx.strokeStyle = view.dizzy ? '#ff7b7b' : '#5ff3ff';
  ctx.lineWidth = s * 0.03;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const x = cx + side * s * 0.085;
    const ey0 = y - s * 0.13;
    if (view.dizzy) {
      const r = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(x - r, ey0 - r);
      ctx.lineTo(x + r, ey0 + r);
      ctx.moveTo(x + r, ey0 - r);
      ctx.lineTo(x - r, ey0 + r);
      ctx.stroke();
    } else if (view.happy) {
      ctx.beginPath();
      ctx.arc(x, ey0 + s * 0.02, s * 0.045, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else if (time % 3400 < 130) {
      ctx.beginPath();
      ctx.moveTo(x - s * 0.045, ey0);
      ctx.lineTo(x + s * 0.045, ey0);
      ctx.stroke();
    } else {
      circle(x + ex, ey0 + ey, s * 0.05, '#5ff3ff');
      circle(x + ex + s * 0.015, ey0 + ey - s * 0.015, s * 0.015, '#ffffff');
    }
  }
}

function spawnConfetti() {
  const { cell, ox, oy } = layout();
  const colors = ['#ff5a5f', '#ffd23f', '#4c8dff', '#22b573', '#b65cf0', '#ff9f1c'];
  for (let i = 0; i < 90; i++) {
    confetti.push({
      x: ox + (goal.x + 0.5) * cell,
      y: oy + (goal.y + 0.5) * cell,
      vx: (Math.random() - 0.5) * 9,
      vy: -Math.random() * 9 - 3,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
    });
  }
}

function drawConfetti() {
  for (const p of confetti) {
    p.vy += 0.25;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.fillStyle = p.color;
    ctx.fillRect(-5, -3, 10, 6);
    ctx.restore();
  }
  confetti = confetti.filter((p) => p.y < SIZE + 20);
}

function draw(time) {
  const { map, cell, ox, oy } = layout();
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Grass tiles first, then everything that stands on them.
  map.forEach((row, y) => [...row].forEach((c, x) => {
    const tx = ox + x * cell;
    const ty = oy + y * cell;
    roundRect(tx + 2, ty + 2, cell - 4, cell - 4, cell * 0.16, (x + y) % 2 ? '#93d66f' : '#a3e07f');
    const h = cellHash(x, y);
    if (c === '.' && h % 5 === 0) drawFlower(tx + cell / 2, ty + cell / 2, cell, h);
  }));

  for (const p of trail) {
    circle(ox + (p.x + 0.5) * cell, oy + (p.y + 0.5) * cell, cell * 0.07, 'rgba(255, 255, 255, 0.6)');
  }

  map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '#') drawTree(ox + (x + 0.5) * cell, oy + (y + 0.5) * cell, cell);
  }));

  drawStar(ox + (goal.x + 0.5) * cell, oy + (goal.y + 0.5) * cell, cell, time);

  const bx = Math.cos(view.angle) * view.bump * cell;
  const by = Math.sin(view.angle) * view.bump * cell;
  drawRobot(ox + (view.x + 0.5) * cell + bx + view.shake, oy + (view.y + 0.5) * cell + by, cell, time);

  drawConfetti();
}

function frame(time) {
  draw(time);
  requestAnimationFrame(frame);
}

// ---------- Wiring up ----------

function updateSoundButton() {
  soundBtn.textContent = muted ? '🔇' : '🔊';
  soundBtn.setAttribute('aria-pressed', String(!muted));
}

runBtn.addEventListener('click', run);
clearBtn.addEventListener('click', () => {
  if (program.length) SOUNDS.remove();
  program = [];
  target = null;
  errorBlock = null;
  render();
  resetRobot();
});
programEl.addEventListener('click', () => {
  if (running) return;
  target = null;
  render();
});
soundBtn.addEventListener('click', () => {
  muted = !muted;
  save('robotcode.muted', muted);
  updateSoundButton();
  SOUNDS.add();
});
nextBtn.addEventListener('click', () => loadLevel(levelIndex + 1));
replayBtn.addEventListener('click', () => {
  winEl.hidden = true;
  resetRobot();
});

setupCanvas();
updateSoundButton();
loadLevel(Math.min(Math.max(-1, ...completed) + 1, LEVELS.length - 1));
requestAnimationFrame(frame);
