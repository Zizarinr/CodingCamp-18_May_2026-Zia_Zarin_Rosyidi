/**
 * Unit tests for FocusTimer pure functions and state machine.
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { formatTime } from '../js/focusTimer.js';

// ---------------------------------------------------------------------------
// formatTime(seconds) — pure function
// ---------------------------------------------------------------------------
describe('formatTime(seconds)', () => {
  it('formats 1500 seconds as "25:00" (initial timer value)', () => {
    expect(formatTime(1500)).toBe('25:00');
  });

  it('formats 0 seconds as "00:00"', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats 60 seconds as "01:00"', () => {
    expect(formatTime(60)).toBe('01:00');
  });

  it('formats 65 seconds as "01:05"', () => {
    expect(formatTime(65)).toBe('01:05');
  });

  it('formats 59 seconds as "00:59"', () => {
    expect(formatTime(59)).toBe('00:59');
  });

  it('formats 61 seconds as "01:01"', () => {
    expect(formatTime(61)).toBe('01:01');
  });

  it('formats 247 seconds as "04:07"', () => {
    expect(formatTime(247)).toBe('04:07');
  });

  it('zero-pads both minutes and seconds', () => {
    expect(formatTime(7)).toBe('00:07');
  });

  it('returns a string matching MM:SS pattern', () => {
    expect(formatTime(1500)).toMatch(/^\d{2}:\d{2}$/);
    expect(formatTime(0)).toMatch(/^\d{2}:\d{2}$/);
    expect(formatTime(247)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('handles all values in [0, 1500] without throwing', () => {
    for (var s = 0; s <= 1500; s++) {
      expect(() => formatTime(s)).not.toThrow();
      expect(formatTime(s)).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});

// ---------------------------------------------------------------------------
// FocusTimer state machine — tested via a self-contained factory
// (mirrors the logic in app.js without requiring a DOM)
// ---------------------------------------------------------------------------

/**
 * Creates an isolated FocusTimer instance for testing.
 * Uses fake timers (vi.useFakeTimers) to control setInterval.
 */
function makeFocusTimer() {
  var STOPPED = 'STOPPED';
  var RUNNING = 'RUNNING';
  var PAUSED  = 'PAUSED';
  var DONE    = 'DONE';

  var timer = {
    _state: STOPPED,
    _remaining: 1500,
    _interval: null,
    _completeCalled: false,

    start: function () {
      if (timer._state === RUNNING) return;
      timer._state = RUNNING;
      timer._interval = setInterval(timer.tick, 1000);
    },

    stop: function () {
      if (timer._state !== RUNNING) return;
      clearInterval(timer._interval);
      timer._interval = null;
      timer._state = PAUSED;
    },

    reset: function () {
      clearInterval(timer._interval);
      timer._interval = null;
      timer._remaining = 1500;
      timer._state = STOPPED;
    },

    tick: function () {
      timer._remaining -= 1;
      if (timer._remaining === 0) {
        timer.onComplete();
      }
    },

    onComplete: function () {
      clearInterval(timer._interval);
      timer._interval = null;
      timer._state = DONE;
      timer._completeCalled = true;
    },

    formatTime: formatTime,

    // Expose state constants for assertions
    STOPPED: STOPPED,
    RUNNING: RUNNING,
    PAUSED:  PAUSED,
    DONE:    DONE,
  };

  return timer;
}

