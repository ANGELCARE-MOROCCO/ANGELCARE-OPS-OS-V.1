# ANGELCARE 360 Operator Backoffice Implementation Report

## Scope Confirmation

This delivery adds a separate internal SaaS operator backoffice for AngelCare at `/angelcare-360-operator`.
It is isolated from the customer school command center at `/angelcare-360-command-center`.
The customer command center subtree was not modified.

This backoffice is for AngelCare internal teams only and covers:
clients, tenants, subscriptions, plans, packages, feature flags, usage limits, billing, invoices, payments, dunning, onboarding, implementation, support, contracts, renewals, customer health, service operations, audit, settings, and operator roles.

## Separation From Customer Command Center

The operator portal uses its own namespace:
- `app/(protected)/angelcare-360-operator`
- `components/angelcare360/operator`
- `lib/angelcare360/operator`
- `types/angelcare360/operator`
- `app/api/angelcare360/operator`
- `supabase/migrations/20260709_angelcare360_operator_backoffice_foundation.sql`

The customer command center remains in its original namespace and was not polluted by operator routes or operator logic.

## Files Created

Core created files include:
- `app/(protected)/angelcare-360-operator/**`
- `app/api/angelcare360/operator/**`
- `components/angelcare360/operator/**`
- `lib/angelcare360/operator/**`
- `types/angelcare360/operator/**`
- `data/angelcare360/operator-navigation.ts`
- `supabase/migrations/20260709_angelcare360_operator_backoffice_foundation.sql`
- `ANGELCARE_360_OPERATOR_BACKOFFICE_IMPLEMENTATION_REPORT.md`
- `ANGELCARE_360_OPERATOR_BACKOFFICE_SMOKE_TEST_CHECKLIST.md`

## Files Modified

Operator files were added or updated in these areas:
- operator shell, sidebar, header, tables, cards, drawers, badges, timeline, pipeline, right panel, lock panel
- operator access, audit, shared, overview, clients, tenants, plans, packages, subscriptions, billing, features, onboarding, support, contracts, renewals, health, service, settings, validation
- operator routes for all required pages
- operator API route dispatchers

Unrelated dirty files already present before this work were left untouched:
- `app/api/email-os/mailboxes/bulk-preinstall/route.ts`
- `app/api/email-os/send-direct/route.ts`
- `lib/email-os-core/multi-mailbox-resolver.ts`
- `lib/email-os-core/send-mail.ts`

## Routes Created

Operator routes now exist for:

### Root
- `/angelcare-360-operator`

### Clients & Tenants
- `/angelcare-360-operator/clients`
- `/angelcare-360-operator/clients/[id]`
- `/angelcare-360-operator/tenants`
- `/angelcare-360-operator/client-access`

### Offer & Monetization
- `/angelcare-360-operator/plans`
- `/angelcare-360-operator/packages`
- `/angelcare-360-operator/subscriptions`
- `/angelcare-360-operator/features`
- `/angelcare-360-operator/modules`
- `/angelcare-360-operator/usage-limits`

### Billing
- `/angelcare-360-operator/billing`
- `/angelcare-360-operator/billing/accounts`
- `/angelcare-360-operator/billing/invoices`
- `/angelcare-360-operator/billing/payments`
- `/angelcare-360-operator/billing/balances`
- `/angelcare-360-operator/billing/dunning`

### Customer Success
- `/angelcare-360-operator/onboarding`
- `/angelcare-360-operator/implementation`
- `/angelcare-360-operator/support`
- `/angelcare-360-operator/contracts`
- `/angelcare-360-operator/renewals`
- `/angelcare-360-operator/customer-health`

### Service Operations
- `/angelcare-360-operator/service-operations`
- `/angelcare-360-operator/service-requests`
- `/angelcare-360-operator/incidents`
- `/angelcare-360-operator/tasks`
- `/angelcare-360-operator/notes`

### Governance
- `/angelcare-360-operator/audit`
- `/angelcare-360-operator/settings`
- `/angelcare-360-operator/operator-roles`

## Database Migration Created

Migration:
- `supabase/migrations/20260709_angelcare360_operator_backoffice_foundation.sql`

This migration is additive and introduces the operator SaaS tables only. No destructive SQL was added.

## Tables Created

