# ANGELCARE 360 Vercel Repo Audit

## Repository Summary

- Framework: Next.js `16.2.3`
- UI: React `19.2.4`
- Language: TypeScript, strict mode enabled
- Package manager: npm
- Primary router: App Router
- Deployment target: Vercel

## Current Stack Evidence

### Key files

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `proxy.ts`
- `app/layout.tsx`
- `app/(protected)/layout.tsx`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/client.ts`
- `permissions.ts`
- `app/login/page.tsx`
- `vercel.json`

### Auth stack

- `app/login/page.tsx` uses a server action to call a Supabase RPC named `login_app_user`
- It creates an internal `app_sessions` row and sets a cookie named from `APP_SESSION_COOKIE`
- `app/(protected)/layout.tsx` gates protected pages through `getCurrentUser()`
- `proxy.ts` enforces route/runtime safety and session-aware control-plane behavior
- Existing auth relies on Supabase plus internal app tables, not NextAuth

### Database stack

- Supabase SSR client is used on server and browser
- `@prisma/client` is installed, but the current app is operationally Supabase-first
- `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are present in `.env.local`
- `supabase/migrations` contains 180 SQL migration files

### UI / component system

- The repo contains many purpose-built feature shells and command centers
- Existing design system is mixed but mostly enterprise white UI with module-specific components
- `app/(protected)/layout.tsx` wraps protected areas with global shell components:
  - `OverheadPanel`
  - `VoicePhoneWidgetGate`
  - `AngelCareConnect`
  - `OpsosTelemetryProvider`
- There is already an `app/(protected)/angelcare-360` subtree with 15 files

## Current Route Surface

- `app` contains 848 `page.tsx` files
- `app/api` contains 1227 files
- The app already has many protected product spaces:
  - `opsos`
  - `carelink-ops`
  - `traininghub`
  - `revenue-command-center`
  - `market-os`
  - `email-os`
  - `b2b-marketplace`
  - `angelcare-360`

## Environment Conventions

Observed variable families in `.env.local`:

- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Database: `DATABASE_URL`
- Vercel: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID`, `VERCEL_OIDC_TOKEN`
- Product/runtime: `NEXT_PUBLIC_BASE_URL`, `CORS_ORIGIN`, `PORT`
- Communication / voice: `LIVEKIT_*`, `TELNYX_*`
- Email/ops product families: many domain-specific mailbox and provider keys

## Build / Test / Lint Commands

### Available in `package.json`

- `npm run dev`
- `npm run build`
- `npm run start`

### Not present as scripts

- `lint`
- `typecheck`
- `test`

If those checks are needed during implementation, they must be run explicitly with tooling such as `npx eslint`, `npx tsc --noEmit`, or `npm test` only if a test runner is present.

## Next.js Configuration Notes

- `next.config.ts` disables webpack build workers for stability
- webpack cache is explicitly disabled
- server external packages include `@sparticuz/chromium` and `puppeteer-core`
- output file tracing includes Chromium assets for PDF routes

## Protected Route / Runtime Notes

- `proxy.ts` is a central safety gate, not just a basic auth middleware
- It handles:
  - system control plane bypasses
  - protected app access
  - service-role environment validation
  - runtime mode blocking
  - API fallback responses
- Route access is already coupled to runtime status, permissions, and module state

## Current Working Tree Status

Before this Phase 0 audit, the working tree already contained user changes:

- modified: `app/(protected)/angelcare-360/customer/[module]/page.tsx`
- untracked: `app/(protected)/angelcare-360/customer/finance-creances/`
- untracked: `components/ac360/customer/finance/`
- untracked: `scripts/verify-ac360-finance-route-force-hotfix.mjs`

This audit did not overwrite those changes.

## Branch

- Dedicated branch created: `angelcare360-command-center-rebuild`

## Existing AngelCare 360 Surface

The repository already contains a partial AngelCare 360 area:

- `app/(protected)/angelcare-360/page.tsx`
- `app/(protected)/angelcare-360/customer/...`
- `app/(protected)/angelcare-360/foundation/page.tsx`
- `app/(protected)/angelcare-360/policy-lock/page.tsx`
- `app/(protected)/angelcare-360/action-wiring/page.tsx`
- `app/(protected)/angelcare-360/deployment-gate/page.tsx`
- `app/(protected)/angelcare-360/guardrails/page.tsx`
- `app/(protected)/angelcare-360/billing-center/page.tsx`

This means the new `ANGELCARE 360 COMMAND CENTER` must be introduced as a separate namespace rather than reusing the existing page tree.

## Repo Risk Notes

- The repo is already large and heavily specialized.
- There is no generic “CRUD starter” layer to safely piggyback on.
- The current app uses many product shells and route gates; a new module must be intentionally isolated.
- The presence of an existing AC360 subtree increases the risk of route collision if the new product is not namespaced cleanly.

