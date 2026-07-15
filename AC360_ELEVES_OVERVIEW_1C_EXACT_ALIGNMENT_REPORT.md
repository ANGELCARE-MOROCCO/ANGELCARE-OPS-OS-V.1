# AngelCare 360 — Élèves Overview Patch 1C Exact Reference Alignment

## Target

- Batch 1 / Image 3
- Route: `/angelcare-360-command-center/eleves`
- Page: `Élèves`
- Purpose: remove the old generic People workspace wrapper from this route so the page starts directly with the premium Élèves experience, matching the accepted reference image structure.

## Root issue fixed

The route was technically patched, but it was still rendered inside the old `Espace personnes / ANGELCARE 360 COMMAND CENTER` wrapper.

That wrapper created:

- too much vertical waste above the real page
- duplicated navigation
- a dashboard-inside-dashboard feeling
- poor alignment with the original Figma-style reference image

## File changed

- `components/angelcare360/people/Angelcare360PeopleChrome.tsx`

## What changed

`Angelcare360PeopleChrome` now detects dedicated Figma-built routes. For:

```txt
/angelcare-360-command-center/eleves
```

it renders the page body directly and skips the generic People hub chrome.

The old wrapper remains available for other people routes that have not yet received their dedicated surgical redesign.

## Constraints respected

- No student data changed.
- No server data loader changed.
- No drawer workflow changed.
- No seed file changed.
- No migration changed.
- No sidebar/global shell changed.
- No operator/admin route touched.
- No fake data added.
- No generic shared dashboard strategy added.

## Local verification

Run:

```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
```

Then restart cleanly:

```bash
rm -rf .next
npm run dev
```

Open:

```txt
http://localhost:3000/angelcare-360-command-center/eleves
```

## Expected result

The page should no longer show the generic `Espace personnes` block or the old people navigation cards. It should start directly with:

- `Élèves`
- subtitle
- in-page tabs
- KPI rail
- action/search bar
- student table and intelligence panels
