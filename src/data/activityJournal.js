import { validateActivity, activityError } from './activityRepository.js';

export function journalKey(projectId, ownerUid, year) {
  return `pushup:v2:pending:${encodeURIComponent(projectId)}:${encodeURIComponent(ownerUid)}:${year}`;
}
export function readPending(storage, key, ownerUid, year) {
  try {
    const value = JSON.parse(storage.getItem(key));
    if (!value || value.ownerUid !== ownerUid || value.year !== year) return null;
    const operation = value.operation;
    if (
      !operation ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(operation.id) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(operation.operationId)
    )
      return null;
    if (operation.type === 'add') {
      validateActivity(operation.record, ownerUid, year);
      if (operation.record.id !== operation.id || operation.operationId !== operation.id)
        return null;
    } else if (
      !['edit', 'remove'].includes(operation.type) ||
      !Number.isInteger(operation.expectedRevision) ||
      operation.expectedRevision < 1 ||
      !Number.isInteger(operation.amount) ||
      operation.amount < 1 ||
      operation.amount > 10000 ||
      !Number.isSafeInteger(operation.updatedAt)
    )
      return null;
    return operation;
  } catch {
    return null;
  }
}
export function writePending(storage, key, ownerUid, year, operation) {
  try {
    storage.setItem(key, JSON.stringify({ ownerUid, year, operation }));
  } catch {
    throw activityError(
      'invalid-journal',
      'Your browser could not retain this set for safe retry. Allow site storage and try again.'
    );
  }
}
export function clearPending(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    /* A stale journal can safely retry the same operation. */
  }
}
