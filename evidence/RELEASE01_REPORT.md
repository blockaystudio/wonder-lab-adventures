# REL-01 — shipped-build verification and local-progress hardening

2026-10-26. Bounded repository task, no merge or deployment.
Review: [PR #3](https://github.com/blockaystudio/wonder-lab-adventures/pull/3),
stacked on PR #2 and PR #1.

## Source and shipped identity

Read all requested instructions, handoff/status/tracker/progression reports and
additional AGENTS-required QA/task documents. Verified remote
`https://github.com/blockaystudio/wonder-lab-adventures.git`, clean working tree
at `85f0cd7b5f0e314d27086facc99b0f11bcd29771`. Created `codex/lab-release01`
from that commit. Existing source was present; no import or game recreation.

PR #1 remains open/unmerged (`codex/lab-opt01` → `main`, head `80e86ad`).
PR #2 remains open/unmerged (`codex/lab-progression` → `codex/lab-opt01`, head
`85f0cd7`). REL-01 targets `codex/lab-progression` and depends on both.

Read-only live verification of the existing owner-private Site returned HTTP 200,
114872 bytes, exactly equal to `85f0cd7:play/index.html`. SHA-256:
`baa4cb6fc20a432471a10c70b99fa80f4df25f6068ae8cd013367c38f6b37430`.
Site version 2 is active; hosting-source commit
`f609ef5b5c060bfd7b68ba89424b375b98cdc6c5`. See
[shipped identity](release01/shipped-identity.json). No access or deployment
changes occurred. The private Site still serves the assessed build, not REL-01.

## Baseline before editing

Pinned Node 22.16.0 and isolated Python 3.13.5, with declared cryptography 46.0.4
and Playwright 1.58.0. Browser: Playwright Chromium 145.0.7632.6.

```sh
export PATH=/workspace/toolchains/node-v22.16.0-linux-x64/bin:/workspace/wonder-lab-adventures/.venv/bin:$PATH
export PLAYWRIGHT_BROWSERS_PATH=/workspace/toolchains/pw-browsers
python -m pip install -r server/requirements.txt -r tests/browser-requirements.txt
python scripts/verify.py
python tests/browser_lab.py --output evidence/release01/baseline-browser-lab
python tests/browser_progression.py --output evidence/release01/baseline-browser-progression
```

Actual baseline: **106 Node + 6 Python PASS; 17 puzzle + 12 progression browser
methods PASS**. Logs: [verifier](release01/baseline-verifier.txt),
[puzzle browser](release01/baseline-browser-lab.txt),
[progression browser](release01/baseline-browser-progression.txt).

Before changing application source, added and ran:

```sh
python tests/browser_release.py --regressions-only --output evidence/release01/regression-before
```

All five reported defects reproduced: four failing assertions and a keyboard
focus timeout. [Original failing output](release01/regression-before.txt) and
[structured results](release01/regression-before/results.json) are retained.
The green older suites did not cover these cases.

## Fixes and behavior

| Defect before REL-01 | Result after REL-01 |
|---|---|
| Stale tabs replaced whole saves, losing another tab's discoveries/rewards | Native Web Locks serialize transactions; bounded earned facts and independent changes merge; overlapping board/equipment choices reject with a visible warning and refresh |
| A stale tab restored progress after parent erasure | An atomic blank record advances the reset generation before deleting old copies; stale generations cannot commit |
| Backup deletion failed silently and reloaded erased progress | Parent dialog awaits the result, shows incomplete erasure, and offers retry; the protected erase marker blocks backup restoration across reloads |
| Actual older HTML normalized away progression on rollback | An authoritative v2 record is outside old code's v1 key; returning to REL-01 preserves cards, reviews, Sparks and equipment |
| Puzzle selection replaced its focused button | Focus returns to the selected puzzle; Enter/Space/Tab/Shift+Tab continue through the list |

`games/save.js` provides the game-local protocol. The original v1 primary/backup
migrate and remain compatibility views; current data and the previous backup are
committed atomically within one protected record. Unsupported future schemas or
unreadable protected JSON pause writes instead of importing stale copies. Missing
storage, quota failures or unavailable Web Locks preserve visit-only play and
show truthful messages. No reward rules changed; free hints, all existing solves,
188-Spark cap and equipment remain covered by the original progression tests.

`games/lab.js` awaits saves, exposes a visible saving state, retains focus and
shows a warning when another tab changes the displayed experiment. During lock
contention controls are marked unavailable; attempted repeated activation does
not accidentally add another trace. A review-found null-result exception after a
remote board change was fixed and browser-tested. Failed partial erasure offers
Close / Retry erasing, because cancellation cannot promise to restore progress.

Shared change is limited to asynchronous-result/error handling in the parent UI;
`KidsCore.LocalSave`, shared normalizers and remote safeguards remain unchanged.
[Shared compatibility notes](../docs/SHARED_CHANGES.md). Other repositories were
not edited. Generated `play/` was rebuilt from source. No puzzles, rewards or
artwork were added; no ads, analytics, tracking, game accounts, purchases, uploads
or production endpoints were introduced.

## Final commands and executed results

Using the same PATH, isolated environment and browser-path settings above:

```sh
python scripts/verify.py
node tests/core.test.cjs
node tests/remote.test.cjs
node tests/lab.test.cjs
node tests/progression.test.cjs
node tests/save.test.cjs
python tests/browser_lab.py --output evidence/release01/browser-lab
python tests/browser_progression.py --output evidence/release01/browser-progression
python tests/browser_release.py --output evidence/release01/browser
python build.py
git diff --check
```

