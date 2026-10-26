# Work log

## 2026-10-24 — GitHub/Codex preparation
- Added AGENTS.md, bounded task queue, setup guidance, review template and CI file.
- Added deterministic verification entrypoint and runtime version files.
- Corrected single-game build output, and made missing play/ directory recreation safe.
- No gameplay, shared policy, analytics or monetization changes.
- See GITHUB_CODEX_STATUS.md and evidence/GITHUB_READINESS.md for actual validation.
- GitHub repository creation/upload and Codex task execution remain blocked/pending.

## 2026-10-25 — OPT-01: puzzle correctness and discovery flow

- Verified full GitHub source at `12716c4`; clean isolated `codex/lab-opt01` branch.
  No baseline source import needed. Read all required handoff/status documents.
- Used pinned Node 22.16.0/Python 3.13.5 and isolated `.venv`; installed declared
  cryptography and pinned browser-test dependency. Initial verifier passed.
- New HTTP browser harness reproduced 18 failed baseline assertions across 17
  methods. Fixed stale hints/wins, restored verified saved beam state, added
  noncolor path descriptions and 44 px mirror controls. Rebuilt generated pages.
- Independent oracle proves all 24 existing arrangements and exact paths; all 3
  puzzles have exactly one verified solution. Edge/diverted/cyclic traces bounded.
- Final verifier passes; direct Node suites 81/81 and signer 6/6. Browser 17/17
  pass in system Chromium 154 with real storage/fresh contexts. No console/page
  errors or external requests. Actual phone/tablet/desktop screenshots captured.
- Full commands, baseline/final output, solutions and limits:
  `evidence/OPT01_REPORT.md`. No shared-library logic or other repositories changed.
- No physical-device, child-usability or learning-outcome testing. No deployment,
  merge, ads, analytics, profile upload or production service activation.

## 2026-10-25 — Wonder Workshop progression and original artwork

- Read AGENTS, CODEX_START_PROMPT, IMPORT_STATUS, HANDOFF, master tracker and
  required status/QA documents first. Clean baseline at `80e86ad` on OPT-01.
- New branch `codex/lab-progression` builds on the still-open OPT-01 PR #1;
  the new PR is stacked on `codex/lab-opt01`, without merging either branch.
- Baseline verifier: 81 Node checks + 6 Python tests pass. Baseline real-HTTP
  browser suite: 17/17 pass in Chromium 154. Pinned Node 22.16.0, isolated Python
  3.13.5 environment and declared dependencies reused.
- Added permanent, finite Wonder Sparks, six concept cards, eight goals, four
  cosmetics, two themes and Nova. Hints stay free; no daily pressure or random
  rewards. All equipment is usable and saved. Legacy saves migrate in place.
- Authored/integrated 16 original SVG illustrations in `art/rewards/`; build
  embeds them for standalone offline play. No original assets removed.
- Review reproduced a new keyboard focus escape after reviewing a card; fixed
  by moving focus to another enabled dialog control. Also fixed false save
  claims when browser storage is denied/full. Added browser regressions.
- Details: `docs/PROGRESSION.md`; test results and actual captures:
  `evidence/PROGRESSION_REPORT.md`. Generated pages rebuilt from source.
- Shared code, ads-off safeguards and the three puzzle rules remain unchanged.
  No analytics, account, upload, production endpoint or hosting update added.
- Final checks: `python scripts/verify.py` passes (106 Node + 6 signer tests);
  direct progression suite 25/25; existing HTTP browser suite 17/17; new suite
  12/12 in both system Chromium 154 and pinned Playwright Chromium 145. No browser
  console/page errors or unexpected external requests observed. No child,
  physical-device, demonstrated learning or measured retention tests performed.


## 2026-10-26 — REL-01: shipped-build verification and local progress

- Verified correct remote and clean starting `85f0cd7`; read all requested
  instructions/status/progression/evidence files. PR #1 and PR #2 remain open,
  unmerged. Created `codex/lab-release01` from PR #2 head, preserving history.
- Read-only verification of the existing owner-private Site returned 200 and
  exactly the 114872-byte committed progression HTML. No deployment/access edit.
- Installed declared dependencies in isolated Python 3.13.5; Node 22.16.0,
  Playwright 1.58.0 and its Chromium 145.0.7632.6. Baseline verifier 106+6 PASS;
  existing browser 17 and progression 12 PASS before source edits.
- Added real-origin regressions first: all five specified defects reproduced
  (four failed assertions and a lost-focus timeout). Preserved actual logs.
- Added game-local protected save and Web Lock transactions. Finite earned facts
  merge, conflicting mutable choices refresh explicitly, erasure invalidates
  stale writers before deletion, failures remain retryable, and older v1 writers
  cannot discard protected progression. Shared parent UI awaits truthful results;
  shared core contracts and all other repositories remain unchanged.
- Preserved puzzle focus, made pending saves visible without dropping keyboard
  focus, and handled another-tab board changes without stale path feedback.
  Existing browser assertions remain; helpers now wait for completed async saves.
- Added 25 save-model checks and 16 release browser methods, including real lock
  contention, persistent profile close/relaunch, renderer crash and unfinished
  experiment recovery. Final 131 Node + 6 Python + 17+12+16 browser PASS locally.
- Captured/inspected actual phone/tablet, conflict, waiting-save and failed-erase
  screenshots. No console/page errors or unexpected requests in normal contexts.
  Expected offline navigation failures/crash diagnostics are separately reported.
- Cold offline HTTP reload/fresh launch remain BLOCKED; loaded play works offline.
  Physical devices unavailable, so precise checklist marked BLOCKED. No child,
  retention, learning, native, public release or platform-certification claims.
- Reconciled requested ages 7–11, branch/deployment status and save/offline limits.
  Full commands/evidence/limitations: `evidence/RELEASE01_REPORT.md`.
