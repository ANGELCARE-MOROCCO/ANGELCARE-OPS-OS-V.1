begin;
select pg_advisory_xact_lock(84746006);

create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.hsd_service_categories') is null
     or to_regclass('public.hsd_activity_library') is null
     or to_regclass('public.hsd_price_entries') is null
     or to_regclass('public.hsd_sellables') is null
     or to_regclass('public.hsd_handoff_requests') is null
     or to_regclass('public.hsd_production_readiness_controls') is null then
    raise exception 'HomeService UMZ1–UMZ5 baseline is required before Direct Factory Rescue';
  end if;
end $$;

create table if not exists public.hsd_factory_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'angelcare-main',
  code text not null,
  mode text not null check (mode in ('single_mission','multi_mission','commercial_package')),
  universe text not null check (universe in ('b2c','b2b')),
  category_id uuid not null references public.hsd_service_categories(id) on delete restrict,
  status text not null default 'draft' check (status in ('draft','generated','published','archived','failed')),
  conditions jsonb not null default '{}'::jsonb,
  requested_scenario_count smallint not null default 3 check (requested_scenario_count between 1 and 10),
  source_hash text not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,code)
);

create table if not exists public.hsd_factory_scenarios (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'angelcare-main',
  request_id uuid not null references public.hsd_factory_requests(id) on delete cascade,
  scenario_number smallint not null check (scenario_number between 1 and 10),
  mode text not null check (mode in ('single_mission','multi_mission','commercial_package')),
  universe text not null check (universe in ('b2c','b2b')),
  status text not null default 'generated' check (status in ('generated','selected','published','rejected','archived')),
  name text not null,
  promise text not null default '',
  positioning text not null default '',
  rationale text not null default '',
  category_id uuid not null references public.hsd_service_categories(id) on delete restrict,
  category_code text not null,
  category_name text not null,
  selected_activity_ids uuid[] not null default '{}',
  selected_option_ids uuid[] not null default '{}',
  plan_snapshot jsonb not null default '[]'::jsonb,
  price_snapshot jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  provider_route text not null default 'openrouter/free' check (provider_route='openrouter/free'),
  actual_model text,
  selected_by text,
  selected_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  unique(request_id,scenario_number)
);

create table if not exists public.hsd_factory_sellables (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'angelcare-main',
  code text not null,
  universe text not null check (universe in ('b2c','b2b')),
  status text not null default 'published' check (status in ('draft','published','suspended','superseded','retired','archived')),
  commercial_name text not null,
  technical_name text not null,
  promise text not null default '',
  category_id uuid not null references public.hsd_service_categories(id) on delete restrict,
  factory_scenario_id uuid not null references public.hsd_factory_scenarios(id) on delete restrict,
  active_version integer not null default 1 check (active_version>0),
  snapshot jsonb not null,
  checksum text not null,
  starting_price_dh numeric(14,2),
  margin_percent numeric(8,2),
  readiness text not null default 'ready',
  published_by text,
  published_at timestamptz,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id,code),
  unique(tenant_id,factory_scenario_id)
);

create table if not exists public.hsd_direct_import_batches (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null default 'angelcare-main',
  import_type text not null check (import_type in ('doctrine_rules','capacity_rules','activities','features','topups','upsells','competencies','materials','risks','checklists','report_fields','pricing')),
  file_name text not null,
  checksum text not null,
  category_id uuid references public.hsd_service_categories(id) on delete restrict,
  status text not null check (status in ('applied','partially_applied','failed')),
  total_rows integer not null default 0 check(total_rows>=0),
  applied_rows integer not null default 0 check(applied_rows>=0),
  rejected_rows integer not null default 0 check(rejected_rows>=0),
  result jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now(),
  check(applied_rows+rejected_rows<=total_rows)
);

create index if not exists idx_hsd_factory_requests_category_status on public.hsd_factory_requests(tenant_id,category_id,status,created_at desc);
create index if not exists idx_hsd_factory_scenarios_request on public.hsd_factory_scenarios(tenant_id,request_id,scenario_number);
create index if not exists idx_hsd_factory_sellables_vitrine on public.hsd_factory_sellables(tenant_id,universe,status,published_at desc);
create index if not exists idx_hsd_direct_import_batches_type on public.hsd_direct_import_batches(tenant_id,import_type,created_at desc);

create or replace function public.hsd_factory_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;

drop trigger if exists trg_hsd_factory_requests_updated_at on public.hsd_factory_requests;
create trigger trg_hsd_factory_requests_updated_at before update on public.hsd_factory_requests for each row execute function public.hsd_factory_set_updated_at();
drop trigger if exists trg_hsd_factory_sellables_updated_at on public.hsd_factory_sellables;
create trigger trg_hsd_factory_sellables_updated_at before update on public.hsd_factory_sellables for each row execute function public.hsd_factory_set_updated_at();

create or replace view public.hsd_factory_vitrine_v as
select s.id,s.tenant_id,s.code,s.universe,s.status,s.commercial_name,s.technical_name,s.promise,s.category_id,c.code as category_code,c.commercial_name_fr as category_name,
       s.starting_price_dh,s.margin_percent,s.readiness,s.active_version,s.published_at,s.snapshot,s.checksum
from public.hsd_factory_sellables s
join public.hsd_service_categories c on c.id=s.category_id and c.tenant_id=s.tenant_id;

create or replace view public.hsd_factory_command_v as
select r.tenant_id,r.mode,r.universe,r.status,count(*) as request_count,
       count(sc.id) as scenario_count,count(fs.id) as published_sellable_count,max(r.created_at) as latest_request_at
from public.hsd_factory_requests r
left join public.hsd_factory_scenarios sc on sc.request_id=r.id and sc.tenant_id=r.tenant_id
left join public.hsd_factory_sellables fs on fs.factory_scenario_id=sc.id and fs.tenant_id=r.tenant_id
group by r.tenant_id,r.mode,r.universe,r.status;

alter table public.hsd_factory_requests enable row level security;
alter table public.hsd_factory_scenarios enable row level security;
alter table public.hsd_factory_sellables enable row level security;
alter table public.hsd_direct_import_batches enable row level security;

do $$
declare t text;
begin
  foreach t in array array['hsd_factory_requests','hsd_factory_scenarios','hsd_factory_sellables','hsd_direct_import_batches'] loop
    execute format('drop policy if exists %I on public.%I',t||'_tenant_select',t);
    execute format($p$create policy %I on public.%I for select to authenticated using (
      tenant_id=coalesce((nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id'),'__no_tenant__')
    )$p$,t||'_tenant_select',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

grant select on public.hsd_factory_vitrine_v to authenticated,service_role;
grant select on public.hsd_factory_command_v to authenticated,service_role;

commit;
