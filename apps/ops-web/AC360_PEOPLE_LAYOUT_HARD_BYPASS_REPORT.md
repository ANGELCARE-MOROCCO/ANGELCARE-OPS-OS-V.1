# AngelCare 360 — People Layout Hard Bypass Patch

## Problem fixed

The `/angelcare-360-command-center/eleves` page was still showing the old generic wrapper:

- `ESPACE PERSONNES`
- `ANGELCARE 360 COMMAND CENTER`
- people navigation cards above the actual Élèves page

The previous route-specific client-side bypass depended on `usePathname()` inside `Angelcare360PeopleChrome`, but the wrapper still rendered in the user's local app.

## Final reliable fix

This patch removes the people chrome at the route-group layout level.

Changed file:

- `app/(protected)/angelcare-360-command-center/(people)/layout.tsx`

The layout still verifies the AngelCare 360 school context, but now returns the page directly:

```tsx
return <>{children}</>
```

## Why this is the correct fix

The wrapper was not coming from the Élèves page component itself. It was injected above the page by the `(people)/layout.tsx` route-group layout.

Removing it at layout level is the most certain way to make `/eleves` start directly with:

- `Élèves`
- subtitle
- tabs
- KPI rail
- action/search bar
- student table
- right intelligence panels

## Scope

- No database change
- No migration
- No seed
- No fake data
- No backend reset
- No sidebar/global AngelCare shell change
- No operator/admin route change

## Note

This removes the old generic people hub wrapper for the full `(people)` route group, not just `eleves`. That is intentional because the generic wrapper is incompatible with the Figma-grade page-by-page approach and will otherwise keep polluting `parents`, `enseignants`, `personnel`, and related people pages.

## Verify

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
rm -rf .next
npm run dev
```

Then open:

```txt
http://localhost:3000/angelcare-360-command-center/eleves
```

Expected: the page starts directly with the premium Élèves page. No `ESPACE PERSONNES` block appears.
