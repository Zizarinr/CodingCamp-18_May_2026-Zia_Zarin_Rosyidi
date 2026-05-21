# Implementation Plan: To-Do Life Dashboard

## Overview

Implement the To-Do Life Dashboard as three static files (`index.html`, `css/style.css`, `js/app.js`) using only vanilla HTML, CSS, and JavaScript. All logic is organized inside a single IIFE in `app.js`; all persistence uses `window.localStorage` via a central `StorageService`. Modules are built incrementally, each wired into the `App.init()` controller before moving to the next.

---

## Tasks

- [x] 1. Scaffold project files and HTML structure
  - Create `index.html` with semantic sectioning: `<header>` for theme toggle, `<main>` with four `<section>` elements for Greeting, Timer, Todo, and Quick Links, and a `<div id="storage-warning">` banner (hidden by default)
  - Create `css/style.css` with a CSS reset, CSS custom property declarations for both `[data-theme="light"]` and `[data-theme="dark"]` on `<html>`, and placeholder rule-sets for each section
  - Create `js/app.js` as an IIFE (`(function() { ... })()`) containing empty object stubs for `StorageService`, `ThemeManager`, `GreetingModule`, `FocusTimer`, `TodoList`, `QuickLinks`, and an `App` controller with an `init()` that calls each module's `init()` on `DOMContentLoaded`
  - Link `css/style.css` in `<head>` and `js/app.js` at the bottom of `<body>` with `defer`
  - _Requirements: 15.1, 15.2_

- [x] 2. Implement StorageService
  - [x] 2.1 Implement `StorageService.init()`, `.get()`, `.set()`, `.remove()`, and `.clear()`
    - `init()`: probe availability with a `try/catch` around `localStorage.setItem('tld_probe', '1')` / `removeItem`; set `StorageService.available`
    - `get(key)`: wrap `JSON.parse(localStorage.getItem('tld_' + key))` in `try/catch`; on error call `remove(key)` and return `null`
    - `set(key, value)`: wrap `localStorage.setItem('tld_' + key, JSON.stringify(value))` in `try/catch`; catch `QuotaExceededError` and its vendor variants; return `false` on failure, `true` on success
    - `remove(key)`: call `localStorage.removeItem('tld_' + key)`
    - `clear()`: iterate `localStorage` keys and remove those starting with `tld_`
    - _Requirements: 14.1, 14.2, 14.4_

  - [x] 2.2 Write property test for StorageService round-trip (Property 3)
    - **Property 3: Task collection storage round-trip**
    - **Validates: Requirements 9.4, 14.1**
    - Use fast-check `fc.array(fc.record({ id: fc.string(), description: fc.string(), done: fc.boolean(), createdAt: fc.integer() }))` as the arbitrary; assert deep equality after set → get

  - [x] 2.3 Write unit tests for StorageService error paths
    - Mock `localStorage.setItem` to throw `QuotaExceededError`; verify `set()` returns `false`
    - Set a non-JSON string directly in `localStorage`; verify `get()` returns `null` and key is removed
    - Mock `localStorage` to throw on probe; verify `available === false`
    - _Requirements: 14.2, 14.4_

- [x] 3. Implement ThemeManager
  - [x] 3.1 Implement `ThemeManager.init()`, `.apply()`, `.toggle()`, and `.current()`
    - `init()`: read `StorageService.get('theme')`; fall back to `'light'`; call `apply(theme)`; attach `click` listener to the theme toggle button
    - `apply(theme)`: set `document.documentElement.setAttribute('data-theme', theme)`; update toggle button label/icon to reflect the active theme
    - `toggle()`: flip `current()`, call `apply()`, call `StorageService.set('theme', newTheme)`
    - `current()`: return `document.documentElement.getAttribute('data-theme')`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]* 3.2 Write property test for ThemeManager toggle involution (Property 15)
    - **Property 15: Theme toggle is an involution**
    - **Validates: Requirements 13.2**
    - Use `fc.constantFrom('light', 'dark')` as the arbitrary; apply initial theme, toggle twice, assert theme equals initial value

  - [ ]* 3.3 Write unit tests for ThemeManager
    - Verify `data-theme` attribute on `<html>` matches the applied theme after `apply()`
    - Verify saved theme is read and applied on `init()`
    - Verify default `'light'` is applied when no saved theme exists
    - _Requirements: 13.4, 13.5_

