import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createChallengeModel,
  classifyChallengeDate,
  readLegacyExport,
  getMonthActivity,
} from '../src/utils/challengeModel.js';
const record = (id, date, phase, amount = 10) => ({
  schemaVersion: 2,
  id,
  ownerUid: 'fictional',
  challengeYear: Number(date.slice(0, 4)),
  localDate: date,
  phase,
  amount,
  timeZone: 'America/Toronto',
  createdAt: 1,
});
const now = '2027-02-03T05:00:00Z';

test('current-year logging and future/archive selection use actual local day', () => {
  const current = createChallengeModel({ now: '2026-11-05T12:00:00Z' });
  assert.equal(current.selectedYear, 2026);
  assert.equal(current.canLog, true);
  assert.equal(current.challenge, null);
  assert.equal(current.day.phase, 'OFF_SEASON');
  assert.equal(current.day.scheduleStatus, 'UNCONFIGURED');
  assert.deepEqual(current.years, [2027, 2026]);
  assert.equal(createChallengeModel({ now, year: 2026 }).canLog, false);
  assert.equal(createChallengeModel({ now: '2026-12-31T23:00:00Z', year: 2027 }).canLog, false);
  assert.equal(createChallengeModel({ now: '2027-01-01T05:00:00Z', year: 2027 }).canLog, true);
});

test('daily and annual totals separate years and require verified official window', () => {
  const records = [
    record('a', '2027-02-03', 'OFFICIAL', 20),
    record('b', '2027-01-01', 'TRAINING', 30),
    record('c', '2027-03-01', 'OFF_SEASON', 40),
    record('d', '2026-02-03', 'OFFICIAL', 100),
    record('e', '2027-03-02', 'OFFICIAL', 5),
  ];
  const model = createChallengeModel({ records, now });
  assert.equal(model.summary.total, 95);
  assert.equal(model.summary.official, 20);
  assert.equal(model.summary.training, 30);
  assert.equal(model.summary.offSeason, 45);
  assert.equal(model.summary.todayTotal, 20);
  assert.equal(model.summary.activeDays, 4);
  assert.equal(model.day.dailyTarget, null);
  assert.equal(getMonthActivity(model, 2).total, 20);
  assert.equal(getMonthActivity(model, 1).total, 30);
  assert.throws(() => getMonthActivity(model, 13), RangeError);
});

test('rest days count physical activity but keep zero official daily target', () => {
  const model = createChallengeModel({
    records: [record('r', '2027-02-07', 'OFFICIAL', 5)],
    now: '2027-02-07T12:00:00Z',
  });
  assert.equal(model.day.dailyTarget, 0);
  assert.equal(model.day.isRestDay, true);
  assert.equal(model.summary.official, 5);
});

test('canonical saved dates survive preference timezone change', () => {
  const records = [record('a', '2027-02-03', 'OFFICIAL', 20)];
  const east = createChallengeModel({ records, now, timeZone: 'America/Toronto' });
  const west = createChallengeModel({ records, now, timeZone: 'America/Vancouver' });
  assert.equal(east.summary.todayTotal, 20);
  assert.equal(west.summary.todayTotal, 0);
  assert.equal(west.summary.official, 20);
  assert.equal(west.yearRecords[0].localDate, '2027-02-03');
});

test('duplicates, contradictory IDs, deleted and malformed records cannot inflate totals', () => {
  const good = record('a', '2027-02-03', 'OFFICIAL');
  const conflict = record('b', '2027-02-03', 'OFFICIAL');
  const model = createChallengeModel({
    now,
    records: [
      good,
      { ...good },
      conflict,
      { ...conflict, amount: 50 },
      { ...good, id: 'deleted', deleted: true },
      { ...good, id: 'invalid', localDate: '2027-02-30' },
    ],
  });
  assert.equal(model.summary.total, 10);
  assert.deepEqual(model.summary.conflictingIds, ['b']);
  assert.equal(model.summary.rejected, 2);
});

test('explicit immutable legacy export adapter retains provenance, quarantines ambiguous dates', () => {
  const logs = [
    { amount: 40, submitted_date: '2025-02-10', season: 'OFFICIAL' },
    { amount: 20, submitted_date: '2027-02-03', season: 'TRAINING' },
    { amount: 100, submitted_date: '2027-02-30', season: 'OFFICIAL' },
  ];
  const original = JSON.stringify(logs);
  const result = readLegacyExport({
    logs,
    sourceId: 'fictional-snapshot-1',
    ownerUid: 'fictional',
  });
  assert.equal(result.records.length, 2);
  assert.equal(result.quarantine.length, 1);
  assert.equal(result.records[0].provenance.originalSeason, 'OFFICIAL');
  assert.equal(result.records[1].phase, 'OFFICIAL');
  const archive = createChallengeModel({ records: result.records, now, year: 2025 });
  assert.equal(archive.summary.total, 40);
  assert.equal(archive.summary.official, 0);
  assert.equal(archive.summary.legacy, 40);
  assert.equal(archive.canLog, false);
  assert.equal(JSON.stringify(logs), original);
});

test('leap-day archive selection and unknown future editions stay valid', () => {
  const model = createChallengeModel({
    now: '2028-02-29T12:00:00Z',
    year: 2027,
    availableYears: [2024],
  });
  assert.equal(model.day.localDate, '2027-02-28');
  assert.ok(model.years.includes(2024));
  assert.equal(classifyChallengeDate('2030-02-03').scheduleStatus, 'UNCONFIGURED');
  assert.throws(() => createChallengeModel({ now, year: NaN }), RangeError);
});

test('configured edition derives reporting phase from dates without changing original records', () => {
  const records = [
    record('spoof-official', '2027-03-01', 'OFFICIAL', 10),
    record('spoof-offseason', '2027-02-03', 'OFF_SEASON', 20),
    record('spoof-training', '2027-01-10', 'OFFICIAL', 30),
  ];
  const original = JSON.stringify(records);
  // Inspect a future edition while real time is still the preceding calendar year.
  const model = createChallengeModel({ records, year: 2027, now: '2026-11-05T12:00:00Z' });
  assert.equal(model.canLog, false);
  assert.equal(model.summary.official, 20);
  assert.equal(model.summary.training, 30);
  assert.equal(model.summary.offSeason, 10);
  assert.equal(model.summary.metadataWarnings.length, 3);
  assert.equal(JSON.stringify(records), original);
  assert.equal(model.yearRecords[0].phase, 'OFFICIAL');
});

test('invalid metadata remains visible with warnings while physical activity is retained', () => {
  const invalid = {
    ...record('invalid-zone', '2027-02-03', 'unknown-phase', 25),
    timeZone: 'Not_A_Zone',
  };
  const model = createChallengeModel({ now, records: [invalid] });
  assert.equal(model.summary.total, 25);
  assert.equal(model.summary.official, 25);
  assert.equal(model.summary.rejected, 0);
  assert.deepEqual(model.summary.metadataWarnings, [
    { id: 'invalid-zone', issues: ['timeZone', 'phase'] },
  ]);
  assert.equal(model.yearRecords[0], invalid);
});
