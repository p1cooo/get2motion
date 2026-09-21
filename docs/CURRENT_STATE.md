# Pico's Dashboard — Current State

> This file describes the known project state before the Codex refinement pass. Codex should inspect the repository and update this document when it discovers that an item is outdated.

## Existing project

The application already exists. Do not rebuild it from scratch.

Expected local repository path:

```text
C:\get2motion-app\get2motion-main
```

The project was originally produced/refined in Google AI Studio / Gemini and is now being handed over for implementation and debugging.

### Inspection update — 16 September 2026

- This is a **Vite React single-page application**, not a Next.js App Router application. `next` and `next.config.mjs` remain in the repository, but there is no `app/` route implementation (only an unused `app/globals.css` file), and `src/main.tsx` mounts `src/App.tsx` through Vite.
- Tailwind CSS 4 is provided through the Vite plugin and `src/index.css`; there is no Tailwind configuration file.
- Navigation and all detail/list “routes” are component-local React state. `/study/tests` and `/study/assignments` do not currently exist as browser routes.
- The canonical TypeScript task shape exists in `lib/types.ts`, and Home uses a single local task array. However, Study, Projects, Work, and their detail views each keep separate local demo state, so cross-page task synchronization and persistence are not implemented yet.
- Firebase Auth and Firestore setup, Firestore security rules, seed helpers, and auth UI are present. Study now reads owner assessments from Firestore for signed-in users while guests retain the demo dataset. Assessment Detail subscribes to its assessment, canonical tasks, resources, and notes, and writes changes back to Firestore; new resources are external-link metadata. The remaining product views still read demo data directly.
- Work recurrence and drag/drop are implemented only against in-memory calendar demo entries. The current “this and following” operation mutates entries in the visible month rather than a durable series/occurrence model.
- The asset structure is usable but uses `public/assets/banner/` and `public/assets/art/`, rather than the documented plural `banners/` and `cozy/` folders. Default banner and cozy-art files are present. Fox components first request missing `fox-*.webp` files, then fall back to inline SVG; several supplied fox PNGs are currently unused.
- Themes and banner preference state are already separate in `lib/theme-context.tsx`, with localStorage persistence for guests and Firestore profile updates for signed-in users. Most page cards still use fixed Morning Dawn utility colors, so themes currently affect the app canvas/navigation more reliably than all page surfaces.
- The Home UI already has local quick entry, inline editing, checkbox completion, Main Quest/To Do drag handling, internal list scrolling, 22 seeded completed tasks, banner upload/reset/positioning, and Cozy Media support. These behaviors need browser verification and shared-data persistence work.

## Working / close to final

The exact implementation must still be inspected, but these areas are believed to exist already:

- Next.js application structure
- TypeScript
- Tailwind styling
- Home page
- Study Hub
- assessment detail page
- Work month calendar
- Work Day View
- Projects & Ideas page
- project detail page
- Demo Mode / sample data
- some drag-and-drop behavior
- some inline editing
- theme selector UI
- banner image areas
- Firebase-related configuration or scaffolding

Visual styling in the lower portions of several pages is already close to the desired direction. Preserve good existing visual work.

## Known / suspected issues

### Global

- Some image areas have shown broken image alt text.
- Asset paths may reference missing or temporary files.
- Theme selector UI exists but may not reliably change the actual page background/accent system.
- Banner and theme behavior may be mixed together.
- Some interactions may be visually implemented without persisting state.
- `npm run lint` and `npm run build` currently cannot start because local dependencies are not installed (`tsc` and `vite` are unavailable). `npm run typecheck` is missing and must be added.
- The surrounding `C:\get2motion-app` folder is not itself a Git repository; the supplied source directory also has no visible `.git` directory in this checkout.
- Need to inspect actual Firebase integration versus demo-only behavior.

### Home

- use a real default image banner
- support banner upload/replace/reset
- banner image paths must be stable
- themes should alter page background/accent
- theme and banner must remain separate
- support multiple Main Quest tasks
- Main Quest should scroll internally if long
- Things To Do needs reliable blank-row quick entry
- task inline editing must work
- drag between Things To Do and Main Quest must move the same task
- Done Today should use internal scrolling
- Quick Portals should be removed
- built-in ambient rain player should be removed
- Cozy Media should support image/GIF or YouTube

