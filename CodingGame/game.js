// Map tiles: '#' asteroid and '~' open space (both blocked), '.' floor, 'R' robot
// start (facing right), '*' star, 'k' keycard, 'D' locked airlock. Collect every star to win.
//
// Level fields:
// - `blocks`: the blocks unlocked on that level
// - `maxBlocks`: caps program size
// - `conditions`: what an If block can check (defaults to the three paths)
// - `starter`: a program already in place (debugging levels)
// - `maps`: several maps instead of `map`; the program must work on all of them,
//   in a shuffled order each time Go is pressed
// - `intro`: a "New!" card shown until the level is finished
const BASIC = ['forward', 'left', 'right'];
const PATHS = ['ahead', 'left', 'right'];

// Shorthand for writing starter programs.
const steps = (...types) => types.map((type) => ({ type }));

const LEVELS = [
  {
    id: 'move',
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
    id: 'turn',
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
    id: 'zigzag',
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
    id: 'bug-hunt',
    name: 'Bug hunt',
    concept: 'Debugging',
    hint: 'This program has a bug! 🐞 Press Go to see where the robot goes wrong, then fix it.',
    blocks: BASIC,
    maxBlocks: 13,
    starter: steps('forward', 'forward', 'right', 'forward', 'forward', 'right',
      'forward', 'forward', 'right', 'forward', 'forward', 'left', 'forward'),
    intro: {
      emoji: '🐞',
      title: 'Debugging',
      text: 'Programmers call mistakes "bugs". This program has one! Press Go to find it. Then tap the wrong block, tap ✖ to take it out, and add the right block in its place.',
    },
    map: [
      '######',
      'R..###',
      '##.###',
      '##...#',
      '####.#',
      '####.*',
    ],
  },
  {
    id: 'staircase',
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
    id: 'pond',
    name: 'Around the black hole',
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
    id: 'loop-bug',
    name: 'Loop bug',
    concept: 'Debugging loops',
    hint: 'A bug inside a loop happens every round! 🐞 Find the wrong block and fix it.',
    blocks: [...BASIC, 'repeat'],
    maxBlocks: 5,
    starter: [{ type: 'repeat', times: 5, body: steps('forward', 'right', 'forward', 'right') }],
    map: [
      'R.####',
      '#..###',
      '##..##',
      '###..#',
      '####..',
      '#####*',
    ],
  },
  {
    id: 'long-road',
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
    id: 'snail',
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
    id: 'key-door',
    name: 'Keycard and airlock',
    concept: 'Keycards and airlocks',
    hint: 'The airlock is locked. Go and get the keycard first, then open the airlock!',
    blocks: [...BASIC, 'repeat'],
    intro: {
      emoji: '💳',
      title: 'Keycards and airlocks',
      text: 'Airlocks are locked 🔒. Walk over a keycard to pick it up. The robot carries it, and walking into an airlock with a keycard opens it.',
    },
    map: [
      '##k####',
      'R...D.*',
      '#######',
    ],
  },
  {
    id: 'hurdles',
    name: 'Hurdles',
    concept: 'Make your own block',
    hint: 'Teach the robot to hop over a rock in "My block", then use it every time there\'s a rock.',
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
  {
    id: 'shifting-road',
    name: 'Shifting road',
    concept: 'Works on every map',
    hint: 'The road is different on each map! Make a rule: if there\'s a path ahead go forward, otherwise turn left.',
    blocks: [...BASIC, 'repeat', 'until', 'if'],
    maxBlocks: 4,
    intro: {
      emoji: '🗺️',
      title: 'Every map!',
      text: 'This level has 3 maps, and they come in a different order every time you press Go. Your program has to work on all of them, so write a rule, not a list of steps!',
    },
    maps: [
      [
        '##*###',
        '##.###',
        '##.###',
        '##.###',
        'R..###',
      ],
      [
        '######',
        '####*#',
        '####.#',
        '####.#',
        'R....#',
      ],
      [
        '#####*',
        '#####.',
        '#####.',
        '#####.',
        'R.....',
      ],
    ],
  },
  {
    id: 'key-or-not',
    name: 'Keycard or not?',
    concept: 'Remembering',
    hint: 'Sometimes there\'s a keycard, sometimes not. If you have one, use the airlock. Otherwise, take the long way round.',
    blocks: [...BASIC, 'repeat', 'if'],
    conditions: [...PATHS, 'key'],
    intro: {
      block: 'if',
      title: 'Remember the keycard',
      text: 'If can also check what the robot is carrying! Tap the question on an If block until it says "have a key?" (that means a keycard).',
    },
    maps: [
      [
        '#######',
        '#######',
        'Rk.D..*',
      ],
      [
        '##.....',
        '##.###.',
        'R..D..*',
      ],
    ],
  },
  {
    id: 'mystery-maze',
    name: 'Mystery maze',
    concept: 'If inside If',
    hint: 'Path ahead? Go forward. Otherwise: path on the left? Turn left. Otherwise turn right. (Put an If inside "otherwise"!)',
    blocks: [...BASIC, 'until', 'if'],
    maxBlocks: 7,
    maps: [
      [
        '#####*',
        '#####.',
        '#####.',
        '##....',
        '##.###',
        'R..###',
      ],
      [
        '#*####',
        '#.####',
        '#....#',
        '####.#',
        '####.#',
        'R....#',
      ],
      [
        'R...##',
        '###.##',
        '###.##',
        '###...',
        '#####.',
        '#####*',
      ],
    ],
  },
];

// Typed code levels. `mode: 'view'` shows blocks with their Python next to them;
// `mode: 'code'` swaps the blocks for a code editor. `code` is the starting text,
// `snippets` are tap-to-insert commands and `maxLines` caps the lines of code.
const levelMap = (id) => LEVELS.find((level) => level.id === id);
const COMMAND_SNIPPETS = ['forward()', 'turn_left()', 'turn_right()'];

LEVELS.push(
  {
    id: 'code-view',
    name: 'Blocks are code',
    concept: 'Reading code',
    mode: 'view',
    hint: 'Build it with blocks and watch the Python code appear underneath. This is what real code looks like!',
    blocks: [...BASIC, 'repeat'],
    maxBlocks: 6,
    intro: {
      emoji: '🐍',
      title: 'Blocks are code!',
      text: 'Every block is really a line of code. Real programmers type it, often in a language called Python. Build with blocks and watch the code appear.',
    },
    map: [
      '######*',
      '####...',
      '##...##',
      'R..####',
    ],
  },
  {
    id: 'type-it',
    name: 'Type it!',
    concept: 'Typing commands',
    mode: 'code',
    hint: 'Type commands to get the star: forward(), turn_left() and turn_right(). One on each line.',
    blocks: BASIC,
    snippets: COMMAND_SNIPPETS,
    code: '# Type one command on each line.\n# Tip: tap a command above to add it.\nforward()\n',
    intro: {
      emoji: '⌨️',
      title: 'Type your code',
      text: 'Now you\'re the programmer! Type one command on each line. Spelling matters: computers are very fussy!',
    },
    map: [
      'R..##',
      '##.##',
      '##..*',
    ],
  },
  {
    id: 'for-loops',
    name: 'Loop the loop',
    concept: 'for loops',
    mode: 'code',
    hint: 'Climb the stairs with a for loop. Push the steps underneath it in with 4 spaces.',
    blocks: BASIC,
    maxLines: 5,
    snippets: [...COMMAND_SNIPPETS, 'for i in range(3):'],
    code: '# Use a for loop so you don\'t have to type so much!\nfor i in range(3):\n    forward()\n',
    intro: {
      emoji: '🔁',
      title: 'for loops',
      text: 'In code, Repeat is written "for i in range(5):". Every line pushed in (indented) underneath it gets repeated.',
    },
    map: levelMap('staircase').map,
  },
  {
    id: 'typos',
    name: 'Typo trouble',
    concept: 'Syntax errors',
    mode: 'code',
    hint: 'Press Go. The robot will tell you which line has a typo. Fix them one at a time!',
    blocks: BASIC,
    snippets: [...COMMAND_SNIPPETS, 'for i in range(3):'],
    code: '# Oh no, 3 typos! Press Go to find them one at a time.\nfoward()\nforward()\nturn_right\nfor i in range(3)\n    forward()\n',
    intro: {
      emoji: '🔤',
      title: 'Syntax errors',
      text: 'Computers can\'t guess what you meant. One tiny typo, like a missing ( ) or :, stops the whole program. The error message tells you which line to look at.',
    },
    map: [
      'R..#',
      '##.#',
      '##.#',
      '##*#',
    ],
  },
  {
    id: 'while-code',
    name: 'Code that decides',
    concept: 'while and if',
    mode: 'code',
    hint: 'The road changes on every map. while not at_star(): if there\'s a path ahead go forward, else turn left.',
    blocks: BASIC,
    maxLines: 5,
    snippets: [...COMMAND_SNIPPETS, 'while not at_star():', 'if path_ahead():', 'else:'],
    code: '# Make a rule that works on every map.\nwhile not at_star():\n    forward()\n',
    intro: {
      emoji: '🤔',
      title: 'while and if',
      text: '"while not at_star():" is Repeat until ⭐. "if path_ahead():" asks a question, and "else:" is otherwise. Push the lines in carefully!',
    },
    maps: levelMap('shifting-road').maps,
  },
  {
    id: 'def-code',
    name: 'Your own function',
    concept: 'def',
    mode: 'code',
    hint: 'Finish "def hop():" so it hops over a rock, then type hop() each time there\'s a rock.',
    blocks: BASIC,
    maxLines: 20,
    snippets: [...COMMAND_SNIPPETS, 'def hop():', 'hop()'],
    code: 'def hop():\n    turn_left()\n    forward()\n\nforward()\nhop()\n',
    intro: {
      emoji: '✨',
      title: 'def',
      text: '"def hop():" teaches the robot a brand new command called hop. Push its steps in underneath, then type hop() whenever you need it.',
    },
    map: levelMap('hurdles').map,
  },
  {
    id: 'elif',
    name: 'Maze master',
    concept: 'elif',
    mode: 'code',
    hint: 'Path ahead? forward(). elif path on the left? turn_left(). else: turn_right().',
    blocks: BASIC,
    maxLines: 8,
    snippets: [...COMMAND_SNIPPETS, 'while not at_star():', 'if path_ahead():', 'elif path_left():', 'else:'],
    code: '# The final maze! Use if, elif and else.\nwhile not at_star():\n    if path_ahead():\n        forward()\n',
    intro: {
      emoji: '🧭',
      title: 'elif',
      text: '"elif" means "otherwise, if". It only asks its question when the answer above it was No.',
    },
    maps: levelMap('mystery-maze').maps,
  },
);

// Blocks the player can use, with SVG icon paths.
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
const CONDITIONS = {
  ahead: 'path ahead',
  left: 'path on the left',
  right: 'path on the right',
  key: 'have a key',
};

const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // right, down, left, up
const MOVE_MS = 420;
const TURN_MS = 320;
const CHECK_MS = 450;
const PAUSE_MS = 110;
const MAP_DONE_MS = 1100;
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
const testsEl = document.getElementById('tests');
const bubbleEl = document.getElementById('bubble');
const statusEl = document.getElementById('status');
const runBtn = document.getElementById('run');
const clearBtn = document.getElementById('clear');
const soundBtn = document.getElementById('sound');
const winEl = document.getElementById('win');
const nextBtn = document.getElementById('next');
const replayBtn = document.getElementById('replay');
const skipBtn = document.getElementById('skip');
const introEl = document.getElementById('intro');
const blocksUi = document.getElementById('blocks-ui');
const codeUi = document.getElementById('code-ui');
const codeEl = document.getElementById('code');
const codeLayer = document.getElementById('code-layer');
const gutterEl = document.getElementById('gutter');
const snippetsEl = document.getElementById('snippets');
const lineCountEl = document.getElementById('line-count');
const codeViewWrap = document.getElementById('code-view-wrap');
const codeViewEl = document.getElementById('code-view');

// A program is a list of blocks like { type: 'forward' }. Container blocks hold
// lists of their own: repeat/until have `body`, if has `body` (yes) and `other` (no).
// `fnBody` is the list of blocks inside "My block".
let levelIndex = 0;
let program = [];
let fnBody = [];
let target = program; // the list that tapped blocks go into...
let insertAt = 0; // ...and where in that list
let picked = null; // block the player tapped, showing its ✖ button
let running = false;
let justAdded = null; // block to animate in on the next render
let errorBlock = null; // block where the robot bumped into something
let codeErrorLine = null; // line of typed code that didn't make sense
let currentMap; // the map on the board right now
let robot; // where the robot really is, in whole cells, plus how many keys it holds
let view; // where the robot is drawn, mid-animation
let stars = [];
let keys = [];
let doors = [];
let trail = [];
let confetti = [];
let cell = 0;
let boardW = SIZE;
let boardH = SIZE;
let completed = new Set(load('robotcode.done', []));
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

// `to` slides the pitch, for spacey whooshes.
function tone(freq, dur, { type = 'sine', delay = 0, vol = 0.12, to = null } = {}) {
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
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + dur);
}

