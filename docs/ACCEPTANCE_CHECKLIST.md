# Pico's Dashboard — V1 Acceptance Checklist

Check items only after implementation and verification.

## Baseline / project health
- [x] Existing architecture inspected before major rewrites
- [x] Application starts locally
- [x] `npm run lint` passes or pre-existing issues are documented
- [x] `npm run typecheck` passes
- [x] `npm run build` passes
- [ ] No obvious runtime/console errors introduced
- [ ] Demo Mode works without Firebase login

## Asset system
- [x] Stable `public/assets/` structure exists
- [x] No temporary generated-image URLs remain
- [x] Default banner renders correctly
- [x] Broken image alt-text issue is fixed
- [x] Optional images have graceful fallback behavior

## Theme / navigation
- [ ] Home / Study / Work / Projects navigation works
- [ ] Morning Dawn works
- [x] Sunset works
- [ ] Night works
- [ ] Sakura works
- [ ] Forest works
- [ ] Cloudy works
- [x] Theme changes page/app background and accents
- [x] Theme does not automatically replace banner

## Home
- [ ] Left Home card is non-banner; banner controls hover-reveal; persistent mini-player navigation behavior (implemented; awaiting browser verification)
- [x] Signed-in Home uses canonical Firestore task records
- [x] Project tasks marked Show on Home render from their canonical record
- [x] Default banner renders
- [x] Upload/replace banner works (preset replacement browser-verified; file upload remains covered by the same processor)
- [x] Reset banner works
- [ ] Banner positioning is sensible/adjustable
- [x] Multiple Main Quest tasks work
- [x] Main Quest scrolls internally
- [x] Things To Do quick-entry works
- [ ] Enter saves and focuses new blank row
- [x] Task checkbox completion works
- [ ] Task inline editing works
- [ ] Esc cancels edit
- [ ] Drag To Do → Main Quest moves same task
- [ ] Drag Main Quest → To Do moves same task
- [ ] Drag creates no duplicates
- [x] Done Today uses `completedAt`
- [x] Done Today scrolls internally
- [x] Demo has 20+ Done Today items
- [x] Quick Portals removed
- [x] Ambient Rain removed
- [x] Cozy Media supports image/GIF
- [ ] Cozy Media supports YouTube video
- [ ] Cozy Media supports YouTube playlist
- [ ] Cozy Media can be replaced/removed

## Study main
- [x] Only 3 upcoming tests shown
- [x] Test badge shows total count
- [x] Only 3 upcoming assignments shown
- [x] Assignment badge shows total count
- [x] No main-page filters
- [ ] View More tests works
- [ ] View More assignments works
- [ ] Semester week calculation works

## Study full lists
- [x] `/study/tests` works
- [x] `/study/assignments` works
- [x] Course filter works
- [x] Date range filter works
- [x] Week filter works
- [x] Status filter works
- [x] Date asc/desc sort works
- [x] Week sort works
- [x] Recently added sort works
- [x] Demo has 8+ tests
- [x] Demo has 10+ assignments

## Assessment detail
- [x] Signed-in Assessment Detail is Firestore-backed without demo-default overwrites
- [ ] Name editable
- [ ] Course editable
- [ ] Status editable
- [ ] Due date editable
- [ ] Weight editable
- [ ] Themed controls consistent
- [ ] To-do quick-entry works
- [ ] Task checkbox works
- [ ] Task inline edit works
- [ ] Assignee popover opens
- [ ] Multiple assignees supported
- [ ] All supported
- [ ] None supported
- [ ] Assignees stored by UID
- [ ] Notes show actual author
- [ ] Notes store authorId and timestamp
- [ ] Journal scrolls internally
- [ ] Demo has 15+ notes
- [ ] URL resource add/open/rename/delete works
- [ ] File resource path works in Firebase mode
- [ ] Long resources scroll internally
- [ ] Collaboration code auto-generates
- [ ] Collaboration code = exactly 5 uppercase letters
- [ ] Copy works
- [ ] Regenerate works
- [ ] Collaboration access is assessment-scoped
- [x] Add Assessment opens a creation form rather than an unrelated demo record
- [x] Guest browser sanity check: Add Assessment and compact Join Group Assessment modal render without console errors