### Study

- remove filters from main Study page
- keep filters only on View More list pages
- only 3 upcoming tests on main page
- only 3 upcoming assignments on main page
- count badges should reflect total count
- assessment fields should be editable
- assessment notes should show actual authors
- assessment journal should scroll internally
- to-do quick-entry should work
- assignee popover should support multiple users / All / None
- resources need add/open/rename/remove
- file resources should integrate with Firebase Storage in real mode
- collaboration code should be exactly 5 uppercase letters
- collaboration access must remain assessment-scoped

### Assessment Detail persistence (16 Sep 2026)

- Signed-in Assessment Detail uses Firestore listeners scoped by the selected assessment ID. Header fields, canonical assessment tasks and completion state, assignee UIDs, URL/file resources, author-labelled notes, and collaboration-code state are persisted without copying demo defaults over existing records.
- Existing owner assessment records with an absent/legacy code receive a five-letter uppercase code on first detail open. The client checks a dedicated `collaborationCodes/{code}` document in a transaction before writing it.
- Firestore rules restrict assessment notes and resources to the assessment owner or member. Collaboration-code redemption requires a trusted server-side step before production deployment: Firestore rules cannot prove a client looked up the code before adding itself to `memberIds`.
- Guest-mode Assessment Detail remains local demo UI by design. Browser verification confirmed the guest UI and its controls render without a new runtime error; authenticated persistence regression requires a non-production test account and has not been marked verified.

### Targeted V1 blocker audit (16 Sep 2026)

1. **Collaboration security:** production code redemption needs a trusted backend endpoint. The client-side membership mutation is disabled because Firestore rules cannot attest that a client legitimately redeemed a code.
2. **Authenticated regression:** a disposable Firebase test account is needed to verify writes through refresh/navigation without creating or using an account through browser automation without approval.
3. **Remaining data loss:** Work calendar/detail and Projects/detail still use component-local demo state. They are the next persistence candidates after the authenticated Assessment Detail regression and secure collaboration redemption.
4. **Assessment UI gap:** task titles are displayed but not yet inline-editable, so the requested task inline-edit acceptance item remains open.

### Shared task model update (17 Sep 2026)

- Signed-in Home now subscribes to the canonical Firestore `tasks` collection by owner UID. Project and Assessment Detail already write to that collection, so a project or assessment task marked `showOnHome` is rendered from the same record on Home.
- Completion, title edits, priority moves, due dates, deletion, parent links, owner ID, assignee IDs, and `completedAt` stay on the canonical task record. Guests retain the existing local demo task data.
- Work calendar and work detail remain the largest demo-only/persistence gap. Their full recurrence/occurrence model needs implementation before production deployment.

### Production persistence update (17 Sep 2026)

- Signed-in Work Calendar now reads the existing `workItems` and `workOccurrences` collections rather than keeping calendar changes only in component state. New items, one-off moves, recurring occurrence exceptions, and future-series splits write to Firestore; guests still receive the reference calendar.
- Signed-in Work Detail persists edited schedule fields and journal entries to the relevant work documents. It keeps the existing visual diary. Work prep entries are persisted with the session record; migrating those to canonical `tasks` is still pending.
- Firebase client configuration can now be supplied as Vite `VITE_FIREBASE_*` variables, with the existing public Firebase app configuration as a backwards-compatible fallback. `vercel.json` supplies the SPA rewrite.
- Firebase Storage deployment rules are not checked in because the current assessment-resource path lacks an owner UID and the configured Firestore database is not the Storage Rules default-database integration target. Do not enable production uploads until rules have been verified against the configured Firebase project.
- Collaboration code redemption remains intentionally called out as a production security blocker. It needs a trusted server-side endpoint with Admin credentials; that credential must not be placed in this Vite client or committed.

### Home/media refinement (17 Sep 2026)

- The left Home card no longer reuses a banner/asset image. It is again a compact non-banner encouragement card.
- The top banner no longer has its bottom-right image element. Semester and week remain visible; theme and banner controls now fade in only while the banner is hovered or keyboard-focused.
- Things To Do defaults to ascending `createdAt` order, and guest quick entry appends new tasks instead of prepending them. There is no separate persisted manual-sort field in the current task model.
- Cozy Media settings and the YouTube iframe now live in an app-level context. The persistent floating mini-player stays mounted during SPA navigation and provides play, pause, and playlist-only previous/next commands. Browser verification is awaiting an available browser surface.

