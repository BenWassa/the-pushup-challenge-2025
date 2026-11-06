# #3 — Multi-year data integrity and identity safety

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/3  
**Status:** Planned — design/data audit before any implementation  
**Depends on:** #2 foundation; coordinate schema with #4

## Research tasks

- Read full Firestore access rules and deployment environment; clarify relationship between email auth UID and username document path.
- Inventory real data types without writing/mutating records. Note demos, legacy years, historical submitted_date entries, duplicate timestamps and missing season fields.
- Define canonical `challengeYear`, `phase`, `localDate`, amount, stable log ID, creation timestamp and user ownership model.
- Decide year-scoped documents vs append-only entries; provide comparability, atomicity and quota trade-offs.
- Define read-only migration/reconciliation of 2025/2026 records and a backup/export with rollback.
- Specify add/undo/edit consistency and cloud error/queued sync UX.

## Acceptance

1. Written proposal and anonymized data fixtures reviewed before any live write.
2. Backups and restoration path verified.
3. No cross-user read/write possible under Firestore rules.
4. Challenge total excludes non-official and prior-year activity.
5. Undo/edit cannot silently lose records under concurrent updates.

## Boundaries

Do not create public signup, destructive migration, or new multi-user UX.

## Source audit and first implementation batch (2026-11-05)

Status: additive read-only helpers implemented; production acceptance remains open. This batch does not modify hooks, enable a new persistence path, deploy rules, or migrate records.

Observed from source:

- `useAuth` signs in with email/password. `useUserData.loadCloudProfile(name)` selects a lowercased username document without passing the authenticated UID. Authentication alone does not establish profile ownership. Effective authorization depends on deployed rules, which are absent from this repository.
- The legacy profile is `artifacts/{appId}/public/data/users/{username}`. Each profile embeds logs plus lifetime `training_reps` and `official_reps`. These cached totals cannot establish annual results.
- Logs may contain numeric/Date/Firestore timestamps or historical `submitted_date`. They have no guaranteed IDs, owner UID, timezone or challenge year. Historical writes use UTC dates and current season rather than the historical day's season.
- Add uses `arrayUnion` plus `increment`; identical millisecond/amount/season entries can collapse in the array while incrementing totals twice. Undo/delete replace the entire array from a snapshot and can lose concurrent additions. Add/undo failures are only logged.
- `useLeaderboard` subscribes to the entire legacy users collection. Do not enable a private solo collection with this subscription unchanged.
- No Firebase rules, indexes, `.firebaserc`, or deployment configuration were found. `npx -y firebase-tools@latest firestore:databases:list` failed because no project was selected (`projects/null`, HTTP 403). Database edition, deployed rules, actual records, account-to-profile ownership, backup availability and restoration have **not** been verified. No production records were queried.

The Firebase Firestore skill was consulted. Instance edition must be identified before implementing a database-specific schema or rules. The following is an application record proposal, not an approved Firestore deployment.

## Shared application contract

Canonical records: `{schemaVersion: 2, id, ownerUid, challengeYear, phase, localDate, timeZone, amount, createdAt}`. Phases are exactly `TRAINING`, `OFFICIAL`, `OFF_SEASON`; local dates are valid `YYYY-MM-DD` calendar dates; amounts are positive safe integers. `createdAt` is epoch milliseconds, nullable only for imported historical entries whose creation instant is unknown. `timeZone` is an explicit IANA zone, aligned with the season engine. Owner UID must come from a reviewed account mapping, never a username guessed by the client.

`src/utils/activity.js` provides a pure dry-run adapter and selected-owner/year aggregation. Legacy adapter requires an explicit immutable source snapshot identifier, array index, owner UID, timezone and date classifier. It preserves original season under provenance, rejects conflicting dates and invalid values, and never mutates input. Snapshot-based IDs are stable for that frozen export only; they must never identify positions in a live logs array. Missing identity or dates stay in a quarantine report rather than receiving fabricated values. Legacy timezone assignment remains a reviewed migration decision: source timestamps do not prove the participant's original timezone.

`summarizeActivities` derives totals from canonical logs, excludes other owners/years, rejects official entries outside the supplied official window, deduplicates identical IDs and quarantines contradictory IDs. Existing cached profile totals are not inputs. Helpers are deliberately unconnected to current runtime until ownership, migration and persistence gates pass.

## Proposed persistence and consistency direction (review required)

Prefer one immutable entry per stable ID in a UID-owned, year-scoped collection over another profile-wide array. A candidate path is `participants/{uid}/challenges/{year}/entries/{entryId}`; final selection depends on edition, effective rules and backup review. Individual entries avoid whole-array write races and document growth limits, at the cost of additional reads. Aggregate totals are derived; any cached totals require transactionally maintained reconciliation. Keep legacy documents intact and read-only during transition.

Generate an operation ID once per set and reuse it on retry. A create must be idempotent for that ID; retries must not increment twice. Undo/correction should target an ID with a transaction or immutable reversal linked to that ID, never overwrite a log array. Rules must enforce authenticated owner UID, immutable ownership/year, field types, positive bounded amounts and permitted operations. Deny collection-wide discovery; test owner/other-user/anonymous access in the emulator. Client checks are not security enforcement.

For the initial UI, online-only writes with explicit saving/saved/failed feedback are the conservative option. Do not report saved from a local snapshot pending server acknowledgement; failures retain a retryable operation ID. Offline queue semantics require a separate decision and cross-device conflict tests.

## Backup, dry-run and rollback gates

1. Identify the exact production project, database ID/edition, app ID and deployed rules; inventory auth UID to legacy profile mappings without publishing personal data. Record authorized operators and pause migration if mapping is ambiguous.
2. With approved access, export a consistent database backup and rules/config separately to an owner-controlled restricted location. Record export time, source project/database, entry counts and checksums. Do not commit real exports or personal fixtures.
3. Restore the backup into an isolated non-production project and verify profile/log counts, timestamps, historical dates and original totals. A backup is not considered verified until this rehearsal passes.
4. Freeze an immutable legacy export for dry run. Produce canonical candidate records plus quarantine/reconciliation reports; compare annual/phase/day sums against source logs and explain discrepancies with cached totals. The tests here use fictional fixtures only, not a real inventory.
5. Review ownership mapping, timezone assignments, proposed rules, reconciliation and rollback with the owner. Obtain explicit authorization before production writes or rules changes.
6. Import into a separate namespace with idempotent IDs, preserving all legacy data. Verify read-only results before switching runtime reads; do not dual-write without an explicit consistency design.
7. Roll back by disabling new writes and reverting the runtime to the preserved legacy namespace. Retain/export any newly created canonical records before rollback so confirmed new activity is not lost. Do not delete either namespace. Restore a production backup only under a separately approved incident plan.

## Validation for this batch

`npm run lint`, `npm test` (7 tests including 5 activity contract tests), and `npm run build` pass locally. Tests cover Toronto local-midnight conversion, literal historical dates, leap-day validity, unknown/contradictory fields, selected-owner/year isolation, out-of-window official entries, duplicate IDs and conflicting duplicates. The build still warns about an existing large bundle and stale Browserslist data.

Remaining acceptance gates: authenticated edition/rules audit, actual anonymized inventory, emulator authorization tests, reviewed mapping and timezone decisions, verified backup restoration, approved migration and safe runtime add/undo integration. Issue #3 stays open.
