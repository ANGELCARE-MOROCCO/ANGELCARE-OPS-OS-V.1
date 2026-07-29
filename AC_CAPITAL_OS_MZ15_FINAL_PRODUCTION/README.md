# AC CAPITAL OS — MZ15 Final Production Capital Institution

This package supersedes MZ14 as the final front-end acceptance implementation. It replaces the active universal façade with 18 dedicated, page-specific capital operating rooms and adds real API-bound workflows, specialized drawers, controlled modals, production truth states and evidence tooling.

## Delivered architecture

- 18 protected route pages, each importing a dedicated page package.
- 18 dedicated page components and CSS modules.
- Premium shared shell primitives only: role-aware navigation, global search, command palette, data/source truth and contextual intelligence rail.
- Real Supabase-backed API handlers for the capital lifecycle.
- Additive MZ15 SQL for setting requests, SOP progress, browser acceptance and UI audit.
- Static verification suite plus authenticated Playwright acceptance with one separate full-page screenshot per route.

## Apply

```bash
cd ~/Desktop/angelcare-platform

unzip -o AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION_CAPITAL_INSTITUTION.zip -d .

node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/apply_ac_capital_os_mz15_final.mjs

node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/verify_ac_capital_os_mz15_final.mjs
```

The static verifier proves package architecture and code evidence. It does **not** claim your current repository TypeScript, SQL or browser gates have already passed.

## Run MZ15 SQL manually

```bash
psql "$SUPABASE_DB_URL" \
  -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260727_ac_capital_os_mz15_final_productization.sql
```

## Repository TypeScript gate

```bash
cd ~/Desktop/angelcare-platform/apps/ops-web
npx tsc -p tsconfig.json --noEmit --pretty false
```

## Authenticated browser acceptance

Start the app, then run from repository root:

```bash
node ./AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/scripts/run_mz15_browser_acceptance.mjs \
  --base-url http://localhost:3000 \
  --storage-state /absolute/path/to/authenticated-storage-state.json
```

This writes 18 separate full-page screenshots and JSON/Markdown evidence under:

```text
AC_CAPITAL_OS_MZ15_FINAL_PRODUCTION/evidence/browser/
```

Add `--persist` to save browser results through `/api/ac-capital-os/browser-acceptance` after the MZ15 SQL has run.

## Non-negotiable boundaries

- No automatic investor, bank or grant submission.
- No automatic sensitive email sending.
- No live AI by default.
- No browser-rendered secrets.
- No fake upload, approval, report, submitted status or production-readiness claim.
- PDF export is not claimed; report drafts use Markdown, HTML or JSON.

Read `docs/MZ15_FINAL_KNOWN_LIMITATIONS.md` before production certification.
