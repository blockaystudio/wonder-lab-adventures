const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../shared/core.js');
const P = require('../games/progression.js');

const fresh = () => P.normalize({});
const choices = (index, mask) => C.PUZZLES[index].mirrors.map((_, bit) => mask & (1 << bit) ? '/' : '\\');
function solve(state, index) { return P.recordTrace(state, index, C.PUZZLES[index].solution); }
function explore(state) {
  for (const [index, puzzle] of C.PUZZLES.entries()) {
    for (let mask = 0; mask < 2 ** puzzle.mirrors.length; mask++) P.recordTrace(state, index, choices(index, mask));
  }
  return state;
}
function finish(state) {
  explore(state);
  for (const card of P.CARDS) P.reviewCard(state, card.id);
  for (let index = 0; index < 3; index++) { P.armReplay(state, index); solve(state, index); }
  return state;
}
class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

test('Catalog has six original concept rewards, four cosmetics, two themes and one companion', () => {
  assert.equal(P.CARDS.length, 6);
  assert.deepEqual(new Set(P.CARDS.map(card => card.id)), new Set(['beam','mirror','relay','compare','angle','model']));
  assert.equal(P.REWARDS.filter(item => item.type === 'cosmetic').length, 4);
  assert.equal(P.REWARDS.filter(item => item.type === 'theme').length, 2);
  assert.equal(P.REWARDS.filter(item => item.type === 'companion').length, 1);
  for (const card of P.CARDS) { assert.ok(card.description); assert.ok(card.condition); }
  for (const reward of P.REWARDS) { assert.ok(reward.description); assert.ok(reward.requirement); }
});

test('Fresh progress has no rewards, shared references or editable point balance', () => {
  const state = fresh(), next = fresh();
  assert.equal(P.snapshot(state).points, 0);
  assert.deepEqual(P.snapshot(state).cardIds, []);
  assert.deepEqual(P.snapshot(state).unlockedIds, []);
  assert.equal(P.snapshot(state).tier.name, 'Seed inventor');
  state.progress.traces[0].push(0);
  assert.deepEqual(next.progress.traces[0], []);
  assert.deepEqual(P.defaults.progress.traces[0], []);
  assert.equal(Object.hasOwn(state.progress, 'points'), false);
});

test('First distinct failed experiment earns two sparks; repetition cannot farm', () => {
  const state = fresh();
  const first = P.recordTrace(state, 0, C.PUZZLES[0].initial);
  assert.equal(first.result.success, false);
  assert.equal(first.pointsGained, 2);
  for (let repeat = 0; repeat < 500; repeat++) {
    assert.equal(P.recordTrace(state, 0, C.PUZZLES[0].initial).pointsGained, 0);
  }
  assert.equal(P.snapshot(state).points, 2);
  assert.deepEqual(state.solved, []);
});

test('First solve independently verifies ray and awards solve, trace, concept card and goggles', () => {
  const state = fresh(), result = solve(state, 0);
  assert.equal(result.result.success, true);
  assert.deepEqual(state.solved, [0]);
  assert.equal(result.pointsGained, 27);
  assert.deepEqual(result.newCards, ['beam']);
  assert.deepEqual(result.newRewards, ['goggles']);
  assert.deepEqual(state.orientations[0], C.PUZZLES[0].solution);
  assert.equal(solve(state, 0).pointsGained, 0);
});

test('Three solved puzzles grant one section bonus, independent of solve order', () => {
  const state = fresh();
  assert.equal(solve(state, 2).pointsGained, 27);
  assert.equal(solve(state, 0).pointsGained, 27);
  assert.equal(solve(state, 1).pointsGained, 47);
  assert.equal(P.snapshot(state).points, 101);
  assert.equal(P.snapshot(state).tier.name, 'Lab explorer');
  assert.deepEqual(new Set(P.snapshot(state).cardIds), new Set(['beam','mirror','relay']));
  for (let index = 0; index < 3; index++) assert.equal(solve(state, index).pointsGained, 0);
});

