# Master Tracker — Authoritative Current State
Current checkpoint: REL-01 • October 26, 2026 • browser prototype, ages 7–11

## REL-01 current state

The historical Build 01 portfolio tables below are not current repository or
hosting status. This repository contains Wonder Lab Adventures only.

| Task | State | Evidence |
|---|---|---|
| Verify source, PR dependencies and deployed bytes | Verified | Clean `85f0cd7`; PR #1/#2 open and unmerged; private Site v2 matches that HTML exactly |
| Record baseline and reproduce five defects before fixes | Verified | 106 Node + 6 signer; 17 + 12 browser baseline; all five new defect tests failed before changes |
| Protect concurrent saves, erasure and rollback | Implemented / automated verification | `games/save.js`, 25 model tests; lock contention, generations, explicit conflicts, protected copy |
| Fix keyboard puzzle focus | Verified automated | Enter/Space/Tab/Shift+Tab in release browser suite |
| Save/relaunch/crash/interruption and mobile layouts | Verified automated, desktop only | 16 release browser methods; persistent profile, renderer crash, five emulated viewports |
| Final regression checks | Passed locally | 131 Node + 6 signer + 17 puzzle + 12 progression + 16 release browser methods |
| Physical iOS Safari / Android Chrome | BLOCKED | No devices; `docs/RELEASE01_DEVICE_CHECKLIST.md` |
| Cold offline URL launch/reload | BLOCKED | Both fail with network disconnected; continued loaded play passes |
| Production rollback to pre-REL-01 code | BLOCKED | Old builds cannot honor v2 erase; collection survives return to REL-01 but old-build actions are not imported |
| Merge/deploy/native/store release | Not performed | `codex/lab-release01` stacks on PR #2; no deployment or access change |

Current report: `evidence/RELEASE01_REPORT.md`. The existing owner-private Site
serves `85f0cd7`, not REL-01. No retention, learning or child-comprehension outcome
has been measured. Prioritize remaining release/device/offline acceptance before
new content. Onboarding, deeper hints, book presentation, measured performance,
final storefront artwork and Godot remain bounded future work.

## Historical Build 01 preparation (October 24, 2026)

## Completed in this work session
| ID | Task | Evidence | Status |
|---|---|---|---|
| C01 | Inspect the supplied portfolio plan and all three work briefs | Preserved prior documents in this folder | Done |
| C02 | Define an intentionally small first-play loop for each game | Source + `handoffs/` | Done |
| C03 | Shared local-save normalization, backup and safe fallback | `shared/core.js`; unit tests | Done |
| C04 | Pet adoption/decorating/reactions/storybook prototype | `play/pocket-pet-village.html` | Done |
| C05 | Vehicle customization/driving/local-track prototype | `play/mini-garage-adventure.html` | Done |
| C06 | Light-puzzle/adaptive-hint/discovery prototype | `play/wonder-lab-adventures.html` | Done |
| C07 | Signed-config verification and fail-closed eligibility logic | `shared/remote-config.js`; tests | Done as infrastructure only |
| C08 | Offline policy signer and local preview server | `server/` | Written; signer tested; not deployed |
| C09 | Distinct art styles, original SVG assets and draft icon exports | `shared/art.js`; `art/` | Prototype art done |
| C10 | Browser tests, visual review, mobile width fix, dark-theme contrast fix | `evidence/` | Done within documented environment |
| C11 | Draft metadata and true prototype captures | `storefronts/`; `evidence/` | Internal drafts, not uploaded |
| C12 | Separate continuation briefs and source packages | `handoffs/`; ZIP packages | Done |

## Not completed / no authorization assumed
| ID | Task | Dependency / completion evidence needed |
|---|---|---|
| N01 | Trademark and title clearance; competition validation | Proper name/trademark review, final distinct brand approval |
| N02 | Supervised child/parent playtests | Parent permission and a minimal-data research process |
| N03 | Native Godot implementation | Reproduce validated gameplay; implement native save and input; test engine build |
| N04 | Full launch content | Pet: 4 pets, 3 rooms, 50+ assets, 4 minigames; Garage: 6 vehicles/12 courses; Lab: 24 puzzles/3 labs |
| N05 | Production parental gate and privacy review | Specialist assessment; app data-flow/SDK inventory; support and deletion workflow |
| N06 | Native optional purchases/restore/refunds | Developer agreements, products, sandbox billing, purchase QA |
| N07 | Physical-device QA | Actual iPhone/iPad/Android devices; touch, performance, interruption, install/reinstall, offline behavior |
| N08 | Final production artwork/audio/accessibility | Original final art, production voice/sound rights, low-reading UX, complete accessibility audit |
| N09 | App Store Connect / Google Play setup and submission | Publisher account access, legal identity, developer terms, signing keys, actual binaries |
| N10 | Public parent websites, policy/support pages | Approved publisher/domain, accurate disclosures, hosting security/logging review |
| N11 | Live signed configuration service | Secure key management, HTTPS endpoint, data/logging review, update/audit process |
| N12 | Actual ad integration and reviewed rollout | Platform eligibility, appropriate SDK, disclosures/review, consent basis as applicable, ad-content controls |
| N13 | Store listing experiments and measured retention | Live, comparable cohorts; platform data thresholds; privacy-approved measurements |

