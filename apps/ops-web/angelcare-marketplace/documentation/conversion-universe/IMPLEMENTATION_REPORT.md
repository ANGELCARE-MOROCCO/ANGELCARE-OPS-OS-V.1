# Implementation report

The delivery implements six specialized conversion journeys: service booking, product checkout, Academy enrollment, B2B quotation, Partner OS subscription request and Quality Check 360 assessment request.

It adds a governed visitor basket, quote basket, price snapshots, availability holds, versioned consent evidence, idempotent confirmation, canonical outcomes, exception evidence and a Conversion Command Backoffice. Catalog item CTAs now resolve to the correct journey rather than a universal quote action.

Public confirmations create only supported canonical objects. Where authenticated canonical identity is unavailable, the system creates a traceable CRM handover and explicitly reports `handover_pending`; it never fabricates booking, enrollment, payment or subscription success.

Service-booking territory choices are loaded from active Territory OS records connected to published catalog availability; no city or territory catalogue is hard-coded in the conversion UI.
