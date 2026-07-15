# AngelCare 360 — Cockpit de Direction Surgical Figma Patch

## Scope
- Target route only: `/angelcare-360-command-center/direction`
- Target file: `app/(protected)/angelcare-360-command-center/direction/page.tsx`
- New route-specific server source: `lib/angelcare360/server/direction.ts`
- New route-specific Figma-grade page body: `components/angelcare360/direction/Angelcare360DirectionCockpit.tsx`

## What changed
- Replaced the generic module-catalogue Direction page with a purpose-built Cockpit de Direction.
- Built a direction-specific server loader that reads real AngelCare 360 backend tables.
- Added a premium page body inspired by the accepted Batch 1 / Image 1 reference: school hero, internal tabs, KPI rail, action bar, admissions, finance, attendance, messages, academic status, transport, alerts, and activity feed.
- Sidebar and global shell were not touched.
- No SQL, seed, migration, admin/operator page, or demo data was added.

## Backend sources used
- `angelcare360_schools` via access context
- `angelcare360_school_settings` via access context
- `angelcare360_academic_years` via access context
- `angelcare360_students`
- `angelcare360_parents`
- `angelcare360_staff`
- `angelcare360_classes`
- `angelcare360_attendance_records`
- `angelcare360_payments`
- `angelcare360_invoices`
- `angelcare360_admission_applications`
- `angelcare360_reclamations`
- `angelcare360_conversations`
- `angelcare360_messages`
- `angelcare360_announcements`
- `angelcare360_transport_routes`
- `angelcare360_transport_vehicles`
- `angelcare360_transport_assignments`
- optional guarded source: `angelcare360_transport_incidents`
- `angelcare360_documents`
- `angelcare360_audit_logs`

## Production safety
- All displayed values are derived from server queries.
- No static fake rows, demo school, demo names, mock arrays, or seed assumptions were added.
- Missing/partial backend sources are shown as a professional partial-source note instead of inventing data.
- Money is formatted as MAD.
- Customer language is business-facing, not developer-facing.

## Verification performed in sandbox
- Syntax/transpile diagnostics passed for the three changed files using TypeScript `transpileModule`.
- Grep for `demo`, `seed`, `fake`, `mock`, and known generated-reference names returned no matches in changed route files.

## Not run
- Full `tsc` and `npm run build` were not run in the sandbox because the uploaded ZIP does not include `node_modules`.

## Local verification command after applying
```bash
NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false
npm run build
```

## Smoke test route
```txt
/angelcare-360-command-center/direction
```
