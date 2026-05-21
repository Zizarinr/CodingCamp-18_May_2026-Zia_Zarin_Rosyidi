/**
 * Unit tests for GreetingModule pure functions
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2, 3.3, 3.4, 3.5
 */

import { describe, it, expect } from 'vitest';
import { getGreeting, buildGreeting, formatTime, formatDate, setNameLogic } from '../js/greetingModule.js';

// ---------------------------------------------------------------------------
// getGreeting(hour)
// ---------------------------------------------------------------------------
describe('getGreeting(hour)', () => {
  it('returns "Good Morning" for hour 5', () => {
    expect(getGreeting(5)).toBe('Good Morning');
  });

  it('returns "Good Morning" for hour 11', () => {
    expect(getGreeting(11)).toBe('Good Morning');
  });

  it('returns "Good Morning" for a mid-morning hour (8)', () => {
    expect(getGreeting(8)).toBe('Good Morning');
  });

  it('returns "Good Afternoon" for hour 12', () => {
    expect(getGreeting(12)).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" for hour 17', () => {
    expect(getGreeting(17)).toBe('Good Afternoon');
  });

  it('returns "Good Afternoon" for a mid-afternoon hour (15)', () => {
    expect(getGreeting(15)).toBe('Good Afternoon');
  });

  it('returns "Good Evening" for hour 18', () => {
    expect(getGreeting(18)).toBe('Good Evening');
  });

  it('returns "Good Evening" for hour 20', () => {
    expect(getGreeting(20)).toBe('Good Evening');
  });

  it('returns "Good Evening" for hour 19', () => {
    expect(getGreeting(19)).toBe('Good Evening');
  });

  it('returns "Good Night" for hour 21', () => {
    expect(getGreeting(21)).toBe('Good Night');
  });

  it('returns "Good Night" for hour 23', () => {
    expect(getGreeting(23)).toBe('Good Night');
  });

  it('returns "Good Night" for hour 0 (midnight)', () => {
    expect(getGreeting(0)).toBe('Good Night');
  });

  it('returns "Good Night" for hour 4', () => {
    expect(getGreeting(4)).toBe('Good Night');
  });

  it('returns "Good Night" for hour 1', () => {
    expect(getGreeting(1)).toBe('Good Night');
  });

  it('returns one of the four valid greeting strings for every hour 0–23', () => {
    const valid = new Set(['Good Morning', 'Good Afternoon', 'Good Evening', 'Good Night']);
    for (let h = 0; h <= 23; h++) {
      expect(valid.has(getGreeting(h))).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// buildGreeting(hour, name)
// ---------------------------------------------------------------------------
describe('buildGreeting(hour, name)', () => {
  it('appends name with ", " separator when name is non-empty', () => {
    expect(buildGreeting(9, 'Alex')).toBe('Good Morning, Alex');
  });

  it('returns just the phrase when name is null', () => {
    expect(buildGreeting(9, null)).toBe('Good Morning');
  });

  it('returns just the phrase when name is an empty string', () => {
    expect(buildGreeting(9, '')).toBe('Good Morning');
  });

  it('returns just the phrase when name is whitespace-only', () => {
    expect(buildGreeting(9, '   ')).toBe('Good Morning');
  });

  it('appends name for Good Afternoon', () => {
    expect(buildGreeting(14, 'Sam')).toBe('Good Afternoon, Sam');
  });

  it('appends name for Good Evening', () => {
    expect(buildGreeting(19, 'Jordan')).toBe('Good Evening, Jordan');
  });

  it('appends name for Good Night', () => {
    expect(buildGreeting(22, 'Taylor')).toBe('Good Night, Taylor');
  });

  it('returns just the phrase when name is undefined', () => {
    expect(buildGreeting(10, undefined)).toBe('Good Morning');
  });
});

// ---------------------------------------------------------------------------
// formatTime(date)
// ---------------------------------------------------------------------------
describe('formatTime(date)', () => {
  it('formats midnight as 00:00:00', () => {
    const d = new Date(2026, 4, 18, 0, 0, 0); // May 18 2026, 00:00:00
    expect(formatTime(d)).toBe('00:00:00');
  });

  it('formats noon as 12:00:00', () => {
    const d = new Date(2026, 4, 18, 12, 0, 0);
    expect(formatTime(d)).toBe('12:00:00');
  });

  it('zero-pads single-digit hours, minutes, and seconds', () => {
    const d = new Date(2026, 4, 18, 3, 5, 7);
    expect(formatTime(d)).toBe('03:05:07');
  });

  it('formats 23:59:59 correctly', () => {
    const d = new Date(2026, 4, 18, 23, 59, 59);
    expect(formatTime(d)).toBe('23:59:59');
  });

  it('returns a string matching HH:MM:SS pattern', () => {
    const d = new Date(2026, 4, 18, 14, 30, 45);
    expect(formatTime(d)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// formatDate(date)
// ---------------------------------------------------------------------------
describe('formatDate(date)', () => {
  it('formats Monday, 18 May 2026 correctly', () => {
    const d = new Date(2026, 4, 18); // May 18 2026 is a Monday
    expect(formatDate(d)).toBe('Monday, 18 May 2026');
  });

  it('zero-pads single-digit day', () => {
    const d = new Date(2026, 4, 5); // May 5 2026
    expect(formatDate(d)).toBe('Tuesday, 05 May 2026');
  });

  it('formats a Sunday correctly', () => {
    const d = new Date(2026, 4, 17); // May 17 2026 is a Sunday
    expect(formatDate(d)).toBe('Sunday, 17 May 2026');
  });

  it('formats January correctly', () => {
    const d = new Date(2026, 0, 1); // January 1 2026 is a Thursday
    expect(formatDate(d)).toBe('Thursday, 01 January 2026');
  });

  it('formats December correctly', () => {
    const d = new Date(2026, 11, 31); // December 31 2026 is a Thursday
    expect(formatDate(d)).toBe('Thursday, 31 December 2026');
  });

  it('returns a string matching "Weekday, DD Month YYYY" pattern', () => {
    const d = new Date(2026, 4, 18);
    expect(formatDate(d)).toMatch(/^[A-Za-z]+, \d{2} [A-Za-z]+ \d{4}$/);
  });
});

// ---------------------------------------------------------------------------
// setNameLogic(name, storage)
// Tests for GreetingModule.setName() validation and storage interaction.
// Validates: Requirements 3.2, 3.3, 3.4, 3.5
// ---------------------------------------------------------------------------

/**
 * Minimal in-memory storage stub for testing setNameLogic without a real DOM.
 */
function makeStorage() {
  const store = new Map();
  return {
    get: (key) => store.has(key) ? store.get(key) : null,
    set: (key, value) => { store.set(key, value); return true; },
    remove: (key) => { store.delete(key); },
    _store: store,
  };
}

describe('setNameLogic(name, storage)', () => {
  it('saves a valid name and returns action "save" (Requirement 3.2)', () => {
    const storage = makeStorage();
    const result = setNameLogic('Alex', storage);
    expect(result.action).toBe('save');
    expect(result.name).toBe('Alex');
    expect(storage.get('username')).toBe('Alex');
  });

  it('trims whitespace before saving (Requirement 3.2)', () => {
    const storage = makeStorage();
    const result = setNameLogic('  Alex  ', storage);
    expect(result.action).toBe('save');
    expect(result.name).toBe('Alex');
    expect(storage.get('username')).toBe('Alex');
  });

  it('removes username from storage when name is empty after trim (Requirement 3.4)', () => {
    const storage = makeStorage();
    storage.set('username', 'Alex'); // pre-populate
    const result = setNameLogic('', storage);
    expect(result.action).toBe('remove');
    expect(storage.get('username')).toBeNull();
  });

  it('removes username from storage when name is whitespace-only (Requirement 3.4)', () => {
    const storage = makeStorage();
    storage.set('username', 'Alex');
    const result = setNameLogic('   ', storage);
    expect(result.action).toBe('remove');
    expect(storage.get('username')).toBeNull();
  });

  it('rejects a name longer than 50 characters (Requirement 3.5)', () => {
    const storage = makeStorage();
    const longName = 'A'.repeat(51);
    const result = setNameLogic(longName, storage);
    expect(result.action).toBe('reject');
    expect(result.error).toBeTruthy();
    expect(storage.get('username')).toBeNull(); // nothing saved
  });

  it('accepts a name of exactly 50 characters (Requirement 3.5 boundary)', () => {
    const storage = makeStorage();
    const maxName = 'B'.repeat(50);
    const result = setNameLogic(maxName, storage);
    expect(result.action).toBe('save');
    expect(result.name).toBe(maxName);
  });

  it('handles null input gracefully (treats as empty → remove)', () => {
    const storage = makeStorage();
    const result = setNameLogic(null, storage);
    expect(result.action).toBe('remove');
  });

  it('handles undefined input gracefully (treats as empty → remove)', () => {
    const storage = makeStorage();
    const result = setNameLogic(undefined, storage);
    expect(result.action).toBe('remove');
  });
});
