# GitHub/Codex status — Wonder Lab Adventures

Current checkpoint: ROLLOUT-01, 2026-10-26. This supersedes open-PR and
undeployed-candidate statements in the historical implementation reports.

- Repository: https://github.com/blockaystudio/wonder-lab-adventures
- [PR #1](https://github.com/blockaystudio/wonder-lab-adventures/pull/1), OPT-01:
  merged into `main`; merge `f0b581c2d397713c53ab05802d7d3da525d41f54`.
- [PR #2](https://github.com/blockaystudio/wonder-lab-adventures/pull/2), progression:
  retargeted after its dependency merged, then merged into `main`;
  merge `a670a64352718c535cbc47739262bb9a738876cb`.
- [PR #3](https://github.com/blockaystudio/wonder-lab-adventures/pull/3), REL-01:
  retargeted after its dependency merged, then merged into `main`;
  merge `5ecf177d7b283799f7513ae0f4573ede5309f67b`.
- Merged game source tree equals verified `690fefde1b8f65f26fa48bd5d15107d53abb3186`.
  Rollout documentation is prepared on `codex/lab-release01-rollout`.
- Fresh rollout checks: 131 Node, 6 Python, 17 puzzle, 12 progression and 16
  release browser tests pass. See `evidence/ROLLOUT01_REPORT.md`.
- Main CI: [run 40398943729](https://github.com/blockaystudio/wonder-lab-adventures/actions/runs/40398943729),
  last observed installing Chromium; final outcome was not observed before the
  user's instruction to wrap up. Exact pre-merge source passed
  [run 40296893640](https://github.com/blockaystudio/wonder-lab-adventures/actions/runs/40296893640)
  and the fresh local checks above; the merged source tree is identical.
- Audience: requested ages 7–11, pending supervised comprehension testing.

## Authorization and release boundary

The user granted standing authorization for routine verified merges and
deployment, then instructed us to move forward. The existing owner-private
Site is the authorized deployment target. Preserve its origin/audience; this
does not authorize spending, public access, store submission, unrelated
repositories or prohibited game services. Routine release confirmation need
not be requested again. Failed checks and concrete save-compatibility blockers
must be resolved before publishing.

## Deployed source

https://wonder-lab-adventures-mobile.wholeclock.chatgpt.site

Native Sites deployment **succeeded** at `2026-10-26T20:54:58.143435+00:00`.
The same owner-private audience and origin were retained; no access change.

- Game revision: `5ecf177d7b283799f7513ae0f4573ede5309f67b`.
- Hosting source: `a5508d78bf08f2a8a12574964f0d374b8f6631ad`.
- Saved version: `appgprj_6add6aeff3d0819194aa179638900111~appgver_bffed3c1424481919010a5224e39dc08`.
- Deployment: `appgdep_6adfbe1b8bf48191bfa7f83a3fb71b29`.
- Native result: `evidence/rollout01/deployment.json`.

Packaged generated HTML: 130833 bytes; SHA-256 (both pages)
`9bd9e13f5dce364b7e5e13ef01cf2f792dde248f6b5b83806cc1de7071ae67f0`.
It matches the merged game artifact exactly. Deployment success is verified by
the terminal native Sites result; no new post-deployment HTTP byte comparison
or browser test was performed after the user requested an immediate wrap-up.
The older `evidence/release01/shipped-identity.json` describes the prior version,
not this publication.

## Compatible rollback floor and release limits

REL-01 is the minimum compatible deployment after protected saves exist. Retain
its exact artifact and repair forward or redeploy a version preserving its v2
save/erase contract. Do not restore pre-REL-01 `85f0cd7`, `80e86ad` or older Site
versions: they cannot honor protected-record erasure or import new old-build
activities safely. See `docs/PROGRESSION.md`.

Cold offline URL launch/reload, actual iOS Safari/Android Chrome testing and
supervised child testing remain outstanding. These are blockers to a broad
child-facing release, not claims satisfied by updating a private demo. Native
Godot/store work and measured retention/learning outcomes remain absent. No ads,
analytics, purchases, game accounts or profile uploads were added. The Site's
owner sign-in gate is hosting access control, not independent child distribution.
