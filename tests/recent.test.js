import assert from 'node:assert/strict';
import test from 'node:test';
import { latestUndoable, splitRecords } from '../src/utils/recent.js';

const set = (id, localDate, extra = {}) => ({ id, localDate, amount: 10, ...extra });
const records = [
  set('a', '2027-02-10'),
  set('b', '2027-02-09'),
  set('imp', '2027-01-05', { provenance: { source: 'legacy' } }),
  set('legacy_x', '2027-01-04'),
];

test('imported sets leave Recent but stay available as an archive group', () => {
  const { recent, imported, hasCurrent } = splitRecords(records);
  assert.deepEqual(
    recent.map((r) => r.id),
    ['a', 'b']
  );
  assert.deepEqual(
    imported.map((r) => r.id),
    ['imp', 'legacy_x']
  );
  assert.equal(hasCurrent, true);
});

test('Recent skips the day already shown in the heatmap detail and respects the limit', () => {
  assert.deepEqual(
    splitRecords(records, '2027-02-10').recent.map((r) => r.id),
    ['b']
  );
  assert.equal(splitRecords(records, null, 1).recent.length, 1);
});

test('a year of only imported sets has no current recent sets', () => {
  const only = splitRecords(records.slice(2));
  assert.equal(only.hasCurrent, false);
  assert.equal(only.recent.length, 0);
  assert.equal(only.imported.length, 2);
});

test('undo targets only the latest set from today', () => {
  assert.equal(latestUndoable(records, '2027-02-10').id, 'a');
  assert.equal(latestUndoable(records, '2027-02-11'), null);
  assert.equal(latestUndoable(records.slice(1), '2027-02-10'), null);
  assert.equal(latestUndoable([records[2]], '2027-01-05'), null);
});
