# #3 — Multi-year data integrity and identity safety

**Issue:** https://github.com/BenWassa/the-pushup-challenge-2025/issues/3  
**Status:** v2 implementation and emulator tests complete; production permissions, legacy mapping/import and recovery acceptance outstanding  
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

`npm run lint`, `npm test` (9 tests including 7 activity contract tests), and `npm run build` pass locally. Tests cover Toronto local-midnight conversion, literal historical dates, leap-day validity, unknown/contradictory fields, selected-owner/year isolation, out-of-window official entries, duplicate IDs and conflicting duplicates. The build still warns about an existing large bundle and stale Browserslist data.

Remaining acceptance gates: authenticated edition/rules audit, actual anonymized inventory, emulator authorization tests, reviewed mapping and timezone decisions, verified backup restoration, approved migration and safe runtime add/undo integration. Issue #3 stays open.

Review hardening: canonical totals reject missing/invalid timezone and creation instant, mismatched date/year in every phase, and official windows from another year. Supported challenge years are 1000–9999; imported unknown creation instants require source provenance. Classifier exceptions quarantine the record rather than aborting the dry run. Identity/source IDs must be nonempty strings.

## End-to-end persistence implementation (2026-11-05)

The v2 adapter and `useActivityData` now implement actual application persistence, not only read-only helpers. Runtime integration is in the mobile workstream. The adapter uses `participants/{authUID}/challenges/{year}/entries/{stableID}` with canonical fields plus `revision`, `deleted`, `updatedAt`, and `lastOperationId`. No username selects an owner. Add operations create one stable ID, edits require the revision originally displayed, and removal is an idempotent tombstone. Transactions never overwrite an unrelated entry or profile-wide array. Stale cross-device edits return a conflict rather than silently overwrite newer data.

The hook exposes confirmed records, loading/error state, idle/saving/saved/error feedback, retryable pending operation, add/edit/remove/retry, and a current-year write gate. A cloud pending-operation journal is written before submission, scoped to Firebase project, UID and year. Reload restores the same operation ID; explicit retry is idempotent. Journal storage includes the activity operation, never credentials or email addresses. Demo uses only module memory and resets on reload. Demo samples are fictional and old unconfigured editions are classified off-season rather than inventing historical official windows.

Server listeners ignore pending local snapshots and cache-only snapshots; successful transaction acknowledgement or a server-confirmed matching operation establishes success. A confirmed deletion retains its tombstone. There is no background offline write queue: offline submission stays failed/pending and requires retry. An unresolved operation blocks new submissions until retried or explicitly discarded. Account/year changes clear displayed records immediately; old asynchronous completions cannot replace a newly selected account's state. Archived years and reserved `legacy_` imported entries are read-only.

### Isolated emulator and production gates

`VITE_USE_FIREBASE_EMULATORS=true` connects only on localhost/127.0.0.1/::1, using project `demo-pushup-2027`, Auth 9099 and Firestore 8080. It never reuses the production Firebase app. Emulator accounts are created by isolated tests, not a public signup interface. Outside the emulator, v2 reads and writes require `VITE_ENABLE_V2_CLOUD=true`, which defaults off. Changing this flag does not by itself establish safe production rules or migrated ownership. The existing deployed publication remains untouched.

The lead's explicit-project, read-only production audit identified the existing `(default)` database as STANDARD / FIRESTORE_NATIVE and found that live ownership controls failed audit. Production rule cutover is required before release; the private deployed rule source is retained only in the ignored backup. The read-only aggregate inventory contains dated legacy records without UID ownership fields. Raw personal data is not in this document or tests. An ignored local backup was taken by the lead; restoration/reconciliation and explicit owner-to-profile mapping remain release gates.

`firestore.rules` is a **candidate for review and emulator verification only**. It default-denies other paths including legacy records, permits owner-scoped entry reads, validates every create/update, preserves immutable identity/date/phase/timezone, and enforces bounded values, revision increments, no hard deletes, and no resurrection. Writes are limited to the current local-calendar-year envelope: UTC+14 through UTC-12, allowing at most the global year-boundary overlap. Imported `legacy_` IDs can only be seeded by authorized administrative migration and cannot be client-created or edited. This policy deliberately requires a reviewed legacy access/cutover decision before production deployment.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for UID-owned records, strict entry schemas, revision-based corrections and private reads. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

### Security review and attack checks

