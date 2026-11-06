# PushUp 2027 delivery plan

Updated November 5, 2026. Tracker: issues #2–#6. This plan covers delivery through release, not a stopping point after the next PR.

## Baseline

Main `65fc942` contains PRs #7–#13: immutable annual config, read-only import/aggregation, previews, small accessibility fixes, service-worker safeguards and 24 tests. Runtime still uses legacy lifetime counters, username profile selection and recurring dates. No completed production migration, UI integration or device acceptance exists. Issue #6 was automatically closed despite outstanding criteria and has been reopened.

## Contracts and ownership

- Data agent (#3): UID/year entry repository, revision/idempotency protocol, memory demo adapter, activity hook, Auth emulator connection, candidate rules and authorization tests. No production writes/rules changes.
- Annual agent (#4): annual view model and hook, explicit timezone/day/phase, archive-safe totals, personal goal preferences. App controls selected year to avoid cyclic hook dependencies.
- Mobile agent (#5): application shell, CSS and app components using those hooks. Complete dashboard, month/day history, corrections, account/settings, save/error/offline states. No direct Firebase calls.
- Lead (#6/#2): dependencies, integrated browser journeys, emulator runner, CI, manifest/version/cache/release artifacts, migration rehearsal, review and integration. After independent implementation agents finish, assign focused defect remediation and final review.

`useActivityData({db,user,isDemoMode,year,timeZone})` returns confirmed records, loading/error, save state, pending operation, add/edit/remove/retry and canWrite. `useChallenge({records,selectedYear,onYearChange})` supplies edition/date/phase/progress and archive-safe controls. Stable operation IDs survive retry; revision preconditions prevent lost edits. Calendar date remains literal, timezone explicit. Confirmed totals never include pending writes. Production v2 cloud access is opt-in and cannot be enabled for release until rules/ownership/backup approval gates pass.

## Successive phases and exit evidence

1. Baseline/architecture: reconcile tracker, inspect actual database edition and deployed rules read-only, record live publication baseline. Exit: shared interfaces and file ownership agreed; unsafe operations gated.
2. Functional implementation in parallel: persistence/rules candidate, annual read model, actual mobile UI. Exit: add/edit/undo and retry correct in memory/emulator; selected year and date drive every rendered total; no legacy hook in active app.
3. Integration: merge reviewed PRs after checks; run auth, add, edit, undo, reload, two-client sync, logout, year/history and denial journeys against isolated emulators. Exit: journeys pass with no false saved state, duplicate or cross-account exposure.
4. Refinement: fix findings; run 320/390/430/desktop, text scaling, keyboard and automated accessibility checks. Exit: no overflow or serious accessibility violations; screenshots reviewed; public metadata consistent.
5. Assurance: clean install/build, CI emulator/browser checks, candidate artifact with correct base, PWA/cache/update tests, backup/import/reconciliation rehearsal using fictional fixtures. Exit: reproducible candidate and precise remaining live/device gates.
6. Launch approval: present candidate commit, rule diff, ownership mapping/reconciliation, verified backup and rollback evidence. Obtain separate explicit approvals for production rules/migration, Pages source switch and publication. Without approval, finish all isolated checks and retain release candidate; do not dispatch publication.
7. Closure: after authorized release, verify served hashes, sign-in/persistence/history and installed clients; move only fully verified issue records to closed. Preserve legacy deployed assets until cutover verified. Establish annual config/update checklist.

## External gates, not reasons to stop implementation

Production permissions/rule changes, destructive migration, historical deletion, Pages source switch and publication require owner approval. Physical iOS/Android installation and actual account ownership may need owner participation. Missing access or approval does not block emulator/UI/testing work. Record exact evidence and limitations rather than claiming completion from PR merges.
