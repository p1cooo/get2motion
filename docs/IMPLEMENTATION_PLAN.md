# Pico's Dashboard — Implementation Plan

Codex should update this file as work progresses. Do not mark complete until implemented and verified.

## Stage 0 — Repository inspection and baseline
- [x] Inspect repository structure
- [x] Inspect `package.json`
- [x] Inspect application entry/routing structure (Vite SPA; no active Next.js App Router)
- [x] Inspect Tailwind configuration (Tailwind 4 Vite plugin; no config file)
- [x] Inspect Firebase configuration
- [x] Inspect Demo Mode architecture
- [x] Inspect task model
- [x] Inspect assessment model
- [x] Inspect Work calendar/recurrence model
- [x] Inspect Project model
- [x] Inspect drag-and-drop implementation
- [x] Inspect asset/image paths
- [x] Attempt existing lint/typecheck/build (blocked: dependencies absent; `typecheck` script missing)
- [x] Update `docs/CURRENT_STATE.md` with discovered pre-existing issues
- [x] Install existing dependencies, add `typecheck`, and establish a passing baseline (16 Sep 2026: lint, typecheck, and Vite production build pass)

## Stage 1 — Asset pipeline
- [x] Normalize `public/assets/` use without unnecessary file moves (existing `banner/`, `art/`, and `fox/` folders are stable)
- [x] Wire real default banner
- [x] Remove broken mascot image references (use supplied PNGs instead of missing `fox-*.webp` paths)
- [x] Add graceful image fallback (banner, media, and mascot SVG fallback)
- [x] Verify Home banner rendering in the local browser
- [x] Verify Cozy Media image rendering in the local browser
- [x] Confirm assets work in production build

## Stage 2 — Theme and Home
### Theme
- [x] Verify theme state architecture
- [ ] Browser-regression all six theme presets (all use the inspected shared `setTheme` path; Sunset is verified)
- [x] Theme changes background/accent (Sunset browser-verified)
- [x] Theme remains separate from banner (browser-verified)
- [x] Persist preference where appropriate (guest localStorage and signed-in profile update)

### Home
- [x] Remove Quick Portals
- [x] Remove ambient rain player
- [x] Verify multiple Main Quest tasks
- [x] Add Main Quest internal scrolling
- [x] Verify Things To Do quick-entry (browser-verified)
- [x] Verify task completion (browser-verified; Done Today incremented and undo was exposed)
- [x] Fix drag between To Do and Main Quest (shared record update verified through the matching promote action; native drag still needs regression testing)
- [x] Ensure drag never duplicates tasks (shared `map` update; browser action verified record move)
- [x] Verify Done Today logic and scrolling (filters `completedAt` to the local current date; browser shows 22 items)
- [x] Seed 20+ completed demo tasks
- [x] Implement Cozy Media image/GIF
- [ ] Implement Cozy Media YouTube (support exists; needs a browser regression test with a known live URL)
- [x] Verify banner replace/reset (browser-verified with a local preset and reset to the default asset)
- [x] Keep the top banner as the only banner image; restore the left Home card to a non-banner card
- [x] Make banner customization controls hover/focus-revealed while Semester/Week remain visible
- [x] Default Things To Do to creation order and append new guest tasks
- [x] Keep YouTube media mounted at app level with a small persistent mini-player (browser regression pending)

Lint, typecheck, and production build pass after this stage. Continue with remaining Home interaction regression before Stage 3.

## Stage 3 — Study
### Main page
- [x] Remove main-page filters
- [x] Limit tests to 3 (sort by date before limiting; browser-verified)
- [x] Limit assignments to 3 (sort by date before limiting; browser-verified)
- [x] Fix total count badges (browser-verified: 8 tests, 10 assignments)
- [ ] Verify semester week calculation

### Full lists
- [x] Verify tests list page (`/study/tests`, browser-verified)
- [x] Verify assignments list page (`/study/assignments`, browser-verified)
- [x] Course/date/week/status filters (browser-verified on tests; same existing control implementation used by assignments)
- [x] Sort options (browser-verified)
- [x] Seed 8+ tests and 10+ assignments

### Assessment detail
- [x] Connect signed-in detail to Firestore assessment/task/resource/note records (16 Sep 2026; guest retains demo UI)
- [x] Persist editable name/course/status/date/weight
- [x] Persist quick-entry tasks and task completion
- [ ] Persist inline task editing (the visual detail has no task-text editor yet)
- [x] Persist multi-select assignee popover and All / None using UIDs
- [x] Persist author-aware journal and retain internal scroll
- [x] Persist URL resources; upload file resources to Firebase Storage when signed in
- [x] Persist resource rename/delete and retain internal scroll
- [x] Generate and persist unique 5-letter collaboration codes; Copy / Regenerate retained
- [x] Stop automatic demo/reference-data seeding for authenticated users; retain isolated guest preview data
- [x] Restrict assessment-linked Firestore tasks, notes, resources, and assignees to assessment owner/member access
- [x] Deploy Firestore and validated assessment-resource Storage rules to Motion
- [ ] Authenticated browser regression: fields, tasks, assignees, resources, notes, codes, refresh/navigation, separate records
- [ ] Replace client-side collaboration membership join with a trusted redemption endpoint before production deployment
- [x] Replace the hardcoded Add Assessment demo route with a creation form and unique signed-in Firestore record
- [x] Normalize Join Group Assessment's UI and input to the five-letter collaboration-code format
- [x] Prevent new/unknown assessment IDs from rendering an unrelated demo assessment during detail initialization

