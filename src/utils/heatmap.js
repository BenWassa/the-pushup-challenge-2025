/** Illustrative activity bands, not official daily targets. */
export const HEAT_THRESHOLDS = Object.freeze([1, 20, 50, 100]);

function parseDate(date) {
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || parsed.toISOString().slice(0, 10) !== date) {
    throw new RangeError('Invalid calendar date');
  }
  return parsed;
}

export function buildMonthGrid(year, month) {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError('Invalid year');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Invalid month');
  }
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const first = parseDate(`${prefix}-01`);
  const last = parseDate(`${prefix}-01`);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  return {
    leadingBlanks: first.getUTCDay(),
    days: Array.from({ length: last.getUTCDate() }, (_, index) => ({
      date: `${prefix}-${String(index + 1).padStart(2, '0')}`,
      day: index + 1,
    })),
  };
}

export function heatLevel(count) {
  if (!Number.isFinite(count) || count < 0) return 0;
  return HEAT_THRESHOLDS.filter((threshold) => count >= threshold).length;
}

export function formatDateLong(date, locale = undefined) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDate(date));
}

export function formatMonthTitle(year, month, locale = undefined) {
  const { days } = buildMonthGrid(year, month);
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDate(days[0].date));
}

export function moveDate(date, deltaDays) {
  if (!Number.isInteger(deltaDays)) throw new RangeError('Invalid day offset');
  const parsed = parseDate(date);
  parsed.setUTCDate(parsed.getUTCDate() + deltaDays);
  return parsed.toISOString().slice(0, 10);
}
