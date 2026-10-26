const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../shared/core.js');
const P = require('../games/progression.js');
const S = require('../games/save.js');

function environment() {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
  let tail = Promise.resolve(), generation = 0;
  const locks = {request: (_name, action) => {
    const result = tail.then(action);
    tail = result.catch(() => {});
    return result;
  }};
  const options = {storage, locks, newGeneration: () => 'test-generation-' + ++generation};
  return {values, storage, locks, options, open: () => new S.LocalProgress(options)};
}
function solve(state, index) {
  state.puzzle = index;
  state.attempts[index]++;
  P.recordTrace(state, index, C.PUZZLES[index].solution);
}
const record = env => JSON.parse(env.storage.getItem(S.KEY));
const points = store => P.snapshot(store.data).points;

test('v1 primary migrates every existing field, keeps the legacy schema view and survives reload', async () => {
  const env = environment(), legacy = C.clone(P.defaults);
  solve(legacy, 1); legacy.reducedMotion = true;
  P.reviewCard(legacy, 'mirror'); P.equip(legacy, 'goggles');
  env.storage.setItem(S.LEGACY_KEY, JSON.stringify({schema: 1, game: 'wonder-lab-adventures', data: legacy}));
  const store = env.open();
  assert.deepEqual(store.data, P.normalize(legacy));
  assert.equal(await store.save(store.data), true);
  assert.deepEqual(env.open().data, P.normalize(legacy));
  assert.deepEqual(JSON.parse(env.storage.getItem(S.LEGACY_KEY)).data, P.normalize(legacy));
  assert.equal(record(env).schema, 2);
});

test('concurrent first migration preserves independent solved facts without reward duplication', async () => {
  const env = environment(), a = env.open(), b = env.open();
  solve(a.data, 0); solve(b.data, 1);
  assert.deepEqual(await Promise.all([a.save(a.data), b.save(b.data)]), [true, true]);
  const reopened = env.open();
  assert.deepEqual(reopened.data.solved, [0, 1]);
  assert.equal(points(reopened), 54);
  assert.equal(await reopened.save(reopened.data), true);
  assert.equal(points(env.open()), 54);
});

test('stale same-origin writer merges earned discoveries, reviews, and independent board changes', async () => {
  const env = environment(), seed = env.open();
  await seed.save(seed.data);
  const a = env.open(), b = env.open();
  solve(a.data, 0); P.reviewCard(a.data, 'beam'); P.equip(a.data, 'goggles');
  assert.equal(await a.save(a.data), true);
  solve(b.data, 1);
  assert.equal(await b.save(b.data), true);
  const saved = env.open();
  assert.deepEqual(saved.data.solved, [0, 1]);
  assert.deepEqual(saved.data.progress.reviews, ['beam']);
  assert.equal(saved.data.progress.equipped.cosmetic, 'goggles');
  assert.equal(points(saved), 57);
});

test('simultaneous same-solution attempts merge finite rewards once and retain both attempt increments', async () => {
  const env = environment(), a = env.open(), b = env.open();
  solve(a.data, 0); solve(b.data, 0);
  assert.deepEqual(await Promise.all([a.save(a.data), b.save(b.data)]), [true, true]);
  assert.equal(points(env.open()), 27);
  assert.equal(env.open().data.attempts[0], 2);
});

test('conflicting stale board edits explicitly reject instead of overwriting saved choices', async () => {
  const env = environment(), seed = env.open(); await seed.save(seed.data);
  const a = env.open(), b = env.open();
  a.data.orientations[2][0] = a.data.orientations[2][0] === '/' ? '\\' : '/';
  b.data.orientations[2][1] = b.data.orientations[2][1] === '/' ? '\\' : '/';
  await a.save(a.data);
  const before = env.storage.getItem(S.KEY);
  assert.equal(await b.save(b.data), false);
  assert.equal(b.conflict, true);
  assert.equal(b.status, 'conflict');
  assert.match(b.warning, /Another tab.*not saved/);
  assert.equal(env.storage.getItem(S.KEY), before);
  assert.deepEqual(b.data, env.open().data);
});

test('an overlapping equipment choice explicitly conflicts while independent slots merge', async () => {
  const env = environment(), seed = env.open();
  for (let i = 0; i < 3; i++) solve(seed.data, i);
  await seed.save(seed.data);
  const a = env.open(), b = env.open();
  P.equip(a.data, 'goggles'); P.equip(b.data, 'bot-mint');
  await a.save(a.data);
  assert.equal(await b.save(b.data), false);
  assert.equal(b.data.progress.equipped.cosmetic, 'goggles');
  const c = env.open(), d = env.open();
  P.equip(c.data, 'bot-mint'); P.equip(d.data, 'moonlit');
  await c.save(c.data);
  assert.equal(await d.save(d.data), true);
  assert.equal(d.data.progress.equipped.cosmetic, 'bot-mint');
  assert.equal(d.data.progress.equipped.theme, 'moonlit');
});

