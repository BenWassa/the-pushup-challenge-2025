# #2 — 2027 foundation, documentation and Pages safety

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/2  
**Status:** PR #7 merged; deployment cutover remains open  
**Owner decision:** strategy direction approved, solo-first for 2027

## Problem
Current Vite build output is `docs/`, and legacy `build:pages` deletes it, so source documentation in `docs/open` or `docs/closed` is unsafe.

## Planned / staged work
- [x] Confirm original 2025-named repository is the ongoing base rather than the local-only template.
- [x] Document vision, strategy, architecture and agent conventions.
- [x] Change build output to ignored `dist/`; remove destructive docs deletion.
- [x] Stage GitHub Actions workflow to lint, test and build on PRs and deploy built output from main.
- [x] Create `docs/open/`, `docs/closed/` issue organization.
- [x] Verify CI lint/test/build on PR #7; local lint, 2 tests and production build also passed November 5, 2026.
- [ ] Record Pages setting: owner selects **Settings → Pages → Source: GitHub Actions** at controlled cutover.
- [ ] Confirm live app on actual Pages URL after cutover, then schedule a separate cleanup of old generated `docs/` site files.
- [ ] Merge reviewed PR; close issue with validation evidence and move record to `docs/closed/`.

## Acceptance checks
- `npm run build` does not modify `docs/` or historical data.
- `npm run build:pages` is non-destructive.
- GitHub workflow builds `dist/` on a pinned Node version and runs lint/tests.
- No existing deployed assets or user data removed as part of this PR.
- Docs accurately distinguish staged config from completed deployment.

## Risks / manual steps
The existing Pages site may currently publish `main/docs`. The new workflow requires manual configuration; until switched, the old site will keep serving the existing build. Do not delete generated `docs` assets yet. Work remains unmerged until reviewed.

## Review evidence
PR [#7](https://github.com/BenWassa/the-pushup-challenge-2025/pull/7) merged at `3bfaf1d`. GitHub Pages API reports `build_type: legacy`, branch `main`, path `/docs`. Existing URL returned HTTP 200 after merge. No Firebase records or settings were changed. Keep this record open until source cutover and runtime verification are complete.

### Deployment guard follow-up
The merge-triggered Actions run [42135963914](https://github.com/BenWassa/the-pushup-challenge-2025/actions/runs/42135963914) reported deploy success despite Pages still reporting legacy source. Do not rely on that setting to prevent Actions publication. A legacy Pages rebuild was requested to restore the preserved artifact. The follow-up workflow gates artifact publication and deploy on explicit manual `deploy: true`; ordinary pushes and PRs only validate. This is not approval to cut over production.
