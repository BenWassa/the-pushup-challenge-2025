# PushUp 2027 — controlled production cutover

**Status:** Preparation only. Not authority to change live Firebase rules, import records, or publish a new app. Linked to [release issue #6](https://github.com/BenWassa/the-pushup-challenge-2025/issues/6).

## Why one coordinated release is necessary

The explicit-project read-only audit reported deployed legacy Firestore rules equivalent to `read, write: if true`. Those controls are unsuitable for a personal, authenticated tracker. Legacy UI selects username documents; candidate `firestore.rules` intentionally deny that legacy path and instead authorize only `participants/{authUID}/challenges/{year}/entries/{id}`.

Publishing the new client alone under old rules would not repair access exposure. Publishing the new rules alone would interrupt the old client. The owner must approve a coordinated cutover with a brief, documented write interruption. **Do not automatically roll back to the permissive policy.**

## Pre-release evidence to verify privately

- **Correct environment:** independently verify exact project ID, database, Firebase Auth account identity and the *deployed* rules, not just repository files.
- **Recoverability:** retain a restricted, independently verifiable backup (checksum, frozen read time and full collection inventory). Rehearse restoration in an isolated demo emulator and preserve a documented recovery path for Firebase Auth/configuration separately.
- **History:** review explicit legacy profile-to-Auth-UID/year/timezone mappings, all quarantined records, unmatched profiles, counter discrepancies and stable immutable snapshot IDs. No guessing based on email or username. Obtain separate approval for import.
- **Acceptance:** green source lint, unit tests, Firestore rules emulator, and Playwright browser jobs. Manually test sign-in, save confirmation, reload, retry, two-device synchronization, correction, archival history, installed PWA update and responsive accessibility.
- **Rollback:** retain prior served site and artifact fingerprint, new candidate artifact, database backup manifest, version and an incident owner. A UI-only rollback will not restore incompatible data; do not reopen public legacy access.
- **Manual permissions:** authorize separately the rule deployment, any production record migration, GitHub Pages source switch and publication.

Never place raw backups, approval UID mappings, service-account keys, user passwords or tokens in GitHub issues, repository variables or build logs.

## Firebase web client configuration

For an explicitly approved publication, configure **repository/environment Actions variables** with the reviewed public web client identifiers:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_APP_ID`
- Optional: `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`

These are public Firebase *web-app* settings, **not** service-account credentials. They do not establish private access by themselves; deployed Firestore rules do.

The Pages workflow now rejects a manual publish if any four required fields are absent or the project ID has the `demo-` prefix. A successful config check does **not** verify that the project ID is the intended real project; the owner must compare it to the audited database. Normal PR/push builds leave `VITE_ENABLE_V2_CLOUD=false`; the manually dispatched approved release sets it to `true` only for that build.

## Cutover checklist

1. Freeze and review a release commit with green tests. Record version, hashed assets, Pages source, published baseline and safe rollback artifact.
2. Privately approve database/ownership mapping, complete snapshot inventory and restored sample. Confirm the desired migration plan, retention policy and an interruption window.
3. Verify candidate owner-scoped rules in emulator and approve the exact rule change. No public legacy fallback.
4. Prepare GitHub Pages **Settings → Pages → Source: GitHub Actions** and verify required Firebase web variables. Keep generated legacy `docs/` assets intact.
5. In the approved window, deploy reviewed owner-scoped Firestore rules, then switch Pages source and manually dispatch `Validate and deploy PushUp Pages` on `main` with `deploy=true`. The release workflow runs isolated emulator/browser acceptance and only deploys if both build and integration jobs pass.
6. Verify the *served* asset/version and actual isolated test account: login, add, confirmed save, edit/undo, reload, cross-device read, deny cross-account reads, offline/error behavior and app update. Test on real Android and iOS if available.
7. Stop/rollback through the documented secure plan if verification fails. Keep rules deny-by-default; never restore `allow all` as an automatic rollback.
8. Import archived records only as a separately approved, immutable-snapshot operation, reconcile them, and verify no lost/duplicated totals. Clean obsolete generated `docs/` static assets only after new deployment verification.

## Current unresolved owner actions

No user approval for production rules, legacy data import or site publication has been given in this workflow. Production Firebase rules/project identity, restricted backup retention and UID mapping require an owner-controlled verification. Physical-device acceptance and live fingerprint comparison remain external gates.

Use this document and [release checklist](release-checklist.md) as the approval packet; update their evidence links only after checks actually pass.

### Service-worker update safety

The active application defers an update while an activity operation remains pending. New workers cache the new shell but do **not** call `skipWaiting()` in their install event; only an explicit `SKIP_WAITING` message from the UI activates a waiting worker. First-time installations activate normally without an existing controller. This prevents an automatic mid-save client replacement and is covered by `tests/service-worker.test.js`. Verify the installed old-to-new update path on a real device before production release.
