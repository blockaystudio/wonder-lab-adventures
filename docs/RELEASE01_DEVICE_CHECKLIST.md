# REL-01 physical-device acceptance checklist

Status on 2026-10-26: **BLOCKED — no physical iOS or Android device is accessible
from this workspace.** The executor is Linux 6.18.55; `adb`, `idevice_id` and
`xcrun` are absent, and `/dev/bus/usb` is absent. Desktop Chromium with emulated
touch or a phone-sized viewport does not complete these checks.

This checklist uses synthetic test progress only. It does not require a child,
player identity, telemetry, or an account inside the game. The requested design
audience is ages 7–11; device checks do not demonstrate comprehension, retention,
or learning outcomes.

## Build and environment record

Before running, record the exact repository commit, generated HTML SHA-256,
test origin and date. Confirm the device actually loads that HTML. The existing
private hosted site is a different release until an authorized deployment
updates it; REL-01 does not deploy or change its access. A test of that older
site is not evidence for the REL-01 candidate. Use an already authorized device
test origin serving the candidate, or keep execution blocked. Do not expose
the preview server or publish a new build merely to complete this checklist.

Record device model, OS version, browser version, normal/private browsing mode,
viewport and orientation, OS text size, motion preference, available storage,
and whether remote inspection is available. Use the same origin throughout a
persistence or rollback sequence; changing scheme, hostname or port creates a
different storage area. The loopback preview URL on the development computer
is not a phone-accessible URL.

| Platform | Required coverage | Actual result |
|---|---|---|
| Physical iPhone, Safari | Portrait/landscape; normal/private; background and restart | BLOCKED: device unavailable |
| Physical iPad, Safari | Portrait/landscape; touch and hardware keyboard | BLOCKED: device unavailable |
| Physical Android phone, Chrome | Portrait/landscape; normal/incognito; background and restart | BLOCKED: device unavailable |
| Physical Android tablet, Chrome | Portrait/landscape; touch and hardware keyboard | BLOCKED: device unavailable |

For every check below, record `PASS`, `FAIL` or `BLOCKED`, the actual observation,
and a screenshot or log path when captured. A missing device, debugger, browser
setting, or compatible test origin is `BLOCKED`, never an inferred pass.

## Core loop and legibility

