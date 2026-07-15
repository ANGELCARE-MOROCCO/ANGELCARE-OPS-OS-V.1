create extension if not exists "pgcrypto";

create table if not exists public.carelink_ops_audit_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text null,
  action text not null,
  actor_name text null,
  source text not null default 'carelink_ops',
  severity text not null default 'info',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.carelink_ops_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  category text not null default 'general',
  value jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.carelink_ops_service_configs (
  id uuid primary key default gen_random_uuid(),
  service_type text not null,
  service_family text not null default 'general_service',
  version integer not null default 1,
  status text not null default 'active',
  config jsonb not null default '{}'::jsonb,
  updated_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists carelink_ops_audit_events_created_idx on public.carelink_ops_audit_events (created_at desc);
create index if not exists carelink_ops_audit_events_entity_idx on public.carelink_ops_audit_events (entity_type, entity_id, created_at desc);
create index if not exists carelink_ops_settings_category_idx on public.carelink_ops_settings (category, status);
create index if not exists carelink_ops_service_configs_service_idx on public.carelink_ops_service_configs (service_type, version desc);

alter table public.carelink_ops_audit_events enable row level security;
alter table public.carelink_ops_settings enable row level security;
alter table public.carelink_ops_service_configs enable row level security;

drop policy if exists authenticated_all_carelink_ops_audit_events on public.carelink_ops_audit_events;
create policy authenticated_all_carelink_ops_audit_events on public.carelink_ops_audit_events for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_ops_settings on public.carelink_ops_settings;
create policy authenticated_all_carelink_ops_settings on public.carelink_ops_settings for all to authenticated using (true) with check (true);

drop policy if exists authenticated_all_carelink_ops_service_configs on public.carelink_ops_service_configs;
create policy authenticated_all_carelink_ops_service_configs on public.carelink_ops_service_configs for all to authenticated using (true) with check (true);

-- CareLink mission dossier distribution compatibility:
-- session-level caregiver assignment for generated parameter days.
alter table public.mission_parameter_days
add column if not exists caregiver_id bigint null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'caregivers'
      and column_name = 'id'
      and data_type in ('bigint', 'integer')
  ) then
    begin
      alter table public.mission_parameter_days
      add constraint mission_parameter_days_caregiver_id_fkey
      foreign key (caregiver_id) references public.caregivers(id)
      on delete set null;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

notify pgrst, 'reload schema';

-- CareLink mission dossier distribution compatibility:
-- full session-level persistence for recurring sub-missions.
alter table public.mission_parameter_days
add column if not exists caregiver_id bigint null;

alter table public.mission_parameter_days
add column if not exists sub_mission_id bigint null;

alter table public.mission_parameter_days
add column if not exists parent_mission_id bigint null;

alter table public.mission_parameter_days
add column if not exists mission_group_id uuid null;

alter table public.mission_parameter_days
add column if not exists occurrence_index integer null;

alter table public.mission_parameter_days
add column if not exists status text null default 'planned';

alter table public.mission_parameter_days
add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  begin
    alter table public.mission_parameter_days
    add constraint mission_parameter_days_caregiver_id_fkey
    foreign key (caregiver_id) references public.caregivers(id)
    on delete set null;
  exception
    when duplicate_object then null;
    when undefined_table then null;
    when undefined_column then null;
    when datatype_mismatch then null;
  end;

  begin
    alter table public.mission_parameter_days
    add constraint mission_parameter_days_sub_mission_id_fkey
    foreign key (sub_mission_id) references public.missions(id)
    on delete cascade;
  exception
    when duplicate_object then null;
    when undefined_table then null;
    when undefined_column then null;
    when datatype_mismatch then null;
  end;

  begin
    alter table public.mission_parameter_days
    add constraint mission_parameter_days_parent_mission_id_fkey
    foreign key (parent_mission_id) references public.missions(id)
    on delete cascade;
  exception
    when duplicate_object then null;
    when undefined_table then null;
    when undefined_column then null;
    when datatype_mismatch then null;
  end;
end $$;

create index if not exists mission_parameter_days_sub_mission_id_idx
on public.mission_parameter_days(sub_mission_id);

create index if not exists mission_parameter_days_parent_mission_id_idx
on public.mission_parameter_days(parent_mission_id);

create index if not exists mission_parameter_days_caregiver_id_idx
on public.mission_parameter_days(caregiver_id);

create index if not exists mission_parameter_days_group_occurrence_idx
on public.mission_parameter_days(mission_group_id, occurrence_index);

notify pgrst, 'reload schema';
