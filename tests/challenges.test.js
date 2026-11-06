import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHALLENGES,
  getChallenge,
  getChallengeDay,
  toLocalDate,
  validateChallenge,
} from '../src/utils/challenges.js';

const challenge = getChallenge(2027);

test('2027 configuration preserves pending targets and sourced rest days', () => {
  assert.equal(validateChallenge(challenge), challenge);
  assert.equal(challenge.totalTarget, 2000);
  assert.equal(getChallenge(2026), null);
  assert.equal(Object.isFrozen(CHALLENGES[2027].dailyTargets), true);
  assert.deepEqual(getChallengeDay(challenge, '2027-02-03'), {
    challengeYear: 2027,
    localDate: '2027-02-03',
    timeZone: 'America/Toronto',
    phase: 'OFFICIAL',
    dailyTarget: null,
    scheduleStatus: 'PENDING',
    isRestDay: null,
  });
  for (const date of ['2027-02-07', '2027-02-14', '2027-02-21']) {
    const day = getChallengeDay(challenge, date);
    assert.equal(day.dailyTarget, 0);
    assert.equal(day.isRestDay, true);
    assert.equal(day.scheduleStatus, 'CONFIRMED');
  }
});

test('inclusive phase boundaries never leak into another year', () => {
  for (const [date, phase] of [
    ['2026-12-31', 'OFF_SEASON'],
    ['2027-01-01', 'TRAINING'],
    ['2027-02-02', 'TRAINING'],
    ['2027-02-03', 'OFFICIAL'],
    ['2027-02-26', 'OFFICIAL'],
    ['2027-02-27', 'OFF_SEASON'],
    ['2028-01-01', 'OFF_SEASON'],
    ['2028-02-03', 'OFF_SEASON'],
  ])
    assert.equal(getChallengeDay(challenge, date).phase, phase, date);
  assert.equal(getChallengeDay(challenge, '2027-01-10').scheduleStatus, 'NOT_APPLICABLE');
});

test('Toronto midnight, offset instants and date-only values are deterministic', () => {
  assert.equal(getChallengeDay(challenge, '2027-02-03T04:59:59Z').phase, 'TRAINING');
  assert.equal(getChallengeDay(challenge, '2027-02-03T05:00:00Z').phase, 'OFFICIAL');
  assert.equal(getChallengeDay(challenge, '2027-02-27T04:59:59Z').phase, 'OFFICIAL');
  assert.equal(getChallengeDay(challenge, '2027-02-27T05:00:00Z').phase, 'OFF_SEASON');
  assert.equal(toLocalDate('2027-02-03T00:00:00-05:00', 'America/Toronto'), '2027-02-03');
  assert.equal(toLocalDate('2027-02-03', 'America/Vancouver'), '2027-02-03');
  assert.equal(toLocalDate(0, 'America/Toronto'), '1969-12-31');
});

test('DST and year boundaries use configured timezone rather than host timezone', () => {
  assert.equal(toLocalDate('2027-03-14T06:59:59Z', 'America/Toronto'), '2027-03-14');
  assert.equal(toLocalDate('2027-03-14T07:00:00Z', 'America/Toronto'), '2027-03-14');
  assert.equal(toLocalDate('2027-11-07T06:00:00Z', 'America/Toronto'), '2027-11-07');
  assert.equal(toLocalDate('2028-01-01T00:30:00Z', 'America/Toronto'), '2027-12-31');
  assert.equal(toLocalDate('2028-01-01T00:30:00Z', 'Pacific/Auckland'), '2028-01-01');
});

test('future editions and leap days require configuration rather than recurring dates', () => {
  const future = {
    ...challenge,
    year: 2028,
    training: null,
    official: { start: '2028-02-28', end: '2028-02-29' },
    totalTarget: 10,
    dailyTargets: { '2028-02-28': 10, '2028-02-29': 0 },
  };
  assert.equal(getChallengeDay(future, '2028-02-29').isRestDay, true);
  assert.equal(getChallengeDay(future, '2028-03-01').phase, 'OFF_SEASON');
});

test('malformed dates, ambiguous instants, invalid schedules and overlap fail closed', () => {
  for (const input of ['2027-02-29', '2027-02-30', '2027-02-03T12:00:00', null, new Date(NaN)])
    assert.throws(() => toLocalDate(input, 'America/Toronto'), RangeError);
  assert.throws(() => toLocalDate(new Date(0), 'invalid/timezone'), RangeError);
  assert.throws(() => toLocalDate('2027-02-03'), RangeError);
  for (const config of [
    { ...challenge, timeZone: undefined },
    { ...challenge, training: { start: '2027-01-01', end: '2027-02-03' } },
    { ...challenge, dailyTargets: { '2027-02-27': 1 } },
    { ...challenge, dailyTargets: { '2027-02-03': -1 } },
    { ...challenge, official: { start: '2026-02-03', end: '2027-02-26' } },
    {
      ...challenge,
      official: { start: '2027-02-03', end: '2027-02-03' },
      dailyTargets: { '2027-02-03': 1 },
    },
  ])
    assert.throws(() => validateChallenge(config), RangeError);
});
