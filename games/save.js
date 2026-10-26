/* Wonder Lab save protocol v2. Local only; older builds cannot replace this record. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../shared/core.js'), require('./progression.js'));
  else root.WonderSave = factory(root.KidsCore, root.WonderProgression);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C, P) {
  'use strict';
  const KEY = 'kidslab.v2.wonder-lab-adventures';
  const LEGACY_KEY = 'kidslab.v1.wonder-lab-adventures';
  const LOCK = 'wonder-lab-adventures:progress';
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const union = (a, b) => [...new Set([...a, ...b])];
  const fresh = () => C.clone(P.defaults);
  const complete = data => C.plain(data) && C.plain(data.progress) && data.progress.version === 1
    && Array.isArray(data.solved) && Array.isArray(data.orientations) && data.orientations.length === 3
    && Array.isArray(data.attempts) && data.attempts.length === 3;

  // Only earned facts are monotonic. A conflicting board/choice is never silently
  // resolved by a last-writer-wins snapshot. The caller shows the saved version.
  function merge(base, local, remote) {
    base = P.normalize(base); local = P.normalize(local); remote = P.normalize(remote);
    const next = C.clone(remote);
    let conflict = false;
    function choice(before, wanted, saved) {
      if (equal(wanted, before)) return C.clone(saved);
      if (equal(saved, before) || equal(wanted, saved)) return C.clone(wanted);
      conflict = true;
      return C.clone(saved);
    }
    function count(before, wanted, saved) {
      if (wanted >= before && saved >= before) return saved + wanted - before;
      return choice(before, wanted, saved);
    }
    next.solved = union(remote.solved, local.solved);
    next.puzzle = choice(base.puzzle, local.puzzle, remote.puzzle);
    next.reducedMotion = choice(base.reducedMotion, local.reducedMotion, remote.reducedMotion);
    next.visits = count(base.visits, local.visits, remote.visits);
    next.orientations = C.PUZZLES.map((_, i) => choice(base.orientations[i], local.orientations[i], remote.orientations[i]));
    next.attempts = C.PUZZLES.map((_, i) => count(base.attempts[i], local.attempts[i], remote.attempts[i]));
    next.progress.traces = C.PUZZLES.map((_, i) => union(remote.progress.traces[i], local.progress.traces[i]));
    next.progress.reviews = union(remote.progress.reviews, local.progress.reviews);
    next.progress.replays = union(remote.progress.replays, local.progress.replays);
    next.progress.replayReady = C.PUZZLES.map((_, i) => choice(base.progress.replayReady[i], local.progress.replayReady[i], remote.progress.replayReady[i]));
    for (const type of ['cosmetic', 'theme', 'companion']) {
      next.progress.equipped[type] = choice(base.progress.equipped[type], local.progress.equipped[type], remote.progress.equipped[type]);
    }
    return {data: P.normalize(next), conflict};
  }

  class LocalProgress {
    constructor(options = {}) {
      this.key = LEGACY_KEY;
      this.authoritativeKey = KEY;
      this.warning = ''; this.status = 'loaded'; this.conflict = false;
      this.generation = null; this.revision = 0;
      try { this.storage = options.storage === undefined ? globalThis.localStorage : options.storage; }
      catch (_) { this.storage = null; }
      this.locks = options.locks === undefined ? globalThis.navigator?.locks : options.locks;
      this.newGeneration = options.newGeneration || (() => globalThis.crypto.randomUUID());
      this.data = this.load();
      this.base = C.clone(this.data);
    }

    legacy(raw) {
      if (!raw || raw.length > 150000) return null;
      try {
        const value = JSON.parse(raw);
        return value.schema === 1 && value.game === 'wonder-lab-adventures' && C.plain(value.data)
          ? P.normalize(value.data) : null;
      } catch (_) { return null; }
    }

    read() {
      const raw = this.storage.getItem(KEY);
      if (raw === null) return null;
      // An unrecognized authoritative record must not fall through to an older
      // projection. That could restore erased data or discard a future schema.
      if (raw.length > 150000) throw new Error('Protected save is too large');
      const record = JSON.parse(raw);
      if (!C.plain(record) || record.schema !== 2 || typeof record.generation !== 'string'
        || !record.generation || record.generation.length > 100
        || !Number.isSafeInteger(record.revision) || record.revision < 1
        || !['migration', 'erase'].includes(record.origin) || typeof record.erasing !== 'boolean') {
        throw new Error('Protected save is not supported');
      }
      if (record.erasing) {
        // A pending erase is a tombstone, even if its data was damaged.
        record.data = fresh(); record.backup = null;
      } else if (C.plain(record.data?.progress) && Number.isInteger(record.data.progress.version)
        && record.data.progress.version > 1) {
        throw new Error('Newer progression version is not supported');
      } else if (!complete(record.data)) {
        if (!complete(record.backup)) throw new Error('Protected save cannot be recovered');
        record.data = record.backup;
        this.warning = 'Recovered the previous protected save.';
      }
      record.data = P.normalize(record.data);
      record.backup = complete(record.backup) ? P.normalize(record.backup) : null;
      return record;
    }

    adopt(record) {
      this.data = C.clone(record.data);
      this.base = C.clone(record.data);
      this.generation = record.generation;
      this.revision = record.revision;
    }

    load() {
      if (!this.storage) {
        this.status = 'visit-only';
        this.warning = 'Progress lasts for this visit only: browser saving is unavailable.';
        return fresh();
      }
      try {
        const record = this.read();
        if (record) {
          this.adopt(record);
          if (record.erasing) {
            this.status = 'erase-pending';
            this.warning = 'Erasure is unfinished. Old progress is blocked. Ask a grown-up to retry erasing in this build.';
          } else {
            const old = this.storage.getItem(LEGACY_KEY);
            if (old !== null && !this.legacy(old)) this.warning = 'Recovered progress from the protected save; the older save copy was unreadable.';
          }
          return record.data;
        }
        for (const key of [LEGACY_KEY, LEGACY_KEY + '.backup']) {
          const raw = this.storage.getItem(key), data = this.legacy(raw);
          if (data) {
            if (key.endsWith('.backup')) this.warning = 'Recovered the previous saved visit.';
            return data;
          }
          if (raw !== null) this.warning = 'The previous save could not be read. A safe save was used.';
        }
        return fresh();
      } catch (_) {
        this.status = 'blocked';
        this.warning = 'The protected save could not be read. Saving is paused to keep it safe. Ask a grown-up to reload or erase it.';
        return fresh();
      }
    }

    visitOnly(data, message) {
      this.data = P.normalize(data); this.status = 'visit-only'; this.conflict = false;
      this.warning = message || 'Your browser cannot save right now. This visit still works.';
      return false;
    }

    reject(record, message) {
      if (record) this.adopt(record);
      else { this.data = fresh(); this.base = fresh(); this.generation = null; this.revision = 0; }
      this.conflict = true; this.status = 'conflict'; this.warning = message;
      return false;
    }

    async save(data) {
      const wanted = P.normalize(C.clone(data)), base = C.clone(this.base), generation = this.generation;
      this.conflict = false;
      if (!this.storage) return this.visitOnly(wanted, 'Progress lasts for this visit only: browser saving is unavailable.');
      if (!this.locks?.request) return this.visitOnly(wanted, 'Progress lasts for this visit only: this browser cannot safely coordinate saved tabs.');
      try {
        return await this.locks.request(LOCK, async () => {
          let current;
          try { current = this.read(); }
          catch (_) {
            this.data = wanted; this.status = 'blocked';
            this.warning = 'The protected save could not be read. Saving is paused to keep it safe. Ask a grown-up to reload or erase it.';
            return false;
          }
          if (current?.erasing) return this.reject(current, 'Erasure is unfinished. Old progress is blocked. Ask a grown-up to retry erasing in this build.');
          if ((generation !== null && current?.generation !== generation)
            || (generation === null && current?.origin === 'erase')) {
            return this.reject(current, 'Progress was erased or replaced in another tab. This action was not saved. The current saved lab is now shown.');
          }
          const merged = merge(base, wanted, current?.data || base);
          if (merged.conflict) return this.reject(current, 'Another tab changed this experiment or choice. This action was not saved. The current saved lab is now shown; try again.');
          const next = current || {schema: 2, generation: this.newGeneration(), revision: 0,
            origin: 'migration', erasing: false, data: base, backup: null};
          if (!current || !equal(merged.data, current.data)) {
            next.backup = C.clone(next.data);
            next.data = merged.data;
            next.revision++;
            this.storage.setItem(KEY, JSON.stringify(next));
          }
          this.adopt(next);
          this.status = 'saved'; this.conflict = false;
          const recovered = this.warning.startsWith('Recovered') ? this.warning : '';
          this.warning = recovered;
          // The protected write above is the commit. Legacy copies are only a
          // compatibility view and can never overwrite it on a later load.
          try {
            const previous = this.storage.getItem(LEGACY_KEY);
            if (this.legacy(previous)) this.storage.setItem(LEGACY_KEY + '.backup', previous);
            this.storage.setItem(LEGACY_KEY, JSON.stringify({schema: 1, game: 'wonder-lab-adventures', data: next.data}));
          } catch (_) {
            this.warning = 'Progress is saved in this build. The compatibility copy for older builds could not be updated.';
          }
          return true;
        });
      } catch (_) { return this.visitOnly(wanted); }
    }

    async reset() {
      this.conflict = false;
      if (!this.storage || !this.locks?.request) {
        this.warning = 'Erasure could not be completed. Browser storage or safe tab coordination is unavailable. No saved-data deletion is confirmed.';
        this.status = 'erase-pending'; return false;
      }
      try {
        return await this.locks.request(LOCK, async () => {
          const blank = {schema: 2, generation: this.newGeneration(), revision: 1,
            origin: 'erase', erasing: true, data: fresh(), backup: null};
          // Commit the invalidation before attempting any multi-key deletion.
          // An interruption or deletion failure leaves a blank tombstone, never
          // an old backup eligible to restore into this generation.
          this.storage.setItem(KEY, JSON.stringify(blank));
          this.adopt(blank);
          this.status = 'erase-pending';
          for (const key of [LEGACY_KEY, LEGACY_KEY + '.backup']) this.storage.removeItem(key);
          if (this.storage.getItem(LEGACY_KEY) !== null || this.storage.getItem(LEGACY_KEY + '.backup') !== null) {
            throw new Error('Saved copy remains');
          }
          blank.erasing = false;
          this.storage.setItem(KEY, JSON.stringify(blank));
          this.adopt(blank); this.status = 'erased'; this.warning = '';
          return true;
        });
      } catch (_) {
        this.status = 'erase-pending';
        this.warning = 'Erasure could not be completed. A saved copy may remain. Retry erasing in this build; do not reopen an older build yet.';
        return false;
      }
    }
  }

  return {KEY, LEGACY_KEY, LOCK, merge, LocalProgress};
});
