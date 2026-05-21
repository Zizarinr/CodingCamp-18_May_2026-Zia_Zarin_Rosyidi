# To-Do Life Dashboard — Project Clue

> Last updated at Checkpoint 6 (after tasks 1–5 complete, 73/73 tests passing)

---

## What Is This Project?

A **homepage-style, single-page web application** that helps users organize their day. Built with **vanilla HTML, CSS, and JavaScript only** — no frameworks, no backend, no build step.

All data is persisted client-side using the **Browser LocalStorage API**. The dashboard has four core modules:

| Module | What it does |
|---|---|
| **Greeting** | Shows current time (HH:MM:SS), date, and a time-aware greeting. Supports a custom user name. |
| **Focus Timer** | 25-minute Pomodoro countdown with Start / Stop / Reset controls. |
| **To-Do List** | Add, edit, complete, delete, and sort tasks. Persisted to localStorage. |
| **Quick Links** | User-defined shortcut buttons that open external URLs in a new tab. |

Light/Dark theme toggle is also supported, with the preference saved to localStorage.

---

## File Structure

```
index.html              ← markup skeleton, links css/style.css and js/app.js
css/
  style.css             ← all styles, CSS custom properties for theming
js/
  app.js                ← ALL JavaScript: one IIFE containing every module
  storageService.js     ← testable ES module export of StorageService pure logic
  greetingModule.js     ← testable ES module export of GreetingModule pure functions
  focusTimer.js         ← testable ES module export of FocusTimer.formatTime
tests/
  storageService.property.test.js   ← Property 3: round-trip test
  storageService.unit.test.js       ← StorageService error path unit tests
  greetingModule.unit.test.js       ← GreetingModule unit + setNameLogic tests
  focusTimer.unit.test.js           ← FocusTimer formatTime + state machine tests
.kiro/specs/todo-life-dashboard/
  requirements.md       ← full requirements document
  design.md             ← architecture, data models, correctness properties
  tasks.md              ← implementation plan (this file's source of truth)
```

> **Key rule:** All production JavaScript lives inside a single IIFE in `js/app.js`. The `js/*.js` module files are **test-only exports** — they mirror the pure functions from `app.js` so Vitest can import them as ES modules.

---

## Architecture

```
index.html
  └── App.init()  (DOMContentLoaded)
        ├── StorageService.init()   ← probe localStorage availability
        ├── ThemeManager.init()     ← apply saved theme, wire toggle button
        ├── GreetingModule.init()   ← render time/date/greeting, start clock
        ├── FocusTimer.init()       ← render 25:00, wire Start/Stop/Reset
        ├── TodoList.init()         ← load tasks, render list, wire form  [NOT YET]
        └── QuickLinks.init()       ← load links, render panel, wire form [NOT YET]
```

All modules share `StorageService` for persistence. Storage keys are prefixed `tld_` to avoid collisions.

---

## DOM Element IDs (important for wiring)

| Element | ID |
|---|---|
| Storage warning banner | `#storage-warning` |
| Theme toggle button | `#theme-toggle` |
| Greeting text | `#greeting-text` |
| Time display | `#time-display` |
| Date display | `#date-display` |
| Name form | `#name-form` |
| Name input | `#name-input` |
| Name error | `#name-error` |
| Timer display | `#timer-display` |
| Timer start button | `#timer-start` |
| Timer stop button | `#timer-stop` |
| Timer reset button | `#timer-reset` |
| Timer message | `#timer-message` |
| Todo form | `#todo-form` |
| Todo input | `#todo-input` |
| Todo error | `#todo-error` |
| Sort selector | `#sort-select` |
| Task list | `#todo-list` |
| Links form | `#links-form` |
| Link label input | `#link-label-input` |
| Link URL input | `#link-url-input` |
| Links error | `#links-error` |
| Links panel | `#links-panel` |

---

## ✅ Completed Tasks

### Task 1 — Scaffold project files and HTML structure
- `index.html` with semantic sections for all four modules
- `css/style.css` with CSS reset and custom property placeholders for light/dark themes
- `js/app.js` as an IIFE with empty stubs for all modules
- All modules wired into `App.init()` on `DOMContentLoaded`

### Task 2 — StorageService ✅
- `init()` — probes localStorage availability, sets `StorageService.available`
- `get(key)` — JSON.parse with try/catch; removes corrupt key and returns null on error
- `set(key, value)` — JSON.stringify with try/catch; catches QuotaExceededError; returns boolean
- `remove(key)` — removes a single key
- `clear()` — removes all `tld_` prefixed keys
- **Tests:** property test (round-trip), unit tests (quota error, corrupt data, unavailable probe)

### Task 3 — ThemeManager ✅
- `init()` — reads saved theme, applies it, wires the toggle button click
- `apply(theme)` — sets `data-theme` on `<html>`, updates button label/icon/aria-pressed
- `toggle()` — flips theme, saves to storage
- `current()` — reads `data-theme` from `<html>`

