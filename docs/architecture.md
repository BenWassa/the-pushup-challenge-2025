# PushUp architecture — integrated source, November 5, 2026

**Scope:** This documents the current `main` source after PRs #7–#22, not the legacy app still served at the live GitHub Pages URL. Production Firebase rules, records and Pages cutover remain separate approval gates.

## Runtime

- React 19, Vite 7, Tailwind CSS and Firebase 12; `src/main.jsx` mounts `src/App.jsx`.
- `src/hooks/useAuth.js`: existing-account Firebase email/password sign-in, Auth UID, Firestore instance and isolated local emulator mode.
- `src/hooks/useChallenge.js`, `src/utils/challenges.js` and `src/utils/challengeModel.js`: selected edition/year, timezone, calendar phase, daily/rest-day schedule and derived totals. Reported phase follows the configured date, not untrusted saved metadata.
- `src/hooks/useActivityData.js`: confirmed record subscription, saving/saved/error states, pending-operation journal, idempotent retry, correction/removal and selected-current-year write gating.
- `src/data/activityRepository.js`: one Firestore document per activity with transactional conflict checks and tombstone removals; `src/data/activityJournal.js` retains operation IDs for retries.
- `src/data/memoryRepository.js`: fictional, reload-reset demo entries that never use Firestore.
- `src/components/app/{ActivityList,History,Account}.jsx` and `src/App.jsx`: mobile-first solo journal, quick-add, year selection, recent sets, calendar, editing, account preferences, explicit warning/failure UI.
- `public/sw.js`, `public/manifest.webmanifest`: scoped PWA caches, offline navigation fallback and year-neutral install metadata.

Old `src/hooks/useUserData.js`, `useLeaderboard.js`, `src/utils/season.js`, and several old components remain in the repository for historical context but are **not imported by the current `src/App.jsx`**. Do not mistake their legacy design for active runtime behavior.

## Activity record contract

Path: `participants/{authUID}/challenges/{year}/entries/{stableID}`.

Each canonical entry carries `schemaVersion:2`, stable ID, `ownerUid`, `challengeYear`, `localDate` (literal YYYY-MM-DD), `phase`, IANA `timeZone`, positive integer amount, created/updated timestamps, revision, deleted tombstone and last operation ID. Imported archives can additionally retain provenance. The authorization boundary is the authenticated UID in the document path, not a username supplied by the client.

The app derives totals from confirmed entries only, separated by year and configured training/official/off-season windows. Suspicious phase/timezone metadata is surfaced; records are not silently modified to match an interpretation. Duplicate/replayed IDs and revisions cannot count twice. Archived years and imported `legacy_` entries are read-only to clients.

2027 official dates: Feb 3–26; goal 2,000. Sundays Feb 7, 14, 21 are verified rest days with zero targets; the remaining organizer daily targets are pending. Personal January training defaults are not organizer facts.

## Production data and security distinction

The **legacy** source data remains at `artifacts/{appId}/public/data/users/{lowercaseUsername}` with embedded logs and lifetime counters. Those records have not been imported into the new UID-based collection. The explicit-project read-only audit reported permissive deployed rules; the checked-in `firestore.rules` are a candidate deny-by-default, UID-scoped policy tested in emulators, **not deployed production rules**. Deploying new rules before replacing the old runtime can break the old app; deploying only the new runtime under old rules leaves the access risk unresolved.

`scripts/backup*.js` and `scripts/migration*.js` provide checksum-backed read-only logical snapshotting, pure mapping/quarantine/reconciliation planning and isolated emulator restoration. They are not authorization to run a live migration. Real account-to-profile mapping, production recovery proof, and production rule cutover require explicit owner approval.

## Tests and deployment

- `npm run lint`, `npm test`, `npm run build`: source checks and a non-destructive build to `dist/`.
- `npm run test:integration`: local Firebase Auth/Firestore emulator suites and Chrome/Playwright browser journeys (never production).
- `.github/workflows/pages.yml`: runs source + emulator/browser acceptance on PR/push. The integrated `main` run [42145594256](https://github.com/BenWassa/the-pushup-challenge-2025/actions/runs/42145594256) passed the build and integration jobs.
- Publication requires an explicit `workflow_dispatch` on `main` with `deploy=true`. Manual release verifies required public Firebase web client variables and refuses demo project IDs; only that build enables `VITE_ENABLE_V2_CLOUD=true`. These build gates do **not** replace Firestore rules security or owner approval.
- Existing tracked generated `docs/` assets and legacy Pages source are retained until authorized cutover and live verification. Do not erase them with a build or treat the source PR merge as a deployment.

Release evidence, stop-ship criteria and rollback sequence: [production cutover](production-cutover.md), [release checklist](release-checklist.md), and [issue #6](https://github.com/BenWassa/the-pushup-challenge-2025/issues/6).

## Remaining external acceptance

Owner-controlled verification of the actual deployed project/rules and UID mapping; recoverable restricted backup; approved coordinated rules/Pages cutover; real Android/iOS PWA, persistence and accessibility checks; served artifact version and historical record reconciliation. Until then: **integrated source and automated test candidate, not verified production release**.
