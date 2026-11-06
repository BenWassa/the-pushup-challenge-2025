/** Highest confirmed day; ties use the earliest calendar date. Empty years have no best day. */
export function bestDay(byDate) {
  return (
    Object.entries(byDate)
      .filter(([, total]) => total > 0)
      .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
      .map(([date, total]) => ({ date, total }))[0] ?? null
  );
}
