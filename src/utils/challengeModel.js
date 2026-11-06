import {
  CHALLENGES,
  getChallenge,
  getChallengeDay,
  isLocalDate,
  toLocalDate,
} from './challenges.js';
import { normalizeLegacyActivity } from './activity.js';

export const DEFAULT_TIME_ZONE = 'America/Toronto';
const PHASES = new Set(['TRAINING', 'OFFICIAL', 'OFF_SEASON']);
export const isChallengeYear = (year) => Number.isInteger(year) && year >= 1000 && year <= 9999;

export function classifyChallengeDate(localDate, timeZone = DEFAULT_TIME_ZONE) {
  if (!isLocalDate(localDate)) throw new RangeError('Invalid activity date');
  const year = Number(localDate.slice(0, 4));
  const configured = getChallenge(year);
  if (configured) return getChallengeDay({ ...configured, timeZone }, localDate);
  return {
    challengeYear: year,
    localDate,
    timeZone,
    phase: 'OFF_SEASON',
    dailyTarget: null,
    scheduleStatus: 'UNCONFIGURED',
    isRestDay: null,
  };
}

/** Explicit read-only adapter for a fixed export, never a live mutable array. */
export function readLegacyExport({ logs, sourceId, ownerUid, timeZone = DEFAULT_TIME_ZONE }) {
  if (!Array.isArray(logs)) throw new TypeError('Export logs must be an array');
  const records = [];
  const quarantine = [];
  logs.forEach((log, index) => {
    const result = normalizeLegacyActivity(log, {
      sourceId,
      ownerUid,
      timeZone,
      index,
      classifyDate: (date) => classifyChallengeDate(date, timeZone),
    });
    if (result.record) records.push(result.record);
    else quarantine.push({ index, reason: result.reason, original: log });
  });
  return { records, quarantine };
}

/** Records must already be owner-scoped by the persistence adapter. */
export function createChallengeModel({
  records = [],
  year,
  timeZone = DEFAULT_TIME_ZONE,
  now = new Date(),
  availableYears = [],
}) {
  const today = toLocalDate(now, timeZone);
  const currentYear = Number(today.slice(0, 4));
  const selectedYear = year ?? currentYear;
  if (!isChallengeYear(selectedYear)) throw new RangeError('Invalid selected year');
  const configured = getChallenge(selectedYear);
  const challenge = configured ? { ...configured, timeZone } : null;
  // A future/archive year uses today's month/day when valid; it is never writable.
  const viewDate = `${selectedYear}${today.slice(4)}`;
  const date = isLocalDate(viewDate) ? viewDate : `${selectedYear}-02-28`;
  const day = challenge ? getChallengeDay(challenge, date) : classifyChallengeDate(date, timeZone);
  const byId = new Map();
  const conflicting = new Set();
  let rejected = 0;
  for (const record of records) {
    if (
      record?.schemaVersion !== 2 ||
      !record.id ||
      typeof record.id !== 'string' ||
      !isChallengeYear(record.challengeYear) ||
      !isLocalDate(record.localDate) ||
      Number(record.localDate.slice(0, 4)) !== record.challengeYear ||
      !Number.isSafeInteger(record.amount) ||
      record.amount <= 0 ||
      !PHASES.has(record.phase) ||
      record.deleted
    ) {
      rejected += 1;
      continue;
    }
    const previous = byId.get(record.id);
    if (
      previous &&
      (previous.localDate !== record.localDate ||
        previous.amount !== record.amount ||
        previous.phase !== record.phase ||
        previous.challengeYear !== record.challengeYear)
    )
      conflicting.add(record.id);
    byId.set(record.id, record);
  }
  const yearRecords = [...byId.values()].filter(
    (record) => record.challengeYear === selectedYear && !conflicting.has(record.id)
  );
  const byDate = {};
  const summary = {
    total: 0,
    official: 0,
    training: 0,
    offSeason: 0,
    legacy: 0,
    todayTotal: 0,
    activeDays: 0,
    byDate,
    rejected,
    conflictingIds: [...conflicting].sort(),
  };
  for (const record of yearRecords) {
    summary.total += record.amount;
    byDate[record.localDate] = (byDate[record.localDate] ?? 0) + record.amount;
    // Unconfigured historical editions retain provenance; do not assert official credit.
    if (record.provenance && !challenge) summary.legacy += record.amount;
    else if (
      record.phase === 'OFFICIAL' &&
      challenge &&
      record.localDate >= challenge.official.start &&
      record.localDate <= challenge.official.end
    )
      summary.official += record.amount;
    else if (
      record.phase === 'TRAINING' &&
      challenge?.training &&
      record.localDate >= challenge.training.start &&
      record.localDate <= challenge.training.end
    )
      summary.training += record.amount;
    else summary.offSeason += record.amount;
  }
  summary.todayTotal = byDate[today] ?? 0;
  summary.activeDays = Object.keys(byDate).length;
  const years = [
    ...new Set([
      currentYear,
      ...Object.keys(CHALLENGES).map(Number),
      ...availableYears.filter(isChallengeYear),
      ...records.map((record) => record?.challengeYear).filter(isChallengeYear),
      selectedYear,
    ]),
  ].sort((a, b) => b - a);
  return {
    selectedYear,
    years,
    challenge,
    today,
    day,
    summary,
    yearRecords,
    canLog: selectedYear === currentYear,
    timeZone,
  };
}

export function getMonthActivity(model, month) {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('Invalid month');
  const prefix = `${model.selectedYear}-${String(month).padStart(2, '0')}-`;
  const records = model.yearRecords.filter((record) => record.localDate.startsWith(prefix));
  return {
    records,
    total: records.reduce((sum, record) => sum + record.amount, 0),
    byDate: Object.fromEntries(
      Object.entries(model.summary.byDate).filter(([date]) => date.startsWith(prefix))
    ),
  };
}
