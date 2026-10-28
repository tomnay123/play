// Levels: '#' tree and '~' water (both blocked), '.' grass, 'R' robot start
// (facing right), '*' star. Collect every star to win.
// `blocks` lists the blocks unlocked on that level; `maxBlocks` caps program size;
// `intro` shows a "New block!" card the first time the level is played.
const BASIC = ['forward', 'left', 'right'];
const LEVELS = [
  {
    name: 'Get the star!',
    concept: 'Moving',
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
    concept: 'Turning',
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
    concept: 'Planning',
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
    concept: 'Loops',
    hint: 'The same steps happen again and again. Put them inside a Repeat block!',
    blocks: [...BASIC, 'repeat'],
    maxBlocks: 6,
    intro: {
      block: 'repeat',
      title: 'Repeat',
      text: 'Repeat runs the blocks inside it again and again, so you don\'t have to tap them lots of times.',
    },
    map: [
      '#####*',
      '####..',
      '###..#',
      '##..##',
      '#..###',
      'R.####',
    ],
  },
  {
    name: 'Around the pond',
    concept: 'Loops inside loops',
    hint: 'Collect every star! Each side is the same: walk, then turn. Try a Repeat inside a Repeat.',
    blocks: [...BASIC, 'repeat'],
    maxBlocks: 4,
    intro: {
      block: 'repeat',
      title: 'Loops inside loops',
      text: 'You can put a Repeat inside another Repeat! The inside one runs all the way through every time the outside one goes round.',
    },
    map: [
      'R...*',
      '*~~~.',
      '.~~~.',
      '.~~~.',
      '*...*',
    ],
  },
  {
    name: 'The long road',
    concept: 'Repeat until',
    hint: 'This road is too long to count. Keep going until you get the star!',
    blocks: [...BASIC, 'repeat', 'until'],
    maxBlocks: 2,
    intro: {
      block: 'until',
      title: 'Repeat until ⭐',
      text: 'Repeat until ⭐ keeps going round and round until the robot gets the star. No counting needed!',
    },
    map: [
      '###########',
      '#~~~##~~~##',
      'R.........*',
      '##~~###~~##',
      '###########',
    ],
  },
  {
    name: 'Snail shell',
    concept: 'If / otherwise',
    hint: 'Repeat until ⭐: IF there is a path ahead, go forward. OTHERWISE, turn right.',
    blocks: [...BASIC, 'until', 'if'],
    maxBlocks: 4,
    intro: {
      block: 'if',
      title: 'If',
      text: 'If lets the robot decide! It checks something, like "is there a path ahead?", then does one set of blocks for YES and another for NO.',
    },
    map: [
      'R......',
      '######.',
      '.....#.',
      '.###.#.',
      '.#*..#.',
      '.#####.',
      '.......',
    ],
  },
  {
    name: 'Hurdles',
    concept: 'Make your own block',
    hint: 'Teach the robot to hop over a tree in "My block", then use it every time there\'s a tree.',
    blocks: [...BASIC, 'call'],
    maxBlocks: 18,
    intro: {
      block: 'call',
      title: 'My block',
      text: 'Build a new move once in "My block", then use it as many times as you like. Programmers call this a function.',
    },
    map: [
      '#############',
      '#...#...#...#',
      'R.#...#...#.*',
      '#############',
    ],
  },
];

