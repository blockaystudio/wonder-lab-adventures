# GitHub/Codex status — Wonder Lab Adventures

Verified 2026-10-26 for REL-01.

- Repository: https://github.com/blockaystudio/wonder-lab-adventures
- Clean starting branch `codex/lab-progression`, commit
  `85f0cd7b5f0e314d27086facc99b0f11bcd29771`; existing full source, no import.
- [PR #1](https://github.com/blockaystudio/wonder-lab-adventures/pull/1): open,
  unmerged; `codex/lab-opt01` → `main`; head `80e86ad`.
- [PR #2](https://github.com/blockaystudio/wonder-lab-adventures/pull/2): open,
  unmerged; `codex/lab-progression` → `codex/lab-opt01`; head `85f0cd7`.
- REL-01 branch: `codex/lab-release01`, based on verified PR #2 head. The review
  PR targets `codex/lab-progression`; neither dependency is merged by this task.
- Audience: requested ages 7–11, pending supervised comprehension testing.

## Deployed source (unchanged during REL-01)

https://wonder-lab-adventures-mobile.wholeclock.chatgpt.site

Owner-private Site, active version 2, zero external visitors. Shipped game commit
`85f0cd7b5f0e314d27086facc99b0f11bcd29771`; hosting-source commit
`f609ef5b5c060bfd7b68ba89424b375b98cdc6c5`. The authorized update happened
2026-10-25 after the progression implementation task. Historical statements that
the Site still serves OPT-01 are superseded.

REL-01 read-only HTTP verification: 200; 114872 bytes; SHA-256
`baa4cb6fc20a432471a10c70b99fa80f4df25f6068ae8cd013367c38f6b37430`,
exactly equal to committed `85f0cd7:play/index.html`.
Evidence: `evidence/release01/shipped-identity.json`. No credentials are stored.

## Evidence and release limits

See `evidence/RELEASE01_REPORT.md` for baselines, reproduced defects, fixes and
final results; `docs/RELEASE01_DEVICE_CHECKLIST.md` for blocked device checks.
REL-01 is not deployed. Native Godot work, full cold offline startup, physical
mobile QA and supervised child testing remain outstanding. There is no measured
retention or learning outcome, no native/store release, and no ads, analytics,
purchases, game accounts or profile uploads. The Site's owner sign-in gate is
hosting access control, not a game account or child distribution system.
