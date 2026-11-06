import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  checksum,
  collectBackup,
  encodeFields,
  readBackup,
  writeBackup,
} from '../scripts/backup.js';
import {
  emulatorTarget,
  entryDocuments,
  planMigration,
  restoreEmulatorDocuments,
} from '../scripts/migration.js';

const project = 'demo-pushup-recovery';
const root = `projects/${project}/databases/(default)/documents`;
const profilePath = 'artifacts/fixture/public/data/users/person';
const profile = {
  logs: [
    { amount: 10, submitted_date: '2026-02-01', season: 'TRAINING' },
    { amount: 20, timestamp: Date.parse('2026-02-05T17:00:00Z'), season: 'OFFICIAL' },
  ],
  training_reps: 999,
  official_reps: 999,
};
const fixture = () => ({
  formatVersion: 1,
  project,
  database: '(default)',
  readTime: '2026-11-05T12:00:00Z',
  collections: [`${root}/artifacts`],
  documents: [{ name: `${root}/${profilePath}`, fields: encodeFields(profile) }],
});
const mapping = {
  [profilePath]: { ownerUid: 'fixture-owner', timeZone: 'America/Toronto', challengeYear: 2026 },
};
const classifyDate = (date) => ({
  challengeYear: Number(date.slice(0, 4)),
  phase: date < '2026-02-05' ? 'TRAINING' : 'OFFICIAL',
});
const plan = (backup = fixture(), mappings = mapping) =>
  planMigration({
    backup,
    mappings,
    importedAt: 1793880000000,
    classifyDate,
    archiveBeforeYear: 2027,
  });

test('backup traverses pagination and missing ancestors at one readTime', async () => {
  const readTime = '2026-11-05T12:00:00Z';
  const calls = [];
  const request = async (resource, options = {}) => {
    calls.push({ resource, options });
    if (resource === `${root}:listCollectionIds`)
      return options.body.pageToken
        ? { collectionIds: ['other'] }
        : { collectionIds: ['parents'], nextPageToken: 'next' };
    if (resource.startsWith(`${root}/parents?`))
      return { documents: [{ name: `${root}/parents/missing` }] };
    if (resource === `${root}/parents/missing:listCollectionIds`)
      return { collectionIds: ['children'] };
    if (resource.startsWith(`${root}/parents/missing/children?`))
      return {
        documents: [
          {
            name: `${root}/parents/missing/children/real`,
            fields: { amount: { integerValue: '7' } },
          },
        ],
      };
    if (resource.startsWith(`${root}/other?`)) return { documents: [] };
    return {};
  };
  const backup = await collectBackup({ project, readTime, request });
  assert.equal(backup.documents.length, 1);
  assert.equal(backup.collections.length, 3);
  for (const { resource, options } of calls) {
    assert.equal(
      options.body?.readTime || new URL(`https://test/${resource}`).searchParams.get('readTime'),
      readTime
    );
    assert.ok(!options.method || options.method === 'POST');
  }
});

