# #6 — Test, security, deployment and release readiness

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/6  
**Status:** Planned — start regression tests as contracts become available  
**Depends on:** #2 through #5 for final launch

## Test plan
- Phase dates, year selection, target sums, unknown daily schedule, off-season classification.
- Create/undo/correction, reload consistency, duplicate prevention and write failure recovery.
- Anonymized legacy records, timestamps and archived annual totals.
- Firebase authorization, backup and restore, and demo-vs-production separation.
- Service worker update behavior, installed PWA URL, cache invalidation and real-device usage.
- Mobile accessibility (keyboard, focus, contrast, text scaling, touch size and safe areas).

## Pages migration
- PR #2 foundation introduces a `dist/` build and Pages workflow, but **Settings → Pages → Source: GitHub Actions** must be selected by the owner at cutover.
- Verify replacement at https://benwassa.github.io/the-pushup-challenge-2025/ before removing legacy `docs/` build files.
- Do not rename repository or URL in the same deployment cutover.

## Exit criteria
- Lint, tests and build all pass in CI.
- Real phone: sign in, log, see successful save, reload, verify totals, inspect past year.
- Failure states, date boundaries and live rules checked.
- Deployment verified; rollback and any manual fixes written down.
- Only then declare ready for Feb 3, 2027.
