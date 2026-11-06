# Architecture baseline — source review, November 2026

This is a review of the current `main` source, **not** a claim that deployed runtime or Firestore security was tested.

## Observed stack
- React 19, Vite 7, JavaScript, Tailwind CSS, Firebase Auth and Firestore.
- Entry `src/main.jsx`; app coordination in `src/App.jsx`.
- Authentication and Firebase initialization: `src/hooks/useAuth.js`.
- Profile loading, rep logging, undo and stats: `src/hooks/useUserData.js`.
- Live leaderboard: `src/hooks/useLeaderboard.js`.
- Seasonal classification: `src/utils/season.js`.
- Date/timestamp logic: `src/utils/timestamp.js`.
- Demo sample data in memory: `src/utils/localStore.js`.
- Static PWA manifest and service worker: `public/manifest.webmanifest`, `public/sw.js`.

## Current storage shape
Firestore documents are selected by username at `artifacts/{appId}/public/data/users/{username}`. A profile contains `training_reps`, `official_reps` and an array of log objects. Existing logs distinguish TRAINING and OFFICIAL but lack a guaranteed challenge-year key and explicit off-season categorization. Historical logs may use `submitted_date` rather than timestamp.

## Proven design risks to address
- `getSeason()` hardcodes January training and Feb 5–27 for official activity without year check.
- `App.jsx` hardcodes 87 daily reps and 2,000 cumulative, regardless of date/organizer daily schedule.
- `useUserData` and leaderboard treat every non-training day as OFFICIAL; off-season increments can contaminate official total.
- Logs do not consistently carry calendar year or unambiguous local-day information. UTC and local date comparisons are mixed in multiple paths.
- `calculateStreak()` counts unique active days rather than consecutive days; the Stats view calls this 'Active Days', but its denominator can mix phases.
- `useAuth` authenticates an email but `loadCloudProfile(name)` selects documents by a user-entered username; Firestore rules and backend authorization must be examined before trusting isolation.
- Cloud writes catch/log some errors without displaying save failure to users. Undo rewrites logs array while other writes use `arrayUnion` / `increment`; concurrent updates require testing.
- Demo mode uses in-memory fictional users and should stay isolated from real accounts.
- App/PWA metadata still names 2025, login names 2026; update carefully with deployment and cache behavior.

## Build and release transition
Previously Vite output to `docs/` and `build:pages` ran `rm -rf docs`. On issue #2 planning branch it instead outputs `dist/` and uses a non-destructive build alias; a PR validation and Pages Actions workflow is staged. Leave old published `docs/` artifacts in place until GitHub Pages source has been switched and a deployment validated.

## Testing baseline
`tests/demo-storage.test.js` uses native `node:test` and checks demo reset/isolation and timestamp seeding. No comprehensive date, data, auth, or integration test suite was found in reviewed files. CI must run lint/build/tests as a first step; current environment has not run them.

## Decisions deferred to their issues
- [#3](https://github.com/BenWassa/the-pushup-challenge-2025/issues/3): schema migration, backups, access rules, identity contract, conflict handling.
- [#4](https://github.com/BenWassa/the-pushup-challenge-2025/issues/4): annual schedule schema, phase engine and verified daily targets.
- [#5](https://github.com/BenWassa/the-pushup-challenge-2025/issues/5): UI design and accessibility.
- [#6](https://github.com/BenWassa/the-pushup-challenge-2025/issues/6): test and release gates.

Do not change production Firebase documents or permissions based solely on this baseline.

## Agreed implementation boundary (November 5, 2026)

The first implementation batch is additive: pure annual calendar and read-only activity normalization/aggregation modules. Existing cloud hooks remain on their legacy contract until UID ownership, backup and conflict-safe persistence are verified. Passing utility tests does not establish production authorization or complete #3/#4.

Canonical activity proposal: `schemaVersion`, stable `id`, `ownerUid`, `challengeYear`, `phase` (`TRAINING`, `OFFICIAL`, `OFF_SEASON`), `localDate` (`YYYY-MM-DD`), explicit IANA `timeZone`, positive integer `amount`, and `createdAt`. Both modules now use `timeZone`; runtime adapters must preserve it. Legacy `season` remains provenance; ambiguous dates or identity must be quarantined rather than guessed. Recompute year/phase totals from validated records, never from legacy lifetime counters.

The annual engine receives an explicit edition and instant or calendar date. It returns local date, phase, known daily target/rest-day state and schedule status. Unknown targets remain null. January 1 through February 2 is an app training default for 2027, not an organizer requirement. Toronto is the initial participant timezone, not a claim that Canada has one timezone.

### Integration sequence
1. Review additive module PRs and deterministic tests independently.
2. Connect read-only historical views through an explicit normalization adapter and reconcile against a verified export.
3. Test UID-scoped rules and transactional/idempotent add/undo in an emulator.
4. Connect the mobile logging UI with saving, confirmed and failed states.
5. Approve production backup/configuration and deployment cutover separately.

### Production release blocker
Pages currently uses legacy `main/docs`; the new Actions build has no configured Firebase build environment. A successful generic Vite build is insufficient evidence that cloud login works. Keep the legacy publication source until a candidate artifact has the intended public Firebase client configuration, security checks, preview smoke tests and an approved rollback. Never include passwords, service-account credentials or private keys in client build variables.

## First batch review and integration

Merged PRs: [#7 foundation](https://github.com/BenWassa/the-pushup-challenge-2025/pull/7), [#8 deployment gate](https://github.com/BenWassa/the-pushup-challenge-2025/pull/8), [#9 annual engine](https://github.com/BenWassa/the-pushup-challenge-2025/pull/9), [#10 mobile proposals and accessibility](https://github.com/BenWassa/the-pushup-challenge-2025/pull/10), [#11 read-only activity contract](https://github.com/BenWassa/the-pushup-challenge-2025/pull/11).

`tests/annual-data-integration.test.js` exercises the actual annual engine as the legacy classifier: Toronto midnight, training, official, rest-day activity, off-season and prior-year quarantine. A rest day has zero target but can still contain recorded physical activity. Records outside the selected edition cannot be silently reassigned. These are fictional fixtures and establish module compatibility, not real-data reconciliation.

The existing application still uses legacy `getSeason`, lifetime counters and hardcoded daily goals. This first batch does not claim PushUp 2027 is deployed or ready. Next integrate emulator-tested UID ownership and idempotent persistence, then connect edition-specific progress and the reviewed mobile states. Do not move #2–#6 records to closed until their remaining acceptance gates pass.
