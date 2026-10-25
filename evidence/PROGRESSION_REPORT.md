# Wonder Workshop — progression and artwork implementation

2026-10-25. Bounded repository task; no measured retention claim.

## Source and baseline

Read `AGENTS.md`, `CODEX_START_PROMPT.txt`, `IMPORT_STATUS.md`, `HANDOFF.md`,
`docs/MASTER_TRACKER.md` and the additional required status/QA documents before
editing. Confirmed repository `blockaystudio/wonder-lab-adventures`, clean
working tree at `80e86ad49d2c8065f4460e9b5b4d49385c6bbfc0` (OPT-01).

Created `codex/lab-progression`. OPT-01 PR #1 remains open, so this task's PR
is stacked on `codex/lab-opt01`; neither PR was merged. Existing full source
was used, with no import/recreation. No credentials or child data were added.

Pinned Node 22.16.0 (`/workspace/toolchains/node-v22.16.0-linux-x64/bin`) and
Python 3.13.5 in the existing isolated `.venv`; cryptography 46.0.4 and
Playwright 1.58.0. Put the pinned Node and `.venv/bin` on PATH for the commands
below. No runtime dependencies were added to the game.

Before changes:

```sh
python scripts/verify.py
CHROMIUM_EXECUTABLE=/usr/bin/chromium .venv/bin/python tests/browser_lab.py --output test-results/progression-baseline
```

PASS: 81 existing Node checks, 6 signer tests, build/syntax/metadata/offline-page
checks; 17/17 actual HTTP browser methods. Actual baseline output is in
`progression/baseline-verifier.txt` and `progression/baseline-browser.txt`.
The source had no reward currency/equipment/goal system; no pre-existing
progression feature was claimed.

## Implemented experience

`games/progression.js` derives permanent **Wonder Sparks** from a bounded ledger
of facts: +20 first solve, +2 distinct tested arrangement, +5 discovery card,
+20 complete lab, +3 first card review, +4 once-per-puzzle replay after a
change/reset. The total is finite: **188 Sparks**. There is no spending, random
reward, daily timer, streak, missed-day penalty, or punishment for using hints.
Revisiting/reviewing replaces a fewer-hints bonus so support never costs rewards.

Six concept cards, eight visible goals, four ranks, seven usable equipment
unlocks, a collection book, an illustrated progress banner, and nonblocking
success/unlock panels are integrated into the existing hands-on puzzles.
All unlocks and their conditions are visible from the beginning. See the full
rules and thresholds in `docs/PROGRESSION.md`.

| Kind | Added items |
|---|---|
| 6 science cards | Light's straight path; A mirror's turn; A chain of reflections; Predict, turn, test; An equal-angle bounce; Models are maps |
| 4 cosmetics | Prism goggles; Mint explorer robot; Orbit inventor badge; Cosmic plum robot |
| 2 themes | Moonlight observatory; Sunbeam greenhouse |
| Longer collection goal | Nova, the wonder keeper: 150 Sparks + all 6 cards + 3 reviews |

Equipped accessories/robot shells, themes and Nova visibly change the game and
survive reload. Classic choices remain available. Cards explain simplified 2D
flat-mirror reflection and model limits; no hazardous experiment instructions
or educational-outcome promises were added. No new laboratory or hidden
experiment set is implied by an unlock.

## Original artwork and files

`art/rewards/` contains **16 original SVG sources**, including six different
science postcards, four cosmetics, two decorative lab scenes, Nova, a faceted
Spark, a mission notebook, and a wide illustrated hero. They were authored from
original geometry/palettes for this task, with no copied/licensed characters,
stock assets, external fonts, image downloads or runtime dependencies.
Provenance: `art/rewards/README.md` and `art/ASSET_LEDGER.md`.

`build.py` validates the required set and rejects script/image/foreignObject,
event handlers and external SVG links, then embeds artwork with the game-local
progression module into both standalone pages. Original art and shared source
are preserved. Runtime still denies network connections with CSP.

Main source: `games/lab.js`, `games/lab.body.html`, `games/lab.css`,
`games/progression.js`, `art/rewards/`, `build.py`. Generated output:
`play/index.html`, `play/wonder-lab-adventures.html`. Tests and CI were updated;
work log, handoff, trackers and shared-change notes document the result.

## Saves and defects fixed during review

The v1 key/envelope remain compatible. `data.progress` adds bounded unique
configuration masks, reviews, replay facts and selected equipment. Balances
and unlocked lists are derived, never accepted as arbitrary saved numbers.
Legacy solves, attempts, orientations and motion survive migration; corresponding
solve/card rewards are credited once without inventing old experiment/review
history. Backups and safe in-memory fallback remain.