const SOUNDS = {
  add: () => tone(660, 0.12, { type: 'triangle' }),
  remove: () => tone(300, 0.12, { type: 'triangle' }),
  pick: () => tone(500, 0.06, { type: 'triangle', vol: 0.08 }),
  move: () => tone(260, 0.16, { type: 'sawtooth', vol: 0.035, to: 620 }),
  turn: () => tone(400, 0.08, { vol: 0.08 }),
  yes: () => tone(880, 0.1, { vol: 0.08 }),
  no: () => tone(240, 0.12, { vol: 0.08 }),
  collect: () => {
    tone(988, 0.12, { type: 'triangle' });
    tone(1319, 0.2, { type: 'triangle', delay: 0.08 });
  },
  unlock: () => {
    tone(900, 0.3, { type: 'sawtooth', vol: 0.04, to: 200 });
    tone(1200, 0.12, { type: 'triangle', delay: 0.25 });
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
    setStatus(LEVELS[levelIndex].starter
      ? `Only ${max} blocks allowed. Take out the wrong block first with ✖.`
      : `You can only use ${max} blocks here. Can you find a shorter way?`, 'oops');
    SOUNDS.oops();
    return;
  }
  // "My block" can't use itself, or it would never stop.
  if (type === 'call' && within(target, fnBody)) return;
  const block = newBlock(type);
  const at = Math.min(insertAt, target.length);
  target.splice(at, 0, block);
  insertAt = at + 1;
  if (CONTAINERS.includes(type)) {
    target = block.body;
    insertAt = 0;
  }
  picked = null;
  justAdded = block;
  errorBlock = null;
  SOUNDS.add();
  render();
}

