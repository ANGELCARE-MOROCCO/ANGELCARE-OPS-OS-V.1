create extension if not exists pgcrypto;

create table if not exists public.market_csv_import_jobs (
  id uuid primary key default gen_random_uuid(),
  dataset_type text not null,
  file_name text not null,
  row_count integer not null default 0,
  error_count integer not null default 0,
  sync_mode text not null default 'dry_run',
  status text not null default 'draft',
  created_by uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.market_csv_import_audit (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.market_csv_import_jobs(id) on delete cascade,
  action text not null,
  detail text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_csv_import_rollback_snapshots (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.market_csv_import_jobs(id) on delete cascade,
  dataset_type text not null,
  target_table text not null,
  snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  restored_at timestamptz
);

create index if not exists idx_market_csv_import_jobs_dataset
on public.market_csv_import_jobs(dataset_type);

create index if not exists idx_market_csv_import_jobs_status
on public.market_csv_import_jobs(status);

create index if not exists idx_market_csv_import_audit_job
on public.market_csv_import_audit(job_id);

create index if not exists idx_market_csv_import_rollback_job
on public.market_csv_import_rollback_snapshots(job_id);

alter table public.market_csv_import_jobs enable row level security;
alter table public.market_csv_import_audit enable row level security;
alter table public.market_csv_import_rollback_snapshots enable row level security;

drop policy if exists "authenticated can read csv import jobs"
on public.market_csv_import_jobs;

create policy "authenticated can read csv import jobs"
on public.market_csv_import_jobs
for select
to authenticated
using (true);

drop policy if exists "authenticated can read csv import audit"
on public.market_csv_import_audit;

create policy "authenticated can read csv import audit"
on public.market_csv_import_audit
for select
to authenticated
using (true);