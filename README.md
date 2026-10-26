# Wonder Lab Adventures

**Working browser prototype; not a finished iOS/Android game.**
Source repository: `blockaystudio/wonder-lab-adventures`; current REL-01 work is documented in `evidence/RELEASE01_REPORT.md`.
Requested audience: ages 7–11; physical-device and child usability tests remain pending.

## Start here
Read `AGENTS.md`, `HANDOFF.md`, `docs/GITHUB_CODEX_STATUS.md` and
`docs/CODEX_TASKS.md`. Repository upload and Codex execution are separate steps;
local package preparation does not mean either happened.

## Run and test
Tested baseline: Node.js 22.16.0, Python 3.13.5, cryptography 46.0.4.

```sh
python -m venv .venv
# Activate the environment with the command for your operating system.
python -m pip install -r server/requirements.txt
python scripts/verify.py
python server/serve_preview.py
```

Open the local address printed by the preview server. The pages are also standalone
HTML, but local HTTP is preferred for meaningful storage tests. The verifier runs
131 Node tests and 6 Python tests plus build/syntax/static-page checks. The tests
include shared reference logic for all three games; these are model/policy checks, separate from browser interaction tests. Physical-device, native-export and store tests remain pending.

## Browser regressions

After activating the isolated Python environment and selecting the pinned runtimes:

```sh
python -m pip install -r tests/browser-requirements.txt
python -m playwright install chromium
python tests/browser_lab.py
python tests/browser_progression.py
python tests/browser_release.py
```

For an installed Chromium, use `CHROMIUM_EXECUTABLE=/usr/bin/chromium python tests/browser_lab.py`.
The harness starts/stops a loopback HTTP preview, uses fresh browser contexts and
real localStorage, and writes JSON results/screenshots to `test-results/browser-lab/`.
`--root /path/to/checkout` permits comparing an unchanged baseline. Storage failure
scenarios deliberately deny storage; successful persistence uses the browser's own storage.

The release suite needs Git history including `80e86ad` to test the actual older
build (use a full checkout). Safe cross-tab persistence requires Web Locks on
HTTPS or localhost; unsupported contexts explicitly use visit-only progress.
Continued loaded play works offline, but cold HTTP launch/reload is not an
offline-startup guarantee. See `docs/RELEASE01_DEVICE_CHECKLIST.md` for blockers.

## Gameplay
Three light-reflection puzzles, local adaptive hints, and six illustrated science cards.
The Wonder Workshop adds permanent Wonder Sparks, eight collection goals, four
cosmetics, two lab themes and Nova, a special robot companion. Hints are always
free. No random drops, streaks, deadlines or lost rewards. Progress stays local.
See [progression rules and save compatibility](docs/PROGRESSION.md).
Next focused improvements: Improve mirror interaction, readable light paths, hint usefulness, keyboard access, and local puzzle progress. Prove all solutions and avoid unverified learning claims.

## Source and generated output
Edit `games/` and `shared/`; run `python build.py` to regenerate `play/`.
Artwork and metadata are drafts. Runtime contains no ad SDK, analytics upload,
account system or purchase flow. Remote-policy modules are disabled scaffolding,
not a live advertisement service. Keep all keys out of source control.

## Codex and CI
`docs/CODEX_SETUP.md` gives setup steps. `AGENTS.md` states boundaries and commands.
The GitHub workflow runs tests only, with read-only repository permissions; it
publishes nothing. The browser regression step uses an isolated local HTTP preview. See the current work log for observed run results.

Private commercial work: no open-source license has been selected or granted in
this handoff. Do not add a license or publish the repository without owner approval.