// Blocks the player can use, with SVG icon paths. Text coding comes in later levels.
const BLOCKS = {
  forward: { label: 'Forward', icon: '<path d="M12 20V5"/><path d="M5 11l7-7 7 7"/>' },
  left: { label: 'Turn left', icon: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/>' },
  right: { label: 'Turn right', icon: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0-6 6v5"/>' },
  repeat: { label: 'Repeat', icon: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>' },
  until: { label: 'Until ⭐', icon: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 3v5h-5"/><path d="M12 9l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 11.3l2-.3z"/>' },
  if: { label: 'If', icon: '<path d="M12 2l10 10-10 10L2 12z"/><path d="M10 9.5a2 2 0 1 1 2.8 1.8c-.5.3-.8.8-.8 1.4V13"/><path d="M12 16.5v.01"/>' },
  call: { label: 'My block', icon: '<path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z"/><path d="M19 17v4M17 19h4"/>' },
};
const CONTAINERS = ['repeat', 'until', 'if'];
const CONDITIONS = { ahead: 'path ahead', left: 'path on the left', right: 'path on the right' };

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // right, down, left, up
const MOVE_MS = 420;
const TURN_MS = 320;
const CHECK_MS = 450;
const PAUSE_MS = 110;
const MAX_STEPS = 300; // backup for loops that never reach the star
const MIN_TIMES = 2;
const MAX_TIMES = 9;
const SIZE = 480; // longest board side in canvas pixels, before device scaling

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const levelsEl = document.getElementById('levels');
const paletteEl = document.getElementById('palette');
const programEl = document.getElementById('program');
const fnWrapEl = document.getElementById('fn-wrap');
const fnEl = document.getElementById('fn');
const countEl = document.getElementById('count');
const bubbleEl = document.getElementById('bubble');
const statusEl = document.getElementById('status');
const runBtn = document.getElementById('run');
const clearBtn = document.getElementById('clear');
const soundBtn = document.getElementById('sound');
const winEl = document.getElementById('win');
const nextBtn = document.getElementById('next');
const replayBtn = document.getElementById('replay');
const introEl = document.getElementById('intro');

// A program is a list of blocks like { type: 'forward' }. Container blocks hold
// lists of their own: repeat/until have `body`, if has `body` (yes) and `other` (no).
// `fnBody` is the list of blocks inside "My block".
let levelIndex = 0;
let program = [];
let fnBody = [];
let target = program; // the list that tapped blocks go into
let running = false;
let justAdded = null; // block to animate in on the next render
let errorBlock = null; // block where the robot bumped into something
let robot; // where the robot really is, in whole cells
let view; // where the robot is drawn, mid-animation
let stars = [];
let trail = [];
let confetti = [];
let cell = 0;
let boardW = SIZE;
let boardH = SIZE;
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
  yes: () => tone(880, 0.1, { vol: 0.08 }),
  no: () => tone(240, 0.12, { vol: 0.08 }),
  collect: () => {
    tone(988, 0.12, { type: 'triangle' });
    tone(1319, 0.2, { type: 'triangle', delay: 0.08 });
  },
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
  el.dataset.type = type;
  el.innerHTML = `${icon(type)}<span>${BLOCKS[type].label}</span>`;
  return el;
}

function newBlock(type) {
  if (type === 'repeat') return { type, times: 3, body: [] };
  if (type === 'until') return { type, body: [] };
  if (type === 'if') return { type, cond: 'ahead', body: [], other: [] };
  return { type };
}

function listsOf(block) {
  if (block.type === 'if') return [block.body, block.other];
  return block.body ? [block.body] : [];
}

function countBlocks(list) {
  return list.reduce((n, b) => n + 1 + listsOf(b).reduce((m, l) => m + countBlocks(l), 0), 0);
}

// Is `list` the same as `root`, or somewhere inside it?
function within(list, root) {
  return list === root || root.some((b) => listsOf(b).some((l) => within(list, l)));
}

function totalBlocks() {
  return countBlocks(program) + countBlocks(fnBody);
}

function addBlock(type) {
  if (running) return;
  const max = LEVELS[levelIndex].maxBlocks;
  if (max && totalBlocks() >= max) {
    setStatus(`You can only use ${max} blocks here. Can you find a shorter way?`, 'oops');
    SOUNDS.oops();
    return;
  }
  // "My block" can't use itself, or it would never stop.
  if (type === 'call' && within(target, fnBody)) return;
  const block = newBlock(type);
  target.push(block);
  if (CONTAINERS.includes(type)) target = block.body;
  justAdded = block;
  errorBlock = null;
  SOUNDS.add();
  render();
}

function removeBlock(list, i) {
  if (running) return;
  if (listsOf(list[i]).some((l) => within(target, l))) target = list;
  list.splice(i, 1);
  errorBlock = null;
  SOUNDS.remove();
  render();
}

function select(list) {
  if (running) return;
  target = list;
  render();
}

function render(active = null) {
  for (const el of paletteEl.children) {
    el.disabled = running || (el.dataset.type === 'call' && within(target, fnBody));
  }

  programEl.classList.toggle('selected', target === program && !running);
  programEl.replaceChildren(...renderList(program, active, 'Tap the blocks above to build your program 👆'));

  const hasFn = LEVELS[levelIndex].blocks.includes('call');
  fnWrapEl.hidden = !hasFn;
  if (hasFn) {
    fnEl.classList.toggle('selected', target === fnBody && !running);
    fnEl.classList.toggle('running', Boolean(active?.stack.some((s) => s.block.type === 'call')));
    fnEl.replaceChildren(...renderList(fnBody, active, 'Tap here, then tap blocks to teach the robot a new move ✨'));
  }

  const max = LEVELS[levelIndex].maxBlocks;
  const used = totalBlocks();
  countEl.textContent = max ? `${used} / ${max} blocks` : '';
  countEl.classList.toggle('full', Boolean(max) && used >= max);
  justAdded = null;
}

function renderList(list, active, emptyText) {
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = emptyText;
    return [empty];
  }
  return list.map((block, i) => (CONTAINERS.includes(block.type)
    ? renderContainer(block, list, i, active)
    : renderStep(block, list, i, active)));
}

function renderStep(block, list, i, active) {
  const el = makeBlock(block.type);
  if (block === justAdded) el.classList.add('pop');
  if (block === errorBlock) el.classList.add('error');
  if (active && (active.block === block || active.stack.some((s) => s.block === block))) {
    el.classList.add('active');
  }
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBlock(list, i);
  });
  return el;
}

