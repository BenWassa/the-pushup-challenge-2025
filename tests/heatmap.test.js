import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HEAT_THRESHOLDS,
  buildMonthGrid,
  heatLevel,
  formatDateLong,
  formatMonthTitle,
  moveDate,
} from '../src/utils/heatmap.js';

test('Sunday-first months have exact dates and leading blanks', () => {
  const february = buildMonthGrid(2027, 2);
  assert.equal(february.leadingBlanks, 1);
  assert.equal(february.days.length, 28);
  assert.deepEqual(february.days[0], { date: '2027-02-01', day: 1 });
  assert.deepEqual(february.days.at(-1), { date: '2027-02-28', day: 28 });
  assert.equal(buildMonthGrid(2027, 8).leadingBlanks, 0);
  assert.equal(buildMonthGrid(2027, 5).leadingBlanks, 6);
  assert.equal(buildMonthGrid(2027, 1).days.length, 31);
  assert.equal(buildMonthGrid(2027, 4).days.length, 30);
  assert.equal(buildMonthGrid(2027, 12).days.at(-1).date, '2027-12-31');
});

test('Gregorian leap years include century rules', () => {
  assert.equal(buildMonthGrid(2028, 2).days.length, 29);
  assert.equal(buildMonthGrid(2000, 2).days.length, 29);
  assert.equal(buildMonthGrid(2100, 2).days.length, 28);
  assert.throws(() => buildMonthGrid(2027, 13), RangeError);
  assert.throws(() => buildMonthGrid(2027, 0), RangeError);
  assert.throws(() => buildMonthGrid(2027, 1.5), RangeError);
  assert.throws(() => buildMonthGrid(NaN, 2), RangeError);
});

test('illustrative heat bands cover both sides of every threshold', () => {
  assert.deepEqual(HEAT_THRESHOLDS, [1, 20, 50, 100]);
  for (const [count, expected] of [
    [0, 0],
    [1, 1],
    [19, 1],
    [20, 2],
    [49, 2],
    [50, 3],
    [99, 3],
    [100, 4],
    [10000, 4],
  ]) {
    assert.equal(heatLevel(count), expected, String(count));
  }
  for (const invalid of [-1, NaN, Infinity, -Infinity, undefined, null, '20', {}, true]) {
    assert.equal(heatLevel(invalid), 0);
  }
  assert.ok(Object.isFrozen(HEAT_THRESHOLDS));
});

test('date and month labels use an explicit locale and UTC', () => {
  assert.equal(formatDateLong('2027-02-10', 'en-CA'), 'Wednesday, February 10, 2027');
  assert.equal(formatMonthTitle(2027, 2, 'en-CA'), 'February 2027');
  assert.equal(formatDateLong('2028-02-29', 'en-CA'), 'Tuesday, February 29, 2028');
  assert.throws(() => formatDateLong('2027-02-29', 'en-CA'), RangeError);
});

test('UTC movement crosses months, leap days, years and DST boundaries', () => {
  for (const [date, delta, expected] of [
    ['2027-02-28', 1, '2027-03-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2028-03-01', -1, '2028-02-29'],
    ['2027-01-01', -1, '2026-12-31'],
    ['2027-12-31', 1, '2028-01-01'],
    ['2027-03-13', 7, '2027-03-20'],
    ['2027-11-07', -7, '2027-10-31'],
    ['2027-02-10', 0, '2027-02-10'],
  ])
    assert.equal(moveDate(date, delta), expected);
  assert.throws(() => moveDate('invalid', 1), RangeError);
  assert.throws(() => moveDate('2027-02-30', 1), RangeError);
  assert.throws(() => moveDate('2027-02-10', 1.5), RangeError);
});
