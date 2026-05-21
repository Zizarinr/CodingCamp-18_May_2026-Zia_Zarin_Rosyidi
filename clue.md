# To-Do Life Dashboard — Handoff Document

> **For any agent picking this up:** Read this entire file before touching any code.
> Last updated: Task 7 complete — 124/124 tests passing.

---

## 1. What Is This Project?

A **homepage-style, single-page web application** that helps users organize their day.

**Tech stack:** Vanilla HTML + CSS + JavaScript only. No frameworks, no bundler, no backend, no build step.
**Persistence:** Browser `localStorage` only — all data lives client-side.
**Target browsers:** Chrome, Firefox, Edge, Safari (modern versions).
**Viewport support:** 320px to 2560px, no horizontal scroll.

The app has **four functional modules** plus a theme toggle:

| Module | Purpose |
|---|---|
| **Greeting** | Live clock (HH:MM:SS), current date, time-aware greeting ("Good Morning" etc.), customizable user name |
| **Focus Timer** | 25-minute Pomodoro countdown with Start / Stop / Reset |
| **To-Do List** | Add, edit, complete, delete, and sort tasks; persisted to localStorage |
| **Quick Links** | User-defined shortcut buttons that open URLs in a new tab |
| **Theme Toggle** | Light / Dark mode switch; preference saved to localStorage |

---

## 2. Project Structure

```
index.html                  ← single HTML file; all markup lives here
css/
  style.css                 ← all styles; CSS custom properties for theming
js/
  app.js                    ← ALL production JavaScript (one IIFE, ~600 lines)
  storageService.js         ← test-only ES module re-export of StorageService
  greetingModule.js         ← test-only ES module re-export of GreetingModule pure fns
  focusTimer.js             ← test-only ES module re-export of FocusTimer.formatTime
  todoList.js               ← test-only ES module re-export of TodoList + helpers
tests/
  storageService.property.test.js
  storageService.unit.test.js
  greetingModule.unit.test.js
  focusTimer.unit.test.js
  todoList.unit.test.js
package.json                ← dev deps: vitest, fast-check
vitest.config.js            ← test runner config
.kiro/specs/todo-life-dashboard/
  requirements.md           ← full requirements (15 requirements, acceptance criteria)
  design.md                 ← architecture, data models, state machines, correctness properties
  tasks.md                  ← implementation task list (source of truth for what's done/todo)
clue.md                     ← THIS FILE
```

### Critical architecture rule

**All production JavaScript lives in `js/app.js` as a single IIFE.** The other `js/*.js` files are test-only ES module wrappers that re-export pure functions so Vitest can import them. They do NOT run in the browser.

```js
// js/app.js structure
(function () {
  'use strict';
  var StorageService = { ... };
  var ThemeManager   = { ... };
  var GreetingModule = { ... };
  var STOPPED = 'STOPPED'; var RUNNING = 'RUNNING'; ...
  var FocusTimer     = { ... };
  function createTask(description) { ... }
  var TodoList       = { ... };
  var QuickLinks     = { ... };  // ← STUB — not yet implemented
  var App = { init: function() { ... } };
  document.addEventListener('DOMContentLoaded', function() { App.init(); });
})();
```

---

## 3. How to Run Tests

```bash
npx vitest run                      # run all tests once (CI-safe)
npx vitest run --reporter=verbose   # with full test names
npx vitest                          # watch mode
```

**Current result:** 5 test files, 124 tests, all passing, ~767ms.

---

## 4. DOM Element IDs

Every module wires itself to the DOM using these IDs. Do not rename them.