for (const [index, id, required] of [[0,'compare',3],[1,'angle',3],[2,'model',5]]) {
  test(`Explorer card ${id} requires ${required} distinct arrangements, not repeated sends`, () => {
    const state = fresh();
    for (let mask = 0; mask < required - 1; mask++) P.recordTrace(state, index, choices(index, mask));
    assert.equal(P.snapshot(state).cardIds.includes(id), false);
    for (let repeat = 0; repeat < 20; repeat++) P.recordTrace(state, index, choices(index, 0));
    assert.equal(P.snapshot(state).cardIds.includes(id), false);
    assert.ok(P.recordTrace(state, index, choices(index, required - 1)).newCards.includes(id));
    assert.ok(P.snapshot(state).cardIds.includes(id));
  });
}

test('Card reviews are available only after discovery and award once per card', () => {
  const state = fresh();
  assert.equal(P.reviewCard(state, 'beam').pointsGained, 0);
  solve(state, 0);
  assert.equal(P.reviewCard(state, 'beam').pointsGained, 3);
  assert.equal(P.reviewCard(state, 'beam').pointsGained, 0);
  assert.equal(P.reviewCard(state, '<script>').pointsGained, 0);
  assert.deepEqual(state.progress.reviews, ['beam']);
});

test('Replays require changing or resetting a previously solved experiment and award only once', () => {
  const state = fresh();
  assert.equal(P.armReplay(state, 0), false);
  solve(state, 0);
  assert.equal(solve(state, 0).pointsGained, 0);
  assert.equal(P.armReplay(state, 0), true);
  assert.equal(solve(state, 0).pointsGained, 4);
  assert.deepEqual(state.progress.replays, [0]);
  assert.equal(state.progress.replayReady[0], false);
  assert.equal(P.armReplay(state, 0), false);
  assert.equal(solve(state, 0).pointsGained, 0);
});

test('Failed replay experiment does not consume replay readiness', () => {
  const state = fresh();
  solve(state, 1); P.armReplay(state, 1);
  const before = P.snapshot(state).points;
  assert.equal(P.recordTrace(state, 1, C.PUZZLES[1].initial).result.success, false);
  assert.equal(state.progress.replayReady[1], true);
  assert.deepEqual(state.progress.replays, []);
  assert.equal(solve(state, 1).pointsGained, 4);
  assert.equal(P.snapshot(state).points, before + 6);
});

test('All rewards are reachable with the three puzzles at a finite maximum of 188 sparks', () => {
  const state = finish(fresh()), result = P.snapshot(state);
  assert.equal(result.points, 188);
  assert.equal(result.points, P.MAX_SPARKS);
  assert.equal(result.cardIds.length, 6);
  assert.equal(result.unlockedIds.length, 7);
  assert.equal(result.nextReward, null);
  assert.equal(result.tier.name, 'Wonder keeper');
  assert.equal(result.tier.nextThreshold, null);
  assert.ok(result.goals.every(goal => goal.done));
  finish(state);
  assert.equal(P.snapshot(state).points, 188);
});

test('Nova requires both its displayed sparks threshold and collection/review conditions', () => {
  const state = explore(fresh());
  assert.equal(P.snapshot(state).points, 158);
  assert.equal(P.snapshot(state).unlockedIds.includes('nova'), false);
  assert.equal(P.equip(state, 'nova'), false);
  P.reviewCard(state, 'beam'); P.reviewCard(state, 'mirror');
  assert.equal(P.snapshot(state).unlockedIds.includes('nova'), false);
  const gained = P.reviewCard(state, 'relay');
  assert.deepEqual(gained.newRewards, ['nova']);
  assert.equal(P.equip(state, 'nova'), true);
});

test('Locked rewards cannot be equipped and available slots stay independent', () => {
  const state = fresh();
  assert.equal(P.equip(state, 'goggles'), false);
  assert.equal(P.equip(state, 'moonlit'), false);
  assert.equal(P.equip(state, 'made-up'), false);
  solve(state, 0);
  assert.equal(P.equip(state, 'goggles'), true);
  assert.equal(state.progress.equipped.cosmetic, 'goggles');
  assert.equal(P.snapshot(state).points, 27, 'equipment never spends sparks');
  assert.equal(P.equip(state, 'classic', 'cosmetic'), true);
  assert.equal(state.progress.equipped.cosmetic, 'classic');
  assert.equal(P.equip(state, 'classic', 'unknown'), false);
  finish(state);
  for (const id of ['bot-plum', 'greenhouse', 'nova']) assert.equal(P.equip(state, id), true);
  assert.deepEqual(state.progress.equipped, {cosmetic:'bot-plum', theme:'greenhouse', companion:'nova'});
});

