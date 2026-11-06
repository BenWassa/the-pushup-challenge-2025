import test from 'node:test';
import assert from 'node:assert/strict';
import { centuryState, progressSubject, slotPlan } from '../src/utils/century.js';

test('blocks are whole hundreds and the bar holds the rest', () => {
  assert.deepEqual(centuryState({ total: 445, compacted: 4 }), {
    blocks: 4,
    compacted: 4,
    pending: 0,
    barValue: 45,
    overflow: 0,
  });
  assert.deepEqual(centuryState({ total: 0, compacted: 0 }), {
    blocks: 0,
    compacted: 0,
    pending: 0,
    barValue: 0,
    overflow: 0,
  });
});

test('a finished hundred waits for Compact with the extra reps carried', () => {
  assert.deepEqual(centuryState({ total: 520, compacted: 4 }), {
    blocks: 5,
    compacted: 4,
    pending: 1,
    barValue: 100,
    overflow: 20,
  });
  const two = centuryState({ total: 745, compacted: 5 });
  assert.equal(two.pending, 2);
  assert.equal(two.barValue, 100);
  assert.equal(two.overflow, 145);
});

test('undo below a block clamps compacted so no block is left behind', () => {
  const state = centuryState({ total: 495, compacted: 5 });
  assert.equal(state.blocks, 4);
  assert.equal(state.compacted, 4);
  assert.equal(state.pending, 0);
  assert.equal(state.barValue, 95);
});

test('the official phase has a target; training and off-season never do', () => {
  const summary = { official: 445, training: 230, offSeason: 1340 };
  assert.deepEqual(progressSubject({ phase: 'OFFICIAL', summary, target: 2000 }), {
    category: 'official',
    label: 'Official challenge',
    suffix: '',
    total: 445,
    target: 2000,
  });
  const training = progressSubject({ phase: 'TRAINING', summary, target: 2000 });
  assert.equal(training.total, 230);
  assert.equal(training.target, null);
  const off = progressSubject({ phase: 'OFF_SEASON', summary, target: 2000 });
  assert.equal(off.total, 1340);
  assert.equal(off.target, null);
  assert.equal(progressSubject({ phase: 'NOPE', summary }), null);
});

test('official shows twenty slots; others grow in rows of ten with the next slot shown', () => {
  assert.deepEqual(slotPlan({ blocks: 4, compacted: 4, target: 2000 }), {
    count: 20,
    hasMore: false,
    hiddenCount: 0,
    goalBlocks: 20,
  });
  assert.equal(slotPlan({ blocks: 0, compacted: 0 }).count, 10);
  assert.equal(slotPlan({ blocks: 9, compacted: 9 }).count, 10);
  assert.equal(slotPlan({ blocks: 10, compacted: 10 }).count, 20);
  assert.equal(slotPlan({ blocks: 20, compacted: 20, target: 2000 }).goalBlocks, 20);
});

test('past the target, or past forty blocks, the grid stops growing and summarises', () => {
  const past = slotPlan({ blocks: 21, compacted: 21, target: 2000 });
  assert.equal(past.goalBlocks, null);
  assert.equal(past.count, 30);
  const big = slotPlan({ blocks: 54, compacted: 54 });
  assert.equal(big.count, 40);
  assert.equal(big.hasMore, true);
  assert.equal(big.hiddenCount, 54 - 39);
});
