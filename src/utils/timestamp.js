/**
 * Utility functions for handling Firestore timestamps
 * Handles three possible timestamp formats:
 * 1. Firestore Timestamp object (has .toDate() method)
 * 2. JavaScript Date object
 * 3. Milliseconds as number (legacy)
 */

/**
 * Convert any timestamp format to a JavaScript Date
 * @param {*} timestamp - Firestore Timestamp, Date, or milliseconds
 * @returns {Date} JavaScript Date object
 */
export const toDate = (timestamp) => {
  if (!timestamp) return null;

  // Firestore Timestamp has toDate() method
  if (typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // Number (milliseconds) - legacy format
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  console.warn('Unknown timestamp format:', timestamp);
  return null;
};

/**
 * Get date string for comparison (YYYY-M-D format)
 * @param {*} timestamp - Any timestamp format
 * @returns {string} Date string from toDateString()
 */
export const getDateString = (timestamp) => {
  const date = toDate(timestamp);
  return date ? date.toDateString() : null;
};

/**
 * Check if a timestamp is from today
 * @param {*} timestamp - Any timestamp format
 * @returns {boolean}
 */
export const isToday = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return false;
  return date.toDateString() === new Date().toDateString();
};

/**
 * Check if timestamp is valid and not in future
 * @param {*} timestamp - Any timestamp format
 * @returns {boolean}
 */
export const isValidTimestamp = (timestamp) => {
  const date = toDate(timestamp);
  if (!date) return false;
  // Reject timestamps in the future (with 1 hour buffer for clock skew)
  return date.getTime() <= Date.now() + 3600000;
};
