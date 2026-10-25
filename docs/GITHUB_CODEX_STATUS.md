# GitHub/Codex status — Wonder Lab Adventures

Observed 2026-10-25 during OPT-01 implementation. Supersedes the package's
2026-10-24 preparation status; older handoff statements remain historical.

- Repository verified: https://github.com/blockaystudio/wonder-lab-adventures
- Existing full source read at main `12716c4962dd597dba4e50c502073eaf3bf2d063`;
  all source blobs verified and Git history fetched. No source import needed.
- Isolated branch: `codex/lab-opt01`; baseline working tree was clean.
- Required instructions/handoff/status/tracker/QA documents read before editing.
- Actual implementation and tests performed; see `evidence/OPT01_REPORT.md` and
  `docs/WORK_LOG.md`. PR requires owner review; no merge or auto-merge.
- Local verification: pinned runtimes, isolated Python environment, 81 model/policy
  checks + 6 signer tests; 17 real HTTP browser methods pass in system Chromium 154.
- CI now includes browser regressions; local passes alone do not claim a GitHub
  Actions result. Inspect the PR checks for the actual remote run state.
- Repository visibility was observed as public and was not changed.
- No native export, store submission, monetization, deployment or profile upload.

## Wonder Workshop progression checkpoint

- Branch `codex/lab-progression` builds on `80e86ad`, the OPT-01 PR #1 head.
  PR #1 was still open when this task began; the new PR is stacked on it.
- Requested progression, compatible local saves and original artwork are
  implemented. Current rules: `docs/PROGRESSION.md`; executed test evidence:
  `evidence/PROGRESSION_REPORT.md`.
- A private mobile playtest site was created in the intervening user-requested
  hosting task. This repository task does not redeploy it; that site continues
  serving the OPT-01 snapshot until an explicitly authorized hosting update.
- No merge, visibility change, analytics, monetization, account or profile upload.