1. Start in a fresh test profile/site-storage area. Open each puzzle, rotate its
   mirrors by touch, send light, inspect a miss, request a hint, then solve. The
   winning orientations in mirror-label order are:

   | Puzzle | A | B | C | D |
   |---|---|---|---|---|
   | A little reflection | `/` | `/` | — | — |
   | Take the lower path | `\` | `\` | — | — |
   | The long way around | `\` | `/` | `\` | `/` |

2. After each solve, confirm the lamp, text explanation and discovery agree.
   Open the discovery book, review an earned card, and equip an unlocked item.
   Reload and confirm the solved marker, points, card review, equipment and
   current mirror arrangement survive. Repeat Send light and the review action;
   already credited actions must not mint repeated rewards. Hints must stay free.
3. Rotate between portrait and landscape with a traced path and with each dialog
   open. Check mirror labels, beam/route text, selected puzzle, hint, Send light,
   close button and reward controls remain readable and reachable by scrolling.
   No horizontal page overflow, clipped controls, overlapping tap targets or
   unintended mirror activation while scrolling. Verify the path can be
   understood from labels/text as well as color. Capture both orientations.
4. Repeat at the device's larger text setting and browser zoom where supported.
   Record the actual setting; report unreadable, clipped or unreachable content.

## Saves, concurrency and erasure

1. Open two same-origin tabs before earning progress. In A solve puzzle 1; in B
   solve puzzle 2. Switch repeatedly and reload both. Previously saved discoveries
   and rewards must survive; if a conflict cannot be merged, a visible warning
   must prevent a silent overwrite. Repeat with near-simultaneous actions and
   different equipment choices. Record the documented equipment conflict policy.
2. With A showing earned progress and B still open, enter Grown-ups in A, answer
   the displayed arithmetic checkpoint, select erase, then cancel. Reload A;
   progress must remain. Repeat and confirm erase. Attempt a trace, review and
   equipment action in B; reload both. Stale progress must not reappear.
3. Test erasure failure with disposable progress and an attached remote debugger.
   Before confirming erase, run this test-only hook in the page console:

   ```js
   globalThis.rel01RemoveItem = Storage.prototype.removeItem;
   Storage.prototype.removeItem = function (key) {
     if (String(key).endsWith('.backup')) {
       throw new DOMException('REL-01 injected deletion failure', 'SecurityError');
     }
     return globalThis.rel01RemoveItem.call(this, key);
   };
   ```

   Confirm erase. The UI must report failure or incomplete deletion, never
   unqualified success. Reload and confirm old discoveries do not silently
   return as a successful erase. Remove the hook with
   `Storage.prototype.removeItem = globalThis.rel01RemoveItem` (or reload), then
   retry erasure and verify completion. Record any browser restriction that
   prevents injection as `BLOCKED`; do not substitute a normal erase pass.
4. In a disposable profile, exercise unavailable storage using the browser's
   blocking setting, if offered, and separately simulate rejected storage
   writes through remote inspection. Play must remain usable and tell the
   player which progress is visit-only. No unconditional saved/success message
   may appear after a failed write. Restore access and verify the documented
   recovery behavior. Do not fill a person's device to manufacture quota errors.
5. Repeat normal saving in Safari private browsing and Chrome incognito. Check
   what survives tab reload and private-session closure, and record the browser's
   actual behavior. A private session may discard its own storage on closure;
   it must not be described as permanent backup.

## Update, rollback and interruption

1. On a disposable, unchanged test origin, load the real progression build
   `85f0cd7b5f0e314d27086facc99b0f11bcd29771`. Earn a card, review it, and equip
   goggles. Replace only the served test artifact with the REL-01 candidate;
   reload. All existing facts and selections must migrate without extra rewards.
2. Preserve that test origin and load the actual OPT-01 artifact from
   `80e86ad49d2c8065f4460e9b5b4d49385c6bbfc0`. Play and reload so its old
   normalizer really writes. Return to the REL-01 candidate and verify preserved
   progression/reviews/equipment according to the documented rollback policy.
   Test the documented handling of an old-build erase separately. Do not report
   old builds as participating in a protocol they do not implement. This is an
   isolated artifact test, not permission to roll back the hosted site.
3. After the UI reports a saved solve/review/equipment change, background the
   browser, switch to another app, lock/unlock the device, and resume. Repeat
   after closing the tab, closing/relaunching the browser, and a device restart.
   Confirm saved facts, mirror positions and equipment survive; note exact
   browser/OS behavior and any storage purge.
4. Separately interrupt immediately after tapping Send light and while changing
   equipment, before waiting for confirmation. Close the tab or terminate the
   browser, then reopen. The last confirmed durable state must remain readable;
   an interrupted, unconfirmed action need not be credited. No corrupt/partial
   save, duplicate reward, or erased-progress resurrection may result. Repeat
   with two tabs and during erase. These checks do not certify power-loss or
   storage-hardware durability.

## Keyboard, motion and runtime behavior

1. With a hardware keyboard, use Tab/Shift+Tab, Enter and Space from the page
   start through puzzle selection, mirrors and controls. Selecting a puzzle must
   retain a meaningful focused control; the next Tab must continue logically.
   Check focus is visible and scrolling keeps the focused control reachable.
2. In the discovery book, review by keyboard and continue tabbing. In goals,
   equip/unlock controls and close by Escape/close button. Focus must stay inside
   an open modal and return to its trigger on close. Complete the parent
   checkpoint and erase confirmation with keyboard alone.
3. Enable the OS Reduce Motion preference before launch, then separately use
   the game's Grown-ups motion setting. Solve and open success/goals/book views.
   Verify decorative motion is reduced as documented, core state remains clear,
   and the saved in-game setting survives reload. Record actual animation
   observations, not just a checked preference.
4. Attach Safari Web Inspector or Chrome remote debugging where available.
   Clear Console/Network, then exercise the full loop, two-tab scenario and
   dialogs. Record uncaught exceptions, console errors, hangs and all requests.
   Game runtime must make no analytics, advertising, profile or other unexpected
   external requests. Distinguish host authentication/navigation requests from
   requests initiated by game code; private hosting is not evidence of a
   child-facing distribution system. Redact credentials/cookies and avoid
   committing raw account-bearing network exports.

## Offline contract and separate acceptance

The current browser prototype is self-contained after its document loads.
Continued offline play and offline startup are different requirements. There is
no service worker, installed native bundle, or promised browser-cache recovery.
Cold HTTP launch/reload is **unsupported and remains a production blocker** for
an offline-first distribution promise. Private hosting may also need network
access to authenticate. REL-01 does not add a PWA or native implementation.

1. **Continued offline play:** load the candidate online, then enable airplane
   mode and disable any remaining Wi-Fi. Without reloading, rotate/trace/solve,
   use hints, review a card and equip an item. Confirm no network-dependent game
   control and no false saved message. Restore network, reload at the same
   origin, and verify progress earned offline.
2. **Reload while offline:** load online, go offline, then reload. Record whether
   the browser serves a cached page or an error. A cache hit on one device does
   not establish a supported offline-launch contract.
3. **Cold offline launch:** use a separate fresh profile/site state with no
   cached document, stay offline, and navigate to the candidate URL. Record the
   actual result; do not erase the saved-progress profile to conduct this test.
4. **Browser relaunch while offline:** separately close and reopen the browser
   while offline with an existing saved collection. Record document availability
   independently from storage persistence. On reconnect, saved state must be
   recoverable even if the document could not start offline.

Production acceptance needs a deliberate offline-startup delivery milestone and
real-device evidence. A desktop test confirming the known failure documents the
blocker; it does not pass that product requirement.
