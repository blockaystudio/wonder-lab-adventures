// Pure simulation regressions; real HTTP-origin browser coverage: browser_lab.py.
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../shared/core.js');

// Independent oracle: compass directions and a reflection lookup table rather
// than the engine's vector arithmetic. A finite board has 9 * 6 * 4 states.
const steps = {E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1]};
const reflections = {
  '/': {E: 'N', N: 'E', W: 'S', S: 'W'},
  '\\': {E: 'S', S: 'E', W: 'N', N: 'W'},
};
function oracle(puzzle, orientations) {
  const tiles = new Map(puzzle.mirrors.map((xy, i) => [xy.join(':'), i]));
  let [x, y] = puzzle.start;
  let direction = 'E';
  const path = [[x, y]], touched = [], seen = new Set();
  while (x >= 0 && x < 9 && y >= 0 && y < 6) {
    if (x === puzzle.goal[0] && y === puzzle.goal[1]) {
      return {path, success: true, loop: false, touched};
    }
    const state = `${x}:${y}:${direction}`;
    if (seen.has(state)) return {path, success: false, loop: true, touched};
    seen.add(state);
    assert.ok(seen.size <= 216, 'oracle exceeded finite board state count');
    const mirror = tiles.get(`${x}:${y}`);
    if (mirror !== undefined) {
      touched.push(mirror);
      direction = reflections[orientations[mirror]][direction];
    }
    const [dx, dy] = steps[direction];
    x += dx;
    y += dy;
    path.push([x, y]);
  }
  return {path, success: false, loop: false, touched};
}

