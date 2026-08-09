-- ANGELCARE B2B MARKETPLACE CRM — RELIABILITY LOCKDOWN
-- Safe after previous marketplace + CRM migrations.

alter table public.b2b_marketplace_quote_lines add column if not exists unit_price_mad numeric(12,2);
alter table public.b2b_marketplace_quote_lines add column if not exists total_mad numeric(12,2);
alter table public.b2b_marketplace_quote_lines add column if not exists description text;
alter table public.b2b_marketplace_quote_lines add column if not exists line_order integer not null default 0;

update public.b2b_marketplace_quote_lines
set unit_price_mad = coalesce(unit_price_mad, estimated_unit_price_mad, 0)
where unit_price_mad is null;

update public.b2b_marketplace_quote_lines
set total_mad = coalesce(total_mad, quantity * coalesce(unit_price_mad, estimated_unit_price_mad, 0), 0)
where total_mad is null;

update public.b2b_marketplace_quote_requests qr
set estimated_total_mad = coalesce(t.total_mad, 0), updated_at = now()
from (
  select quote_request_id, sum(coalesce(total_mad, quantity * coalesce(unit_price_mad, estimated_unit_price_mad, 0), 0)) as total_mad
  from public.b2b_marketplace_quote_lines
  group by quote_request_id
) t
where qr.id = t.quote_request_id;

create index if not exists b2b_marketplace_quote_lines_order_idx on public.b2b_marketplace_quote_lines(quote_request_id, line_order, created_at);
create index if not exists b2b_marketplace_quote_requests_status_idx on public.b2b_marketplace_quote_requests(status);
create index if not exists b2b_marketplace_quote_requests_created_idx on public.b2b_marketplace_quote_requests(created_at desc);