- [x] 4. Implement GreetingModule
  - [x] 4.1 Implement `GreetingModule.getGreeting()`, `buildGreeting()`, `formatTime()`, and `formatDate()`
    - `getGreeting(hour)`: pure function mapping hour 0–23 to one of the four greeting strings per the algorithm in the design
    - `buildGreeting(hour, name)`: pure function; if name is non-empty return `phrase + ', ' + name`, else return phrase
    - `formatTime(date)`: return `HH:MM:SS` zero-padded string
    - `formatDate(date)`: return `"Weekday, DD Month YYYY"` using `toLocaleDateString` or manual mapping
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 4.2 Write property tests for greeting logic (Properties 1 and 2)
    - **Property 1: Greeting covers all hours with correct range mapping**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Use `fc.integer({ min: 0, max: 23 })` as the arbitrary; assert result is one of the four known strings and matches the correct range
    - **Property 2: Greeting with name appended**
    - **Validates: Requirements 2.5**
    - Use `fc.integer({ min: 0, max: 23 })` and `fc.string({ minLength: 1 })` as arbitraries; assert result starts with `getGreeting(hour) + ', ' + name`

  - [x] 4.3 Implement `GreetingModule.init()`, `tick()`, and `setName()`
    - `init()`: read `StorageService.get('username')`; render initial time/date/greeting; start `setInterval(tick, 1000)`; attach submit listener to the name input form
    - `tick()`: call `new Date()`, update time display via `formatTime`, update greeting via `buildGreeting`
    - `setName(name)`: trim and validate (max 50 chars); save to `StorageService`; re-render greeting
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.4 Write unit tests for GreetingModule
    - Verify `buildGreeting(hour, null)` returns just the phrase with no comma
    - Verify `init()` reads and displays saved username from storage
    - Verify clock updates the displayed time on each tick
    - _Requirements: 2.6, 3.3_

