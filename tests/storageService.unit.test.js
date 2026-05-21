/**
 * Unit tests for StorageService error paths
 * Validates: Requirements 14.2, 14.4
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StorageService, _getStorage } from '../js/storageService.js';

describe('StorageService — error path unit tests', () => {
  beforeEach(() => {
    StorageService.init();
    StorageService.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test 1: set() returns false when localStorage.setItem throws QuotaExceededError
  // Validates: Requirement 14.2
  // -------------------------------------------------------------------------
  it('set() returns false when setItem throws QuotaExceededError', () => {
    const storage = _getStorage();
    const quota = new DOMException('QuotaExceededError', 'QuotaExceededError');

    vi.spyOn(storage, 'setItem').mockImplementation(() => { throw quota; });

    const result = StorageService.set('someKey', 'someValue');

    expect(result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Test 2: get() returns null and removes the key when stored value is corrupt JSON
  // Validates: Requirement 14.4
  // -------------------------------------------------------------------------
  it('get() returns null and removes the key when stored value is corrupt JSON', () => {
    const storage = _getStorage();

    // Bypass StorageService.set() and write a non-JSON string directly
    storage.setItem('tld_corruptKey', 'this is not valid JSON {{{');

    const result = StorageService.get('corruptKey');

    expect(result).toBeNull();
    // The corrupt key should have been removed by the error handler
    expect(storage.getItem('tld_corruptKey')).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Test 3: init() sets available === false when the probe setItem throws
  // Validates: Requirement 14.2
  // -------------------------------------------------------------------------
  it('init() sets available to false when the probe throws', () => {
    const storage = _getStorage();

    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    StorageService.init();

    expect(StorageService.available).toBe(false);
  });
});
