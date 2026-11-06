import test from 'node:test';
import assert from 'node:assert/strict';
import { bestDay } from '../src/utils/archive.js';

test('best day uses daily totals and resolves ties to the earliest date', () => {
  assert.deepEqual(bestDay({ '2026-02-04': 100, '2026-02-02': 100, '2026-02-01': 20 }), {
    date: '2026-02-02',
    total: 100,
  });
});
test('empty years have no best day', () => {
  assert.equal(bestDay({}), null);
  assert.equal(bestDay({ '2026-01-01': 0 }), null);
});
