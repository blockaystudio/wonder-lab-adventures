# OPT-01 — Puzzle correctness and discovery flow

2026-10-25. Browser prototype only; bounded implementation task.

## Source and baseline

Verified `https://github.com/blockaystudio/wonder-lab-adventures`, main commit
`12716c4962dd597dba4e50c502073eaf3bf2d063`, clean working tree before edits on
`codex/lab-opt01`. The repository already contained the complete source; no
package import or invented replacement was needed. Read AGENTS, HANDOFF, status,
task queue, master tracker and QA report before editing. Existing artwork and
hidden configuration were preserved.

Shell networking initially lacked access. After enabling network access for the
commands, fetched Git history and verified every retrieved source blob against
GitHub's blob hashes. Python 3.13.5 matches `.python-version`; downloaded Node
22.16.0 matches `.nvmrc` and its official SHA256 checksum. Python's system
`ensurepip` was unavailable, so the isolated environment was bootstrapped with:

```sh
UV_CACHE_DIR=/tmp/wonder-uv uv venv --python /usr/bin/python3.13 --seed --clear .venv
.venv/bin/python -m pip install -r server/requirements.txt playwright==1.58.0
```

Before production edits, with pinned Node/Python on PATH:

```sh
python scripts/verify.py
```

PASS: existing model/policy suites (51 + 12 checks), 6 signer tests, build,
syntax, metadata and offline-page checks. Full output:
`opt01-baseline-verifier.txt`. This environment's Node test runner summarizes
files; direct suite runs below expose individual check counts.

The new browser harness was also run against an unchanged detached worktree:

```sh
git worktree add --detach /tmp/wonder-baseline origin/main
CHROMIUM_EXECUTABLE=/usr/bin/chromium .venv/bin/python tests/browser_lab.py --root /tmp/wonder-baseline --output test-results/browser-baseline
```

Baseline: 17 methods, 18 failed assertions including subtests, zero errors.
Saved as `opt01/browser-baseline.{txt,json}`. Failures reproduced stale hint
text after reset/puzzle switching, stale success text after mirror rotation,
saved solved boards losing their visible beam/lit lamp after reload, absent
noncolor path text, and mirror targets under 44px. At 390px, a mirror measured
approximately 32.3 × 30.9px. The baseline reload loops fail at restoration;
the final run exercises the complete loop past those failures.

## Changes and regressions

- `games/lab.js`: clear hint/success feedback with changed or reset boards;
  clear feedback on puzzle transitions. Re-trace saved solved arrangements on
  load/open, restoring the visible result only when the current arrangement
  actually reaches the lamp. Merely possessing a discovery never grants a win.
- `games/lab.body.html`, `.css`: visible route text naming the source, touched
  mirror letters, exit edge or lit lamp; polite status announcements; readable
  44px mirror targets/focus indication and a taller compact board. Existing
  mirrors are spaced apart, allowing targets to extend over empty neighbor
  cells without overlapping other controls. No additional laboratory/content.
- `tests/lab.test.cjs`: independent compass/table oracle, exact routes, all
  existing states, boundaries/diverted paths, cycle fixture and normalization.
- `tests/browser_lab.py`: local HTTP preview started/stopped by the harness,
  fresh contexts, real browser localStorage, actual control actions. Only
  storage-failure tests override APIs to simulate denied/quota-limited storage.
- `scripts/verify.py` now includes the model regressions. CI installs pinned
  Playwright and Chromium and runs the HTTP browser suite. `play/` was rebuilt
  from source using `python build.py`.

No shared library code, save schema/key, artwork, remote safeguards or disabled
advertising capability changed. No other repository was modified.

## Verified puzzle solutions

Coordinates are zero-based `(column,row)` on the existing 9×6 board. Mirrors
are listed A onward. `tests/lab.test.cjs` asserts every intermediate tile, not
just the destination, and compares every orientation with an independent oracle.