test('attempt reset versus another tab attempt explicitly conflicts', async () => {
  const env = environment(), seed = env.open(); seed.data.attempts[0] = 2; await seed.save(seed.data);
  const a = env.open(), b = env.open(); a.data.attempts[0]++; b.data.attempts[0] = 0;
  await a.save(a.data);
  assert.equal(await b.save(b.data), false);
  assert.equal(env.open().data.attempts[0], 3);
});

test('unchanged saves do not create another protected revision or duplicate visits', async () => {
  const env = environment(), store = env.open(); store.data.visits++;
  await store.save(store.data); const revision = record(env).revision;
  await store.save(store.data);
  assert.equal(record(env).revision, revision);
  assert.equal(env.open().data.visits, 1);
});

test('confirmed erase removes both legacy copies and replaces the protected record with a blank generation', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0);
  await store.save(store.data); await store.save(store.data);
  const previous = record(env).generation;
  assert.equal(await store.reset(), true);
  assert.equal(store.status, 'erased');
  assert.equal(env.storage.getItem(S.LEGACY_KEY), null);
  assert.equal(env.storage.getItem(S.LEGACY_KEY + '.backup'), null);
  assert.notEqual(record(env).generation, previous);
  assert.equal(record(env).backup, null);
  assert.equal(points(env.open()), 0);
});

test('stale writer cannot restore discoveries after confirmed parent erase', async () => {
  const env = environment(), a = env.open(); solve(a.data, 0); await a.save(a.data);
  const stale = env.open(); await a.reset();
  solve(stale.data, 1);
  assert.equal(await stale.save(stale.data), false);
  assert.match(stale.warning, /erased or replaced/);
  assert.equal(stale.conflict, true);
  assert.equal(points(env.open()), 0);
  assert.equal(points(stale), 0);
});

test('a tab opened before first migration cannot restore legacy progress after erase', async () => {
  const env = environment(), legacy = C.clone(P.defaults); solve(legacy, 0);
  env.storage.setItem(S.LEGACY_KEY, JSON.stringify({schema: 1, game: 'wonder-lab-adventures', data: legacy}));
  const stale = env.open(), parent = env.open(); await parent.reset();
  assert.equal(await stale.save(stale.data), false);
  assert.equal(points(env.open()), 0);
});

test('backup deletion failure reports failure and tombstone prevents reload recovery', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0);
  await store.save(store.data); await store.save(store.data);
  const remove = env.storage.removeItem;
  env.storage.removeItem = key => { if (key.endsWith('.backup')) throw new Error('blocked deletion'); remove(key); };
  assert.equal(await store.reset(), false);
  assert.match(store.warning, /could not be completed.*saved copy may remain/);
  assert.equal(record(env).erasing, true);
  assert.notEqual(env.storage.getItem(S.LEGACY_KEY + '.backup'), null);
  const reopened = env.open();
  assert.equal(points(reopened), 0);
  assert.equal(reopened.status, 'erase-pending');
  assert.equal(await reopened.save(reopened.data), false);
  env.storage.removeItem = remove;
  assert.equal(await reopened.reset(), true);
  assert.equal(record(env).erasing, false);
  assert.equal(env.storage.getItem(S.LEGACY_KEY + '.backup'), null);
});

test('failed tombstone write never confirms erasure or silently clears the existing save', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  const before = env.storage.getItem(S.KEY);
  env.storage.setItem = () => { throw new Error('full'); };
  assert.equal(await store.reset(), false);
  assert.equal(env.storage.getItem(S.KEY), before);
  assert.equal(points(env.open()), 27);
});

test('interruption after tombstone commit leaves no old-generation recovery path', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  env.storage.removeItem = () => { throw new Error('interrupted'); };
  assert.equal(await store.reset(), false);
  const pending = record(env);
  assert.equal(pending.erasing, true); assert.equal(pending.backup, null);
  // Even damaged data inside a pending erase remains blank on reopen.
  pending.data = null; env.values.set(S.KEY, JSON.stringify(pending));
  assert.equal(points(env.open()), 0);
});

test('an older normalizer can overwrite legacy copies without destroying protected progression', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0);
  P.reviewCard(store.data, 'beam'); P.equip(store.data, 'goggles'); await store.save(store.data);
  const old = new C.LocalSave('wonder-lab-adventures', C.labDefaults, C.normalizeLab, env.storage);
  old.save(old.data);
  assert.equal(JSON.parse(env.storage.getItem(S.LEGACY_KEY)).data.progress, undefined);
  const restored = env.open();
  assert.equal(points(restored), 30);
  assert.deepEqual(restored.data.progress.reviews, ['beam']);
  assert.equal(restored.data.progress.equipped.cosmetic, 'goggles');
});

