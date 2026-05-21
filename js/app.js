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
    init: function () {
      try {
        localStorage.setItem('tld_probe', '1');
        localStorage.removeItem('tld_probe');
        StorageService.available = true;
      } catch (_e) {
        StorageService.available = false;
      }
    },

    /**
     * Read and JSON-parse a value from storage.
     * @param {string} key
     * @returns {*|null} Parsed value, or null on error / missing key.
     */
    get: function (key) {
      try {
        var raw = localStorage.getItem('tld_' + key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (_e) {
        StorageService.remove(key);
        return null;
      }
    },

    /**
     * JSON-stringify and write a value to storage.
     * @param {string} key
     * @param {*} value
     * @returns {boolean} true on success, false on failure (e.g. QuotaExceededError).
     */
    set: function (key, value) {
      try {
        localStorage.setItem('tld_' + key, JSON.stringify(value));
        return true;
      } catch (_e) {
        return false;
      }
    },

    /**
     * Remove a key from storage.
     * @param {string} key
     */
    remove: function (key) {
      localStorage.removeItem('tld_' + key);
    },

    /** Remove all dashboard keys (those prefixed with 'tld_'). */
    clear: function () {
      var keysToRemove = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.startsWith('tld_')) keysToRemove.push(k);
      }
      keysToRemove.forEach(function (k) { localStorage.removeItem(k); });
    }
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
  // createTask — factory function (local to IIFE, not on TodoList)
  // Creates a new Task object with a unique id, description, done=false,
  // and a createdAt timestamp.
  // ===========================================================================

  /**
   * Factory: create a new Task object.
   * @param {string} description  Trimmed, non-empty task description (1–200 chars).
   * @returns {{ id: string, description: string, done: boolean, createdAt: number }}
   */
  function createTask(description) {
    return {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : Date.now().toString(),
      description: description,
      done: false,
      createdAt: Date.now()
    };
  }

  // ===========================================================================
  // TodoList
  // Manages the task collection: add, edit, complete, delete, sort, persist.
  // ===========================================================================

  var TodoList = {
    /** @type {Array<{id: string, description: string, done: boolean, createdAt: number}>} */
    _tasks: [],

    /** @type {'default'|'az'|'completed_last'} */
    _sortOrder: 'default',

    /**
     * Validate, create, append, save, and re-render a new task.
     * On validation failure, show inline error in #todo-error.
     * @param {string} desc
     */
    addTask: function (desc) {
      var trimmed = (typeof desc === 'string') ? desc.trim() : '';
      var errorEl = document.getElementById('todo-error');

      // Clear previous error
      if (errorEl) errorEl.textContent = '';

      // Validate: non-empty
      if (trimmed.length === 0) {
        if (errorEl) errorEl.textContent = 'Task description cannot be empty.';
        return;
      }

      // Create, append, persist, render
      var task = createTask(trimmed);
      TodoList._tasks.push(task);
      TodoList.save();
      TodoList.render();

      // Return focus to input (accessibility)
      var input = document.getElementById('todo-input');
      if (input) {
        input.value = '';
        input.focus();
      }
    },

    /**
     * Validate, update, save, and re-render an existing task.
     * On validation failure, show inline error without saving.
     * @param {string} id
     * @param {string} newDesc
     */
    editTask: function (id, newDesc) {
      var trimmed = (typeof newDesc === 'string') ? newDesc.trim() : '';
      var errorEl = document.getElementById('todo-error');

      // Clear previous error
      if (errorEl) errorEl.textContent = '';

      // Validate: non-empty
      if (trimmed.length === 0) {
        if (errorEl) errorEl.textContent = 'Task description cannot be empty.';
        return;
      }

      // Find and update the matching task
      var task = TodoList._tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      task.description = trimmed;
      TodoList.save();
      TodoList.render();
    },

    /**
     * Flip the done flag, save; revert and show error if save fails.
     * @param {string} id
     */
    toggleTask: function (id) {
      var task = TodoList._tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      // Flip done
      task.done = !task.done;

      // Attempt to save; revert on failure
      var saved = TodoList.save();
      if (saved === false) {
        task.done = !task.done; // revert
        var errorEl = document.getElementById('todo-error');
        if (errorEl) errorEl.textContent = 'Could not save changes. Storage may be full.';
      }
    },

    /**
     * Remove a task by id, save, and re-render.
     * @param {string} id
     */
    deleteTask: function (id) {
      TodoList._tasks = TodoList._tasks.filter(function (t) { return t.id !== id; });
      TodoList.save();
      TodoList.render();
    },

    /**
     * Persist the selected sort order and re-render.
     * @param {'default'|'az'|'completed_last'} order
     */
    setSortOrder: function (order) {
      TodoList._sortOrder = order;
      StorageService.set('sort_order', order);
      TodoList.render();
    },

    /**
     * Pure function: return a sorted copy of the task array.
     * @param {Array} tasks
     * @param {'default'|'az'|'completed_last'} order
     * @returns {Array}
     */
    getSortedTasks: function (tasks, order) {
      var copy = [...tasks];
      if (order === 'default') {
        return copy.sort(function (a, b) { return a.createdAt - b.createdAt; });
      }
      if (order === 'az') {
        return copy.sort(function (a, b) { return a.description.localeCompare(b.description); });
      }
      if (order === 'completed_last') {
        return copy.sort(function (a, b) {
          if (a.done === b.done) return a.createdAt - b.createdAt;
          return a.done ? 1 : -1; // incomplete tasks first
        });
      }
      // Fallback: default sort
      return copy.sort(function (a, b) { return a.createdAt - b.createdAt; });
    },

    /**
     * Clear the list DOM and re-render all tasks in the current sort order.
     * Requirements 9.1, 9.2, 10.3
     */
    render: function () {
      var listEl = document.getElementById('todo-list');
      if (!listEl) return;

      // Clear existing items
      listEl.innerHTML = '';

      // Get tasks in the current sort order
      var sorted = TodoList.getSortedTasks(TodoList._tasks, TodoList._sortOrder);

      // Append each task row
      sorted.forEach(function (task) {
        var li = TodoList.renderTask(task);
        if (li) listEl.appendChild(li);
      });
    },

    /**
     * Build and return a single task row <li> element.
     * Requirements 6.1, 9.1, 9.2
     *
     * Structure:
     *   <li>
     *     <input type="checkbox" [checked]>
     *     <span class="task-description [done]">…</span>
     *     <button aria-label="Edit task">Edit</button>
     *     <button aria-label="Delete task">Delete</button>
     *   </li>
     *
     * @param {{id: string, description: string, done: boolean, createdAt: number}} task
     * @returns {HTMLElement}
     */
    renderTask: function (task) {
      var li = document.createElement('li');
      li.dataset.id = task.id;

      // --- Checkbox ---
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark task as ' + (task.done ? 'incomplete' : 'complete'));
      checkbox.addEventListener('change', function () {
        TodoList.toggleTask(task.id);
      });

      // --- Description span ---
      var span = document.createElement('span');
      span.className = 'task-description' + (task.done ? ' done' : '');
      span.textContent = task.description;

      // --- Edit button ---
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.setAttribute('aria-label', 'Edit task');
      editBtn.addEventListener('click', function () {
        // Replace span with an inline input
        var editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = task.description;
        editInput.setAttribute('aria-label', 'Edit task description');

        // Confirm edit on blur or Enter; cancel on Escape
        function confirmEdit() {
          var newValue = editInput.value;
          TodoList.editTask(task.id, newValue);
          // editTask calls render(), which replaces the whole list
        }

        function cancelEdit() {
          // Restore the original span without saving
          if (editInput.parentNode === li) {
            li.replaceChild(span, editInput);
          }
        }

        editInput.addEventListener('blur', function () {
          confirmEdit();
        });

        editInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            editInput.blur(); // triggers blur → confirmEdit
          } else if (e.key === 'Escape') {
            // Remove blur listener to avoid triggering confirmEdit
            editInput.removeEventListener('blur', confirmEdit);
            cancelEdit();
          }
        });

        // Swap span → input and focus
        li.replaceChild(editInput, span);
        editInput.focus();
        // Place cursor at end
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      });

      // --- Delete button ---
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.addEventListener('click', function () {
        TodoList.deleteTask(task.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      return li;
    },

    /**
     * Serialize tasks to storage.
     * @returns {boolean} true on success, false on failure.
     */
    save: function () {
      return StorageService.set('tasks', TodoList._tasks);
    },

    /**
     * Load tasks and sort order from storage, render the list,
     * and attach the Add-form submit and sort-selector change listeners.
     * Requirements 9.1, 9.2, 9.3, 10.3, 10.4
     */
    init: function () {
      // Load tasks from storage (default: empty array)
      var storedTasks = StorageService.get('tasks');
      TodoList._tasks = Array.isArray(storedTasks) ? storedTasks : [];

      // Load sort order from storage (default: 'default')
      var storedOrder = StorageService.get('sort_order');
      TodoList._sortOrder = (storedOrder === 'az' || storedOrder === 'completed_last') ? storedOrder : 'default';

      // Render the initial list
      TodoList.render();

      // Sync the sort selector to the loaded sort order
      var sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        sortSelect.value = TodoList._sortOrder;
        sortSelect.addEventListener('change', function () {
          TodoList.setSortOrder(sortSelect.value);
        });
      }

      // Attach Add-form submit listener
      var form = document.getElementById('todo-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var input = document.getElementById('todo-input');
          var value = input ? input.value : '';
          TodoList.addTask(value);
          // addTask() already clears the input and returns focus to #todo-input
        });
      }
    }
  };

  // ===========================================================================
  // QuickLinks
  // Manages the link collection: add, delete, open, persist.
  // ===========================================================================

  var QuickLinks = {
    _links: [],

    /**
     * Load links from storage, render the panel,
     * and attach the Add-form submit listener.
     */
    init: function () {
      var storedLinks = StorageService.get('links');
      QuickLinks._links = Array.isArray(storedLinks) ? storedLinks : [];
      QuickLinks.render();

      var form = document.getElementById('links-form');
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var labelInput = document.getElementById('link-label-input');
          var urlInput = document.getElementById('link-url-input');
          var label = labelInput ? labelInput.value : '';
          var url = urlInput ? urlInput.value : '';
          QuickLinks.addLink(label, url);
        });
      }
    },

    /**
     * Validate, create, save, and re-render a new link.
     * @param {string} label
     * @param {string} url
     */
    addLink: function (label, url) {
      var errorEl = document.getElementById('links-error');
      if (errorEl) errorEl.textContent = '';

      var trimmedLabel = (typeof label === 'string') ? label.trim() : '';
      var trimmedUrl = (typeof url === 'string') ? url.trim() : '';

      if (trimmedLabel.length === 0) {
        if (errorEl) errorEl.textContent = 'Label cannot be empty.';
        return;
      }

      if (!QuickLinks.validateUrl(trimmedUrl)) {
        if (errorEl) errorEl.textContent = 'Invalid URL. Must be http:// or https://.';
        return;
      }

      var link = {
        id: (typeof crypto !== 'undefined' && crypto.randomUUID)
              ? crypto.randomUUID()
              : Date.now().toString(),
        label: trimmedLabel,
        url: trimmedUrl
      };

      QuickLinks._links.push(link);
      QuickLinks.save();
      QuickLinks.render();

      var labelInput = document.getElementById('link-label-input');
      var urlInput = document.getElementById('link-url-input');
      if (labelInput) labelInput.value = '';
      if (urlInput) urlInput.value = '';
      if (labelInput) labelInput.focus();
    },

    /**
     * Remove a link by id, save, and re-render.
     * @param {string} id
     */
    deleteLink: function (id) {
      QuickLinks._links = QuickLinks._links.filter(function (l) { return l.id !== id; });
      QuickLinks.save();
      QuickLinks.render();
    },

    /**
     * Open a URL in a new tab.
     * @param {string} url
     */
    openLink: function (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    },

    /**
     * Validate a URL string (must parse via URL constructor with http/https scheme).
     * @param {string} url
     * @returns {boolean}
     */
    validateUrl: function (url) {
      try {
        var parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch (_e) {
        return false;
      }
    },

    /** Clear the links panel DOM and re-render all links. */
    render: function () {
      var panel = document.getElementById('links-panel');
      if (!panel) return;
      panel.innerHTML = '';
      QuickLinks._links.forEach(function (link) {
        var el = QuickLinks.renderLink(link);
        if (el) panel.appendChild(el);
      });
    },

    /**
     * Build and return a single link button element.
     * @param {Object} link
     * @returns {HTMLElement}
     */
    renderLink: function (link) {
      var div = document.createElement('div');
      div.className = 'quick-link';

      var openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.textContent = link.label;
      openBtn.setAttribute('aria-label', 'Open link: ' + link.label);
      openBtn.addEventListener('click', function () {
        QuickLinks.openLink(link.url);
      });

      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.textContent = 'Delete';
      delBtn.setAttribute('aria-label', 'Delete link: ' + link.label);
      delBtn.addEventListener('click', function () {
        QuickLinks.deleteLink(link.id);
      });

      div.appendChild(openBtn);
      div.appendChild(delBtn);
      return div;
    },

    /** Serialize links to storage. */
    save: function () {
      return StorageService.set('links', QuickLinks._links);
    }
  };

  // ===========================================================================
  // App Controller
  // Wires all modules together on DOMContentLoaded.
  // ===========================================================================

  var App = {
    /** Initialize all modules in dependency order. */
    init: function () {
      StorageService.init();

      if (StorageService.available === false) {
        var warningEl = document.getElementById('storage-warning');
        if (warningEl) {
          warningEl.removeAttribute('hidden');
        }
      }

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

  if (typeof window !== 'undefined') {
    window.onerror = function (message, source, lineno, colno, error) {
      console.error('Unhandled error:', message, 'at', source + ':' + lineno + ':' + colno, error);
    };

    window.addEventListener('unhandledrejection', function (event) {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });

})();
