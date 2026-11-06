import { getChallenge, getChallengeDay, toLocalDate } from '../utils/challenges.js';
import {
  applyActivityOperation,
  createAddOperation,
  validateActivity,
} from './activityRepository.js';

// Demo data exists only for this JavaScript page lifetime. Never localStorage or cloud.
const stores = new Map();
export function resetMemoryActivities() {
  stores.clear();
}
export function createMemoryRepository(ownerUid, year) {
  const key = `${ownerUid}:${year}`;
  if (!stores.has(key)) {
    const entries = new Map();
    if (ownerUid === 'demo-user') {
      const now = Date.now();
      const currentYear = Number(toLocalDate(now, 'America/Toronto').slice(0, 4));
      const dates =
        year === currentYear
          ? [now - 86400000, now - 2 * 86400000].map((time) => toLocalDate(time, 'America/Toronto'))
          : [currentYear - 1, currentYear - 2].includes(year)
            ? [`${year}-02-08`, `${year}-02-09`]
            : [];
      dates
        .filter((date) => Number(date.slice(0, 4)) === year)
        .forEach((localDate, index) => {
          const challenge = getChallenge(year);
          const phase = challenge ? getChallengeDay(challenge, localDate).phase : 'OFF_SEASON';
          const operation = createAddOperation(
            {
              amount: 20 + index * 5,
              localDate,
              phase,
              challengeYear: year,
              timeZone: 'America/Toronto',
            },
            ownerUid,
            year,
            `sample-${year}-${index}`,
            Math.min(now, Date.parse(`${localDate}T12:00:00Z`))
          );
          entries.set(operation.id, operation.record);
        });
    }
    stores.set(key, { entries, listeners: new Set() });
  }
  const store = stores.get(key);
  const records = () =>
    [...store.entries.values()].filter((entry) => !entry.deleted).map((entry) => ({ ...entry }));
  return {
    subscribe(onRecords) {
      store.listeners.add(onRecords);
      onRecords(records());
      return () => store.listeners.delete(onRecords);
    },
    async execute(operation) {
      const next = applyActivityOperation(store.entries.get(operation.id), operation);
      validateActivity(next, ownerUid, year);
      store.entries.set(operation.id, next);
      for (const listener of store.listeners) listener(records());
      return next;
    },
  };
}
