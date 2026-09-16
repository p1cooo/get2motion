# Pico's Dashboard — Product Specification

## Product goal

Pico's Dashboard is a cozy personal productivity app for university/study, assignments/tests, chess coaching/work, chess events, coding/personal projects, and simple personal tasks.

The experience should feel like a simple WhatsApp-style to-do list evolved into a useful personal system: simple, calm, cute, intuitive, motivating, not corporate, and not overengineered.

Primary desktop targets: 1440×900 and 1920×1080.

## Global UX rules

### Quick-entry pattern
Where practical, list-based sections should always show one blank row at the bottom.

- click blank row → type
- Enter saves
- a new blank row immediately appears/focuses
- Esc cancels
- Shift+Enter only creates a line break in multiline fields

### Inline editing
- click editable text to edit
- Enter saves
- Esc cancels

### Long sections
Use fixed or max-height internal scrolling for long secondary lists such as Done Today, Main Quest, journals, resources, and long notes.

### Themed controls
Date pickers, dropdowns, popovers, dialogs, and menus should match the app: cream/off-white surfaces, warm brown borders, rounded corners, soft shadow, espresso text, pastel hover/selected states.

---

# Home

## Main sections
- illustrated top banner
- navigation
- optional quote
- Main Quest
- Things To Do
- Done Today
- Cozy Media

Remove Quick Portals and the built-in ambient rain player.

## Banner
Use a real image asset from `public/assets/banners/`.

User can:
- upload new banner
- replace banner
- reset to default
- adjust image position

Supported: JPG, JPEG, PNG, WebP, GIF.

Rendering:
- width 100%
- controlled banner height
- `object-fit: cover`
- configurable `object-position`
- rounded corners
- responsive
- no distortion

Banner and theme are separate preferences.

## Themes
Themes:
- Morning Dawn
- Sunset
- Night
- Sakura
- Forest
- Cloudy

Theme affects page/app background, accents, selected nav state, subtle borders/card tint, and optional overlay tint. Theme must not replace the banner image.

## Main Quest
- supports multiple tasks
- Things To Do → Main Quest moves same task
- Main Quest → Things To Do moves same task back
- no duplicate task records
- fixed/max height with internal scroll

## Things To Do
- simple list
- checkbox completes
- click task text to inline edit
- blank quick-entry row at bottom
- contextual actions may include Delete, Due Date, Show on Home

## Done Today
- based on `completedAt` today
- never auto-delete completed tasks
- fixed/max height with internal scroll
- demo mode should include 20+ items

## Cozy Media
User can show either image/GIF or YouTube video/playlist.

YouTube:
- recognize valid YouTube URLs
- safely parse video/playlist IDs
- iframe embed
- no arbitrary HTML injection
- no forced autoplay

Allow Add, Replace, Remove.

---

# Study

## Semester week
Semester start date should be configurable.
Known reference: 1 Sep 2026 = Week 1, 15 Sep 2026 = Week 3.
Use label `Date`, not `Actual Date`.

## Study main page
Show only:
- next/relevant 3 Upcoming Tests
- next/relevant 3 Upcoming Assignments
- total count badges
- View More links

Do not show filters on the main Study page.

## Full list pages
Routes:
- `/study/tests`
- `/study/assignments`

Filters:
- course / subject
- date range
- academic week
- status

Sorting:
- date ascending
- date descending
- week
- recently added

Demo data:
- 8+ tests
- 10+ assignments
- multiple courses/dates/statuses

## Assessment cards
Show name, course code, Week, Date, Weight, Status.

## Assessment detail
Layout direction:
- left: Quick Info + To Do
- middle: tall Notes / Progress
- right: Resources + Group Members

Do not add timeline/milestone or reminder systems.

Editable fields:
- assessment name
- course
- status
- due date
- weight

Status:
- Upcoming
- In Progress
- Completed

Week should normally calculate from date.

## Assessment to-do
- blank quick-entry row
- Enter creates/focuses next blank row
- checkbox completes
- click text to edit

Assignee picker:
- themed popover
- multiple users
- All
- None
- store canonical UIDs

Example collaborators: Pico, Alyssa, Wayne, Jacob.

## Collaboration code
- auto-generated
- exactly 5 uppercase letters A–Z
- unique
- no digits
- Copy and Regenerate
- friends join using code only

Suggested mapping: `collaborationCodes/{normalizedCode}` with assessmentId, ownerId, enabled.
Exact lookup only; collaboration must be assessment-scoped.