Created tables:
- `angelcare360_operator_clients`
- `angelcare360_operator_tenants`
- `angelcare360_operator_plans`
- `angelcare360_operator_packages`
- `angelcare360_operator_subscriptions`
- `angelcare360_operator_feature_flags`
- `angelcare360_operator_usage_limits`
- `angelcare360_operator_billing_accounts`
- `angelcare360_operator_invoices`
- `angelcare360_operator_payments`
- `angelcare360_operator_dunning_actions`
- `angelcare360_operator_onboarding_tasks`
- `angelcare360_operator_support_tickets`
- `angelcare360_operator_contracts`
- `angelcare360_operator_renewals`
- `angelcare360_operator_service_requests`
- `angelcare360_operator_incidents`
- `angelcare360_operator_tasks`
- `angelcare360_operator_notes`
- `angelcare360_operator_service_events`
- `angelcare360_operator_audit_logs`

## Server Helpers Created

Created operator server helpers under `lib/angelcare360/operator/`:
- `access.ts`
- `audit.ts`
- `shared.ts`
- `overview.ts`
- `clients.ts`
- `tenants.ts`
- `plans.ts`
- `packages.ts`
- `subscriptions.ts`
- `billing.ts`
- `features.ts`
- `usage.ts`
- `onboarding.ts`
- `support.ts`
- `contracts.ts`
- `renewals.ts`
- `health.ts`
- `service.ts`
- `settings.ts`
- `validation.ts`
- `index.ts`

## API Routes Created

Created operator API dispatchers:
- `app/api/angelcare360/operator/clients/route.ts`
- `app/api/angelcare360/operator/tenants/route.ts`
- `app/api/angelcare360/operator/plans/route.ts`
- `app/api/angelcare360/operator/packages/route.ts`
- `app/api/angelcare360/operator/subscriptions/route.ts`
- `app/api/angelcare360/operator/billing/route.ts`
- `app/api/angelcare360/operator/features/route.ts`
- `app/api/angelcare360/operator/usage/route.ts`
- `app/api/angelcare360/operator/onboarding/route.ts`
- `app/api/angelcare360/operator/support/route.ts`
- `app/api/angelcare360/operator/contracts/route.ts`
- `app/api/angelcare360/operator/renewals/route.ts`
- `app/api/angelcare360/operator/health/route.ts`
- `app/api/angelcare360/operator/service/route.ts`
- `app/api/angelcare360/operator/audit/route.ts`
- `app/api/angelcare360/operator/settings/route.ts`

## Validation Schemas Created

Validation coverage exists for:
- client create/update/archive
- tenant create/link/status update
- plan create/update/retire
- package create/update
- subscription create/update/status change/cancel
- billing account create/update
- invoice create/issue/cancel
- dunning action create/complete
- payment record/confirm/reject
- feature flag update
- usage limit update
- onboarding task create/update/complete
- support ticket create/assign/status change/resolve
- contract create/status update
- renewal create/status update
- service request create/update/complete
- incident create/resolve
- task create/update/complete
- note create
- service event create
- audit filters

All validation messages are in French.

## Types Created

Created operator types under `types/angelcare360/operator/` covering:
- roles
- permissions
- clients
- tenants
- plans
- packages
- subscriptions
- billing accounts
- invoices
- payments
- dunning actions
- feature flags
- usage limits
- onboarding tasks
- support tickets
- contracts
- renewals
- service requests
- incidents
- tasks
- notes
- service events
- audit logs
- overview KPIs
- health dashboards
- navigation metadata

## UI Components Created

Created operator UI primitives and workspaces under `components/angelcare360/operator/`:
- shell, sidebar, header, page shell
- KPI cards
- data table
- drawer
- status badge
- locked panel
- audit drawer
- timeline
- pipeline
- health panel
- command bar
- action queue
- right panel
- table shell
- hub
- section screen

## Billing / Subscription Workflow

Implemented flows for:
- client subscription listing
- plan and package cataloguing
- invoice issuance
- manual payment recording
- payment confirmation / rejection
- balance tracking
- dunning follow-up
- subscription status management

Automatic online payment and automatic PDF/email flows remain locked.

## Feature Flag Workflow

Implemented:
- list feature flags
- enable / disable / lock / unlock / schedule
- module entitlement matrix
- usage limits tracking

## Onboarding Workflow

Implemented:
- onboarding task board
- task create/update/complete
- implementation board
- blocked-task visibility

## Support Workflow

Implemented:
- support ticket list
- ticket assignment
- status updates
- resolution with summary

## Renewal Workflow

Implemented:
- renewal pipeline
- renewal status changes
- probability / expected amount fields

## Customer Health Logic

Implemented a transparent “Score opérationnel indicatif” computed from real signals only:
- subscription status
- overdue invoices
- urgent support tickets
- blocked onboarding tasks
- unresolved incidents
- at-risk clients

