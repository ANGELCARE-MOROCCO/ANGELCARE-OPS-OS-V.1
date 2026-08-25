begin;
create extension if not exists pgcrypto;

-- FINAL 10/10 CORRECTIVE — additive industrial operations persistence.
alter table if exists public.angelcare_marketplace_bulk_operation_jobs
  add column if not exists public_reference text,
  add column if not exists processed_rows integer not null default 0,
  add column if not exists failed_rows integer not null default 0,
  add column if not exists progress_percent numeric(6,2) not null default 0,
  add column if not exists idempotency_key text,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists last_error text,
  add column if not exists result_file_name text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists ac_bulk_jobs_idempotency_uq
  on public.angelcare_marketplace_bulk_operation_jobs(idempotency_key)
  where idempotency_key is not null;
create index if not exists ac_bulk_jobs_progress_idx
  on public.angelcare_marketplace_bulk_operation_jobs(status,updated_at desc);

create table if not exists public.angelcare_marketplace_bulk_operation_rows(
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.angelcare_marketplace_bulk_operation_jobs(id) on delete cascade,
  row_number integer not null,
  source_payload jsonb not null default '{}'::jsonb,
  normalized_payload jsonb not null default '{}'::jsonb,
  action text not null default 'create',
  status text not null default 'pending' check(status in('pending','processing','completed','rejected','failed','skipped')),
  object_type text,
  object_id uuid,
  result jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  attempts integer not null default 0,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id,row_number)
);
create index if not exists ac_bulk_rows_job_status_idx on public.angelcare_marketplace_bulk_operation_rows(job_id,status,row_number);

create table if not exists public.angelcare_marketplace_segment_memberships(
  segment_id uuid not null references public.angelcare_marketplace_saved_segments(id) on delete cascade,
  customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  matched_at timestamptz not null default now(),
  primary key(segment_id,customer_account_id)
);
create index if not exists ac_segment_memberships_customer_idx on public.angelcare_marketplace_segment_memberships(customer_account_id,matched_at desc);

alter table public.angelcare_marketplace_bulk_operation_rows enable row level security;
alter table public.angelcare_marketplace_segment_memberships enable row level security;
revoke all on table public.angelcare_marketplace_bulk_operation_rows from anon,authenticated;
revoke all on table public.angelcare_marketplace_segment_memberships from anon,authenticated;
grant all on table public.angelcare_marketplace_bulk_operation_rows to service_role;
grant all on table public.angelcare_marketplace_segment_memberships to service_role;


-- Scalable customer commerce metrics for saved/dynamic segment evaluation.
create or replace view public.angelcare_marketplace_customer_segment_metrics as
select
  c.id as customer_account_id,
  c.public_reference,
  c.display_name,
  c.email,
  c.phone,
  c.status,
  c.account_kind,
  c.premium_status,
  coalesce(nullif(c.metadata->>'city',''),addr.city,'') as city,
  coalesce(ord.order_count,0)::bigint as order_count,
  coalesce(pay.captured_revenue,0)::numeric(18,2) as captured_revenue,
  case when coalesce(ord.order_count,0)>0 then round(coalesce(pay.captured_revenue,0)/ord.order_count,2) else 0 end::numeric(18,2) as average_order_value,
  coalesce(w.available_balance,0)::numeric(18,2) as wallet_balance,
  ord.last_order_at,
  coalesce(sub.active_subscriptions,0)::bigint as active_subscriptions,
  coalesce(ord.booking_count,0)::bigint as booking_count,
  coalesce(ord.acquisition_sources,'{}'::text[]) as acquisition_sources,
  coalesce(ord.booking_statuses,'{}'::text[]) as booking_statuses,
  coalesce(sub.subscription_statuses,'{}'::text[]) as subscription_statuses,
  coalesce(prod.purchased_product_ids,'{}'::text[]) as purchased_product_ids,
  c.created_at,
  c.updated_at
from public.angelcare_marketplace_customer_accounts c
left join lateral (
  select a.city from public.angelcare_marketplace_customer_addresses a
  where a.customer_account_id=c.id and a.status='active'
  order by a.is_default desc,a.updated_at desc limit 1
) addr on true
left join lateral (
  select count(*)::numeric as order_count,max(j.created_at) as last_order_at,
    count(*) filter(where j.journey_type ~* 'booking|service')::numeric as booking_count,
    array_remove(array_agg(distinct j.creation_source),null) as acquisition_sources,
    array_remove(array_agg(distinct j.status) filter(where j.journey_type ~* 'booking|service'),null) as booking_statuses
  from public.angelcare_marketplace_journeys j where j.customer_account_id=c.id
) ord on true
left join lateral (
  select coalesce(sum(p.captured_amount),0)::numeric as captured_revenue
  from public.angelcare_marketplace_payment_intents p where p.customer_account_id=c.id
) pay on true
left join public.angelcare_marketplace_wallet_accounts w on w.customer_account_id=c.id
left join lateral (
  select count(*) filter(where s.status='active')::numeric as active_subscriptions,
    array_remove(array_agg(distinct s.status),null) as subscription_statuses
  from public.angelcare_marketplace_customer_subscriptions s where s.customer_account_id=c.id
) sub on true
left join lateral (
  select array_remove(array_agg(distinct ol.catalog_item_id::text),null) as purchased_product_ids
  from public.angelcare_marketplace_journeys j
  join public.angelcare_marketplace_order_lines ol on ol.journey_id=j.id and ol.status<>'cancelled'
  where j.customer_account_id=c.id
) prod on true;

revoke all on public.angelcare_marketplace_customer_segment_metrics from anon,authenticated;
grant select on public.angelcare_marketplace_customer_segment_metrics to service_role;

commit;
