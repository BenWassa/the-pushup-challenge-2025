import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resetDemoUsers,
  listDemoUsers,
  getDemoUserByName,
  saveDemoUser,
} from '../src/utils/localStore.js';

test('demo reset restores fictional progress after edits without touching durable storage', () => {
  const date = new Date(2026, 9, 13, 12);
  resetDemoUsers(date);
  assert.equal(listDemoUsers().length, 3);
  const original = getDemoUserByName('Sample Alex');
  assert.equal(original.official_reps, 385);
  assert.equal(original.logs.length, 14);
  assert.equal(new Date(original.logs.at(-1).timestamp).getDate(), 13);
  saveDemoUser(original.id, { ...original, official_reps: 999 });
  assert.equal(getDemoUserByName('Sample Alex').official_reps, 999);
  resetDemoUsers(date);
  assert.deepEqual(getDemoUserByName('Sample Alex'), original);
});
