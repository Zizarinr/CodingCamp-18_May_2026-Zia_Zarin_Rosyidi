/**
 * GreetingModule — testable ES module export.
 * Exposes the pure functions from GreetingModule for use in tests.
 * The full GreetingModule (with init/tick/setName) lives inside js/app.js.
 */

/**
 * Pure function: map hour (0–23) to a greeting phrase.
 * @param {number} hour  Integer in [0, 23]
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) return 'Good Morning';
  if (hour >= 12 && hour <= 17) return 'Good Afternoon';
  if (hour >= 18 && hour <= 20) return 'Good Evening';
  return 'Good Night'; // 21–23 and 0–4
}

/**
 * Pure function: combine greeting phrase with optional user name.
 * @param {number} hour  Integer in [0, 23]
 * @param {string|null} name
 * @returns {string}
 */
function buildGreeting(hour, name) {
  var phrase = getGreeting(hour);
  if (name && name.trim().length > 0) {
    return phrase + ', ' + name;
  }
  return phrase;
}

/**
 * Pure function: format a Date as HH:MM:SS (zero-padded).
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  var hh = String(date.getHours()).padStart(2, '0');
  var mm = String(date.getMinutes()).padStart(2, '0');
  var ss = String(date.getSeconds()).padStart(2, '0');
  return hh + ':' + mm + ':' + ss;
}

/**
 * Pure function: format a Date as "Weekday, DD Month YYYY".
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  var weekday = weekdays[date.getDay()];
  var day = String(date.getDate()).padStart(2, '0');
  var month = months[date.getMonth()];
  var year = date.getFullYear();
  return weekday + ', ' + day + ' ' + month + ' ' + year;
}

/**
 * Testable setName logic (pure validation + storage interaction).
 * Validates the name and returns an action descriptor so tests can verify
 * behaviour without needing a live DOM.
 *
 * @param {string} name  Raw input value.
 * @param {{ get: Function, set: Function, remove: Function }} storage
 * @returns {{ action: 'save'|'remove'|'reject', name?: string, error?: string }}
 */
function setNameLogic(name, storage) {
  var trimmed = (typeof name === 'string') ? name.trim() : '';

  if (trimmed.length === 0) {
    storage.remove('username');
    return { action: 'remove' };
  }

  if (trimmed.length > 50) {
    return { action: 'reject', error: 'Name must be 50 characters or fewer.' };
  }

  storage.set('username', trimmed);
  return { action: 'save', name: trimmed };
}

export { getGreeting, buildGreeting, formatTime, formatDate, setNameLogic };