## Current commercial status
Zero public installs, revenue, retention cohorts or parent-purchase results have been measured for these games. All are still working titles. No developer accounts, repository, domain, host, billing account or public listing was created or modified.

## Next work order
1. Run the short supervised concept protocol in `PLAYTEST_PROTOCOL.md`; log observed comprehension, not assumptions.
2. Start each separate work chat from its corresponding handoff. Keep shared contracts versioned; do not silently fork behavior across the three products.
3. Build the Pocket Pet Village native vertical slice first while improving the two other concept loops from feedback.
4. Keep ads absent until the build and policy gate are satisfied. Increase only after a successful controlled experiment; there is no automatic upward schedule.

## Updated technical decision
Browser prototypes were used to make the three core loops immediately inspectable and testable without signing accounts or a native toolchain. These are **not** Godot exports. The native production-engine recommendation has not changed; a port remains actual work. The design and test cases transfer, but the browser code is not automatically a native application.

## Completion convention
“Done” means a tangible artifact exists with the stated verification. “Tested” only means the evidence described in the report. A prototype screenshot, HTML page, signing utility or green unit test is never evidence of store acceptance, legal compliance, product-market fit or revenue.

## 2026-10-25 — Wonder Lab Adventures OPT-01 checkpoint

This repository contains Wonder Lab Adventures only. Earlier portfolio rows and
absence-of-repository statements above are historical preparation context.

| Task | State | Actual evidence |
|---|---|---|
| Verify existing source and baseline | Verified | main `12716c4`; clean `codex/lab-opt01`; baseline verifier passed |
| Prove three puzzle solutions and bounded failure paths | Verified | `tests/lab.test.cjs`: independent oracle across all 24 arrangements; 18 passing tests |
| Complete HTTP-origin input/discovery/reload loop | Verified automated | `tests/browser_lab.py`: 17 passing Chromium methods, all 3 puzzles × mouse/touch/keyboard |
| Repair reproduced discovery-flow defects | Verified automated | stale hint/win feedback, saved beam restoration, noncolor route text, 44 px controls |
| Generated pages and model/policy/signer checks | Verified | 81 Node + 6 Python checks; `python scripts/verify.py` passes |
| Child usability, physical devices, learning outcomes | Not tested | Separate supervised/device milestones remain |

Full evidence, actual screenshots, commands and limitations:
`evidence/OPT01_REPORT.md`. OPT-01 implementation is ready for owner review;
no merge/publication authorization is assumed. Keep clearer onboarding, deeper
hints, further path readability, discovery-book presentation, measured performance,
original final storefront art and native Godot implementation in the backlog.

## 2026-10-25 — Wonder Workshop progression checkpoint

Requested audience for this feature: ages 7–11. This is a design target, not a
child-usability or learning-outcome validation. The existing game still contains
three hands-on reflection puzzles.

| Deliverable | State | Source/evidence |
|---|---|---|
| Finite deterministic reward progression | Implemented | `games/progression.js`; Wonder Sparks from distinct experiments, solves, collections, reviews and replays |
| Collection and visible goals | Implemented | 6 science cards, 8 goals, 4 cosmetics, 2 themes, Nova companion |
| Original artwork integrated offline | Implemented | 16 SVGs in `art/rewards/`; build embeds them into standalone pages |
| Compatible local saves and selection persistence | Automated verification | Legacy schema-1 migration, bounded facts, backups, denied/full storage; `tests/progression.test.cjs`, `tests/browser_progression.py` |
| New progression and original puzzle regressions | Automated verification | See `evidence/PROGRESSION_REPORT.md` for exact executed counts, results and screenshots |
| Improved real-user retention / child comprehension | Not measured | Supervised playtesting remains separate; no telemetry added |
| Native app / hosted update | Outside this task | No native export or deployment; owner review required for PR |

The progression branch depends on the still-open OPT-01 PR #1. No merge is
performed. Further content should reward new discoveries rather than increase
repetition requirements; a three-puzzle prototype is a finite first version.
