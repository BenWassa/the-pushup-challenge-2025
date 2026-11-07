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

test('seeded history is never future-dated, so today counts before noon', () => {
  const morning = new Date(2026, 9, 13, 9, 15);
  resetDemoUsers(morning);
  const alex = getDemoUserByName('Sample Alex');
  assert.ok(alex.logs.every((log) => log.timestamp <= morning.getTime()));
  assert.equal(new Date(alex.logs.at(-1).timestamp).getDate(), 13);
});

test('named demo fixtures resolve; unknown names do not', async () => {
  const { findDemoFixture, getDemoFixture } = await import('../src/data/demoFixture.js');
  assert.equal(findDemoFixture('feb-10-2027').year, 2027);
  assert.equal(findDemoFixture('nope'), null);
  assert.equal(findDemoFixture(undefined), null);
  assert.equal(findDemoFixture('toString'), null);
  assert.equal(getDemoFixture(), null); // no window outside the browser
});

test('every demo preset has a label and valid sets; new presets total what they claim', async () => {
  const { DEMO_FIXTURES } = await import('../src/data/demoFixture.js');
  for (const [name, preset] of Object.entries(DEMO_FIXTURES)) {
    assert.ok(preset.label && preset.description, name);
    assert.ok(Number.isFinite(preset.now), name);
    assert.ok(
      preset.sets.every(([date, amount]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && amount > 0)
    );
  }
  const total = (name) => DEMO_FIXTURES[name].sets.reduce((sum, [, amount]) => sum + amount, 0);
  assert.equal(total('feb-3-2027'), 0);
  assert.equal(total('feb-26-2027'), 2016);
  assert.ok(
    DEMO_FIXTURES['feb-26-2027'].sets.every(
      ([date]) => date >= '2027-02-03' && date <= '2027-02-26'
    )
  );
});
