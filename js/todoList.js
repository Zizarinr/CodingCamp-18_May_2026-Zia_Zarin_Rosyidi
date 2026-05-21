/**
 * todoList.js — testable ES module export.
 * Exposes the pure functions, factory, and TodoList object for use in tests.
 */

import { StorageService } from './storageService.js';

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

/**
 * Pure function: return a sorted copy of the task array.
 * Never mutates the source array.
 *
 * Sort orders:
 *   'default'        — ascending by createdAt (insertion order)
 *   'az'             — ascending alphabetical by description (localeCompare)
 *   'completed_last' — incomplete tasks first; ties broken by createdAt ascending
 *
 * @param {Array<{id: string, description: string, done: boolean, createdAt: number}>} tasks
 * @param {'default'|'az'|'completed_last'} order
 * @returns {Array<{id: string, description: string, done: boolean, createdAt: number}>}
 */
function getSortedTasks(tasks, order) {
  var copy = [...tasks]; // never mutate the source array
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
}

// ---------------------------------------------------------------------------
// TodoList
// Manages the task collection: add, edit, complete, delete, sort, persist.
// ---------------------------------------------------------------------------

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
    var errorEl = (typeof document !== 'undefined') ? document.getElementById('todo-error') : null;

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

    // Return focus to input (Requirement 6.1 / accessibility)
    if (typeof document !== 'undefined') {
      var input = document.getElementById('todo-input');
      if (input) {
        input.value = '';
        input.focus();
      }
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
    var errorEl = (typeof document !== 'undefined') ? document.getElementById('todo-error') : null;

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
      var errorEl = (typeof document !== 'undefined') ? document.getElementById('todo-error') : null;
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
   * Pure function: return a sorted copy of the task array.
   * @param {Array} tasks
   * @param {'default'|'az'|'completed_last'} order
   * @returns {Array}
   */
  getSortedTasks: getSortedTasks,

  /**
   * Clear the list DOM and re-render all tasks in the current sort order.
   * Requirement 9.1, 9.2, 10.3
   */
  render: function () {
    if (typeof document === 'undefined') return;
    var listEl = document.getElementById('todo-list');
    if (!listEl) return;

    // Clear existing items
    listEl.innerHTML = '';

    // Get tasks in the current sort order
    var sorted = getSortedTasks(TodoList._tasks, TodoList._sortOrder);

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
    if (typeof document === 'undefined') return null;

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
        // editTask calls render(), which replaces the whole list — no need to
        // manually restore the span here.
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
   * Persist the selected sort order and re-render.
   * Requirements 10.3, 10.4
   * @param {'default'|'az'|'completed_last'} order
   */
  setSortOrder: function (order) {
    TodoList._sortOrder = order;
    StorageService.set('sort_order', order);
    TodoList.render();
  },

  /**
   * Load tasks and sort order from storage, render the list,
   * and attach the Add-form submit and sort-selector change listeners.
   * Requirements 9.1, 9.2, 9.3, 10.3, 10.4
   */
  init: function () {
    if (typeof document === 'undefined') return;

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

export { createTask, getSortedTasks, TodoList };
