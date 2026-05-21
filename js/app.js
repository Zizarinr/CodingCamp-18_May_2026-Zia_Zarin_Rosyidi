(function () {
  'use strict';

  // ===========================================================================
  // StorageService
  // Central wrapper around window.localStorage. All modules use this service.
  // Key prefix: 'tld_' (todo-life-dashboard) to avoid collisions.
  // ===========================================================================

  var StorageService = {
    available: false,

    /** Probe localStorage availability; sets StorageService.available. */
    init: function () {},

    /**
     * Read and JSON-parse a value from storage.
     * @param {string} key
     * @returns {*|null} Parsed value, or null on error / missing key.
     */
    get: function (key) {},

    /**
     * JSON-stringify and write a value to storage.
     * @param {string} key
     * @param {*} value
     * @returns {boolean} true on success, false on failure (e.g. QuotaExceededError).
     */
    set: function (key, value) {},

    /**
     * Remove a key from storage.
     * @param {string} key
     */
    remove: function (key) {},

    /** Remove all dashboard keys (those prefixed with 'tld_'). */
    clear: function () {}
  };

  // ===========================================================================
  // ThemeManager
  // Manages the Light / Dark theme toggle.
  // ===========================================================================

  var ThemeManager = {
    /**
     * Read saved theme from storage, apply it, and attach the toggle listener.
     */
    init: function () {
      var saved = StorageService.get('theme');
      var theme = (saved === 'light' || saved === 'dark') ? saved : 'light';
      ThemeManager.apply(theme);

      var btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', function () {
          ThemeManager.toggle();
        });
      }
    },

    /**
     * Set data-theme attribute on <html> and update toggle button state.
     * @param {'light'|'dark'} theme
     */
    apply: function (theme) {
      document.documentElement.setAttribute('data-theme', theme);

      var btn = document.getElementById('theme-toggle');
      if (btn) {
        if (theme === 'dark') {
          btn.textContent = '☀️ Light Mode';
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', 'Toggle light mode');
        } else {
          btn.textContent = '🌙 Dark Mode';
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', 'Toggle dark mode');
        }
      }
    },

    /** Flip the current theme, apply it, and persist to storage. */
    toggle: function () {
      var newTheme = ThemeManager.current() === 'dark' ? 'light' : 'dark';
      ThemeManager.apply(newTheme);
      StorageService.set('theme', newTheme);
    },

    /**
     * Return the currently active theme.
     * @returns {'light'|'dark'}
     */
    current: function () {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
  };

  // ===========================================================================
  // GreetingModule
  // Displays time, date, greeting text, and user name.
  // ===========================================================================

  var GreetingModule = {
    /** Cached username; null means no name set. */
    _name: null,

    /**
     * Read User_Name from storage, render initial time/date/greeting,
     * start the clock interval, and attach the name-form submit listener.
     */
    init: function () {
      // Read saved username from storage
      var saved = StorageService.get('username');
      GreetingModule._name = (typeof saved === 'string' && saved.length > 0) ? saved : null;

      // Render immediately on load (Requirement 1.3)
      var now = new Date();
      var timeEl = document.getElementById('time-display');
      var dateEl = document.getElementById('date-display');
      var greetEl = document.getElementById('greeting-text');

      if (timeEl) timeEl.textContent = GreetingModule.formatTime(now);
      if (dateEl) dateEl.textContent = GreetingModule.formatDate(now);
      if (greetEl) greetEl.textContent = GreetingModule.buildGreeting(now.getHours(), GreetingModule._name);

      // Start 1-second clock interval
      setInterval(GreetingModule.tick, 1000);

      // Wire up the name form submit listener
      var form = document.getElementById('name-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var input = document.getElementById('name-input');
          var errorEl = document.getElementById('name-error');
          var value = input ? input.value : '';
          GreetingModule.setName(value, errorEl);
          // Clear input and return focus (Requirement 3.1 / task spec)
          if (input) {
            input.value = '';
            input.focus();
          }
        });
      }
    },

    /** Called every ~1000 ms; updates time display and greeting text. */
    tick: function () {
      var now = new Date(); // fresh Date each tick — no drift accumulation
      var timeEl = document.getElementById('time-display');
      var greetEl = document.getElementById('greeting-text');

      if (timeEl) timeEl.textContent = GreetingModule.formatTime(now);
      if (greetEl) greetEl.textContent = GreetingModule.buildGreeting(now.getHours(), GreetingModule._name);
    },

    /**
     * Validate, save, and re-render the greeting with the given name.
     * @param {string} name  Raw value from the input field.
     * @param {HTMLElement} [errorEl]  Optional element to display validation messages.
     */
    setName: function (name, errorEl) {
      var trimmed = (typeof name === 'string') ? name.trim() : '';

      // Clear any previous error
      if (errorEl) errorEl.textContent = '';

      // Empty after trim → remove from storage (Requirement 3.4)
      if (trimmed.length === 0) {
        StorageService.remove('username');
        GreetingModule._name = null;
        var greetEl = document.getElementById('greeting-text');
        if (greetEl) {
          var now = new Date();
          greetEl.textContent = GreetingModule.buildGreeting(now.getHours(), null);
        }
        return;
      }

      // Reject if > 50 chars (Requirement 3.5)
      if (trimmed.length > 50) {
        if (errorEl) errorEl.textContent = 'Name must be 50 characters or fewer.';
        return;
      }

      // Save and re-render
      StorageService.set('username', trimmed);
      GreetingModule._name = trimmed;
      var greetEl = document.getElementById('greeting-text');
      if (greetEl) {
        var now = new Date();
        greetEl.textContent = GreetingModule.buildGreeting(now.getHours(), trimmed);
      }
    },

    /**
     * Pure function: map hour (0–23) to a greeting phrase.
     * @param {number} hour
     * @returns {string}
     */
    getGreeting: function (hour) {
      if (hour >= 5 && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 20) return 'Good Evening';
      return 'Good Night'; // 21–23 and 0–4
    },

    /**
     * Pure function: combine greeting phrase with optional user name.
     * @param {number} hour
     * @param {string|null} name
     * @returns {string}
     */
    buildGreeting: function (hour, name) {
      var phrase = GreetingModule.getGreeting(hour);
      if (name && name.trim().length > 0) {
        return phrase + ', ' + name;
      }
      return phrase;
    },

    /**
     * Pure function: format a Date as HH:MM:SS.
     * @param {Date} date
     * @returns {string}
     */
    formatTime: function (date) {
      var hh = String(date.getHours()).padStart(2, '0');
      var mm = String(date.getMinutes()).padStart(2, '0');
      var ss = String(date.getSeconds()).padStart(2, '0');
      return hh + ':' + mm + ':' + ss;
    },

    /**
     * Pure function: format a Date as "Weekday, DD Month YYYY".
     * @param {Date} date
     * @returns {string}
     */
    formatDate: function (date) {
      var weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
      var weekday = weekdays[date.getDay()];
      var day = String(date.getDate()).padStart(2, '0');
      var month = months[date.getMonth()];
      var year = date.getFullYear();
      return weekday + ', ' + day + ' ' + month + ' ' + year;
    }
  };

  // ===========================================================================
  // FocusTimer — state constants
  // ===========================================================================

  var STOPPED = 'STOPPED';
  var RUNNING = 'RUNNING';
  var PAUSED  = 'PAUSED';
  var DONE    = 'DONE';

  // ===========================================================================
  // FocusTimer
  // 25-minute countdown timer with Start / Stop / Reset controls.
  // ===========================================================================

  var FocusTimer = {
    /** @type {'STOPPED'|'RUNNING'|'PAUSED'|'DONE'} */
    _state: STOPPED,

    /** Remaining seconds (starts at 25 * 60 = 1500). */
    _remaining: 1500,

    /** setInterval handle; null when not running. */
    _interval: null,

    /**
     * Render initial 25:00, attach button listeners, call updateControls().
     * Implements Requirements 5.5, 5.6, 5.7.
     */
    init: function () {
      // Render the initial 25:00 display (Requirement 4.1, 4.5)
      FocusTimer.updateDisplay();

      // Attach click listeners to Start, Stop, Reset buttons
      var btnStart = document.getElementById('timer-start');
      var btnStop  = document.getElementById('timer-stop');
      var btnReset = document.getElementById('timer-reset');

      if (btnStart) {
        btnStart.addEventListener('click', function () {
          FocusTimer.start();
        });
      }

      if (btnStop) {
        btnStop.addEventListener('click', function () {
          FocusTimer.stop();
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', function () {
          FocusTimer.reset();
        });
      }

      // Set initial enabled/disabled state of controls (Requirements 5.5, 5.6, 5.7)
      FocusTimer.updateControls();
    },

    /** Begin or resume the countdown (state → RUNNING). */
    start: function () {
      if (FocusTimer._state === RUNNING) return; // guard: no duplicate intervals
      FocusTimer._state = RUNNING;
      FocusTimer._interval = setInterval(FocusTimer.tick, 1000);
      FocusTimer.updateDisplay();
      FocusTimer.updateControls();
    },

    /** Pause the countdown without resetting (state → PAUSED). */
    stop: function () {
      if (FocusTimer._state !== RUNNING) return;
      clearInterval(FocusTimer._interval);
      FocusTimer._interval = null;
      FocusTimer._state = PAUSED;
      FocusTimer.updateDisplay();
      FocusTimer.updateControls();
    },

    /** Stop and restore remaining to 1500 s (state → STOPPED). */
    reset: function () {
      clearInterval(FocusTimer._interval);
      FocusTimer._interval = null;
      FocusTimer._remaining = 1500;
      FocusTimer._state = STOPPED;
      FocusTimer.updateDisplay();
      FocusTimer.updateControls();
    },

    /** Decrement remaining by 1; call onComplete() when it reaches 0. */
    tick: function () {
      FocusTimer._remaining -= 1;
      FocusTimer.updateDisplay();
      if (FocusTimer._remaining === 0) {
        FocusTimer.onComplete();
      }
    },

    /** Called when remaining reaches 0; show completion signal (state → DONE). */
    onComplete: function () {
      clearInterval(FocusTimer._interval);
      FocusTimer._interval = null;
      FocusTimer._state = DONE;
      FocusTimer.updateDisplay();
      FocusTimer.updateControls();

      // Visual completion signal: flash the display and update the message label
      var display = document.getElementById('timer-display');
      var message = document.getElementById('timer-message');

      if (display) {
        // Flash animation: add a CSS class that triggers a brief highlight
        display.classList.add('timer-complete');
        // Remove the class after the animation so it can be re-triggered on next session
        setTimeout(function () {
          display.classList.remove('timer-complete');
        }, 3000);
      }

      if (message) {
        message.textContent = '🎉 Focus session complete! Take a break.';
      }
    },

    /**
     * Pure function: format seconds as MM:SS (zero-padded).
     * @param {number} seconds  Non-negative integer.
     * @returns {string}  e.g. "25:00", "04:07", "00:00"
     */
    formatTime: function (seconds) {
      var mm = String(Math.floor(seconds / 60)).padStart(2, '0');
      var ss = String(seconds % 60).padStart(2, '0');
      return mm + ':' + ss;
    },

    /** Update the timer display DOM element with the current remaining time. */
    updateDisplay: function () {
      var display = document.getElementById('timer-display');
      if (display) {
        display.textContent = FocusTimer.formatTime(FocusTimer._remaining);
      }
    },

    /**
     * Enable / disable Start, Stop, Reset buttons based on current state.
     *
     * Rules (Requirements 5.5, 5.6, 5.7):
     *   - Start: disabled while RUNNING
     *   - Stop:  disabled while PAUSED or STOPPED (when remaining > 0)
     *   - Reset: always enabled
     */
    updateControls: function () {
      var btnStart = document.getElementById('timer-start');
      var btnStop  = document.getElementById('timer-stop');
      var btnReset = document.getElementById('timer-reset');

      if (btnStart) {
        btnStart.disabled = (FocusTimer._state === RUNNING);
      }

      if (btnStop) {
        // Disabled when PAUSED or STOPPED (remaining > 0), or DONE
        btnStop.disabled = (FocusTimer._state !== RUNNING);
      }

      if (btnReset) {
        // Reset is always enabled
        btnReset.disabled = false;
      }
    }
  };

  // ===========================================================================
  // TodoList
  // Manages the task collection: add, edit, complete, delete, sort, persist.
  // ===========================================================================

  var TodoList = {
    /**
     * Load tasks and sort order from storage, render the list,
     * and attach the Add-form submit and sort-selector change listeners.
     */
    init: function () {},

    /**
     * Validate, create, append, save, and re-render a new task.
     * @param {string} desc
     */
    addTask: function (desc) {},

    /**
     * Validate, update, save, and re-render an existing task.
     * @param {string} id
     * @param {string} newDesc
     */
    editTask: function (id, newDesc) {},

    /**
     * Flip the done flag, save; revert and show error if save fails.
     * @param {string} id
     */
    toggleTask: function (id) {},

    /**
     * Remove a task by id, save, and re-render.
     * @param {string} id
     */
    deleteTask: function (id) {},

    /**
     * Persist the selected sort order and re-render.
     * @param {'default'|'az'|'completed_last'} order
     */
    setSortOrder: function (order) {},

    /**
     * Pure function: return a sorted copy of the task array.
     * @param {Array} tasks
     * @param {'default'|'az'|'completed_last'} order
     * @returns {Array}
     */
    getSortedTasks: function (tasks, order) {},

    /** Clear the list DOM and re-render all tasks in the current sort order. */
    render: function () {},

    /**
     * Build and return a single task row <li> element.
     * @param {Object} task
     * @returns {HTMLElement}
     */
    renderTask: function (task) {},

    /**
     * Serialize tasks to storage.
     * @returns {boolean} true on success, false on failure.
     */
    save: function () {}
  };

  // ===========================================================================
  // QuickLinks
  // Manages the link collection: add, delete, open, persist.
  // ===========================================================================

  var QuickLinks = {
    /**
     * Load links from storage, render the panel,
     * and attach the Add-form submit listener.
     */
    init: function () {},

    /**
     * Validate, create, save, and re-render a new link.
     * @param {string} label
     * @param {string} url
     */
    addLink: function (label, url) {},

    /**
     * Remove a link by id, save, and re-render.
     * @param {string} id
     */
    deleteLink: function (id) {},

    /**
     * Open a URL in a new tab.
     * @param {string} url
     */
    openLink: function (url) {},

    /**
     * Validate a URL string (must parse via URL constructor with http/https scheme).
     * @param {string} url
     * @returns {boolean}
     */
    validateUrl: function (url) {},

    /** Clear the links panel DOM and re-render all links. */
    render: function () {},

    /**
     * Build and return a single link button element.
     * @param {Object} link
     * @returns {HTMLElement}
     */
    renderLink: function (link) {},

    /** Serialize links to storage. */
    save: function () {}
  };

  // ===========================================================================
  // App Controller
  // Wires all modules together on DOMContentLoaded.
  // ===========================================================================

  var App = {
    /** Initialize all modules in dependency order. */
    init: function () {
      StorageService.init();
      ThemeManager.init();
      GreetingModule.init();
      FocusTimer.init();
      TodoList.init();
      QuickLinks.init();
    }
  };

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });

})();