test('a stale old build writing after erase cannot resurrect progress in this build', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  const old = new C.LocalSave('wonder-lab-adventures', C.labDefaults, C.normalizeLab, env.storage);
  await store.reset(); old.save(old.data);
  assert.deepEqual(JSON.parse(env.storage.getItem(S.LEGACY_KEY)).data.solved, [0]);
  assert.equal(points(env.open()), 0);
});

test('legacy corrupt primary recovers backup during first migration; later corruption uses protected save', async () => {
  const env = environment(), data = C.clone(P.defaults); solve(data, 2);
  env.storage.setItem(S.LEGACY_KEY, '{broken');
  env.storage.setItem(S.LEGACY_KEY + '.backup', JSON.stringify({schema: 1, game: 'wonder-lab-adventures', data}));
  const migrated = env.open(); assert.match(migrated.warning, /Recovered/);
  assert.equal(points(migrated), 27); await migrated.save(migrated.data);
  env.storage.setItem(S.LEGACY_KEY, '{broken');
  const reopened = env.open();
  assert.equal(points(reopened), 27); assert.match(reopened.warning, /Recovered/);
});

test('embedded same-generation backup recovers damaged data without importing stale legacy fields', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  store.data.visits++; await store.save(store.data);
  const damaged = record(env); damaged.data = null;
  env.storage.setItem(S.KEY, JSON.stringify(damaged));
  const restored = env.open();
  assert.equal(points(restored), 27);
  assert.match(restored.warning, /Recovered/);
});

test('malformed or future protected records block writes instead of importing an old legacy snapshot', async () => {
  for (const raw of ['{broken', JSON.stringify({schema: 999, data: {}})]) {
    const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
    env.storage.setItem(S.KEY, raw);
    const blocked = env.open();
    assert.equal(blocked.status, 'blocked');
    assert.equal(points(blocked), 0);
    solve(blocked.data, 1);
    assert.equal(await blocked.save(blocked.data), false);
    assert.equal(env.storage.getItem(S.KEY), raw);
    assert.equal(await blocked.reset(), true);
    assert.equal(points(env.open()), 0);
  }
});

test('newer progression data inside the protected schema is preserved without downgrading or writing', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  const future = record(env); future.data.progress.version = 2;
  const raw = JSON.stringify(future); env.storage.setItem(S.KEY, raw);
  const blocked = env.open();
  assert.equal(blocked.status, 'blocked');
  assert.equal(await blocked.save(blocked.data), false);
  assert.equal(env.storage.getItem(S.KEY), raw);
});

test('incomplete protected data recovers only its same-generation embedded backup', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  store.data.visits++; await store.save(store.data);
  const incomplete = record(env); incomplete.data = {};
  env.storage.setItem(S.KEY, JSON.stringify(incomplete));
  const recovered = env.open();
  assert.equal(points(recovered), 27);
  assert.match(recovered.warning, /Recovered/);
});

test('missing locks and denied storage keep play in memory and never claim confirmed erasure', async () => {
  for (const options of [{storage: null, locks: null}, {...environment().options, locks: null}]) {
    const store = new S.LocalProgress(options); solve(store.data, 0);
    assert.equal(await store.save(store.data), false);
    assert.equal(points(store), 27);
    assert.match(store.warning, /visit only/);
    assert.equal(await store.reset(), false);
    assert.match(store.warning, /No saved-data deletion is confirmed/);
  }
});

test('quota failure preserves in-memory play and existing durable state', async () => {
  const env = environment(), store = env.open(); await store.save(store.data);
  env.storage.setItem = () => { throw new Error('QuotaExceeded'); };
  solve(store.data, 0);
  assert.equal(await store.save(store.data), false);
  assert.equal(points(store), 27);
  assert.equal(points(env.open()), 0);
  assert.match(store.warning, /cannot save/);
});

test('legacy projection failure truthfully distinguishes durable current save from failed old-build copy', async () => {
  const env = environment(), store = env.open(), set = env.storage.setItem;
  env.storage.setItem = (key, value) => { if (key === S.LEGACY_KEY) throw new Error('projection failed'); set(key, value); };
  solve(store.data, 0);
  assert.equal(await store.save(store.data), true);
  assert.equal(points(env.open()), 27);
  assert.match(store.warning, /saved in this build.*compatibility copy.*could not be updated/);
});

test('cleared storage invalidates an existing writer instead of recreating its old discoveries', async () => {
  const env = environment(), store = env.open(); solve(store.data, 0); await store.save(store.data);
  env.values.clear();
  assert.equal(await store.save(store.data), false);
  assert.equal(store.conflict, true);
  assert.equal(points(store), 0);
  assert.equal(env.storage.getItem(S.KEY), null);
});
