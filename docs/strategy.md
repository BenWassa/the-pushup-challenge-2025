# Product strategy and delivery plan — 2027

**Decision status:** Direction agreed November 2026. Work is tracked in [GitHub issues](https://github.com/BenWassa/the-pushup-challenge-2025/issues).

## Strategy

Modernize the original React/Vite/Firebase application incrementally. Prioritize a dependable solo experience in February 2027, while preserving the ability to add a small private group later. Do not fork a new year-specific codebase or rebuild a working UI from scratch.

## Locked direction

- Mobile-first PWA, one-handed quick logging; keep +1, +10, +20, +25 available unless an alternative is validated.
- Preserve history, distinguish annual records and explicitly classify training / challenge / off-season.
- Annual configuration controls date windows, total goal, daily goals and rest days. Never invent official daily targets.
- Keep Firebase for now to preserve cross-device use and current code investment; audit authorization and storage before new writes.
- Solo-first at launch. Hide or defer leaderboards and extra profile management; do not delete old group functionality without understanding its dependencies.
- Continue using the existing repository and URL until a documented transition is approved.
- Treat live production data as read-only until backup, migration design and security review are complete.

## 2027 MVP

- Accessible personal sign-in and recognizable saved profile.
- Reliable logging, correction/undo, saved/failed state and today view.
- Correct annual and daily progress, training/off-season separation and organizer-confirmed daily schedule (when available).
- Month/history views that do not mix challenge years.
- Mobile home-screen install, usable updates and deployment/rollback process.

## Not in MVP

Public signup and onboarding flows, teams, advanced statistics, detailed social features, notifications, bespoke gamification, third-party or official-app integrations.

## Workstreams and priority

1. [#2 Foundation](https://github.com/BenWassa/the-pushup-challenge-2025/issues/2): protect docs, source controls, CI and deployment transition — prerequisite to any other PR.
2. [#3 Data and safety](https://github.com/BenWassa/the-pushup-challenge-2025/issues/3): assess identity mapping, legacy data and versioned year model before production writes.
3. [#4 Season engine](https://github.com/BenWassa/the-pushup-challenge-2025/issues/4): annual schedule and date logic; can design in parallel with #3, integrate after data contract agreed.
4. [#5 Mobile experience](https://github.com/BenWassa/the-pushup-challenge-2025/issues/5): focused 390px design and UX implementation, with contracts from #3/#4.
5. [#6 Release assurance](https://github.com/BenWassa/the-pushup-challenge-2025/issues/6): test, security, Pages and mobile sign-off. Start CI early and complete launch validation last.

## Deployment decision

`docs/` currently contains old GitHub Pages output. Vite must build to ignored `dist/`; a GitHub Actions workflow publishes it after the repository owner switches **Settings → Pages → Source: GitHub Actions**. Preserve the old `docs/` site until verified, then retire it separately. Do not rename the repo or base URL as part of foundation work.

## Key unresolved decisions

- Is existing Firebase data personal, shared, demo-only or partially legacy? Validate without destructive operations.
- Is the user's desired personal daily training target different from the organizer's schedule?
- Exact 2027 official daily target/rest-day schedule when organizer publishes it.
- Whether cross-device offline editing is needed, or online-only writes with clear disabled/error states are adequate.
- Whether previous years should show all physical activity or only challenge-period totals.

## Release gates

- Foundation: docs remain intact after all build commands and PR CI runs.
- Data model: anonymized legacy fixtures, backup/export and rollback plan reviewed before migration.
- Season engine: boundary and date tests pass, including local timezone.
- Mobile: usable at 320/390/430px; readable text scaling and one-handed logging.
- Launch: real-device login, record, reload, retry failure, historical view and PWA update pass; production records preserved.

## Official event sources

- https://www.thepushupchallenge.ca/
- https://www.thepushupchallenge.ca/faqs
- https://www.thepushupchallenge.ca/how-it-works

This project is an independent tracker; logging here does not submit reps to the event organizer.