## Notes / Progress journal
- fixed/max-height internal scroll
- 15+ demo notes
- each note stores content, authorId, createdAt
- UI shows actual author avatar/initial + name
- never show generic `Logged by team`

## Resources
Support URL and file resources.
Actions: Add, Open, Rename, Remove/Delete.
Use Firebase Storage for real uploaded files; demo mode may mock.

---

# Work

Work is primarily a calendar for chess classes and chess events.

## Month View
- fixed equal rectangular day cells
- consistent width/height
- cell never expands due to many events
- max 3 visible items per day
- if more, show `+X more`
- click `+X more` → Day View for that date
- click anywhere on day cell → Day View for that date

Default colors:
- Class = soft sage
- Event = soft blush/pink

Palette: sage, blush, lavender, sand, soft blue, peach.

## Day View
Outlook-style vertical hourly timeline, themed to match app.
Existing events/classes positioned by time.

Clicking empty space opens Add Class/Event with clicked date/time prefilled. Round between slots to sensible 15/30 minute interval. Default end time about one hour later.

## Add Class / Event
Button text must contain exactly one plus: `+ Add Class / Event`.

Fields:
- Title
- Type Class/Event
- Date
- Start
- End
- Repeat
- Color
- optional Notes

## Recurrence
Options:
- Does not repeat
- Every day
- Every week
- Every 2 weeks
- Every month
- Custom

Custom supports repeat every X unit, selected weekdays for weekly, and end Never / On date / After X occurrences.

Suggested model:
- `workItems` = parent schedule/series
- `workOccurrences` = occurrence exceptions/session-specific records

## Dragging
One-off drop → update date immediately.
Recurring drop → prompt only:
- This event only
- This and following events

Do not show `All events`.
Past occurrences must remain unchanged.

## Work detail
Editable:
- Date
- Start Time
- End Time
- Recurrence

Sections:
- What Happened
- Next Lesson Notes
- Prep / To-do
- Notes / Progress

Use blank-row quick entry where list-like.

---

# Projects & Ideas

## Main page
Only primary sections:
- Active Projects
- On Hold / Someday Maybe

Each shows 3 most recently updated projects, total-count badge, and View More.
No separate Idea Vault on main page.

## Full list
Filters:
- status
- target date
- last updated

Sorting:
- most recent
- oldest
- target date
- name

Demo mode:
- 8+ active/planning
- 6+ on hold/someday

## Dragging between sections
Active/Planning → On Hold section → status becomes `On Hold`.
On Hold/Someday → Active section → status becomes `Active`.
Persist underlying status, do not only move visually.

## Project detail
Editable:
- Project Name
- Status
- Description
- Target Date

Status options:
- Active
- Planning
- On Hold
- Someday
- Completed

Target Date is optional.

## Project tasks
Project tasks do not automatically appear on Home. Only appear when explicitly `Show on Home`.

Behavior:
- checkbox completes
- click text to inline edit
- blank quick-entry row
- context actions: Delete, Due Date, Show on Home

## Project notes / ideas
Possible sections:
- Project Overview
- Next Actions
- Ideas & Improvements
- Notes & Progress
- Project Tasks

Notes store content, author, timestamp. Long lists scroll internally.

---

# Canonical task model

One logical task = one record.

Possible fields:

```ts
{
  id: string
  title: string
  ownerId: string
  completed: boolean
  completedAt?: Timestamp
  createdAt: Timestamp
  dueDate?: Timestamp
  area: 'general' | 'study' | 'work' | 'project'
  isMainQuest?: boolean
  showOnHome?: boolean
  parentType?: 'assessment' | 'work' | 'project' | null
  parentId?: string | null
  assignedToUserIds?: string[]
}
```

Home and parent detail pages must render the same underlying task so edits/completion stay synchronized.

---

# Authentication

Support:
- email/password signup
- email/password login
- Google sign-in
- forgot password
- logout

Signup fields:
- Display Name
- Email
- Password
- Confirm Password

Map raw Firebase errors to friendly messages.

---

# Demo Mode

Keep Demo Mode functional without Firebase login.

Seed enough data to stress layouts:

Home:
- multiple Main Quest tasks
- 20+ Done Today

Study:
- 8+ tests
- 10+ assignments
- 15+ notes
- multiple resources/collaborators

Work:
- busy month
- one day with 7+ entries
- recurring classes/events
- one-off events

Projects:
- 8+ active/planning
- 6+ on hold/someday
- long task lists
- notes
- target dates

---

# Accessibility

Support Enter to save, Esc to cancel inline edit, Shift+Enter only for multiline newline, Tab navigation, keyboard-operable buttons, and accessible drag/drop fallback where practical.
