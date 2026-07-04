# AC360 Phase 3N — Executive Reporting, Export Center, Print-Ready Views & Customer Board Packs

Phase 3N extends the French-native Morocco customer-end cockpit with executive reporting surfaces, governed exports, print-ready A4 views, and customer board packs.

## Scope

- No SQL migration.
- No dark theme.
- No generic dashboard.
- Preserves AC360 premium white customer cockpit.
- Preserves Vercel build stability lock.
- Adds reporting/export/board-pack UI intelligence only.

## Added files

- `lib/ac360/customer-reporting-model.ts`
- `components/ac360/customer/Ac360CustomerExecutiveReportingLayer.tsx`
- `scripts/verify-ac360-phase3n-executive-reporting-exports.mjs`

## Updated files

- `components/ac360/customer/Ac360CustomerExperienceShell.tsx`
- `components/ac360/customer/Ac360CustomerDedicatedModuleScreen.tsx`

## UX doctrine

The reporting layer must show:

- executive reporting readiness score,
- board packs for direction, finance, ParentTrust,
- export center for PDF/XLSX/CSV/Board Pack,
- print-ready A4 views,
- governance proof expectations,
- commercial and billable reporting signals,
- recommended next reporting actions.

This phase keeps the customer-end experience French-native, white, dense, operational, commercially intelligent, and governance-aware.
