import { validateActivity, activityError } from './activityRepository.js';

export function journalKey(projectId, ownerUid, year) {
  return `pushup:v2:pending:${encodeURIComponent(projectId)}:${encodeURIComponent(ownerUid)}:${year}`;
}
const parseJournal = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
const operationsIn = (value) => value?.operations || (value?.operation ? [value.operation] : []);
export function readPending(storage, key, ownerUid, year) {
  try {
    const candidates = [];
    for (let index = 0; index < storage.length; index += 1) {
      const candidateKey = storage.key(index);
      if (candidateKey?.startsWith(`${key}:`)) candidates.push(candidateKey);
    }
    candidates.sort();
    const values = [
      ...candidates.map((candidateKey) => parseJournal(storage.getItem(candidateKey))),
      parseJournal(storage.getItem(key)),
    ];
    const operations = values
      .filter((value) => value?.ownerUid === ownerUid && value?.year === year)
      .flatMap(operationsIn);
    for (const operation of operations) {
      if (
        !operation ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(operation.id) ||
        !/^[A-Za-z0-9_-]{1,128}$/.test(operation.operationId)
      )
        continue;
      if (operation.type === 'add') {
        try {
          validateActivity(operation.record, ownerUid, year);
        } catch {
          continue;
        }
        if (operation.record.id !== operation.id || operation.operationId !== operation.id)
          continue;
      } else if (
        !['edit', 'remove'].includes(operation.type) ||
        !Number.isInteger(operation.expectedRevision) ||
        operation.expectedRevision < 1 ||
        !Number.isInteger(operation.amount) ||
        operation.amount < 1 ||
        operation.amount > 10000 ||
        !Number.isSafeInteger(operation.updatedAt)
      )
        continue;
      return operation;
    }
    return null;
  } catch {
    return null;
  }
}
export function writePending(storage, key, ownerUid, year, operation) {
  try {
    // Each operation has its own atomic key: concurrent tabs cannot overwrite a journal slot.
    storage.setItem(
      `${key}:${operation.operationId}`,
      JSON.stringify({ ownerUid, year, operations: [operation] })
    );
  } catch {
    throw activityError(
      'invalid-journal',
      'Your browser could not retain this set for safe retry. Allow site storage and try again.'
    );
  }
}
export function clearPending(storage, key, operationId) {
  try {
    if (!operationId) {
      const keys = [];
      for (let index = 0; index < storage.length; index += 1) {
        const candidateKey = storage.key(index);
        if (candidateKey?.startsWith(`${key}:`)) keys.push(candidateKey);
      }
      keys.forEach((candidateKey) => storage.removeItem(candidateKey));
      storage.removeItem(key);
      return;
    }
    storage.removeItem(`${key}:${operationId}`);
    const previous = parseJournal(storage.getItem(key));
    const operations = operationsIn(previous).filter(
      (operation) => operation.operationId !== operationId
    );
    if (operations.length)
      storage.setItem(key, JSON.stringify({ ...previous, operation: undefined, operations }));
    else storage.removeItem(key);
  } catch {
    /* A stale journal can safely retry the same operation. */
  }
}
