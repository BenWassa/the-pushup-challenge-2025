import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStreak } from '../src/utils/streak.js';

// Feb 7, 14, 21 2027 are verified official rest Sundays (see src/utils/challenges.js).
test('counts consecutive active days ending today', () => {
  assert.equal(
    computeStreak({ '2027-02-10': 5, '2027-02-09': 1, '2027-02-08': 9 }, '2027-02-10'),
    3
  );
});

test('an empty today keeps the streak alive from yesterday', () => {
  assert.equal(computeStreak({ '2027-02-09': 5, '2027-02-08': 1 }, '2027-02-10'), 2);
});

test('a missed day ends the streak', () => {
  assert.equal(computeStreak({ '2027-02-10': 5, '2027-02-08': 5 }, '2027-02-10'), 1);
  assert.equal(computeStreak({ '2027-02-08': 5 }, '2027-02-10'), 0);
});

test('verified rest days neither break nor extend the streak', () => {
  const byDate = {
    '2027-02-10': 20,
    '2027-02-09': 20,
    '2027-02-08': 20,
    '2027-02-06': 20,
    '2027-02-05': 20,
  };
  assert.equal(computeStreak(byDate, '2027-02-10'), 5);
});

test('non-rest gaps in unconfigured years always break', () => {
  assert.equal(computeStreak({ '2030-06-10': 3, '2030-06-08': 3 }, '2030-06-10'), 1);
});

test('the streak never reaches before 1 January of the loaded year', () => {
  assert.equal(computeStreak({ '2027-01-02': 4, '2027-01-01': 4 }, '2027-01-02'), 2);
});

test('invalid today yields zero', () => {
  assert.equal(computeStreak({}, 'not-a-date'), 0);
});

test('the fictional Feb 10 2027 fixture yields 445 official, 60 today and a 7 day streak', async () => {
  const { DEMO_FIXTURES } = await import('../src/data/demoFixture.js');
  const { createChallengeModel } = await import('../src/utils/challengeModel.js');
  const fixture = DEMO_FIXTURES['feb-10-2027'];
  const records = fixture.sets.map(([localDate, amount], index) => ({
    schemaVersion: 2,
    id: `f${index}`,
    challengeYear: 2027,
    localDate,
    phase: classify(localDate),
    timeZone: 'America/Toronto',
    amount,
  }));
  const model = createChallengeModel({ records, year: 2027, now: fixture.now });
  assert.equal(model.today, '2027-02-10');
  assert.equal(model.summary.todayTotal, 60);
  assert.equal(model.summary.official, 445);
  assert.equal(computeStreak(model.summary.byDate, model.today), 7);
});
function classify(date) {
  return date >= '2027-02-03' ? 'OFFICIAL' : 'TRAINING';
}
