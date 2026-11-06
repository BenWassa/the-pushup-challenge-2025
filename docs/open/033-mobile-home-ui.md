# Issue #33 — PushUp 2027 mobile-first Home implementation

- Issue: #33 (implementation), #34 (design record), #5 (functional mobile UX)
- Status: **implemented on `feat/33-mobile-home-ui`, awaiting owner review.** Not merged, not deployed.
- Visual direction: Athletic Bold / Brush Impact (#34). The complete Home composition in #34 is still
  marked "not approved"; this PR implements the written component decisions and is the artefact to
  approve or revise.

## What changed

| Area          | Change                                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home          | One vertically scrolling page, no bottom navigation: compact header → Today + official progress → 2×2 quick-add → Activity Squares → Recent sets → quiet year breakdown.                                                                         |
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
4. **Selected-day sets and Recent** never list the same set twice: Recent skips the day currently
   shown in the heatmap detail.
5. **Brand mark** is a heavy italic wordmark with a red dry-brush stroke drawn in SVG/CSS, not the
   supplied brush artwork (which is orange and a full-bleed image).
6. The breakdown line keeps Training / Off-season / Imported / Active days visible but quiet, and
   drops Official (already the headline counter).
7. **Heatmap hit areas:** each square sits in a full-column button (≈40 px pitch at 320 px, ≥ 24 px
   WCAG 2.2 minimum; below the 44 px used for primary controls). Squares stay small as specified.
8. Hand-built heatmap instead of a calendar library: libraries (React Aria Calendar etc.) name each
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