The candidate's emulator tests attempt anonymous and second-account get/list/create/update/delete, owner collection discovery, legacy access, ownership/year changes, malformed calendar dates, missing fields, extra role/schema fields, invalid numeric types and bounds, oversized strings, future timestamps, revision replay, hard deletion, tombstone resurrection, archived-year updates and reserved imported-ID writes. These are rejected. Owner-scoped list and valid transactions pass; concurrent stale edits cannot lose another set.

Remaining limitations: IANA timezone names and organizer phase/date relationships are validated by the application, while rules enforce bounded timezone strings and enumerated phases. A malicious owner could falsify their own activity classification through a direct client, but cannot access another UID's records under this candidate. Future shared-group support needs a separate authorization design. Production rules remain unchanged until an approved deployment addresses the failed ownership audit.

Security-rules-auditor assessment (candidate only):

```json
{
  "score": 4,
  "summary": "Emulator-tested private owner scope and strict revision/schema controls; production ownership controls require an approved cutover.",
  "findings": [
    {
      "check": "Business Logic vs. Rules",
      "severity": "minor",
      "issue": "Rules bound timezone strings and enumerate phases but do not independently verify IANA names or organizer phase windows; an owner can falsify their own metadata.",
      "recommendation": "Before adding groups or relying on competitive totals, use authoritative server configuration/validation; retain current client phase validation and annual aggregation checks."
    }
  ]
}
```

### Validation and remaining acceptance

Local lint, 30 unit/regression tests and production build pass. Three emulator suites cover authorization/schema attacks, duplicate adds, concurrent stale edits, safe tombstone retry, and immutable archives. The rules compile in the Standard Firestore emulator. The existing bundle-size warning remains. Integrated browser login/reload/cross-device/offline journeys are owned by release assurance and must pass after the mobile adapter is connected.

No production rules, records, Pages configuration or publication was changed. #3 remains open until real ownership mapping, backup restoration/reconciliation, approved rule cutover and verified production persistence are complete.

Review hardening: seeded demo creation instants use their original activity dates so undo targets the newest actual set. Year options derive from configured editions/current year. A 15-second confirmation timeout retains the same pending operation and permits idempotent retry; the original transaction is not cancelled and only server acknowledgement can establish success.

The retry journal preserves multiple outstanding operation IDs and clears only the confirmed operation, avoiding accidental removal of another tab's pending change. Each operation uses a separate atomic browser-storage key, so concurrent tabs cannot overwrite each other's journal slots. The durable cloud transaction ID and server reconciliation remain authoritative.

## Google sign-in and closed-beta allowlist (candidate, not deployed)

- Sign-in is Google only. It uses a popup first; browsers block full-page redirect sign-in when the app (github.io) and Firebase's handler (firebaseapp.com) are on different domains, so redirect is only the fallback when a popup is blocked. Anyone can sign in with Google; only approved people get access.
- Approval is a document at `allowlist/{lowercase email}` in Firestore. Clients cannot write or list it; a signed-in person can read only their own entry (the app uses that to show the "not on the list yet" screen). `participants/**` reads and writes require a verified email with an allowlist entry.
- To approve someone: add a document with ID equal to their lowercase Google email (any field, e.g. `approved: true`) in the Firebase console. To revoke: delete it.
- **Deployed 2026-11-06 with owner approval** to project `pushup2025-df07b`. Before this, the live rules were fully open (`allow read, write: if true`). The deployed rules keep `artifacts/**` and `users/**` (the original site's legacy data) exactly as open as before so the old site keeps working; everything else is denied except the allowlist and approved `participants/**` paths. Owner emails `haddonbenjamin@gmail.com` and `haddonbenjamin@googlemail.com` were added to `allowlist` first.
- **Rollback:** redeploy the previous rules: `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }`.
- Still open risk: the legacy trees remain world-readable and writable. Tightening them needs a migration plan and owner approval.
- Enabling the Google provider and the GitHub Pages domain under Authorized domains is a console step for the owner.
- Existing email/password users keep their UID only if Firebase's "one account per email" setting is on and the Google address matches; verify before relying on history.

### Production Auth changes (2026-11-06, owner-approved)

- Google provider was already enabled; `benwassa.github.io` added to authorized domains.
- All 76 anonymous Auth accounts deleted; only `haddonbenjamin@gmail.com` kept. Firestore data was not touched (history is stored by profile name, not account ID). Pre-delete export kept locally in the gitignored `backups.local/`.
