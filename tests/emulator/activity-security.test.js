import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { classifyChallengeDate } from '../../src/utils/challengeModel.js';
import {
  createActivityRepository,
  createAddOperation,
  createChangeOperation,
} from '../../src/data/activityRepository.js';

let environment;
const projectId = 'demo-pushup-2027';
const year = new Date().getUTCFullYear();
const path = (owner = 'alice', selectedYear = String(year), id = 'set-a') =>
  `participants/${owner}/challenges/${selectedYear}/entries/${id}`;
const input = {
  amount: 20,
  localDate: `${year}-02-03`,
  phase: classifyChallengeDate(`${year}-02-03`, 'America/Toronto').phase,
  challengeYear: year,
  timeZone: 'America/Toronto',
};
const fresh = () => createAddOperation(input, 'alice', year, 'set-a', Date.now()).record;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});
after(async () => {
  await environment?.cleanup();
});

test('candidate rules enforce owner-only reads/writes, strict schema and immutable identity', async () => {
  await environment.clearFirestore();
  const alice = environment.authenticatedContext('alice').firestore();
  const bob = environment.authenticatedContext('bob').firestore();
  const anonymous = environment.unauthenticatedContext().firestore();
  const reference = doc(alice, path());
  await assertSucceeds(setDoc(reference, fresh()));
  await assertSucceeds(getDocs(collection(alice, `participants/alice/challenges/${year}/entries`)));
  for (const db of [bob, anonymous]) {
    await assertFails(getDoc(doc(db, path())));
    await assertFails(getDocs(collection(db, `participants/alice/challenges/${year}/entries`)));
    await assertFails(setDoc(doc(db, path()), fresh()));
    await assertFails(updateDoc(doc(db, path()), { amount: 50 }));
    await assertFails(deleteDoc(doc(db, path())));
  }
  await assertFails(getDocs(collection(alice, 'participants')));
  await assertFails(getDoc(doc(alice, 'artifacts/legacy/public/data/users/alice')));
  for (const change of [
    { ownerUid: 'bob' },
    { challengeYear: year - 1 },
    { localDate: `${year}-02-30` },
    { amount: -1 },
    { amount: 1.5 },
    { amount: 10001 },
    { timeZone: 'x'.repeat(101) },
    { createdAt: Date.now() + 86400000 },
    { arbitraryRole: 'admin' },
    { deleted: 'yes' },
  ]) {
    await assertFails(
      setDoc(doc(alice, path('alice', String(year), 'invalid')), {
        ...fresh(),
        id: 'invalid',
        lastOperationId: 'invalid',
        ...change,
      })
    );
    await assertFails(
      updateDoc(reference, { revision: 2, lastOperationId: 'bad-update', ...change })
    );
  }
  await assertFails(setDoc(doc(alice, path('alice', String(year), 'missing')), { amount: 10 }));
  await assertFails(
    updateDoc(reference, { revision: 1, lastOperationId: 'skip-revision', amount: 30 })
  );
  await assertFails(updateDoc(reference, { revision: 2, lastOperationId: 'set-a', amount: 30 }));
  await assertFails(deleteDoc(reference));
});

test('real transactions handle duplicate retry and concurrent stale edits without losing another set', async () => {
  await environment.clearFirestore();
  const firstClient = environment.authenticatedContext('alice').firestore();
  const secondClient = environment.authenticatedContext('alice').firestore();
  const a = createActivityRepository(firstClient, 'alice', year);
  const b = createActivityRepository(secondClient, 'alice', year);
  const operation = createAddOperation(input, 'alice', year, 'set-a');
  const [first] = await Promise.all([a.execute(operation), b.execute(operation)]);
  const outcomes = await Promise.allSettled([
    a.execute(createChangeOperation('edit', first, 30, 'edit-one')),
    b.execute(createChangeOperation('edit', first, 40, 'edit-two')),
  ]);
  assert.equal(outcomes.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(outcomes.find((result) => result.status === 'rejected').reason.code, 'conflict');
  await a.execute(createAddOperation(input, 'alice', year, 'unrelated'));
  const current = (await getDoc(doc(firstClient, path()))).data();
  const removal = createChangeOperation('remove', current, undefined, 'remove-one');
  await b.execute(removal);
  await b.execute(removal);
  assert.equal(
    (await getDoc(doc(secondClient, path('alice', String(year), 'unrelated')))).data().amount,
    20
  );
  assert.equal((await getDoc(doc(secondClient, path()))).data().deleted, true);
  await assertFails(
    updateDoc(doc(firstClient, path()), {
      deleted: false,
      revision: current.revision + 2,
      lastOperationId: 'resurrect',
    })
  );
});

test('archived years and reserved imported IDs remain read-only even for the owner', async () => {
  await environment.clearFirestore();
  const db = environment.authenticatedContext('alice').firestore();
  const legacy = { ...fresh(), id: 'legacy_example', lastOperationId: 'legacy_example' };
  await assertFails(setDoc(doc(db, path('alice', String(year), 'legacy_example')), legacy));
  const archive = { ...fresh(), challengeYear: year - 1, localDate: `${year - 1}-02-03` };
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path('alice', String(year), 'legacy_example')), legacy);
    await setDoc(doc(context.firestore(), path('alice', String(year - 1))), archive);
  });
  await assertSucceeds(getDoc(doc(db, path('alice', String(year), 'legacy_example'))));
  await assertFails(
    updateDoc(doc(db, path('alice', String(year), 'legacy_example')), {
      amount: 50,
      revision: 2,
      lastOperationId: 'edit-import',
    })
  );
  await assertFails(
    updateDoc(doc(db, path('alice', String(year - 1))), {
      amount: 50,
      revision: 2,
      lastOperationId: 'edit-archive',
    })
  );
});

test('owner can tombstone directly written malformed timezone without relaxing ownership', async () => {
  await environment.clearFirestore();
  const db = environment.authenticatedContext('alice').firestore();
  const record = { ...fresh(), timeZone: 'Not_A_Zone' };
  await assertSucceeds(setDoc(doc(db, path()), record));
  const repository = createActivityRepository(db, 'alice', year);
  await repository.execute(
    createChangeOperation('remove', record, undefined, 'remove-invalid-zone')
  );
  assert.equal((await getDoc(doc(db, path()))).data().deleted, true);
  await assertFails(getDoc(doc(environment.authenticatedContext('bob').firestore(), path())));
});
