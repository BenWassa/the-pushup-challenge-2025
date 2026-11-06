import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLegacyActivity, summarizeActivities } from '../src/utils/activity.js';
import { getChallenge, getChallengeDay } from '../src/utils/challenges.js';

const challenge = getChallenge(2027);
const selection = {
  ownerUid: 'fictional-owner',
  challengeYear: challenge.year,
  officialStart: challenge.official.start,
  officialEnd: challenge.official.end,
};

test('annual engine and dry-run adapter separate training, rest days, official and offseason', () => {
  const logs = [
    { amount: 10, timestamp: Date.parse('2027-02-03T04:59:59Z'), season: 'OFFICIAL' },
    { amount: 20, timestamp: Date.parse('2027-02-03T05:00:00Z'), season: 'TRAINING' },
    { amount: 5, submitted_date: '2027-02-07', season: 'OFFICIAL' },
    { amount: 25, submitted_date: '2027-02-27', season: 'OFFICIAL' },
    { amount: 100, submitted_date: '2026-02-10', season: 'OFFICIAL' },
  ];
  const normalized = logs.map((log, index) =>
    normalizeLegacyActivity(log, {
      ownerUid: selection.ownerUid,
      timeZone: challenge.timeZone,
      sourceId: 'fictional-frozen-export/profile',
      index,
      classifyDate: (date) => getChallengeDay(challenge, date),
    })
  );
  assert.equal(normalized[4].reason, 'classification');
  const records = normalized.flatMap(({ record }) => (record ? [record] : []));
  const summary = summarizeActivities(records, selection);
  assert.deepEqual(summary.totals, { TRAINING: 10, OFFICIAL: 25, OFF_SEASON: 25 });
  assert.deepEqual(summary.daily, {
    '2027-02-02': 10,
    '2027-02-03': 20,
    '2027-02-07': 5,
    '2027-02-27': 25,
  });
  assert.equal(getChallengeDay(challenge, '2027-02-07').dailyTarget, 0);
  assert.equal(getChallengeDay(challenge, '2027-02-03').dailyTarget, null);
  assert.deepEqual(logs[0], {
    amount: 10,
    timestamp: Date.parse('2027-02-03T04:59:59Z'),
    season: 'OFFICIAL',
  });
});