function renderContainer(block, list, i, active) {
  const box = document.createElement('div');
  box.className = `container ${block.type}`;
  const mine = listsOf(block);
  const entry = active?.stack.find((s) => s.block === block);
  const checking = active?.block === block;
  const selected = !running && mine.includes(target);
  box.classList.toggle('pop', block === justAdded);
  box.classList.toggle('selected', selected);
  box.classList.toggle('looping', Boolean(entry || checking));

  const titles = { repeat: 'Repeat', until: 'Repeat until ⭐', if: 'If' };
  let head = `${icon(block.type)}<span>${titles[block.type]}</span>`;
  if (!running) {
    if (block.type === 'repeat') {
      head += `<span class="stepper">
          <button class="less" aria-label="Fewer times">−</button>
          <span class="times">${block.times}</span>
          <button class="more" aria-label="More times">+</button>
        </span><span>times</span>`;
    }
    if (block.type === 'if') {
      head += `<button class="cond" title="Tap to change">${CONDITIONS[block.cond]}? 🔄</button>`;
    }
    if (selected) head += '<button class="done">✓ Done</button>';
    head += '<button class="remove" aria-label="Remove block">✖</button>';
  } else {
    if (block.type === 'repeat' && !entry) head += `<span>${block.times} times</span>`;
    if (block.type === 'if') head += `<span class="cond">${CONDITIONS[block.cond]}?</span>`;
    const chip = checking ? (active.check ? 'Yes ✓' : 'No ✗') : entry?.label;
    if (chip) head += `<span class="round">${chip}</span>`;
  }
  const headEl = document.createElement('div');
  headEl.className = 'c-head';
  headEl.innerHTML = head;
  box.append(headEl);

  const slots = block.type === 'if'
    ? [['body', 'YES: tap blocks to put them here'], ['other', 'NO: tap blocks to put them here']]
    : [['body', 'Tap blocks to put them in here']];
  for (const [key, emptyText] of slots) {
    if (key === 'other') {
      const label = document.createElement('div');
      label.className = 'arm-label';
      label.textContent = 'otherwise';
      box.append(label);
    }
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.classList.toggle('selected', !running && target === block[key]);
    slot.classList.toggle('taken', entry?.branch === key);
    slot.append(...renderList(block[key], active, emptyText));
    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      select(block[key]);
    });
    box.append(slot);
  }

  const on = (selector, fn) => headEl.querySelector(selector)?.addEventListener('click', (e) => {
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
  on('.cond', () => {
    const keys = Object.keys(CONDITIONS);
    block.cond = keys[(keys.indexOf(block.cond) + 1) % keys.length];
    SOUNDS.turn();
    render();
  });
  on('.done', () => select(list));
  on('.remove', () => removeBlock(list, i));
  box.addEventListener('click', (e) => {
    e.stopPropagation();
    select(mine[0]);
  });
  return box;
}

function renderPalette() {
  const level = LEVELS[levelIndex];
  paletteEl.replaceChildren(...level.blocks.map((type) => {
    const el = makeBlock(type);
    if (level.intro?.block === type) el.insertAdjacentHTML('beforeend', '<b class="new">NEW</b>');
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

// ---------- Levels ----------

function loadLevel(i) {
  if (running) return;
  levelIndex = i;
  const level = LEVELS[i];
  document.getElementById('level-tag').textContent = `Level ${i + 1}`;
  document.getElementById('level-title').textContent = level.name;
  document.getElementById('level-concept').textContent = level.concept;
  program = [];
  fnBody = [];
  target = program;
  errorBlock = null;
  winEl.hidden = true;
  setupCanvas();
  renderLevels();
  renderPalette();
  render();
  resetRobot();
  if (level.intro && !completed.has(i)) showIntro(level.intro);
}

function showIntro(intro) {
  const preview = makeBlock(intro.block);
  preview.tabIndex = -1;
  document.getElementById('intro-block').replaceChildren(preview);
  document.getElementById('intro-title').textContent = intro.title;
  document.getElementById('intro-text').textContent = intro.text;
  introEl.hidden = false;
  document.getElementById('intro-go').focus();
}

function resetRobot() {
  stars = [];
  LEVELS[levelIndex].map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'R') robot = { x, y, dir: 0 };
    if (c === '*') stars.push({ x, y, got: false, gotAt: 0 });
  }));
  view = { x: robot.x, y: robot.y, angle: 0, hop: 0, bump: 0, shake: 0, dizzy: false, happy: false, scan: null };
  trail = [{ x: robot.x, y: robot.y }];
  confetti = [];
  setStatus(LEVELS[levelIndex].hint);
}

function isBlocked(x, y) {
  const map = LEVELS[levelIndex].map;
  return y < 0 || y >= map.length || x < 0 || x >= map[0].length || '#~'.includes(map[y][x]);
}

// Is there a path next to the robot in this direction ('ahead', 'left' or 'right')?
function sense(cond) {
  const turn = { ahead: 0, left: 3, right: 1 }[cond];
  const [dx, dy] = DIRS[(robot.dir + turn) % 4];
  const x = robot.x + dx;
  const y = robot.y + dy;
  const yes = !isBlocked(x, y);
  view.scan = { x, y, yes, at: performance.now() };
  return yes;
}

function setStatus(text, kind = '') {
  bubbleEl.className = `bubble ${kind}`;
  statusEl.textContent = text;
  statusEl.classList.remove('say');
  void statusEl.offsetWidth; // restart the pop-in animation
  statusEl.classList.add('say');
}

// ---------- Running the program ----------

// Walks the program one step at a time. Each step is { block, stack }, where
// stack lists the containers it is inside. It's a generator, so "If" checks
// happen just before they run, after the robot has finished moving.
function* walk(list, stack) {
  for (const block of list) {
    if (block.type === 'repeat') {
      for (let round = 1; round <= block.times; round++) {
        yield* walk(block.body, [...stack, { block, label: `Round ${round} of ${block.times}` }]);
      }
    } else if (block.type === 'until') {
      // Starting a round from the exact same spot as before means the loop
      // will go round in circles forever, so stop it there.
      const seen = new Set();
      for (let round = 1; ; round++) {
        const key = `${robot.x},${robot.y},${robot.dir},${stars.filter((s) => s.got).length}`;
        if (seen.has(key)) {
          yield { block, stack, stuck: true };
          return;
        }
        seen.add(key);
        let didSomething = false;
        for (const step of walk(block.body, [...stack, { block, label: `Round ${round}` }])) {
          didSomething = true;
          yield step;
        }
        if (!didSomething) break;
      }
    } else if (block.type === 'if') {
      const yes = sense(block.cond);
      yield { block, stack, check: yes };
      const branch = yes ? 'body' : 'other';
      yield* walk(block[branch], [...stack, { block, label: yes ? 'Yes ✓' : 'No ✗', branch }]);
    } else if (block.type === 'call') {
      yield* walk(fnBody, [...stack, { block }]);
    } else {
      yield { block, stack };
    }
  }
}

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
  if (program.length === 0) {
    setStatus('Tap some blocks first! 👆', 'oops');
    SOUNDS.oops();
    return;
  }
  target = program;
  errorBlock = null;
  resetRobot();
  setStatus('Go, robot, go! 🚀');
  setRunning(true);

  let count = 0;
  for (const step of walk(program, [])) {
    if (++count > MAX_STEPS) {
      setRunning(false);
      setStatus('Phew! The robot is tired out. Does your loop ever reach the star?', 'oops');
      SOUNDS.oops();
      return;
    }
    render(step);

    if (step.stuck) {
      setRunning(false);
      setStatus('Uh oh, the robot is going round in circles! 🔄 This loop will never reach the star.', 'oops');
      SOUNDS.oops();
      return;
    }
    if ('check' in step) {
      (step.check ? SOUNDS.yes : SOUNDS.no)();
      await wait(CHECK_MS);
      continue;
    }

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

      const star = stars.find((s) => !s.got && s.x === robot.x && s.y === robot.y);
      if (star) {
        star.got = true;
        star.gotAt = performance.now();
        SOUNDS.collect();
        spawnConfetti(star.x, star.y, 25);
        if (stars.every((s) => s.got)) break;
      }
    }
    await wait(PAUSE_MS);
  }

  setRunning(false);
  finish();
}

