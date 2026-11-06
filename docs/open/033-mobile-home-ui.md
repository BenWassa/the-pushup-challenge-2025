# Issue #33 — PushUp 2027 mobile-first Home implementation

- Issue: #33 (implementation), #34 (design record), #5 (functional mobile UX)
- Status: **implemented on `feat/33-mobile-home-ui`, awaiting owner review.** Not merged, not deployed.
- Visual direction: Athletic Bold / Brush Impact (#34). The complete Home composition in #34 is still
  marked "not approved"; this PR implements the written component decisions and is the artefact to
  approve or revise.

## Selected heatmap design (owner decisions, 2026-11-06)

This is the current accepted heatmap direction. It supersedes the earlier heatmap
exploration and implementation notes below, including month headings, date-range
headings, today dots, raised sheets and selected-day text on Home. Selection of
this component does not approve the entire Home composition or a production release.

- **Style:** square variant A, refined to a minimal full-width grid. No bars,
  circles, date numbers, weekday names, alignment blanks or visible legend on Home.
- **Window:** the past 30 calendar days, including today, oldest to newest in
  **three rows of ten squares**. Keep the section compact rather than enlarging
  seven squares to fill each row. Current spacing is 4px with 3px cell corners.
- **Heading:** **“Last 30 days”**, with **History on the same row**. Do not use a
  month name or date-range heading on the current-year Home view, or leave History
  alone in a header row. Both labels should be visually quiet.
- **Hierarchy:** logging is the focus. The heatmap sits directly on the page
  background, without a raised sheet, contrasting section fill, border, shadow,
  extra container padding or edge bleed.
- **Today:** red outline, **no dot**. Other selected days retain a light inset
  selection border; keyboard focus remains visible.
- **Below the grid:** no selected-day date/count/phase text and no yearly
  breakdown (including Imported and Active days) on Home.
- **History:** retains month names, calendar navigation, selected-day totals and
  set review/editing. Removing Home detail does not remove access to records.
- **Year boundaries:** January can show the previous December through a read-only
  owner-scoped subscription. These counts never enter the current year's totals.
  Archived views remain scoped to their selected year.
- **Mockups:** local explorations under `design/mockups/` are ignored by Git;
  this tracked record is the durable source for the selection.

Implemented locally; not deployed. Verification and remaining physical-device /
production checks are recorded in the implementation notes below.

## What changed

| Area          | Change                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home          | One vertically scrolling page, no bottom navigation: compact header → Today + official progress → 2×2 quick-add → Activity Squares → quiet year breakdown (no Recent sets list; the heatmap day detail and History show sets).                   |
| Settings      | Gear in the header opens a secondary screen: Past years (read-only archive) and Account. Replaces the Log / History / Account tab bar.                                                                                                           |
| Heatmap       | New Activity Squares month view (replaces the number-in-cell calendar from `History.jsx`, now deleted).                                                                                                                                          |
| Design system | `src/styles/tokens.css` (colour, type, spacing, radii, motion, heat scale), `base.css` (elements, forms, notices, lists), `home.css`. The old 1,270-line layered stylesheet is gone.                                                             |
| Libraries     | Radix UI primitives `@radix-ui/react-progress` (progressbar semantics) and `@radix-ui/react-collapsible` ("Another year"). Headless, styled with the tokens.                                                                                     |
| Demo fixture  | `?mode=demo&fixture=feb-10-2027` — fictional, in-memory, demo-only. Pins the clock to Wed 10 Feb 2027 15:00 Toronto and seeds sets so today = 60, official = 445 / 2,000, latest set = 20, streak = 7. Never used outside the memory repository. |

Unchanged: authentication, Firebase repository/records/rules, `challengeModel` annual calculations,
service worker and offline behaviour. One additive change in `useActivityData`: an optional `now`
argument (defaults to the real clock) so the fixture's pinned date can pass the existing
"current year is writable" gate. Manifest and `theme-color` were switched to the dark background.

## Reused vs. new

- **Reused:** `ActivityList` (edit / remove / revision conflict handling, untouched), `useActivityData`
  save / undo / retry journal, `createChallengeModel`, `classifyChallengeDate`, existing quick-add
  amounts and copy (`Add N push-ups`, `Undo latest set (N)`, Saved / Saving / Retry notices).
- **Audited and not reused:** the 2025-era `ContributionCalendar`, `DashboardHero`, `ProgressBar`,
  `StatsView`, `DayDetailModal` are not imported by the current app, use `new Date()` local time and a
  different data shape (`logs` with timestamps). Adapting them would have re-introduced timezone
  ambiguity, so the heatmap was rebuilt on the date-keyed `summary.byDate` model, keeping the layout
  idea of the existing `History` grid (Sunday-first, `leadingBlanks`).
- **New:** `ActivitySquares`, `Home`, `HomeHeader`, `BrandMark`, `ProgressSummary`, `QuickLog`,
  `Settings`, `utils/heatmap.js`, `utils/streak.js`, `data/demoFixture.js`.

## Decisions made (defaults, flag if you disagree)

1. **Streak** = consecutive days with any push-ups ending today (or yesterday while today is still
   empty). Verified official rest Sundays neither break nor count. It only sees the loaded calendar
   year, so it restarts on 1 January, and it is shown only during the official challenge (QA: a training/off-season streak under the "Official challenge" label was misleading), hidden at 0 and in archived years.
2. **Heat thresholds** (illustrative, not official): 1–19, 20–49, 50–99, 100+ → four red steps; none =
   charcoal. Revisit against real data.
3. **Past years** open as the same Home, read-only (no quick-add), with a "Back to 2027" bar. The
   old year dropdown and month dropdown are gone; months use previous/next arrows in the heatmap.
4. **Recent sets removed from Home** (owner decision, critique 2026-11-06): sets are reviewed via the
   heatmap day detail and History. The Official dates / Sundays rest and Imported footnotes were also
   dropped; the Imported figure stays in the breakdown.
5. **Brand mark** is a heavy italic wordmark with a red dry-brush stroke drawn in SVG/CSS, not the
   supplied brush artwork (which is orange and a full-bleed image).
6. The breakdown line keeps Training / Off-season / Imported / Active days visible but quiet, and
   drops Official (already the headline counter).
7. **Heatmap hit areas:** each square sits in a full-column button (≈40 px pitch at 320 px, ≥ 24 px
   WCAG 2.2 minimum; below the 44 px used for primary controls). Squares stay small as specified.
8. **Two zones** (owner decision, 2026-11-06): Today, progress and logging sit on the page background; the heatmap, day detail and totals share one raised sheet with a rounded top edge (History is unchanged). Quiet days use a lighter charcoal on the sheet so they stay visible.
9. Hand-built heatmap instead of a calendar library: libraries (React Aria Calendar etc.) name each
   cell with the date only; we need the day's total and phase in the accessible name.

## Independent QA (subagent, read-only) and follow-ups

Passed: no overflow 320–1280, axe wcag2a/2aa/21aa clean on Home, Settings, archive and each phase,
correct weekday alignment, phase labels, rest-day / archive / month-bound behaviour, keyboard roving
focus, reduced motion, no console errors. Fixed after QA: "Saved" confirmation only appeared on the
first save in demo; focus is now placed in the edit field / confirm button when a set is edited or
removed; streak limited to the official phase; 320 px at 200 % text (heatmap squares, weekday
letters now single characters, settings gear no longer squeezed); footer link tap area; streak had
an invalid `aria-label`.

Not changed, for owner decision: (a) **Undo** reads "Undo latest set (N)" and can undo the most
recent set from a previous day when today is empty (existing behaviour, kept); (b) set rows keep
the existing ISO date and "Challenge" wording versus "Official" elsewhere; (c) heat levels 0–1 are
close to the background (1.2–1.4:1) by design — counts are in each cell's accessible name and the
detail panel; (d) past real challenge years with no configured edition read as "Off-season"
(existing model behaviour); (e) the day-detail region is `aria-live`, so screen readers announce
it on each date change (untested with a real screen reader).

## Verification (run in the isolated worktree)

- `npm run lint` clean; `npm test` 69 pass (new: heatmap grid/thresholds/date formatting, streak
  including rest days and year boundary, fixture totals).
- `npm run build` ok.
- `npm run test:integration`: Firebase-emulator rules suite plus 9 Playwright journeys pass — demo
  logging / undo / reload reset, 320 / 390 / 430 no overflow, 320 px at 200 % text on Home and
  Settings, axe (critical + serious) clean, emulator add / edit / conflict / undo / past-year
  read-only / sign-out, denied-write retry, offline PWA restart, heatmap names + keyboard +
  weekday alignment, fixture 60 / 445 / streak / log / undo.
- Screenshots (fictional demo data) in `docs/open/033-screenshots/`: 320, 390, 430, tablet and
  desktop, fold and full page, plus Settings and an archived year.

## Reviewing on a phone

```bash
npm ci && npm run dev -- --host
# open http://<your-computer-LAN-IP>:5173/the-pushup-challenge-2025/?mode=demo&fixture=feb-10-2027
```

Demo mode is memory-only (resets on reload, no Firebase reads or writes). For the real signed-in
view, use a normal dev build with your own Firebase sign-in; nothing here changes rules or data.

## Risks and remaining differences

- Not verified on a physical iOS / Android device. Safe-area handling uses `env(safe-area-inset-*)`
  but is untested on hardware.
- The sign-in, access-pending and Account forms were restyled with the tokens only; they were not
  redesigned and should get their own reviewed pass (#34 follow-on screens).
- Heatmap hit area (item 7) and illustrative thresholds (item 2) need owner confirmation.
- Streak resets each 1 January (item 1).
- Another session's uncommitted icon / service-worker edits exist in the shared checkout; they are
  not part of this PR.

## Rollback

Revert the PR; there are no data migrations, rule changes or deployments. The old UI is intact on
`style/app-ui-v2` and `main`.

## Loading states (follow-up)

Owner-requested copy cleanup: removed the “Today · confirmed” label above today's total.
The total, save feedback and archived-year label remain available.

Owner-requested compact heatmap: the month grid fills the available width with 28px-high
date buttons and closely spaced heat cells that fill each column. Vertical spacing around the grid, legend and
selected-day details is reduced. Keyboard navigation is preserved.

Current-year month navigation stops at the current month, including keyboard navigation.
Archived years retain access to all twelve months.

Home now shows the month/year as a button with a matching-size red chevron, without month arrows or
the redundant daily activity subtitle. It opens a separate History screen with a larger
month grid, selected-day sets and previous/next controls. Home keyboard selection stays
within its displayed month; History retains month browsing up to the current month.

Visual refinement: removed dotted future-cell outlines and default cell borders, darkened
empty cells. A subsequent refinement distinguishes future days with hollow solid-border
cells and an “Upcoming” legend, while past days remain filled. Today, selection and
keyboard focus remain explicit.

Problem: on every refresh a signed-in user saw a blank page, then bare "Opening your journal…" text
(read as an unstyled page), then Home with zeros and a "Loading confirmed sets…" line, then real data.

Principles applied: paint immediately, one stable silhouette, no layout shift, no jumping numbers.

- `index.html` carries critical inline CSS (app background, skeleton) and a static branded shell, so the
  first frame is correct even before JavaScript or the main stylesheet (also removes the dev-server blank).
- `HomeSkeleton` has the identical silhouette and is used for the sign-in check and for the first
  load of a year's sets; the shell hands over to it without movement.
- Screen readers get one polite status line; the skeleton is hidden from them. Motion respects reduced-motion.
- `tests/boot-shell.test.js` keeps the shell, the skeleton and the background token in sync.
- Offline still shows "Reconnect to load confirmed sets."; sign-in, errors and Settings are unchanged.

## Background saving (follow-up)

The "Saving… awaiting confirmation." and "Saved" lines were removed. A tap now shows its effect at
once (totals, recent sets, undo) and the write is confirmed in the background, in tap order. Buttons
no longer grey out while a save is in flight. Failures are unchanged and still visible: the error
banner with Retry / Dismiss, and unconfirmed totals are dropped rather than claimed. The app shell
carries `data-save-state` for tests only.

## Header: equipment label (owner follow-up, selected from `design/mockups/header/`)

The current phase is a sportswear patch to the right of the PushUp wordmark, tilted 3°, with a
"CURRENT PHASE" kicker and a "<year> EDITION ↗" foot. Every phase uses the same 22px bold type on two
lines in capitals without hyphens: OFF / SEASON (deep petrol), TRAIN / ING (warm amber, dark text) and
COMPE / TITION (brand red; Competition is the official phase). Archived years show a neutral
READ / ONLY patch. The date row under the masthead is gone: the date is now the label over today's
number ("TODAY · WED, FEB 10"). Settings stays top right, beside the patch. The patch narrows to 105px at 360px and
below so the wordmark, patch and settings fit at 320px; at 200% text it wraps under the wordmark.
Screen readers get "Current phase: …" once; the visual patch is hidden from them.
Not carried over from the mockup: the "PERSONAL REP JOURNAL" top line (invented copy) and the plain
"20 27" year, because the app keeps its tilted brush year.

## Heatmap styling exploration (historical, superseded by selected design)

Four standalone, unapproved styling variants are available in
`design/mockups/heatmap/`: Quiet squares, Calendar tiles, Compact rails and Activity dots.
See that folder's README and comparison screenshot for rationale and verification.
The exploration uses fictional data and changes no app behavior. Choose a direction
before implementing production styling. Lint, 71 unit tests and build pass; browser
checks cover shared selection, empty totals and 320/390/430px overflow.

Owner refinement: heatmap mockups A–D now all use full-width square cells.
Removed calendar labels, numbered dates, legends, phone chrome and explanatory
copy around each variant. Containers hug the grid with one selected-day line.
Variants differ in spacing, corners and fill/outline treatment only.

## Initial heatmap A implementation (historical refinements below)

Owner selected A. Home now uses full-width square cells with 5px gaps, 3px
corners, a 10px inset and compact selected-day details. Month/weekday labels,
calendar alignment blanks and the legend are omitted on Home; History retains
month navigation and calendar alignment. Today uses a dot and selection a light
inset border. Home/End keyboard movement follows the displayed row layout.
Existing day records, editing, phase labels and save failures remain available.

Verification: lint, 71 unit tests and build pass (existing asset-path and bundle
warnings). Demo browser checks cover 320/390/430px square geometry and overflow,
keyboard day selection and opening History. Updated the browser regression to
expect consecutive Home squares. No data, rules or deployment changes. Rollback:
revert ActivitySquares JSX/CSS and the corresponding browser expectation.

Owner correction: restored the visible month/year heading on Home. The compact
Home grid now uses ten columns (three rows for February), with matching ten-day
vertical keyboard steps. History remains seven columns. Browser checks at
320/390/430px verify the month heading, no overflow, grid height below 130px and
ArrowDown movement from day 1 to day 11.

Owner cleanup: removed selected-day details and the year breakdown from Home.
History retains selected-day totals and editable sets. Browser verification confirms
both Home sections are absent and History detail remains available. Updated the
browser regression to review day details in History.

Owner refinement: removed today's dot and restored a red outline, inset to retain
compact square spacing. Other selected days retain the light selection border.

## Rolling 30-day Home activity (implementation notes)

Home now shows exactly 30 calendar dates, inclusive of today, oldest first in
three ten-cell rows. The heading names the actual date range. History retains
calendar months; archived Home views remain year-scoped rather than showing the
current year's rolling activity. Keyboard rows and bounds follow the displayed
window, including month/year transitions. Today's red outline is retained.

January windows subscribe read-only to the same owner's previous-year repository
under the existing demo/cloud gates. Prior-year records are validated through the
annual model and exposed only as heatmap counts; current annual totals, write
journals and mutations remain scoped to the selected year. Unloaded prior-year
cells are named “Activity not loaded”, not zero; a read failure has visible copy.
No rules, production mutations, migrations or deployment changes.

Verification: lint, all 78 current unit tests, build pass (existing asset-path and
bundle warnings). Deterministic rolling-date tests cover inclusive count, month
and year boundaries, leap day and both DST seasons. Browser checks cover January
prior-year loading, exact first/last dates, ten-column keyboard movement,
unchanged month History and 320/390/430px overflow. No physical-device or live
production verification. Rollback: revert rolling-grid helpers, Home wiring and
the additive previous-year subscription.

### Compact header alternatives

The owner found the single-column letter stack too tall. Five standalone alternatives are
available in `design/mockups/header/`, with phase and phone-width controls and a comparison
screenshot. A uses two columns of upright letters; B uses stacked words (readability
recommendation); C uses one horizontal pill; D rotates a compact line; E places the phase
beside the year under the wordmark. These are review options, not an approved app change.
All three phases at 320/390/430px passed mockup overflow checks with no browser errors.

Owner requested more creative divergence after the first five options. Round 2 lives in
`design/mockups/header/round-2.html`: two distinct compositions, Equipment label (red
sportswear patch beside the logo) and Journal masthead (wide wordmark, large year and
phase rule). First-round studies remain available. No app implementation was changed.
Both directions passed all three phase/width combinations without overflow; comparison
screenshot is in the same folder. The subsequent owner selection is recorded below.

Owner hierarchy refinement: Home's rolling heatmap is titled “Last 30 days”,
with a quieter History link on the same header row. Removed the raised sheet
background, bleed, padding, border and shadow so activity sits on the page surface.
History retains month names. Browser checks verify the shared row at
320/390/430px, transparent section background, no overflow and working History.

Equipment label selected for refinement: preserve the OFF SEASON 22px headline size
for every phase, using two lines without hyphens. Off-season is deep petrol, Training
warm amber with dark text, Competition red. Updated round-2 mockup and per-phase
screenshots; verified identical font size and no label overflow for all three phases
at 320/390/430px. Lint, unit tests and build pass. App implementation remains unchanged
in this mockup refinement task.

## Selected header design (owner decision, 2026-11-06)

**Selected: Round 2, option 01, Equipment label.** The owner chose this direction
(“equipment label is awesome”). Journal masthead and the five first-round alternatives
are not selected. The earlier vertical pill and single-column letter stack are superseded.

The selected composition pairs the PushUp wordmark and year with a compact, slightly
rotated sportswear-style phase patch beside the logo. It shows only the current phase.

- All phase names use the OFF SEASON treatment: 22px, weight 900, line-height 0.95.
  Do not shrink Training or Competition to fit.
- Use uppercase, no hyphens, and two lines: OFF / SEASON, TRAIN / ING, COMPE / TITION.
- Phase colours in the refined mockup: Off-season deep petrol
  (`oklch(0.38 0.055 220)`), Training warm amber (`oklch(0.8 0.14 80)`) with dark text,
  Competition red (`oklch(0.58 0.2 28)`). Colour supplements the phase name.
- Competition is the display name for the existing official phase; season rules do not change.

Reference: [interactive round-2 mockup](../../design/mockups/header/round-2.html),
[comparison](../../design/mockups/header/round-2.png), and per-phase screenshots in
`design/mockups/header/`. All three phase labels were checked at 320/390/430px for
identical text size and no overflow.

**Status:** design selected and mockup refined. Applying this composition to the app
header and verifying that implementation are the next steps. This selection does not
record a deployment or completion of production implementation.

## Progress in hundreds (Century stack)

Problem: the progress bar existed only in the official window (a 2,000-wide bar, so +20 barely moved it)
and training and off-season showed nothing. There is no official target outside the official window and
we do not invent one.

Design (owner choice among seven mockups; the throwaway mockup is `design/mockups/progress-bar/`, kept
local): one bar that always means "this hundred". At 100 the bar becomes a full-width **Compact**
button; tapping it folds the bar into one block in a stack and the bar starts again. Official shows 20
slots (2,000); training and off-season keep stacking in rows of 10 (a "+N" chip after 40).

- **Which total:** the phase being viewed — official (target 2,000), training, or off-season ("this
  year"). Only official has a target. Archived years show the official total read-only, already stacked,
  with no button; a year with no official edition shows no progress element.
- **Source of truth:** `src/utils/century.js`. Blocks are always `floor(total / 100)`. "Compacted" is
  display state only (localStorage `pushup.century.<year>.<category>`, not stored in demo mode, no cloud
  or Firestore change). First load shows everything already stacked; a hundred finished by logging waits
  for the tap. Undo below a hundred removes the block. Logging is never blocked by a waiting block and
  extra reps carry to the next hundred.
- **Motion:** the word tightens in as the button appears; tapping flies the bar into its slot (420 ms).
  Reduced motion skips the flight. The bar row's height is reserved, so quick-log buttons never move.
- **Accessibility:** Radix progressbar for the current hundred, Compact is a real button (removed from the
  accessibility tree when no hundred is ready), block count is a polite live region, stack is one image
  with a text label.
- **Visible changes to confirm:** (1) training and off-season now show progress; during training the
  headline was "Official 0 / 2,000" and is now the training total; (2) with the year breakdown gone from Home (owner cleanup), the official total is only shown while the official phase is running; after it ends Home shows the off-season total and the official result is not shown on Home (decision pending: where it should live); (3) the e2e test id `official-total` is now `progress-total`.
- **Not built:** auto-compact setting and the alternative button positions (mockup only).

## Polish pass (critique, owner follow-ups)

Independent design review (26/40) and owner direction applied: the running total for the phase is now the lead number
(the hero), with the bar and bricks directly under it; today's count is the small line beside logging (with the streak).
Removed copy the owner said the user can work out: the "Today · date" line, the phase label over the total
(the patch already names the phase), "this year / so far", and the bar captions ("45 / 100", "N to the next block",
"N of 20 blocks"). Screen readers still get the label and a polite block-count status. Blocks are bricks (1.8:1) so they
do not read as days in the 30-day grid. Gaps tightened (reserved bar height kept so +N buttons never move), footer link
44px, hover styling only on hover-capable pointers, leftover raised-sheet and breakdown CSS removed.