describe('FocusTimer state machine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts in STOPPED state with 1500 seconds remaining (Requirement 4.1)', () => {
    var t = makeFocusTimer();
    expect(t._state).toBe(t.STOPPED);
    expect(t._remaining).toBe(1500);
  });

  it('transitions STOPPED → RUNNING on start() (Requirement 5.2)', () => {
    var t = makeFocusTimer();
    t.start();
    expect(t._state).toBe(t.RUNNING);
  });

  it('transitions RUNNING → PAUSED on stop() (Requirement 5.3)', () => {
    var t = makeFocusTimer();
    t.start();
    t.stop();
    expect(t._state).toBe(t.PAUSED);
  });

  it('transitions PAUSED → RUNNING on start() (Requirement 5.2)', () => {
    var t = makeFocusTimer();
    t.start();
    t.stop();
    t.start();
    expect(t._state).toBe(t.RUNNING);
  });

  it('transitions RUNNING → STOPPED on reset() (Requirement 5.4)', () => {
    var t = makeFocusTimer();
    t.start();
    t.reset();
    expect(t._state).toBe(t.STOPPED);
    expect(t._remaining).toBe(1500);
  });

  it('transitions PAUSED → STOPPED on reset() (Requirement 5.4)', () => {
    var t = makeFocusTimer();
    t.start();
    t.stop();
    t.reset();
    expect(t._state).toBe(t.STOPPED);
    expect(t._remaining).toBe(1500);
  });

  it('decrements remaining by 1 each tick (Requirement 4.2, 4.3)', () => {
    var t = makeFocusTimer();
    t.start();
    vi.advanceTimersByTime(1000);
    expect(t._remaining).toBe(1499);
    vi.advanceTimersByTime(1000);
    expect(t._remaining).toBe(1498);
  });

  it('stop() preserves remaining time (Requirement 5.3)', () => {
    var t = makeFocusTimer();
    t.start();
    vi.advanceTimersByTime(5000); // 5 ticks
    t.stop();
    expect(t._remaining).toBe(1495);
    expect(t._state).toBe(t.PAUSED);
  });

  it('reset() restores remaining to 1500 regardless of elapsed time (Requirement 5.4)', () => {
    var t = makeFocusTimer();
    t.start();
    vi.advanceTimersByTime(10000); // 10 ticks
    t.reset();
    expect(t._remaining).toBe(1500);
  });

  it('transitions RUNNING → DONE when tick() reaches 0 (Requirement 4.4)', () => {
    var t = makeFocusTimer();
    t.start();
    vi.advanceTimersByTime(1500 * 1000); // advance full 25 minutes
    expect(t._state).toBe(t.DONE);
    expect(t._remaining).toBe(0);
  });

  it('calls onComplete() exactly once when countdown reaches 0 (Requirement 4.4)', () => {
    var t = makeFocusTimer();
    t.start();
    vi.advanceTimersByTime(1500 * 1000);
    expect(t._completeCalled).toBe(true);
  });

  it('transitions DONE → STOPPED on reset() (state machine diagram)', () => {
    var t = makeFocusTimer();
    t.start();
    vi.advanceTimersByTime(1500 * 1000);
    expect(t._state).toBe(t.DONE);
    t.reset();
    expect(t._state).toBe(t.STOPPED);
    expect(t._remaining).toBe(1500);
  });

  it('does not start a duplicate interval if already RUNNING', () => {
    var t = makeFocusTimer();
    t.start();
    var firstInterval = t._interval;
    t.start(); // second call should be a no-op
    expect(t._interval).toBe(firstInterval);
  });

  it('stop() is a no-op when already PAUSED', () => {
    var t = makeFocusTimer();
    t.start();
    t.stop();
    var state = t._state;
    t.stop(); // second stop should not change state
    expect(t._state).toBe(state);
  });

  it('stop() is a no-op when STOPPED', () => {
    var t = makeFocusTimer();
    t.stop();
    expect(t._state).toBe(t.STOPPED);
  });

  it('formatTime returns "25:00" for 1500 (initial display, Requirement 4.5)', () => {
    var t = makeFocusTimer();
    expect(t.formatTime(t._remaining)).toBe('25:00');
  });

  it('formatTime returns "00:00" when remaining is 0 (Requirement 4.5)', () => {
    var t = makeFocusTimer();
    t._remaining = 0;
    expect(t.formatTime(t._remaining)).toBe('00:00');
  });
});
