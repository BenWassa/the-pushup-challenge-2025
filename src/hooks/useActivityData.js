import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createActivityRepository,
  createAddOperation,
  createChangeOperation,
  recordAtRevision,
} from '../data/activityRepository.js';
import { journalKey, readPending, writePending, clearPending } from '../data/activityJournal.js';
import { CHALLENGES, toLocalDate } from '../utils/challenges.js';
import { createMemoryRepository } from '../data/memoryRepository.js';

const localEmulatorEnabled = () =>
  import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const journalStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
const friendlyError = (error) => {
  if (error?.code === 'conflict' || error?.code?.startsWith('invalid-')) return error.message;
  if (error?.code === 'uncertain')
    return 'Confirmation is taking longer than expected. Retry the same set safely; do not add it again.';
  if (error?.code === 'permission-denied')
    return 'This account cannot save activity. Your set has not been confirmed.';
  if (error?.code === 'unavailable' || error?.code === 'offline')
    return 'You are offline. Reconnect and retry the same set.';
  return 'Activity could not be confirmed. Retry when your connection is available.';
};

export function useActivityData({
  db,
  user,
  isDemoMode,
  year,
  timeZone = 'America/Toronto',
  now, // fixed clock for fictional demo fixtures only; real sessions use the current time
}) {
  const ownerUid = user?.uid;
  const enabled =
    isDemoMode || localEmulatorEnabled() || import.meta.env.VITE_ENABLE_V2_CLOUD === 'true';
  const pendingKey = journalKey(db?.app?.options?.projectId || 'demo', ownerUid || '', year);
  const repository = useMemo(() => {
    if (!ownerUid || !enabled || (!isDemoMode && !db)) return null;
    return isDemoMode
      ? createMemoryRepository(ownerUid, year)
      : createActivityRepository(db, ownerUid, year);
  }, [db, ownerUid, isDemoMode, year, enabled]);
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);
  const [state, setState] = useState({
    scope: null,
    records: [],
    loading: true,
    readError: false,
    error: '',
    saveState: 'idle',
    pendingOperation: null,
  });
  const generation = useRef(0);
  const busy = useRef(false);
  const pending = useRef(null);
  const recordsRef = useRef([]);
  useEffect(() => {
    const token = ++generation.current;
    busy.current = false;
    pending.current =
      !isDemoMode && ownerUid ? readPending(journalStorage(), pendingKey, ownerUid, year) : null;
    recordsRef.current = [];
    setState({
      scope: repository,
      records: [],
      loading: Boolean(repository),
      readError: false,
      error: pending.current
        ? 'An earlier change has not been confirmed. Retry it safely or discard the retry.'
        : '',
      saveState: pending.current ? 'error' : 'idle',
      pendingOperation: pending.current,
    });
    if (!repository) return undefined;
    const unsubscribe = repository.subscribe(
      (records) => {
        if (generation.current !== token) return;
        recordsRef.current = records;
        if (
          pending.current &&
          records.some((record) => record.lastOperationId === pending.current.operationId)
        ) {
          if (!isDemoMode) clearPending(journalStorage(), pendingKey, pending.current.operationId);
          pending.current = null;
          setState((current) => ({
            ...current,
            error: '',
            saveState: 'saved',
            pendingOperation: null,
          }));
        }
        setState((current) => ({ ...current, records, loading: false, readError: false }));
      },
      (error) => {
        if (generation.current !== token) return;
        setState((current) => ({
          ...current,
          loading: false,
          readError: true,
          error: friendlyError(error),
        }));
      }
    );
    return () => {
      generation.current += 1;
      unsubscribe();
    };
  }, [repository, isDemoMode, ownerUid, year, pendingKey, subscriptionVersion]);

  const canWrite =
    Boolean(repository) &&
    state.scope === repository &&
    !state.loading &&
    !state.readError &&
    year === Number(toLocalDate(now ?? new Date(), timeZone).slice(0, 4));
  const execute = useCallback(
    async (operation) => {
      if (!repository || busy.current) return false;
      busy.current = true;
      const token = generation.current;
      pending.current = operation;
      setState((current) => ({
        ...current,
        error: '',
        saveState: 'saving',
        pendingOperation: operation,
      }));
      let confirmationTimer;
      try {
        if (!isDemoMode) writePending(journalStorage(), pendingKey, ownerUid, year, operation);
        if (!isDemoMode && typeof navigator !== 'undefined' && !navigator.onLine)
          throw Object.assign(new Error('offline'), { code: 'offline' });
        await Promise.race([
          repository.execute(operation),
          new Promise((_, reject) => {
            confirmationTimer = setTimeout(
              () => reject(Object.assign(new Error('unconfirmed'), { code: 'uncertain' })),
              15000
            );
          }),
        ]);
        if (!isDemoMode) clearPending(journalStorage(), pendingKey, operation.operationId);
        if (generation.current !== token) return false;
        pending.current = null;
        setState((current) => ({
          ...current,
          error: '',
          saveState: 'saved',
          pendingOperation: null,
        }));
        return true;
      } catch (error) {
        if (generation.current !== token) return false;
        if (recordsRef.current.some((record) => record.lastOperationId === operation.operationId))
          return true;
        setState((current) => ({
          ...current,
          error: friendlyError(error),
          saveState: 'error',
          pendingOperation: operation,
        }));
        return false;
      } finally {
        clearTimeout(confirmationTimer);
        if (generation.current === token) busy.current = false;
      }
    },
    [repository, isDemoMode, pendingKey, ownerUid, year]
  );

  const prepare = useCallback(
    async (factory) => {
      if (!canWrite || busy.current || pending.current) return false;
      try {
        return await execute(factory());
      } catch (error) {
        setState((current) => ({ ...current, error: friendlyError(error), saveState: 'error' }));
        return false;
      }
    },
    [canWrite, execute]
  );
  const add = useCallback(
    (input) =>
      prepare(() =>
        createAddOperation({ ...input, timeZone: input.timeZone || timeZone }, ownerUid, year)
      ),
    [prepare, ownerUid, year, timeZone]
  );
  const edit = useCallback(
    (id, amount, viewedRevision) =>
      prepare(() =>
        createChangeOperation(
          'edit',
          recordAtRevision(recordsRef.current, id, viewedRevision),
          amount
        )
      ),
    [prepare]
  );
  const remove = useCallback(
    (id, viewedRevision) =>
      prepare(() =>
        createChangeOperation('remove', recordAtRevision(recordsRef.current, id, viewedRevision))
      ),
    [prepare]
  );
  const retry = useCallback(() => {
    if (state.readError && repository) {
      setSubscriptionVersion((value) => value + 1);
      return Promise.resolve(true);
    }
    if (pending.current) return canWrite ? execute(pending.current) : Promise.resolve(false);
    if (!repository) return Promise.resolve(false);
    setSubscriptionVersion((value) => value + 1);
    return Promise.resolve(true);
  }, [execute, canWrite, repository, state.readError]);
  const discardPending = useCallback(() => {
    if (busy.current) return;
    if (!isDemoMode && pending.current)
      clearPending(journalStorage(), pendingKey, pending.current.operationId);
    pending.current = null;
    setState((current) => ({ ...current, pendingOperation: null, error: '', saveState: 'idle' }));
  }, [isDemoMode, pendingKey]);
  return {
    ...state,
    ...(state.scope === repository
      ? {}
      : {
          records: [],
          loading: Boolean(repository),
          error: '',
          saveState: 'idle',
          pendingOperation: null,
        }),
    add,
    edit,
    remove,
    retry,
    discardPending,
    canWrite,
    years: [
      ...new Set([
        ...Object.keys(CHALLENGES).map(Number),
        ...[0, 1, 2].map(
          (offset) => Number(toLocalDate(new Date(), timeZone).slice(0, 4)) - offset
        ),
      ]),
    ].sort((a, b) => b - a),
    legacyHistoryPending: !isDemoMode,
    blockedReason: !enabled
      ? 'Cloud updates are awaiting release approval. Existing history has not been migrated.'
      : !canWrite
        ? 'Archived and future years are read-only.'
        : '',
  };
}
