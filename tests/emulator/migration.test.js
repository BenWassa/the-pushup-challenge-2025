/* global process */
import assert from 'node:assert/strict';
import test from 'node:test';
import { encodeFields } from '../../scripts/backup.js';
import {
  entryDocuments,
  planMigration,
  restoreEmulatorDocuments,
} from '../../scripts/migration.js';

if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error('Run through the Firestore emulator test runner');
const origin = `http://${process.env.FIRESTORE_EMULATOR_HOST}`;
const project = 'demo-pushup-recovery';
const root = `projects/${project}/databases/(default)/documents`;
const profilePath = 'artifacts/fixture/public/data/users/person';
const snapshot = {
  formatVersion: 1,
  project,
  database: '(default)',
  readTime: '2026-11-05T12:00:00Z',
  collections: [`${root}/artifacts`],
  documents: [
    {
      name: `${root}/${profilePath}`,
      fields: encodeFields({
        logs: [
          { amount: 10, submitted_date: '2026-02-01', season: 'TRAINING' },
          { amount: 20, submitted_date: '2026-02-05', season: 'OFFICIAL' },
        ],
        training_reps: 10,
        official_reps: 20,
      }),
    },
  ],
};

test('restores a frozen logical backup then imports/reconciles archive entries idempotently', async () => {
  const documents = snapshot.documents.map((document) => ({
    path: document.name.slice(`${root}/`.length),
    fields: document.fields,
  }));
  const restored = await restoreEmulatorDocuments({ origin, project, documents });
  assert.equal(restored.verified, 1);
  const plan = planMigration({
    backup: snapshot,
    mappings: {
      [profilePath]: {
        ownerUid: 'fixture-owner',
        timeZone: 'America/Toronto',
        challengeYear: 2026,
      },
    },
    importedAt: 1793880000000,
    // The old organizer schedule is unverified; source season survives as provenance.
    classifyDate: (date) => ({ challengeYear: Number(date.slice(0, 4)), phase: 'OFF_SEASON' }),
  });
  assert.equal(plan.reconciliation[0].acceptedAmount, 30);
  assert.equal(plan.quarantine.length, 0);
  assert.deepEqual(
    plan.provenance.map((record) => record.originalSeason),
    ['TRAINING', 'OFFICIAL']
  );
  const imported = await restoreEmulatorDocuments({
    origin,
    project,
    documents: entryDocuments(plan),
  });
  assert.equal(imported.verified, 2);
  assert.deepEqual(
    await restoreEmulatorDocuments({ origin, project, documents: entryDocuments(plan) }),
    { created: 0, unchanged: 2, verified: 2 }
  );
  // A changed input with the same stable IDs cannot overwrite the verified archive.
  const conflicting = entryDocuments(plan);
  conflicting[0].fields.amount = { integerValue: '999' };
  await assert.rejects(
    restoreEmulatorDocuments({ origin, project, documents: conflicting }),
    /mismatch/
  );
  assert.deepEqual(
    await restoreEmulatorDocuments({ origin, project, documents: entryDocuments(plan) }),
    { created: 0, unchanged: 2, verified: 2 }
  );
});