| Section | Element | ID |
|---|---|---|
| Global | Storage warning banner | `#storage-warning` |
| Header | Theme toggle button | `#theme-toggle` |
| Greeting | Greeting text (h2) | `#greeting-text` |
| Greeting | Time display | `#time-display` |
| Greeting | Date display | `#date-display` |
| Greeting | Name form | `#name-form` |
| Greeting | Name input | `#name-input` |
| Greeting | Name error span | `#name-error` |
| Timer | Timer display | `#timer-display` |
| Timer | Start button | `#timer-start` |
| Timer | Stop button | `#timer-stop` |
| Timer | Reset button | `#timer-reset` |
| Timer | Completion message | `#timer-message` |
| Todo | Add form | `#todo-form` |
| Todo | Task input | `#todo-input` |
| Todo | Error span | `#todo-error` |
| Todo | Sort selector | `#sort-select` |
| Todo | Task list (`<ul>`) | `#todo-list` |
| Links | Add form | `#links-form` |
| Links | Label input | `#link-label-input` |
| Links | URL input | `#link-url-input` |
| Links | Error span | `#links-error` |
| Links | Links panel (`<div>`) | `#links-panel` |

---

## 5. Data Models & Storage Schema

All localStorage keys are prefixed `tld_` to avoid collisions.

```js
// Task object
{
  id:          string,   // crypto.randomUUID() or Date.now().toString()
  description: string,   // 1–200 chars, trimmed
  done:        boolean,  // false = incomplete, true = complete
  createdAt:   number    // Date.now() — used for default sort order
}

// Link object
{
  id:    string,   // crypto.randomUUID() or Date.now().toString()
  label: string,   // non-empty, trimmed
  url:   string    // validated via URL constructor, http/https only
}
```

| localStorage key | Type | Default |
|---|---|---|
| `tld_tasks` | `Task[]` | `[]` |
| `tld_links` | `Link[]` | `[]` |
| `tld_username` | `string` | `null` (absent) |
| `tld_theme` | `'light' \| 'dark'` | `'light'` |
| `tld_sort_order` | `'default' \| 'az' \| 'completed_last'` | `'default'` |

---

## 6. Module Reference (what's implemented)

### StorageService ✅ COMPLETE
Central localStorage wrapper. All modules use this — never call `localStorage` directly.

```js
StorageService.available          // boolean — false if localStorage unavailable
StorageService.init()             // probe availability; sets .available
StorageService.get(key)           // JSON.parse; returns null on error/missing; removes corrupt key
StorageService.set(key, value)    // JSON.stringify; returns true/false; catches QuotaExceededError
StorageService.remove(key)        // removes tld_{key}
StorageService.clear()            // removes all tld_* keys
```

### ThemeManager ✅ COMPLETE
```js
ThemeManager.init()               // reads saved theme, applies it, wires #theme-toggle click
ThemeManager.apply(theme)         // sets data-theme on <html>; updates button label/aria-pressed
ThemeManager.toggle()             // flips theme, saves to storage
ThemeManager.current()            // returns 'light' or 'dark'
```

### GreetingModule ✅ COMPLETE
```js
GreetingModule.init()             // reads username, renders immediately, starts 1s interval, wires #name-form
GreetingModule.tick()             // called every 1000ms; reads fresh new Date(); updates #time-display + #greeting-text
GreetingModule.setName(name)      // trims; if empty → remove from storage; if >50 chars → show error; else save + re-render
GreetingModule.getGreeting(hour)  // pure: 5–11→Morning, 12–17→Afternoon, 18–20→Evening, 21–4→Night
GreetingModule.buildGreeting(h,n) // pure: phrase + ', ' + name (or just phrase if name empty/null)
GreetingModule.formatTime(date)   // pure: returns 'HH:MM:SS'
GreetingModule.formatDate(date)   // pure: returns 'Weekday, DD Month YYYY'
```

### FocusTimer ✅ COMPLETE
State machine: `STOPPED → RUNNING → PAUSED → RUNNING → DONE → STOPPED`

```js
FocusTimer._state      // 'STOPPED' | 'RUNNING' | 'PAUSED' | 'DONE'
FocusTimer._remaining  // seconds remaining (starts at 1500 = 25 min)
FocusTimer._interval   // setInterval handle or null

FocusTimer.init()           // renders 25:00, wires Start/Stop/Reset buttons, calls updateControls()
FocusTimer.start()          // STOPPED/PAUSED → RUNNING; guards against duplicate intervals
FocusTimer.stop()           // RUNNING → PAUSED; preserves remaining time
FocusTimer.reset()          // any → STOPPED; restores _remaining=1500
FocusTimer.tick()           // decrements _remaining; calls onComplete() at 0
FocusTimer.onComplete()     // RUNNING → DONE; adds .timer-complete CSS class; sets #timer-message
FocusTimer.formatTime(sec)  // pure: returns 'MM:SS'
FocusTimer.updateDisplay()  // writes formatTime(_remaining) to #timer-display
FocusTimer.updateControls() // Start disabled when RUNNING; Stop disabled when not RUNNING; Reset always enabled
```

