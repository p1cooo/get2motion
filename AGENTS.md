# Pico's Dashboard — Agent Instructions

## Mission

You are working on an existing productivity application called **Pico's Dashboard**.

Your job is to refine, repair, complete, and verify the existing implementation.

Do **not** rebuild the project from scratch unless the current repository is genuinely unusable and you can clearly justify why.

The intended result is a polished, usable V1 that preserves the established product direction.

## Working principles

- Inspect the existing implementation before making architectural changes.
- Preserve working components unless there is a concrete reason to replace them.
- Prefer focused changes over broad rewrites.
- Prefer existing dependencies and native browser/platform features before adding libraries.
- Do not introduce dependencies unless they materially simplify the implementation.
- Prefer correctness, maintainability, and verified behavior over speed.
- Do not claim something works unless it has actually been tested.
- Keep the codebase understandable for future maintenance.

## Architecture

Keep the existing stack:

- Vite single-page application
- React
- TypeScript
- Tailwind CSS 4 through the Vite plugin
- Firebase Authentication
- Cloud Firestore
- Firebase Storage only where necessary
- Vercel deployment

The active application entry point is `src/main.tsx`, which mounts `src/App.tsx`. Navigation is currently React state within the single-page application. `next` and `next.config.mjs` are legacy repository artifacts, not the application architecture.

Do not migrate this project to Next.js or replace the current Vite + React structure without a concrete technical reason. Preserve the working component structure and use Firebase, Firestore, Storage, and Vercel where compatible with this architecture.

## Product behavior

### Tasks

- Use one canonical task model.
- Never duplicate the same logical task across Home, Study, Work, or Projects.
- A task shown in more than one place must stay synchronized because it is the same underlying task.
- Completing or editing a task in one location must update it everywhere.

### UX

- Prefer direct manipulation and inline editing.
- Prefer blank-row quick entry over modal-heavy task creation.
- Keep the experience simple, calm, and lightweight.
- Preserve desktop/landscape layouts as the primary experience.
- Secondary long lists should use internal scrolling rather than making pages grow indefinitely.

### Visual direction

Preserve the established cozy pastel design:

- warm beige / cream backgrounds
- espresso / warm brown typography
- pastel sage
- blush
- lavender
- sand
- soft blue
- rounded cards
- subtle shadows
- fox artwork
- generous whitespace

Avoid:

- corporate SaaS styling
- harsh black borders
- neon colors
- dense admin dashboards
- unnecessary redesigns

## Development discipline

Before modifying a major feature:

1. Inspect the relevant implementation.
2. Identify the smallest safe change.
3. Check whether an existing utility/component already solves the problem.
4. Implement the focused change.
5. Verify the behavior.
6. Run typecheck/build when practical.
7. Update `docs/IMPLEMENTATION_PLAN.md`.

When a feature is completed, update the relevant checkbox in `docs/ACCEPTANCE_CHECKLIST.md`.

## Assets

- Use real image assets from `public/assets/`.
- Do not reference temporary image-generation URLs.
- Do not leave broken image elements that show alt text in the UI.
- Add graceful fallback behavior when an optional image is unavailable.
- Use clear filenames describing the asset.

Recommended structure:

```text
public/
  assets/
    banners/
    fox/
    cozy/
    themes/
```

## Security

- Never commit `.env.local`.
- Never expose Firebase Admin credentials client-side.
- Never hardcode secrets.
- Keep user data isolated by owner UID.
- Assessment collaboration must not expose unrelated tasks, Work data, Projects, or other assessments.
- Store collaborator identity using canonical UIDs, not display names.

## Firebase

- Keep Demo Mode usable without Firebase login.
- Firebase Auth should support email/password signup, email/password login, Google sign-in, forgot password, and logout.
- Map Firebase errors to friendly user-facing messages.
- Firebase Storage should only be used for genuine uploaded files/assets.

## Verification

Use available project scripts where possible:

```bash
npm run lint
npm run typecheck
npm run build
```

If `typecheck` is missing, add:

```json
"typecheck": "tsc --noEmit"
```

Do not report completion while build/type errors introduced by your work remain unresolved.

## Source of truth

Read these before substantial implementation work:

- `docs/PRODUCT_SPEC.md`
- `docs/CURRENT_STATE.md`
- `docs/ACCEPTANCE_CHECKLIST.md`
- `docs/IMPLEMENTATION_PLAN.md`

When repository behavior differs from the product spec, preserve correct existing behavior where it is clearly intentional; otherwise align it with the spec.
