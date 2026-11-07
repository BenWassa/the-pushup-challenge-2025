// Fictional, isolated demo data for visual review: `?mode=demo&fixture=feb-10-2027`.
// Only the in-memory demo repository reads it (no Firestore), so it never touches real data.
// Every day of the 2027 challenge (3–26 February) with two sets: 50 + 34 = 84 reps/day, 2,016 total.
const FINISHED_SETS = Array.from({ length: 24 }, (_, day) => {
  const date = `2027-02-${String(day + 3).padStart(2, '0')}`;
  return [
    [date, 50],
    [date, 34],
  ];
}).flat();

export const DEMO_FIXTURES = {
  'feb-10-2027': {
    label: 'Mid-challenge',
    description: 'Wed 10 Feb 2027 · official phase · 445 reps',
    year: 2027,
    // 3:00 pm in Toronto on Wednesday 10 February 2027.
    now: Date.UTC(2027, 1, 10, 20, 0, 0),
    // [date, amount] in the order they were logged. Official total: 385 + 60 = 445.
    sets: [
      ['2027-01-25', 40],
      ['2027-01-29', 35],
      ['2027-02-01', 30],
      ['2027-02-03', 50],
      ['2027-02-04', 45],
      ['2027-02-05', 55],
      ['2027-02-06', 60],
      ['2027-02-08', 70],
      ['2027-02-09', 60],
      ['2027-02-09', 45],
      ['2027-02-10', 25],
      ['2027-02-10', 15],
      ['2027-02-10', 20],
    ],
  },
  // Training phase: 3:00 pm in Toronto on Friday 15 January 2027. Training total: 130.
  'jan-15-2027': {
    label: 'Training phase',
    description: 'Fri 15 Jan 2027 · before the challenge · 130 reps',
    year: 2027,
    now: Date.UTC(2027, 0, 15, 20, 0, 0),
    sets: [
      ['2027-01-08', 30],
      ['2027-01-12', 50],
      ['2027-01-14', 20],
      ['2027-01-15', 30],
    ],
  },
  // Off-season (no 2026 edition): 3:00 pm in Toronto on Friday 6 November 2026. Total: 140.
  'nov-6-2026': {
    label: 'Off-season',
    description: 'Fri 6 Nov 2026 · no 2026 edition · 140 reps',
    year: 2026,
    now: Date.UTC(2026, 10, 6, 20, 0, 0),
    sets: [
      ['2026-10-30', 40],
      ['2026-11-02', 30],
      ['2026-11-04', 25],
      ['2026-11-05', 45],
    ],
  },
  // First official day with nothing logged yet: 3:00 pm in Toronto on Wednesday 3 February 2027.
  'feb-3-2027': {
    label: 'Day one, nothing logged',
    description: 'Wed 3 Feb 2027 · official phase · 0 reps',
    year: 2027,
    now: Date.UTC(2027, 1, 3, 20, 0, 0),
    sets: [],
  },
  // Last official day with the 2,000 target passed: 3:00 pm in Toronto on Friday 26 February 2027.
  'feb-26-2027': {
    label: 'Challenge complete',
    description: 'Fri 26 Feb 2027 · last day · 2,016 reps',
    year: 2027,
    now: Date.UTC(2027, 1, 26, 20, 0, 0),
    sets: FINISHED_SETS,
  },
};

// Sentinel for the picker's "live clock" choice; overrides a VITE_DEMO_FIXTURE default.
export const LIVE_FIXTURE = 'live';

export function findDemoFixture(name) {
  return name && Object.hasOwn(DEMO_FIXTURES, name) ? DEMO_FIXTURES[name] : null;
}

// `?fixture=` wins over the `VITE_DEMO_FIXTURE` env default (used by `npm run dev:demo`).
export function getDemoFixtureName() {
  if (typeof window === 'undefined') return null;
  const fromQuery = new URLSearchParams(window.location.search).get('fixture');
  if (fromQuery === LIVE_FIXTURE) return null;
  if (findDemoFixture(fromQuery)) return fromQuery;
  const fromEnv = import.meta.env?.VITE_DEMO_FIXTURE;
  return findDemoFixture(fromEnv) ? fromEnv : null;
}

export function getDemoFixture() {
  return findDemoFixture(getDemoFixtureName());
}
