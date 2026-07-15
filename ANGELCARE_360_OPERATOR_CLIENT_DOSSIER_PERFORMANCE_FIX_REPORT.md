# AngelCare 360 Operator Client Dossier Performance Fix Report

## Root Cause
- The operator client dossier was loading too much data at once.
- `getOperatorClientById()` fetched multiple related tables with unbounded queries.
- The client detail page also fetched all payment gates system-wide and filtered them in memory.
- The result was a large payload and heavy render path that could freeze the browser on dossier open.

## Files Changed
- `lib/angelcare360/operator/shared.ts`
- `lib/angelcare360/operator/clients.ts`
- `app/(protected)/angelcare-360-operator/clients/[id]/page.tsx`
- `app/(protected)/angelcare-360-operator/clients/[id]/statement-print/page.tsx`

## What Was Bounded
- Tenant rows are now limited.
- Billing account rows are now limited.
- Subscription rows are now limited.
- Invoice rows are now limited to recent items.
- Payment rows are now limited to recent items.
- Onboarding tasks are now limited.
- Support tickets are now limited.
- Contracts are now limited.
- Renewals are now limited.
- Service events are now limited.
- Audit logs are now limited.
- Active payment gates are now scoped to the client and limited.

## Client-Side Loop Check
- No render loop or polling loop was found in the operator shell or client action drawer.
- The client action drawer still refreshes once after successful mutations, which is expected.

## Payment Gate Overlay Isolation
- Confirmed in the inspected code path: the payment gate overlay is mounted in `components/angelcare360/layout/Angelcare360Shell.tsx` for the customer command center.
- It is not mounted in the operator shell.

## Initial Dossier Data
- Client identity.
- Primary tenant summary.
- Active subscription summary.
- Billing account summary.
- Recent invoices.
- Recent payments.
- Active payment gates only.
- Recent onboarding tasks.
- Recent support tickets.
- Recent contracts.
- Recent renewals.
- Recent service events.
- Recent audit logs.

## Deferred To Dedicated Pages
- Full invoices history: `/angelcare-360-operator/billing/invoices`
- Full payments history: `/angelcare-360-operator/billing/payments`
- Support tickets: `/angelcare-360-operator/support`
- Onboarding: `/angelcare-360-operator/onboarding`
- Renewals: `/angelcare-360-operator/renewals`
- Audit: `/angelcare-360-operator/audit`
- Billing and payment gates: `/angelcare-360-operator/billing`

## TypeScript
- Passed with `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`.

## Smoke Test Checklist
- Open `/angelcare-360-operator/clients`
- Click `AC360-DEMO-PE-CASA`
- Confirm the dossier opens without freezing.
- Confirm the page shows a summary-first view.
- Confirm the quick links go to dedicated pages.
- Confirm the payment gate controls still render for the client.
- Confirm the statement print page opens.
- Confirm the customer command center payment gate overlay still only appears in the customer shell.

## Notes
- Build was not run.
- Staging was not performed.
- The operator backoffice remains intact.
