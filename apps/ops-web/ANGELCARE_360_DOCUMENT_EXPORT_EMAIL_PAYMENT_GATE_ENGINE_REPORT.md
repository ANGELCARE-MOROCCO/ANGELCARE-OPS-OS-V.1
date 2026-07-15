# ANGELCARE 360 Document / Export / Email / Payment Gate Engine Report

## 1. Scope

This phase adds the missing monetization infrastructure layer for AngelCare 360:
- corporate A4 document generation
- real CSV export generation
- Email-OS bridge using `b2b@angelcarehub.ma`
- controlled payment gate workflow
- customer blocking overlay for active payment gates

The customer command center and the operator backoffice remain separate products.

## 2. Discovery Findings

Static inspection found the following real infrastructure:
- `pdf-lib` is available in `package.json`
- browser-print A4 patterns already existed in the repository
- no XLSX generator dependency exists
- Email-OS send helpers already exist in `lib/email-os-core`
- `B2B_EMAIL=b2b@angelcarehub.ma` is present in the environment
- operator billing helpers already exist and expose invoices, payments and clients
- the customer shell already had a safe point to host a blocking payment overlay
- operator audit logging helpers already exist

## 3. PDF / A4 Engine Status

Status: active.

The document stack now includes:
- `lib/angelcare360/documents/pdf.ts`
- `lib/angelcare360/documents/builders.ts`
- `lib/angelcare360/documents/template-registry.ts`
- reusable A4 components under `components/angelcare360/documents/`

The engine uses `pdf-lib` to produce real PDF bytes for A4 documents.
The print pages also provide browser-printable A4 output.

## 4. Server PDF Binary Status

Status: active for the document engine created in this phase.

If the runtime supports the document routes, the output is a real PDF stream.
The system does not pretend that a PDF exists when a record is missing.

## 5. CSV Export Status

Status: active for operator clients, invoices and payments.

Implemented:
- `lib/angelcare360/exports/csv.ts`
- `lib/angelcare360/exports/export-engine.ts`
- `app/api/angelcare360/exports/download/route.ts`

CSV is generated natively and returned with the correct content type.
UTF-8 BOM is included for spreadsheet compatibility.

## 6. XLSX Status

Status: locked.

Reason:
no spreadsheet generator package exists in the repository.

Displayed reason:
`XLSX verrouillé : moteur tableur requis.`

## 7. Corporate Template Standard

The A4 document standard is:
- white / navy corporate palette
- reference code
- version and issue date
- confidentiality label
- prepared-by line
- client / school / tenant identity
- structured summary, metadata, metrics, tables and signature block

Supported template families include:
- operator invoice
- operator receipt
- operator client statement
- customer generated document
- customer export file

## 8. A4 Routes Created

Operator:
- `/angelcare-360-operator/billing/invoices/[id]/print`
- `/angelcare-360-operator/billing/payments/[id]/receipt-print`
- `/angelcare-360-operator/clients/[id]/statement-print`

Customer:
- `/angelcare-360-command-center/documents/generated/[id]/print`
- `/angelcare-360-command-center/exports/pdf-a4/[id]/print`

## 9. Email-OS Bridge Status

Status: active with `b2b@angelcarehub.ma`.

Bridge files:
- `lib/angelcare360/email/email-os-bridge.ts`
- `lib/angelcare360/operator/email.ts`
- `lib/angelcare360/email/templates.ts`

The bridge:
- forces the outbound mailbox to `b2b@angelcarehub.ma`
- uses the existing Email-OS send path
- returns structured success/error objects
- never fakes an email send
- audits email attempts

## 10. Email Templates / Actions

Supported operator email actions:
- invoice email
- receipt email
- manual reminder email
- onboarding email
- support follow-up email

Email content is French and professional.
No attachment is claimed unless a real attachment exists.
When PDF attachment is not available, the UI should point to the A4 print route instead.

## 11. WhatsApp / SMS Locked Confirmation

Status: locked.

The operator settings and lock panels keep:
- SMS locked
- WhatsApp locked

Reason:
no configured provider and no approved integration path in this phase.

## 12. Payment Gate Workflow

Status: active.

Migration:
- `supabase/migrations/20260709_angelcare360_payment_gate_document_export_engine.sql`

Table:
- `angelcare360_operator_payment_gates`

Server helpers:
- `lib/angelcare360/operator/payment-gates.ts`
- `lib/angelcare360/payment-gates/customer-gate.ts`
- `lib/angelcare360/payments/provider.ts`

Payment gate states:
- active
- online_processing
- manual_pending
- processed
- waived
- cancelled
- expired

## 13. Payment Gate APIs

Created APIs:
- `/api/angelcare360/operator/payment-gates`
- `/api/angelcare360/payment-gate/active`
- `/api/angelcare360/payment-gate/checkout`

The customer API returns the active unresolved gate only.
The checkout API does not fake a successful online payment.
If no real provider is configured, checkout remains locked.

## 14. Online Payment Provider Status

Status: locked by default.

Reason:
no real provider integration exists in this repository.

Visible operator text remains honest:
- payment gateway locked
- manual payment gate control active
- online checkout locked unless a real provider exists

## 15. Manual Admin Payment Confirmation Workflow

Operator actions available:
- create payment gate
- mark gate manual pending
- mark gate manual processed
- waive gate
- cancel gate
- expire gate

This keeps manual resolution available even when online checkout is locked.

## 16. Customer Overlay Behavior

The customer command center now checks for active unresolved payment gates through the shell provider.

When a gate is active:
- the background is blurred
- the overlay is centered and premium
- there is no close button
- click-outside and Escape do not dismiss it
- the overlay shows amount, invoice reference, due date, reason and status
- the overlay shows the online payment button only if a real provider exists
- otherwise the button is locked with a French explanation

## 17. Operator Billing Actions

Visible actions now include:
- open A4 / print invoice
- send invoice email
- create payment gate
- print receipt
- send receipt email
- send manual reminder email
- mark payment gate manual processed
- waive / cancel / expire payment gate

## 18. Audit Logging

Critical actions are audited:
- print opened/generated
- CSV export requested
- invoice email attempted / sent / failed
- receipt email attempted / sent / failed
- reminder email attempted
- payment gate created
- payment gate status changed
- manual processed / waived / cancelled / expired
- checkout attempted
- checkout locked because the provider is missing

## 19. Files Changed

Core files changed in this phase include:
- document helpers, templates and A4 components
- export helpers and CSV route
- Email-OS bridge and operator email actions
- payment gate helpers, APIs and overlay
- operator billing/client pages
- customer document/export print pages
- operator settings page

## 20. Migration Created

Created migration:
- `supabase/migrations/20260709_angelcare360_payment_gate_document_export_engine.sql`

## 21. No Fake Success Confirmation

This implementation does not fake:
- PDF generation
- CSV export
- email delivery
- payment checkout
- payment confirmation
- provider readiness
- WhatsApp
- SMS

## 22. TypeScript Result

Static TypeScript check:
- passed

## 23. Build Status

Full build:
- not run by order

## 24. Staging Status

Staging:
- not performed

## 25. Smoke-Test Checklist

Recommended smoke tests:
- open invoice A4 print
- open receipt A4 print
- open client statement A4 print
- open generated document A4 print
- open export A4 print
- download operator CSV exports
- send invoice email
- send receipt email
- send manual reminder email
- create payment gate
- mark payment gate manual pending
- mark payment gate manual processed
- waive payment gate
- cancel payment gate
- verify customer overlay blocks dismissal
- verify online checkout is locked when provider is absent