test('restricted backups detect tampering and reject overwrite', async () => {
  const temp = await mkdtemp(path.join(tmpdir(), 'pushup-backup-test-'));
  const folder = path.join(temp, 'snapshot');
  try {
    await writeBackup(folder, fixture());
    assert.equal((await stat(folder)).mode & 0o777, 0o700);
    assert.equal((await stat(path.join(folder, 'firestore.json'))).mode & 0o777, 0o600);
    assert.equal((await readBackup(folder)).manifest.sha256, checksum(fixture()));
    await assert.rejects(writeBackup(folder, fixture()), /EEXIST/);
    const data = JSON.parse(await readFile(path.join(folder, 'firestore.json'), 'utf8'));
    data.documents[0].fields.extra = { integerValue: '1' };
    await writeFile(path.join(folder, 'firestore.json'), JSON.stringify(data));
    await assert.rejects(readBackup(folder), /integrity/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test('explicit archive plan is stable, preserves provenance and reconciles source rather than counters', () => {
  const backup = fixture();
  const before = JSON.stringify(backup);
  const result = plan(backup);
  assert.equal(JSON.stringify(backup), before);
  assert.deepEqual(result, plan(backup));
  assert.equal(result.entries.length, 2);
  assert.match(result.entries[0].data.id, /^legacy_[a-f0-9]{64}$/);
  assert.equal(result.entries[0].data.createdAt, null);
  assert.equal(result.entries[0].data.updatedAt, result.importedAt);
  assert.equal(result.entries[0].data.provenance.originalSeason, 'TRAINING');
  assert.equal(result.provenance[0].originalSeason, 'TRAINING');
  assert.equal(result.provenance[0].sourceCreatedAt, null);
  assert.equal(result.reconciliation[0].acceptedAmount, 30);
  assert.equal(result.reconciliation[0].legacyCounters.official, 999);
  assert.deepEqual(result.reconciliation[0].totals, { TRAINING: 10, OFFICIAL: 20, OFF_SEASON: 0 });
  assert.equal(result.quarantine.length, 0);
});

test('missing ownership stays unmapped and malformed/contradictory logs stay quarantined', () => {
  assert.throws(() => plan(fixture(), {}), /explicit mapping/);
  const other = fixture();
  other.documents.push({
    ...other.documents[0],
    name: `${root}/artifacts/fixture/public/data/users/unmapped`,
  });
  assert.equal(plan(other).unmappedProfiles.length, 1);
  for (const challengeYear of [999, 10000])
    assert.throws(
      () => plan(fixture(), { [profilePath]: { ...mapping[profilePath], challengeYear } }),
      /archived year/
    );
  assert.throws(
    () => plan(fixture(), { [profilePath]: { ...mapping[profilePath], timeZone: 'invalid' } }),
    /timezone/
  );
  assert.throws(
    () => planMigration({ backup: fixture(), mappings: mapping, importedAt: 1, classifyDate }),
    /archiveBeforeYear/
  );
  assert.throws(
    () => plan(fixture(), { [profilePath]: { ...mapping[profilePath], ownerUid: '' } }),
    /Reviewed owner/
  );
  assert.throws(
    () => plan(fixture(), { [profilePath]: { ...mapping[profilePath], challengeYear: 2027 } }),
    /archived year/
  );
  const backup = fixture();
  backup.documents[0].fields = encodeFields({
    logs: [
      { amount: 10, submitted_date: '2026-02-01', timestamp: Date.parse('2026-02-02T17:00:00Z') },
      { amount: -1 },
    ],
  });
  const result = plan(backup);
  assert.equal(result.entries.length, 0);
  assert.deepEqual(
    result.quarantine.map((entry) => entry.reason),
    ['conflicting-dates', 'amount']
  );
});

test('restore rejects production endpoints and protects existing conflicting records', async () => {
  for (const [origin, target] of [
    ['https://firestore.googleapis.com', project],
    ['http://127.0.0.1:8080', 'real-project'],
    ['http://localhost.evil.test:8080', project],
  ])
    assert.throws(() => emulatorTarget(origin, target), /emulator/);
  const documents = entryDocuments(plan());
  let writes = 0;
  await assert.rejects(
    restoreEmulatorDocuments({
      origin: 'http://127.0.0.1:8080',
      project,
      documents,
      request: async (_url, options) => {
        if (options.method === 'PATCH') {
          writes += 1;
          return { ok: false, status: 409 };
        }
        return { ok: true, json: async () => ({ fields: { conflict: { stringValue: 'keep' } } }) };
      },
    }),
    /mismatch/
  );
  assert.equal(writes, 1);
});

test('archive threshold advances explicitly for later annual editions', () => {
  const backup = fixture();
  backup.documents[0].fields = encodeFields({
    logs: [{ amount: 15, submitted_date: '2027-02-03', season: 'OFFICIAL' }],
  });
  const result = planMigration({
    backup,
    mappings: { [profilePath]: { ...mapping[profilePath], challengeYear: 2027 } },
    importedAt: 1825416000000,
    archiveBeforeYear: 2028,
    classifyDate: () => ({ challengeYear: 2027, phase: 'OFFICIAL' }),
  });
  assert.equal(result.entries.length, 1);
  assert.equal(result.archiveBeforeYear, 2028);
  assert.equal(result.entries[0].data.challengeYear, 2027);
});
