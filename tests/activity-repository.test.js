import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAddOperation,
  createChangeOperation,
  applyActivityOperation,
  validateActivity,
} from '../src/data/activityRepository.js';
import { createMemoryRepository, resetMemoryActivities } from '../src/data/memoryRepository.js';

const input = {
  amount: 20,
  localDate: '2027-02-03',
  phase: 'OFFICIAL',
  challengeYear: 2027,
  timeZone: 'America/Toronto',
};

test('same-ID retry, revision edits, stale conflicts and tombstone undo preserve unrelated records', async () => {
  resetMemoryActivities();
  const a = createMemoryRepository('owner', 2027);
  const b = createMemoryRepository('owner', 2027);
  let visible = [];
  const unsubscribe = b.subscribe((records) => {
    visible = records;
  });
  const add = createAddOperation(input, 'owner', 2027, 'set-a', 1000);
  const first = await a.execute(add);
  await a.execute(add);
  assert.equal(visible.length, 1);
  const edit = createChangeOperation('edit', first, 30, 'edit-a', 2000);
  const changed = await b.execute(edit);
  await a.execute(edit);
  await assert.rejects(a.execute(createChangeOperation('edit', first, 50, 'stale-edit', 3000)), {
    code: 'conflict',
  });
  await b.execute(createAddOperation({ ...input, amount: 10 }, 'owner', 2027, 'set-b', 2000));
  const remove = createChangeOperation('remove', changed, undefined, 'remove-a', 3000);
  await a.execute(remove);
  await a.execute(remove);
  assert.deepEqual(
    visible.map((record) => record.id),
    ['set-b']
  );
  unsubscribe();
});

test('demo stores isolate users and years and a fresh demo reset discards fictional activity', async () => {
  resetMemoryActivities();
  const a = createMemoryRepository('owner', 2027);
  await a.execute(createAddOperation(input, 'owner', 2027, 'isolated', 1000));
  for (const repository of [
    createMemoryRepository('other', 2027),
    createMemoryRepository('owner', 2026),
  ]) {
    repository.subscribe((records) => assert.deepEqual(records, []))();
  }
  resetMemoryActivities();
  createMemoryRepository('owner', 2027).subscribe((records) => assert.deepEqual(records, []))();
});

test('invalid activity cannot enter the write repository', () => {
  for (const values of [
    { amount: 0 },
    { amount: 1.5 },
    { localDate: '2027-02-30' },
    { challengeYear: 2026 },
    { timeZone: 'bad' },
  ]) {
    assert.throws(() => createAddOperation({ ...input, ...values }, 'owner', 2027, 'bad', 1000), {
      code: 'invalid-activity',
    });
  }
});

test('journal survives a new reader and preserves exact operation identity without account leakage', async () => {
  const { journalKey, readPending, writePending, clearPending } =
    await import('../src/data/activityJournal.js');
  const values = new Map();
  const storage = {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const key = journalKey('demo-project', 'owner', 2027);
  const operation = createAddOperation(input, 'owner', 2027, 'recoverable-set', 1000);
  writePending(storage, key, 'owner', 2027, operation);
  assert.deepEqual(readPending(storage, key, 'owner', 2027), operation);
  assert.equal(readPending(storage, key, 'other', 2027), null);
  assert.equal(readPending(storage, key, 'owner', 2026), null);
  clearPending(storage, key);
  assert.equal(readPending(storage, key, 'owner', 2027), null);
  assert.throws(() => writePending(null, key, 'owner', 2027, operation), {
    code: 'invalid-journal',
  });
  assert.equal(readPending(null, key, 'owner', 2027), null);
});

test('fictional seed creation instants precede a newly logged set for reliable undo ordering', () => {
  resetMemoryActivities();
  const year = Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric' }).format(
      new Date()
    )
  );
  const unsubscribe = createMemoryRepository('demo-user', year).subscribe((records) => {
    assert.ok(records.length > 0);
    for (const record of records) assert.ok(record.createdAt < Date.now() - 3600000);
  });
  unsubscribe();
});

test('confirming one journaled operation does not discard another tab change', async () => {
  const { journalKey, readPending, writePending, clearPending } =
    await import('../src/data/activityJournal.js');
  const values = new Map();
  const storage = {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const key = journalKey('demo-project', 'owner', 2027);
  const first = createAddOperation(input, 'owner', 2027, 'tab-one', 1000);
  const second = createAddOperation(input, 'owner', 2027, 'tab-two', 1000);
  writePending(storage, key, 'owner', 2027, first);
  writePending(storage, key, 'owner', 2027, second);
  clearPending(storage, key, first.operationId);
  assert.deepEqual(readPending(storage, key, 'owner', 2027), second);
  clearPending(storage, key, second.operationId);
  assert.equal(readPending(storage, key, 'owner', 2027), null);
});

test('malformed IANA metadata blocks edit but allows a safe owner tombstone', () => {
  const original = {
    ...createAddOperation(input, 'owner', 2027, 'malformed-zone', 1000).record,
    timeZone: 'Not_A_Zone',
  };
  const before = JSON.stringify(original);
  const edited = applyActivityOperation(
    original,
    createChangeOperation('edit', original, 30, 'edit-malformed', 2000)
  );
  assert.throws(() => validateActivity(edited, 'owner', 2027), { code: 'invalid-activity' });
  const removed = applyActivityOperation(
    original,
    createChangeOperation('remove', original, undefined, 'remove-malformed', 2000)
  );
  assert.doesNotThrow(() => validateActivity(removed, 'owner', 2027));
  assert.equal(removed.deleted, true);
  assert.equal(removed.timeZone, original.timeZone);
  assert.equal(JSON.stringify(original), before);
  assert.throws(() => validateActivity({ ...removed, amount: -1 }, 'owner', 2027), {
    code: 'invalid-activity',
  });
  assert.throws(() => validateActivity({ ...removed, timeZone: 'x'.repeat(101) }, 'owner', 2027), {
    code: 'invalid-activity',
  });
});
