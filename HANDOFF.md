# Wonder Lab Adventures — Work Chat Handoff
**Checkpoint:** REL-01, October 26, 2026
**Primary audience:** ages 7–11 (design target; not child-tested)
**Current status:** Playable browser prototype; native/store release pending.

## Current continuation
The tested progression source is `85f0cd7` on `codex/lab-progression`. PR #2
stacks on still-open OPT-01 PR #1. REL-01 is developed separately on
`codex/lab-release01`; see `evidence/RELEASE01_REPORT.md` for current evidence.
Do not begin from main without checking those dependencies. The owner-private
mobile site serves the progression build; REL-01 does not deploy or merge.
Prior Build 01 native acceptance below remains future work, not this task.

## Mission
Continue this game as an original, polished, child-appropriate iOS/Android product. Prioritize the actual play loop, distinctive store presentation, and retention before monetization. Start with no advertising; any eventual ad tests must be controlled, policy-eligible, disclosed, and reversible.

## Already implemented
Three fully solvable 2D mirror-reflection puzzles, interactive rotations, visible ray tracing, locally triggered hints, discovery cards and local saves.

## The two additional differentiators
Hands-on experiments instead of multiple-choice questions; adaptive hints stored entirely on device.

## Exact source paths
- Browser build: `play/wonder-lab-adventures.html` (also `play/index.html` in the individual package).
- Game implementation: `games/lab.js`, `games/lab.css`, `games/lab.body.html`.
- Shared reference: `shared/core.js`, `shared/art.js`, `shared/ui.js`, `shared/style.css`.
- Icon/feature direction: `art/wonder-lab-adventures-*`.
- Real prototype captures: `evidence/lab-desktop.png`, `evidence/lab-mobile.png`.
- Test commands: `node --test tests/core.test.cjs tests/remote.test.cjs`; `python tests/test_signer.py` after installing its dependency.

## Next native milestone
Recreate the three reflection puzzles and local hints in Godot. Verify every solution and intermediate path, visibility with reduced motion, and touch readability. Obtain science-content review before expanding into gears, ramps or additional laboratories.

## Do not misrepresent these current limits
This build only explores idealized 2D light reflection. There is no full three-lab/24-puzzle curriculum, independent learning assessment, voice-over or evidence of educational improvement.

## Source-of-truth and safety rules
Read `docs/MASTER_TRACKER.md`, `README.md`, and `evidence/QA_REPORT.md` before claiming any previous task complete. Earlier v1 documents describe the intended launch scope, not delivered features.

The current source is a **browser prototype, not a Godot/native build**. The production recommendation remains Godot 4/GDScript. Check the actual local toolchain and current official export documentation before choosing an engine release or claiming a compiled result. Do not wrap these pages in a thin WebView and call the product finished.

No ads, purchases, analytics SDK, child login, chat, location, camera, microphone, or public sharing may be added in this milestone. No live service or remote endpoint is configured. Keep saves local; no child identities or persistent tracking identifiers may be uploaded.

The browser parent checkpoint is a test-only interaction barrier, not verified parental consent or the final purchase gate. Production parental controls require their own design/review.

`shared/core.js` contains tested business rules and pure simulation reference functions. `shared/remote-config.js` and `server/config_admin.py` are future-control scaffolding. No ad adapter exists. Current capability flags and signer both refuse enabled policies. Server settings cannot authorize unreviewed functionality. Do not add a dormant, undisclosed SDK or relax a safety gate to make a test pass.

App names, publisher identity, trademarks, signing identities, store account access, domains, privacy-policy URLs and product IDs remain unconfirmed. Do not invent them, purchase services, accept legal agreements, publish, or modify unrelated business websites.

## Work method
1. Inspect the supplied source and run the applicable tests. Fix real regressions before expanding scope.
2. Build the next native milestone below rather than repeating the broad portfolio plan.
3. Version any shared changes and preserve compatibility across all three games. Record proposals before changing the portfolio-wide contract; each game must retain distinct gameplay and branding.
4. Keep a task ledger with `not started / in progress / verified / blocked`, actual filenames, commands, test output, and known limits.
5. Produce working source and repeatable validation. If native export/signing cannot be performed, deliver source and tests and state exactly which verification is missing. Do not claim an App Store/TestFlight release.
6. Carry the new checkpoint into the next work chat. Do not promise background work or create a schedule unless explicitly asked.

## Acceptance for the next milestone
A reproducible native project; one complete first-play loop; local save/reload/reset; large readable touch controls and no dead buttons; offline play; no external SDK requests; first-session completion on a real test device when available; documented defects and screenshots matching the actual build. Record the device/tool versions, rather than treating desktop tests as mobile certification.

## Business measurement
No retention, public downloads, parent purchases or revenue have been measured. Begin with supervised comprehension/interest tests using `docs/PLAYTEST_PROTOCOL.md`. Browser visit counts are not unique users or retention. Do not infer success from synthetic tests, screenshot polish, or family enthusiasm alone.

## 2026-10-25 — Wonder Workshop continuation checkpoint

`codex/lab-progression` adds a finite local progression layer for the requested
ages 7–11: six science cards, four cosmetics, two themes, eight goals and Nova.
Sixteen original SVGs are integrated into the standalone build. The three
experiments and free local hints remain. See `docs/PROGRESSION.md` for rules,
`evidence/PROGRESSION_REPORT.md` for executed verification and actual screenshots.
OPT-01 PR #1 remains the dependency; the progression PR awaits owner review.
No retention outcome, child playtest or native build is claimed. A later authorized
hosting task updated the private site to `85f0cd7`; REL-01 verifies that identity
without deploying its changes.
