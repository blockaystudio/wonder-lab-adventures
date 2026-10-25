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
