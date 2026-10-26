# Wonder Workshop — progression version 1

This is a finite, offline browser progression layer around the three existing
mirror experiments. It targets the requested ages 7–11; comprehension and
long-term retention have not been demonstrated with children.

## Wonder Sparks

Sparks are lifetime progress, never money or a spendable balance. Unlocks are
automatic, deterministic and shown from the start. There is no clock, daily
streak, random drop, deadline, account, purchase, ad or upload.

| Action | Sparks | Limit |
|---|---:|---|
| Solve a puzzle | 20 | First successful trace per puzzle |
| Test a different mirror arrangement | 2 | Once per arrangement: 4 + 4 + 16 possible |
| Discover a science card | 5 | Once for each of six cards |
| Complete the light lab | 20 | All three puzzles solved, once |
| Review a discovered card | 3 | First review of each card |
| Revisit a solved path | 4 | Change/reset a solved puzzle, then solve it again; once per puzzle |

The maximum is **188 Sparks**. Pressing Send light repeatedly on the same
arrangement, repeatedly reviewing, resetting, or reopening the game does not
mint more Sparks. Replays reward a deliberate revisit, not a date or absence.
Hints never reduce rewards or block an unlock. Reviewing/replaying is the
chosen alternative to rewarding fewer hints, so asking for support stays safe.

The eight goals cover a first solve, three distinct tests, completing the lab,
three cards, a successful mirror path, three reviews, three replays, and six
cards. Goals display their completion counts; Sparks are awarded for the actions
above, not again for viewing or checking a goal. Ranks are Seed inventor (0),
Beam builder (40), Lab explorer (90), and Wonder keeper (150).

## The collection

| Card | How to discover it |
|---|---|
| Light's straight path | Solve A little reflection |
| A mirror's turn | Solve Take the lower path |
| A chain of reflections | Solve The long way around |
| Predict, turn, test | Test 3 different arrangements in puzzle 1 |
| An equal-angle bounce | Test 3 different arrangements in puzzle 2 |
| Models are maps | Test 5 different arrangements in puzzle 3 |

The cards explain ideal flat-mirror reflection, comparison through changing a
variable, and the limits of the simplified 2D model. The angle card measures
angles from the perpendicular normal. No physical experiment instructions or
unverified educational-outcome claims are included.

| Lab treasure | Unlock | Visible use |
|---|---:|---|
| Prism goggles | 15 Sparks | Goggles on the robot |
| Mint explorer | 40 Sparks | Mint robot shell |
| Orbit inventor badge | 65 Sparks | Badge on the robot |
| Moonlight observatory | 75 Sparks | Blue/lilac lab and board palette |
| Cosmic plum | 90 Sparks | Plum robot shell |
| Sunbeam greenhouse | 115 Sparks | Leafy lab and board palette |
| Nova, the wonder keeper | 150 Sparks, all 6 cards, 3 reviews | Special robot companion |

A cosmetic, theme and companion occupy separate slots. Choosing a treasure
never spends Sparks or consumes an item. Classic styles remain available.
Nova can wear the goggles/badge; shell choices tint Nova while equipped.
All rewards can be reached in the existing lab. There is no implied secret
experiment set or extra curriculum behind the companion unlock.

## Implementation and saves

- `games/progression.js` is a game-local pure model; `games/lab.js` binds real
  puzzle traces, reviews, equipment controls and the goals/notebook screens.
- `games/save.js` owns this game's save protocol. `KidsCore.LocalSave` and
  `KidsCore.normalizeLab` retain their shared contracts. The shared parent dialog
  now awaits reset/motion callbacks and displays an explicit failure instead of
  claiming successful erasure or saving. See `docs/SHARED_CHANGES.md`.
- Existing `kidslab.v1.wonder-lab-adventures` primary/backup saves migrate into
  the authoritative `kidslab.v2.wonder-lab-adventures` record. The v1 schema-1
  copy remains a compatibility view for older builds. The v2 record contains
  normalized data, an embedded previous save from the same reset generation,
  a revision, and local reset-coordination metadata. The reset token is never
  uploaded and does not identify a player.
- The bounded `data.progress` object still records unique configuration masks,
  reviewed card IDs, replay facts/readiness and chosen equipment. Points, cards
  and unlocks are derived from those facts, not a trusted saved balance.
- Existing saves retain puzzle, orientations, attempts, discoveries and reduced
  motion. Existing solves receive corresponding solve/card/section credit;
  historical experiments and reviews are not invented. Migration is idempotent.
- During legacy migration, corrupt/unknown progression data is filtered or reset
  independently of solved discoveries. Invalid/locked equipment falls back to
  the classic style. Newer versions in a protected record are handled as below.
- Writes and erasure use a browser Web Lock. Independent changes and earned
  facts merge across tabs; overlapping board/choice changes are rejected with
  an explicit warning and the current saved state is shown. Rejected actions
  must be tried again. A tab from an older reset generation cannot restore its
  progress. Hints remain free, and merging never changes the finite award rules.
- Confirmed erasure first atomically replaces the protected record with a blank
  new generation, then removes both v1 copies. A deletion failure or interruption
  leaves an unfinished-erase marker that prevents backup recovery; the parent
  dialog reports failure and allows retry. It never confirms completion while
  a known legacy copy remains. A blank coordination record is retained so stale
  tabs cannot recreate erased discoveries.
- A malformed v1 primary can recover its backup during initial migration.
  After migration, damaged v1 copies cannot damage the protected save. Damaged
  data inside a valid v2 record can recover its embedded same-generation backup.
  An unreadable entire v2 record or newer unsupported schema pauses saving with
  a warning; it does not silently import an older copy. Recovery cannot promise
  the latest action if the current data itself was corrupted.
- Storage denial/quota failure keeps play in memory with truthful visit-only
  messages. Without Web Locks, persistence is also visit-only: safe coordination
  requires a supported browser on a secure origin (HTTPS or localhost). A plain
  HTTP LAN preview on a phone may lack this capability. There is no unlocked
  fallback that pretends concurrent writes are safe.
- After a rollback to an older build, returning to REL-01 preserves the protected
  collection, equipment and discoveries. Activities performed in that old build
  are **not imported** after v2 exists. Older builds cannot understand the new
  erase marker: they may display stale in-memory progress or undeleted legacy
  copies, and their erase control cannot erase the protected record. Perform
  erasure in REL-01 and prevent old builds being served as production rollbacks;
  the compatibility view is not full bidirectional downgrade support.
- Changing site origin/browser does not transfer saves. Continued play after
  loading works offline. Cold uncached HTTP launch and offline reload are not
  supported release guarantees; there is no service worker/native package in
  this milestone. Physical-device storage/lifecycle checks remain separately
  blocked pending actual devices.

## Original artwork

Sixteen original editable SVGs live in `art/rewards/`; the provenance README and
`art/ASSET_LEDGER.md` describe them. They include six distinct science postcards,
four cosmetics, two theme scenes, Nova, a Spark, a mission notebook and a hero.

`build.py` validates and embeds them into the standalone pages as
`WonderRewardArt`. No image server, font, library, or network fetch is needed.
The source directory remains the artwork source of truth. Theme rewards change
color/style, not the reflection rules. Original Build 01 art is retained.

## Future work, to validate before expanding

Supervised comprehension/playtesting with appropriate permission; a larger set
of reviewed hands-on experiments; optional player-chosen investigation goals;
a notebook that lets players compare two ray paths; richer mascot expressions;
and the separate native Godot implementation. Additional rewards should follow
meaningful new activities, not longer repetition quotas. No analytics or
measured retention improvement is claimed by this implementation.