No fake health score is used.

## Service Operations Workflow

Implemented:
- service requests
- incidents
- tasks
- internal notes
- service events

## Locked Infrastructure

Still locked until real infrastructure exists:
- online payment gateway
- automatic bank transfer execution
- automatic invoice PDF generation
- automatic email invoice sending
- WhatsApp / SMS notifications
- push notifications
- electronic signature
- advanced monitoring integration
- advanced usage metering
- automatic external dunning

## Security / Access Model

Access is internal AngelCare only.
The operator session helper denies by default unless the current session matches the operator access model.
Operator permissions are modeled at type level and enforced in server helpers.
The portal is not exposed to school users.

## Audit Logging

Internal operator actions are written to:
- `angelcare360_operator_audit_logs`

Audit coverage includes:
- client changes
- tenant changes
- plan/package changes
- subscription changes
- billing / invoice / payment / dunning actions
- feature and usage updates
- onboarding / support / contract / renewal actions
- service requests / incidents / tasks / notes

## Customer Command Center Untouched Confirmation

`app/(protected)/angelcare-360` was not modified.

## Full Build Status

Full production build was **not run** by order.

## TypeScript Result

Static TypeScript check command used:
`NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`

Result: **passed**.

## Known Limitations

- No production build was run in this workspace.
- Live Supabase runtime verification was not executed here.
- Operator access remains conservative and may need final role mapping confirmation in the real identity/session layer.
- Locked features remain intentionally unavailable until external infrastructure is validated.
- Unrelated Email-OS dirty files were already present and were not touched.

## Smoke-Test Route List

Recommended smoke-test routes:
- `/angelcare-360-operator`
- `/angelcare-360-operator/clients`
- `/angelcare-360-operator/clients/[id]`
- `/angelcare-360-operator/tenants`
- `/angelcare-360-operator/client-access`
- `/angelcare-360-operator/plans`
- `/angelcare-360-operator/packages`
- `/angelcare-360-operator/subscriptions`
- `/angelcare-360-operator/features`
- `/angelcare-360-operator/modules`
- `/angelcare-360-operator/usage-limits`
- `/angelcare-360-operator/billing`
- `/angelcare-360-operator/billing/accounts`
- `/angelcare-360-operator/billing/invoices`
- `/angelcare-360-operator/billing/payments`
- `/angelcare-360-operator/billing/balances`
- `/angelcare-360-operator/billing/dunning`
- `/angelcare-360-operator/onboarding`
- `/angelcare-360-operator/implementation`
- `/angelcare-360-operator/support`
- `/angelcare-360-operator/contracts`
- `/angelcare-360-operator/renewals`
- `/angelcare-360-operator/customer-health`
- `/angelcare-360-operator/service-operations`
- `/angelcare-360-operator/service-requests`
- `/angelcare-360-operator/incidents`
- `/angelcare-360-operator/tasks`
- `/angelcare-360-operator/notes`
- `/angelcare-360-operator/audit`
- `/angelcare-360-operator/settings`
- `/angelcare-360-operator/operator-roles`

## Recommended Next Actions

1. Run the real production build on the user machine:
   `npm run build`
2. Smoke-test the operator routes above.
3. Validate operator role mapping in the live auth/session layer.
4. Verify the migration in Supabase before exposing the backoffice to staff.

## Enterprise UI/UX Design Decisions

The operator backoffice uses a premium white enterprise visual system with icy-blue accents, calm status colors, and dense but readable information architecture.

Key UI decisions:
- dedicated internal shell separate from the customer command center
- grouped sidebar navigation for SaaS operations, billing, customer success, service operations, and governance
- dashboard-first layout with KPI cards, action queue, risk panel, and intelligence panel
- drawer-based CRUD interaction for most create/update flows
- premium table shells with filters, status badges, and controlled empty states
- locked-state panels for infrastructure that is intentionally unavailable
- French-only customer-facing copy in operator surfaces

## Client Lifecycle Workflow

Supported operator progression:
1. prospect
2. pilot
3. active
4. suspended
5. churned
6. archived

Operational meaning:
- prospect: a potential school/crèche account under commercial follow-up
- pilot: onboarding or limited deployment phase
- active: paid, live customer account
- suspended: access or billing risk requires restriction
- churned: customer relationship ended
- archived: retained for audit and historical review

## Subscription Workflow

The operator portal supports:
- plan selection
- subscription creation
- trial periods
- status changes
- cancellation with reason
- suspension with reason
- balance and billing period tracking

