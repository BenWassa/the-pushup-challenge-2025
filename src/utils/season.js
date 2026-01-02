// Returns TRAINING for January, OFFICIAL for Feb 5-27, else OFF_SEASON.
export const getSeason = () => {
  const now = new Date();
  const month = now.getMonth();
  const day = now.getDate();

  // January is always training
  if (month === 0) return 'TRAINING';

  // February 5-27 is official challenge
  if (month === 1 && day >= 5 && day <= 27) return 'OFFICIAL';

  return 'OFF_SEASON';
};