| Puzzle | Mirror orientations | Route through turning points | Path points | States checked |
|---|---|---|---:|---:|
| A little reflection | `/`, `/` | (0,3) → A(4,3) → B(4,1) → (8,1) | 11 | 4 |
| Take the lower path | `\`, `\` | (0,1) → A(2,1) → B(2,4) → (8,4) | 12 | 4 |
| The long way around | `\`, `/`, `\`, `/` | (0,1) → A(6,1) → B(6,4) → C(2,4) → D(2,0) → (8,0) | 24 | 16 |

Each has exactly one winning arrangement; all initial arrangements fail.
Tests cover four edge exits, a mirror diverting light before the lamp, repeated
tracing/rotations, a tile crossed in different directions, and a custom closed
cycle stopped on its first repeated directional state. Existing puzzles have
no obstacle tiles; no obstacle mechanic was invented. The finite 9×6×4 state
space, repeat detection and existing iteration cap bound processing.

## Final commands and results

With Node 22.16.0 and `.venv` Python 3.13.5 on PATH:

```sh
python scripts/verify.py
node tests/core.test.cjs
node tests/remote.test.cjs
node tests/lab.test.cjs
CHROMIUM_EXECUTABLE=/usr/bin/chromium .venv/bin/python tests/browser_lab.py --output evidence/opt01/browser
```

Verifier PASS. Direct Node suites: 51 + 12 + 18 = 81 checks passed; signer:
6 passed. Logs: `opt01-final-verifier.txt`, `opt01-{core,remote,lab}.tap`.
Browser: all 17 methods passed, zero failures/errors, Chromium 154.0.8037.57,
Playwright 1.58.0. Full JSON/run output and eight actual screenshots are in
`opt01/browser/`.

The browser suite exercises all three puzzles with mouse, emulated touch and
keyboard activation, traces unsuccessful and successful paths, checks cards,
reloads the same HTTP origin and recovers puzzle/orientations/attempts/cards,
and repeats completion without duplicate cards. It checks fresh-context
isolation, two-attempt local hints/reset/current-puzzle hints, malformed and
unknown saves, backup recovery, unavailable/quota-limited storage, continued
play offline, reduced motion, labels, 44px targets and center hit-testing.
320×740, 390×844, 768×1024 and 1024×768 layouts have no document overflow.
All contexts check console/page errors, failed requests and external requests:
none observed. Default loop viewport also covers 1280×900 desktop.

Screenshots visually reviewed: `opt01/browser/layout-320x740.png` and
`opt01/browser/layout-768x1024.png`. Captures show the actual generated build.

A second local run used the exact browser revision installed for CI:

```sh
PLAYWRIGHT_BROWSERS_PATH=/workspace/toolchains/pw-browsers .venv/bin/python -m playwright install chromium
PLAYWRIGHT_BROWSERS_PATH=/workspace/toolchains/pw-browsers .venv/bin/python tests/browser_lab.py --output test-results/browser-pinned
```

PASS: all 17 methods in Chromium 145.0.7632.6 (Playwright revision 1208).
Results copied to `opt01/browser-pinned.{txt,json}`. This checks local
compatibility with CI's browser; the PR checks show remote CI execution.

## Preview and limits

```sh
.venv/bin/python server/serve_preview.py
```

Open `http://127.0.0.1:8080/`. This is a loopback preview, not publication.
The generated HTML is standalone; the browser offline test covers continued
play after loading, not cold offline navigation to an uncached HTTP URL.

Automated simulation/browser checks do not establish child usability, physical
iPhone/iPad/Android behavior, Safari/Firefox compatibility, screen-reader
usability, learning outcomes, or complete science/accessibility validation.
Keyboard loops focus controls explicitly; a separate test exercises Tab,
Shift+Tab, Space, Enter and focus recovery through repeated rotations. Real
storage survives same-context reload; persistence after browser-process restart
is outside this harness. The experiments remain a simplified 2D flat-mirror
model. No child data, profile upload, analytics, ad SDK, account, purchase,
production endpoint, native export or public deployment was added.

Backlog remains: clearer mirror onboarding, deeper hints, further light-path
readability, discovery-book presentation, measured performance, original final
storefront artwork, and a separate native Godot implementation.