Subscription status lifecycle:
- trial
- active
- past_due
- suspended
- cancelled
- expired
- archived

## Billing Workflow

Billing operations are designed for AngelCare to invoice schools directly.

Supported actions:
- create billing account
- issue invoice
- cancel invoice
- record payment
- confirm payment
- reject payment
- track unpaid balance
- mark dunning follow-up

Billing status lifecycle:
- draft
- issued
- partially_paid
- paid
- overdue
- cancelled
- archived

## Payment Workflow

The portal supports manual payment tracking only.

Operational payment states:
- pending
- confirmed
- rejected
- refunded
- cancelled

No fake online payment success is shown. Online payment remains locked until real infrastructure is available.

## Feature Flag Workflow

Feature control supports:
- enable
- disable
- lock
- unlock
- schedule
- configuration-required status

This is used to control client-specific module activation and commercial entitlements.

## Usage Limit Workflow

The operator portal exposes entitlement limits where data exists:
- students
- staff
- users
- sites
- storage
- messages
- support tier

If a usage dimension is not measured, the portal shows a neutral non-measured state instead of inventing numbers.

## Onboarding Workflow

Onboarding is tracked as a task board:
- todo
- in_progress
- blocked
- done
- cancelled

It is intended to support launch planning, onboarding follow-up, and implementation ownership.

## Support Workflow

Support tickets include:
- priority
- assignment
- status lifecycle
- resolution summary
- audit visibility

Support status lifecycle:
- new
- triage
- assigned
- waiting_client
- waiting_internal
- resolved
- closed
- archived

## Contract Workflow

Contract metadata is tracked for:
- draft
- sent
- signed
- active
- expired
- cancelled
- archived

No fake signature flow is exposed.

## Renewal Workflow

Renewal pipeline states:
- upcoming
- in_discussion
- proposal_sent
- renewed
- at_risk
- lost
- cancelled

This is meant for commercial follow-up and revenue protection.

## Customer Health Logic

Customer health is transparent and derived from real signals only:
- subscription state
- overdue invoices
- urgent support tickets
- blocked onboarding tasks
- unresolved service incidents
- renewal risk

When data is sparse, the portal shows an indicative operational score rather than a fabricated score.

## Service Operations Workflow

Service operations are tracked through:
- service requests
- incidents
- tasks
- notes
- service events

This provides an internal view of operational friction, client risks, and intervention history.

## Locked Infrastructure List

Locked until real infrastructure exists:
- online payment gateway
- automatic bank transfer execution
- automatic invoice PDF generation
- automatic email invoice sending
- WhatsApp notifications
- SMS notifications
- push notifications
- electronic signature
- advanced monitoring integration
- advanced usage metering
- automatic external dunning

## Security / Access Model

The operator portal is internal-only. It requires authenticated access and uses a conservative allow-by-role approach that defaults to denial when operator access cannot be proven.

Security properties:
- no anonymous writes
- no public operator access
- no reuse of the customer command center shell
- internal role/permission gating
- server-side validation on mutations
- audit logging for sensitive operator actions

## Audit Logging Model

Operator audit entries capture:
- actor
- client
- tenant
- module
- action
- entity
- severity
- before data
- after data
- metadata
- timestamp

Audit is applied to high-value SaaS operator actions such as client management, billing, feature entitlements, support, contracts, renewals, and service operations.

## No Fake Success Guarantees

The operator portal does not claim success for:
- online payments
- PDF generation
- email sending
- customer provisioning
- monitoring
- usage metering
- e-signature

When infrastructure is missing, the UI intentionally shows locked or configuration-required states instead of pretending a workflow completed.

## Finalisation Couche Actions & Workflows

This pass completed the visible action layer for the operator portal without changing business logic or adding new product modules.

