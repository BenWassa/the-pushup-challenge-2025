// Returns TRAINING for January, OFFICIAL for February, else OFF_SEASON.
export const getSeason = () => {
  const now = new Date();
  const month = now.getMonth();
  if (month === 0) return "TRAINING";
  if (month === 1) return "OFFICIAL";
  return "OFF_SEASON";
};
