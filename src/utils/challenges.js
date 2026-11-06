/** Annual configuration is additive; legacy writes are not routed here yet. */
export const CHALLENGES = Object.freeze({
  2027: Object.freeze({
    year: 2027,
    timeZone: 'America/Toronto',
    training: Object.freeze({ start: '2027-01-01', end: '2027-02-02' }),
    official: Object.freeze({ start: '2027-02-03', end: '2027-02-26' }),
    totalTarget: 2000,
    source: 'https://www.thepushupchallenge.ca/how-it-works',
    // Organizer confirms Sundays as rest days; other daily targets are unpublished.
    dailyTargets: Object.freeze({
      '2027-02-07': 0,
      '2027-02-14': 0,
      '2027-02-21': 0,
    }),
  }),
});

export function getChallenge(year) {
  return Object.hasOwn(CHALLENGES, year) ? CHALLENGES[year] : null;
}

export function isLocalDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Date-only values are already local dates, never parse them as UTC instants. */
export function toLocalDate(instant, timeZone) {
  if (typeof timeZone !== 'string' || !timeZone) throw new RangeError('Explicit timezone required');
  new Intl.DateTimeFormat('en-CA', { timeZone });
  if (isLocalDate(instant)) return instant;
  if (
    !(instant instanceof Date) &&
    typeof instant !== 'number' &&
    !(typeof instant === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(instant))
  ) {
    throw new RangeError('Expected a valid local date or an unambiguous instant');
  }
  if (typeof instant === 'string' && !isLocalDate(instant.slice(0, 10)))
    throw new RangeError('Invalid instant calendar date');
  const date = new Date(instant);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid instant');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

const inWindow = (date, window) => window && date >= window.start && date <= window.end;

export function validateChallenge(challenge) {
  if (!Number.isInteger(challenge?.year) || challenge.year < 1 || challenge.year > 9999)
    throw new RangeError('Invalid challenge year');
  if (typeof challenge.timeZone !== 'string' || !challenge.timeZone)
    throw new RangeError('Explicit timezone required');
  new Intl.DateTimeFormat('en-CA', { timeZone: challenge.timeZone });
  for (const window of [challenge.official, challenge.training].filter(Boolean)) {
    if (
      !isLocalDate(window.start) ||
      !isLocalDate(window.end) ||
      window.start > window.end ||
      Number(window.start.slice(0, 4)) !== challenge.year ||
      Number(window.end.slice(0, 4)) !== challenge.year
    )
      throw new RangeError('Invalid challenge window');
  }
  if (!challenge.official) throw new RangeError('Official window required');
  if (
    challenge.training &&
    challenge.training.start <= challenge.official.end &&
    challenge.training.end >= challenge.official.start
  )
    throw new RangeError('Training and official windows overlap');
  if (!Number.isInteger(challenge.totalTarget) || challenge.totalTarget <= 0)
    throw new RangeError('Invalid total target');
  for (const [date, target] of Object.entries(challenge.dailyTargets ?? {})) {
    if (!isLocalDate(date) || !inWindow(date, challenge.official))
      throw new RangeError('Daily target outside official window');
    if (!Number.isInteger(target) || target < 0) throw new RangeError('Invalid daily target');
  }
  const days =
    (Date.parse(challenge.official.end) - Date.parse(challenge.official.start)) / 86400000 + 1;
  const targets = Object.values(challenge.dailyTargets ?? {});
  if (
    targets.length === days &&
    targets.reduce((sum, target) => sum + target, 0) !== challenge.totalTarget
  )
    throw new RangeError('Complete schedule must sum to total target');
  return challenge;
}

export function getChallengeDay(challenge, instant) {
  validateChallenge(challenge);
  const localDate = toLocalDate(instant, challenge.timeZone);
  const phase = inWindow(localDate, challenge.official)
    ? 'OFFICIAL'
    : inWindow(localDate, challenge.training)
      ? 'TRAINING'
      : 'OFF_SEASON';
  const dailyTarget = phase === 'OFFICIAL' ? (challenge.dailyTargets?.[localDate] ?? null) : null;
  return {
    challengeYear: challenge.year,
    localDate,
    timeZone: challenge.timeZone,
    phase,
    dailyTarget,
    scheduleStatus:
      phase !== 'OFFICIAL' ? 'NOT_APPLICABLE' : dailyTarget === null ? 'PENDING' : 'CONFIRMED',
    isRestDay: dailyTarget === null ? null : dailyTarget === 0,
  };
}
