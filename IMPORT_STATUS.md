# GitHub source import completed

The editable prototype source, original SVG artwork, tests, plans, and Codex instructions are present at repository root. Both standalone HTML pages have been rebuilt and verified against the prepared package. PNG artwork exports and current browser screenshots were regenerated from source; archived raster byte identity is not claimed.

The only change to existing text files is a CI guard that skips the initial bootstrap push. No gameplay or monetization code was changed. All 47 expected text files passed SHA-256 comparison against the import manifest. The import workflow also ran the project verifier (63 Node tests and 6 Python tests).

See `evidence/import-verification.json` and the source-import workflow run for evidence. Earlier upload-status documents describe the pre-import package and are superseded by this file for upload status only.

The import above is historical. Source is present; do not import or recreate it.
Read `AGENTS.md` and `docs/GITHUB_CODEX_STATUS.md` before selecting a branch.
OPT-01 and progression are implemented in open stacked PRs; the private mobile
site serves progression commit `85f0cd7`. REL-01 is a separate, undeployed branch.
No native/store release or advertising activation has occurred.