const solutions = [
  {
    orientations: ['/', '/'],
    path: [[0,3],[1,3],[2,3],[3,3],[4,3],[4,2],[4,1],[5,1],[6,1],[7,1],[8,1]],
  },
  {
    orientations: ['\\', '\\'],
    path: [[0,1],[1,1],[2,1],[2,2],[2,3],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4]],
  },
  {
    orientations: ['\\', '/', '\\', '/'],
    path: [[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[6,2],[6,3],[6,4],[5,4],[4,4],[3,4],[2,4],[2,3],[2,2],[2,1],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
  },
];

assert.equal(C.PUZZLES.length, solutions.length, 'new puzzle needs independent expected route');
for (const [index, puzzle] of C.PUZZLES.entries()) {
  test(`Puzzle ${index + 1}: exact expected solution visits mirrors and ends at lamp`, () => {
    const expected = solutions[index];
    assert.deepEqual(puzzle.solution, expected.orientations);
    const actual = C.traceLight(puzzle, expected.orientations);
    assert.deepEqual(actual, {
      path: expected.path, success: true, loop: false,
      touched: puzzle.mirrors.map((_, i) => i),
    });
    assert.equal(C.traceLight(puzzle, puzzle.initial).success, false);
  });

  test(`Puzzle ${index + 1}: every orientation agrees with independent ray oracle`, () => {
    const winning = [];
    for (let mask = 0; mask < 2 ** puzzle.mirrors.length; mask++) {
      const orientations = puzzle.mirrors.map((_, i) => (mask & (1 << i)) ? '/' : '\\');
      const actual = C.traceLight(puzzle, orientations);
      assert.deepEqual(actual, oracle(puzzle, orientations), `orientation ${orientations.join('')}`);
      assert.ok(actual.path.length <= 218, 'one visit per directional state plus exit/repeat');
      for (let i = 1; i < actual.path.length; i++) {
        const [x, y] = actual.path[i], [lastX, lastY] = actual.path[i - 1];
        assert.equal(Math.abs(x - lastX) + Math.abs(y - lastY), 1, 'ray crosses one adjacent tile');
      }
      if (actual.success) winning.push(orientations);
    }
    assert.deepEqual(winning, [solutions[index].orientations], 'exactly one winning arrangement');
  });

  test(`Puzzle ${index + 1}: tracing is deterministic without mutating puzzle or orientations`, () => {
    const before = JSON.stringify(puzzle), orientations = puzzle.initial.slice();
    const initial = orientations.slice(), expected = C.traceLight(puzzle, orientations);
    for (let repeat = 0; repeat < 200; repeat++) {
      assert.deepEqual(C.traceLight(puzzle, orientations), expected);
    }
    assert.deepEqual(orientations, initial);
    assert.equal(JSON.stringify(puzzle), before);
  });
}

const edgeCases = [
  {name: 'east', start: [0,2], goal: [8,5], mirrors: [], orientations: [], exit: [9,2]},
  {name: 'north', start: [0,2], goal: [8,5], mirrors: [[4,2]], orientations: ['/'], exit: [4,-1]},
  {name: 'south', start: [0,2], goal: [8,5], mirrors: [[4,2]], orientations: ['\\'], exit: [4,6]},
  {name: 'west', start: [0,2], goal: [8,5], mirrors: [[4,2],[4,4]], orientations: ['\\','/'], exit: [-1,4]},
];
for (const fixture of edgeCases) {
  test(`Board ${fixture.name} edge: exits once without false success or loop`, () => {
    const actual = C.traceLight(fixture, fixture.orientations);
    assert.deepEqual(actual, oracle(fixture, fixture.orientations));
    assert.deepEqual(actual.path.at(-1), fixture.exit);
    assert.equal(actual.success, false);
    assert.equal(actual.loop, false);
    assert.equal(actual.path.filter(([x,y]) => x < 0 || x > 8 || y < 0 || y > 5).length, 1);
  });
}

test('A boundary lamp is reached, but a lamp outside the board never wins', () => {
  const fixture = {start: [0,2], goal: [8,2], mirrors: []};
  assert.equal(C.traceLight(fixture, []).success, true);
  fixture.goal = [9,2];
  assert.deepEqual(C.traceLight(fixture, []), oracle(fixture, []));
  assert.equal(C.traceLight(fixture, []).success, false);
});

test('A mirror before the lamp diverts the path; sharing a row is not success', () => {
  const fixture = {start: [0,2], goal: [8,2], mirrors: [[4,2]]};
  for (const orientation of ['/', '\\']) {
    const actual = C.traceLight(fixture, [orientation]);
    assert.deepEqual(actual, oracle(fixture, [orientation]));
    assert.equal(actual.success, false);
    assert.deepEqual(actual.touched, [0]);
    assert.equal(actual.path.some(xy => xy[0] === 8 && xy[1] === 2), false);
  }
});

test('Closed light-path cycle terminates on the first repeated directional state', () => {
  // A reversible closed path must begin on the cycle; light cannot enter a
  // closed mirror circuit from outside it in this idealized model.
  const fixture = {
    start: [3,1], goal: [8,5],
    mirrors: [[2,1],[6,1],[6,4],[2,4]],
  };
  const orientations = ['/', '\\', '/', '\\'];
  const expected = {
    path: [[3,1],[4,1],[5,1],[6,1],[6,2],[6,3],[6,4],[5,4],[4,4],[3,4],[2,4],[2,3],[2,2],[2,1],[3,1]],
    success: false, loop: true, touched: [1,2,3,0],
  };
  assert.deepEqual(oracle(fixture, orientations), expected);
  assert.deepEqual(C.traceLight(fixture, orientations), expected);
  for (let mask = 0; mask < 16; mask++) {
    const state = fixture.mirrors.map((_, i) => (mask & (1 << i)) ? '/' : '\\');
    assert.deepEqual(C.traceLight(fixture, state), oracle(fixture, state));
  }
});

test('Repeated crossings in different directions are not mistaken for a loop', () => {
  // Puzzle 3 crosses tile [2,1] going east and later north.
  const actual = C.traceLight(C.PUZZLES[2], solutions[2].orientations);
  assert.equal(actual.path.filter(([x,y]) => x === 2 && y === 1).length, 2);
  assert.equal(actual.loop, false);
  assert.equal(actual.success, true);
});

test('Malformed lab progress normalizes to playable finite state while retaining valid discoveries', () => {
  const actual = C.normalizeLab({
    puzzle: Infinity, orientations: [[null,'/'], 'bad', ['<script>', {}, '\\', '/']],
    attempts: [NaN, -100, '2'], solved: [0,0,2,3,-1,'1',null], visits: Infinity,
  });
  assert.equal(actual.puzzle, 0);
  assert.deepEqual(actual.solved, [0,2]);
  assert.deepEqual(actual.attempts, [0,0,0]);
  assert.equal(actual.visits, 0);
  for (const [i,puzzle] of C.PUZZLES.entries()) {
    assert.equal(actual.orientations[i].length, puzzle.mirrors.length);
    assert.ok(actual.orientations[i].every(o => o === '/' || o === '\\'));
    assert.doesNotThrow(() => C.traceLight(puzzle, actual.orientations[i]));
  }
});
