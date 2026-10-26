# Wonder Lab Adventures — Codex optimization queue

These are prepared work items, not running jobs or existing GitHub issues.

| Order | Task | Acceptance |
|---|---|---|
| OPT-01 | Reproduce baseline and make testing portable | Run `python scripts/verify.py`; add a scoped browser harness using actual local HTTP storage, reload and error checks; disclose unavailable browsers/devices. |
| OPT-02 | Improve first-play usability and input | Improve mirror interaction, readable light paths, hint usefulness, keyboard access, and local puzzle progress. Prove all solutions and avoid unverified learning claims. Demonstrate a complete play loop, responsive layouts, readable text and no dead controls. |
| OPT-03 | Protect progress and lifecycle | Test save, reload, corrupt data, unavailable storage, reset, pause/background/resume and interrupted interactions; preserve compatible saves. |
| OPT-04 | Measure then optimize performance | Record repeatable baseline, fix a measured hotspot, compare same-scene results; avoid speculative rewrites or reduced visual quality. |
| OPT-05 | Accessibility and store-art consistency | Test keyboard/focus/touch targets, contrast and reduced motion; capture truthful prototype screens; do not make unsupported marketing claims. |
| OPT-06 | Native project implementation | Separate milestone after baseline optimization: use handoff acceptance criteria; verify native toolchain/export docs, implement one actual loop, do not claim signing/device work not performed. |

## First task to paste into Codex
Read AGENTS.md and the current handoff/status files. Begin OPT-01, not the whole
backlog. Reproduce the baseline, inspect this game's first-play flow and add a
minimal scoped browser regression harness for real HTTP-origin save/reload and
no unexpected network requests. Fix reproducible defects encountered in that
scope. Preserve no-ad/no-analytics/offline defaults. Work on a new branch, run
`python scripts/verify.py`, record exact evidence and limitations, and open one
reviewable PR. Do not merge, publish, activate monetization, or rewrite the engine.

## Then
Run OPT-02 in a separate task after review. Repeat for bounded tasks; no endless
"optimize everything" loop and no automatic public release. Synthetic tests do
not establish retention or purchase intent.

## 2026-10-25 checkpoint

OPT-01 implemented and locally verified; pending owner review. See
`evidence/OPT01_REPORT.md` for exact baseline failures, fixes, 81 model/policy
checks, 6 signer tests, 17 browser methods and actual screenshots. The requested
correctness/discovery scope included targeted input, hints, save failures and
small-screen regressions; this does not complete the broader OPT-02/03/05
backlog. Clearer onboarding, richer hints, book presentation, measured performance,
original final art and native Godot remain separate tasks. Stop after this PR.

## Wonder Workshop progression request

Implemented as a new bounded branch after OPT-01 at the user's request. See
`docs/PROGRESSION.md` and `evidence/PROGRESSION_REPORT.md`. This does not complete
native implementation or establish measured retention. Preserve the separate
backlog for child-informed onboarding, richer content/hints, performance,
production artwork review, accessibility/device QA and Godot work.
