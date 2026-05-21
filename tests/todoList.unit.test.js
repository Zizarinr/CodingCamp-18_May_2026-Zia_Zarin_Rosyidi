/**
 * Unit tests for TodoList pure functions: createTask and getSortedTasks,
 * and TodoList mutation methods: addTask, editTask, toggleTask, deleteTask.
 * Validates: Requirements 6.2, 6.3, 6.4, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTask, getSortedTasks, TodoList } from '../js/todoList.js';
import { StorageService } from '../js/storageService.js';

// ---------------------------------------------------------------------------
// createTask(description)
// ---------------------------------------------------------------------------
describe('createTask(description)', () => {
  it('returns an object with the given description', () => {
    const task = createTask('Buy milk');
    expect(task.description).toBe('Buy milk');
  });

  it('sets done to false', () => {
    const task = createTask('Write tests');
    expect(task.done).toBe(false);
  });

  it('sets createdAt to a number (timestamp)', () => {
    const before = Date.now();
    const task = createTask('Do laundry');
    const after = Date.now();
    expect(typeof task.createdAt).toBe('number');
    expect(task.createdAt).toBeGreaterThanOrEqual(before);
    expect(task.createdAt).toBeLessThanOrEqual(after);
  });

  it('sets id to a non-empty string', () => {
    const task = createTask('Read a book');
    expect(typeof task.id).toBe('string');
    expect(task.id.length).toBeGreaterThan(0);
  });

  it('generates unique ids for different tasks', () => {
    const t1 = createTask('Task A');
    const t2 = createTask('Task B');
    expect(t1.id).not.toBe(t2.id);
  });

  it('returns an object with exactly the expected keys', () => {
    const task = createTask('Check keys');
    expect(Object.keys(task).sort()).toEqual(['createdAt', 'description', 'done', 'id'].sort());
  });
});

// ---------------------------------------------------------------------------
// getSortedTasks(tasks, order) — non-mutation
// ---------------------------------------------------------------------------
describe('getSortedTasks — does not mutate the source array', () => {
  it('returns a new array (not the same reference)', () => {
    const tasks = [createTask('A'), createTask('B')];
    const result = getSortedTasks(tasks, 'default');
    expect(result).not.toBe(tasks);
  });

  it('leaves the original array unchanged after "default" sort', () => {
    const t1 = { id: '1', description: 'B', done: false, createdAt: 200 };
    const t2 = { id: '2', description: 'A', done: false, createdAt: 100 };
    const original = [t1, t2];
    getSortedTasks(original, 'default');
    expect(original[0]).toBe(t1);
    expect(original[1]).toBe(t2);
  });

  it('leaves the original array unchanged after "az" sort', () => {
    const t1 = { id: '1', description: 'Zebra', done: false, createdAt: 100 };
    const t2 = { id: '2', description: 'Apple', done: false, createdAt: 200 };
    const original = [t1, t2];
    getSortedTasks(original, 'az');
    expect(original[0]).toBe(t1);
    expect(original[1]).toBe(t2);
  });

  it('leaves the original array unchanged after "completed_last" sort', () => {
    const t1 = { id: '1', description: 'Done task', done: true, createdAt: 100 };
    const t2 = { id: '2', description: 'Pending task', done: false, createdAt: 200 };
    const original = [t1, t2];
    getSortedTasks(original, 'completed_last');
    expect(original[0]).toBe(t1);
    expect(original[1]).toBe(t2);
  });
});

// ---------------------------------------------------------------------------
// getSortedTasks — completeness (same elements, same count)
// ---------------------------------------------------------------------------
describe('getSortedTasks — result contains exactly the same tasks', () => {
  it('returns the same number of tasks', () => {
    const tasks = [
      { id: '1', description: 'C', done: false, createdAt: 300 },
      { id: '2', description: 'A', done: true,  createdAt: 100 },
      { id: '3', description: 'B', done: false, createdAt: 200 },
    ];
    expect(getSortedTasks(tasks, 'default').length).toBe(3);
    expect(getSortedTasks(tasks, 'az').length).toBe(3);
    expect(getSortedTasks(tasks, 'completed_last').length).toBe(3);
  });

  it('result contains the same ids as the input (no duplicates, no omissions)', () => {
    const tasks = [
      { id: 'x', description: 'X', done: true,  createdAt: 1 },
      { id: 'y', description: 'Y', done: false, createdAt: 2 },
      { id: 'z', description: 'Z', done: false, createdAt: 3 },
    ];
    for (const order of ['default', 'az', 'completed_last']) {
      const ids = getSortedTasks(tasks, order).map(t => t.id).sort();
      expect(ids).toEqual(['x', 'y', 'z']);
    }
  });

  it('handles an empty array for all sort orders', () => {
    expect(getSortedTasks([], 'default')).toEqual([]);
    expect(getSortedTasks([], 'az')).toEqual([]);
    expect(getSortedTasks([], 'completed_last')).toEqual([]);
  });

  it('handles a single-element array for all sort orders', () => {
    const tasks = [{ id: '1', description: 'Solo', done: false, createdAt: 1 }];
    for (const order of ['default', 'az', 'completed_last']) {
      const result = getSortedTasks(tasks, order);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('1');
    }
  });
});

// ---------------------------------------------------------------------------
// getSortedTasks — 'default' order (ascending createdAt)
// ---------------------------------------------------------------------------
describe('getSortedTasks with order "default"', () => {
  it('sorts tasks by createdAt ascending', () => {
    const tasks = [
      { id: '3', description: 'C', done: false, createdAt: 300 },
      { id: '1', description: 'A', done: false, createdAt: 100 },
      { id: '2', description: 'B', done: false, createdAt: 200 },
    ];
    const result = getSortedTasks(tasks, 'default');
    expect(result.map(t => t.id)).toEqual(['1', '2', '3']);
  });

  it('preserves order for tasks with equal createdAt', () => {
    const tasks = [
      { id: 'a', description: 'A', done: false, createdAt: 100 },
      { id: 'b', description: 'B', done: false, createdAt: 100 },
    ];
    const result = getSortedTasks(tasks, 'default');
    expect(result.length).toBe(2);
    // Both present; order between equal timestamps is stable (implementation-defined)
    expect(result.map(t => t.id).sort()).toEqual(['a', 'b']);
  });
});

// ---------------------------------------------------------------------------
// getSortedTasks — 'az' order (alphabetical by description)
// ---------------------------------------------------------------------------
describe('getSortedTasks with order "az"', () => {
  it('sorts tasks alphabetically by description', () => {
    const tasks = [
      { id: '1', description: 'Zebra', done: false, createdAt: 100 },
      { id: '2', description: 'Apple', done: false, createdAt: 200 },
      { id: '3', description: 'Mango', done: false, createdAt: 300 },
    ];
    const result = getSortedTasks(tasks, 'az');
    expect(result.map(t => t.description)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('adjacent pairs satisfy localeCompare <= 0', () => {
    const tasks = [
      { id: '1', description: 'Banana', done: false, createdAt: 1 },
      { id: '2', description: 'apple',  done: false, createdAt: 2 },
      { id: '3', description: 'Cherry', done: false, createdAt: 3 },
    ];
    const result = getSortedTasks(tasks, 'az');
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].description.localeCompare(result[i + 1].description)).toBeLessThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// getSortedTasks — 'completed_last' order
// ---------------------------------------------------------------------------
describe('getSortedTasks with order "completed_last"', () => {
  it('places incomplete tasks before complete tasks', () => {
    const tasks = [
      { id: '1', description: 'Done A',    done: true,  createdAt: 100 },
      { id: '2', description: 'Pending B', done: false, createdAt: 200 },
      { id: '3', description: 'Done C',    done: true,  createdAt: 300 },
      { id: '4', description: 'Pending D', done: false, createdAt: 400 },
    ];
    const result = getSortedTasks(tasks, 'completed_last');
    const doneFlags = result.map(t => t.done);
    // All false values must come before any true value
    const firstTrue = doneFlags.indexOf(true);
    const lastFalse = doneFlags.lastIndexOf(false);
    if (firstTrue !== -1 && lastFalse !== -1) {
      expect(lastFalse).toBeLessThan(firstTrue);
    }
  });

  it('no incomplete task appears after any complete task', () => {
    const tasks = [
      { id: '1', description: 'Done',    done: true,  createdAt: 100 },
      { id: '2', description: 'Pending', done: false, createdAt: 200 },
    ];
    const result = getSortedTasks(tasks, 'completed_last');
    expect(result[0].done).toBe(false);
    expect(result[1].done).toBe(true);
  });

  it('breaks ties within same done-status by createdAt ascending', () => {
    const tasks = [
      { id: 'a', description: 'Pending late',  done: false, createdAt: 300 },
      { id: 'b', description: 'Pending early', done: false, createdAt: 100 },
      { id: 'c', description: 'Done late',     done: true,  createdAt: 400 },
      { id: 'd', description: 'Done early',    done: true,  createdAt: 200 },
    ];
    const result = getSortedTasks(tasks, 'completed_last');
    // Incomplete tasks first, sorted by createdAt
    expect(result[0].id).toBe('b'); // pending early (100)
    expect(result[1].id).toBe('a'); // pending late  (300)
    // Complete tasks after, sorted by createdAt
    expect(result[2].id).toBe('d'); // done early    (200)
    expect(result[3].id).toBe('c'); // done late     (400)
  });

  it('handles all tasks incomplete', () => {
    const tasks = [
      { id: '2', description: 'B', done: false, createdAt: 200 },
      { id: '1', description: 'A', done: false, createdAt: 100 },
    ];
    const result = getSortedTasks(tasks, 'completed_last');
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('handles all tasks complete', () => {
    const tasks = [
      { id: '2', description: 'B', done: true, createdAt: 200 },
      { id: '1', description: 'A', done: true, createdAt: 100 },
    ];
    const result = getSortedTasks(tasks, 'completed_last');
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });
});

// ---------------------------------------------------------------------------
// getSortedTasks — fallback for unknown order
// ---------------------------------------------------------------------------
describe('getSortedTasks — unknown order falls back to default', () => {
  it('returns tasks sorted by createdAt for an unrecognised order string', () => {
    const tasks = [
      { id: '3', description: 'C', done: false, createdAt: 300 },
      { id: '1', description: 'A', done: false, createdAt: 100 },
      { id: '2', description: 'B', done: false, createdAt: 200 },
    ];
    const result = getSortedTasks(tasks, 'unknown_order');
    expect(result.map(t => t.id)).toEqual(['1', '2', '3']);
  });
});

// ===========================================================================
// TodoList mutation methods
// ===========================================================================

// Helper: reset TodoList state before each test
function resetTodoList() {
  TodoList._tasks = [];
  TodoList._sortOrder = 'default';
  StorageService.init();
}

// ---------------------------------------------------------------------------
// TodoList.addTask(desc)
// ---------------------------------------------------------------------------
describe('TodoList.addTask(desc)', () => {
  beforeEach(() => {
    resetTodoList();
  });

  it('adds a task with trimmed description and done=false', () => {
    TodoList.addTask('  Buy milk  ');
    expect(TodoList._tasks.length).toBe(1);
    expect(TodoList._tasks[0].description).toBe('Buy milk');
    expect(TodoList._tasks[0].done).toBe(false);
  });

  it('grows the collection by exactly one for a valid description', () => {
    TodoList.addTask('Task A');
    TodoList.addTask('Task B');
    expect(TodoList._tasks.length).toBe(2);
  });

  it('does NOT add a task for an empty string', () => {
    TodoList.addTask('');
    expect(TodoList._tasks.length).toBe(0);
  });

  it('does NOT add a task for a whitespace-only string', () => {
    TodoList.addTask('   ');
    expect(TodoList._tasks.length).toBe(0);
  });

  it('does NOT add a task for a tab-only string', () => {
    TodoList.addTask('\t\t');
    expect(TodoList._tasks.length).toBe(0);
  });

  it('persists the task to storage after adding', () => {
    TodoList.addTask('Persisted task');
    const stored = StorageService.get('tasks');
    expect(Array.isArray(stored)).toBe(true);
    expect(stored.length).toBe(1);
    expect(stored[0].description).toBe('Persisted task');
  });

  it('assigns a unique id to each new task', () => {
    TodoList.addTask('Task 1');
    TodoList.addTask('Task 2');
    expect(TodoList._tasks[0].id).not.toBe(TodoList._tasks[1].id);
  });
});

// ---------------------------------------------------------------------------
// TodoList.editTask(id, newDesc)
// ---------------------------------------------------------------------------
describe('TodoList.editTask(id, newDesc)', () => {
  beforeEach(() => {
    resetTodoList();
  });

  it('updates the description of the matching task', () => {
    TodoList.addTask('Original');
    const id = TodoList._tasks[0].id;
    TodoList.editTask(id, 'Updated');
    expect(TodoList._tasks[0].description).toBe('Updated');
  });

  it('trims the new description before saving', () => {
    TodoList.addTask('Original');
    const id = TodoList._tasks[0].id;
    TodoList.editTask(id, '  Trimmed  ');
    expect(TodoList._tasks[0].description).toBe('Trimmed');
  });

  it('does NOT update the task for an empty new description', () => {
    TodoList.addTask('Original');
    const id = TodoList._tasks[0].id;
    TodoList.editTask(id, '');
    expect(TodoList._tasks[0].description).toBe('Original');
  });

  it('does NOT update the task for a whitespace-only new description', () => {
    TodoList.addTask('Original');
    const id = TodoList._tasks[0].id;
    TodoList.editTask(id, '   ');
    expect(TodoList._tasks[0].description).toBe('Original');
  });

  it('persists the updated description to storage', () => {
    TodoList.addTask('Before');
    const id = TodoList._tasks[0].id;
    TodoList.editTask(id, 'After');
    const stored = StorageService.get('tasks');
    expect(stored[0].description).toBe('After');
  });

  it('does nothing if the id does not exist', () => {
    TodoList.addTask('Existing');
    TodoList.editTask('nonexistent-id', 'New desc');
    expect(TodoList._tasks[0].description).toBe('Existing');
  });

  it('does not change collection length when editing', () => {
    TodoList.addTask('Task A');
    TodoList.addTask('Task B');
    const id = TodoList._tasks[0].id;
    TodoList.editTask(id, 'Task A edited');
    expect(TodoList._tasks.length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// TodoList.toggleTask(id)
// ---------------------------------------------------------------------------
describe('TodoList.toggleTask(id)', () => {
  beforeEach(() => {
    resetTodoList();
  });

  it('flips done from false to true', () => {
    TodoList.addTask('Toggle me');
    const id = TodoList._tasks[0].id;
    expect(TodoList._tasks[0].done).toBe(false);
    TodoList.toggleTask(id);
    expect(TodoList._tasks[0].done).toBe(true);
  });

  it('flips done from true back to false (involution)', () => {
    TodoList.addTask('Toggle me');
    const id = TodoList._tasks[0].id;
    TodoList.toggleTask(id);
    TodoList.toggleTask(id);
    expect(TodoList._tasks[0].done).toBe(false);
  });

  it('persists the toggled state to storage', () => {
    TodoList.addTask('Persist toggle');
    const id = TodoList._tasks[0].id;
    TodoList.toggleTask(id);
    const stored = StorageService.get('tasks');
    expect(stored[0].done).toBe(true);
  });

  it('reverts done and does not save when StorageService.set returns false', () => {
    TodoList.addTask('Revert me');
    const id = TodoList._tasks[0].id;
    const originalDone = TodoList._tasks[0].done; // false

    // Mock StorageService.set to return false (simulating quota exceeded)
    const originalSet = StorageService.set;
    StorageService.set = vi.fn().mockReturnValue(false);

    TodoList.toggleTask(id);

    // done should be reverted to original
    expect(TodoList._tasks[0].done).toBe(originalDone);

    // Restore
    StorageService.set = originalSet;
  });

  it('does nothing if the id does not exist', () => {
    TodoList.addTask('Task');
    const originalDone = TodoList._tasks[0].done;
    TodoList.toggleTask('nonexistent-id');
    expect(TodoList._tasks[0].done).toBe(originalDone);
    expect(TodoList._tasks.length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// TodoList.deleteTask(id)
// ---------------------------------------------------------------------------
describe('TodoList.deleteTask(id)', () => {
  beforeEach(() => {
    resetTodoList();
  });

  it('removes the task with the given id', () => {
    TodoList.addTask('To delete');
    const id = TodoList._tasks[0].id;
    TodoList.deleteTask(id);
    expect(TodoList._tasks.length).toBe(0);
    expect(TodoList._tasks.find(t => t.id === id)).toBeUndefined();
  });

  it('removes only the target task, leaving others intact', () => {
    TodoList.addTask('Keep me');
    TodoList.addTask('Delete me');
    const keepId = TodoList._tasks[0].id;
    const deleteId = TodoList._tasks[1].id;

    TodoList.deleteTask(deleteId);

    expect(TodoList._tasks.length).toBe(1);
    expect(TodoList._tasks[0].id).toBe(keepId);
    expect(TodoList._tasks[0].description).toBe('Keep me');
  });

  it('persists the updated collection to storage after deletion', () => {
    TodoList.addTask('Task A');
    TodoList.addTask('Task B');
    const idA = TodoList._tasks[0].id;

    TodoList.deleteTask(idA);

    const stored = StorageService.get('tasks');
    expect(stored.length).toBe(1);
    expect(stored[0].description).toBe('Task B');
  });

  it('does nothing if the id does not exist', () => {
    TodoList.addTask('Task');
    TodoList.deleteTask('nonexistent-id');
    expect(TodoList._tasks.length).toBe(1);
  });

  it('handles deleting from an empty collection gracefully', () => {
    expect(() => TodoList.deleteTask('any-id')).not.toThrow();
    expect(TodoList._tasks.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// TodoList.save()
// ---------------------------------------------------------------------------
describe('TodoList.save()', () => {
  beforeEach(() => {
    resetTodoList();
  });

  it('returns true on successful save', () => {
    TodoList._tasks = [createTask('Test')];
    const result = TodoList.save();
    expect(result).toBe(true);
  });

  it('persists _tasks to StorageService under key "tasks"', () => {
    const task = createTask('Saved task');
    TodoList._tasks = [task];
    TodoList.save();
    const stored = StorageService.get('tasks');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(task.id);
    expect(stored[0].description).toBe('Saved task');
  });

  it('returns false when StorageService.set fails', () => {
    const originalSet = StorageService.set;
    StorageService.set = vi.fn().mockReturnValue(false);

    const result = TodoList.save();
    expect(result).toBe(false);

    StorageService.set = originalSet;
  });
});
