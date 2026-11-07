# PushUp — Annual Challenge Journal

A mobile-first personal push-up tracker for training, the official Push-Up Challenge, and year-by-year history. This repository modernizes the existing app rather than creating a new codebase each year.

**2027 Canadian event:** February 3–26, 2027, 2,000 total push-ups. Official daily targets are shown only when verified with the organizer. The tracker is independent and **does not submit reps to the organizer**.

## Current delivery status

The new React/Vite annual app, year-scoped Firebase data adapter and candidate security rules exist in source. The current production site and existing Firestore records must remain protected until a coordinated release is explicitly approved. Do not assume a successful build means that production Firebase configuration, security rules or historical import is complete.

Review [product vision](docs/vision.md), [strategy](docs/strategy.md), [architecture](docs/architecture.md), [delivery plan](docs/delivery-plan.md), and the [release and rollback checklist](docs/release-checklist.md).

## Participant experience

- Email/password sign-in using an existing account; personal cloud data belongs to the Firebase Auth UID, not a username.
- Large +1, +10, +20 and +25 logging controls, recent sets, corrections and safe undo.
- Confirmed save/error/retry feedback; no unacknowledged write counts toward confirmed totals.
- Training, official challenge and off-season shown separately using the dated annual challenge configuration.
- History, calendar and past-year browsing; archived editions are read-only.
- Installable PWA designed for mobile use. Group features are intentionally deferred.

## Development

Requires Node.js 22. Install dependencies with `npm ci`, then:

```sh
npm run dev             # Local Vite development
npm run dev:demo        # Local development with fictional in-memory data (no Firebase, no sign-in)
npm run lint            # Source formatting and lint
npm test                # Native unit/regression tests
npm run build           # Non-destructive production output to dist/
npm run test:integration  # Isolated Firebase emulator + Playwright browser tests
```

The integration command additionally needs Java 21 and Playwright Chromium (`npx playwright install --with-deps chromium`). It uses Firebase project `demo-pushup-2027` and local emulators only; never substitute a production project for automated tests. `npm run test:rules` runs the isolated Firestore rules tests alone.

### Local testing with mock data

`npm run dev:demo` starts the dev server in demo mode: an entirely fictional, in-memory user with sample sets. It needs no Firebase configuration or sign-in, never reads `.env.local` Firebase values, and cannot reach production Firestore. Activity resets on reload. Open `http://localhost:5173/the-pushup-challenge-2025/` and tap **Start Demo**.

Pin the clock and data to a known day with a fixture, either from the environment or per page load (the URL wins):

```sh
VITE_DEMO_FIXTURE=feb-10-2027 npm run dev:demo   # default fixture for this server
# or: /the-pushup-challenge-2025/?mode=demo&fixture=jan-15-2027
```

In the demo you can also switch presets from **Settings → Sample data** (it reloads with `?fixture=`; choose _Live clock_ for the real date). Fixtures live in `src/data/demoFixture.js`: `feb-10-2027` (mid-challenge, 445 reps), `jan-15-2027` (training phase), `nov-6-2026` (off-season), `feb-3-2027` (day one, nothing logged) and `feb-26-2027` (challenge complete, 2,016 reps). Without a fixture, the demo uses the real clock and a couple of recent sets. `?mode=demo` also works on any dev, preview or deployed build.

## Cloud configuration and release boundaries

The app reads Firebase web client configuration from `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID` (plus optional Firebase public web fields). These web identifiers are **not** service-account credentials. Never publish private keys, user passwords, raw backups, UID mappings or real participant records.

The v2 cloud adapter is disabled in ordinary builds unless `VITE_ENABLE_V2_CLOUD=true` is set. Local emulator mode uses `VITE_USE_FIREBASE_EMULATORS=true` on loopback only. Merely enabling v2 does **not** verify production security rules or migrate legacy history.

The checked-in `firestore.rules` are a candidate owner-scoped policy for isolated review, **not permission to deploy**. Production Firestore access controls and legacy-account ownership require a reviewed cutover. Backups, migration tools and reconciliation reports must remain local and restricted.

GitHub Pages publication is manually gated. Preserve existing `docs/` generated assets and live URL until the owner authorizes the new artifact, security-rule cutover and Pages source change. See [release checklist](docs/release-checklist.md) before any production action.

## Repository conventions

- `AGENTS.md`: agent working agreement.
- `docs/open/`: issue-specific active work; `docs/closed/`: verified completed work.
- `src/hooks/useChallenge.js` and `src/utils/challenges.js`: annual configuration and date logic.
- `src/hooks/useActivityData.js`, `src/data/`: confirmed activity and storage.
- `src/components/app/`: solo dashboard/history/account components.
- `tests/` and `tests/emulator/`: unit, rules, migration and browser acceptance suites.
- `scripts/`: read-only backup, pure migration planning and emulator-only rehearsals.

Keep issues and pull requests scoped, with tests and acceptance evidence. Historic Firebase data is not disposable.
