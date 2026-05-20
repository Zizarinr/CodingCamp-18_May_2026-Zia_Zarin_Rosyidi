# Requirements Document

## Introduction

The To-Do Life Dashboard is a homepage-style, single-page web application that helps users organize their day. It is built with HTML, CSS, and Vanilla JavaScript only — no frameworks, no backend. All data is persisted client-side using the Browser LocalStorage API. The dashboard presents four core modules: a time-aware Greeting, a Focus Timer, a To-Do List, and a Quick Links panel. It also supports Light/Dark mode toggling and a customizable user name. The application must work across Chrome, Firefox, Edge, and Safari.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Module**: The UI section that displays the current time, date, and a personalized greeting message.
- **Focus_Timer**: The UI section that provides a 25-minute countdown timer with Start, Stop, and Reset controls.
- **Todo_List**: The UI section that manages user tasks — adding, editing, completing, deleting, and sorting.
- **Task**: A single to-do item with a text description and a completion state (done / not done).
- **Quick_Links**: The UI section that displays user-defined shortcut buttons that open external URLs.
- **Link**: A single quick-link entry with a label and a URL.
- **Storage**: The Browser LocalStorage API used to persist all user data client-side.
- **Theme**: The visual color scheme of the Dashboard — either Light or Dark.
- **User_Name**: A custom name entered by the user, displayed in the Greeting_Module.
- **Sort_Order**: The ordering applied to the Task list — options are: default (insertion order), alphabetical, or completed-last.

---

## Requirements

### Requirement 1: Time and Date Display

**User Story:** As a user, I want to see the current time and date on the dashboard, so that I always know what time it is without leaving the page.

#### Acceptance Criteria

1. THE Greeting_Module SHALL display the current time in HH:MM:SS format, updated every second.
2. THE Greeting_Module SHALL display the current full date in a human-readable format (e.g., "Monday, 18 May 2026").
3. WHEN the Dashboard loads, THE Greeting_Module SHALL immediately render the current time and date without requiring user interaction.

---

### Requirement 2: Time-Based Greeting

**User Story:** As a user, I want to see a greeting that changes based on the time of day, so that the dashboard feels personal and contextually relevant.

#### Acceptance Criteria

1. WHEN the local time is between 05:00 and 11:59, THE Greeting_Module SHALL display the greeting "Good Morning".
2. WHEN the local time is between 12:00 and 17:59, THE Greeting_Module SHALL display the greeting "Good Afternoon".
3. WHEN the local time is between 18:00 and 20:59, THE Greeting_Module SHALL display the greeting "Good Evening".
4. WHEN the local time is between 21:00 and 04:59, THE Greeting_Module SHALL display the greeting "Good Night".
5. WHEN the User_Name has been set, THE Greeting_Module SHALL append the User_Name to the greeting (e.g., "Good Morning, Alex").
6. WHEN the User_Name has not been set, THE Greeting_Module SHALL display the greeting without a name suffix.

---

### Requirement 3: Custom User Name

**User Story:** As a user, I want to set a custom name that appears in my greeting, so that the dashboard feels personalized to me.

#### Acceptance Criteria

1. THE Dashboard SHALL provide an input field for the user to enter a User_Name.
2. WHEN the user submits a non-empty User_Name, THE Dashboard SHALL save the User_Name to Storage.
3. WHEN the Dashboard loads, THE Dashboard SHALL read the User_Name from Storage and display it in the Greeting_Module.
4. WHEN the user clears the User_Name field and submits, THE Dashboard SHALL remove the User_Name from Storage and display the greeting without a name suffix.
5. THE User_Name SHALL be limited to a maximum of 50 characters.

---

### Requirement 4: Focus Timer — Countdown

**User Story:** As a user, I want a 25-minute countdown timer, so that I can use the Pomodoro technique to stay focused.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00).
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual or audible completion signal.
5. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 5: Focus Timer — Controls

**User Story:** As a user, I want Start, Stop, and Reset controls for the timer, so that I can manage my focus sessions flexibly.

#### Acceptance Criteria

1. THE Focus_Timer SHALL provide a Start control, a Stop control, and a Reset control.
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin or resume the countdown.
3. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown without resetting the remaining time.
4. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop the countdown and restore the display to 25:00.
5. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL disable the Start control to prevent duplicate activation.
6. WHILE the Focus_Timer is paused or stopped, THE Focus_Timer SHALL disable the Stop control.

---

### Requirement 6: To-Do List — Add Tasks

**User Story:** As a user, I want to add tasks to my to-do list, so that I can track what I need to accomplish.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a text input field and an Add control for creating new Tasks.
2. WHEN the user submits a non-empty task description, THE Todo_List SHALL create a new Task and append it to the list.
3. WHEN the user submits an empty or whitespace-only task description, THE Todo_List SHALL not create a Task and SHALL display an inline validation message.
4. WHEN a new Task is created, THE Todo_List SHALL save the updated task collection to Storage.
5. THE task description SHALL be limited to a maximum of 200 characters.

---

### Requirement 7: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit existing tasks, so that I can correct or update task descriptions without deleting and re-adding them.

#### Acceptance Criteria

1. THE Todo_List SHALL provide an Edit control for each Task.
2. WHEN the user activates the Edit control for a Task, THE Todo_List SHALL replace the task description display with an editable text input pre-filled with the current description.
3. WHEN the user confirms the edit with a non-empty description, THE Todo_List SHALL update the Task description and save the updated collection to Storage.
4. WHEN the user confirms the edit with an empty or whitespace-only description, THE Todo_List SHALL not update the Task and SHALL display an inline validation message.
5. WHEN the user cancels the edit, THE Todo_List SHALL restore the original task description without saving changes.

