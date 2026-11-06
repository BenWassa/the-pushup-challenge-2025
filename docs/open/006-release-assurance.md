# #6 — Test, security, deployment and release readiness

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/6  
**Status:** Integrated build/emulator/browser CI green; live security, backup, Firebase configuration, physical phones and publication approval outstanding
**Depends on:** #2 through #5 for final launch

## Test plan
- Phase dates, year selection, target sums, unknown daily schedule, off-season classification.
- Create/undo/correction, reload consistency, duplicate prevention and write failure recovery.
- Anonymized legacy records, timestamps and archived annual totals.
- Firebase authorization, backup and restore, and demo-vs-production separation.
- Service worker update behavior, installed PWA URL, cache invalidation and real-device usage.
- Mobile accessibility (keyboard, focus, contrast, text scaling, touch size and safe areas).

## Pages migration
- PR #7 foundation introduced a `dist/` build and Pages workflow, but **Settings → Pages → Source: GitHub Actions** must be selected by the owner at cutover.
- Verify replacement at https://benwassa.github.io/the-pushup-challenge-2025/ before removing legacy `docs/` build files.
- Do not rename repository or URL in the same deployment cutover.

## Exit criteria
- Lint, tests and build all pass in CI.
- Real phone: sign in, log, see successful save, reload, verify totals, inspect past year.
- Failure states, date boundaries and live rules checked.
- Deployment verified; rollback and any manual fixes written down.
- Only then declare ready for Feb 3, 2027.

## Initial implementation batch

- Service worker caches now include the app scope. Activation deletes only older caches from that scope, not all caches sharing the GitHub Pages origin. Legacy unscoped caches are left untouched because their ownership cannot safely be inferred.
- Only successful HTTP responses enter runtime cache; current-version cache lookup prevents old/unrelated caches from supplying an app shell. Offline navigation with query parameters falls back to the current precached index. Cross-origin, out-of-scope and non-GET requests remain untouched.
- Native Node VM behavior tests cover these boundaries. A separate regression runs the actual `build:pages` command in a disposable fixture and verifies source docs and old deployed HTML survive.
- Repository-level Actions variables/secrets were absent during read-only audit; workflow has no Firebase build environment. Environment/organization configuration was not established. Cloud login in a newly built Actions artifact is unverified.
- [Release and rollback checklist](../release-checklist.md) records precise cutover gates, baseline asset identity and recovery procedures.

Local validation: lint, 23 native Node tests across the integrated baseline (including disposable build), production build passed. Cache open/read/write failures are tested to preserve successful network responses. No generated legacy docs assets changed. Real-device PWA, real cloud authorization, backup restoration and final integrated UI validation are still required. Keep #6 open.


## End-to-end recovery batch (November 5, 2026)

Added read-only logical backup enumeration with fixed readTime and typed document values, restricted checksummed files, explicit ownership/timezone mapping, pure migration/quarantine/reconciliation reports, deterministic immutable legacy entry IDs, and emulator-only create/readback restore. See [release checklist](../release-checklist.md#recovery-tooling-and-approval-packet).

An actual isolated STANDARD Firestore emulator rehearsal restored fictional source documents, imported archive entries, verified idempotence, rejected a conflicting import without overwrite, and verified retained values. This is evidence for tooling, not a completed production backup or owner mapping. The backup CLI was not executed against production by this agent. Actual project-wide scope, Auth export, production restore and approved ownership remain open. Root's read-only production audit identified permissive deployed rules and no UID ownership fields; the coordinated release must address that exposure without breaking the preserved legacy application.

## Integrated acceptance evidence — November 5, 2026

- [PR #19](https://github.com/BenWassa/the-pushup-challenge-2025/pull/19): derive reporting phase from the annual calendar, preserve and warn on inconsistent metadata, permit safe bad-timezone tombstones.
- [PR #20](https://github.com/BenWassa/the-pushup-challenge-2025/pull/20): surface metadata warnings in the actual UI; run Firestore rules/emulator and browser journeys in GitHub Actions. Browser coverage includes fictional demo add/undo/reset, 320/390/430px overflow, serious automated accessibility findings, emulator sign-in/add/reload/history/two-tab synchronization/undo.
- [PR #21](https://github.com/BenWassa/the-pushup-challenge-2025/pull/21): annual PWA identity, Pages base-path-safe icons and manifest, updated README.
- [PR #22](https://github.com/BenWassa/the-pushup-challenge-2025/pull/22): version 1.13.0 and an explicit manual-deployment guard requiring reviewed Firebase web client variables; `VITE_ENABLE_V2_CLOUD` true only in a manually approved publication build. [Controlled cutover procedure](../production-cutover.md).
- Integrated `main` [workflow run 42145594256](https://github.com/BenWassa/the-pushup-challenge-2025/actions/runs/42145594256) completed build **success** and Firebase emulator/browser acceptance **success**, while production deploy was **skipped** as intended.

Automated success is **not** proof of physical iOS/Android installation, permission-safe deployed rules, actual legacy mapping, private backup restoration or a production-configured artifact. Existing Pages assets and production Firebase data/rules remain unchanged. **Keep this issue open** until production release and rollback have been explicitly approved and independently verified.