test('Legacy saves retain discoveries, attempts, orientations and motion while receiving earned rewards', () => {
  const old = {...C.clone(C.labDefaults), puzzle: 1, solved: [0,1], attempts: [5,6,0], visits: 9, reducedMotion: true};
  old.orientations[1] = C.PUZZLES[1].solution.slice();
  const state = P.normalize(old), result = P.snapshot(state);
  assert.deepEqual(state.solved, [0,1]);
  assert.deepEqual(state.attempts, [5,6,0]);
  assert.deepEqual(state.orientations, old.orientations);
  assert.equal(state.visits, 9);
  assert.equal(state.reducedMotion, true);
  assert.equal(result.points, 50, 'do not invent past experiments or replay facts');
  assert.deepEqual(result.cardIds, ['beam','mirror']);
  assert.deepEqual(result.unlockedIds, ['goggles','bot-mint']);
});

test('Same v1 LocalSave key round-trips progression, unlocks and all equipment slots', () => {
  const storage = new MemoryStorage(), state = finish(fresh());
  for (const id of ['bot-plum', 'moonlit', 'nova']) P.equip(state, id);
  const first = new C.LocalSave('wonder-lab-adventures', P.defaults, P.normalize, storage);
  assert.equal(first.key, 'kidslab.v1.wonder-lab-adventures');
  assert.equal(first.save(state), true);
  const raw = JSON.parse(storage.getItem(first.key));
  assert.equal(raw.schema, 1);
  assert.equal(Object.hasOwn(raw.data.progress, 'points'), false);
  const restored = new C.LocalSave('wonder-lab-adventures', P.defaults, P.normalize, storage);
  assert.deepEqual(restored.data, P.normalize(state));
  assert.deepEqual(P.snapshot(restored.data), P.snapshot(state));
  assert.equal(P.recordTrace(restored.data, 0, C.PUZZLES[0].solution).pointsGained, 0);
});

test('Legacy v1 envelope migrates through LocalSave without replacing the save key', () => {
  const storage = new MemoryStorage(), key = 'kidslab.v1.wonder-lab-adventures';
  storage.setItem(key, JSON.stringify({schema:1,game:'wonder-lab-adventures',data:{...C.labDefaults,solved:[2]}}));
  const saved = new C.LocalSave('wonder-lab-adventures', P.defaults, P.normalize, storage);
  assert.equal(saved.key, key);
  assert.deepEqual(saved.data.solved, [2]);
  assert.equal(P.snapshot(saved.data).points, 25);
  assert.deepEqual(P.snapshot(saved.data).cardIds, ['relay']);
});

test('Corrupted primary recovers full progression and cosmetics from the valid backup', () => {
  const storage = new MemoryStorage(), saved = new C.LocalSave('wonder-lab-adventures', P.defaults, P.normalize, storage);
  const state = finish(fresh()); P.equip(state, 'goggles');
  saved.save(state); saved.save(state);
  storage.setItem(saved.key, '{broken');
  const restored = new C.LocalSave('wonder-lab-adventures', P.defaults, P.normalize, storage);
  assert.match(restored.warning, /Recovered/);
  assert.equal(P.snapshot(restored.data).points, 188);
  assert.equal(restored.data.progress.equipped.cosmetic, 'goggles');
});

test('Malformed facts are bounded, deduplicated and filtered; fabricated balances and unlocks are ignored', () => {
  const state = P.normalize({solved:[0,0,99,'1'], progress:{version:1,
    points:1e9, unlocked:['nova'], traces:[[0,0,3,4,-1,NaN,'2'], [2], Array.from({length:1000}, (_,i) => i)],
    reviews:['beam','beam','model','fake'], replays:[0,0,1,2,99,'0'],
    replayReady:[true,true,true], equipped:{cosmetic:'bot-plum',theme:'<script>',companion:'nova'}}});
  assert.deepEqual(state.progress.traces[0], [0,3]);
  assert.deepEqual(state.progress.traces[1], [2]);
  assert.equal(state.progress.traces[2].length, 16);
  assert.deepEqual(state.progress.reviews, ['beam','model']);
  assert.deepEqual(state.progress.replays, [0]);
  assert.deepEqual(state.progress.replayReady, [false,false,false]);
  assert.equal(P.snapshot(state).points, 78); // 20 solve + 38 traces + 10 cards + 6 reviews + 4 replay.
  assert.deepEqual(state.progress.equipped, {cosmetic:'classic',theme:'classic',companion:'classic'});
  assert.equal(Object.hasOwn(state.progress,'points'), false);
  assert.equal(P.snapshot(state).unlockedIds.includes('nova'), false);
});

