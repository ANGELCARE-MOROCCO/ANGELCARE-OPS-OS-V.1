# ANGELCARE 360 Operator Backoffice Smoke Test Checklist

## Route-by-Route Smoke Tests

| Route | Smoke Test | Expected Result |
|---|---|---|
| `/angelcare-360-operator` | Load cockpit | KPI cards, risk panels, quick actions and recent audit visible |
| `/angelcare-360-operator/clients` | Open client list | Searchable client table loads |
| `/angelcare-360-operator/clients/[id]` | Open client dossier | Full client 360 dossier renders |
| `/angelcare-360-operator/tenants` | Open tenants | Tenant table and access state visible |
| `/angelcare-360-operator/client-access` | Open client access | Tenant access matrix visible |
| `/angelcare-360-operator/plans` | Open plans | Plan catalog and status badges visible |
| `/angelcare-360-operator/packages` | Open packages | Module bundles visible |
| `/angelcare-360-operator/subscriptions` | Open subscriptions | Subscription lifecycle table visible |
| `/angelcare-360-operator/features` | Open feature flags | Feature flags list visible |
| `/angelcare-360-operator/modules` | Open modules | Entitlement matrix visible |
| `/angelcare-360-operator/usage-limits` | Open usage limits | Limits table visible |
| `/angelcare-360-operator/billing` | Open billing cockpit | Billing KPI and lock panel visible |
| `/angelcare-360-operator/billing/accounts` | Open billing accounts | Billing account table visible |
| `/angelcare-360-operator/billing/invoices` | Open invoices | Invoice table visible |
| `/angelcare-360-operator/billing/payments` | Open payments | Payment table visible |
| `/angelcare-360-operator/billing/balances` | Open balances | Client balance table visible |
| `/angelcare-360-operator/billing/dunning` | Open dunning | Dunning table and lock notice visible |
| `/angelcare-360-operator/onboarding` | Open onboarding | Onboarding task board visible |
| `/angelcare-360-operator/implementation` | Open implementation | Combined implementation board visible |
| `/angelcare-360-operator/support` | Open support | Support ticket list visible |
| `/angelcare-360-operator/contracts` | Open contracts | Contract table visible |
| `/angelcare-360-operator/renewals` | Open renewals | Renewal pipeline visible |
| `/angelcare-360-operator/customer-health` | Open customer health | Indicative health score and factors visible |
| `/angelcare-360-operator/service-operations` | Open service operations | Events, tasks and notes sections visible |
| `/angelcare-360-operator/service-requests` | Open service requests | Service request table visible |
| `/angelcare-360-operator/incidents` | Open incidents | Incident table visible |
| `/angelcare-360-operator/tasks` | Open tasks | Internal task table visible |
| `/angelcare-360-operator/notes` | Open notes | Internal note table visible |
| `/angelcare-360-operator/audit` | Open audit | Internal operator audit table visible |
| `/angelcare-360-operator/settings` | Open settings | Locked infrastructure panel visible |
| `/angelcare-360-operator/operator-roles` | Open roles | Role matrix visible |

## Drawer / Detail Tests

- Open any client dossier and verify all section tables render.
- Open the billing cockpit and ensure locked feature messaging is visible.
- Open the settings page and verify all external capabilities are shown as locked or configurable.

## CRUD / Mutation Tests

- Create client
- Update client
- Archive client
- Create / link tenant
- Update tenant status
- Create / update / retire plan
- Create / update package
- Create / update / cancel subscription
- Create invoice
- Issue invoice
- Cancel invoice
- Record payment
- Confirm payment
- Reject payment
- Create dunning action
- Complete dunning action
- Create feature flag
- Update feature flag
- Update usage limit
- Create onboarding task
- Complete onboarding task
- Create support ticket
- Assign support ticket
- Resolve support ticket
- Create contract
- Update contract status
- Create renewal
- Update renewal status
- Create service request
- Resolve service request
- Create incident
- Resolve incident
- Create task
- Complete task
- Create note

## Finalisation Layer Smoke Tests

