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
- [ ] Authenticated browser regression: fields, tasks, assignees, resources, notes, codes, refresh/navigation, separate records
- [ ] Replace client-side collaboration membership join with a trusted redemption endpoint before production deployment

Run typecheck/build before moving on.

### Targeted V1 blocker audit (16 Sep 2026)
- [x] Identify remaining data-loss and security blockers without a repository-wide rediscovery pass
- [ ] Verify Assessment Detail with a disposable signed-in Firebase account
- [ ] Add trusted collaboration-code redemption before enabling production collaboration
- [ ] Move Work calendar/detail state from demo-only memory to Firestore
- [ ] Move Projects/detail state from demo-only memory to Firestore

## Stage 4 — Work calendar
### Month View
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

Run typecheck/build before moving on.

## Stage 5 — Projects
### Main
- [ ] 3 most recent Active + total count
- [ ] 3 most recent On Hold/Someday + total count
- [ ] View More
- [ ] Seed 8+ active/planning and 6+ on hold/someday

### Drag/status
- [ ] Active/Planning → On Hold persists `On Hold`
- [ ] On Hold/Someday → Active persists `Active`

### Detail
- [ ] Editable name/status/description/target date
- [ ] Next Actions quick-entry
- [ ] Ideas & Improvements quick-entry
- [ ] Notes & Progress quick-entry
- [ ] Task checkbox/inline edit
- [ ] Delete/Due Date/Show on Home actions
- [ ] Author/timestamp notes
- [ ] Notes scroll
- [ ] Consistent back nav

Run typecheck/build before moving on.

## Stage 6 — Firebase and authentication
Only after core UI/logic is stable.

- [ ] Inspect Firebase environment usage
- [ ] Keep `.env.local` outside Git
- [ ] Email/password signup/login
- [ ] Display Name
- [ ] Google sign-in
- [ ] Forgot password
- [ ] Logout
- [ ] Friendly error mapping
- [ ] Firestore owner isolation
- [ ] Collaboration security
- [ ] Firebase Storage where needed
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
