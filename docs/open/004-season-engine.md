# #4 — Configurable challenge seasons

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/4  
**Status:** Planned — design can proceed in parallel with #3  
**Depends on:** #2 foundation; #3 data contract for integration

## Verified 2027 assumptions
- The Push-Up Challenge Canada: 3–26 February 2027, cumulative target 2,000.
- Official daily schedule, daily facts and rest days not yet established in the project; obtain organizer evidence before populating.
- Source: https://www.thepushupchallenge.ca/ and https://www.thepushupchallenge.ca/how-it-works

## Design tasks
- Single configuration object for each edition: ID/year, timezone, official start/end, training window, total goal and per-day schedule state.
- Phase resolution: TRAINING / OFFICIAL / OFF_SEASON; historical reporting should not depend on *today's* phase.
- Separate an optional personal pacing estimate from organizer-confirmed daily goals.
- Local day canonicalization; boundary tests across midnight, January/February, leap years, DST, and future year.
- Read-only selection of past editions and accurate calendar filters.

## Acceptance
- 2027 official dates display correctly and no 2026-specific dates are coded in logic.
- Out-of-season reps never affect official totals.
- Unknown daily targets visibly say pending rather than show fabricated goals.
- Year rollover preserves previous totals.
- Deterministic automated unit tests cover date and goal logic.

## Out of scope
Organizer API integration, extra exercise type conversion, personalized coaching.

## Implementation batch: additive engine (November 5, 2026)

`src/utils/challenges.js` supplies immutable `CHALLENGES`, `getChallenge(year)`,
`toLocalDate(instant, timeZone)`, `validateChallenge(config)`, and
`getChallengeDay(config, instantOrLocalDate)`. Day results carry `challengeYear`,
`localDate`, `timeZone`, `phase`, nullable `dailyTarget`, `scheduleStatus`, and
nullable `isRestDay`. Unknown editions return null; no recurring-year fallback.
Date-only values remain calendar dates; timestamps must have an explicit offset
(or be Date/epoch milliseconds). Explicit IANA timezones avoid host-dependent days.

### Configuration decisions and evidence

The organizer's [how-it-works page](https://www.thepushupchallenge.ca/how-it-works),
checked November 5, 2026, confirms February 3–26, 2027, 2,000 reps, changing daily
targets available in its app, and Sundays as rest days. Accordingly only February
7, 14 and 21 have confirmed zero targets. All other official days remain pending;
no daily targets or evenly distributed estimates are invented. These sources do
not establish a complete daily schedule. Recheck before launch.

January 1–February 2 is this application's configurable personal training default,
not an organizer fact. Toronto is the initial participant's configured timezone,
not a Canada-wide event timezone. These defaults must be visible and adjustable
in later configuration UX. Training and off-season days have no official target.
No annual configuration for prior years is inferred from the old recurring logic.

### Shared contract with #3

`getChallengeDay(config, localDate)` can supply the `{challengeYear, phase}`
classification for the read-only legacy adapter. Records retain canonical
`localDate` and `timeZone`; classification never depends on today's phase.
Aggregation must also check record year and explicit official date window.
Rest days stay in the OFFICIAL phase, with a zero target; logging activity on a
rest day remains possible without treating that as a fabricated target.

### Verification and limits

- Local `npm run lint`, `npm test` (8 passing tests), `npm run build` passed.
- Tests cover inclusive dates, midnight offsets, DST, leap days, future editions,
  malformed dates, overlapping windows, negative targets and full-schedule sums.
- Build emits existing bundle-size and stale Browserslist warnings.
- This batch is deliberately additive: existing `getSeason`, hooks and UI are not
  rerouted until data ownership and persistence integration are reviewed. #4
  therefore remains open; current app still contains legacy 87/day behavior.
- No Firebase data, rules, deployed assets or deployment settings changed.
- Rollback: revert this additive PR; no data rollback is needed.

## Application read model and hook integration batch

`createChallengeModel` now provides a single selected-year read model for the
runtime integration. `useChallenge` wraps it with year controls, a 30-second/focus
clock refresh and optional personal training goal/timezone preferences. App can
control `selectedYear` with `onYearChange`, allowing the year-scoped persistence
subscription to be constructed before the challenge model without a hook cycle.
`availableYears` merges known storage years into configured/current/record years.

Initial selection is the current participant-local calendar year, allowing logging
now even before 2027. A year without verified configuration is explicitly
UNCONFIGURED and new activity is OFF_SEASON with no daily/annual organizer goal.
Past and future selections have `canLog: false`; the UI and persistence adapter
must enforce this together. Changing timezone affects today's date and future
logging, never the saved local dates of existing records. At year rollover an
already selected old year becomes read-only rather than receiving new logs.

Summary fields: `total`, `official`, `training`, `offSeason`, `legacy`,
`todayTotal`, `activeDays`, `byDate`, `rejected`, `conflictingIds`. Official credit
requires both OFFICIAL phase and the configured official window. Identical IDs
count once; contradictory IDs are excluded. `getMonthActivity(model, 1..12)`
returns year-scoped records, total and day sums. Records must be owner-scoped by
the persistence adapter; this display model is not an authorization boundary.

`readLegacyExport` accepts an explicitly identified immutable export and retains
original phase provenance. Unknown historical editions show physical activity
under `legacy`, without claiming official credit or inventing historical
organizer dates. Invalid/ambiguous rows remain in a quarantine report. This is
read-only support, not a production export, import or identity-mapping approval.

Local validation: lint, all 31 Node tests and production build pass. Seven new
read-model tests cover current/future/archive access, midnight/year rollover,
phase totals, rest-day activity, timezone preference stability, duplicate IDs,
legacy provenance/quarantine, month filtering and leap-day archive selection.
Hook effects and integrated browser journeys remain integration QA responsibilities.
No Firebase data/rules or deployed assets/configuration were changed in this batch.