Two new UI issues were reproduced and fixed before handoff:

1. Reviewing a card disabled the focused button; Tab could escape the modal.
   Focus now moves to an enabled review or close button. The real pre-fix
   observation is preserved in `progression/review-focus-before.txt`; browser
   regression checks Enter, Tab, Shift+Tab, Escape and restored trigger focus.
2. Storage denial/quota failures still displayed unconditional “saved” messages
   inside new reward dialogs. Book/goals now expose warnings; reviews/equipment
   distinguish saved from visit-only state. Both failure cases are browser-tested.

No shared library changes or edits to other repositories. A much older build
can discard added progression fields when it re-saves; downgrade persistence
is not promised. Changing origin/browser starts a separate local collection.

## Final verification

```sh
python scripts/verify.py
node tests/progression.test.cjs
node tests/core.test.cjs
node tests/remote.test.cjs
node tests/lab.test.cjs
CHROMIUM_EXECUTABLE=/usr/bin/chromium .venv/bin/python tests/browser_lab.py --output test-results/progression-existing-final
CHROMIUM_EXECUTABLE=/usr/bin/chromium .venv/bin/python tests/browser_progression.py --output evidence/progression/browser
PLAYWRIGHT_BROWSERS_PATH=/workspace/toolchains/pw-browsers .venv/bin/python tests/browser_progression.py --output test-results/progression-pinned
```

- Verifier PASS: **106 Node model/policy checks + 6 Python signer tests**,
  build/syntax/metadata and matching generated pages/offline CSP.
- New pure progression suite: **25/25 passed**. Covers exact awards, free hints,
  repeated-action limits, each card condition, all 13 rewards reachable at the
  finite cap, all slots, migration, malformed facts, backups and full save/load.
- Existing puzzle browser suite: **17/17 passed**, system Chromium 154.0.8037.57.
  Its sole expectation update is the discovery counter denominator from 3 to 6;
  existing input/path/storage assertions were retained.
- New progression browser suite: **12/12 passed**, system Chromium 154.0.8037.57.
- Same new suite: **12/12 passed**, pinned Playwright Chromium 145.0.7632.6.

The new browser suite earns all six cards and seven equipment rewards through
actual mirror controls/traces/reviews, without injecting an earned profile.
It enumerates all 24 arrangements, verifies point totals, free hints, duplicate
protection, replay limits, valid/invalid legacy saves, backup recovery,
all selected slots/reload, fresh contexts, offline continued play, and denied/
quota-limited storage. Actual HTTP origin localStorage is used; only explicit
failure/legacy/corruption scenarios inject storage setup. All browser contexts
check console/page errors, failed requests and unexpected external requests:
none observed. Goals/book are checked for overflow at 320×740, 390×844,
768×1024 and 1024×768 with 44px enabled controls and keyboard dialog navigation.

Logs: `progression/final-verifier.txt`, `progression/progression-model.tap`,
`progression/existing-browser-final.txt`, `progression/browser/{run.txt,results.json}`,
`progression/pinned-browser.{txt,json}`. Node's runner summarizes file-level
results in this environment; direct suite execution exposes individual counts.
CI also runs both browser suites after installing the pinned browser dependency.
Check the PR for the actual remote CI state.

## Actual captures and limitations

Nine rendered game captures are under `progression/browser/`, including first
success/unlock, initial goals, the collection milestone, collected/equipped treasures, the
science book, and phone/tablet dialogs. `progression/artwork-montage.png` is an
actual render of the new SVG source set. Phone goals and completed card/treasure
screens were visually reviewed. These are browser prototype captures, not
native screenshots, storefront approval, child tests or measured outcomes.

This is a finite first version around **three** puzzles. It provides collection
and revisit goals; it cannot establish improved long-term retention without
appropriate supervised evaluation. No physical iPhone/iPad/Android, Safari,
Firefox, child comprehension, scientific expert review or full accessibility
certification was performed. Touch is emulated. Offline tests cover continued
play after loading, not cold navigation to an uncached URL. No telemetry was
added to measure users. Browser-process restart persistence remains untested.

No merge, new production endpoint, hosted update, ad/analytics SDK, purchase,
account, upload, tracking or public release was performed in this task. The
previous private mobile site remains on its earlier OPT-01 snapshot.

Preview the new branch locally:

```sh
.venv/bin/python server/serve_preview.py
```

Open `http://127.0.0.1:8080/`. The already-running preview serves regenerated
files; a browser reload shows the updated build.

Future ideas: supervised comprehension feedback, more reviewed experiments,
player-chosen investigations, comparing two saved ray diagrams, richer mascot
expressions, accessibility/device checks, and the separate Godot milestone.
Reward new discoveries rather than raising repetition quotas.