### TodoList ✅ COMPLETE
```js
TodoList._tasks      // Task[] — in-memory collection
TodoList._sortOrder  // 'default' | 'az' | 'completed_last'

// Factory (IIFE-scoped, not on TodoList object)
createTask(description)  // returns { id, description, done: false, createdAt }

// Pure functions
TodoList.getSortedTasks(tasks, order)  // returns sorted copy; never mutates source
  // 'default'        → sort by createdAt ascending
  // 'az'             → sort by description.localeCompare()
  // 'completed_last' → incomplete first, ties by createdAt

// Mutations (all call save() + render() on success)
TodoList.addTask(desc)          // trim, validate non-empty; show #todo-error on failure
TodoList.editTask(id, newDesc)  // trim, validate; show error without saving on invalid
TodoList.toggleTask(id)         // flip done; revert + show error if save() returns false
TodoList.deleteTask(id)         // filter out by id

// DOM
TodoList.renderTask(task)  // returns <li> with checkbox, span.task-description[.done], Edit btn, Delete btn
TodoList.render()          // clears #todo-list; appends getSortedTasks → renderTask for each
TodoList.save()            // StorageService.set('tasks', _tasks); returns boolean

// Lifecycle
TodoList.setSortOrder(order)  // saves _sortOrder, persists to storage, re-renders
TodoList.init()               // loads tasks+order from storage; renders; wires #todo-form + #sort-select
```

**Edit button behavior:** clicking Edit swaps the description `<span>` for an `<input>` pre-filled with the current text. Enter or blur → `editTask(id, newValue)`. Escape → restores original span without saving.

### QuickLinks ❌ NOT YET IMPLEMENTED
The object exists in `app.js` as a stub with empty methods. All methods need to be implemented.

```js
// What needs to be built:
QuickLinks._links    // Link[] — in-memory collection

QuickLinks.validateUrl(url)      // wrap new URL(url) in try/catch; return false if throws or scheme not http/https
QuickLinks.addLink(label, url)   // trim+validate label (non-empty) and url; create Link; save; render; show #links-error on failure
QuickLinks.deleteLink(id)        // filter out by id; save; render
QuickLinks.openLink(url)         // window.open(url, '_blank', 'noopener,noreferrer')
QuickLinks.renderLink(link)      // returns <div> with a <button> (opens link) and a Delete <button>
QuickLinks.render()              // clears #links-panel; appends renderLink for each link
QuickLinks.save()                // StorageService.set('links', _links)
QuickLinks.init()                // loads links from storage (default []); renders; wires #links-form submit
```

**Link object:** `{ id: crypto.randomUUID() || Date.now().toString(), label: string, url: string }`

---

## 7. What's Done vs. What's Left

### ✅ Done (Tasks 1–7)

| Task | Status | Notes |
|---|---|---|
| 1. Scaffold HTML/CSS/JS | ✅ | index.html, style.css, app.js IIFE skeleton |
| 2. StorageService | ✅ | Full CRUD + error handling + tests |
| 3. ThemeManager | ✅ | Light/dark toggle + persistence |
| 4. GreetingModule | ✅ | Clock, greeting, name input |
| 5. FocusTimer | ✅ | Full state machine + controls |
| 6. Checkpoint | ✅ | 73/73 tests passed |
| 7. TodoList | ✅ | Full CRUD + sort + DOM rendering |

### ❌ Remaining (Tasks 8–12)

