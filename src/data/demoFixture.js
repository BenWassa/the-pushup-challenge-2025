// Fictional, isolated demo data for visual review: `?mode=demo&fixture=feb-10-2027`.
// Only the in-memory demo repository reads it (no Firestore), so it never touches real data.
export const DEMO_FIXTURES = {
  'feb-10-2027': {
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
    year: 2026,
    now: Date.UTC(2026, 10, 6, 20, 0, 0),
    sets: [
      ['2026-10-30', 40],
      ['2026-11-02', 30],
      ['2026-11-04', 25],
      ['2026-11-05', 45],
    ],
  },
};

export function findDemoFixture(name) {
  return name && Object.hasOwn(DEMO_FIXTURES, name) ? DEMO_FIXTURES[name] : null;
}

// `?fixture=` wins over the `VITE_DEMO_FIXTURE` env default (used by `npm run dev:demo`).
export function getDemoFixture() {
  if (typeof window === 'undefined') return null;
  const fromQuery = new URLSearchParams(window.location.search).get('fixture');
  return findDemoFixture(fromQuery) || findDemoFixture(import.meta.env?.VITE_DEMO_FIXTURE);
}
