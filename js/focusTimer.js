/**
 * focusTimer.js — testable ES module export.
 * Exposes the pure functions from FocusTimer for use in tests.
 * The full FocusTimer (with init/start/stop/reset/tick/onComplete) lives
 * inside js/app.js as part of the IIFE.
 */

/**
 * Pure function: format a number of seconds as a zero-padded MM:SS string.
 *
 * @param {number} seconds  Non-negative integer in [0, 1500] (or beyond).
 * @returns {string}  e.g. 1500 → "25:00", 65 → "01:05", 0 → "00:00"
 */
function formatTime(seconds) {
  var mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  var ss = String(seconds % 60).padStart(2, '0');
  return mm + ':' + ss;
}

export { formatTime };
