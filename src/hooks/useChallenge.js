import { useCallback, useEffect, useState } from 'react';
import {
  createChallengeModel,
  DEFAULT_TIME_ZONE,
  isChallengeYear,
} from '../utils/challengeModel.js';
import { toLocalDate } from '../utils/challenges.js';

const PREFS_KEY = 'pushup:challenge-preferences:v1';
const readPreferences = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    toLocalDate(0, stored.timeZone || DEFAULT_TIME_ZONE);
    return {
      timeZone: stored.timeZone || DEFAULT_TIME_ZONE,
      trainingGoal:
        Number.isSafeInteger(stored.trainingGoal) && stored.trainingGoal > 0
          ? stored.trainingGoal
          : null,
    };
  } catch {
    return { timeZone: DEFAULT_TIME_ZONE, trainingGoal: null };
  }
};

/** Calendar selection can be controlled by App to avoid a data-subscription cycle. */
export function useChallenge({
  records = [],
  now,
  selectedYear: controlledYear,
  onYearChange,
  availableYears = [],
} = {}) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [clock, setClock] = useState(() => Date.now());
  const [year, setYear] = useState(() =>
    Number(toLocalDate(now ?? clock, preferences.timeZone).slice(0, 4))
  );
  useEffect(() => {
    if (now !== undefined) return;
    const refresh = () => setClock(Date.now());
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [now]);
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
    } catch {
      /* Preferences are optional, never activity persistence. */
    }
  }, [preferences]);
  const setSelectedYear = (next) => {
    const value = Number(next);
    if (!isChallengeYear(value)) return;
    if (controlledYear !== undefined) onYearChange?.(value);
    else setYear(value);
  };
  const setTimeZone = useCallback((timeZone) => {
    toLocalDate(0, timeZone);
    setPreferences((previous) => ({ ...previous, timeZone }));
  }, []);
  const setTrainingGoal = useCallback((goal) => {
    const value = goal === '' || goal === null ? null : Number(goal);
    if (value !== null && (!Number.isSafeInteger(value) || value <= 0)) return;
    setPreferences((previous) => ({ ...previous, trainingGoal: value }));
  }, []);
  return {
    ...createChallengeModel({
      records,
      year: controlledYear ?? year,
      timeZone: preferences.timeZone,
      now: now ?? clock,
      availableYears,
    }),
    setSelectedYear,
    trainingGoal: preferences.trainingGoal,
    setTrainingGoal,
    setTimeZone,
  };
}
