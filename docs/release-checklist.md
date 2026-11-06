# Controlled release and recovery

Issue [#6](https://github.com/BenWassa/the-pushup-challenge-2025/issues/6), November 5, 2026. This is a procedure, not completed launch verification.

## Before approving production publication

- Production dependencies must pass `npm audit --omit=dev --audit-level=high` in the reviewed commit's CI. `npm ci` currently reports moderate advisories in the full dependency tree; assess affected packages and runtime reachability before release, and do not apply unreviewed breaking upgrades or assume the count reflects only production packages.

- Record the candidate commit, passing lint/tests/build run, previous deployed commit, artifact and version. Retain a downloadable rollback artifact outside expiring CI storage.
- Verify `npm run build:pages` preserves `docs/`; the automated regression executes the real command in an expendable fixture.
- Verify the candidate artifact uses the intended public Firebase client configuration and APP_ID. The Actions workflow passes reviewed Firebase repository variables when configured; repository-level secret/variable listings were empty during the earlier audit. Environment-level or organization configuration was not verified. A successful build alone does not demonstrate working cloud sign-in. Never put service-account keys, passwords or private keys in Vite variables.
- Complete #3 ownership/rules verification and backup/restore rehearsal before approving cloud schema/write changes. Do not infer authorization from hidden UI controls or Firebase client configuration.
- Preview the exact artifact with the correct repository base. Verify direct navigation, manifest scope/start URL, icons, and every referenced hashed asset returns the expected content type and HTTP 200.
- In an isolated test account/emulator, verify login, log, explicit confirmed save, reload, undo, history and failure/retry. Confirm 2027 official totals exclude training, off-season and old years. Do not use a production record for destructive smoke tests.
- On real iOS Safari and Android Chrome at 320/390/430px, verify pinch zoom, 200% text, keyboard focus, tap targets, safe areas, install/launch, offline navigation and update/reload. Desktop unit tests do not establish these results.
- Increment the application version for a release that changes assets. The worker cache version comes from package version; multiple deployments using one version can reuse cached assets/metadata. Test old installed clients through the update path. Explicit waiting-worker activation and first-install offline reopening are browser-tested; installed clients still need physical-device review.

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
- This batch adds worker behavior tests for cache ownership, scope, offline query navigation, successful cache reuse, HTTP error handling and cache open/read/write failures preserving online responses. It does not simulate full browser lifecycle, installation, cache quota or Firebase persistence.
- No production Firebase records, rules or settings were changed. Live rules, owner identity, actual historical record inventory, verified backup restoration, real-device logging and production cutover remain outstanding.

## Recovery tooling and approval packet

The new tools are intentionally incapable of production restore/import. They provide read-only logical backup, pure migration planning, and localhost/demo-project rehearsal. They do not replace a managed backup, Auth export, rules/index export, or verified owner-controlled recovery copy.

### Read-only database snapshot

After the operator identifies the exact STANDARD database/project, run:

```sh
node scripts/backup-cli.js --project=EXPLICIT_PROJECT --database='(default)' --output=backups.local/approved-snapshot
```

The command uses the already authenticated local Firebase CLI account without printing credentials. It recursively enumerates collection IDs and documents, including subcollections under missing ancestors, at a single recorded `readTime`. Pagination is covered by tests. Output is a new restricted directory (0700), document values and a checksum manifest (0600). Existing destinations are rejected. Keep the output under gitignored `backups.local/`, never in a PR or issue. A traversal error aborts before writing a purported complete backup. Verify checksum/scope/readTime before decoding. The traversal covers that database's documents, not every database in the project or Firebase Auth/Storage/rules/indexes.

The API's fixed historical read limit means long-running exports may fail once the read time becomes too old. For a larger dataset, use an approved managed export/PITR procedure rather than removing consistency selectors. [Document listing](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/list) and [collection discovery](https://firebase.google.com/docs/firestore/reference/rest/v1/projects.databases.documents/listCollectionIds) support this explicit snapshot boundary.

### Mapping, dry run and reconciliation

The owner must approve an explicit JSON mapping keyed by full legacy relative profile path. Do not derive ownership from a similar email, display name or username:

```json
{
  "artifacts/APP_ID/public/data/users/EXACT_PROFILE": {
    "ownerUid": "APPROVED_AUTH_UID",
    "timeZone": "America/Toronto",
    "challengeYear": 2026
  }
}
```

Keep real mapping files in the same restricted ignored directory. Each profile's timezone/year is a reviewed interpretation, not a fact proved by old timestamps. Multiple profiles for one owner/year require manual reconciliation. Then run a pure dry run:

```sh
node scripts/migration-cli.js --backup=backups.local/approved-snapshot --mapping=backups.local/mapping.json --classifier=scripts/migration-legacy-classifier.js --imported-at=EXPLICIT_EPOCH_MILLISECONDS --archive-before-year=2027 --output=backups.local/dry-run
```

The explicit `archive-before-year` threshold limits this import to older editions and must advance deliberately for future annual releases. Mapping years must be 1000–9999, below that threshold, with a valid timezone; empty mappings are rejected. The classifier deliberately makes no verified official-phase claim for unconfigured historical editions. Old `season` remains `provenance.originalSeason`; unknown original creation instants remain null; `updatedAt` records the explicit import operation instant. Stable `legacy_` IDs are derived from the immutable snapshot/profile/index, never a live array position. Pin and retain that exact frozen snapshot for the one-time approved import and every retry. A later backup has a different snapshot hash and generates different IDs, even for apparently identical source logs. Never import a second snapshot of the same profile/year without a separate cross-snapshot reconciliation and approval, or it could duplicate history. Candidate security rules reserve these IDs from client writes. Legacy counters are reported beside recomputed log sums, not trusted as annual totals.

Inspect every mapped profile's source count/amount, accepted count/amount, per-day and per-phase sums, source counters and differences. Resolve every quarantined record and unmapped profile, including an explicit decision to preserve an unowned profile outside the participant import. The source snapshot and original log objects remain intact. The dry-run report is private and must be retained with the checksum and approved mapping.

### Isolated restore and import rehearsal

Start the repo's emulator test runner. The automated `tests/emulator/migration.test.js` uses fictional data, verifies raw snapshot restoration, archive import, idempotent re-import and refusal to overwrite conflicting records. For a separately approved private snapshot rehearsal into an isolated local emulator:

```sh
node scripts/migration-emulator.js --emulator=http://127.0.0.1:8080 --project=demo-pushup-recovery --backup=backups.local/approved-snapshot
node scripts/migration-emulator.js --emulator=http://127.0.0.1:8080 --project=demo-pushup-recovery --plan=backups.local/dry-run/migration.json
```

Writes are rejected unless the endpoint is localhost HTTP and project ID begins `demo-`. Restore uses create-only preconditions and exact typed-value readback; existing differing records are retained and abort reconciliation. No delete or overwrite route is provided. An unresolved quarantine/unmapped profile blocks the CLI import. This rehearsal does not authorize production import or prove Firebase Auth restoration.

### Limited production approval still required

Before any release ask for one concrete approval packet containing: candidate commit/artifact and checks, complete database scope inventory and verified private backup/restore evidence, approved UID mapping and timezone decisions, discrepancy resolutions, tested candidate rules, and rollback artifact. The read-only inventory found deployed ownership controls that require remediation and username-selected records without UID ownership. Candidate owner-scoped rules deny legacy access: applying them while the old deployed UI remains live would break that UI. Coordinate the new runtime, legacy read policy and rule cutover as one reviewed release window; neither rules deployment nor source/publication is authorized by an implementation merge.

A rules rollback to the current allow-all policy reopens the known exposure and must not be the automatic incident response. Prefer retaining deny-by-default access and repairing/redeploying the new runtime under an approved incident plan. Preserve both legacy and newly confirmed canonical entries through rollback. No production write/import command ships in this batch; a separately reviewed, explicitly approved operator procedure is required.

### Private backup evidence already obtained

A read-only logical snapshot of the audited database contains three documents and 99 historical logs dated 2026. Exact typed-field restoration and readback of all three documents succeeded in an isolated local demo emulator. The checksummed snapshot, deployed-rule snapshot and ownership worksheet remain in restricted, ignored `backups.local/` storage in the primary workspace; no personal identifiers or raw records are in source control. This establishes database-document restoration for that snapshot, not Firebase Auth/Storage recovery, account ownership, timezone approval or snapshot freshness at cutover. Owner confirmation of the mapping and a reviewed fresh release snapshot remain required.
