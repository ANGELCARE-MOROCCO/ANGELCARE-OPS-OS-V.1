# AngelCare B2B Marketplace CRM & Quote Requests Command Center

Production-grade Admin Studio extension for marketplace quote/request fulfillment.

## Added routes

- `/admin/b2b-marketplace/quote-requests`
- `/admin/b2b-marketplace/quote-requests/[id]`
- `/admin/b2b-marketplace/crm` redirect alias

## Added APIs

- `GET/POST /api/b2b-marketplace/admin/quote-requests`
- `GET/PATCH/DELETE /api/b2b-marketplace/admin/quote-requests/[id]`
- `POST /api/b2b-marketplace/admin/quote-requests/[id]/notes`
- `POST /api/b2b-marketplace/admin/quote-requests/[id]/status`
- `POST /api/b2b-marketplace/admin/quote-requests/[id]/assign`
- `POST /api/b2b-marketplace/admin/quote-requests/[id]/activity`
- `POST /api/b2b-marketplace/admin/quote-requests/[id]/convert-proposal`

## Added database layer

Migration: `supabase/migrations/20260703124500_b2b_marketplace_quote_crm_command_center.sql`

Adds CRM fields and tables:

- `b2b_marketplace_quote_notes`
- `b2b_marketplace_quote_status_history`
- `b2b_marketplace_quote_assignments`
- `b2b_marketplace_quote_activity_logs`
- `b2b_marketplace_quote_followups`
- `b2b_marketplace_quote_documents`
- `b2b_marketplace_quote_proposals`

## Operational workflow

Public quote/cart/customer requests now persist into quote request records, quote lines, CRM status history and activity logs. Admin can manage status, notes, assignment, follow-up, actions, and proposal conversion.