### Task 4 — GreetingModule ✅
- `getGreeting(hour)` — maps 0–23 → "Good Morning/Afternoon/Evening/Night"
- `buildGreeting(hour, name)` — combines phrase + optional name
- `formatTime(date)` — returns zero-padded `HH:MM:SS`
- `formatDate(date)` — returns `"Weekday, DD Month YYYY"`
- `init()` — reads saved username, renders time/date/greeting immediately, starts 1s interval, wires name form
- `tick()` — reads fresh `new Date()` each call, updates time and greeting displays
- `setName(name)` — trims, validates (max 50 chars), saves/removes from storage, re-renders
- **Tests:** 42 unit tests covering all pure functions and setNameLogic

### Task 5 — FocusTimer ✅
- State constants: `STOPPED`, `RUNNING`, `PAUSED`, `DONE`
- `formatTime(seconds)` — returns zero-padded `MM:SS`
- `start()` — STOPPED/PAUSED → RUNNING, starts interval (guards against duplicates)
- `stop()` — RUNNING → PAUSED, preserves remaining time
- `reset()` — any state → STOPPED, restores 1500s
- `tick()` — decrements remaining, calls `onComplete()` at 0
- `onComplete()` — RUNNING → DONE, visual flash + completion message
- `updateDisplay()` — writes `formatTime(_remaining)` to `#timer-display`
- `updateControls()` — Start disabled when RUNNING; Stop disabled when not RUNNING; Reset always enabled
- `init()` — renders 25:00, wires Start/Stop/Reset click listeners, calls `updateControls()`
- **Tests:** 27 unit tests covering all state transitions and formatTime edge cases

---

## ❌ Not Yet Done

### Task 6 — Checkpoint *(in progress — tests passing)*
- 73/73 tests pass as of this checkpoint

### Task 7 — TodoList *(not started)*
- `7.1` — `getSortedTasks()` and Task factory (pure functions)
- `7.2`* — Property tests for getSortedTasks (Properties 4, 5, 6, 7) *(optional)*
- `7.3` — `addTask()`, `editTask()`, `toggleTask()`, `deleteTask()`
- `7.4`* — Property tests for mutations (Properties 8, 9, 10, 11) *(optional)*
- `7.5` — `renderTask()`, `render()`, `save()`, `setSortOrder()`, `init()`
- `7.6`* — Unit tests for edge cases *(optional)*

### Task 8 — QuickLinks *(not started)*
- `8.1` — `validateUrl()`, `addLink()`, `deleteLink()`, `openLink()`
- `8.2`* — Property tests (Properties 12, 13, 14) *(optional)*
- `8.3` — `renderLink()`, `render()`, `save()`, `init()`
- `8.4`* — Unit tests *(optional)*

### Task 9 — Checkpoint *(not started)*

### Task 10 — Responsive layout and visual polish *(not started)*
- `10.1` — CSS grid/flexbox layout (desktop 2-col, mobile 1-col, 320px–2560px)
- `10.2` — Contrast-compliant color tokens for both themes (4.5:1 minimum)
- `10.3` — Accessibility attributes and keyboard navigation

### Task 11 — Error handling and edge cases *(not started)*
- `11.1` — LocalStorage unavailable banner (`#storage-warning`)
- `11.2` — Corrupt data recovery in each module
- `11.3` — Global `window.onerror` / `unhandledrejection` handler

### Task 12 — Final checkpoint *(not started)*

---

## Optional Tasks (skippable for MVP)

Tasks marked `*` are optional per the spec. Skipping them still produces a fully working dashboard:

- `3.2` — ThemeManager toggle involution property test (Property 15)
- `3.3` — ThemeManager unit tests
- `4.2` — Greeting property tests (Properties 1 & 2)
- `4.4` — GreetingModule unit tests
- `5.3` — FocusTimer display format property test (Property 16)
- `5.4` — FocusTimer state machine unit tests
- `7.2`, `7.4`, `7.6` — TodoList property/unit tests
- `8.2`, `8.4` — QuickLinks property/unit tests

---

## Test Summary (Checkpoint 6)

```
Test Files  4 passed (4)
     Tests  73 passed (73)
  Duration  ~689ms
```

| File | Tests | Coverage |
|---|---|---|
| `storageService.property.test.js` | 1 | Property 3: round-trip |
| `storageService.unit.test.js` | 3 | Quota error, corrupt data, unavailable |
| `greetingModule.unit.test.js` | 42 | All pure functions + setNameLogic |
| `focusTimer.unit.test.js` | 27 | formatTime + all state transitions |

---

## Data Models

```js
// Task
{ id: string, description: string, done: boolean, createdAt: number }

// Link
{ id: string, label: string, url: string }

// Storage keys (all prefixed tld_)
tld_tasks        → Task[]
tld_links        → Link[]
tld_username     → string
tld_theme        → 'light' | 'dark'
tld_sort_order   → 'default' | 'az' | 'completed_last'
```

---

## How to Run Tests

```bash
npx vitest run            # run all tests once
npx vitest run --reporter=verbose   # with full test names
npx vitest                # watch mode
```

No build step needed. Open `index.html` directly in a browser to use the app.

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
