(function () {
  'use strict';
  const C = KidsCore, A = KidsArt, U = KidsUI, P = WonderProgression;
  const $ = id => document.getElementById(id);
  const store = new C.LocalSave('wonder-lab-adventures', P.defaults, P.normalize);
  let state = store.data, result = null, hinted = -1, savingAvailable = false;
  state.visits++;
  const invitation = 'Turn a mirror, then send light to test your idea. Hints are always welcome.';
  const art = (id, cls = '') => `<span class="reward-art ${cls}" aria-hidden="true">${WonderRewardArt[id] || ''}</span>`;
  const rewardName = id => P.REWARDS.find(r => r.id === id)?.title || id;
  const cardName = id => P.CARDS.find(c => c.id === id)?.title || id;

  function restoreTrace() {
    const trace = C.traceLight(C.PUZZLES[state.puzzle], state.orientations[state.puzzle]);
    result = state.solved.includes(state.puzzle) && trace.success ? trace : null;
  }
  function freshFeedback() {
    hinted = -1;
    $('robot-note').textContent = invitation;
    $('lab-message').textContent = result?.success
      ? 'Your path lights the lamp. Your discovery is in the book.'
      : 'A fresh question. Turn a mirror, then send the light.';
    $('reward-notice').hidden = true;
  }
  function save() {
    savingAvailable = store.save(state);
    $('save-status').textContent = store.warning || 'Discoveries and rewards saved on this browser only';
    document.body.classList.toggle('reduced-motion', state.reducedMotion);
    return savingAvailable;
  }
  function openPuzzle(index) {
    state.puzzle = index;
    restoreTrace(); freshFeedback(); save(); render();
  }
  function describePath() {
    if (!result) return 'Light source → mirrors → lamp. Send light to see where your current path goes.';
    const route = ['Light source', ...result.touched.map(i => 'mirror ' + String.fromCharCode(65 + i))];
    const [x, y] = result.path.at(-1);
    route.push(result.success ? 'Lamp lit' : result.loop ? 'repeating path — light stopped'
      : (x < 0 ? 'left' : x > 8 ? 'right' : y < 0 ? 'top' : 'bottom') + ' board edge — lamp not lit');
    return route.join(' → ');
  }
  function renderProgress() {
    const s = P.snapshot(state);
    $('spark-count').textContent = s.points;
    $('tier-name').textContent = s.tier.name;
    $('collection-count').textContent = `${s.cardIds.length}/6 science cards · ${s.unlockedIds.length}/7 lab treasures`;
    $('next-wonder').textContent = s.nextReward
      ? `Next treasure: ${s.nextReward.title} · ${s.nextReward.points} lifetime Sparks${s.nextReward.id === 'nova' ? ', 6 cards and 3 reviews' : ''}`
      : 'Your cabinet is complete. Revisit any idea whenever you like.';
    const max = s.tier.nextThreshold || s.tier.threshold || 1;
    $('spark-meter').max = max;
    $('spark-meter').value = Math.min(s.points, max);
    document.body.dataset.theme = s.equipped.theme;
    const robot = $('robot-art');
    robot.dataset.cosmetic = s.equipped.cosmetic;
    robot.dataset.companion = s.equipped.companion;
    const bot = s.equipped.companion === 'nova' ? WonderRewardArt.nova
      : ['bot-mint', 'bot-plum'].includes(s.equipped.cosmetic) ? WonderRewardArt[s.equipped.cosmetic] : A.robot();
    robot.innerHTML = bot + (['goggles', 'badge-orbit'].includes(s.equipped.cosmetic)
      ? art(s.equipped.cosmetic, 'robot-accessory ' + s.equipped.cosmetic) : '');
    robot.setAttribute('aria-label', `Your helper: ${s.equipped.companion === 'nova' ? 'Nova' : 'Lab robot'}, ${s.equipped.cosmetic === 'classic' ? 'classic outfit' : rewardName(s.equipped.cosmetic)}`);
    $('discoveries').textContent = 'My discovery book · ' + s.cardIds.length + '/6';
  }
  function render() {
    const p = C.PUZZLES[state.puzzle];
    $('puzzle-list').innerHTML = C.PUZZLES.map((p, i) => `<button class="lab-step ${state.puzzle === i ? 'selected' : ''} ${state.solved.includes(i) ? 'solved' : ''}" data-puzzle="${i}" aria-pressed="${state.puzzle === i}"><span class="number">${state.solved.includes(i) ? '✓' : i + 1}</span><div><strong>${p.name}</strong><small>${p.mirrors.length} mirrors · A new idea</small></div></button>`).join('');
    document.querySelectorAll('[data-puzzle]').forEach(b => b.onclick = () => openPuzzle(Number(b.dataset.puzzle)));
    $('puzzle-title').textContent = p.name;
    $('concept').textContent = p.concept;
    $('lab-progress').innerHTML = C.PUZZLES.map((_, i) => `<span class="${state.solved.includes(i) ? 'done' : ''}"></span>`).join('');
    let html = '';
    for (let y = 0; y < 6; y++) for (let x = 0; x < 9; x++) {
      const m = p.mirrors.findIndex(v => v[0] === x && v[1] === y);
      const start = x === p.start[0] && y === p.start[1], goal = x === p.goal[0] && y === p.goal[1];
      html += '<div class="lab-cell">' + (m >= 0
        ? `<button class="mirror ${state.orientations[state.puzzle][m] === '\\' ? 'backslash' : ''} ${hinted === m ? 'hint' : ''}" data-mirror="${m}" data-label="${String.fromCharCode(65 + m)}" aria-label="Rotate mirror ${String.fromCharCode(65 + m)}. Currently ${state.orientations[state.puzzle][m] === '/' ? 'sloping up right' : 'sloping down right'}"></button>`
        : start ? '<div class="light-source" aria-label="Light source">☀</div>'
          : goal ? `<div class="light-goal ${result?.success ? 'lit' : ''}" aria-label="${result?.success ? 'Lamp is lit' : 'Lamp is waiting for light'}"><span class="lamp">✧</span></div>` : '') + '</div>';
    }
    $('board').innerHTML = html;
    document.querySelectorAll('[data-mirror]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.mirror);
      P.armReplay(state, state.puzzle);
      state.orientations[state.puzzle][i] = state.orientations[state.puzzle][i] === '/' ? '\\' : '/';
      result = null; freshFeedback();
      $('lab-message').textContent = 'Mirrors changed. Send light to test this path.';
      save(); render();
      document.querySelector(`[data-mirror="${i}"]`)?.focus({preventScroll: true});
    });
    $('path-description').textContent = describePath();
    $('ray').innerHTML = result ? `<path pathLength="1" d="${result.path.map(([x, y], i) => (i ? 'L' : 'M') + (x * 100 + 50) + ' ' + (y * 100 + 50)).join(' ')}"/>` : '';
    $('next-puzzle').hidden = !result?.success || state.puzzle === 2;
    renderProgress();
  }
  function celebrate(delta, title) {
    const notice = $('reward-notice');
    notice.hidden = !delta.pointsGained;
    if (!delta.pointsGained) return;
    const items = [...delta.newCards.map(id => ({id, title: cardName(id)})),
      ...delta.newRewards.map(id => ({id, title: rewardName(id)}))];
    notice.innerHTML = `<div class="reward-celebration">${art(items[0]?.id || 'spark')}<div><span class="eyebrow">${title}</span><h3>+${delta.pointsGained} Wonder Sparks</h3><p>${items.length ? items.map(v => C.escapeHTML(v.title)).join(' · ') : 'A new idea recorded in your notebook.'}</p><button class="secondary" id="see-rewards">See my goals & treasures</button></div></div>`;
    $('see-rewards').onclick = showGoals;
  }
  function hint() {
    const p = C.PUZZLES[state.puzzle];
    hinted = p.solution.findIndex((o, i) => state.orientations[state.puzzle][i] !== o);
    $('robot-note').textContent = hinted < 0 ? 'Your mirrors are lined up. Try sending the light!'
      : `Take another look at mirror ${String.fromCharCode(65 + hinted)}. Turn it once, then follow where the light goes.`;
    render();
  }
  $('send-light').onclick = () => {
    const i = state.puzzle, p = C.PUZZLES[i], first = !state.solved.includes(i);
    state.attempts[i]++;
    const delta = P.recordTrace(state, i, state.orientations[i]);
    result = delta.result;
    if (result.success) {
      $('lab-message').innerHTML = '<strong>Aha! You lit the lamp.</strong> ' + p.concept;
      $('robot-note').textContent = state.solved.length === 3
        ? 'All three paths explored! Try another arrangement or visit your discovery book. There is no hurry.'
        : 'You found a path! A fresh experiment is waiting whenever you are ready.';
      if (first) U.spark(document.querySelector('.lab-stage'));
    } else {
      $('lab-message').innerHTML = '<strong>A useful experiment!</strong> Follow the beam and try turning the mirror where it goes off course.';
      $('robot-note').textContent = 'Nothing is lost when you try. Every path gives you another clue.';
      if (state.attempts[i] >= 2) {
        hinted = p.solution.findIndex((o, j) => state.orientations[i][j] !== o);
        if (hinted >= 0) $('robot-note').textContent = `Here’s a little help: try turning mirror ${String.fromCharCode(65 + hinted)}. Your hints stay on this browser.`;
      }
    }
    save(); render(); celebrate(delta, result.success ? 'Discovery made!' : 'Curiosity counts!');
  };
  $('hint').onclick = hint;
  $('reset-puzzle').onclick = () => {
    P.armReplay(state, state.puzzle);
    state.orientations[state.puzzle] = C.PUZZLES[state.puzzle].initial.slice();
    state.attempts[state.puzzle] = 0; result = null;
    freshFeedback(); save(); render();
    $('lab-message').textContent = 'A fresh start. Your cards, Sparks and treasures are still safe.';
  };
  $('next-puzzle').onclick = () => openPuzzle(Math.min(2, state.puzzle + 1));

  function storageNotice() {
    return savingAvailable ? '' : `<p class="warning" role="status">${C.escapeHTML(store.warning || 'Progress lasts for this visit only.')}</p>`;
  }
  function showBook() {
    const s = P.snapshot(state);
    U.modal(`<div class="wonder-book"><span class="eyebrow">Your cabinet of curiosities · ${s.cardIds.length}/6</span><h2>Small experiments. Big ideas.</h2><p>Earn cards by solving and trying different mirror arrangements. Review each earned card once for 3 Sparks. Hints are always free.</p>${storageNotice()}<p id="book-feedback" role="status"></p><div class="card-collection">${P.CARDS.map(c => {
      const earned = s.cardIds.includes(c.id), reviewed = state.progress.reviews.includes(c.id);
      return `<article data-card="${c.id}" class="science-card ${earned ? 'discovery' : 'card-locked'}">${art(c.id)}<span class="eyebrow">${earned ? 'Discovered' : 'Still to explore'}</span><h3>${C.escapeHTML(c.title)}</h3><p>${C.escapeHTML(earned ? c.description : c.condition)}</p>${earned
        ? `<button class="secondary wide" data-review="${c.id}" ${reviewed ? 'disabled' : ''}>${reviewed ? (savingAvailable ? 'Reviewed · saved' : 'Reviewed · this visit') : 'Review discovery · +3 Sparks'}</button>`
        : '<span class="collection-lock">Not yet collected · no hurry</span>'}</article>`;
    }).join('')}</div><p class="small">This prototype explores idealized 2D flat-mirror reflection. The ray is a simplified model, not a full description of light or an independently validated learning assessment.</p></div>`, dialog => {
      dialog.querySelector('.modal').classList.add('wonder-modal');
      dialog.querySelectorAll('[data-review]').forEach(button => button.onclick = () => {
        const delta = P.reviewCard(state, button.dataset.review);
        const persisted = save(); render();
        button.disabled = true; button.textContent = persisted ? 'Reviewed · saved' : 'Reviewed · this visit';
        // Keep keyboard focus in the dialog after the credited button is disabled.
        (dialog.querySelector('[data-review]:not([disabled])') || dialog.querySelector('.modal-close')).focus({preventScroll: true});
        dialog.querySelector('#book-feedback').textContent = delta.pointsGained
          ? `Idea revisited! +${delta.pointsGained} Sparks.${delta.newRewards.length ? ' New treasure: ' + delta.newRewards.map(rewardName).join(', ') + '.' : ''}`
          : 'This review is already saved. You can read it again whenever you like.';
        if (!persisted) dialog.querySelector('#book-feedback').textContent += ' ' + store.warning;
        celebrate(delta, 'An idea worth revisiting');
      });
    });
  }
  function updateEquipButtons(dialog) {
    const s = P.snapshot(state);
    dialog.querySelectorAll('[data-equip]').forEach(button => {
      const r = P.REWARDS.find(r => r.id === button.dataset.equip);
      const unlocked = s.unlockedIds.includes(r.id), selected = s.equipped[r.type] === r.id;
      button.disabled = !unlocked;
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? '✓ Using this' : unlocked ? 'Use this' : `Unlock at ${r.points} Sparks`;
    });
    dialog.querySelectorAll('[data-equip-default]').forEach(button => button.setAttribute('aria-pressed', String(s.equipped[button.dataset.equipDefault] === 'classic')));
  }
  function showGoals() {
    const s = P.snapshot(state);
    U.modal(`<div class="wonder-hub"><div class="hub-heading">${art('mission')}<div><span class="eyebrow">The Wonder Workshop</span><h2>Your next “what if?”</h2><p>${s.points} lifetime Sparks · ${C.escapeHTML(s.tier.name)}. Nothing expires. Explore at your pace.</p></div></div>${storageNotice()}<div class="hub-columns"><section class="mission-board"><h3>Little goals. Lasting discoveries.</h3><ul class="mission-list">${s.goals.map(g => `<li data-goal="${g.id}" class="${g.done ? 'goal-done' : ''}"><span class="goal-mark" aria-hidden="true">${g.done ? '✓' : '✧'}</span><div><strong>${C.escapeHTML(g.title)}</strong><p>${C.escapeHTML(g.detail)}</p><span class="goal-status">${g.done ? 'Complete' : 'Exploring'} · ${g.current}/${g.target}</span></div></li>`).join('')}</ul></section><section class="reward-rules"><h3>How Wonder Sparks grow</h3><p>These Sparks are progress, not money. You never spend or lose them.</p><dl><dt>First solve of each puzzle</dt><dd>+20</dd><dt>Each different mirror test</dt><dd>+2</dd><dt>Each discovery card</dt><dd>+5</dd><dt>All three puzzles solved</dt><dd>+20</dd><dt>First review of each card</dt><dd>+3</dd><dt>Replay a solved path after changing it</dt><dd>+4 once per puzzle</dd></dl><p class="small">Hints cost nothing and never reduce rewards. Repeating the same test or review does not add more Sparks. There are 188 Sparks to explore in this little lab.</p></section></div><section><div class="collection-heading"><h3>Your lab treasures</h3><span>4 cosmetics · 2 themes · 1 special friend</span></div><p class="small">All treasures are shown from the start. Nova needs 150 Sparks, all 6 cards and 3 card reviews.</p><p id="equip-feedback" role="status"></p><div class="treasure-grid">${P.REWARDS.map(r => `<article class="treasure ${s.unlockedIds.includes(r.id) ? 'earned' : 'locked'}" data-reward="${r.id}">${art(r.id)}<span class="eyebrow">${C.escapeHTML(r.type)}</span><h3>${C.escapeHTML(r.title)}</h3><p>${C.escapeHTML(r.description)}</p><p class="reward-requirement">${C.escapeHTML(r.requirement)}</p><button class="secondary wide" data-equip="${r.id}" aria-label="Use ${C.escapeHTML(r.title)}"></button></article>`).join('')}</div><div class="classic-options"><span>Or keep your familiar lab:</span><button class="secondary" data-equip-default="cosmetic">Classic robot</button><button class="secondary" data-equip-default="theme">Classic lab</button><button class="secondary" data-equip-default="companion">Original helper</button></div></section><section class="collection-preview"><h3>Six cards to wonder about</h3><div class="card-preview-grid">${P.CARDS.map(c => `<div class="card-preview">${art(c.id)}<strong>${C.escapeHTML(c.title)}</strong><span>${s.cardIds.includes(c.id) ? '✓ Collected' : C.escapeHTML(c.condition)}</span></div>`).join('')}</div><button class="primary" id="hub-open-book">Open my discovery book</button></section></div>`, dialog => {
      dialog.querySelector('.modal').classList.add('wonder-modal');
      updateEquipButtons(dialog);
      dialog.querySelectorAll('[data-equip]').forEach(button => button.onclick = () => {
        if (!P.equip(state, button.dataset.equip)) return;
        const persisted = save(); render(); updateEquipButtons(dialog);
        dialog.querySelector('#equip-feedback').textContent = rewardName(button.dataset.equip) + (persisted ? ' is now part of your lab. Saved on this browser.' : ' is ready for this visit. ' + store.warning);
      });
      dialog.querySelectorAll('[data-equip-default]').forEach(button => button.onclick = () => {
        P.equip(state, 'classic', button.dataset.equipDefault);
        save(); render(); updateEquipButtons(dialog);
        dialog.querySelector('#equip-feedback').textContent = 'Your familiar lab style is back. All treasures are still yours.';
      });
      dialog.querySelector('#hub-open-book').onclick = showBook;
    });
  }
  U.mountHeader('lab', 'Wonder Lab Adventures', 'Follow a question. Find a wonder.');
  $('banner-art').innerHTML = art('progression-hero');
  $('spark-icon').innerHTML = art('spark');
  $('open-goals').onclick = showGoals;
  $('discoveries').onclick = showBook;
  $('parents').onclick = () => U.parentArea(store,
    [{value: state.solved.length, label: 'Experiments solved'}, {value: P.snapshot(state).points, label: 'Local Wonder Sparks'}],
    () => location.reload(), () => {state.reducedMotion = !state.reducedMotion; save();});
  restoreTrace(); freshFeedback(); save(); render();
})();
