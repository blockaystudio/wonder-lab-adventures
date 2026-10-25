# Wonder Workshop — progression version 1

This is a finite, offline browser progression layer around the three existing
mirror experiments. It targets the requested ages 7–11; comprehension and
long-term retention have not been demonstrated with children.

## Wonder Sparks

Sparks are lifetime progress, never money or a spendable balance. Unlocks are
automatic, deterministic and shown from the start. There is no clock, daily
streak, random drop, deadline, account, purchase, ad or upload.

| Action | Sparks | Limit |
|---|---:|---|
| Solve a puzzle | 20 | First successful trace per puzzle |
| Test a different mirror arrangement | 2 | Once per arrangement: 4 + 4 + 16 possible |
| Discover a science card | 5 | Once for each of six cards |
| Complete the light lab | 20 | All three puzzles solved, once |
| Review a discovered card | 3 | First review of each card |
| Revisit a solved path | 4 | Change/reset a solved puzzle, then solve it again; once per puzzle |

The maximum is **188 Sparks**. Pressing Send light repeatedly on the same
arrangement, repeatedly reviewing, resetting, or reopening the game does not
mint more Sparks. Replays reward a deliberate revisit, not a date or absence.
Hints never reduce rewards or block an unlock. Reviewing/replaying is the
chosen alternative to rewarding fewer hints, so asking for support stays safe.

The eight goals cover a first solve, three distinct tests, completing the lab,
three cards, a successful mirror path, three reviews, three replays, and six
cards. Goals display their completion counts; Sparks are awarded for the actions
above, not again for viewing or checking a goal. Ranks are Seed inventor (0),
Beam builder (40), Lab explorer (90), and Wonder keeper (150).

## The collection

| Card | How to discover it |
|---|---|
| Light's straight path | Solve A little reflection |
| A mirror's turn | Solve Take the lower path |
| A chain of reflections | Solve The long way around |
| Predict, turn, test | Test 3 different arrangements in puzzle 1 |
| An equal-angle bounce | Test 3 different arrangements in puzzle 2 |
| Models are maps | Test 5 different arrangements in puzzle 3 |

The cards explain ideal flat-mirror reflection, comparison through changing a
variable, and the limits of the simplified 2D model. The angle card measures
angles from the perpendicular normal. No physical experiment instructions or
unverified educational-outcome claims are included.

| Lab treasure | Unlock | Visible use |
|---|---:|---|
| Prism goggles | 15 Sparks | Goggles on the robot |
| Mint explorer | 40 Sparks | Mint robot shell |
| Orbit inventor badge | 65 Sparks | Badge on the robot |
| Moonlight observatory | 75 Sparks | Blue/lilac lab and board palette |
| Cosmic plum | 90 Sparks | Plum robot shell |
| Sunbeam greenhouse | 115 Sparks | Leafy lab and board palette |
| Nova, the wonder keeper | 150 Sparks, all 6 cards, 3 reviews | Special robot companion |

A cosmetic, theme and companion occupy separate slots. Choosing a treasure
never spends Sparks or consumes an item. Classic styles remain available.
Nova can wear the goggles/badge; shell choices tint Nova while equipped.
All rewards can be reached in the existing lab. There is no implied secret
experiment set or extra curriculum behind the companion unlock.

## Implementation and saves

- `games/progression.js` is a game-local pure model; `games/lab.js` binds real
  puzzle traces, reviews, equipment controls and the goals/notebook screens.
- No shared-library contract changed. The game decorates `KidsCore.normalizeLab`
  rather than modifying its behavior for other repositories.
- The existing `kidslab.v1.wonder-lab-adventures` key and schema-1 envelope remain.
  A bounded `data.progress` object records unique configuration masks, reviewed
  card IDs, replay facts/readiness and chosen equipment. Points, cards and unlocks
  are derived from those facts, not trusted as an arbitrary stored balance.
- Existing saves retain puzzle, orientations, attempts, discoveries and reduced
  motion. Existing solves receive corresponding solve/card/section credit;
  historical experiments and reviews are not invented. Migration is idempotent.
- Corrupt/unknown progression data is filtered or reset independently of legacy
  solved discoveries. Invalid/locked equipment falls back to the classic style.
- Shared LocalSave still provides backups and in-memory play when storage is
  unavailable. New book/equipment messages distinguish saved from visit-only
  progress. Erasing local progress through the existing parent area erases this
  collection too. Changing site origin/browser does not transfer saves.
- Reopening a much older build can drop the additional progression fields when
  it re-saves through its older normalizer. Forward migration is supported;
  downgrade persistence is not promised.

## Original artwork

Sixteen original editable SVGs live in `art/rewards/`; the provenance README and
`art/ASSET_LEDGER.md` describe them. They include six distinct science postcards,
four cosmetics, two theme scenes, Nova, a Spark, a mission notebook and a hero.

`build.py` validates and embeds them into the standalone pages as
`WonderRewardArt`. No image server, font, library, or network fetch is needed.
The source directory remains the artwork source of truth. Theme rewards change
color/style, not the reflection rules. Original Build 01 art is retained.

## Future work, to validate before expanding

Supervised comprehension/playtesting with appropriate permission; a larger set
of reviewed hands-on experiments; optional player-chosen investigation goals;
a notebook that lets players compare two ray paths; richer mascot expressions;
and the separate native Godot implementation. Additional rewards should follow
meaningful new activities, not longer repetition quotas. No analytics or
measured retention improvement is claimed by this implementation.
