-- PACOJACO OPS clients and interventions extension
-- Additive migration only.

create extension if not exists pgcrypto;

create table if not exists public.pacojaco_clients (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_company text null,
  client_ice text null,
  client_email text null,
  client_phone text null,
  client_address text null,
  contact_name text null,
  child_name text null,
  region text null,
  zone text null,
  default_intervention_address text null,
  default_imm text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pacojaco_document_interventions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.pacojaco_documents(id) on delete cascade,
  sort_order integer not null default 0,
  title text null,
  service_type text null,
  region text null,
  zone text null,
  address text null,
  contact_name text null,
  imm text null,
  service_dates_text text null,
  schedule_text text null,
  notes text null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.pacojaco_documents
  add column if not exists client_id uuid null;

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'pacojaco_documents'
      and constraint_name = 'pacojaco_documents_client_id_fkey'
  ) then
    alter table public.pacojaco_documents
      add constraint pacojaco_documents_client_id_fkey
      foreign key (client_id) references public.pacojaco_clients(id) on delete set null;
  end if;
end
$$;

create index if not exists pacojaco_clients_client_name_idx on public.pacojaco_clients(client_name);
create index if not exists pacojaco_clients_client_company_idx on public.pacojaco_clients(client_company);
create index if not exists pacojaco_clients_client_phone_idx on public.pacojaco_clients(client_phone);
create index if not exists pacojaco_clients_client_email_idx on public.pacojaco_clients(client_email);
create index if not exists pacojaco_clients_created_at_idx on public.pacojaco_clients(created_at);
create index if not exists pacojaco_documents_client_id_idx on public.pacojaco_documents(client_id);
create index if not exists pacojaco_document_interventions_document_id_idx on public.pacojaco_document_interventions(document_id);
create index if not exists pacojaco_document_interventions_region_idx on public.pacojaco_document_interventions(region);
create index if not exists pacojaco_document_interventions_zone_idx on public.pacojaco_document_interventions(zone);

drop trigger if exists pacojaco_clients_updated_at on public.pacojaco_clients;
create trigger pacojaco_clients_updated_at
before update on public.pacojaco_clients
for each row execute function public.set_updated_at();

alter table public.pacojaco_clients enable row level security;
alter table public.pacojaco_document_interventions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'pacojaco_clients'
      and policyname = 'authenticated_all_pacojaco_clients'
  ) then
    create policy authenticated_all_pacojaco_clients
      on public.pacojaco_clients
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
      and tablename = 'pacojaco_document_interventions'
      and policyname = 'authenticated_all_pacojaco_document_interventions'
  ) then
    create policy authenticated_all_pacojaco_document_interventions
      on public.pacojaco_document_interventions
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;