## Work Month View
- [ ] Signed-in Work create, reschedule, and refresh persistence (implemented; awaiting authenticated user verification)
- [ ] Equal fixed day cells
- [ ] Cells do not expand with event count
- [ ] Max 3 visible items/day
- [ ] `+X more` appears when needed
- [ ] `+X more` opens correct Day View
- [ ] Clicking day opens correct Day View
- [ ] Demo has recurring classes/events
- [ ] Demo has one-off events
- [ ] At least one day has 7+ entries
- [ ] Class default color = sage
- [ ] Event default color = blush/pink
- [ ] Pastel color selection works
- [ ] Add Class/Event shows exactly one plus

## Work Day View
- [ ] Hourly timeline renders
- [ ] Existing items appear at correct time
- [ ] Clicking empty time opens Add modal
- [ ] Date prefilled
- [ ] Start time prefilled
- [ ] End time defaults sensibly
- [ ] Time rounding works
- [ ] Existing item opens detail
- [ ] Back to Month View consistent

## Work recurrence / dragging
- [ ] Add modal supports title/type/date/start/end/repeat/color/notes
- [ ] Does not repeat works
- [ ] Daily works
- [ ] Weekly works
- [ ] Every 2 weeks works
- [ ] Monthly works
- [ ] Custom recurrence works
- [ ] One-off drag updates actual date/state
- [ ] Recurring drag offers `This event only`
- [ ] Recurring drag offers `This and following events`
- [ ] Recurring drag does not offer `All events`
- [ ] Past occurrences remain unchanged

## Work detail
- [ ] Signed-in Work detail field/journal persistence (implemented; awaiting authenticated user verification)
- [ ] Date editable
- [ ] Start time editable
- [ ] End time editable
- [ ] Recurrence editable
- [ ] What Happened quick-entry works
- [ ] Next Lesson Notes quick-entry works
- [ ] Prep/To-do quick-entry works
- [ ] Back to Work Calendar consistent
- [x] Detail title is selected-event-specific; chess-only Current Focus and rating UI are not presented
- [x] Guest browser sanity check: a non-Joshua calendar event opens its own generic detail view

## Projects main/detail
- [x] Signed-in Projects main/detail is Firestore-backed without visual-only drag movement
- [ ] Active shows 3 most recent
- [ ] Active badge shows total
- [ ] On Hold/Someday shows 3 most recent
- [ ] On Hold/Someday badge shows total
- [ ] View More works
- [ ] Demo has 8+ active/planning
- [ ] Demo has 6+ on hold/someday
- [ ] Active/Planning → On Hold persists status
- [ ] On Hold/Someday → Active persists status
- [ ] Project name editable
- [ ] Status editable
- [ ] Description editable
- [ ] Target Date editable/optional
- [ ] Next Actions quick-entry works
- [ ] Ideas & Improvements quick-entry works
- [ ] Notes & Progress quick-entry works
- [ ] Project task checkbox works
- [ ] Project task inline editing works
- [ ] Delete task works
- [ ] Due Date action works
- [ ] Show on Home works
- [ ] Project notes store author/timestamp
- [ ] Long notes scroll internally
- [ ] Back to Projects & Ideas consistent

## Authentication / Firebase
- [ ] Vite Firebase environment overrides work in deployed environment (implemented; awaiting deployment verification)
- [ ] Email/password signup works
- [ ] Display Name stored/displayed
- [ ] Email/password login works
- [ ] Google sign-in works
- [ ] Forgot password works
- [ ] Logout works
- [ ] Friendly Firebase errors replace raw errors
- [ ] User data isolated by owner UID
- [ ] Collaboration cannot expose unrelated data
- [ ] Firebase Storage used only where needed
- [ ] `.env.local` ignored by Git

## Final readiness
- [ ] 1440×900 looks correct
- [ ] 1920×1080 looks correct
- [ ] Smaller viewport remains usable
- [ ] Keyboard quick-entry works
- [ ] Keyboard inline edit works
- [ ] No obvious broken images
- [ ] No duplicate visual controls
- [ ] Production build passes
- [ ] Vercel deployment is ready