---

### Requirement 8: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks, so that I can track progress and keep my list clean.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a completion toggle (e.g., checkbox) for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_List SHALL mark the Task as done and apply a visual completed style (e.g., strikethrough).
3. WHEN the user activates the completion toggle for a completed Task, THE Todo_List SHALL mark the Task as not done and remove the completed style.
4. WHEN the completion state of a Task changes, THE Todo_List SHALL save the updated collection to Storage.
5. THE Todo_List SHALL provide a Delete control for each Task.
6. WHEN the user activates the Delete control for a Task, THE Todo_List SHALL remove the Task from the list and save the updated collection to Storage.

---

### Requirement 9: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically, so that my list is still there when I reload the page.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Todo_List SHALL read all Tasks from Storage and render them in the list.
2. WHEN the task collection in Storage is empty or absent, THE Todo_List SHALL render an empty list without errors.
3. THE Todo_List SHALL save the complete task collection to Storage after every add, edit, complete, or delete operation.
4. FOR ALL task collections written to Storage, reading then writing then reading the same collection SHALL produce an equivalent collection (round-trip property).

---

### Requirement 10: To-Do List — Sort Tasks

**User Story:** As a user, I want to sort my task list, so that I can view tasks in the order most useful to me.

#### Acceptance Criteria

1. THE Todo_List SHALL provide a Sort_Order selector with at least the following options: "Default" (insertion order), "A–Z" (alphabetical by description), "Completed Last".
2. WHEN the user selects a Sort_Order, THE Todo_List SHALL re-render the task list in the selected order without modifying the underlying stored collection.
3. WHEN the Dashboard loads, THE Todo_List SHALL apply the previously selected Sort_Order from Storage, or default to "Default" if none is stored.
4. WHEN the user changes the Sort_Order, THE Todo_List SHALL save the selected Sort_Order to Storage.

---

### Requirement 11: Quick Links — Add and Display

**User Story:** As a user, I want to add quick-link buttons for my favorite websites, so that I can open them with a single click from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide input fields for a link label and a URL, and an Add control.
2. WHEN the user submits a non-empty label and a valid URL, THE Quick_Links SHALL create a new Link and display it as a clickable button.
3. WHEN the user activates a Link button, THE Quick_Links SHALL open the associated URL in a new browser tab.
4. WHEN the user submits an empty label or an invalid URL, THE Quick_Links SHALL not create a Link and SHALL display an inline validation message.
5. WHEN a new Link is created, THE Quick_Links SHALL save the updated link collection to Storage.
6. WHEN the Dashboard loads, THE Quick_Links SHALL read all Links from Storage and render them as buttons.

---

### Requirement 12: Quick Links — Delete

**User Story:** As a user, I want to remove quick links I no longer need, so that my links panel stays relevant.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a Delete control for each Link button.
2. WHEN the user activates the Delete control for a Link, THE Quick_Links SHALL remove the Link from the panel and save the updated collection to Storage.

---

### Requirement 13: Light / Dark Mode Toggle

**User Story:** As a user, I want to switch between light and dark mode, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme toggle control visible at all times.
2. WHEN the user activates the Theme toggle, THE Dashboard SHALL switch the active Theme between Light and Dark.
3. WHEN the Theme changes, THE Dashboard SHALL apply the corresponding color scheme to all UI elements immediately without a page reload.
4. WHEN the Dashboard loads, THE Dashboard SHALL read the saved Theme from Storage and apply it.
5. WHEN no Theme is saved in Storage, THE Dashboard SHALL apply the Light Theme by default.
6. WHEN the user changes the Theme, THE Dashboard SHALL save the selected Theme to Storage.

---

### Requirement 14: Data Integrity and Storage

**User Story:** As a user, I want my data to be reliably saved and loaded, so that I never lose my tasks, links, or preferences.

#### Acceptance Criteria

1. THE Storage SHALL persist all user data (Tasks, Links, User_Name, Theme, Sort_Order) using the Browser LocalStorage API.
2. IF the Browser LocalStorage API is unavailable, THEN THE Dashboard SHALL display a warning message informing the user that data will not be saved.
3. THE Dashboard SHALL not throw unhandled JavaScript errors during normal operation across Chrome, Firefox, Edge, and Safari.
4. IF corrupted or unparseable data is found in Storage on load, THEN THE Dashboard SHALL discard the corrupted data, initialize with defaults, and continue operating normally.

---

### Requirement 15: Responsive Layout and Visual Design

**User Story:** As a user, I want the dashboard to look clean and be easy to read on any screen size, so that I can use it on both desktop and mobile.

#### Acceptance Criteria

1. THE Dashboard SHALL use a single CSS file located at `css/style.css` for all styling.
2. THE Dashboard SHALL use a single JavaScript file located at `js/app.js` for all logic.
3. THE Dashboard SHALL render all four modules (Greeting_Module, Focus_Timer, Todo_List, Quick_Links) without horizontal scrolling on viewport widths from 320px to 2560px.
4. THE Dashboard SHALL apply clear visual hierarchy through consistent use of font sizes, spacing, and color contrast.
5. WHILE the Dark Theme is active, THE Dashboard SHALL maintain a minimum contrast ratio of 4.5:1 between text and background colors for all readable content.
6. WHILE the Light Theme is active, THE Dashboard SHALL maintain a minimum contrast ratio of 4.5:1 between text and background colors for all readable content.
