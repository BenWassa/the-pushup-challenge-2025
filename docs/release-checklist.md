# Controlled release and recovery

Issue [#6](https://github.com/BenWassa/the-pushup-challenge-2025/issues/6), November 5, 2026. This is a procedure, not completed launch verification.

## Before approving production publication

- Record the candidate commit, passing lint/tests/build run, previous deployed commit, artifact and version. Retain a downloadable rollback artifact outside expiring CI storage.
- Verify `npm run build:pages` preserves `docs/`; the automated regression executes the real command in an expendable fixture.
- Verify the candidate artifact uses the intended public Firebase client configuration and APP_ID. The current Actions workflow supplies no Firebase environment values, and repository-level Actions secret/variable listings were empty during this audit. Environment-level or organization configuration was not verified. A successful build alone does not demonstrate working cloud sign-in. Never put service-account keys, passwords or private keys in Vite variables.
- Complete #3 ownership/rules verification and backup/restore rehearsal before approving cloud schema/write changes. Do not infer authorization from hidden UI controls or Firebase client configuration.
- Preview the exact artifact with the correct repository base. Verify direct navigation, manifest scope/start URL, icons, and every referenced hashed asset returns the expected content type and HTTP 200.
- In an isolated test account/emulator, verify login, log, explicit confirmed save, reload, undo, history and failure/retry. Confirm 2027 official totals exclude training, off-season and old years. Do not use a production record for destructive smoke tests.
- On real iOS Safari and Android Chrome at 320/390/430px, verify pinch zoom, 200% text, keyboard focus, tap targets, safe areas, install/launch, offline navigation and update/reload. Desktop unit tests do not establish these results.
- Increment the application version for a release that changes assets. The worker cache version comes from package version; multiple deployments using one version can reuse cached assets/metadata. Test old installed clients through the update path. Existing immediate `skipWaiting`/claim behavior still needs device review.

## Publication

Ordinary PRs/main pushes validate only after PR #8. Both artifact upload and deployment require manual `workflow_dispatch` on `main` with boolean `deploy: true`. Do not dispatch until the owner approves production cutover and the gates above pass. Verify any GitHub environment protection before dispatch. The legacy Pages source setting alone did not prevent the original Actions deploy from succeeding.

With approval, record and change Pages Source to GitHub Actions, dispatch the reviewed main commit, inspect the deploy run and verify the actual served asset fingerprint. Recheck login and read-only historical data, cache/update behavior and a permitted isolated smoke account. Keep the old `docs/` artifact until this verification succeeds. Its cleanup is a separate PR.

## Recovery

1. Stop further publication; capture failed commit, run URL, served asset fingerprint and symptoms. Do not clear Firestore or local participant data to repair a deployment.
2. Before cutover, the preserved `main/docs` remains the rollback source. Request its branch-based Pages rebuild only while the repository is configured for legacy publication. Verify the build completes and the served HTML refers to `index-DNnqb7Of.js` (baseline at this audit), with assets returning 200. A deploy run success alone is insufficient.
3. After Actions cutover, redeploy the retained last-known-good artifact or a reverted, reviewed main commit through the same manual release gate. Do not switch source casually or combine recovery with a data migration. Record any required source-setting change and obtain owner approval.
4. Verify fresh and previously installed clients. An old service worker may retain an application shell until update/reload; inspect cache/version and confirm app behavior before declaring recovery. Do not delete unrelated origin caches or participant data.
5. Any future data migration has a separate backup/rollback manifest. Application rollback cannot reverse an incompatible schema migration; leave production writes disabled if compatibility cannot be established.

## Current evidence and outstanding gates

- PR #7 CI and local checks passed; PR #8 gates further publication. Existing legacy assets remain tracked.
- This batch adds worker behavior tests for cache ownership, scope, offline query navigation, successful cache reuse and HTTP error handling. It does not simulate full browser lifecycle, installation, cache quota or Firebase persistence.
- No production Firebase records, rules or settings were changed. Live rules, owner identity, actual historical record inventory, verified backup restoration, real-device logging and final 2027 UI integration remain outstanding.