- Create client from `/angelcare-360-operator/clients`
- Update client from `/angelcare-360-operator/clients/[id]`
- Archive client from `/angelcare-360-operator/clients/[id]`
- Create plan from `/angelcare-360-operator/plans`
- Retire plan from `/angelcare-360-operator/plans`
- Create package from `/angelcare-360-operator/packages`
- Create subscription from `/angelcare-360-operator/subscriptions`
- Change subscription status from `/angelcare-360-operator/subscriptions`
- Cancel subscription from `/angelcare-360-operator/subscriptions`
- Create billing account from `/angelcare-360-operator/billing/accounts`
- Update billing account from `/angelcare-360-operator/billing/accounts`
- Create invoice from `/angelcare-360-operator/billing/invoices`
- Issue invoice from `/angelcare-360-operator/billing/invoices`
- Cancel invoice from `/angelcare-360-operator/billing/invoices`
- Record payment from `/angelcare-360-operator/billing/payments`
- Confirm payment from `/angelcare-360-operator/billing/payments`
- Reject payment from `/angelcare-360-operator/billing/payments`
- Create dunning action from `/angelcare-360-operator/billing/dunning`
- Complete dunning action from `/angelcare-360-operator/billing/dunning`
- Update feature flag from `/angelcare-360-operator/features`
- Update usage limit from `/angelcare-360-operator/usage-limits`
- Create onboarding task from `/angelcare-360-operator/onboarding`
- Complete onboarding task from `/angelcare-360-operator/onboarding`
- Create support ticket from `/angelcare-360-operator/support`
- Assign support ticket from `/angelcare-360-operator/support`
- Resolve support ticket from `/angelcare-360-operator/support`
- Create contract from `/angelcare-360-operator/contracts`
- Update contract status from `/angelcare-360-operator/contracts`
- Create renewal from `/angelcare-360-operator/renewals`
- Update renewal status from `/angelcare-360-operator/renewals`
- Create service request from `/angelcare-360-operator/service-operations`
- Update service request from `/angelcare-360-operator/service-requests`
- Complete service request from `/angelcare-360-operator/service-requests`
- Create incident from `/angelcare-360-operator/incidents`
- Resolve incident from `/angelcare-360-operator/incidents`
- Create task from `/angelcare-360-operator/tasks`
- Update task from `/angelcare-360-operator/tasks`
- Complete task from `/angelcare-360-operator/tasks`
- Create note from `/angelcare-360-operator/notes`
- Verify locked buttons remain disabled on billing/settings pages

## Lifecycle Tests

- Client lifecycle: prospect, pilot, active, suspended, churned, archived
- Tenant lifecycle: not created, provisioning, active, suspended, archived
- Subscription lifecycle: trial, active, past due, suspended, cancelled, expired, archived
- Invoice lifecycle: draft, issued, partially paid, paid, overdue, cancelled, archived
- Payment lifecycle: pending, confirmed, rejected, refunded, cancelled
- Support lifecycle: new, triage, assigned, waiting client, waiting internal, resolved, closed, archived
- Renewal lifecycle: upcoming, in discussion, proposal sent, renewed, at risk, lost, cancelled

## Locked Infrastructure Tests

- Confirm online payment remains locked
- Confirm automatic PDF generation remains locked
- Confirm automatic email sending remains locked
- Confirm WhatsApp / SMS remain locked
- Confirm push notifications remain locked
- Confirm e-signature remains locked
- Confirm advanced monitoring remains locked
- Confirm advanced usage metering remains locked

## Permission Tests

- Load operator portal with a super admin or approved internal operator session
- Confirm non-operator users cannot access the portal
- Confirm internal read-only access only shows permitted views
- Confirm mutation controls are hidden or blocked when permissions are missing

## Audit Tests

- Create/update/archive operator entities
- Verify audit rows appear in the audit table
- Verify sensitive actions write audit entries

## Visual Tests

- White / icy-blue enterprise theme only
- No dark theme
- Clean status badges
- Calm disabled / locked states
- French labels only
- No dead links in sidebar
- No fake success states

## Documents / Email / Payment Gate Smoke Tests

- `/angelcare-360-operator/billing/invoices/[id]/print` opens the A4 invoice frame and prints without a fake PDF claim
- `/angelcare-360-operator/billing/payments/[id]/receipt-print` opens the A4 receipt frame and prints without a fake PDF claim
- `/angelcare-360-operator/clients/[id]/statement-print` opens the A4 client statement frame
- `/angelcare-360-command-center/documents/generated/[id]/print` opens a real generated document A4 view
- `/angelcare-360-command-center/exports/pdf-a4/[id]/print` opens a real export A4 view
- `/api/angelcare360/exports/download?exportKey=operator-clients-csv` returns a real CSV file
- `/api/angelcare360/exports/download?exportKey=operator-invoices-csv` returns a real CSV file
- `/api/angelcare360/exports/download?exportKey=operator-payments-csv` returns a real CSV file
- Invoice email action uses Email-OS from `b2b@angelcarehub.ma`
- Receipt email action uses Email-OS from `b2b@angelcarehub.ma`
- Manual reminder email action uses Email-OS from `b2b@angelcarehub.ma`
- Payment gate creation is available in operator billing and client dossier
- Payment gate manual pending / processed / waived / cancelled actions are visible
- Customer payment overlay blocks dismissal while a gate is active
- Online payment remains locked if no provider exists
- WhatsApp remains locked
- SMS remains locked
- Audit rows are written for print, export, email and payment gate actions
