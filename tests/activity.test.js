import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isActivityDate,
  normalizeLegacyActivity,
  summarizeActivities,
} from '../src/utils/activity.js';

const options = {
  ownerUid: 'fixture-owner',
  timeZone: 'America/Toronto',
  sourceId: 'fixture-snapshot/user-a',
  index: 0,
  classifyDate: (date) => ({
    challengeYear: Number(date.slice(0, 4)),
    phase: date < '2027-02-03' ? 'TRAINING' : 'OFFICIAL',
  }),
};
const record = (overrides = {}) => ({
  schemaVersion: 2,
  id: 'a',
  ownerUid: 'fixture-owner',
  challengeYear: 2027,
  phase: 'OFFICIAL',
  localDate: '2027-02-03',
  timeZone: 'America/Toronto',
  amount: 25,
  ...overrides,
});
const selection = {
  ownerUid: 'fixture-owner',
  challengeYear: 2027,
  officialStart: '2027-02-03',
  officialEnd: '2027-02-26',
};

test('legacy dry run preserves input and original season while classifying by actual local date', () => {
  const log = Object.freeze({
    amount: 20,
    timestamp: Date.parse('2027-02-03T02:00:00Z'),
    season: 'OFFICIAL',
  });
  const result = normalizeLegacyActivity(log, options);
  assert.equal(result.record.localDate, '2027-02-02');
  assert.equal(result.record.phase, 'TRAINING');
  assert.equal(result.record.provenance.originalSeason, 'OFFICIAL');
  assert.deepEqual(normalizeLegacyActivity(log, options), result);
});

test('historical calendar dates stay literal; invalid and contradictory dates are quarantined', () => {
  assert.equal(
    normalizeLegacyActivity({ amount: 10, submitted_date: '2027-02-03' }, options).record.createdAt,
    null
  );
  assert.equal(
    normalizeLegacyActivity({ amount: 10, submitted_date: '2027-02-30' }, options).reason,
    'date'
  );
  assert.equal(
    normalizeLegacyActivity(
      { amount: 10, timestamp: Date.parse('2027-02-04T12:00Z'), submitted_date: '2027-02-03' },
      options
    ).reason,
    'conflicting-dates'
  );
  assert.equal(isActivityDate('2028-02-29'), true);
  assert.equal(isActivityDate('2027-02-29'), false);
});

test('unknown ownership, timezone, amount, dates and classification fail closed', () => {
  const log = { amount: 10, timestamp: 0 };
  assert.equal(normalizeLegacyActivity(log, { ...options, ownerUid: '' }).reason, 'identity');
  assert.equal(
    normalizeLegacyActivity(log, { ...options, timeZone: 'invalid' }).reason,
    'timezone'
  );
  assert.equal(normalizeLegacyActivity({ ...log, amount: -10 }, options).reason, 'amount');
  assert.equal(normalizeLegacyActivity({ amount: 10 }, options).reason, 'date');
  assert.equal(
    normalizeLegacyActivity(log, { ...options, classifyDate: () => null }).reason,
    'classification'
  );
});

test('annual totals exclude other owners, years, out-of-window official activity and duplicates', () => {
  const summary = summarizeActivities(
    [
      record(),
      record(),
      record({ id: 'b', phase: 'TRAINING', localDate: '2027-01-31', amount: 10 }),
      record({ id: 'c', phase: 'OFF_SEASON', localDate: '2027-03-01', amount: 5 }),
      record({ id: 'd', challengeYear: 2026 }),
      record({ id: 'e', ownerUid: 'someone-else' }),
      record({ id: 'f', localDate: '2027-03-01' }),
    ],
    selection
  );
  assert.deepEqual(summary.totals, { TRAINING: 10, OFFICIAL: 25, OFF_SEASON: 5 });
  assert.equal(summary.rejected, 3);
  assert.equal(summary.daily['2027-02-03'], 25);
});

test('conflicting duplicate IDs are quarantined instead of picking a winner', () => {
  const summary = summarizeActivities([record(), record({ amount: 50 })], selection);
  assert.equal(summary.totals.OFFICIAL, 0);
  assert.deepEqual(summary.conflictingIds, ['a']);
  assert.throws(() => summarizeActivities([], { ...selection, officialEnd: 'invalid' }), TypeError);
});