Files changed in this finalisation pass:
- `components/angelcare360/operator/Angelcare360OperatorActionDrawer.tsx`
- `components/angelcare360/operator/Angelcare360OperatorFormField.tsx`
- `components/angelcare360/operator/Angelcare360OperatorActionButton.tsx`
- `components/angelcare360/operator/Angelcare360OperatorConfirmPanel.tsx`
- `components/angelcare360/operator/Angelcare360OperatorMutationBanner.tsx`
- `components/angelcare360/operator/Angelcare360OperatorActionMenu.tsx`
- `app/(protected)/angelcare-360-operator/clients/page.tsx`
- `app/(protected)/angelcare-360-operator/clients/[id]/page.tsx`
- `app/(protected)/angelcare-360-operator/plans/page.tsx`
- `app/(protected)/angelcare-360-operator/packages/page.tsx`
- `app/(protected)/angelcare-360-operator/subscriptions/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/accounts/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/invoices/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/payments/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/dunning/page.tsx`
- `app/(protected)/angelcare-360-operator/features/page.tsx`
- `app/(protected)/angelcare-360-operator/usage-limits/page.tsx`
- `app/(protected)/angelcare-360-operator/tenants/page.tsx`
- `app/(protected)/angelcare-360-operator/onboarding/page.tsx`
- `app/(protected)/angelcare-360-operator/support/page.tsx`
- `app/(protected)/angelcare-360-operator/contracts/page.tsx`
- `app/(protected)/angelcare-360-operator/renewals/page.tsx`
- `app/(protected)/angelcare-360-operator/service-operations/page.tsx`
- `app/(protected)/angelcare-360-operator/service-requests/page.tsx`
- `app/(protected)/angelcare-360-operator/incidents/page.tsx`
- `app/(protected)/angelcare-360-operator/tasks/page.tsx`
- `app/(protected)/angelcare-360-operator/notes/page.tsx`

Workflows now exposed in UI:
- create / update / archive client
- create / update / status-change / cancel subscription
- create / update / retire plan
- create / update package
- create / update billing account
- create invoice / issue invoice / cancel invoice
- record payment / confirm payment / reject payment
- create / complete dunning action
- update feature flag / update usage limit
- create / update / complete onboarding task
- create / assign / status-change / resolve support ticket
- create contract / update contract status
- create renewal / update renewal status
- create / update / complete service request
- create / resolve incident
- create / update / complete task
- create note

Actions still locked:
- online payment gateway
- invoice PDF generation
- automatic email / WhatsApp / SMS
- push notifications
- e-signature
- advanced monitoring
- advanced usage metering

Known limitations:
- update flows still depend on manual record selection in action drawers
- no inline row editors were added
- locked infrastructure remains visible but disabled
- no build was run as required

## Finalisation Couche Actions & Workflows

This pass completed the visible operator action layer on top of the existing backoffice infrastructure.

### Files changed in this phase
- `app/(protected)/angelcare-360-operator/billing/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/invoices/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/payments/page.tsx`
- `app/(protected)/angelcare-360-operator/billing/dunning/page.tsx`
- `app/(protected)/angelcare-360-operator/clients/[id]/page.tsx`
- `app/(protected)/angelcare-360-operator/settings/page.tsx`
- `app/api/angelcare360/documents/render/route.ts`
- `app/api/angelcare360/exports/download/route.ts`
- `app/api/angelcare360/operator/onboarding/route.ts`
- `app/api/angelcare360/operator/support/route.ts`
- `lib/angelcare360/documents/builders.ts`
- `lib/angelcare360/email/email-os-bridge.ts`
- `lib/angelcare360/server/reports.ts`

### Workflows now exposed in UI
- A4 print for invoice, receipt, client statement, generated document, export file
- CSV download for operator clients, invoices and payments
- email actions for invoice, receipt, manual reminder, onboarding and support follow-up
- payment gate creation, manual pending, manual processed, waive, cancel and status view
- billing / payment / support / onboarding actions in drawers and action menus

### Forms, drawers and mutation surfaces added
- action drawers for billing, client detail and payment gates
- confirm panels for destructive or status-changing actions
- visible mutation banners and disabled locked states
- structured operator action menu entries for email, print and payment gate workflows

### API operations wired
- `documents/render`
- `exports/download`
- `operator/payment-gates`
- `payment-gate/active`
- `payment-gate/checkout`
- operator onboarding and support email branches

### Actions still locked
- online payment checkout remains locked unless a real provider exists
- WhatsApp remains locked
- SMS remains locked
- XLSX remains locked
- browser-close dismissal of the customer payment overlay is not allowed by design

### Known limitations
- no inline spreadsheet/XLSX engine exists in the repository
- online payment provider integration remains absent and therefore locked
- email send success depends on the existing Email-OS runtime configuration
- the customer payment overlay is intentionally blocking when a gate is active

### Smoke-test list
- open invoice A4 print
- open receipt A4 print
- open client statement A4 print
- download operator CSV exports
- send invoice email via Email-OS
- send receipt email via Email-OS
- send manual reminder email
- create payment gate
- mark payment gate manual pending
- mark payment gate manual processed
- waive payment gate
- cancel payment gate
- verify payment overlay blocks the customer command center

### Verification
- TypeScript static check: passed
- Full build: not run by order
- Staging: not performed
