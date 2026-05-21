// Feature: todo-life-dashboard, Property 3: Task collection storage round-trip

import { describe, it, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { StorageService } from '../js/storageService.js';

/**
 * Property 3: Task collection storage round-trip
 * Validates: Requirements 9.4, 14.1
 *
 * For any array of Task objects written via StorageService.set('tasks', tasks),
 * reading back via StorageService.get('tasks') SHALL produce an array where
 * every task has the same id, description, done, and createdAt values.
 */

describe('StorageService — Property 3: Task collection storage round-trip', () => {
  beforeEach(() => {
    StorageService.init();
    StorageService.clear();
  });

  it('round-trips any task array through set → get with deep equality', () => {
    const taskArbitrary = fc.array(
      fc.record({
        id: fc.string(),
        description: fc.string(),
        done: fc.boolean(),
        createdAt: fc.integer(),
      })
    );

    fc.assert(
      fc.property(taskArbitrary, (tasks) => {
        StorageService.set('tasks', tasks);
        const retrieved = StorageService.get('tasks');

        // Must return an array of the same length
        if (!Array.isArray(retrieved)) return false;
        if (retrieved.length !== tasks.length) return false;

        // Every task must deep-equal its original counterpart
        for (let i = 0; i < tasks.length; i++) {
          const orig = tasks[i];
          const got  = retrieved[i];
          if (got.id          !== orig.id)          return false;
          if (got.description !== orig.description) return false;
          if (got.done        !== orig.done)        return false;
          if (got.createdAt   !== orig.createdAt)   return false;
        }

        return true;
      }),
      { numRuns: 100 }
    );
  });
});