function finish() {
  const left = stars.filter((s) => !s.got).length;
  if (left > 0) {
    setStatus(stars.length > 1
      ? `So close! ${left} more star${left > 1 ? 's' : ''} to get. Try again!`
      : "So close! The robot didn't reach the star. Try again!", 'oops');
    SOUNDS.oops();
    return;
  }
  view.happy = true;
  completed.add(levelIndex);
  save('robotcode.completed', [...completed]);
  renderLevels();
  SOUNDS.win();
  spawnConfetti(robot.x, robot.y, 90);
  setStatus('🎉 You got the star!', 'win');
  setTimeout(showWin, 900);
}

function showWin() {
  const last = levelIndex === LEVELS.length - 1;
  document.getElementById('win-title').textContent = last ? 'You did it! 🏆' : 'Super coding!';
  document.getElementById('win-text').textContent = last
    ? 'You finished every level. You are a coding star!'
    : `You solved "${LEVELS[levelIndex].name}" with ${totalBlocks()} blocks.`;
  nextBtn.hidden = last;
  winEl.hidden = false;
  (last ? replayBtn : nextBtn).focus();
}

// ---------- Drawing the board ----------

function setupCanvas() {
  const map = LEVELS[levelIndex].map;
  cell = SIZE / Math.max(map.length, map[0].length);
  boardW = map[0].length * cell;
  boardH = map.length * cell;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = boardW * dpr;
  canvas.height = boardH * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function center(x, y) {
  return [(x + 0.5) * cell, (y + 0.5) * cell];
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

function drawWater(x, y, s, time) {
  roundRect(x * s + 2, y * s + 2, s - 4, s - 4, s * 0.16, '#5bc0f0');
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = s * 0.04;
  ctx.lineCap = 'round';
  for (const row of [0.38, 0.65]) {
    const shift = Math.sin(time / 500 + x + y * 2 + row * 5) * s * 0.06;
    ctx.beginPath();
    ctx.moveTo(x * s + s * 0.25 + shift, y * s + s * row);
    ctx.quadraticCurveTo(x * s + s * 0.38 + shift, y * s + s * (row - 0.07), x * s + s * 0.5 + shift, y * s + s * row);
    ctx.quadraticCurveTo(x * s + s * 0.62 + shift, y * s + s * (row + 0.07), x * s + s * 0.75 + shift, y * s + s * row);
    ctx.stroke();
  }
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

function drawStar(star, s, time) {
  // A collected star grows and fades away.
  const since = star.got ? (time - star.gotAt) / 400 : 0;
  if (since >= 1) return;
  const [cx, cy] = center(star.x, star.y);
  ctx.save();
  ctx.globalAlpha = 1 - Math.max(0, since);

  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.5);
  glow.addColorStop(0, 'rgba(255, 230, 80, 0.6)');
  glow.addColorStop(1, 'rgba(255, 230, 80, 0)');
  circle(cx, cy, s * 0.5, glow);

  const pulse = 1 + 0.08 * Math.sin(time / 260) + Math.max(0, since) * 0.8;
  ctx.translate(cx, cy - Math.max(0, since) * s * 0.4);
  ctx.rotate(Math.sin(time / 700) * 0.15);
  ctx.scale(pulse, pulse);
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

// When an "If" looks at a square, flash it green (path) or red (blocked).
function drawScan(s, time) {
  const scan = view.scan;
  if (!scan) return;
  const t = (time - scan.at) / 700;
  if (t >= 1) return;
  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.setLineDash([s * 0.12, s * 0.08]);
  ctx.strokeStyle = scan.yes ? '#22b573' : '#ff5a5f';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.roundRect(scan.x * s + s * 0.08, scan.y * s + s * 0.08, s * 0.84, s * 0.84, s * 0.16);
  ctx.stroke();
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

function spawnConfetti(x, y, amount) {
  const [cx, cy] = center(x, y);
  const colors = ['#ff5a5f', '#ffd23f', '#4c8dff', '#22b573', '#b65cf0', '#ff9f1c'];
  for (let i = 0; i < amount; i++) {
    confetti.push({
      x: cx,
      y: cy,
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
  confetti = confetti.filter((p) => p.y < boardH + 20);
}

function draw(time) {
  const map = LEVELS[levelIndex].map;
  ctx.clearRect(0, 0, boardW, boardH);

  // Ground tiles first, then everything that stands on them.
  map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '~') {
      drawWater(x, y, cell, time);
      return;
    }
    roundRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4, cell * 0.16, (x + y) % 2 ? '#93d66f' : '#a3e07f');
    const h = cellHash(x, y);
    if (c === '.' && h % 5 === 0) drawFlower(...center(x, y), cell, h);
  }));

  for (const p of trail) circle(...center(p.x, p.y), cell * 0.07, 'rgba(255, 255, 255, 0.6)');

  map.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '#') drawTree(...center(x, y), cell);
  }));

  for (const star of stars) drawStar(star, cell, time);
  drawScan(cell, time);

  const [cx, cy] = center(view.x, view.y);
  const bx = Math.cos(view.angle) * view.bump * cell;
  const by = Math.sin(view.angle) * view.bump * cell;
  drawRobot(cx + bx + view.shake, cy + by, cell, time);

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
  if (totalBlocks()) SOUNDS.remove();
  program = [];
  fnBody = [];
  target = program;
  errorBlock = null;
  render();
  resetRobot();
});
programEl.addEventListener('click', () => select(program));
fnEl.addEventListener('click', () => select(fnBody));
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
document.getElementById('intro-go').addEventListener('click', () => {
  introEl.hidden = true;
});

updateSoundButton();
loadLevel(Math.min(Math.max(-1, ...completed) + 1, LEVELS.length - 1));
requestAnimationFrame(frame);
