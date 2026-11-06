import { classifyChallengeDate } from './challengeModel.js';
import { isLocalDate } from './challenges.js';

const step = (date, days) => {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
};

/**
 * Consecutive active days ending today (or yesterday while today is still empty).
 * Verified rest days (official Sundays) never break a streak and are not counted.
 * Only the loaded year's activity is visible, so a streak never reaches back past 1 January.
 */
export function computeStreak(byDate, today, isRestDay = defaultIsRestDay) {
  if (!isLocalDate(today)) return 0;
  const yearStart = `${today.slice(0, 4)}-01-01`;
  let streak = 0;
  let cursor = (byDate[today] ?? 0) > 0 ? today : step(today, -1);
  while (cursor >= yearStart) {
    if ((byDate[cursor] ?? 0) > 0) streak += 1;
    else if (!isRestDay(cursor)) break;
    cursor = step(cursor, -1);
  }
  return streak;
}

function defaultIsRestDay(date) {
  return classifyChallengeDate(date).isRestDay === true;
}