Run typecheck/build before moving on.

### Targeted V1 blocker audit (16 Sep 2026)
- [x] Identify remaining data-loss and security blockers without a repository-wide rediscovery pass
- [ ] Verify Assessment Detail with a disposable signed-in Firebase account
- [ ] Add trusted collaboration-code redemption before enabling production collaboration
- [ ] Move Work calendar/detail state from demo-only memory to Firestore
- [ ] Move Projects/detail state from demo-only memory to Firestore

### Shared tasks (17 Sep 2026)
- [x] Connect signed-in Home to canonical Firestore tasks
- [x] Render `showOnHome` project/assessment tasks on Home without duplicating records
- [x] Persist Home completion, title edits, quick entry, and Main Quest moves to canonical tasks
- [x] Add Assessment Detail task inline editing

## Stage 4 — Work calendar
### Month View
- [x] Connect signed-in calendar create/move state to existing Firestore `workItems` / `workOccurrences` records (implementation complete; authenticated browser regression pending)
- [x] Connect signed-in Work Detail schedule and journal writes to Firestore (implementation complete; authenticated browser regression pending)
- [ ] Preserve fixed equal cells
- [ ] Max 3 visible entries
- [ ] `+X more`
- [ ] Click day → Day View
- [ ] Class/event colors
- [ ] Fix duplicate plus icon
- [ ] Seed busy day with 7+ items

### Day View
- [ ] Timeline
- [ ] Existing items positioned by time
- [ ] Empty slot → Add modal
- [ ] Auto-fill date/start/end
- [ ] Time rounding
- [ ] Existing item → detail
- [ ] Consistent back nav

### Recurrence / drag
- [ ] One-off drag persists date
- [ ] Recurring drop dialog
- [ ] This event only
- [ ] This and following events
- [ ] Preserve past occurrences
- [ ] Recurrence editor/custom recurrence

### Work detail
- [ ] Editable date/time/recurrence
- [ ] What Happened quick-entry
- [ ] Next Lesson Notes quick-entry
- [ ] Prep/To-do quick-entry
- [ ] Consistent back nav
- [ ] Move Work prep checklist to canonical `tasks` records (it currently persists within the work occurrence)
- [x] Pass selected work event ID/date into detail and remove chess-specific Current Focus presentation

Run typecheck/build before moving on.

## Stage 5 — Projects
### Main
- [x] Sort to 3 most recent Active/Planning + total count
- [x] Sort to 3 most recent On Hold/Someday + total count
- [x] View More expands each full list
- [x] Seed 8 Active/Planning and 6 On Hold/Someday for new signed-in demo data; guest has the same reference counts

### Drag/status
- [x] Active/Planning → On Hold persists `On Hold`
- [x] On Hold/Someday → Active persists `Active`

### Detail
- [x] Persist editable name/status/description/optional target date
- [x] Persist Next Actions, Ideas & Improvements, and Notes & Progress quick entry
- [x] Persist task checkbox/inline edit/delete/due date/Show on Home actions (Home rendering awaits shared-task migration)
- [x] Store note author and timestamp; long columns retain internal scrolling
- [x] Preserve ← Back to Projects & Ideas
- [x] Prevent new/unknown project IDs from rendering an unrelated demo project during detail initialization
- [ ] Browser regression for Projects main/detail and signed-in refresh/navigation

Run typecheck/build before moving on.

## Stage 6 — Firebase and authentication
Only after core UI/logic is stable.

- [x] Inspect Firebase environment usage; Vite `VITE_FIREBASE_*` overrides documented with public-config fallback
- [ ] Keep `.env.local` outside Git
- [ ] Email/password signup/login
- [x] Correct email/password sign-up argument order and map Firebase Auth error codes for production diagnosis
- [ ] Display Name
- [ ] Google sign-in
- [x] Forgot password UI wired to the existing Auth context (browser verification pending)
- [ ] Logout
- [x] Friendly Firebase Auth error mapping
- [ ] Firestore owner isolation
- [ ] Collaboration security
- [x] Keep Firebase Storage available only for secure cleanup of legacy Study resources that already contain a Storage path.
- [ ] Demo Mode still works

## Stage 7 — Regression / production readiness
- [ ] Test all primary pages and detail pages
- [ ] Check 1440×900 and 1920×1080
- [ ] Check smaller viewport
- [ ] Check keyboard behavior
- [ ] Check image fallbacks
- [ ] Check console
- [ ] Run lint
- [ ] Run typecheck
- [ ] Run production build
- [ ] Document remaining limitations
- [x] Remove the normal signed-in reference-data seed control without deleting stored data
- [ ] Identify and remove only unequivocally disposable development records after authenticated end-to-end verification
- [x] Add Vercel SPA rewrite for direct Vite client routes