### Final cleanup preparation (17 Sep 2026)

- Join Group Assessment now uses the same five-letter uppercase code format as Assessment Detail, with the redundant header Cancel action removed.
- Add Assessment now opens a focused creation form. Signed-in users receive a new Firestore document ID and navigate only to that new record; guest creations remain in the isolated local preview list.
- Work event selection passes each calendar entry's own ID/date into the detail view. The detail view no longer binds every event to the Joshua diary, and its chess-specific Current Focus block is removed.
- The signed-in footer no longer exposes the development reference-data seeding action. No Firestore, Storage, or Auth records have been deleted: authenticated end-to-end verification is still required before any identifiable development data can be safely removed.
- Focused guest-mode browser checks confirmed that Add Assessment opens its form rather than selecting a demo record, Join Group Assessment exposes only its bottom Cancel action and compact code input, and a non-Joshua Work event opens an event-specific detail page with the three generic journal sections. The local browser console reported no errors for these checks.

### Detail selection safety (17 Sep 2026)

- New assessments no longer fall back to an unrelated demo assessment while their Firestore listener initializes. Study now passes the selected record into detail, and a new guest-mode `OOD test` was browser-verified to open with its own title, course, and empty tasks/resources/journal.
- The same unsafe unknown-ID fallback was removed from Project Detail, preventing a newly created or newly loaded project from displaying Bingo Space data.
- `vercel.json` now supplies the required Vite SPA rewrite so direct links such as `/study/tests` resolve to the app rather than a Vercel 404.

### Firebase production narrow pass (18 Sep 2026)

- Signed-in account creation and sign-in no longer invoke `seedInitialDemoData`; authenticated users receive only their own minimal profile and begin with empty production collections. Guest Demo Mode remains local and isolated.
- Assessment rules now require owner/member access for assessment-linked tasks, notes, and resources. Assessment task assignees must be assessment members, and only the assessment owner can change membership or delete shared tasks.
- Client-side collaboration-code redemption is deliberately disabled because Firestore rules cannot safely verify code redemption. A trusted server endpoint remains required before authenticated code joining can ship.

### Firebase rules deployment pass (18 Sep 2026)

- The updated Firestore rules were deployed to Motion. Storage rules were also deployed for the existing `assessments/{assessmentId}/resources/{fileName}` path.
- The active Motion client uses the `(default)` Firestore database, so Storage’s Firestore lookup uses the correct database. Storage allows only authenticated assessment owners/members to read, create (under 20 MiB), or delete resources; all other paths and updates remain denied by default.

### Firebase auth debugging pass (18 Sep 2026)

- The local Motion Firebase configuration returned `auth/invalid-api-key` from the Auth SDK. Production must use the Web API key from the Motion Firebase web app for `VITE_FIREBASE_API_KEY`, then be redeployed so Vite embeds that value.
- The sign-up form was also passing `(email, password, displayName)` to a `(displayName, email, password)` function. It now passes the correct order, and the auth modal distinguishes invalid API key, invalid email, disabled provider, unauthorized domain, network, credential, and popup-cancelled failures.
- Google sign-in continues to use `GoogleAuthProvider` with `signInWithPopup`; an authorized-domain change is only required if it returns `auth/unauthorized-domain` after the API-key correction.

### Work

The month calendar visual design was close to the desired layout and should be preserved.

- fixed-size day cells
- maximum 3 visible entries
- `+X more` opens Day View
- clicking anywhere on a day opens Day View
- Day View empty timeslot click opens Add modal with date/time prefilled
- existing items must align with time
- drag/drop must update actual underlying date
- recurring drag options must only be `This event only` and `This and following events`
- one-off and recurring persistence logic needs verification
- duplicate `+` symbol has appeared in Add Class/Event button
- back navigation needs consistent styling/placement
- recurrence editor/pickers need themed UI
- list/journal sections need quick-entry behavior

### Projects