function removeBlock(list, i) {
  if (running) return;
  target = list;
  insertAt = i;
  picked = null;
  list.splice(i, 1);
  errorBlock = null;
  SOUNDS.remove();
  render();
}

// Tapping a block picks it: new blocks then go right after it.
function pickBlock(block, list, i) {
  if (running) return;
  picked = picked === block ? null : block;
  target = list;
  insertAt = i + 1;
  SOUNDS.pick();
  render();
}

function select(list, at = list.length) {
  if (running) return;
  target = list;
  insertAt = at;
  picked = null;
  render();
}

function levelMode() {
  return LEVELS[levelIndex].mode ?? 'blocks';
}

function render(active = null) {
  if (levelMode() === 'code') {
    renderEditor(active?.block.line ?? null);
    return;
  }
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
  if (levelMode() === 'view') renderCodeView(active);
  justAdded = null;
}

function renderList(list, active, emptyText) {
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = emptyText;
    return [empty];
  }
  const els = list.map((block, i) => (CONTAINERS.includes(block.type)
    ? renderContainer(block, list, i, active)
    : renderStep(block, list, i, active)));
  // A blinking marker shows where the next block will go.
  if (!running && list === target) {
    const caret = document.createElement('div');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    els.splice(Math.min(insertAt, els.length), 0, caret);
  }
  return els;
}

function renderStep(block, list, i, active) {
  const el = makeBlock(block.type);
  if (block === justAdded) el.classList.add('pop');
  if (block === errorBlock) el.classList.add('error');
  if (active && (active.block === block || active.stack.some((s) => s.block === block))) {
    el.classList.add('active');
  }
  if (block === picked && !running) {
    el.classList.add('picked');
    el.insertAdjacentHTML('beforeend', '<span class="del" role="button" aria-label="Take out">✖</span>');
  }
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (e.target.closest('.del')) removeBlock(list, i);
    else pickBlock(block, list, i);
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
    const options = LEVELS[levelIndex].conditions ?? PATHS;
    block.cond = options[(options.indexOf(block.cond) + 1) % options.length];
    SOUNDS.turn();
    render();
  });
  on('.done', () => select(list, list.indexOf(block) + 1));
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

// Every level is open, so players can skip ahead or go back whenever they like.
function renderLevels() {
  skipBtn.hidden = levelIndex === LEVELS.length - 1;
  skipBtn.disabled = running;
  const firstCode = LEVELS.findIndex((level) => level.mode);
  levelsEl.replaceChildren(...LEVELS.flatMap((level, i) => {
    const el = document.createElement('button');
    el.className = 'level-pill';
    el.classList.toggle('code', Boolean(level.mode));
    el.textContent = completed.has(level.id) ? '★' : i + 1;
    el.title = `Level ${i + 1}: ${level.name}`;
    el.setAttribute('aria-label', el.title);
    el.classList.toggle('done', completed.has(level.id));
    el.classList.toggle('current', i === levelIndex);
    el.disabled = running;
    el.addEventListener('click', () => loadLevel(i));
    if (i !== firstCode) return [el];
    // Typed code levels come after a little snake.
    const divider = document.createElement('span');
    divider.className = 'level-divider';
    divider.title = 'Typed code levels';
    divider.textContent = '🐍';
    return [divider, el];
  }));
}

// Shows how the program did on each map of a multi-map level.
function renderTests(results) {
  testsEl.hidden = !results;
  if (!results) return;
  const marks = { wait: '', now: '…', pass: ' ✓', fail: ' ✗' };
  testsEl.innerHTML = '<span class="tests-label">Must work on every map:</span>'
    + results.map((r, i) => `<span class="test ${r}">🗺️ ${i + 1}${marks[r]}</span>`).join('');
}

// ---------- Typed code ----------

// A small, Python-flavoured language. It turns into the same blocks as the
// block levels, so one runner works for both.
const COMMANDS = { forward: 'forward', turn_left: 'left', turn_right: 'right' };
const CHECKS = { path_ahead: 'ahead', path_left: 'left', path_right: 'right', has_key: 'key' };
const CHECK_NAMES = Object.fromEntries(Object.entries(CHECKS).map(([name, cond]) => [cond, name]));
const KEYWORDS = new Set(['for', 'in', 'range', 'while', 'not', 'if', 'elif', 'else', 'def', 'pass']);
const HEADERS = ['for', 'while', 'if', 'elif', 'else', 'def'];
const MAX_RANGE = 50;

class CodeError extends Error {
  constructor(line, message) {
    super(message);
    this.line = line;
  }
}

// Lines of code that do something (not blank, not just a # comment).
function codeLines(text) {
  const lines = [];
  text.split('\n').forEach((raw, i) => {
    const code = raw.replace(/#.*/, '').replace(/\t/g, '    ').trimEnd();
    if (code.trim()) lines.push({ num: i + 1, indent: code.length - code.trimStart().length, text: code.trim() });
  });
  return lines;
}

function codeLineCount() {
  return codeLines(codeEl.value).length;
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = old;
    }
  }
  return row[b.length];
}

function unknownName(name, options) {
  const best = options.reduce((a, b) => (editDistance(name, a) <= editDistance(name, b) ? a : b));
  if (editDistance(name, best) <= 2) return `I don't know "${name}". Did you mean ${best}()?`;
  return `I don't know "${name}". Try one of these: ${options.map((o) => `${o}()`).join(', ')}`;
}