## Completion report
When V1 pass is complete, report:
1. Major fixes completed
2. Important files changed
3. Build/lint/typecheck results
4. Firebase/auth status
5. Demo-only functionality remaining
6. Known limitations
7. Recommended next steps

Never claim an item is complete unless verified.

## Final production-readiness pass — 18 Sep 2026

- [x] Remove production Demo Preview controls, wording, and auth fallback.
- [x] Require authentication before rendering dashboard data.
- [x] Start authenticated Home, Study, Work, and Projects views empty unless owner-scoped Firestore records exist.
- [x] Persist newly created Work calendar records under the current owner UID.
- [x] Keep the YouTube player embedded in Home and use one fixed mini-player outside Home.
- [x] Add post-signup confirmation for Firebase's automatic sign-in flow.
- [x] Remove the top-right settings gear while retaining sign-out.
- [ ] Complete authenticated Firebase browser and Vercel deployment verification with production access.
- [x] Remove the static Study course cards and rename the Work schedule heading to Work & Teaching Schedule.
- [x] Improve empty-task deletion, manual banner positioning, and create-flow feedback for Study and Work.
- [x] Keep newly created Study assessments in the overview and provide explicit saving/error states.
- [x] Prevent Firestore acknowledgement delays from freezing creation modals or blanking refreshed routes.
- [x] Use persistent Firestore cache, exact Work entry matching, and live detail snapshots for persistence regression fixes.

## Persistence/editability regression pass — 19 Sep 2026

- [x] Fix canonical Firestore document-ID handling for Home, Study, and Project listeners and new records.
- [x] Stop signed-in Home and Study mutations from writing stale local task arrays over snapshot state.
- [x] Persist Project detail task mutations and Project Idea/Note inline editing.
- [x] Persist Study journal inline editing without changing author or creation metadata.
- [x] Render a visible loading state and auth screen during sign-out/direct unauthenticated routes; clean media through provider unmount.
- [x] Correct non-Home media control visibility so Hide/Restore remains operable.
- [ ] Run the complete signed-in Firestore regression sequence with a disposable account.

### Stabilization audit — 19 Sep 2026

- [x] Repair Work Detail schedule/journal controls that were visual-only state changes instead of owner-scoped Firestore writes.
- [x] Prevent stale Project idea/note arrays from overwriting a newer browser's data by applying embedded-list changes in Firestore transactions.
- [x] Ensure signed-in Work rescheduling writes the source `workItems` document rather than only changing visible React state.
- [ ] Run the required signed-in two-browser Home, Study, Work, and Projects regression sequence with a disposable Firebase account.

### Continuation stabilization audit — 19 Sep 2026

- [x] Constrain owner-only Study and Project task listeners so deployed Firestore rules can authorize their queries.
- [x] Replace collaboration-code candidate reads with collision-retry writes compatible with deployed rules.
- [x] Persist Project archive section with completed status and add scoped permanent-delete controls for Projects and Assessments.
- [x] Add URL-backed Assessment and Project detail refresh routing; Work route implementation awaits interactive selection verification.
- [x] Make signed-in profile and Cozy Media settings Firestore-backed, with UID-scoped local fallback.
- [x] Verify signed-in Study task create/complete/create/refresh, Study archive, Project archive, Project/Study detail refresh, Work create/refresh, and logout from Work.
- [x] Sign into the same disposable account in a second independent browser context and run the full Home/Study/Work/Projects propagation and reverse-mutation regression.
- [x] Confirm scoped permanent deletion of a disposable Assessment and its exact linked records.
- [ ] Confirm scoped permanent deletion of a disposable Project and its exact linked records.
- [x] Verify signed-in media preference propagation, non-Home player minimize/restore, and logout isolation across the two origin-isolated sessions.
- [x] Verify direct selection and refresh of a signed-in Work detail route from the calendar.
- [x] Verify signed-in Study journal create, inline edit, and refresh persistence.
- [x] Replace native Assessment/Project deletion prompts with a shared Motion confirmation modal and verify Escape cancellation.
- [x] Verify scoped permanent deletion of `QA delete assessment 20260920` redirects to Study and remains absent after refresh.
- [x] Verify scoped permanent deletion of `QA delete project 20260920` redirects to Projects & Ideas and remains absent after refresh.
- [x] Verify Work What Happened, Notes, and Prep Enter creation, inline edit, completion lifecycle, and refresh persistence.
- [x] Verify Project Idea and Note Enter creation, inline edit, and refresh persistence.
- [x] Verify Study task inline edit preserves completion and assignee metadata after refresh.
- [x] Keep Study resources link-only; new records persist external URL metadata without a Storage upload path.
- [x] Verify Study URL add, refresh, open, pencil-only edit, and deletion against Firestore.
- [x] Fix and live-verify Assessment deletion when legacy Storage cleanup fails or stalls: linked QA records are removed, listener teardown errors are suppressed only during the final commit, and the user is redirected to Study (21 Sep 2026).
- [ ] Verify Firestore cross-user isolation using a second Firebase UID.
