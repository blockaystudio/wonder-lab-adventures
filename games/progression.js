/* Wonder Lab progression v1. Finite local achievements; no clock, profile or network. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../shared/core.js'));
  else root.WonderProgression = factory(root.KidsCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';

  const CARDS = [
    {id: 'beam', title: "Light's straight path", puzzle: 0,
      description: 'In this simplified 2D model, a light ray travels in straight lines between mirrors.',
      condition: 'Solve A little reflection.'},
    {id: 'mirror', title: "A mirror's turn", puzzle: 1,
      description: 'A flat mirror reflects light. Turning the mirror changes where the reflected ray goes. This board uses just two mirror slopes.',
      condition: 'Solve Take the lower path.'},
    {id: 'relay', title: 'A chain of reflections', puzzle: 2,
      description: 'Several ideal flat mirrors can guide one ray around a winding path. Follow each straight part of the route in order.',
      condition: 'Solve The long way around.'},
    {id: 'compare', title: 'Predict, turn, test', puzzle: 0,
      description: 'Changing one mirror at a time helps you compare paths. A beam that misses the lamp is still a useful observation.',
      condition: 'Test 3 different mirror arrangements in A little reflection.'},
    {id: 'angle', title: 'An equal-angle bounce', puzzle: 1,
      description: 'For an ideal flat mirror, the incoming and outgoing angles are equal. Measure both from an imaginary line pointing straight out of the mirror, called the normal.',
      condition: 'Test 3 different mirror arrangements in Take the lower path.'},
    {id: 'model', title: 'Models are maps', puzzle: 2,
      description: 'This board is a simplified map of one ray in a flat plane. Real light can spread out and interact with materials in more ways. This game models mirror reflection, not all of optics.',
      condition: 'Test 5 different mirror arrangements in The long way around.'}
  ];
  const REWARDS = [
    {id: 'goggles', title: 'Prism goggles', type: 'cosmetic', points: 15,
      description: 'A bright pair of inventor goggles for your robot helper.', requirement: 'Earn 15 Wonder Sparks.'},
    {id: 'bot-mint', title: 'Mint explorer', type: 'cosmetic', points: 40,
      description: 'A fresh mint-and-copper look for your robot helper.', requirement: 'Earn 40 Wonder Sparks.'},
    {id: 'badge-orbit', title: 'Orbit inventor badge', type: 'cosmetic', points: 65,
      description: 'Wear a little orbit of curiosity on your helper.', requirement: 'Earn 65 Wonder Sparks.'},
    {id: 'bot-plum', title: 'Cosmic plum', type: 'cosmetic', points: 90,
      description: 'A starry plum-and-gold look for your robot helper.', requirement: 'Earn 90 Wonder Sparks.'},
    {id: 'moonlit', title: 'Moonlight observatory', type: 'theme', points: 75,
      description: 'Give your lab a moonlit blue and lilac palette.', requirement: 'Earn 75 Wonder Sparks.'},
    {id: 'greenhouse', title: 'Sunbeam greenhouse', type: 'theme', points: 115,
      description: 'Bring warm sunlight and leafy colors into your lab.', requirement: 'Earn 115 Wonder Sparks.'},
    {id: 'nova', title: 'Nova, the wonder keeper', type: 'companion', points: 150,
      description: 'Meet a curious little robot companion with a glowing star lantern.',
      requirement: 'Earn 150 Wonder Sparks, collect all 6 cards, and review at least 3 different cards.'}
  ];
  const TIERS = [
    {id: 'seed', name: 'Seed inventor', threshold: 0},
    {id: 'beam', name: 'Beam builder', threshold: 40},
    {id: 'explorer', name: 'Lab explorer', threshold: 90},
    {id: 'keeper', name: 'Wonder keeper', threshold: 150}
  ];
  const TYPES = ['cosmetic', 'theme', 'companion'];
  const CARD_IDS = CARDS.map(card => card.id);
  const MAX_SPARKS = 188;

  function freshProgress() {
    return {version: 1, traces: C.PUZZLES.map(() => []), reviews: [], replays: [],
      replayReady: C.PUZZLES.map(() => false),
      equipped: {cosmetic: 'classic', theme: 'classic', companion: 'classic'}};
  }
  const defaults = {...C.clone(C.labDefaults), progress: freshProgress()};

  function cardIds(state, progress) {
    return CARDS.filter(card => {
      if (card.id === 'compare') return progress.traces[0].length >= 3;
      if (card.id === 'angle') return progress.traces[1].length >= 3;
      if (card.id === 'model') return progress.traces[2].length >= 5;
      return state.solved.includes(card.puzzle);
    }).map(card => card.id);
  }

  // Sparks are a total of saved, bounded facts, never an editable saved balance.
  // Hints do not enter this calculation and never reduce rewards.
  function earned(state, progress) {
    const cards = cardIds(state, progress);
    const points = state.solved.length * 20 + progress.traces.flat().length * 2
      + cards.length * 5 + (state.solved.length === C.PUZZLES.length ? 20 : 0)
      + progress.reviews.length * 3 + progress.replays.length * 4;
    const unlockedIds = REWARDS.filter(reward => points >= reward.points
      && (reward.id !== 'nova' || (cards.length === 6 && progress.reviews.length >= 3)))
      .map(reward => reward.id);
    return {points, cardIds: cards, unlockedIds};
  }

  function normalize(data) {
    const input = C.plain(data) ? data : {};
    const state = C.normalizeLab(input);
    const progress = freshProgress();
    const saved = C.plain(input.progress) && input.progress.version === 1 ? input.progress : {};
    progress.traces = C.PUZZLES.map((puzzle, index) => {
      const values = Array.isArray(saved.traces?.[index]) ? saved.traces[index] : [];
      const limit = 2 ** puzzle.mirrors.length;
      return [...new Set(values.filter(value => Number.isInteger(value) && value >= 0 && value < limit))]
        .slice(0, limit).sort((a, b) => a - b);
    });
    const availableCards = cardIds(state, progress);
    progress.reviews = CARD_IDS.filter(id => availableCards.includes(id)
      && Array.isArray(saved.reviews) && saved.reviews.includes(id));
    progress.replays = C.PUZZLES.map((_, index) => index).filter(index => state.solved.includes(index)
      && Array.isArray(saved.replays) && saved.replays.includes(index));
    progress.replayReady = C.PUZZLES.map((_, index) => saved.replayReady?.[index] === true
      && state.solved.includes(index) && !progress.replays.includes(index));
    const unlocked = earned(state, progress).unlockedIds;
    for (const type of TYPES) {
      const id = saved.equipped?.[type];
      if (unlocked.includes(id) && REWARDS.some(reward => reward.id === id && reward.type === type)) {
        progress.equipped[type] = id;
      }
    }
    return {...state, progress};
  }

  function goal(id, title, detail, current, target) {
    return {id, title, detail, current: Math.min(current, target), target, done: current >= target};
  }

  function snapshot(data) {
    const state = normalize(data), progress = state.progress;
    const result = earned(state, progress);
    const tierIndex = TIERS.findLastIndex(tier => result.points >= tier.threshold);
    const tier = {...TIERS[tierIndex], nextThreshold: TIERS[tierIndex + 1]?.threshold ?? null};
    const goals = [
      goal('first-solve', 'Light your first lamp', 'Solve any experiment. Hints are always welcome.', state.solved.length, 1),
      goal('test-three', 'Try three ideas', 'Send light through 3 different mirror arrangements, in any experiments.', progress.traces.flat().length, 3),
      goal('lab-complete', 'Complete the light lab', 'Solve all 3 reflection experiments, in any order.', state.solved.length, 3),
      goal('three-cards', 'Start a science collection', 'Discover 3 of the 6 illustrated concept cards.', result.cardIds.length, 3),
      goal('mirror-path', 'Build a mirror path', 'Use mirrors to guide a ray into a lamp.', state.solved.length > 0 ? 1 : 0, 1),
      goal('review-three', 'Look again, notice more', 'Open and review 3 different cards in your discovery book.', progress.reviews.length, 3),
      goal('replay-three', 'Revisit familiar paths', 'Change or reset a solved experiment, then light its lamp again. Each experiment counts once.', progress.replays.length, 3),
      goal('six-cards', 'Fill your discovery shelf', 'Collect all 6 cards by solving and testing different arrangements.', result.cardIds.length, 6)
    ];
    return {...result, equipped: {...progress.equipped}, tier,
      nextReward: REWARDS.filter(reward => !result.unlockedIds.includes(reward.id))
        .sort((a, b) => a.points - b.points)[0] ?? null,
      goals};
  }

  function delta(before, after, result = null) {
    return {pointsGained: after.points - before.points,
      newCards: after.cardIds.filter(id => !before.cardIds.includes(id)),
      newRewards: after.unlockedIds.filter(id => !before.unlockedIds.includes(id)), result};
  }
  const noChange = () => ({pointsGained: 0, newCards: [], newRewards: [], result: null});
  const validPuzzle = index => Number.isInteger(index) && index >= 0 && index < C.PUZZLES.length;

  function recordTrace(state, index, orientations) {
    if (!C.plain(state) || !validPuzzle(index) || !Array.isArray(orientations)
      || orientations.length !== C.PUZZLES[index].mirrors.length
      || !C.PUZZLES[index].mirrors.every((_, bit) => orientations[bit] === '/' || orientations[bit] === '\\')) return noChange();
    Object.assign(state, normalize(state));
    const before = snapshot(state), progress = state.progress;
    const mask = orientations.reduce((value, orientation, bit) => value | (orientation === '/' ? 1 << bit : 0), 0);
    if (!progress.traces[index].includes(mask)) progress.traces[index].push(mask);
    state.orientations[index] = orientations.slice();
    const result = C.traceLight(C.PUZZLES[index], orientations);
    if (result.success) {
      const alreadySolved = state.solved.includes(index);
      if (!alreadySolved) state.solved.push(index);
      if (alreadySolved && progress.replayReady[index] && !progress.replays.includes(index)) {
        progress.replays.push(index);
      }
      progress.replayReady[index] = false;
    }
    return delta(before, snapshot(state), result);
  }

  function armReplay(state, index) {
    if (!C.plain(state) || !validPuzzle(index)) return false;
    Object.assign(state, normalize(state));
    if (!state.solved.includes(index) || state.progress.replays.includes(index)) return false;
    state.progress.replayReady[index] = true;
    return true;
  }

  function reviewCard(state, id) {
    if (!C.plain(state) || !CARD_IDS.includes(id)) return noChange();
    Object.assign(state, normalize(state));
    const before = snapshot(state);
    if (!before.cardIds.includes(id) || state.progress.reviews.includes(id)) return noChange();
    state.progress.reviews.push(id);
    return delta(before, snapshot(state));
  }

  // Use equip(state, 'classic', type) to restore a default. Earned items are never spent.
  function equip(state, id, type) {
    if (!C.plain(state)) return false;
    Object.assign(state, normalize(state));
    if (id === 'classic' && TYPES.includes(type)) {
      state.progress.equipped[type] = 'classic';
      return true;
    }
    const reward = REWARDS.find(item => item.id === id);
    if (!reward || !snapshot(state).unlockedIds.includes(id)) return false;
    state.progress.equipped[reward.type] = id;
    return true;
  }

  return {CARDS, REWARDS, TIERS, MAX_SPARKS, defaults, normalize, snapshot,
    recordTrace, armReplay, reviewCard, equip};
});
