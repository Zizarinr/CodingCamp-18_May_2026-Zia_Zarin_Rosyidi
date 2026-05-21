/**
 * StorageService — testable ES module export.
 * Central wrapper around window.localStorage (browser) or a Map-based
 * in-memory fallback (Node / test environment).
 * All keys are prefixed with 'tld_' to avoid collisions.
 */

// ---------------------------------------------------------------------------
// In-memory localStorage shim for non-browser environments (e.g. Vitest/Node)
// ---------------------------------------------------------------------------
function makeMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    get length() { return store.size; },
    key(i) { return Array.from(store.keys())[i] ?? null; },
    clear() { store.clear(); },
  };
}

const _storage =
  typeof localStorage !== 'undefined' ? localStorage : makeMemoryStorage();

const StorageService = {
  available: false,

  /** Probe localStorage availability; sets StorageService.available. */
  init: function () {
    try {
      _storage.setItem('tld_probe', '1');
      _storage.removeItem('tld_probe');
      this.available = true;
    } catch (_e) {
      this.available = false;
    }
  },

  /**
   * Read and JSON-parse a value from storage.
   * @param {string} key
   * @returns {*|null}
   */
  get: function (key) {
    try {
      const raw = _storage.getItem('tld_' + key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (_e) {
      this.remove(key);
      return null;
    }
  },

  /**
   * JSON-stringify and write a value to storage.
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  set: function (key, value) {
    try {
      _storage.setItem('tld_' + key, JSON.stringify(value));
      return true;
    } catch (e) {
      // QuotaExceededError and vendor variants
      if (
        e instanceof DOMException ||
        (e && (e.name === 'QuotaExceededError' ||
               e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
               e.code === 22 ||
               e.code === 1014))
      ) {
        return false;
      }
      return false;
    }
  },

  /**
   * Remove a key from storage.
   * @param {string} key
   */
  remove: function (key) {
    _storage.removeItem('tld_' + key);
  },

  /** Remove all dashboard keys (those prefixed with 'tld_'). */
  clear: function () {
    const keysToRemove = [];
    for (let i = 0; i < _storage.length; i++) {
      const k = _storage.key(i);
      if (k && k.startsWith('tld_')) keysToRemove.push(k);
    }
    keysToRemove.forEach(k => _storage.removeItem(k));
  },
};

/** @internal — exposed only for unit-testing error paths */
function _getStorage() { return _storage; }

export { StorageService, _getStorage };
