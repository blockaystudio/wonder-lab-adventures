# Shared-code changes

Initial standalone repositories copy the same shared reference code. They are not
automatically synchronized. Record each change's files, compatibility impact,
regression tests and whether the other games need the same patch. Do not introduce
a private dependency/package service until it solves a demonstrated problem.

2026-10-24 packaging: no shared gameplay or policy logic changed.

2026-10-25 OPT-01: no shared source or policy changes. Added Lab-specific tests
against the existing `KidsCore` API; save key/schema remain v1-compatible. No
patch or synchronization is required in the other game repositories.

2026-10-25 Wonder Workshop: no shared source changed. A game-local progression
module wraps `KidsCore.normalizeLab`, keeping the existing v1 envelope/key and
legacy fields while adding `progress`. Build embeds original local SVGs.
Other game repositories require no patch. Older builds' normalizers can discard
new progression fields on downgrade; forward migration is tested.


2026-10-26 REL-01: `shared/ui.js` parent dialog now awaits reset/motion callbacks.
A reset that returns `false` or rejects stays open with an error; the failed-erase
controls say Close / Retry erasing (cancellation cannot promise to recover a
partially erased save). Motion callbacks returning `false` show the save warning.
Synchronous callbacks remain accepted: prior reset objects/undefined motion
results retain their success path, so the call signature and shared core API do
not change. `KidsCore.LocalSave`, normalization and remote policy are unchanged.

The durable save implementation is game-local in `games/save.js`. Other game
repositories were not edited. Their old LocalSave implementation still requires
its own scoped durability fix; this UI patch alone does not fix its swallowed
storage failures. Evidence: 25 save-model tests, release browser erase/failure
regressions and unchanged existing model suites. No SDK, network or policy change.
