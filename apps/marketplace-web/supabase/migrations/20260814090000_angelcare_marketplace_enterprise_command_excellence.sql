begin;
create table if not exists public.angelcare_marketplace_document_templates (
 id uuid primary key default gen_random_uuid(), template_key text not null, name text not null, locale text not null default 'fr', page_size text not null default 'A4', orientation text not null default 'portrait', header_title text not null default 'ANGELCARE', header_subtitle text, footer_text text, legal_text text, logo_path text default '/logo.png', accent text not null default 'navy', sections jsonb not null default '[]'::jsonb, settings jsonb not null default '{}'::jsonb, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(template_key,locale)
);
create table if not exists public.angelcare_marketplace_document_exports (
 id uuid primary key default gen_random_uuid(), public_reference text, template_key text not null, object_type text not null, object_id text not null, object_reference text, file_name text, storage_path text, snapshot jsonb not null default '{}'::jsonb, generated_by uuid, generated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_bulk_operation_jobs (
 id uuid primary key default gen_random_uuid(), public_reference text, operation_type text not null, doctrine_key text, resource_type text not null, source_name text, status text not null default 'draft', dry_run jsonb not null default '{}'::jsonb, result jsonb not null default '{}'::jsonb, total_rows integer not null default 0, valid_rows integer not null default 0, rejected_rows integer not null default 0, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare_marketplace_reference_register (
 id uuid primary key default gen_random_uuid(), object_type text not null, object_id text not null, enterprise_reference text not null unique, phase_key text, parent_reference text, territory_code text, issued_at timestamptz not null default now(), metadata jsonb not null default '{}'::jsonb, unique(object_type,object_id,phase_key)
);
create index if not exists angelcare_marketplace_document_exports_object_idx on public.angelcare_marketplace_document_exports(object_type,object_id,generated_at desc);
create index if not exists angelcare_marketplace_bulk_operation_jobs_status_idx on public.angelcare_marketplace_bulk_operation_jobs(status,created_at desc);
create index if not exists angelcare_marketplace_reference_register_object_idx on public.angelcare_marketplace_reference_register(object_type,object_id);
create unique index if not exists angelcare_marketplace_reference_register_object_phase_uniq on public.angelcare_marketplace_reference_register(object_type,object_id,coalesce(phase_key,''));
alter table public.angelcare_marketplace_document_templates enable row level security;
alter table public.angelcare_marketplace_document_exports enable row level security;
alter table public.angelcare_marketplace_bulk_operation_jobs enable row level security;
alter table public.angelcare_marketplace_reference_register enable row level security;
grant all on public.angelcare_marketplace_document_templates to service_role;
grant all on public.angelcare_marketplace_document_exports to service_role;
grant all on public.angelcare_marketplace_bulk_operation_jobs to service_role;
grant all on public.angelcare_marketplace_reference_register to service_role;
insert into public.angelcare_marketplace_document_templates(template_key,name,sections) values
 ('customer_dossier','Dossier Client 360','["identity","family","commerce","finance","crm","timeline"]'::jsonb),('order_summary','Order Command Pack','["summary","lines","payment","fulfillment","timeline"]'::jsonb),('invoice','Facture ANGELCARE','["customer","lines","totals","payment"]'::jsonb),('receipt','Reçu ANGELCARE','["customer","payment","reference"]'::jsonb),('wallet_statement','Relevé AngelCare Credit','["customer","balance","ledger"]'::jsonb),('provider_mission','Mission Provider','["provider","customer","service","schedule"]'::jsonb),('b2b_proposal','Proposition B2B','["account","scope","commercial","deliverables"]'::jsonb)
on conflict(template_key,locale) do nothing;
commit;