#### Task 8 — QuickLinks (NEXT UP)
- **8.1** `validateUrl()`, `addLink()`, `deleteLink()`, `openLink()` — core logic
- **8.2*** Property tests for QuickLinks (Properties 12, 13, 14) — *optional*
- **8.3** `renderLink()`, `render()`, `save()`, `init()` — DOM + lifecycle
- **8.4*** Unit tests for QuickLinks — *optional*

#### Task 9 — Checkpoint
- Run all tests; confirm everything passes before moving to CSS/polish.

#### Task 10 — Responsive layout and visual polish
- **10.1** CSS grid/flexbox: 2-col desktop (≥768px), 1-col mobile (<768px); no horizontal scroll 320–2560px
- **10.2** Contrast-compliant color tokens: `--color-text`, `--color-bg`, `--color-surface`, `--color-accent`, `--color-muted` for both themes; minimum 4.5:1 contrast ratio; `.done` strikethrough style
- **10.3** Accessibility: `aria-label` on icon-only buttons; `role="alert"` + `aria-live="polite"` on error spans; keyboard nav (Tab/Enter/Space); `aria-pressed` on theme toggle

#### Task 11 — Error handling and edge cases
- **11.1** Show `#storage-warning` banner if `StorageService.available === false` after `App.init()`
- **11.2** Each module's `init()` treats `null` from `StorageService.get()` as "no data" → use defaults
- **11.3** `window.onerror` + `window.addEventListener('unhandledrejection', ...)` → `console.error`

#### Task 12 — Final checkpoint
- All tests pass; app works end-to-end in browser.

### Optional tasks (skippable for MVP)
`3.2`, `3.3`, `4.2`, `4.4`, `5.3`, `5.4`, `7.2`, `7.4`, `7.6`, `8.2`, `8.4`

---

## 8. Coding Conventions

Follow these exactly to stay consistent with existing code:

1. **No ES6 modules in `app.js`** — it's an IIFE. Use `var`, not `let`/`const`. Use `function` declarations or `function` expressions.
2. **Test-only modules** (`js/storageService.js`, `js/greetingModule.js`, etc.) use ES module syntax (`export`, `import`) because Vitest needs them. They mirror the logic from `app.js`.
3. **Guard DOM calls** in test-only modules with `if (typeof document !== 'undefined')` so they don't crash in Node.
4. **Storage keys** always use the short form (e.g., `'tasks'`, `'links'`) — `StorageService` adds the `tld_` prefix internally.
5. **`save()` returns a boolean** — callers that need to react to failure (e.g., `toggleTask`) must check it.
6. **`render()` is always a full re-render** — clear the container, re-build from `_tasks`/`_links`. No incremental DOM patching.
7. **Inline errors** go in the module's error span (`#todo-error`, `#links-error`, etc.) as `textContent`. Clear the error at the start of each operation.
8. **`aria-label`** on every button that has no visible text label.

---

## 9. Test Conventions

- Test files live in `tests/` and import from `js/*.js` ES modules.
- Each test file imports `StorageService` from `js/storageService.js` and calls `StorageService.init()` in a `beforeEach` to reset state.
- To test storage failure: `vi.fn().mockReturnValue(false)` on `StorageService.set`.
- Property tests use `fast-check` (`fc`). Minimum 100 runs per property (`numRuns: 100`).
- Tag each property test with: `// Feature: todo-life-dashboard, Property N: <description>`

---

## 10. How to Continue

1. **Run tests first** to confirm baseline: `npx vitest run`
2. **Read `js/app.js`** — specifically the `QuickLinks` stub at the bottom (before `App`) to see what's there.
3. **Implement Task 8** in order: 8.1 → 8.3 (8.2 and 8.4 are optional).
   - Implement in both `js/app.js` (IIFE) and `js/quickLinks.js` (new test-only ES module).
   - Follow the same pattern as `js/todoList.js`.
4. **Run Task 9 checkpoint** after Task 8.
5. **Implement Task 10** (CSS polish) — edit `css/style.css` only.
6. **Implement Task 11** (error handling) — small additions to `App.init()` and each module's `init()`.
7. **Run Task 12 final checkpoint**.

The full spec is in `.kiro/specs/todo-life-dashboard/` if you need deeper detail on any requirement.
