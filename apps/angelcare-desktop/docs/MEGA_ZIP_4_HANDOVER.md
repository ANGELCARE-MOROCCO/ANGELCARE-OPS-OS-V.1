# ANGELCARE Desktop — Mega ZIP 4 Handover

## Product contract

Mega ZIP 4 converts the governed WhatsApp Web runtime into an accountable ANGELCARE business workspace. WhatsApp remains human-operated; ANGELCARE resolves the business record, normalizes the phone, prepares the message, creates a contact attempt, captures the operator-declared outcome, and coordinates internal work.

## Included adapters

- B2B Partnerships: prospects, partners and opportunities
- ANGELCARE Academy and TrainingHub
- Parents, customers and Home Service
- Admissions
- Customer Support
- Quotations, invoices and payment follow-up
- Recruitment and HR
- RefferQ
- Operations, incidents and appointments

Adapters probe documented table candidates and field aliases. They never bypass authorization. A module can also pass a safe `entity_hint` when its data lives behind a dedicated service.

## Universal entry contract

Use the reusable component:

```tsx
<WhatsAppContextAction
  contextType="b2b_prospect"
  entityId={prospect.id}
  purpose="meeting_request"
/>
```

Or dispatch the client contract:

```ts
openWhatsAppBusinessContext({
  contextType: "support_case",
  entityId: caseId,
  purpose: "support_update",
})
```

Canonical deep link:

```text
/whatsapp-os/web-session?contextType=b2b_prospect&entityId=<id>&purpose=meeting_request
```

Do not place message bodies or sensitive record data in query parameters.

## Truthful evidence boundary

The system records:

- workspace opened
- prepared message snapshot
- operator-declared sent state
- operator-declared outcome
- tasks, appointments, handoffs and escalations

It does not claim browser-derived delivery, read or reply evidence. No WhatsApp messages, contacts, cookies, IndexedDB, QR secrets or profile data are centralized.

## Database migration

Apply:

```text
apps/ops-web/supabase/migrations/20260720_whatsapp_business_context_mega_zip4.sql
```

## Optional existing-system mirroring

Set only when the destination schemas are confirmed:

```env
WHATSAPP_CONTEXT_TASK_MIRROR_TABLE=
WHATSAPP_CONTEXT_APPOINTMENT_MIRROR_TABLE=
```

Without these variables, tasks and appointments remain production-ready in their dedicated governed tables.

## Acceptance flow

1. Open a real dossier using the deep-link contract.
2. Confirm the adapter resolves name, phone, stage and source route.
3. Review phone normalization.
4. Edit and save the prepared message.
5. Open WhatsApp and send manually.
6. Record the outcome and next action.
7. Create a note, task or appointment.
8. Review the context timeline and analytics.
9. Test handoff and escalation permissions.
10. Confirm access is still blocked when Mega ZIP 3 authorization is revoked.

## Reusable source-module integration

- `WhatsAppContextAction` opens the governed business context from an eligible record.
- `WhatsAppEntityTimeline` shows declared attempts, outcomes, tasks, handoffs and escalations on the source dossier.
- Secure contextual documents are opened only through the governed redirect API, which rechecks authorization and expiry.
- Handoffs use the authorized workspace catalogue rather than technical workspace IDs.