// Turns typed code into { program, fnBody }, or throws a CodeError.
function parseCode(text) {
  const lines = codeLines(text);
  let pos = 0;
  let fn = null;
  const calls = [];
  // Functions can be used above where they're made, so find their names first.
  const defined = lines.map((l) => l.text.match(/^def\s+([A-Za-z_]\w*)/)?.[1]).filter(Boolean);

  function parseBody(indent) {
    const list = [];
    while (pos < lines.length && lines[pos].indent >= indent) {
      const line = lines[pos];
      if (line.indent > indent) {
        throw new CodeError(line.num, 'This line is pushed in, but the line above doesn\'t end with a colon :');
      }
      pos++;
      parseStatement(line, list, indent);
    }
    return list;
  }

  // The pushed-in lines under a line ending in a colon.
  function body(line, indent) {
    const next = lines[pos];
    if (!next || next.indent <= indent) {
      throw new CodeError(line.num, 'The lines under this one need to be pushed in with 4 spaces.');
    }
    return parseBody(next.indent);
  }

  function parseIf(line, cond, indent) {
    const m = cond.match(/^\s+([A-Za-z_]\w*)\s*\(\s*\)\s*:$/);
    if (!m) throw new CodeError(line.num, 'Write it like this: if path_ahead():');
    if (!CHECKS[m[1]]) throw new CodeError(line.num, unknownName(m[1], Object.keys(CHECKS)));
    const node = { type: 'if', cond: CHECKS[m[1]], body: body(line, indent), other: [], line: line.num };
    const next = lines[pos];
    if (next && next.indent === indent && /^(elif|else)\b/.test(next.text)) {
      pos++;
      if (!next.text.endsWith(':')) throw new CodeError(next.num, 'Add a colon : at the end of this line.');
      if (next.text.startsWith('elif')) {
        node.other = [parseIf(next, next.text.slice(4), indent)];
      } else {
        if (!/^else\s*:$/.test(next.text)) throw new CodeError(next.num, 'Write it like this: else:');
        node.other = body(next, indent);
      }
    }
    return node;
  }

  function parseStatement(line, list, indent) {
    const t = line.text;
    const word = t.match(/^[A-Za-z_]\w*/)?.[0];
    if (HEADERS.includes(word) && !t.endsWith(':')) {
      throw new CodeError(line.num, 'Add a colon : at the end of this line.');
    }

    if (word === 'for') {
      const m = t.match(/^for\s+[A-Za-z_]\w*\s+in\s+range\s*\(\s*(\d+)\s*\)\s*:$/);
      if (!m) throw new CodeError(line.num, 'Write loops like this: for i in range(3):');
      const times = Number(m[1]);
      if (times < 1 || times > MAX_RANGE) throw new CodeError(line.num, `Pick a number from 1 to ${MAX_RANGE}.`);
      list.push({ type: 'repeat', times, body: body(line, indent), line: line.num });
    } else if (word === 'while') {
      if (!/^while\s+not\s+at_star\s*\(\s*\)\s*:$/.test(t)) {
        throw new CodeError(line.num, 'The robot knows this while loop: while not at_star():');
      }
      list.push({ type: 'until', body: body(line, indent), line: line.num });
    } else if (word === 'if') {
      list.push(parseIf(line, t.slice(2), indent));
    } else if (word === 'elif' || word === 'else') {
      throw new CodeError(line.num, `"${word}" needs an "if" just above it, pushed in the same amount.`);
    } else if (word === 'def') {
      const m = t.match(/^def\s+([A-Za-z_]\w*)\s*\(\s*\)\s*:$/);
      if (!m) throw new CodeError(line.num, 'Write functions like this: def hop():');
      if (indent > 0) throw new CodeError(line.num, 'Start "def" at the very beginning of the line.');
      if (fn) throw new CodeError(line.num, 'You can only make one function in this level.');
      if (COMMANDS[m[1]] || CHECKS[m[1]] || KEYWORDS.has(m[1])) {
        throw new CodeError(line.num, `"${m[1]}" is already taken. Pick a new name, like hop.`);
      }
      fn = { name: m[1], line: line.num };
      fn.body = body(line, indent);
    } else if (t !== 'pass') {
      const m = t.match(/^([A-Za-z_]\w*)\s*\(\s*\)$/);
      if (!m) {
        if (/^[A-Za-z_]\w*$/.test(t)) throw new CodeError(line.num, `Add ( ) to make the robot do it: ${t}()`);
        throw new CodeError(line.num, 'I don\'t understand this line. Check the spelling and brackets.');
      }
      const name = m[1];
      if (COMMANDS[name]) {
        list.push({ type: COMMANDS[name], line: line.num });
      } else if (CHECKS[name] || name === 'at_star') {
        throw new CodeError(line.num, `${name}() is a question. Use it after "if" or "while".`);
      } else if (!defined.includes(name)) {
        throw new CodeError(line.num, unknownName(name, [...Object.keys(COMMANDS), ...defined]));
      } else {
        const call = { type: 'call', name, line: line.num };
        calls.push(call);
        list.push(call);
      }
    }
  }

  const program = parseBody(0);
  for (const call of calls) {
    if (call.name !== fn?.name) {
      throw new CodeError(call.line, unknownName(call.name, [...Object.keys(COMMANDS), ...(fn ? [fn.name] : [])]));
    }
  }
  const hasCall = (list) => list.some((b) => b.type === 'call' || listsOf(b).some(hasCall));
  if (fn && hasCall(fn.body)) {
    throw new CodeError(fn.line, `${fn.name}() can't use itself here, or it would never stop.`);
  }
  return { program, fnBody: fn?.body ?? [] };
}

