-- PACOJACO OPS documents backbone
-- Additive, safe migration for quotations and invoice management.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.pacojaco_documents (
  id uuid primary key default gen_random_uuid(),
  document_type text not null check (document_type in ('invoice', 'quote')),
  document_number text not null unique,
  status text not null default 'draft' check (status in ('draft','issued','sent','accepted','rejected','paid','partially_paid','cancelled')),
  issue_date date not null,
  due_date date null,
  validity_date date null,
  object text null,
  client_name text not null,
  client_company text null,
  client_ice text null,
  client_email text null,
  client_phone text null,
  client_address text null,
  child_name text null,
  region text null,
  zone text null,
  intervention_address text null,
  contact_name text null,
  imm text null,
  service_dates_text text null,
  schedule_text text null,
  payment_info text null,
  payment_method text null,
  payment_date date null,
  notes text null,
  conditions text null,
  subtotal numeric not null default 0,
  discount_type text null check (discount_type in ('amount','percent') or discount_type is null),
  discount_value numeric not null default 0,
  discount_total numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_total numeric not null default 0,
  advance_amount numeric not null default 0,
  remaining_amount numeric not null default 0,
  total_ttc numeric not null default 0,
  currency text not null default 'MAD',
  legal_footer text null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pacojaco_document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.pacojaco_documents(id) on delete cascade,
  sort_order integer not null default 0,
  ref text null,
  designation text not null,
  description text null,
  category text null default 'SVC',
  unit_price numeric not null default 0,
  quantity numeric not null default 1,
  unit text null,
  total numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.pacojaco_document_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.pacojaco_documents(id) on delete cascade,
  event_type text not null,
  actor_email text null,
  message text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists pacojaco_documents_document_type_idx on public.pacojaco_documents(document_type);
create index if not exists pacojaco_documents_status_idx on public.pacojaco_documents(status);
create index if not exists pacojaco_documents_issue_date_idx on public.pacojaco_documents(issue_date);
create index if not exists pacojaco_documents_client_name_idx on public.pacojaco_documents(client_name);
create index if not exists pacojaco_documents_document_number_idx on public.pacojaco_documents(document_number);
create index if not exists pacojaco_documents_created_at_idx on public.pacojaco_documents(created_at);
create index if not exists pacojaco_document_items_document_id_idx on public.pacojaco_document_items(document_id);
create index if not exists pacojaco_document_events_document_id_idx on public.pacojaco_document_events(document_id);

drop trigger if exists pacojaco_documents_updated_at on public.pacojaco_documents;
create trigger pacojaco_documents_updated_at
before update on public.pacojaco_documents
for each row execute function public.set_updated_at();

alter table public.pacojaco_documents enable row level security;
alter table public.pacojaco_document_items enable row level security;
alter table public.pacojaco_document_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pacojaco_documents'
      and policyname = 'authenticated_all_pacojaco_documents'
  ) then
    create policy authenticated_all_pacojaco_documents
      on public.pacojaco_documents
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pacojaco_document_items'
      and policyname = 'authenticated_all_pacojaco_document_items'
  ) then
    create policy authenticated_all_pacojaco_document_items
      on public.pacojaco_document_items
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pacojaco_document_events'
      and policyname = 'authenticated_all_pacojaco_document_events'
  ) then
    create policy authenticated_all_pacojaco_document_events
      on public.pacojaco_document_events
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;