test('Normalization rejects reviews/replays/selected items without the prerequisite facts', () => {
  const state = P.normalize({progress:{version:1,reviews:P.CARDS.map(card=>card.id),replays:[0,1,2],
    replayReady:[true,true,true],equipped:{cosmetic:'goggles',theme:'moonlit',companion:'nova'}}});
  assert.deepEqual(state.progress.reviews, []);
  assert.deepEqual(state.progress.replays, []);
  assert.deepEqual(state.progress.replayReady, [false,false,false]);
  assert.equal(P.snapshot(state).points, 0);
  assert.deepEqual(P.snapshot(state).equipped, {cosmetic:'classic',theme:'classic',companion:'classic'});
});

test('Unknown progression versions reset only progression, preserving existing solved discoveries', () => {
  const state = P.normalize({solved:[1], progress:{version:99,traces:[[0,1,2],[0,1,2],[0,1,2,3,4]],reviews:['mirror']}});
  assert.deepEqual(state.solved, [1]);
  assert.equal(P.snapshot(state).points, 25);
  assert.deepEqual(state.progress.traces, [[],[],[]]);
  for (const invalid of [null, undefined, [], 'bad', 9]) assert.equal(P.snapshot(P.normalize(invalid)).points, 0);
});

test('Invalid trace and review events neither grant points nor mutate valid state', () => {
  const state = fresh(), before = JSON.stringify(state);
  for (const [index, orientations] of [[-1,[]],[3,[]],[.5,[]],[0,[]],[0,['/']],[0,['/','bad']],[0,null],[0,'//'],[0,Array(2)]]) {
    assert.equal(P.recordTrace(state,index,orientations).pointsGained, 0);
    assert.equal(JSON.stringify(state), before);
  }
  assert.equal(P.recordTrace(null,0,['/','/']).pointsGained, 0);
  assert.equal(P.reviewCard(null,'beam').pointsGained, 0);
  assert.equal(P.armReplay(state, 99), false);
  assert.equal(P.equip(null,'goggles'), false);
  assert.equal(P.snapshot(state).points, 0);
});

test('Hints and attempt counts have no effect on sparks, cards, unlocks or finite goals', () => {
  const a = finish(fresh()), b = finish(fresh());
  a.attempts = [999,999,999]; b.attempts = [0,0,0];
  a.hintsUsed = [999,999,999]; b.hintsUsed = [0,0,0];
  assert.deepEqual(P.snapshot(a), P.snapshot(b));
  assert.equal(P.snapshot(a).goals.find(goal=>goal.id==='first-solve').detail.includes('Hints are always welcome'), true);
});

test('All-progress replay and new browser visits cannot mint more points or reset earned collections', () => {
  const state = finish(fresh()), before = P.snapshot(state);
  for (let visit = 0; visit < 20; visit++) {
    state.visits++;
    for (let index = 0; index < 3; index++) {
      P.armReplay(state,index); solve(state,index);
      for (const card of P.CARDS) P.reviewCard(state,card.id);
    }
  }
  assert.deepEqual(P.snapshot(state), before);
});

test('Unavailable storage remains playable in memory and reset removes the complete progression', () => {
  const saved = new C.LocalSave('wonder-lab-adventures',P.defaults,P.normalize,null);
  finish(saved.data);
  assert.equal(saved.save(saved.data), false);
  assert.equal(P.snapshot(saved.data).points, 188);
  saved.reset();
  assert.equal(P.snapshot(saved.data).points, 0);
  assert.deepEqual(saved.data.progress.equipped, {cosmetic:'classic',theme:'classic',companion:'classic'});
});
