# ROLLOUT-01 — verified merge and private-site release

2026-10-26. This is the authorized rollout of the completed REL-01 browser
prototype, not a native/store release or new content milestone. The user gave
standing permission for routine verified merges and deployments, then requested
that work move forward. Earlier no-merge/deploy restrictions described completed
implementation milestones and are superseded within this rollout's scope.

## Source and merge verification

Started from clean `codex/lab-release01` at
`690fefde1b8f65f26fa48bd5d15107d53abb3186`, with the correct remote
`https://github.com/blockaystudio/wonder-lab-adventures.git`. Existing source and
work were retained. Checked PR states, CI and dependency order before merging.

| PR | Scope | Merge into main |
|---|---|---|
| [#1](https://github.com/blockaystudio/wonder-lab-adventures/pull/1) | Puzzle correctness/discovery flow | `f0b581c2d397713c53ab05802d7d3da525d41f54` |
| [#2](https://github.com/blockaystudio/wonder-lab-adventures/pull/2) | Wonder Workshop progression and art | `a670a64352718c535cbc47739262bb9a738876cb` |
| [#3](https://github.com/blockaystudio/wonder-lab-adventures/pull/3) | Local-progress durability and release checks | `5ecf177d7b283799f7513ae0f4573ede5309f67b` |

PRs merged in the order above; dependent PRs were retargeted to main after their
dependencies merged. No force-push, history rewrite or repository access change.
The merged main source tree is identical to the freshly tested REL-01 tree.
Follow-up rollout documentation is on `codex/lab-release01-rollout`.

## Fresh automated verification

Runtime: Node 22.16.0, isolated Python 3.13.5, cryptography 46.0.4,
Playwright 1.58.0 and pinned Chromium 145.0.7632.6. The exact declared dependencies
already installed for REL-01 were verified and reused in `.venv`; no dependency
installation ran in this rollout turn. The checks below are actual fresh
executions, not a restatement of the earlier implementation report.

```sh
cd /workspace/wonder-lab-adventures
export PATH=/workspace/toolchains/node-v22.16.0-linux-x64/bin:/workspace/wonder-lab-adventures/.venv/bin:$PATH
export PLAYWRIGHT_BROWSERS_PATH=/workspace/toolchains/pw-browsers
python scripts/verify.py
node tests/core.test.cjs
node tests/remote.test.cjs
node tests/lab.test.cjs
node tests/progression.test.cjs
node tests/save.test.cjs
python tests/browser_lab.py --output /tmp/wonder-deploy-check/browser-lab
python tests/browser_progression.py --output /tmp/wonder-deploy-check/browser-progression
python tests/browser_release.py --output /tmp/wonder-deploy-check/browser-release
git diff --exit-code -- play/
```

Logs and selected screenshots are retained under `evidence/rollout01/` after
copying from `/tmp/wonder-deploy-check`. Browser reports use actual HTTP-origin
storage and fresh contexts; expected deliberate crash/offline failures are
separated from normal-page errors.

| Check | Result | Evidence |
|---|---|---|
| Build/syntax/metadata/generated pages/offline-page checks | PASS | [verify.txt](rollout01/verify.txt) |
| Node model/policy/save suites | 131 PASS: 51 + 12 + 18 + 25 + 25 | [core](rollout01/core.tap), [remote](rollout01/remote.tap), [lab](rollout01/lab.tap), [progression](rollout01/progression.tap), [save](rollout01/save.tap) |
| Python signer | 6 PASS | [verify.txt](rollout01/verify.txt) |
| Puzzle browser | 17/17 PASS | [log](rollout01/browser-lab.txt), [JSON](rollout01/browser-lab/results.json) |
| Progression browser | 12/12 PASS | [log](rollout01/browser-progression.txt), [JSON](rollout01/browser-progression/results.json) |
| Release browser | 16/16 PASS | [log](rollout01/browser-release.txt), [JSON](rollout01/browser-release/results.json) |

Main CI: [run 40398943729](https://github.com/blockaystudio/wonder-lab-adventures/actions/runs/40398943729).
Last observed installing Chromium; its final outcome was not observed before
the user requested an immediate wrap-up with no more testing/research. The
identical pre-merge source tree passed
[CI run 40296893640](https://github.com/blockaystudio/wonder-lab-adventures/actions/runs/40296893640),
and the fresh local checks above all passed. Deployment proceeded on that exact
artifact evidence and the user's authorization; this does not claim a final
pass for the merged-main run.

The 45 browser methods include all three puzzle loops, free hints, finite
rewards, collection/equipment reload, stale writers and conflicting choices,
erase invalidation/deletion failures, actual old-build round-trip protection,
keyboard focus, persistent close/relaunch, unfinished experiment recovery,
dedicated-renderer termination, reduced motion and five emulated layouts.
No normal-context console/page errors or unexpected external requests were
observed. Model tests retain the independent 24-arrangement oracle: each puzzle
has one verified solution (`/ /`; `\ \`; `\ / \ /`).

Fresh screenshots from the tested local artifact:
[390px phone](rollout01/browser-release/solved-390x844.png),
[768px tablet](rollout01/browser-release/solved-768x1024.png),
[failed erasure/retry](rollout01/browser-release/erase-failure.png), and
[explicit tab conflict](rollout01/browser-release/tab-conflict.png).
These are actual desktop-browser captures, not physical-device screenshots.

## Deployment and source identity

Existing Site: https://wonder-lab-adventures-mobile.wholeclock.chatgpt.site

Native Sites deployment **succeeded** at `2026-10-26T20:54:58.143435+00:00`.

- Project: `appgprj_6add6aeff3d0819194aa179638900111`.
- Saved version: `appgprj_6add6aeff3d0819194aa179638900111~appgver_bffed3c1424481919010a5224e39dc08`.
- Deployment: `appgdep_6adfbe1b8bf48191bfa7f83a3fb71b29`.
- Evidence: [terminal native result](rollout01/deployment.json).

The owner-private audience and same HTTPS origin were preserved. No game account,
analytics, tracking, upload, purchases, ads or production remote endpoint is added.

Deployed game revision: `5ecf177d7b283799f7513ae0f4573ede5309f67b`.
Hosting source pushed clean: `a5508d78bf08f2a8a12574964f0d374b8f6631ad`.
Packaged generated HTML: 130833 bytes; SHA-256 (both pages):
`9bd9e13f5dce364b7e5e13ef01cf2f792dde248f6b5b83806cc1de7071ae67f0`.
Source archive SHA-256:
`170381bec04d6b1f148be712aed81b605d9b1a3a08c273ee4cdc8e70be90428c`.

The Sites source helper was unavailable in this workspace. The equivalent
supported Git workflow used temporary in-memory authentication passed through
hidden stdin, pushed the exact source state, and packaged it with `git archive`.
No credentials were written into source, artifacts or evidence.

The packaged HTML was compared with the merged canonical artifact before
publication. The terminal native response verifies deployment success. No new
post-deployment HTTP checksum request or browser smoke test was performed after
the user asked to wrap up; artifact equality is not claimed as a separate live
HTTP byte verification. Existing screenshots are from the fresh local tests.

## Rollback and remaining limits

REL-01 is the minimum compatible deployment baseline after v2 protected saves
exist. Keep this exact deployed artifact/source as a recovery point. Repair
forward or redeploy only a build preserving its v2 save/erase contract; do not
restore prior Site versions or pre-REL-01 game `85f0cd7`/`80e86ad`. Their old
controls cannot honor protected erasure, and activities recorded by them after
migration do not merge back. Rolling back code alone cannot recover erased data.
Close/reload older tabs before using the updated demo.

The following remain blockers to a broad child-facing production launch:

- Cold offline URL launch/reload is unsupported. Already-loaded offline play
  passes; a passing diagnostic of failed offline navigation is not offline-startup
  support. No service worker/PWA/native rewrite was included.
- Actual iOS Safari and Android Chrome checks remain blocked because devices are
  unavailable. Use [the precise device checklist](../docs/RELEASE01_DEVICE_CHECKLIST.md)
  against the verified deployment. Desktop emulation does not replace this.
- Web Locks on HTTPS/localhost are required for safe persistence; unsupported
  contexts explicitly use visit-only progress. Origin/browser changes and browser
  data eviction cannot guarantee recovery.
- No supervised child test, measured retention/learning result, native Godot
  build, store submission or full accessibility/science/privacy review is claimed.
  The private hosting owner sign-in gate is not independent child distribution.

The game remains the same three experiments, finite rewards and original art.
New content, onboarding redesign, performance optimization and native work are
separate bounded milestones after release/device/offline acceptance work.
