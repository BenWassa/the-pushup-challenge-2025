import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyActivityOperation,
  createActivityRepository,
  createAddOperation,
  createChangeOperation,
  recordAtRevision,
} from '../data/activityRepository.js';
import { journalKey, readPending, writePending, clearPending } from '../data/activityJournal.js';
import { createChallengeModel } from '../utils/challengeModel.js';
import { moveDate } from '../utils/heatmap.js';
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

/** An operation is confirmed once the server-confirmed records reflect it. */
const isReflected = (operation, records) =>
  operation.type === 'remove'
    ? !records.some((record) => record.id === operation.id)
    : records.some(
        (record) => record.id === operation.id && record.lastOperationId === operation.operationId
      );

/** Show unconfirmed operations on top of confirmed records so taps feel instant. */
function withOptimistic(records, operations) {
  if (operations.length === 0) return records;
  const byId = new Map(records.map((record) => [record.id, record]));
  for (const operation of operations) {
    try {
      const next = applyActivityOperation(byId.get(operation.id), operation);
      if (next.deleted) byId.delete(operation.id);
      else byId.set(operation.id, next);
    } catch {
      // A stale or conflicting operation is shown as-is by the error flow, never guessed here.
    }
  }
  return [...byId.values()];
}

export function useActivityData({
  db,
  user,
  isDemoMode,
  year,
  timeZone = 'America/Toronto',
  rollingToday,
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
  // Only January windows need an additional owner-scoped, read-only subscription.
  // Never run a second write journal or mix prior-year records into annual totals.
  const previousYear = rollingToday && Number(moveDate(rollingToday, -29).slice(0, 4));
  const previousRepository = useMemo(() => {
    if (
      !repository ||
      previousYear === year ||
      !previousYear ||
      Number(rollingToday.slice(0, 4)) !== year
    )
      return null;
    return isDemoMode
      ? createMemoryRepository(ownerUid, previousYear)
      : createActivityRepository(db, ownerUid, previousYear);
  }, [repository, previousYear, year, rollingToday, isDemoMode, ownerUid, db]);
  const [previous, setPrevious] = useState(null);
  useEffect(() => {
    if (!previousRepository) return undefined;
    let active = true;
    const unsubscribe = previousRepository.subscribe(
      (records) => {
        if (active) setPrevious({ scope: previousRepository, records, error: false });
      },
      () => {
        if (active) setPrevious({ scope: previousRepository, records: [], error: true });
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [previousRepository]);
  const previousByDate =
    previousRepository && previous?.scope === previousRepository && !previous.error
      ? createChallengeModel({
          records: previous.records,
          year: previousYear,
          timeZone,
          now: rollingToday,
        }).summary.byDate
      : {};
  const [subscriptionVersion, setSubscriptionVersion] = useState(0);
  const [state, setState] = useState({
    scope: null,
    records: [],
    loading: true,
    readError: false,
    error: '',
    saveState: 'idle',
    pendingOperation: null,
    optimistic: [],
  });
  const generation = useRef(0);
  const busy = useRef(false);
  const pending = useRef(null);
  // True while an earlier change is unconfirmed after a failure; new taps wait for Retry/Dismiss.
  const failed = useRef(false);
  const queue = useRef(Promise.resolve());
  const recordsRef = useRef([]);
  const viewRef = useRef([]);
  useEffect(() => {
    const token = ++generation.current;
    busy.current = false;
    pending.current =
      !isDemoMode && ownerUid ? readPending(journalStorage(), pendingKey, ownerUid, year) : null;
    recordsRef.current = [];
    viewRef.current = [];
    failed.current = Boolean(pending.current);
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
      optimistic: [],
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
        setState((current) => ({
          ...current,
          records,
          loading: false,
          readError: false,
          optimistic: current.optimistic.filter((operation) => !isReflected(operation, records)),
        }));
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

  const displayRecords = useMemo(
    () => withOptimistic(state.records, state.optimistic),
    [state.records, state.optimistic]
  );
  useEffect(() => {
    viewRef.current = displayRecords;
  }, [displayRecords]);

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
        optimistic: current.optimistic.some((item) => item.operationId === operation.operationId)
          ? current.optimistic
          : [...current.optimistic, operation],
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
        failed.current = false;
        setState((current) => ({
          ...current,
          error: '',
          saveState: 'saved',
          pendingOperation: null,
        }));
        // Keep showing the set until confirmed records catch up; never leave it up for long.
        setTimeout(() => {
          if (generation.current !== token) return;
          setState((current) => ({
            ...current,
            optimistic: current.optimistic.filter(
              (item) => item.operationId !== operation.operationId
            ),
          }));
        }, 5000);
        return true;
      } catch (error) {
        if (generation.current !== token) return false;
        if (recordsRef.current.some((record) => record.lastOperationId === operation.operationId))
          return true;
        failed.current = true;
        // Unconfirmed totals are never claimed: drop everything not yet confirmed.
        setState((current) => ({
          ...current,
          error: friendlyError(error),
          saveState: 'error',
          pendingOperation: operation,
          optimistic: [],
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
    (factory) => {
      if (!canWrite || failed.current) return Promise.resolve(false);
      const token = generation.current;
      let operation;
      try {
        operation = factory(viewRef.current);
      } catch (error) {
        setState((current) => ({ ...current, error: friendlyError(error), saveState: 'error' }));
        return Promise.resolve(false);
      }
      // Show the change immediately; confirmation runs in the background, in tap order.
      setState((current) => ({ ...current, optimistic: [...current.optimistic, operation] }));
      viewRef.current = withOptimistic(viewRef.current, [operation]);
      const result = queue.current.then(() => {
        if (generation.current !== token || failed.current) return false;
        return execute(operation);
      });
      queue.current = result.catch(() => false);
      return result;
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
      prepare((view) =>
        createChangeOperation('edit', recordAtRevision(view, id, viewedRevision), amount)
      ),
    [prepare]
  );
  const remove = useCallback(
    (id, viewedRevision) =>
      prepare((view) =>
        createChangeOperation('remove', recordAtRevision(view, id, viewedRevision))
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
    failed.current = false;
    setState((current) => ({ ...current, pendingOperation: null, error: '', saveState: 'idle' }));
  }, [isDemoMode, pendingKey]);
  return {
    ...state,
    previousByDate,
    previousYearStatus: !previousRepository
      ? null
      : previous?.scope !== previousRepository
        ? 'loading'
        : previous.error
          ? 'error'
          : 'ready',
    records: displayRecords,
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
