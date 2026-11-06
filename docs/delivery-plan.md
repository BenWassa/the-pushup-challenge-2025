# PushUp 2027 delivery and release status

Updated November 5, 2026. Tracker: [issues #2–#6](https://github.com/BenWassa/the-pushup-challenge-2025/issues). Scope: full delivery through an owner-approved, verified production launch.

## Integrated baseline

After PRs #7–#22, current `main` (merge commit `7cd22e6`) includes:
- Configurable annual calendar, explicit training/official/off-season phases, derived date-correct yearly progress and unknown daily-target safeguards.
- UID/year-scoped v2 activity repository, idempotent add/edit/remove, revision conflict handling, pending retry journal and source-preserving metadata warnings.
- Mobile-first solo logging, history/calendar, past-year read-only views, account settings, demo isolation, safe saved/error feedback and corrected PWA asset paths.
- Candidate owner-scoped Firestore rules and private backup/migration planning + emulator restore tooling; **not deployed**, with legacy history still pending actual approved import.
- Browser acceptance on 320/390/430px, automated accessibility checks, Firebase emulator authorization/concurrency/migration tests and GitHub PR/push CI.
- Reviewed annual app/PWA version 1.13.0 and manual-only release configuration guards.

The integrated `main` [Actions run 42145594256](https://github.com/BenWassa/the-pushup-challenge-2025/actions/runs/42145594256) passed source build and Firebase emulator/browser jobs; deploy was deliberately skipped. This is not proof of real production user access or phone installability.

## Outcomes

| Milestone | Status | Evidence or remaining exit condition |
| --- | --- | --- |
| Foundation, safe `dist/` builds and issue/PR structure | Source complete; Pages cutover pending | #2, #7–#8 |
| UID-owned annual activity and correct phase reporting | Implemented, emulator-tested; production cutover pending | #3, #11, #17–#19 |
| 2027 calendar and year-specific progress | Implemented; unconfirmed daily schedule remains pending | #4, #9, #13–#14 |
| Mobile solo logging/history/account and warning UX | Implemented and browser-tested; physical phone pending | #5, #10, #16, #20–#21 |
| Automated release, security, backups and rollback preparation | Implemented in source; independent production proof pending | #6, #12, #15, #18, #20, #22 |
| Live 2027 publication, historical import and verified recovery | **Blocked by owner-controlled approval and checks** | [Production cutover](production-cutover.md) |

## Remaining release sequence

1. **Privately identify and verify** the actual Firebase project/database, deployed rules, existing account UID-to-legacy-profile mapping, record inventory, year/timezone interpretations, and any unresolved/duplicate/quarantined logs.
2. **Rehearse recoverability** against an isolated snapshot: checksum, exact collection scope, reconciled dry-run import, restored records and secure rollback evidence. No raw user data or identifiers in issues/PRs.
3. **Review the coordinated release candidate** against expected public Firebase web settings, candidate rules, real-device installation/update, accessibility, login, confirmed save, undo, reload and cross-device sync. Automated browser checks are not physical-device proof.
4. **Seek separate explicit owner approval** for changing live Firestore rules, any historical import, GitHub Pages source switch, and publication. Do not treat this plan as consent.
5. **Perform an approved coordinated cutover** with bounded interruption, no automatic rollback to legacy permissive rules, retained last-known-good artifact, and actual served version/persistence checks.
6. Only after successful production verification close the corresponding issues and move their working records from `docs/open/` to `docs/closed/`. Retire tracked old static `docs/` output via a separate safe PR.

## Invariants

No production database writes, rule changes, destructive migration, Pages source switch, repository rename or public release without explicit authorization. Preserve existing records and the currently deployed app until coordinated replacement. CI can show code quality; only actual rule, backup and device verification can establish release readiness.