- [x] 5. Implement FocusTimer
  - [x] 5.1 Implement `FocusTimer.formatTime()` and the state machine core
    - `formatTime(seconds)`: pure function returning `MM:SS` zero-padded string
    - Define state constants: `STOPPED`, `RUNNING`, `PAUSED`, `DONE`
    - Implement `start()`, `stop()`, `reset()`, `tick()`, `onComplete()`, `updateDisplay()`, `updateControls()` per the state machine diagram in the design
    - `tick()`: decrement `remaining` by 1; if `remaining === 0` call `onComplete()`
    - `onComplete()`: clear interval, set state to `DONE`, show visual completion signal (e.g., flash display, update label)
    - `reset()`: clear interval, set `remaining = 1500`, set state to `STOPPED`, call `updateDisplay()` and `updateControls()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4_

  - [x] 5.2 Implement `FocusTimer.init()` and wire controls
    - `init()`: render initial `25:00`, attach `click` listeners to Start, Stop, Reset buttons, call `updateControls()`
    - `updateControls()`: enable/disable Start, Stop, Reset based on current state per Requirements 5.5, 5.6, 5.7
    - _Requirements: 5.5, 5.6, 5.7_

  - [ ]* 5.3 Write property test for FocusTimer display format (Property 16)
    - **Property 16: Timer display format**
    - **Validates: Requirements 4.5**
    - Use `fc.integer({ min: 0, max: 1500 })` as the arbitrary; assert result matches `/^\d{2}:\d{2}$/` with MM in [00, 25] and SS in [00, 59]

  - [ ]* 5.4 Write unit tests for FocusTimer state machine
    - Test each state transition: STOPPED→RUNNING, RUNNING→PAUSED, PAUSED→RUNNING, RUNNING→DONE, DONE→STOPPED, PAUSED→STOPPED, RUNNING→STOPPED (via reset)
    - Verify `onComplete()` is called when `remaining` reaches 0 using fake timers
    - Verify Start is disabled while RUNNING; Stop is disabled while PAUSED/STOPPED with remaining > 0
    - _Requirements: 4.2, 4.3, 4.4, 5.5, 5.6, 5.7_

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement TodoList
  - [ ] 7.1 Implement `TodoList.getSortedTasks()` and data helpers
    - `getSortedTasks(tasks, order)`: pure function; spread `[...tasks]` before sorting; implement all three sort orders (`default`, `az`, `completed_last`) per the algorithm in the design
    - Define `Task` factory: `{ id: crypto.randomUUID() || Date.now().toString(), description, done: false, createdAt: Date.now() }`
    - _Requirements: 10.1, 10.2_

  - [ ]* 7.2 Write property tests for getSortedTasks (Properties 4, 5, 6, 7)
    - **Property 4 & 5: Sort does not mutate source; every task appears exactly once**
    - **Validates: Requirements 10.1, 10.2**
    - Use `fc.array(fc.record({ id: fc.uuid(), description: fc.string(), done: fc.boolean(), createdAt: fc.integer() }))` and `fc.constantFrom('default', 'az', 'completed_last')`; assert source unchanged and result has same id set
    - **Property 6: Completed Last sort invariant**
    - **Validates: Requirements 10.1**
    - Assert no incomplete task appears at a higher index than any complete task
    - **Property 7: A–Z sort invariant**
    - **Validates: Requirements 10.1**
    - Assert every adjacent pair satisfies `localeCompare <= 0`

  - [ ] 7.3 Implement `TodoList.addTask()`, `editTask()`, `toggleTask()`, and `deleteTask()`
    - `addTask(desc)`: trim and validate (non-empty, ≤ 200 chars); create Task; push to collection; call `save()`; call `render()`; on validation failure show inline error
    - `editTask(id, newDesc)`: trim and validate; update matching task's `description`; call `save()`; call `render()`; on validation failure show inline error without saving
    - `toggleTask(id)`: flip `done`; call `save()`; if `save()` returns `false` revert `done` and show inline error
    - `deleteTask(id)`: filter out task by id; call `save()`; call `render()`
    - _Requirements: 6.2, 6.3, 6.4, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 7.4 Write property tests for TodoList mutations (Properties 8, 9, 10, 11)
    - **Property 8: Valid task addition grows collection by exactly one**
    - **Validates: Requirements 6.2, 6.4**
    - Use `fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)`; assert length +1, `done === false`, description equals trimmed input
    - **Property 9: Whitespace-only descriptions are rejected**
    - **Validates: Requirements 6.3, 7.4**
    - Use `fc.string().map(s => s.replace(/\S/g, ' '))` (whitespace-only); assert collection unchanged for both `addTask` and `editTask`
    - **Property 10: Task completion toggle is an involution**
    - **Validates: Requirements 8.2, 8.3**
    - Assert toggling twice restores original `done` value
    - **Property 11: Delete removes only the target task**
    - **Validates: Requirements 8.6**
    - Assert target id absent; all other tasks present with original field values

  - [ ] 7.5 Implement `TodoList.renderTask()`, `render()`, `save()`, `setSortOrder()`, and `init()`
    - `renderTask(task)`: build a task row `<li>` with checkbox, description span, Edit button, Delete button; attach inline event listeners
    - `render()`: clear list DOM; call `getSortedTasks(tasks, sortOrder)`; append each `renderTask()` result
    - `save()`: call `StorageService.set('tasks', tasks)`; return the boolean result
    - `setSortOrder(order)`: save to `StorageService`; call `render()`
    - `init()`: load tasks from `StorageService.get('tasks')` (default `[]`); load sort order (default `'default'`); call `render()`; attach Add form submit listener and sort selector change listener; after adding a task return focus to the input field
    - _Requirements: 6.1, 9.1, 9.2, 9.3, 10.3, 10.4_

  - [ ]* 7.6 Write unit tests for TodoList edge cases
    - Verify edit with valid description updates task and saves
    - Verify edit cancel restores original description without saving
    - Mock `StorageService.set` to return `false`; verify `toggleTask` reverts `done` and shows error
    - _Requirements: 7.3, 7.5, 8.4_

- [ ] 8. Implement QuickLinks
  - [ ] 8.1 Implement `QuickLinks.validateUrl()`, `addLink()`, `deleteLink()`, and `openLink()`
    - `validateUrl(url)`: wrap `new URL(url)` in `try/catch`; return `false` on throw; return `false` if scheme is not `http:` or `https:`; return `true` otherwise
    - `addLink(label, url)`: trim and validate label (non-empty) and url (`validateUrl`); create Link `{ id, label, url }`; push to collection; call `save()`; call `render()`; on failure show inline error
    - `deleteLink(id)`: filter out link by id; call `save()`; call `render()`
    - `openLink(url)`: call `window.open(url, '_blank', 'noopener,noreferrer')`
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 12.1, 12.2_

  - [ ]* 8.2 Write property tests for QuickLinks (Properties 12, 13, 14)
    - **Property 12: Delete link removes only the target link**
    - **Validates: Requirements 12.2**
    - Assert target id absent; all other links present with original field values
    - **Property 13: URL validation rejects non-URLs**
    - **Validates: Requirements 11.4**
    - Use `fc.string()` filtered to strings that throw in `new URL()`; assert `validateUrl` returns `false`
    - **Property 14: URL validation accepts valid http/https URLs**
    - **Validates: Requirements 11.2**
    - Use `fc.webUrl()` (fast-check built-in); assert `validateUrl` returns `true`

  - [ ] 8.3 Implement `QuickLinks.renderLink()`, `render()`, `save()`, and `init()`
    - `renderLink(link)`: build a `<div>` containing a `<button>` (opens link) and a Delete `<button>`; attach click listeners
    - `render()`: clear panel DOM; append each `renderLink()` result
    - `save()`: call `StorageService.set('links', links)`
    - `init()`: load links from `StorageService.get('links')` (default `[]`); call `render()`; attach Add form submit listener
    - _Requirements: 11.1, 11.6_

  - [ ]* 8.4 Write unit tests for QuickLinks
    - Mock `window.open`; verify `openLink` calls it with correct URL and `'_blank'`
    - Verify empty label or invalid URL shows inline validation message and does not create a link
    - _Requirements: 11.3, 11.4_

- [ ] 9. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement responsive layout and visual polish
  - [ ] 10.1 Build CSS grid/flexbox layout in `css/style.css`
    - Implement a two-column grid for desktop (≥ 768 px) and single-column stack for mobile (< 768 px) using CSS Grid with `auto-fit` / `minmax` or explicit media queries
    - Ensure no horizontal scroll at any viewport width from 320 px to 2560 px; use `max-width` on the main container and `box-sizing: border-box` globally
    - Apply consistent spacing scale (e.g., 4 px base unit), font-size hierarchy, and color tokens via CSS custom properties for both themes
    - _Requirements: 15.3, 15.4_

  - [ ] 10.2 Implement contrast-compliant color tokens for both themes
    - Define `--color-text`, `--color-bg`, `--color-surface`, `--color-accent`, and `--color-muted` custom properties under `[data-theme="light"]` and `[data-theme="dark"]`
    - Verify all text/background pairs meet the 4.5:1 minimum contrast ratio (use a contrast checker tool or axe-core)
    - Apply completed-task strikethrough style and visual distinction for done tasks
    - _Requirements: 15.5, 15.6_

  - [ ] 10.3 Add accessibility attributes and keyboard navigation
    - Add `aria-label` to all icon-only buttons (theme toggle, delete, edit)
    - Add `role="alert"` and `aria-live="polite"` to inline validation message containers
    - Verify all interactive controls are reachable and operable via Tab, Enter, and Space
    - Add `aria-pressed` to the theme toggle button reflecting current theme state
    - _Requirements: 15.4_

- [ ] 11. Implement error handling and edge cases
  - [ ] 11.1 Render LocalStorage unavailable banner
    - In `App.init()`, after `StorageService.init()`, check `StorageService.available`; if `false`, show the `#storage-warning` banner with the message "⚠ Local storage is unavailable. Your data will not be saved."
    - Style the banner as a persistent top-of-page strip in both themes
    - _Requirements: 14.2_

  - [ ] 11.2 Handle corrupt data recovery in each module
    - In each module's `init()`, treat a `null` return from `StorageService.get()` as "no data" and initialize with defaults (empty array for tasks/links, `null` for username, `'light'` for theme, `'default'` for sort order)
    - Verify the corrupted key is removed by `StorageService.get()` on parse failure (already handled in StorageService; confirm each module does not re-save corrupt data)
    - _Requirements: 14.4_

  - [ ] 11.3 Add global error handler
    - Attach `window.onerror` and `window.addEventListener('unhandledrejection', ...)` handlers that log errors to `console.error`
    - Ensure no unhandled errors surface to the user during normal operation across Chrome, Firefox, Edge, and Safari
    - _Requirements: 14.3_

- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; the core implementation tasks are sufficient for a working dashboard.
- The design document uses vanilla JavaScript throughout — no build step or transpilation is needed.
- Property tests require installing `fast-check` and `vitest` (or Jest) as dev dependencies; they are isolated to a `tests/` directory and do not affect the production files.
- Each task references specific requirements for traceability.
- Checkpoints ensure incremental validation at natural break points.
- Property tests validate universal correctness properties across the full input space; unit tests validate specific examples and edge cases.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "4.2", "4.3", "5.1", "7.1"] },
    { "id": 3, "tasks": ["4.4", "5.2", "7.2", "8.1"] },
    { "id": 4, "tasks": ["5.3", "5.4", "7.3", "8.2", "8.3"] },
    { "id": 5, "tasks": ["7.4", "7.5", "8.4"] },
    { "id": 6, "tasks": ["7.6", "10.1"] },
    { "id": 7, "tasks": ["10.2", "10.3", "11.1", "11.2", "11.3"] }
  ]
}
```