- Signed-in Projects & Ideas now reads owner project records from Firestore; guests retain the 8 Active/Planning and 6 On Hold/Someday demo records.
- The main view sorts by `updatedAt` before showing three cards per section, uses total-count badges, and persists drag status/section updates rather than moving cards visually only.
- Project Detail now persists direct edits, canonical project tasks (including completion, title, delete, due date, and Show on Home), ideas, and author/timestamped notes. Browser regression remains pending because no browser surface was available in this session.
- The Show on Home action persists the canonical task flag, but Home still renders its separate local task list; displaying those saved project tasks on Home remains part of the shared-task migration.

### Authentication

Authentication may not yet be production-ready. Need to inspect and verify:

- email/password signup
- email/password login
- Google sign-in
- forgot password
- logout
- display name
- friendly Firebase error mapping
- demo mode separation
- Firestore user isolation

### Assets

The repository already contains banner, art, and fox assets under `public/assets/`. The first repair should use those stable local files and remove reliance on expected-but-missing `fox-*.webp` files before adding any new assets.

The intended long-term structure is:

```text
public/assets/
```

Recommended categories:

```text
public/assets/banners/
public/assets/fox/
public/assets/cozy/
public/assets/themes/
```

Do not use temporary generated-image URLs.

## Development priority

1. Repository inspection and build baseline
2. Asset pipeline / broken images
3. Home
4. Study
5. Work calendar
6. Projects
7. Firebase/auth/data persistence
8. Final regression pass
9. Vercel deployment readiness

## Production-readiness update — 18 Sep 2026

- Production now requires Firebase authentication; the normal app no longer opens a guest/demo dashboard or offers a Demo Preview path.
- New authenticated accounts begin with empty Home tasks, Study assessments, Work calendar entries, and Projects. Each view listens only to Firestore records whose `ownerId` is the current UID.
- The Work calendar writes newly created entries to the owner-scoped `workItems` collection and its detail view loads the selected owner-scoped record.
- The Home YouTube frame is portalled into its Cozy Media card on Home. On other sections the same mounted frame becomes the fixed mini-player, preserving its playback session.
- Remaining limitation: authenticated Firebase and Vercel deployment verification needs valid production credentials/access; no production data was deleted during this pass.

## Persistence and interaction regression pass — 18 Sep 2026

- Firestore now uses a persistent local cache, and logout waits briefly for pending writes before clearing credentials.
- Study task titles can be edited without replacing their completion or assignee fields.
- Work month/day rendering uses exact dates and start times, and Work detail listens to the selected record rather than waiting for a server-only read.
- The media player stops and removes its detached floating element on logout; non-Home playback can now be hidden and restored.

## Persistence/editability regression pass — 19 Sep 2026

- Root cause: several Firestore listeners spread `id` in the wrong order. Legacy records carried a generated data `id` that differed from the Firestore document ID, so later update/delete calls targeted a nonexistent document; the next listener snapshot then appeared to resurrect or reset the record.
- Home, Study, and Projects now treat the Firestore document ID as canonical, and newly-created Home/Study/Project records write the same ID into both locations.
- Signed-in Home, Study, and Project task mutations now rely on their Firestore snapshot rather than overwriting it with local optimistic arrays.
- Project Ideas and Notes & Brainstorm Log use stable entry IDs, inline editing, and persisted structured data. Existing string ideas remain readable and are normalized on the next save.
- Study journal entries now support inline editing while preserving author and creation metadata.
- Direct unauthenticated `/study`, `/work`, and `/projects` routes were browser-verified to show the Motion auth screen instead of an empty page. Authenticated Firestore end-to-end verification requires a disposable account.

## Stabilization audit — 19 Sep 2026

- The cross-browser task resurrection root cause remains the legacy Firestore data `id` being allowed to override the canonical document ID during listener mapping. Current Home, Study, and Project task listeners correctly assign `id: snapshot.id` last, and mutations target that canonical ID.
- Work Detail had a separate P1 defect: schedule edits and all three journal/checklist controls updated only component state. They now write the selected owner-scoped `workItems/{id}` document, and the listener rehydrates those fields after refresh or another browser's update.
- Signed-in Work drag/reschedule now updates Firestore rather than leaving an in-memory visual move. Project ideas and notes now mutate their embedded arrays inside Firestore transactions, preventing a stale tab from overwriting a newer array written by another tab.
- The local app endpoint responds successfully and lint, typecheck, and production build pass. The two-browser sequence described here was completed in the continuation audit below; cross-user isolation and authenticated Work-detail selection remain separately unverified.