| Check | Actual result | Evidence |
|---|---|---|
| Build, syntax, metadata, generated-page equality and disabled network policy | PASS | [final verifier](release01/final-verifier.txt) |
| Node suites | 131 PASS: 51 core + 12 remote + 18 puzzle + 25 progression + 25 save | [core](release01/core-model.tap), [remote](release01/remote-model.tap), [puzzle](release01/lab-model.tap), [progression](release01/progression-model.tap), [save](release01/save-model.tap) |
| Python signer | 6 PASS | Same verifier |
| Existing puzzle browser | 17/17 PASS | [log](release01/final-browser-lab.txt), [JSON](release01/browser-lab/results.json) |
| Existing progression browser | 12/12 PASS | [log](release01/final-browser-progression.txt), [JSON](release01/browser-progression/results.json) |
| New release browser | 16/16 PASS | [log](release01/browser.txt), [JSON](release01/browser/results.json) |
| Normal browser console/page errors and unexpected requests | Zero observed | Browser reports; expected crash/offline diagnostics separated |

The verifier's Node test runner reports file-level aggregate results in this
environment; direct suite runs above additionally record each individual check.
Existing browser assertions were preserved. Input/read helpers now await the
visible completed-save state before checking asynchronous results. CI includes
all three browser suites and full Git history for the real old-build rollback
fixture. Three initial CI attempts passed the verifier, existing browser suites and 15
release checks, but Chromium's internal deliberate-crash triggers did not emit
an observable crash event on the runner. Explicit core-limit diagnostics ruled
out the proposed dump-limit explanation. Original logs are retained:
[first](release01/ci-first-run.txt), [second](release01/ci-second-run.txt),
[third](release01/ci-third-run.txt).

The final interruption test launches a dedicated browser, obtains renderer PIDs
from that browser's CDP connection, verifies their Linux process ancestry, pins their identity using pidfds, then
terminates only those test-owned renderers with SIGKILL. It still requires the
actual Playwright crash event and exact saved-progress recovery; no assertion is
skipped or weakened. This process-termination check currently requires Linux
`/proc`; it does not claim a portable device-kill implementation. The obsolete
core-limit workaround was removed. Current remote run outcome/link is recorded
on PR #3; local passes alone do not establish CI success.

The new suite uses real HTTP-origin localStorage, fresh contexts and native
Web Locks. It queues simultaneous writers behind a held browser lock and verifies
both solves (54 Sparks), then queues an erase before a stale writer and verifies
zero restored points. Independent choices merge; conflicting mirror choices
reject, refresh and can be retried. Actual `80e86ad` HTML is served at the same
origin for rollback, rather than simulating an old normalizer as browser proof.

Persistent Chromium profile close/relaunch retains 30 Sparks, review, equipment,
orientations and the solved beam. An abrupt renderer-process termination recovers committed
progress; closing an unfinished experiment recovers its last committed rotation
without inventing a solve. Injected write/delete failures test interrupted save
and erase ordering. These do not certify OS power loss, storage eviction or a
mobile operating system killing the app.

All three puzzle solutions remain verified by the independent 24-arrangement
oracle and mouse/emulated-touch/keyboard full-loop tests:

- A little reflection: `/`, `/` (11 path points).
- Take the lower path: `\`, `\` (12 path points).
- The long way around: `\`, `/`, `\`, `/` (24 path points).

## Actual screenshots

Captured from the regenerated candidate and visually inspected:

- [390px phone solved path](release01/browser/solved-390x844.png)
- [768px tablet](release01/browser/solved-768x1024.png)
- [Failed erase and retry](release01/browser/erase-failure.png)
- [Explicit tab conflict](release01/browser/tab-conflict.png)
- [Save waiting for a browser lock](release01/browser/save-waiting-for-lock.png)
- [390px first viewport](release01/browser/first-view-390x844.png)

Five emulated viewports: 320×740, 390×844, 844×390, 768×1024 and 1024×768.
Touch targets, hit testing, overflow, route text, reduced motion and dialog focus
were checked. The first phone viewport still places Send light below the fold;
onboarding/layout priority remains backlog, not a claim of child usability.

## Remaining production blockers and limits

1. **Cold offline HTTP startup/reload is unsupported.** Continued play after
   loading passes, but both offline reload and a fresh offline context fail with
   `ERR_INTERNET_DISCONNECTED`. The diagnostic test passing records this known
   failure; it does not claim offline startup. No PWA/native rewrite was started.
2. **Physical iOS Safari and Android Chrome remain BLOCKED.** No devices or
   device tooling are available. Follow the precise
   [device checklist](../docs/RELEASE01_DEVICE_CHECKLIST.md) on a verified candidate
   origin. Desktop touch emulation is not physical-device certification.
3. **Incompatible old builds must not be production rollback targets.** The
   collection survives a round trip back to REL-01, but old-build activities are
   not imported after v2 migration, and old erase controls cannot delete v2.
   An already-open old build may show stale memory or recreate its legacy copy.
   Erase using this build and close incompatible tabs before production use.
4. Safe persistence requires Web Locks (supported secure HTTPS/localhost
   contexts). Unsupported/insecure contexts are explicitly visit-only. Browser
   eviction, whole-record corruption and changing origin/browser cannot promise
   recovery of every saved action.
5. Owner review, dependency integration and an authorized release remain pending.
   The private hosting sign-in gate is not independent child distribution. No
   native Godot/store build, child playtest, demonstrated retention/learning result,
   Safari/Firefox desktop run or full accessibility/science/privacy audit.

Preview this candidate locally:

```sh
cd /workspace/wonder-lab-adventures
.venv/bin/python server/serve_preview.py
```

Open the loopback URL printed by the server. This is not a mobile-hosted update.
REL-01 stops at its reviewable PR and evidence; no merge/deploy/access change.
