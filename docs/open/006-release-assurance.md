# #6 — Test, security, deployment and release readiness

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/6  
**Status:** Initial automated assurance implemented; launch gates remain open
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