## Continuation stabilization audit — 19 Sep 2026

- **Confirmed P1 root cause:** Study detail listened for tasks by `parentId` alone. The deployed Firestore rules rejected that query, so creates succeeded remotely but the rejected listener left the view stale. The listener and assessment cleanup query now constrain both `parentId` and the signed-in `ownerId`. A live signed-in regression created tasks, completed one, created another, and refreshed; the completed task remained completed and all records were present after refresh.
- **Confirmed P1 root cause:** completing a Project only updated `status`, leaving `section` as `active`. Completed projects therefore remained in Active Projects. Status changes now write the corresponding section in the same document update, and live testing confirmed a completed project moves to Archive and remains there after refresh.
- **Confirmed P1 root cause:** detail identity lived only in React state. Assessment and Project direct detail URLs now survive refresh. Work detail URL state is implemented but interactive selection testing remains unverified.
- **Confirmed P1 root cause:** collaboration-code generation depended on reading candidate code documents. The deployed rules reject those reads. The client now retries an atomic code create/update batch instead, allowing Firestore to reject a collision without a read. Live testing generated and persisted `UVOOX` without new permission errors.
- Profiles now use a live owner document listener and safely create the profile only if it is absent. Authenticated Cozy Media preferences now persist on that profile; the local fallback is UID-scoped rather than shared between accounts in one browser.
- Assessment and Project detail screens now provide explicit permanent-delete controls that delete only the selected owner record and its exact linked records. The Assessment path was live-tested: `QA archive assessment` (four linked QA tasks, no resources or notes) was atomically removed and did not reappear in a fresh authenticated Study session. The Project permanent-delete path remains unverified.
- Live signed-in checks passed for Home task refresh persistence, Study assessment archive and detail refresh, Study task create/complete/create/refresh, Project archive and detail refresh, Work create/refresh, and logout from Work to the auth screen.
- **Same-account browser regression passed:** `http://127.0.0.1:3000` and `http://localhost:3000` are separate origins and therefore have separate Auth/storage state. With the same Firebase account signed into both, a new Home task, Work item, Study assessment, and Project created in the first session all appeared in the other session. A task title edit, completion, refresh, undo, and re-completion from the second session propagated back; the completed result remained completed after reloading the first session.
- **Confirmed P2 root cause:** the media player was manually moved outside React's event root with `appendChild`, which could leave its rendered controls inert. It now uses a React portal. A signed-in media preference propagated to the other session; a YouTube player successfully minimized and restored outside Home after a reload. Signing out one origin removed the authenticated UI and player while the other origin remained signed in.
- Work calendar item selection now produces `/work/item/{id}?date=...`; opening that direct URL in a fresh authenticated tab restored the selected Work detail. The first reload attempt was interrupted only because the local Vite server had stopped; the route itself was then verified after the server restart.
- A live Study journal regression created a note, edited it inline, and refreshed the assessment detail; the edited note remained present.
- The Project delete control resolves to the expected native confirmation prompt, but this browser harness dismisses that prompt before it exposes an accept handle. No Project data was deleted; Project deletion remains **UNVERIFIED** despite the user-authorized QA record.

### Signed-in data-flow map

