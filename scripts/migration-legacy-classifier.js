// Unconfigured past organizer schedules are not reconstructed from modern dates.
// Original season labels remain in each immutable entry's provenance and report.
export const classifyDate = (localDate) => ({
  challengeYear: Number(localDate.slice(0, 4)),
  phase: 'OFF_SEASON',
});