// Checks the typed code and loads it as the program. Returns false if it can't run.
function compileCode() {
  const level = LEVELS[levelIndex];
  const used = codeLineCount();
  try {
    if (used === 0) throw new CodeError(null, 'Type some code first! ⌨️');
    if (level.maxLines && used > level.maxLines) {
      throw new CodeError(null, `Use ${level.maxLines} lines of code or fewer (you have ${used}). Can a loop help?`);
    }
    ({ program, fnBody } = parseCode(codeEl.value));
    return true;
  } catch (err) {
    if (!(err instanceof CodeError)) throw err;
    codeErrorLine = err.line;
    setStatus(err.line ? `Line ${err.line}: ${err.message}` : err.message, 'oops');
    SOUNDS.oops();
    render();
    return false;
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}

// Colours one line of code.
function highlight(text) {
  return text.replace(/(#.*$)|(\b\d+\b)|([A-Za-z_]\w*)|([&<>])/g, (m, comment, num, word, ch) => {
    if (comment) return `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    if (num) return `<span class="tok-num">${num}</span>`;
    if (ch) return escapeHtml(ch);
    if (KEYWORDS.has(word)) return `<span class="tok-kw">${word}</span>`;
    if (COMMANDS[word]) return `<span class="tok-cmd">${word}</span>`;
    if (CHECKS[word] || word === 'at_star') return `<span class="tok-check">${word}</span>`;
    return `<span class="tok-name">${word}</span>`;
  });
}

function lineHtml(html, { active = false, error = false, number = null } = {}) {
  const cls = `line${active ? ' active' : ''}${error ? ' error' : ''}`;
  const ln = number === null ? '' : `<span class="ln">${number}</span>`;
  return `<span class="${cls}">${ln}${html || ' '}</span>`;
}

function renderEditor(activeLine) {
  const lines = codeEl.value.split('\n');
  const errorLine = codeErrorLine ?? errorBlock?.line ?? null;
  codeLayer.innerHTML = lines.map((text, i) => lineHtml(highlight(text), {
    active: running && i + 1 === activeLine,
    error: !running && i + 1 === errorLine,
  })).join('');
  gutterEl.innerHTML = lines.map((_, i) => `<span>${i + 1}</span>`).join('');

  const max = LEVELS[levelIndex].maxLines;
  const used = codeLineCount();
  lineCountEl.textContent = max ? `${used} / ${max} lines` : `${used} line${used === 1 ? '' : 's'}`;
  lineCountEl.classList.toggle('full', Boolean(max) && used > max);
}

// Writes the block program out as Python, remembering which block is on each line.
function toPython(list, depth, out) {
  const pad = '    '.repeat(depth);
  if (list.length === 0) out.push({ text: `${pad}pass`, block: null });
  for (const block of list) {
    if (block.type === 'repeat') {
      out.push({ text: `${pad}for i in range(${block.times}):`, block });
      toPython(block.body, depth + 1, out);
    } else if (block.type === 'until') {
      out.push({ text: `${pad}while not at_star():`, block });
      toPython(block.body, depth + 1, out);
    } else if (block.type === 'if') {
      ifToPython(block, depth, out, 'if');
    } else if (block.type === 'call') {
      out.push({ text: `${pad}my_block()`, block });
    } else {
      const name = Object.keys(COMMANDS).find((k) => COMMANDS[k] === block.type);
      out.push({ text: `${pad}${name}()`, block });
    }
  }
}

function ifToPython(block, depth, out, keyword) {
  const pad = '    '.repeat(depth);
  out.push({ text: `${pad}${keyword} ${CHECK_NAMES[block.cond]}():`, block });
  toPython(block.body, depth + 1, out);
  if (block.other.length === 1 && block.other[0].type === 'if') {
    ifToPython(block.other[0], depth, out, 'elif');
  } else if (block.other.length) {
    out.push({ text: `${pad}else:`, block: null });
    toPython(block.other, depth + 1, out);
  }
}

function renderCodeView(active) {
  const out = [];
  if (program.length === 0) {
    out.push({ text: '# Your code will appear here', block: null });
  } else {
    if (fnBody.length) {
      out.push({ text: 'def my_block():', block: null });
      toPython(fnBody, 1, out);
      out.push({ text: '', block: null });
    }
    toPython(program, 0, out);
  }
  codeViewEl.innerHTML = out.map((line, i) => lineHtml(highlight(line.text), {
    active: Boolean(active && line.block && active.block === line.block),
    error: Boolean(errorBlock && line.block === errorBlock),
    number: i + 1,
  })).join('');
}

function draftKey() {
  return `robotcode.code.${LEVELS[levelIndex].id}`;
}

function loadCode() {
  const level = LEVELS[levelIndex];
  codeEl.value = load(draftKey(), level.code);
  codeErrorLine = null;
  snippetsEl.replaceChildren(...(level.snippets ?? []).map((text) => {
    const el = document.createElement('button');
    el.className = 'snippet';
    el.innerHTML = highlight(text);
    el.addEventListener('click', () => insertSnippet(text));
    return el;
  }));
}

function onCodeInput() {
  save(draftKey(), codeEl.value);
  codeErrorLine = null;
  errorBlock = null;
  render();
}

function replaceCode(start, end, text) {
  codeEl.setRangeText(text, start, end, 'end');
  onCodeInput();
}

function currentLine() {
  const value = codeEl.value;
  const pos = codeEl.selectionStart;
  const start = value.lastIndexOf('\n', pos - 1) + 1;
  const end = value.indexOf('\n', pos) === -1 ? value.length : value.indexOf('\n', pos);
  return { start, end, pos, text: value.slice(start, end), before: value.slice(start, pos) };
}

// Tapping a snippet adds it on a new line, pushed in to match the code around it.
function insertSnippet(text) {
  if (running) return;
  const line = currentLine();
  const indent = line.text.match(/^ */)[0];
  let insert;
  let start = line.end;
  let newIndent = indent;
  if (line.text.trim() === '') {
    start = line.start;
    insert = indent + text;
  } else {
    if (line.text.trimEnd().endsWith(':')) newIndent += '    ';
    insert = `\n${newIndent}${text}`;
  }
  if (text.endsWith(':')) insert += `\n${newIndent}    `;
  codeEl.focus();
  replaceCode(start, line.end, insert);
  SOUNDS.add();
}

// Makes typing friendlier: Tab adds spaces, Enter keeps the indent (and adds
// more after a colon), Backspace removes a whole indent step.
function onCodeKey(e) {
  if (running) return;
  const line = currentLine();
  if (e.key === 'Tab') {
    e.preventDefault();
    replaceCode(codeEl.selectionStart, codeEl.selectionEnd, '    ');
  } else if (e.key === 'Enter') {
    e.preventDefault();
    let indent = line.before.match(/^ */)[0].length;
    if (line.before.trimEnd().endsWith(':')) indent += 4;
    replaceCode(codeEl.selectionStart, codeEl.selectionEnd, `\n${' '.repeat(indent)}`);
  } else if (e.key === 'Backspace' && codeEl.selectionStart === codeEl.selectionEnd
    && /^ +$/.test(line.before) && line.before.length % 4 === 0) {
    e.preventDefault();
    replaceCode(line.pos - 4, line.pos, '');
  }
}

// ---------- Levels ----------

function loadLevel(i) {
  if (running) return;
  levelIndex = i;
  const level = LEVELS[i];
  document.getElementById('level-tag').textContent = `Level ${i + 1}`;
  document.getElementById('level-title').textContent = level.name;
  document.getElementById('level-concept').textContent = level.concept;
  clearBtn.textContent = level.starter || level.code ? '↺ Reset' : 'Clear';
  const mode = level.mode ?? 'blocks';
  blocksUi.hidden = mode === 'code';
  codeUi.hidden = mode !== 'code';
  codeViewWrap.hidden = mode !== 'view';
  if (mode === 'code') loadCode();
  resetProgram();
  errorBlock = null;
  winEl.hidden = true;
  useMap(level.maps ? level.maps[0] : level.map);
  renderTests(level.maps ? level.maps.map(() => 'wait') : null);
  renderLevels();
  renderPalette();
  render();
  resetRobot();
  if (level.intro && !completed.has(level.id)) showIntro(level.intro);
}

function resetProgram() {
  const starter = LEVELS[levelIndex].starter;
  program = starter ? structuredClone(starter) : [];
  fnBody = [];
  target = program;
  insertAt = program.length;
  picked = null;
}

function showIntro(intro) {
  const preview = intro.block ? makeBlock(intro.block) : document.createElement('div');
  if (intro.block) preview.tabIndex = -1;
  else {
    preview.className = 'intro-emoji';
    preview.textContent = intro.emoji;
  }
  document.getElementById('intro-block').replaceChildren(preview);
  document.getElementById('intro-title').textContent = intro.title;
  document.getElementById('intro-text').textContent = intro.text;
  introEl.hidden = false;
  document.getElementById('intro-go').focus();
}

function useMap(map) {
  currentMap = map;
  setupCanvas();
}

function resetRobot() {
  stars = [];
  keys = [];
  doors = [];
  currentMap.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === 'R') robot = { x, y, dir: 0, keys: 0 };
    if (c === '*') stars.push({ x, y, got: false, gotAt: 0 });
    if (c === 'k') keys.push({ x, y, got: false, gotAt: 0 });
    if (c === 'D') doors.push({ x, y, open: false });
  }));
  view = { x: robot.x, y: robot.y, angle: 0, hop: 0, bump: 0, shake: 0, dizzy: false, happy: false, scan: null };
  trail = [{ x: robot.x, y: robot.y }];
  confetti = [];
  setStatus(LEVELS[levelIndex].hint);
}

function doorAt(x, y) {
  return doors.find((d) => d.x === x && d.y === y);
}

function isBlocked(x, y) {
  if (y < 0 || y >= currentMap.length || x < 0 || x >= currentMap[0].length) return true;
  if ('#~'.includes(currentMap[y][x])) return true;
  const door = doorAt(x, y);
  return Boolean(door && !door.open);
}

// Answers an If block's question. Path checks look at the square next to the robot.
function sense(cond) {
  if (cond === 'key') return robot.keys > 0;
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
        const got = stars.filter((s) => s.got).length;
        const key = `${robot.x},${robot.y},${robot.dir},${robot.keys},${got}`;
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

function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function setRunning(value) {
  running = value;
  runBtn.disabled = value;
  clearBtn.disabled = value;
  codeEl.readOnly = value;
  for (const el of snippetsEl.children) el.disabled = value;
  renderLevels();
  render();
}

// Runs the program on every map of the level (just one for most levels).
async function run() {
  if (levelMode() === 'code' && !compileCode()) return;
  if (program.length === 0) {
    setStatus('Tap some blocks first! 👆', 'oops');
    SOUNDS.oops();
    return;
  }
  const level = LEVELS[levelIndex];
  const maps = shuffle(level.maps ?? [level.map]);
  const results = maps.map(() => 'wait');
  picked = null;
  errorBlock = null;
  setRunning(true);

  for (let n = 0; n < maps.length; n++) {
    useMap(maps[n]);
    resetRobot();
    results[n] = 'now';
    if (level.maps) renderTests(results);
    setStatus(level.maps ? `Map ${n + 1} of ${maps.length}. Go, robot, go! 🚀` : 'Go, robot, go! 🚀');

    const ok = await runOnce();
    results[n] = ok ? 'pass' : 'fail';
    if (level.maps) renderTests(results);
    if (!ok) {
      setRunning(false);
      return;
    }
    if (n < maps.length - 1) {
      view.happy = true;
      setStatus(`Map ${n + 1} done! ✓ Now the next map…`, 'win');
      await wait(MAP_DONE_MS);
    }
  }

  setRunning(false);
  finish();
}

// Runs the program once on the current map. Returns true if every star was collected.
async function runOnce() {
  let count = 0;
  for (const step of walk(program, [])) {
    if (++count > MAX_STEPS) {
      setStatus('Phew! The robot is tired out. Does your loop ever reach the star?', 'oops');
      SOUNDS.oops();
      return false;
    }
    render(step);

    if (step.stuck) {
      setStatus('Uh oh, the robot is going round in circles! 🔄 This loop will never reach the star.', 'oops');
      SOUNDS.oops();
      return false;
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
      const door = doorAt(robot.x + dx, robot.y + dy);
      if (door && !door.open && robot.keys > 0) {
        robot.keys--;
        door.open = true;
        SOUNDS.unlock();
        setStatus('Whoosh! The airlock is open 🔓');
      }
      if (isBlocked(robot.x + dx, robot.y + dy)) {
        SOUNDS.bonk();
        await tween(150, (e) => { view.bump = 0.2 * e; });
        view.dizzy = true;
        await tween(450, (e, t) => {
          view.bump = 0.2 * (1 - e);
          view.shake = Math.sin(t * Math.PI * 8) * (1 - t) * 6;
        });
        errorBlock = step.block;
        setStatus(door
          ? 'The airlock is locked! 🔒 The robot needs a keycard first.'
          : 'Bonk! 🪨 Something is in the way. Try again!', 'oops');
        return false;
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

      const key = keys.find((k) => !k.got && k.x === robot.x && k.y === robot.y);
      if (key) {
        key.got = true;
        key.gotAt = performance.now();
        robot.keys++;
        SOUNDS.collect();
        setStatus('Got a keycard! 💳');
      }
      const star = stars.find((s) => !s.got && s.x === robot.x && s.y === robot.y);
      if (star) {
        star.got = true;
        star.gotAt = performance.now();
        SOUNDS.collect();
        spawnConfetti(star.x, star.y, 25);
        if (stars.every((s) => s.got)) return true;
      }
    }
    await wait(PAUSE_MS);
  }

  const left = stars.filter((s) => !s.got).length;
  setStatus(stars.length > 1
    ? `So close! ${left} more star${left > 1 ? 's' : ''} to get. Try again!`
    : "So close! The robot didn't reach the star. Try again!", 'oops');
  SOUNDS.oops();
  return false;
}

function finish() {
  view.happy = true;
  completed.add(LEVELS[levelIndex].id);
  save('robotcode.done', [...completed]);
  renderLevels();
  SOUNDS.win();
  spawnConfetti(robot.x, robot.y, 90);
  setStatus(LEVELS[levelIndex].maps ? '🎉 It works on every map!' : '🎉 You got the star!', 'win');
  setTimeout(showWin, 900);
}

function showWin() {
  const last = levelIndex === LEVELS.length - 1;
  document.getElementById('win-title').textContent = last ? 'All missions complete! 🏆' : 'Mission complete!';
  document.getElementById('win-text').textContent = last
    ? 'You finished the last level. You are a coding star!'
    : `You solved "${LEVELS[levelIndex].name}" with ${levelMode() === 'code'
      ? `${codeLineCount()} lines of code`
      : `${totalBlocks()} blocks`}.`;
  nextBtn.hidden = last;
  winEl.hidden = false;
  (last ? replayBtn : nextBtn).focus();
}

// ---------- Drawing the board ----------

function setupCanvas() {
  cell = SIZE / Math.max(currentMap.length, currentMap[0].length);
  boardW = currentMap[0].length * cell;
  boardH = currentMap.length * cell;
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

// A stable pseudo-random number per cell, so floor lights and rocks stay put.
function cellHash(x, y) {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}

// A metal floor plate with bolts in the corners.
function drawFloor(x, y, s) {
  const px = x * s;
  const py = y * s;
  const fill = ctx.createLinearGradient(px, py, px, py + s);
  fill.addColorStop(0, (x + y) % 2 ? '#26306a' : '#2b3676');
  fill.addColorStop(1, (x + y) % 2 ? '#1a2253' : '#1e275c');
  roundRect(px + 2, py + 2, s - 4, s - 4, s * 0.12, fill, 'rgba(120, 160, 255, 0.28)', 1.5);
  for (const [bx, by] of [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]]) {
    circle(px + s * bx, py + s * by, s * 0.025, 'rgba(160, 190, 255, 0.35)');
  }
}

// Some floor plates have a small blinking light.
function drawFloorLight(x, y, s, h, time) {
  const lx = (x + (h % 2 ? 0.72 : 0.28)) * s;
  const ly = (y + 0.72) * s;
  const color = ['45, 226, 255', '255, 79, 216', '110, 240, 168'][h % 3];
  const glow = 0.45 + 0.4 * Math.sin(time / 500 + h);
  circle(lx, ly, s * 0.07, `rgba(${color}, ${glow * 0.3})`);
  circle(lx, ly, s * 0.03, `rgba(${color}, ${glow + 0.2})`);
}

// Open space: a hole in the station floor, full of twinkling stars.
function drawVoid(x, y, s, time) {
  const px = x * s;
  const py = y * s;
  const fill = ctx.createRadialGradient(px + s / 2, py + s / 2, 0, px + s / 2, py + s / 2, s * 0.7);
  fill.addColorStop(0, '#1a0b3d');
  fill.addColorStop(1, '#03030f');
  roundRect(px + 2, py + 2, s - 4, s - 4, s * 0.12, fill, 'rgba(166, 107, 255, 0.55)', 2);
  const h = cellHash(x, y);
  for (let i = 0; i < 5; i++) {
    const sx = px + s * (0.15 + (((h >> (i * 3)) & 7) / 7) * 0.7);
    const sy = py + s * (0.15 + (((h >> (i * 3 + 9)) & 7) / 7) * 0.7);
    const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(time / 600 + i * 1.7 + h));
    circle(sx, sy, s * 0.018, `rgba(255, 255, 255, ${twinkle})`);
  }
}

// An asteroid: a lumpy grey rock with craters.
function drawRock(cx, cy, s, h) {
  ellipse(cx, cy + s * 0.3, s * 0.32, s * 0.08, 'rgba(0, 0, 0, 0.35)');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((h % 628) / 100);
  ctx.beginPath();
  const bumps = 9;
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const r = s * (0.32 + (((h >> i) & 3) / 3) * 0.07);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const fill = ctx.createRadialGradient(-s * 0.12, -s * 0.12, s * 0.05, 0, 0, s * 0.4);
  fill.addColorStop(0, '#9aa3c4');
  fill.addColorStop(1, '#4a5275');
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = '#2e3452';
  ctx.lineWidth = s * 0.025;
  ctx.lineJoin = 'round';
  ctx.stroke();
  circle(s * 0.1, s * 0.06, s * 0.08, 'rgba(46, 52, 82, 0.55)');
  circle(-s * 0.12, s * 0.12, s * 0.05, 'rgba(46, 52, 82, 0.5)');
  circle(-s * 0.05, -s * 0.15, s * 0.04, 'rgba(46, 52, 82, 0.45)');
  ctx.restore();
}

// An airlock door. Locked ones show a red light; open ones slide apart.
function drawDoor(door, s, time) {
  const x = door.x * s;
  const y = door.y * s;
  roundRect(x + s * 0.08, y + s * 0.06, s * 0.84, s * 0.88, s * 0.1, '#3a4270', '#7c8bd6', s * 0.025);
  if (door.open) {
    roundRect(x + s * 0.16, y + s * 0.14, s * 0.68, s * 0.72, s * 0.06, '#050818');
    roundRect(x + s * 0.1, y + s * 0.12, s * 0.1, s * 0.76, s * 0.03, '#8d9ad8');
    roundRect(x + s * 0.8, y + s * 0.12, s * 0.1, s * 0.76, s * 0.03, '#8d9ad8');
    circle(x + s * 0.5, y + s * 0.2, s * 0.05, '#6ef0a8');
    return;
  }
  roundRect(x + s * 0.16, y + s * 0.14, s * 0.33, s * 0.72, s * 0.05, '#8d9ad8', '#5b67a8', s * 0.015);
  roundRect(x + s * 0.51, y + s * 0.14, s * 0.33, s * 0.72, s * 0.05, '#8d9ad8', '#5b67a8', s * 0.015);
  ctx.fillStyle = 'rgba(255, 210, 63, 0.85)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + s * 0.18, y + s * (0.3 + i * 0.16), s * 0.64, s * 0.04);
  }
  const blink = 0.55 + 0.45 * Math.sin(time / 250);
  circle(x + s * 0.5, y + s * 0.2, s * 0.08, `rgba(255, 77, 109, ${blink * 0.35})`);
  circle(x + s * 0.5, y + s * 0.2, s * 0.045, `rgba(255, 77, 109, ${blink})`);
}

// A keycard that opens airlocks.
function drawKey(cx, cy, s, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.25);
  ctx.scale(scale, scale);
  roundRect(-s * 0.2, -s * 0.13, s * 0.4, s * 0.26, s * 0.05, '#2de2ff', '#e6fbff', s * 0.02);
  roundRect(-s * 0.15, -s * 0.06, s * 0.1, s * 0.08, s * 0.015, '#ffd23f');
  roundRect(s * 0.0, -s * 0.07, s * 0.15, s * 0.03, s * 0.01, 'rgba(10, 30, 60, 0.6)');
  roundRect(s * 0.0, s * 0.0, s * 0.11, s * 0.03, s * 0.01, 'rgba(10, 30, 60, 0.6)');
  ctx.restore();
}

function drawPickup(item, s, time) {
  const since = item.got ? (time - item.gotAt) / 400 : 0;
  if (since >= 1) return;
  const [cx, cy] = center(item.x, item.y);
  ctx.save();
  ctx.globalAlpha = 1 - Math.max(0, since);
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 0.45);
  glow.addColorStop(0, 'rgba(45, 226, 255, 0.55)');
  glow.addColorStop(1, 'rgba(45, 226, 255, 0)');
  circle(cx, cy, s * 0.45, glow);
  drawKey(cx, cy + Math.sin(time / 300) * s * 0.04 - Math.max(0, since) * s * 0.4, s, 1 + Math.max(0, since) * 0.5);
  ctx.restore();
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

  // A soft glow on the floor under the robot.
  const shadow = ctx.createRadialGradient(cx, cy + s * 0.33, 0, cx, cy + s * 0.33, s * 0.3);
  shadow.addColorStop(0, 'rgba(45, 226, 255, 0.45)');
  shadow.addColorStop(1, 'rgba(45, 226, 255, 0)');
  ellipse(cx, cy + s * 0.33, s * 0.3 * (1 - view.hop * 0.3), s * 0.09, shadow);

  // Arrow on the floor showing which way the robot faces.
  ctx.save();
  ctx.translate(cx, cy + s * 0.05);
  ctx.rotate(view.angle);
  ctx.beginPath();
  ctx.moveTo(s * 0.47, 0);
  ctx.lineTo(s * 0.35, -s * 0.1);
  ctx.lineTo(s * 0.35, s * 0.1);
  ctx.closePath();
  ctx.fillStyle = '#ff4fd8';
  ctx.shadowColor = '#ff4fd8';
  ctx.shadowBlur = s * 0.2;
  ctx.fill();
  ctx.restore();

  // Rocket flames while hopping between squares.
  if (view.hop > 0.05) {
    for (const side of [-1, 1]) {
      const fx = cx + side * s * 0.1;
      const fy = y + s * 0.33;
      const len = s * (0.12 + view.hop * 0.18) * (0.85 + 0.15 * Math.sin(time / 30 + side));
      const flame = ctx.createLinearGradient(fx, fy, fx, fy + len);
      flame.addColorStop(0, 'rgba(255, 255, 220, 0.95)');
      flame.addColorStop(0.4, 'rgba(255, 170, 60, 0.9)');
      flame.addColorStop(1, 'rgba(255, 79, 109, 0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(fx - s * 0.05, fy);
      ctx.quadraticCurveTo(fx, fy + len * 1.3, fx + s * 0.05, fy);
      ctx.fill();
    }
  }

  // Feet and body.
  ellipse(cx - s * 0.11, y + s * 0.3, s * 0.07, s * 0.04, '#3a4470');
  ellipse(cx + s * 0.11, y + s * 0.3, s * 0.07, s * 0.04, '#3a4470');
  roundRect(cx - s * 0.2, y + s * 0.07, s * 0.4, s * 0.22, s * 0.07, '#e9efff', '#6b7bd1', s * 0.02);
  roundRect(cx - s * 0.12, y + s * 0.12, s * 0.24, s * 0.08, s * 0.03, '#10163d');
  for (let i = 0; i < 3; i++) {
    const on = Math.floor(time / 300 + i) % 3 === 0 || view.happy;
    circle(cx + (i - 1) * s * 0.07, y + s * 0.16, s * 0.022, on ? '#6ef0a8' : 'rgba(110, 240, 168, 0.3)');
  }

  // Antenna with a blinking light.
  ctx.strokeStyle = '#8d9ad8';
  ctx.lineWidth = s * 0.025;
  ctx.beginPath();
  ctx.moveTo(cx, y - s * 0.3);
  ctx.lineTo(cx, y - s * 0.4);
  ctx.stroke();
  const blink = 0.6 + 0.4 * Math.sin(time / 200);
  circle(cx, y - s * 0.42, s * 0.09, `rgba(255, 79, 216, ${blink * 0.3})`);
  circle(cx, y - s * 0.42, s * 0.05, `rgba(255, 79, 216, ${blink})`);

  // Head with a glowing visor.
  roundRect(cx - s * 0.27, y - s * 0.32, s * 0.54, s * 0.41, s * 0.14, '#e9efff', '#6b7bd1', s * 0.025);
  const visor = ctx.createLinearGradient(cx, y - s * 0.26, cx, y + s * 0.02);
  visor.addColorStop(0, '#1b2a6b');
  visor.addColorStop(1, '#070b1f');
  roundRect(cx - s * 0.2, y - s * 0.26, s * 0.4, s * 0.28, s * 0.09, visor, 'rgba(45, 226, 255, 0.7)', s * 0.015);
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.1, y - s * 0.21, s * 0.07, s * 0.025, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fill();

  // Eyes look the way the robot faces.
  const ex = Math.cos(view.angle) * s * 0.035;
  const ey = Math.sin(view.angle) * s * 0.025;
  const eyeColor = view.dizzy ? '#ff4d6d' : '#2de2ff';
  ctx.strokeStyle = eyeColor;
  ctx.lineWidth = s * 0.03;
  ctx.lineCap = 'round';
  ctx.save();
  ctx.shadowColor = eyeColor;
  ctx.shadowBlur = s * 0.15;
  for (const side of [-1, 1]) {
    const x = cx + side * s * 0.085;
    const ey0 = y - s * 0.12;
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
      roundRect(x + ex - s * 0.04, ey0 + ey - s * 0.05, s * 0.08, s * 0.1, s * 0.03, eyeColor);
    }
  }
  ctx.restore();

  // A keycard the robot is carrying floats beside it.
  if (robot.keys > 0) drawKey(cx + s * 0.34, y - s * 0.1, s, 0.6);
}

function spawnConfetti(x, y, amount) {
  const [cx, cy] = center(x, y);
  const colors = ['#2de2ff', '#ff4fd8', '#ffd23f', '#6ef0a8', '#a66bff', '#ffffff'];
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
  ctx.save();
  ctx.shadowBlur = 8;
  for (const p of confetti) {
    p.vy += 0.25;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.fillRect(-5, -2, 10, 4);
    ctx.restore();
  }
  ctx.restore();
  confetti = confetti.filter((p) => p.y < boardH + 20);
}

function draw(time) {
  ctx.clearRect(0, 0, boardW, boardH);

  // Floor first, then everything that stands on it.
  currentMap.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '~') {
      drawVoid(x, y, cell, time);
      return;
    }
    drawFloor(x, y, cell);
    const h = cellHash(x, y);
    if (c === '.' && h % 5 === 0) drawFloorLight(x, y, cell, h, time);
  }));

  // Glowing footprints where the robot has been.
  ctx.save();
  ctx.shadowColor = '#2de2ff';
  ctx.shadowBlur = cell * 0.2;
  for (const p of trail) circle(...center(p.x, p.y), cell * 0.06, 'rgba(45, 226, 255, 0.8)');
  ctx.restore();

  currentMap.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === '#') drawRock(...center(x, y), cell, cellHash(x, y));
  }));

  for (const door of doors) drawDoor(door, cell, time);
  for (const key of keys) drawPickup(key, cell, time);
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
  if (levelMode() === 'code') {
    codeEl.value = LEVELS[levelIndex].code;
    onCodeInput();
    resetRobot();
    return;
  }
  if (totalBlocks()) SOUNDS.remove();
  resetProgram();
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
skipBtn.addEventListener('click', () => loadLevel(levelIndex + 1));
replayBtn.addEventListener('click', () => {
  winEl.hidden = true;
  resetRobot();
});
document.getElementById('intro-go').addEventListener('click', () => {
  introEl.hidden = true;
});
codeEl.addEventListener('input', onCodeInput);
codeEl.addEventListener('keydown', onCodeKey);

updateSoundButton();
// Start on the first level not yet finished.
const firstUnfinished = LEVELS.findIndex((level) => !completed.has(level.id));
loadLevel(firstUnfinished === -1 ? LEVELS.length - 1 : firstUnfinished);
requestAnimationFrame(frame);
