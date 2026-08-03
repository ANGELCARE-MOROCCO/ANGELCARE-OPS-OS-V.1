begin;

create table if not exists public.angelcare360_customer_management_decisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  title text not null,
  detail text,
  domain text not null default 'direction' check (domain in ('direction','governance','people','admissions')),
  severity text not null default 'info' check (severity in ('critical','warning','info','healthy')),
  status text not null default 'open' check (status in ('open','in_review','approved','rejected','resolved','cancelled')),
  due_at timestamptz,
  owner_user_id uuid,
  related_entity_type text,
  related_entity_id uuid,
  created_by uuid,
  resolved_by uuid,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac360_customer_decisions_school_status_idx on public.angelcare360_customer_management_decisions(school_id,status,due_at);

create table if not exists public.angelcare360_customer_readiness_snapshots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  scope_type text not null default 'institution',
  scope_id uuid,
  title text not null,
  detail text,
  score numeric(5,2) not null default 0 check (score between 0 and 100),
  status text not null default 'watch' check (status in ('ready','watch','blocked','stale')),
  dimensions_json jsonb not null default '{}'::jsonb,
  evidence_json jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists ac360_customer_readiness_school_scope_idx on public.angelcare360_customer_readiness_snapshots(school_id,scope_type,calculated_at desc);

create table if not exists public.angelcare360_people_duplicate_cases (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  title text not null default 'Doublon potentiel',
  detail text,
  person_a_id uuid,
  person_b_id uuid,
  match_score numeric(5,2) not null default 0 check (match_score between 0 and 100),
  match_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open','in_review','resolved','dismissed')),
  resolution text check (resolution is null or resolution in ('merged','used_existing','kept_separate','false_positive')),
  resolution_reason text,
  created_by uuid,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac360_people_duplicate_school_status_idx on public.angelcare360_people_duplicate_cases(school_id,status,match_score desc);

create table if not exists public.angelcare360_admission_conversion_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete restrict,
  application_id uuid,
  title text not null default 'Conversion admission',
  detail text,
  idempotency_key text not null,
  status text not null default 'pending' check (status in ('pending','running','succeeded','partially_succeeded','failed','rolled_back')),
  created_records_json jsonb not null default '{}'::jsonb,
  reused_records_json jsonb not null default '{}'::jsonb,
  updated_records_json jsonb not null default '{}'::jsonb,
  warnings_json jsonb not null default '[]'::jsonb,
  failure_json jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(school_id,idempotency_key)
);
create index if not exists ac360_admission_conversion_school_status_idx on public.angelcare360_admission_conversion_runs(school_id,status,created_at desc);

create table if not exists public.angelcare360_customer_saved_views (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  user_id uuid not null,
  workspace_key text not null,
  plane_key text not null,
  name text not null,
  filters_json jsonb not null default '{}'::jsonb,
  columns_json jsonb not null default '[]'::jsonb,
  sort_json jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,user_id,workspace_key,plane_key,name)
);
create index if not exists ac360_customer_saved_views_lookup_idx on public.angelcare360_customer_saved_views(school_id,user_id,workspace_key,plane_key);

alter table public.angelcare360_customer_management_decisions enable row level security;
alter table public.angelcare360_customer_readiness_snapshots enable row level security;
alter table public.angelcare360_people_duplicate_cases enable row level security;
alter table public.angelcare360_admission_conversion_runs enable row level security;
alter table public.angelcare360_customer_saved_views enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'angelcare360_customer_management_decisions','angelcare360_customer_readiness_snapshots','angelcare360_people_duplicate_cases',
    'angelcare360_admission_conversion_runs','angelcare360_customer_saved_views'
  ] loop
    execute format('drop policy if exists %I on public.%I','angelcare360_service_role_all',t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')','angelcare360_service_role_all',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

commit;
