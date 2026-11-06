import { collection, doc, getDocFromServer, onSnapshot, runTransaction } from 'firebase/firestore';
import { getChallenge, getChallengeDay } from '../utils/challenges.js';
import { isActivityDate } from '../utils/activity.js';

const phases = ['TRAINING', 'OFFICIAL', 'OFF_SEASON'];
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
export const operationId = () => globalThis.crypto.randomUUID();
export const activityError = (code, message) => Object.assign(new Error(message), { code });

export function validateActivity(record, ownerUid, year) {
  if (
    !validId(ownerUid) ||
    !validId(record?.id) ||
    record.ownerUid !== ownerUid ||
    !Number.isInteger(year) ||
    year < 1000 ||
    year > 9999 ||
    record.challengeYear !== year ||
    !isActivityDate(record.localDate) ||
    Number(record.localDate.slice(0, 4)) !== year ||
    !phases.includes(record.phase) ||
    !Number.isInteger(record.amount) ||
    record.amount < 1 ||
    record.amount > 10000 ||
    typeof record.timeZone !== 'string' ||
    !record.timeZone ||
    record.timeZone.length > 100 ||
    !Number.isSafeInteger(record.createdAt) ||
    record.createdAt < 0
  ) {
    throw activityError('invalid-activity', 'Check the amount, date and challenge year.');
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: record.timeZone });
  } catch {
    // Owner-created malformed metadata must not trap an otherwise valid set forever.
    // Tombstones preserve the original metadata and all other validation still applies.
    if (record.deleted !== true)
      throw activityError('invalid-activity', 'Choose a valid timezone.');
  }
}

export function createAddOperation(input, ownerUid, year, id = operationId(), now = Date.now()) {
  const record = {
    schemaVersion: 2,
    id,
    ownerUid,
    challengeYear: input.challengeYear,
    localDate: input.localDate,
    phase: input.phase,
    timeZone: input.timeZone,
    amount: input.amount,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    deleted: false,
    lastOperationId: id,
  };
  validateActivity(record, ownerUid, year);
  const challenge = getChallenge(year);
  const expectedPhase = challenge
    ? getChallengeDay({ ...challenge, timeZone: record.timeZone }, record.localDate).phase
    : 'OFF_SEASON';
  if (record.phase !== expectedPhase)
    throw activityError('invalid-phase', 'This date belongs to a different activity phase.');
  return { type: 'add', id, operationId: id, record };
}

export function createChangeOperation(type, record, amount, id = operationId(), now = Date.now()) {
  if (record?.id?.startsWith('legacy_'))
    throw activityError('invalid-archive', 'Imported history is read-only.');
  if (!record || !['edit', 'remove'].includes(type))
    throw activityError('missing-entry', 'This set is no longer available.');
  if (type === 'edit' && (!Number.isInteger(amount) || amount < 1 || amount > 10000))
    throw activityError('invalid-amount', 'Enter a whole number from 1 to 10,000.');
  return {
    type,
    id: record.id,
    operationId: id,
    expectedRevision: record.revision,
    amount: type === 'edit' ? amount : record.amount,
    updatedAt: Math.max(now, record.updatedAt, record.createdAt),
  };
}

/** Same state transition is used by Firestore transactions and the isolated memory adapter. */
export function applyActivityOperation(current, operation) {
  if (current?.lastOperationId === operation.operationId) return current;
  if (operation.type === 'add') {
    if (current)
      throw activityError('conflict', 'This set already exists. Refresh before trying again.');
    return operation.record;
  }
  if (!current || current.deleted || current.revision !== operation.expectedRevision)
    throw activityError(
      'conflict',
      'This set changed on another device. Review the latest entry before correcting it.'
    );
  return {
    ...current,
    amount: operation.amount,
    deleted: operation.type === 'remove',
    revision: current.revision + 1,
    updatedAt: operation.updatedAt,
    lastOperationId: operation.operationId,
  };
}

export function createActivityRepository(db, ownerUid, year) {
  if (!validId(ownerUid) || !Number.isInteger(year))
    throw activityError('identity', 'Sign in to load activity.');
  const entries = collection(db, 'participants', ownerUid, 'challenges', String(year), 'entries');
  return {
    subscribe(onRecords, onError) {
      return onSnapshot(
        entries,
        { includeMetadataChanges: true },
        (snapshot) => {
          // Never replace confirmed totals with optimistic local edits or stale offline cache.
          if (snapshot.metadata.hasPendingWrites || snapshot.metadata.fromCache) return;
          const records = snapshot.docs.map((entry) => entry.data());
          onRecords(records.filter((entry) => !entry.deleted));
        },
        onError
      );
    },
    async execute(operation) {
      const reference = doc(entries, operation.id);
      try {
        return await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(reference);
          const current = snapshot.exists() ? snapshot.data() : null;
          const next = applyActivityOperation(current, operation);
          validateActivity(next, ownerUid, year);
          if (next !== current) transaction.set(reference, next);
          return next;
        });
      } catch (error) {
        // Some emulator/rules interleavings deny a stale revision before retrying a
        // transaction. Distinguish a confirmed revision conflict from access failure.
        if (error.code === 'permission-denied' && operation.type !== 'add') {
          let snapshot;
          try {
            snapshot = await getDocFromServer(reference);
          } catch {
            throw error;
          }
          const current = snapshot.exists() ? snapshot.data() : null;
          if (
            !current ||
            (current.lastOperationId !== operation.operationId &&
              current.revision !== operation.expectedRevision)
          )
            throw activityError(
              'conflict',
              'This set changed on another device. Review the latest entry before correcting it.'
            );
        }
        throw error;
      }
    },
  };
}
