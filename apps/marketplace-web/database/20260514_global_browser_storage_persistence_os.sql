-- AngelCare Global Browser Storage Persistence OS
-- Purpose: stop critical modules from being browser-only by syncing managed localStorage keys to Supabase.
-- Run this once in Supabase SQL editor before deploying the patch.

create extension if not exists pgcrypto;

create table if not exists public.app_local_storage_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null default 'angelcare-main',
  storage_key text not null,
  payload_text text not null default '',
  payload_json jsonb,
  payload_size integer not null default 0,
  checksum text,
  source text not null default 'browser',
  last_user_agent text,
  last_origin text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, storage_key)
);

create index if not exists idx_app_local_storage_snapshots_workspace on public.app_local_storage_snapshots(workspace_id);
create index if not exists idx_app_local_storage_snapshots_key on public.app_local_storage_snapshots(storage_key);
create index if not exists idx_app_local_storage_snapshots_updated on public.app_local_storage_snapshots(updated_at desc);

create or replace function public.touch_app_local_storage_snapshots_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_local_storage_snapshots_updated_at on public.app_local_storage_snapshots;
create trigger trg_app_local_storage_snapshots_updated_at
before update on public.app_local_storage_snapshots
for each row execute function public.touch_app_local_storage_snapshots_updated_at();

alter table public.app_local_storage_snapshots enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'app_local_storage_snapshots' and policyname = 'service_role_full_access_app_local_storage_snapshots'
  ) then
    create policy service_role_full_access_app_local_storage_snapshots
    on public.app_local_storage_snapshots
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
  end if;
end $$;

select 'Global browser storage persistence table installed' as result;
