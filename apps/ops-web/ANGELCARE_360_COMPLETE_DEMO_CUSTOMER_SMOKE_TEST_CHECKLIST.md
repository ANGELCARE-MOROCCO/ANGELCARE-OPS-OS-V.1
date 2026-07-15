# ANGELCARE 360 Complete Demo Customer Smoke Test Checklist

## Runner
- [ ] Use `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe.sql`
- [ ] Confirm the seed report prints rows at the end of execution
- [ ] Verify the demo client code `AC360-DEMO-PE-CASA`
- [ ] Verify the payment gate code `AC360-GATE-DEMO-PE-CASA-0001`
- [ ] Later, if needed, run `supabase/seeds/20260710_angelcare360_complete_demo_customer_schema_safe_cleanup.sql`

## Database
- [ ] `public.angelcare360_operator_payment_gates` exists
- [ ] `AC360-GATE-DEMO-PE-CASA-0001` exists
- [ ] status is `active`
- [ ] `blocking` is `true`
- [ ] `amount_due_mad` matches the overdue invoice balance due
- [ ] `provider_key` is `null`

## Operator
- [ ] Open `/angelcare-360-operator/clients`
- [ ] Find `AC360-DEMO-PE-CASA`
- [ ] Open the client dossier
- [ ] Client dossier shows the payment gate
- [ ] Billing area shows the payment gate
- [ ] Mark manual pending
- [ ] Mark manual processed
- [ ] Waive with a reason
- [ ] Cancel with a reason
- [ ] Inspect tenant record
- [ ] Inspect subscription
- [ ] Inspect invoices
- [ ] Open invoice A4 print view
- [ ] Send invoice email to a safe internal address
- [ ] Inspect feature flags
- [ ] Inspect usage limits
- [ ] Inspect onboarding tasks
- [ ] Inspect support tickets
- [ ] Inspect renewal records
- [ ] Inspect audit logs

## Customer
- [ ] Open `/angelcare-360-command-center`
- [ ] Payment overlay appears when gate is active
- [ ] Overlay blurs/dims the background
- [ ] Overlay has no close button
- [ ] Click outside does not close it
- [ ] Escape key does not close it
- [ ] Online payment remains locked
- [ ] Manual validation state is visible when status is `manual_pending`
- [ ] Overlay disappears after `manual_processed`, `waived`, or `cancelled`
- [ ] Inspect students
- [ ] Inspect classes and sections
- [ ] Inspect parents and guardians
- [ ] Inspect attendance
- [ ] Inspect finance
- [ ] Inspect transport
- [ ] Inspect library
- [ ] Inspect inventory
- [ ] Inspect messaging
- [ ] Inspect notifications
- [ ] Inspect reclamations
- [ ] Open export pages
- [ ] Open report pages
- [ ] Open document pages
- [ ] Verify A4 and CSV actions

## Audit
- [ ] gate created event exists if the audit table supports it
- [ ] manual pending event exists if tested
- [ ] manual processed event exists if tested
- [ ] waived event exists if tested
- [ ] cancelled event exists if tested

## Notes
- Use only the seeded demo tenant.
- Do not validate against production data.
- If a route is missing, confirm the corresponding feature flag or module exists in the current build branch before treating it as a seed failure.
