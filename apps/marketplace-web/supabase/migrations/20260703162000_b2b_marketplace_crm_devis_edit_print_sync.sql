-- ANGELCARE B2B MARKETPLACE CRM — EDIT / DELETE / A4 DEVIS PRINT SYNC
-- Safe to run after the CRM Command Center SQL.

alter table public.b2b_marketplace_quote_requests add column if not exists devis_terms text;
alter table public.b2b_marketplace_quote_requests add column if not exists commercial_notes text;
alter table public.b2b_marketplace_quote_requests add column if not exists discount_mad numeric(12,2) not null default 0;
alter table public.b2b_marketplace_quote_requests add column if not exists devis_valid_until date;

alter table public.b2b_marketplace_quote_lines add column if not exists line_order integer not null default 0;
alter table public.b2b_marketplace_quote_lines add column if not exists unit_label text;
alter table public.b2b_marketplace_quote_lines add column if not exists tax_note text;

create index if not exists b2b_marketplace_quote_lines_order_idx on public.b2b_marketplace_quote_lines(quote_request_id, line_order);

-- The CRM APIs use these existing tables for synced audit traces:
-- b2b_marketplace_quote_activity_logs
-- b2b_marketplace_quote_documents
-- b2b_marketplace_quote_proposals
