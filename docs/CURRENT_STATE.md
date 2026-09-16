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
- Firebase Auth and Firestore setup, Firestore security rules, seed helpers, and auth UI are present. Study now reads owner assessments from Firestore for signed-in users while guests retain the demo dataset. Assessment Detail subscribes to its assessment, canonical tasks, resources, and notes, and writes changes back to Firestore; file resources use Firebase Storage on signed-in uploads. The remaining product views still read demo data directly.
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
- Firestore rules now restrict assessment notes and resources to the assessment owner or member. The legacy join flow still needs a trusted server-side code-redemption step before production deployment: Firestore rules cannot prove a client looked up the code before adding itself to `memberIds`.
- Guest-mode Assessment Detail remains local demo UI by design. Browser verification confirmed the guest UI and its controls render without a new runtime error; authenticated persistence regression requires a non-production test account and has not been marked verified.

### Targeted V1 blocker audit (16 Sep 2026)

1. **Collaboration security:** the current client can read a code and then update `memberIds`; Firestore rules cannot attest that lookup, so production code redemption needs a trusted backend endpoint.
2. **Authenticated regression:** a disposable Firebase test account is needed to verify writes through refresh/navigation without creating or using an account through browser automation without approval.
3. **Remaining data loss:** Work calendar/detail and Projects/detail still use component-local demo state. They are the next persistence candidates after the authenticated Assessment Detail regression and secure collaboration redemption.
4. **Assessment UI gap:** task titles are displayed but not yet inline-editable, so the requested task inline-edit acceptance item remains open.

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

- only 3 most recent cards per section on main page
- count badges should show totals
- View More full list page
- drag between sections must update underlying status
- project name/status/description/target date inline editing
- project task quick-entry
- project task inline edit
- task context actions: Delete, Due Date, Show on Home
- notes should include author/timestamp
- long notes should scroll internally

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
