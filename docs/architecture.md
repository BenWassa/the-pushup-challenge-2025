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
