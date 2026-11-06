// Read-only migration helpers. Never writes Firebase or trusts legacy cached totals.
const PHASES = new Set(['TRAINING', 'OFFICIAL', 'OFF_SEASON']);

export const isActivityDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const timestampMillis = (value) => {
  try {
    const date = value instanceof Date ? value : value?.toDate?.();
    const millis = date ? date.getTime() : value;
    return typeof millis === 'number' &&
      Number.isFinite(millis) &&
      Number.isFinite(new Date(millis).getTime())
      ? millis
      : null;
  } catch {
    return null;
  }
};

const dateInZone = (millis, timeZone) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(millis));
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

/** A dry-run conversion: rejected records remain available to the caller unchanged. */
export const normalizeLegacyActivity = (log, options) => {
  const { ownerUid, timeZone, sourceId, index, classifyDate } = options;
  const reject = (reason) => ({ record: null, reason });
  if (!ownerUid || !sourceId || !Number.isInteger(index) || index < 0) return reject('identity');
  if (!Number.isSafeInteger(log?.amount) || log.amount <= 0) return reject('amount');
  let timestampDate;
  const createdAt = timestampMillis(log.timestamp);
  try {
    // Also validates the caller-supplied timezone when a historical date has no timestamp.
    const formatted = dateInZone(createdAt ?? 0, timeZone);
    timestampDate = createdAt === null ? null : formatted;
    if (!timeZone) return reject('timezone');
  } catch {
    return reject('timezone');
  }
  const submitted = log.submitted_date;
  if (submitted !== undefined && !isActivityDate(submitted)) return reject('date');
  if (submitted && timestampDate && submitted !== timestampDate) return reject('conflicting-dates');
  const localDate = submitted || timestampDate;
  if (!isActivityDate(localDate)) return reject('date');
  const classification = classifyDate?.(localDate);
  if (!Number.isInteger(classification?.challengeYear) || !PHASES.has(classification?.phase)) {
    return reject('classification');
  }
  return {
    reason: null,
    record: {
      schemaVersion: 2,
      // Stable only within this immutable source snapshot, never a live array index ID.
      id: `legacy:${encodeURIComponent(sourceId)}:${index}`,
      ownerUid,
      challengeYear: classification.challengeYear,
      phase: classification.phase,
      localDate,
      timeZone,
      amount: log.amount,
      createdAt,
      provenance: { sourceId, index, originalSeason: log.season ?? null },
    },
  };
};

/** Totals derive from records, with contradictory duplicate IDs excluded entirely. */
export const summarizeActivities = (
  records,
  { ownerUid, challengeYear, officialStart, officialEnd }
) => {
  if (
    !ownerUid ||
    !Number.isInteger(challengeYear) ||
    !isActivityDate(officialStart) ||
    !isActivityDate(officialEnd) ||
    officialStart > officialEnd
  ) {
    throw new TypeError('An explicit owner, challenge year and valid official window are required');
  }
  const byId = new Map();
  const conflicts = new Set();
  let rejected = 0;
  for (const record of records) {
    if (
      record?.schemaVersion !== 2 ||
      typeof record.id !== 'string' ||
      !record.id ||
      record.ownerUid !== ownerUid ||
      record.challengeYear !== challengeYear ||
      !isActivityDate(record.localDate) ||
      !PHASES.has(record.phase) ||
      !Number.isSafeInteger(record.amount) ||
      record.amount <= 0
    ) {
      rejected += 1;
      continue;
    }
    const previous = byId.get(record.id);
    if (
      previous &&
      (previous.amount !== record.amount ||
        previous.localDate !== record.localDate ||
        previous.phase !== record.phase ||
        previous.timeZone !== record.timeZone)
    ) {
      conflicts.add(record.id);
    }
    byId.set(record.id, record);
  }
  const totals = { TRAINING: 0, OFFICIAL: 0, OFF_SEASON: 0 };
  const daily = {};
  for (const record of byId.values()) {
    if (conflicts.has(record.id)) continue;
    if (
      record.phase === 'OFFICIAL' &&
      (record.localDate < officialStart || record.localDate > officialEnd)
    ) {
      rejected += 1;
      continue;
    }
    totals[record.phase] += record.amount;
    daily[record.localDate] = (daily[record.localDate] || 0) + record.amount;
  }
  return { totals, daily, rejected, conflictingIds: [...conflicts].sort() };
};