| Data type | Firestore load/write path | Ownership and browser fallback | Mutation/listener behavior |
| --- | --- | --- | --- |
| Profile, theme, banner, Cozy Media | `users/{uid}` live profile listener; preference updates write the same document | Document ID and `uid` are the Firebase UID. Theme/banner retain legacy local fallbacks; Cozy Media fallback is `motion:cozy-media:{uid}`. | Profile snapshot rehydrates signed-in state; UI previews update locally and the Firestore listener is durable authority. |
| Home, Study, and Project tasks | `tasks`; Home listens by `ownerId`; detail views listen by `parentId` **and** `ownerId` | `ownerId` is the Firebase UID; `parentId` links an Assessment or Project. No signed-in task fallback/demo data. | Create uses a document reference; edit, complete, promote, and delete target that canonical ID. Snapshot state replaces optimistic local arrays. |
| Assessments, resources, and journal notes | `assessments` by `ownerId`; `assessmentResources` and `assessmentNotes` by `assessmentId` | Assessment `ownerId` is the owner UID; access rules resolve the parent assessment. No browser persistence. | Live listeners drive detail state; create/edit uses Firestore writes; a live journal create/edit/refresh regression passed. Deletion atomically batches the assessment, exact child tasks/resources/notes, and its collaboration code. |
| Work | `workItems` by `ownerId`; direct detail listens to `workItems/{id}` | `ownerId` is the Firebase UID; no browser fallback. | Creates, edits, and reschedules write the selected document; listener state restores a direct route after refresh. |
| Projects, ideas, and notes | `projects` by `ownerId`; linked tasks use `tasks.parentId` plus `ownerId` | `ownerId` is the Firebase UID; ideas and notes are embedded in the Project document. | Live project snapshot is canonical; list edits use transactions to avoid stale-tab overwrite; Project deletion batches exact linked tasks. |
| Collaboration codes | `collaborationCodes/{code}` and the parent Assessment | Code record carries `ownerId`; no browser fallback. | Generation retries an atomic create/update batch because deployed rules deny candidate-code reads. Secure client-side redemption remains intentionally disabled. |

## Interaction regression continuation — 20 Sep 2026

- Replaced the browser-native permanent-delete prompt with a shared, keyboard-accessible Motion confirmation modal. It is used by Assessment and Project detail screens, supports Escape cancellation, and keeps the detail visible if the Firestore operation fails.
- **Verified:** deleting `QA delete assessment 20260920` via the new modal waited for its Firestore cleanup batch, navigated to Study, and remained absent after a page refresh. The unrelated `Cross browser study 20260919` record reappeared after its listener settled.
- **Verified:** deleting `QA delete project 20260920` via the new modal waited for its Firestore cleanup batch, navigated to Projects & Ideas, and remained absent after a page refresh.
- **Verified:** Work What Happened, Notes, and Prep each support Enter creation, inline edit, and refresh persistence on `Cross browser work 20260919`. Prep completion, undo, re-completion, and a second prep record all remained correct after refresh.
- **Verified:** Project Ideas and Notes support Enter creation, inline edit, and refresh persistence on `Cross browser project 20260919`; embedded arrays are transaction-updated to avoid stale-tab overwrites.
- **Verified:** a Study task title edit preserved its completion and All Team assignment after refresh.
- **Study resources are link-only — 20 Sep:** new Study resources write external-link metadata to Firestore. The form has a resource name and URL, accepts normal HTTPS URLs without provider-specific restrictions, and preserves existing stored records. A live QA Google Drive regression verified add, refresh persistence, opening by both the resource name and external-link icon, pencil-only title/URL editing, edit-refresh persistence, deletion, and deletion-refresh persistence. Firebase Storage remains configured only to clean up legacy resources that already have a `storagePath` when they or their parent assessment are deleted.
- **QA cleanup — 20 Sep:** all disposable Firestore collections were deleted from the Motion project without changing the Firebase Auth account, Firebase configuration, rules, Vercel configuration, source, or environment variables. Home, Study, Work, and Projects then loaded their authenticated empty states. Work briefly rendered its persistent local cache before its server listener synchronized the empty result.

## Study deletion regression fix — 21 Sep 2026

- **Root cause:** Assessment deletion awaited every legacy `storagePath` deletion before committing the Firestore cleanup batch. A missing, invalid, or stalled Storage object could therefore prevent the assessment, its tasks, resources, notes, and collaboration code from being removed.
- Legacy Storage cleanup is now bounded to ten seconds per resource and is best-effort. Each skipped item logs its exact assessment ID, resource ID, path, Firebase error code, and stage; the Firestore batch remains authoritative and completes the permanent deletion. The Study overview displays a one-time notice if an attachment could not be removed.
- Deleting the parent assessment also made active child listeners fail their rule-based parent lookup. Listener callbacks now suppress only those expected errors once the final deletion batch begins; normal listener failures continue to log.
- Live verification used only `QA delete assessment 20260921` and `QA delete assessment 20260921 final`, each with a task, note, and link resource. Both deleted, redirected to `/study`, disappeared immediately, and remained absent after refresh. The final pass emitted no post-delete Firestore permission errors or Storage errors. No Firestore or Storage rules changed.
