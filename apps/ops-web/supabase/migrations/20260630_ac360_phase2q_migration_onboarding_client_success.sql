-- AngelCare 360 Phase 2Q - Data Migration, Onboarding, Setup & Client Success Runtime
-- Ref: AC360-PH2Q-MIGRATION-ONBOARDING-CLIENT-SUCCESS-2026-06-30
-- Scope: backend/system-only migration factory, onboarding delivery, setup checklists and client success runtime.
-- Strict rule: no onboarding/client-success/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2P school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Data migration, onboarding, setup and client success tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_migration_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  project_key text not null,
  label text not null,
  source_system text,
  import_scope text not null default 'full_school_setup',
  status text not null default 'planned',
  priority text not null default 'normal',
  total_records integer not null default 0,
  processed_records integer not null default 0,
  successful_records integer not null default 0,
  failed_records integer not null default 0,
  duplicate_records integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, project_key),
  check (status in ('planned','in_progress','blocked','completed','cancelled','archived')),
  check (priority in ('low','normal','high','urgent'))
);

create table if not exists public.ac360_school_migration_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  migration_project_id uuid references public.ac360_school_migration_projects(id) on delete cascade,
  source_key text not null,
  source_type text not null default 'excel',
  label text not null,
  file_document_id uuid,
  file_name text,
  mime_type text,
  storage_path text,
  mapping_json jsonb not null default '{}'::jsonb,
  validation_json jsonb not null default '{}'::jsonb,
  status text not null default 'uploaded',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, source_key),
  check (source_type in ('excel','csv','pdf','legacy_software','manual','api','other')),
  check (status in ('uploaded','mapped','validated','processing','completed','failed','archived'))
);

create table if not exists public.ac360_school_migration_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  migration_project_id uuid references public.ac360_school_migration_projects(id) on delete cascade,
  migration_source_id uuid references public.ac360_school_migration_sources(id) on delete set null,
  batch_key text not null,
  entity_type text not null default 'students',
  status text not null default 'queued',
  total_records integer not null default 0,
  processed_records integer not null default 0,
  successful_records integer not null default 0,
  failed_records integer not null default 0,
  duplicate_records integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, batch_key),
  check (entity_type in ('students','guardians','staff','classes','attendance','finance','documents','admissions','mixed','custom')),
  check (status in ('queued','processing','completed','completed_with_errors','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_migration_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  migration_batch_id uuid not null references public.ac360_school_migration_batches(id) on delete cascade,
  source_row_number integer,
  source_identifier text,
  target_entity_type text,
  target_entity_id uuid,
  status text not null default 'pending',
  raw_json jsonb not null default '{}'::jsonb,
  mapped_json jsonb not null default '{}'::jsonb,
  error_json jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('pending','processed','failed','duplicate','skipped','needs_review'))
);

create table if not exists public.ac360_school_data_validation_findings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  migration_project_id uuid references public.ac360_school_migration_projects(id) on delete cascade,
  migration_batch_id uuid references public.ac360_school_migration_batches(id) on delete cascade,
  migration_record_id uuid references public.ac360_school_migration_records(id) on delete cascade,
  finding_key text,
  severity text not null default 'warning',
  entity_type text,
  field_key text,
  message text not null,
  status text not null default 'open',
  resolution_note text,
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (severity in ('info','warning','error','critical')),
  check (status in ('open','acknowledged','resolved','ignored'))
);

create table if not exists public.ac360_school_onboarding_projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  migration_project_id uuid references public.ac360_school_migration_projects(id) on delete set null,
  onboarding_key text not null,
  label text not null,
  status text not null default 'planned',
  stage text not null default 'kickoff',
  kickoff_date date,
  target_go_live_date date,
  go_live_date date,
  progress_percent numeric(5,2) not null default 0,
  owner_name text,
  owner_email text,
  assigned_success_manager uuid,
  risk_level text not null default 'normal',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, onboarding_key),
  check (status in ('planned','active','blocked','ready_for_go_live','live','completed','cancelled','archived')),
  check (stage in ('kickoff','data_collection','migration','configuration','training','pilot','go_live','stabilization','completed')),
  check (risk_level in ('low','normal','high','critical'))
);

create table if not exists public.ac360_school_onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  onboarding_project_id uuid not null references public.ac360_school_onboarding_projects(id) on delete cascade,
  step_key text not null,
  label text not null,
  step_group text not null default 'setup',
  status text not null default 'todo',
  sort_order integer not null default 100,
  required boolean not null default true,
  due_date date,
  completed_at timestamptz,
  completed_by uuid,
  blocker_reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(onboarding_project_id, step_key),
  check (status in ('todo','in_progress','blocked','completed','skipped','cancelled'))
);

create table if not exists public.ac360_school_setup_checklists (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  onboarding_project_id uuid references public.ac360_school_onboarding_projects(id) on delete cascade,
  checklist_key text not null,
  label text not null,
  checklist_type text not null default 'implementation',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, checklist_key),
  check (checklist_type in ('implementation','data','training','finance','communication','go_live','success','custom')),
  check (status in ('draft','active','completed','archived'))
);

create table if not exists public.ac360_school_setup_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  checklist_id uuid not null references public.ac360_school_setup_checklists(id) on delete cascade,
  item_key text not null,
  label text not null,
  status text not null default 'todo',
  sort_order integer not null default 100,
  required boolean not null default true,
  completed_at timestamptz,
  completed_by uuid,
  evidence_document_id uuid,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(checklist_id, item_key),
  check (status in ('todo','in_progress','blocked','completed','skipped','cancelled'))
);

create table if not exists public.ac360_school_client_success_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  success_tier text not null default 'standard',
  lifecycle_stage text not null default 'onboarding',
  health_status text not null default 'unknown',
  health_score numeric(5,2) not null default 0,
  assigned_success_manager uuid,
  last_touchpoint_at timestamptz,
  next_review_date date,
  renewal_risk_level text not null default 'unknown',
  upsell_signal_level text not null default 'none',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id),
  check (success_tier in ('standard','priority','serenite_basic','serenite_plus','serenite_premium','enterprise')),
  check (lifecycle_stage in ('onboarding','adoption','stable','growth','risk','renewal','archived')),
  check (health_status in ('unknown','green','yellow','red')),
  check (renewal_risk_level in ('unknown','low','medium','high','critical')),
  check (upsell_signal_level in ('none','low','medium','high'))
);

create table if not exists public.ac360_school_success_touchpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  success_account_id uuid references public.ac360_school_client_success_accounts(id) on delete cascade,
  touchpoint_type text not null default 'check_in',
  channel text not null default 'internal',
  summary text,
  outcome text not null default 'recorded',
  next_action text,
  next_action_due_at timestamptz,
  sentiment text not null default 'neutral',
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (channel in ('internal','phone','whatsapp','email','meeting','onsite','video','system')),
  check (sentiment in ('positive','neutral','negative','critical'))
);

create table if not exists public.ac360_school_success_health_scores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  success_account_id uuid references public.ac360_school_client_success_accounts(id) on delete cascade,
  score_date date not null default current_date,
  health_score numeric(5,2) not null default 0,
  health_status text not null default 'unknown',
  adoption_score numeric(5,2) not null default 0,
  payment_score numeric(5,2) not null default 0,
  support_score numeric(5,2) not null default 0,
  usage_score numeric(5,2) not null default 0,
  risk_score numeric(5,2) not null default 0,
  drivers_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, score_date),
  check (health_status in ('unknown','green','yellow','red'))
);

create table if not exists public.ac360_school_success_playbooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.ac360_organizations(id) on delete cascade,
  playbook_key text not null,
  label text not null,
  playbook_type text not null default 'onboarding',
  trigger_json jsonb not null default '{}'::jsonb,
  steps_json jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(playbook_key),
  check (playbook_type in ('onboarding','adoption','risk_recovery','upsell','renewal','support','custom')),
  check (status in ('draft','active','paused','archived'))
);

create table if not exists public.ac360_school_onboarding_success_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  migration_projects_total integer not null default 0,
  migration_projects_completed integer not null default 0,
  migration_records_total integer not null default 0,
  migration_records_failed integer not null default 0,
  onboarding_projects_active integer not null default 0,
  onboarding_projects_live integer not null default 0,
  setup_items_total integer not null default 0,
  setup_items_completed integer not null default 0,
  open_validation_findings integer not null default 0,
  open_success_alerts integer not null default 0,
  average_health_score numeric(5,2) not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

create table if not exists public.ac360_school_onboarding_success_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  alert_type text not null default 'onboarding',
  severity text not null default 'info',
  title text not null,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  status text not null default 'open',
  emitted_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('migration','onboarding','setup','client_success','risk','billing','training','custom')),
  check (severity in ('info','warning','critical')),
  check (status in ('open','acknowledged','resolved','dismissed'))
);

-- -----------------------------------------------------------------------------
-- 2. Runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_onboarding_success_dashboard(p_org_id uuid,p_as_of_date date default current_date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_snapshot public.ac360_school_onboarding_success_snapshots%rowtype; v_alerts jsonb; v_projects jsonb;
begin
  insert into public.ac360_school_onboarding_success_snapshots(
    org_id,snapshot_date,migration_projects_total,migration_projects_completed,migration_records_total,migration_records_failed,onboarding_projects_active,onboarding_projects_live,setup_items_total,setup_items_completed,open_validation_findings,open_success_alerts,average_health_score,metadata_json
  )
  values(
    p_org_id,p_as_of_date,
    (select count(*) from public.ac360_school_migration_projects where org_id=p_org_id),
    (select count(*) from public.ac360_school_migration_projects where org_id=p_org_id and status='completed'),
    (select count(*) from public.ac360_school_migration_records where org_id=p_org_id),
    (select count(*) from public.ac360_school_migration_records where org_id=p_org_id and status='failed'),
    (select count(*) from public.ac360_school_onboarding_projects where org_id=p_org_id and status in ('planned','active','blocked','ready_for_go_live')),
    (select count(*) from public.ac360_school_onboarding_projects where org_id=p_org_id and status in ('live','completed')),
    (select count(*) from public.ac360_school_setup_items where org_id=p_org_id),
    (select count(*) from public.ac360_school_setup_items where org_id=p_org_id and status='completed'),
    (select count(*) from public.ac360_school_data_validation_findings where org_id=p_org_id and status in ('open','acknowledged')),
    (select count(*) from public.ac360_school_onboarding_success_alerts where org_id=p_org_id and status in ('open','acknowledged')),
    coalesce((select avg(health_score) from public.ac360_school_success_health_scores where org_id=p_org_id and score_date>=p_as_of_date-30),0),
    '{"phase":"phase_2q"}'::jsonb
  )
  on conflict(org_id,snapshot_date) do update set
    migration_projects_total=excluded.migration_projects_total,
    migration_projects_completed=excluded.migration_projects_completed,
    migration_records_total=excluded.migration_records_total,
    migration_records_failed=excluded.migration_records_failed,
    onboarding_projects_active=excluded.onboarding_projects_active,
    onboarding_projects_live=excluded.onboarding_projects_live,
    setup_items_total=excluded.setup_items_total,
    setup_items_completed=excluded.setup_items_completed,
    open_validation_findings=excluded.open_validation_findings,
    open_success_alerts=excluded.open_success_alerts,
    average_health_score=excluded.average_health_score,
    metadata_json=public.ac360_school_onboarding_success_snapshots.metadata_json||excluded.metadata_json,
    created_at=now()
  returning * into v_snapshot;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.emitted_at desc),'[]'::jsonb) into v_alerts
  from (select * from public.ac360_school_onboarding_success_alerts where org_id=p_org_id and status in ('open','acknowledged') order by emitted_at desc limit 20) a;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.updated_at desc),'[]'::jsonb) into v_projects
  from (select id,onboarding_key,label,status,stage,progress_percent,risk_level,target_go_live_date,updated_at from public.ac360_school_onboarding_projects where org_id=p_org_id order by updated_at desc limit 15) p;

  return jsonb_build_object('ok',true,'snapshot',to_jsonb(v_snapshot),'alerts',v_alerts,'projects',v_projects);
end $$;

create or replace function public.ac360_school_create_migration_project(p_org_id uuid,p_project_key text default null,p_label text default null,p_source_system text default null,p_import_scope text default 'full_school_setup',p_priority text default 'normal',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.ac360_school_migration_projects%rowtype; v_key text;
begin
  v_key := coalesce(nullif(p_project_key,''),'migration-'||to_char(now(),'YYYYMMDDHH24MISS'));
  insert into public.ac360_school_migration_projects(org_id,project_key,label,source_system,import_scope,priority,status,created_by,metadata_json)
  values(p_org_id,v_key,coalesce(nullif(p_label,''),'Migration project'),p_source_system,coalesce(nullif(p_import_scope,''),'full_school_setup'),coalesce(nullif(p_priority,''),'normal'),'planned',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(org_id,project_key) do update set label=excluded.label,source_system=excluded.source_system,import_scope=excluded.import_scope,priority=excluded.priority,metadata_json=public.ac360_school_migration_projects.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_project;
  return jsonb_build_object('ok',true,'migration_project',to_jsonb(v_project));
end $$;

create or replace function public.ac360_school_upsert_migration_source(p_org_id uuid,p_source_id uuid default null,p_migration_project_id uuid default null,p_source_key text default null,p_source_type text default 'excel',p_label text default null,p_file_name text default null,p_storage_path text default null,p_mapping_json jsonb default '{}'::jsonb,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_source public.ac360_school_migration_sources%rowtype; v_key text;
begin
  v_key := coalesce(nullif(p_source_key,''),'source-'||to_char(now(),'YYYYMMDDHH24MISS'));
  if p_source_id is null then
    insert into public.ac360_school_migration_sources(org_id,migration_project_id,source_key,source_type,label,file_name,storage_path,mapping_json,status,created_by,metadata_json)
    values(p_org_id,p_migration_project_id,v_key,coalesce(nullif(p_source_type,''),'excel'),coalesce(nullif(p_label,''),'Migration source'),p_file_name,p_storage_path,coalesce(p_mapping_json,'{}'::jsonb),'uploaded',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
    on conflict(org_id,source_key) do update set migration_project_id=excluded.migration_project_id,source_type=excluded.source_type,label=excluded.label,file_name=excluded.file_name,storage_path=excluded.storage_path,mapping_json=excluded.mapping_json,metadata_json=public.ac360_school_migration_sources.metadata_json||excluded.metadata_json,updated_at=now()
    returning * into v_source;
  else
    update public.ac360_school_migration_sources set migration_project_id=coalesce(p_migration_project_id,migration_project_id),source_type=coalesce(nullif(p_source_type,''),source_type),label=coalesce(nullif(p_label,''),label),file_name=coalesce(p_file_name,file_name),storage_path=coalesce(p_storage_path,storage_path),mapping_json=coalesce(p_mapping_json,mapping_json),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_source_id and org_id=p_org_id returning * into v_source;
  end if;
  return jsonb_build_object('ok',v_source.id is not null,'migration_source',to_jsonb(v_source));
end $$;

create or replace function public.ac360_school_create_migration_batch(p_org_id uuid,p_migration_project_id uuid default null,p_migration_source_id uuid default null,p_batch_key text default null,p_entity_type text default 'students',p_total_records integer default 0,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_batch public.ac360_school_migration_batches%rowtype; v_key text;
begin
  v_key := coalesce(nullif(p_batch_key,''),'batch-'||to_char(now(),'YYYYMMDDHH24MISS'));
  insert into public.ac360_school_migration_batches(org_id,migration_project_id,migration_source_id,batch_key,entity_type,total_records,status,created_by,metadata_json)
  values(p_org_id,p_migration_project_id,p_migration_source_id,v_key,coalesce(nullif(p_entity_type,''),'students'),greatest(coalesce(p_total_records,0),0),'queued',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(org_id,batch_key) do update set migration_project_id=excluded.migration_project_id,migration_source_id=excluded.migration_source_id,entity_type=excluded.entity_type,total_records=excluded.total_records,metadata_json=public.ac360_school_migration_batches.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_batch;
  return jsonb_build_object('ok',true,'migration_batch',to_jsonb(v_batch));
end $$;

create or replace function public.ac360_school_process_migration_record(p_org_id uuid,p_migration_batch_id uuid,p_source_row_number integer default null,p_source_identifier text default null,p_target_entity_type text default null,p_target_entity_id uuid default null,p_status text default 'processed',p_raw_json jsonb default '{}'::jsonb,p_mapped_json jsonb default '{}'::jsonb,p_error_json jsonb default '{}'::jsonb,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_migration_records%rowtype;
begin
  insert into public.ac360_school_migration_records(org_id,migration_batch_id,source_row_number,source_identifier,target_entity_type,target_entity_id,status,raw_json,mapped_json,error_json,processed_at,metadata_json)
  values(p_org_id,p_migration_batch_id,p_source_row_number,p_source_identifier,p_target_entity_type,p_target_entity_id,coalesce(nullif(p_status,''),'processed'),coalesce(p_raw_json,'{}'::jsonb),coalesce(p_mapped_json,'{}'::jsonb),coalesce(p_error_json,'{}'::jsonb),now(),coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  returning * into v_record;
  update public.ac360_school_migration_batches set processed_records=processed_records+1,successful_records=successful_records+case when v_record.status='processed' then 1 else 0 end,failed_records=failed_records+case when v_record.status='failed' then 1 else 0 end,duplicate_records=duplicate_records+case when v_record.status='duplicate' then 1 else 0 end,status=case when status='queued' then 'processing' else status end,started_at=coalesce(started_at,now()),updated_at=now() where id=p_migration_batch_id and org_id=p_org_id;
  return jsonb_build_object('ok',true,'migration_record',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_record_data_validation_finding(p_org_id uuid,p_migration_project_id uuid default null,p_migration_batch_id uuid default null,p_migration_record_id uuid default null,p_finding_key text default null,p_severity text default 'warning',p_entity_type text default null,p_field_key text default null,p_message text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_finding public.ac360_school_data_validation_findings%rowtype;
begin
  insert into public.ac360_school_data_validation_findings(org_id,migration_project_id,migration_batch_id,migration_record_id,finding_key,severity,entity_type,field_key,message,status,metadata_json)
  values(p_org_id,p_migration_project_id,p_migration_batch_id,p_migration_record_id,p_finding_key,coalesce(nullif(p_severity,''),'warning'),p_entity_type,p_field_key,coalesce(nullif(p_message,''),'Data validation finding recorded.'),'open',coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  returning * into v_finding;
  return jsonb_build_object('ok',true,'finding',to_jsonb(v_finding));
end $$;

create or replace function public.ac360_school_open_onboarding_project(p_org_id uuid,p_onboarding_key text default null,p_label text default null,p_migration_project_id uuid default null,p_target_go_live_date date default null,p_owner_name text default null,p_owner_email text default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_project public.ac360_school_onboarding_projects%rowtype; v_key text;
begin
  v_key := coalesce(nullif(p_onboarding_key,''),'onboarding-'||to_char(now(),'YYYYMMDDHH24MISS'));
  insert into public.ac360_school_onboarding_projects(org_id,migration_project_id,onboarding_key,label,status,stage,kickoff_date,target_go_live_date,owner_name,owner_email,created_by,metadata_json)
  values(p_org_id,p_migration_project_id,v_key,coalesce(nullif(p_label,''),'School onboarding project'),'active','kickoff',current_date,p_target_go_live_date,p_owner_name,p_owner_email,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(org_id,onboarding_key) do update set migration_project_id=excluded.migration_project_id,label=excluded.label,target_go_live_date=excluded.target_go_live_date,owner_name=excluded.owner_name,owner_email=excluded.owner_email,status='active',metadata_json=public.ac360_school_onboarding_projects.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_project;

  insert into public.ac360_school_onboarding_steps(org_id,onboarding_project_id,step_key,label,step_group,sort_order,metadata_json) values
  (p_org_id,v_project.id,'kickoff_completed','Kickoff completed','kickoff',10,'{"seed":"default"}'::jsonb),
  (p_org_id,v_project.id,'data_collected','Data collected','data',20,'{"seed":"default"}'::jsonb),
  (p_org_id,v_project.id,'migration_validated','Migration validated','migration',30,'{"seed":"default"}'::jsonb),
  (p_org_id,v_project.id,'configuration_completed','Configuration completed','setup',40,'{"seed":"default"}'::jsonb),
  (p_org_id,v_project.id,'staff_trained','Staff trained','training',50,'{"seed":"default"}'::jsonb),
  (p_org_id,v_project.id,'go_live_confirmed','Go-live confirmed','go_live',60,'{"seed":"default"}'::jsonb)
  on conflict(onboarding_project_id,step_key) do nothing;

  return jsonb_build_object('ok',true,'onboarding_project',to_jsonb(v_project));
end $$;

create or replace function public.ac360_school_update_onboarding_step(p_org_id uuid,p_step_id uuid,p_status text default 'completed',p_actor_app_user_id uuid default null,p_blocker_reason text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_step public.ac360_school_onboarding_steps%rowtype; v_project_id uuid; v_progress numeric;
begin
  update public.ac360_school_onboarding_steps set status=coalesce(nullif(p_status,''),status),blocker_reason=p_blocker_reason,completed_at=case when coalesce(nullif(p_status,''),status)='completed' then now() else completed_at end,completed_by=case when coalesce(nullif(p_status,''),status)='completed' then p_actor_app_user_id else completed_by end,metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_step_id and org_id=p_org_id returning * into v_step;
  v_project_id := v_step.onboarding_project_id;
  select case when count(*)=0 then 0 else round((count(*) filter(where status='completed'))::numeric*100/count(*),2) end into v_progress from public.ac360_school_onboarding_steps where onboarding_project_id=v_project_id;
  update public.ac360_school_onboarding_projects set progress_percent=coalesce(v_progress,0),status=case when coalesce(v_progress,0)>=100 then 'completed' else status end,stage=case when coalesce(v_progress,0)>=100 then 'completed' else stage end,updated_at=now() where id=v_project_id and org_id=p_org_id;
  return jsonb_build_object('ok',v_step.id is not null,'onboarding_step',to_jsonb(v_step),'progress_percent',v_progress);
end $$;

create or replace function public.ac360_school_upsert_setup_checklist(p_org_id uuid,p_checklist_id uuid default null,p_onboarding_project_id uuid default null,p_checklist_key text default null,p_label text default null,p_checklist_type text default 'implementation',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_checklist public.ac360_school_setup_checklists%rowtype; v_key text;
begin
  v_key := coalesce(nullif(p_checklist_key,''),'checklist-'||to_char(now(),'YYYYMMDDHH24MISS'));
  if p_checklist_id is null then
    insert into public.ac360_school_setup_checklists(org_id,onboarding_project_id,checklist_key,label,checklist_type,status,created_by,metadata_json)
    values(p_org_id,p_onboarding_project_id,v_key,coalesce(nullif(p_label,''),'Setup checklist'),coalesce(nullif(p_checklist_type,''),'implementation'),'active',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
    on conflict(org_id,checklist_key) do update set onboarding_project_id=excluded.onboarding_project_id,label=excluded.label,checklist_type=excluded.checklist_type,status=excluded.status,metadata_json=public.ac360_school_setup_checklists.metadata_json||excluded.metadata_json,updated_at=now()
    returning * into v_checklist;
  else
    update public.ac360_school_setup_checklists set onboarding_project_id=coalesce(p_onboarding_project_id,onboarding_project_id),label=coalesce(nullif(p_label,''),label),checklist_type=coalesce(nullif(p_checklist_type,''),checklist_type),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_checklist_id and org_id=p_org_id returning * into v_checklist;
  end if;
  return jsonb_build_object('ok',v_checklist.id is not null,'setup_checklist',to_jsonb(v_checklist));
end $$;

create or replace function public.ac360_school_complete_setup_item(p_org_id uuid,p_checklist_id uuid,p_item_key text,p_label text default null,p_status text default 'completed',p_actor_app_user_id uuid default null,p_notes text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_item public.ac360_school_setup_items%rowtype;
begin
  insert into public.ac360_school_setup_items(org_id,checklist_id,item_key,label,status,completed_at,completed_by,notes,metadata_json)
  values(p_org_id,p_checklist_id,p_item_key,coalesce(nullif(p_label,''),p_item_key),coalesce(nullif(p_status,''),'completed'),case when coalesce(nullif(p_status,''),'completed')='completed' then now() else null end,p_actor_app_user_id,p_notes,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(checklist_id,item_key) do update set label=excluded.label,status=excluded.status,completed_at=excluded.completed_at,completed_by=excluded.completed_by,notes=excluded.notes,metadata_json=public.ac360_school_setup_items.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_item;
  return jsonb_build_object('ok',true,'setup_item',to_jsonb(v_item));
end $$;

create or replace function public.ac360_school_upsert_success_account(p_org_id uuid,p_success_tier text default 'standard',p_lifecycle_stage text default 'onboarding',p_health_status text default 'unknown',p_assigned_success_manager uuid default null,p_next_review_date date default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_account public.ac360_school_client_success_accounts%rowtype;
begin
  insert into public.ac360_school_client_success_accounts(org_id,success_tier,lifecycle_stage,health_status,assigned_success_manager,next_review_date,created_by,metadata_json)
  values(p_org_id,coalesce(nullif(p_success_tier,''),'standard'),coalesce(nullif(p_lifecycle_stage,''),'onboarding'),coalesce(nullif(p_health_status,''),'unknown'),p_assigned_success_manager,p_next_review_date,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(org_id) do update set success_tier=excluded.success_tier,lifecycle_stage=excluded.lifecycle_stage,health_status=excluded.health_status,assigned_success_manager=excluded.assigned_success_manager,next_review_date=excluded.next_review_date,metadata_json=public.ac360_school_client_success_accounts.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_account;
  return jsonb_build_object('ok',true,'success_account',to_jsonb(v_account));
end $$;

create or replace function public.ac360_school_record_success_touchpoint(p_org_id uuid,p_touchpoint_type text default 'check_in',p_channel text default 'internal',p_summary text default null,p_outcome text default 'recorded',p_next_action text default null,p_next_action_due_at timestamptz default null,p_sentiment text default 'neutral',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_account public.ac360_school_client_success_accounts%rowtype; v_touchpoint public.ac360_school_success_touchpoints%rowtype;
begin
  insert into public.ac360_school_client_success_accounts(org_id) values(p_org_id) on conflict(org_id) do update set updated_at=now() returning * into v_account;
  insert into public.ac360_school_success_touchpoints(org_id,success_account_id,touchpoint_type,channel,summary,outcome,next_action,next_action_due_at,sentiment,actor_app_user_id,metadata_json)
  values(p_org_id,v_account.id,coalesce(nullif(p_touchpoint_type,''),'check_in'),coalesce(nullif(p_channel,''),'internal'),p_summary,coalesce(nullif(p_outcome,''),'recorded'),p_next_action,p_next_action_due_at,coalesce(nullif(p_sentiment,''),'neutral'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  returning * into v_touchpoint;
  update public.ac360_school_client_success_accounts set last_touchpoint_at=now(),updated_at=now() where id=v_account.id;
  return jsonb_build_object('ok',true,'touchpoint',to_jsonb(v_touchpoint));
end $$;

create or replace function public.ac360_school_compute_success_health_score(p_org_id uuid,p_score_date date default current_date,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_account public.ac360_school_client_success_accounts%rowtype; v_score public.ac360_school_success_health_scores%rowtype; v_open_alerts int; v_open_findings int; v_progress numeric; v_health numeric; v_status text;
begin
  insert into public.ac360_school_client_success_accounts(org_id) values(p_org_id) on conflict(org_id) do update set updated_at=now() returning * into v_account;
  select count(*) into v_open_alerts from public.ac360_school_onboarding_success_alerts where org_id=p_org_id and status in ('open','acknowledged');
  select count(*) into v_open_findings from public.ac360_school_data_validation_findings where org_id=p_org_id and status in ('open','acknowledged') and severity in ('error','critical');
  select coalesce(max(progress_percent),0) into v_progress from public.ac360_school_onboarding_projects where org_id=p_org_id;
  v_health := greatest(0,least(100,coalesce(v_progress,0) + 20 - (v_open_alerts*8) - (v_open_findings*10)));
  v_status := case when v_health >= 75 then 'green' when v_health >= 45 then 'yellow' else 'red' end;
  insert into public.ac360_school_success_health_scores(org_id,success_account_id,score_date,health_score,health_status,adoption_score,payment_score,support_score,usage_score,risk_score,drivers_json,metadata_json)
  values(p_org_id,v_account.id,coalesce(p_score_date,current_date),v_health,v_status,coalesce(v_progress,0),70,case when v_open_alerts=0 then 80 else 45 end,coalesce(v_progress,0),100-v_health,jsonb_build_object('open_alerts',v_open_alerts,'open_critical_findings',v_open_findings,'onboarding_progress',v_progress),coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(org_id,score_date) do update set health_score=excluded.health_score,health_status=excluded.health_status,adoption_score=excluded.adoption_score,payment_score=excluded.payment_score,support_score=excluded.support_score,usage_score=excluded.usage_score,risk_score=excluded.risk_score,drivers_json=excluded.drivers_json,metadata_json=public.ac360_school_success_health_scores.metadata_json||excluded.metadata_json,created_at=now()
  returning * into v_score;
  update public.ac360_school_client_success_accounts set health_score=v_score.health_score,health_status=v_score.health_status,renewal_risk_level=case when v_score.health_status='red' then 'high' when v_score.health_status='yellow' then 'medium' else 'low' end,updated_at=now() where id=v_account.id;
  return jsonb_build_object('ok',true,'health_score',to_jsonb(v_score));
end $$;

create or replace function public.ac360_school_upsert_success_playbook(p_org_id uuid default null,p_playbook_key text default null,p_label text default null,p_playbook_type text default 'onboarding',p_trigger_json jsonb default '{}'::jsonb,p_steps_json jsonb default '[]'::jsonb,p_status text default 'active',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_playbook public.ac360_school_success_playbooks%rowtype; v_key text;
begin
  v_key := coalesce(nullif(p_playbook_key,''),'playbook-'||to_char(now(),'YYYYMMDDHH24MISS'));
  insert into public.ac360_school_success_playbooks(org_id,playbook_key,label,playbook_type,trigger_json,steps_json,status,created_by,metadata_json)
  values(p_org_id,v_key,coalesce(nullif(p_label,''),'Success playbook'),coalesce(nullif(p_playbook_type,''),'onboarding'),coalesce(p_trigger_json,'{}'::jsonb),coalesce(p_steps_json,'[]'::jsonb),coalesce(nullif(p_status,''),'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)||'{"phase":"phase_2q"}'::jsonb)
  on conflict(playbook_key) do update set label=excluded.label,playbook_type=excluded.playbook_type,trigger_json=excluded.trigger_json,steps_json=excluded.steps_json,status=excluded.status,metadata_json=public.ac360_school_success_playbooks.metadata_json||excluded.metadata_json,updated_at=now()
  returning * into v_playbook;
  return jsonb_build_object('ok',true,'playbook',to_jsonb(v_playbook));
end $$;

create or replace function public.ac360_school_reconcile_onboarding_success(p_org_id uuid,p_as_of_date date default current_date,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_dashboard jsonb; v_overdue int; v_failed int;
begin
  select count(*) into v_overdue from public.ac360_school_onboarding_projects where org_id=p_org_id and target_go_live_date is not null and target_go_live_date < coalesce(p_as_of_date,current_date) and status not in ('live','completed','cancelled','archived');
  select count(*) into v_failed from public.ac360_school_migration_records where org_id=p_org_id and status='failed';

  if v_overdue > 0 then
    insert into public.ac360_school_onboarding_success_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'phase2q.onboarding.overdue.'||coalesce(p_as_of_date,current_date)::text,'onboarding','warning','Onboarding go-live overdue',v_overdue||' onboarding project(s) are past target go-live date.',jsonb_build_object('overdue_projects',v_overdue,'phase','phase_2q'))
    on conflict(org_id,alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,status='open',updated_at=now();
  end if;
  if v_failed > 0 then
    insert into public.ac360_school_onboarding_success_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'phase2q.migration.failed_records.'||coalesce(p_as_of_date,current_date)::text,'migration','warning','Migration records need review',v_failed||' failed migration record(s) require correction.',jsonb_build_object('failed_records',v_failed,'phase','phase_2q'))
    on conflict(org_id,alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,status='open',updated_at=now();
  end if;
  v_dashboard := public.ac360_school_onboarding_success_dashboard(p_org_id,coalesce(p_as_of_date,current_date));
  perform public.ac360_school_compute_success_health_score(p_org_id,coalesce(p_as_of_date,current_date),p_actor_app_user_id,p_metadata);
  return jsonb_build_object('ok',true,'dashboard',v_dashboard,'overdue_projects',v_overdue,'failed_records',v_failed);
end $$;

create or replace function public.ac360_school_resolve_onboarding_alert(p_org_id uuid,p_alert_id uuid,p_actor_app_user_id uuid default null,p_resolution_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_alert public.ac360_school_onboarding_success_alerts%rowtype;
begin
  update public.ac360_school_onboarding_success_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('resolution_note',p_resolution_note)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id returning * into v_alert;
  return jsonb_build_object('ok',v_alert.id is not null,'alert',to_jsonb(v_alert));
end $$;

-- -----------------------------------------------------------------------------
-- 3. Billing feature/action registry and route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('migration_onboarding_success','school_operations','onboarding_success','Data Migration, Onboarding, Setup & Client Success','Migration factory, setup checklists, onboarding projects and client success health runtime.','service',false,true,false,'automation_credit',1,'{"phase":"phase_2q","growthMenu":"migration_onboarding_success"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,default_meter_key=excluded.default_meter_key,default_credit_cost=excluded.default_credit_cost,metadata_json=public.ac360_feature_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json)
values('migration_onboarding_success','Migration, Onboarding & Client Success','onboarding_success','Structured data migration, school setup, onboarding delivery and client success governance.','setup_plus_monthly',1290,3900,'module','{"annual_reference_price_mad":12900,"feature_keys":["migration_onboarding_success"],"included_migration_batches":5,"included_success_reviews":1}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2q","menu":"growth_menu","annual_reference_price_mad":12900,"feature_keys":["migration_onboarding_success"]}'::jsonb)
on conflict(addon_key) do update set label=excluded.label,family=excluded.family,description=excluded.description,billing_model=excluded.billing_model,monthly_price_mad=excluded.monthly_price_mad,setup_price_mad=excluded.setup_price_mad,unit_label=excluded.unit_label,included_allowance_json=excluded.included_allowance_json,cancellable=excluded.cancellable,data_preservation_policy=excluded.data_preservation_policy,status=excluded.status,metadata_json=public.ac360_addons.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.migration.project.create','migration_onboarding_success','AC360-ENG-52','Create migration project','Create a client data migration project.','migration.project.create',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.migration.source.upsert','migration_onboarding_success','AC360-ENG-52','Upsert migration source','Register or update a migration source file/system.','migration.source.upsert','storage_gb',0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.migration.batch.create','migration_onboarding_success','AC360-ENG-52','Create migration batch','Create an import/migration batch.','migration.batch.create','automation_credit',1,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.migration.record.process','migration_onboarding_success','AC360-ENG-33','Process migration record','Process one imported/migrated record.','migration.record.process','automation_credit',1,'require_topup','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.migration.validation.record','migration_onboarding_success','AC360-ENG-10','Record validation finding','Record migration/data validation finding.','migration.validation.record',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.onboarding.project.open','migration_onboarding_success','AC360-ENG-52','Open onboarding project','Open client onboarding project.','onboarding.project.open',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.onboarding.step.update','migration_onboarding_success','AC360-ENG-52','Update onboarding step','Update onboarding step status.','onboarding.step.update',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.setup.checklist.upsert','migration_onboarding_success','AC360-ENG-52','Upsert setup checklist','Create or update setup checklist.','setup.checklist.upsert',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.setup.item.complete','migration_onboarding_success','AC360-ENG-52','Complete setup item','Complete/update setup checklist item.','setup.item.complete',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.client_success.account.upsert','migration_onboarding_success','AC360-ENG-52','Upsert client success account','Create/update client success account.','client_success.account.upsert',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.client_success.touchpoint.record','migration_onboarding_success','AC360-ENG-33','Record success touchpoint','Record client success touchpoint.','client_success.touchpoint.record','automation_credit',1,'require_topup','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.client_success.health_score.compute','migration_onboarding_success','AC360-ENG-38','Compute health score','Compute client success health score.','client_success.health_score.compute','automation_credit',1,'require_topup','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.client_success.playbook.upsert','migration_onboarding_success','AC360-ENG-52','Upsert success playbook','Create/update client success playbook.','client_success.playbook.upsert',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.onboarding.reconcile','migration_onboarding_success','AC360-ENG-38','Reconcile onboarding success','Reconcile migration/onboarding/client success runtime.','onboarding.reconcile','automation_credit',1,'require_topup','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb),
('school.onboarding.alert.resolve','migration_onboarding_success','AC360-ENG-38','Resolve onboarding alert','Resolve onboarding/client success alert.','onboarding.alert.resolve',null,0,'require_upgrade','{"phase":"phase_2q","suggested_addon_key":"migration_onboarding_success"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_onboarding.migration_project.create','/api/ac360/school-onboarding/migration-projects/create','POST','school.migration.project.create','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_migration_projects','strict','fixed_1','request_or_generated',null,null,'active','Creates migration project.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.migration_source.upsert','/api/ac360/school-onboarding/migration-sources/upsert','POST','school.migration.source.upsert','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_migration_sources','strict','fixed_1','request_or_generated',null,null,'active','Upserts migration source.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.migration_batch.create','/api/ac360/school-onboarding/migration-batches/create','POST','school.migration.batch.create','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_migration_batches','strict','fixed_1','request_or_generated',null,null,'active','Creates migration batch.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.migration_record.process','/api/ac360/school-onboarding/migration-records/process','POST','school.migration.record.process','migration_onboarding_success','AC360-ENG-33','angelcare_360_school_onboarding_success','ac360_school_migration_records','strict','fixed_1','request_or_generated',null,null,'active','Processes migration record.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.validation_finding.record','/api/ac360/school-onboarding/validation-findings/record','POST','school.migration.validation.record','migration_onboarding_success','AC360-ENG-10','angelcare_360_school_onboarding_success','ac360_school_data_validation_findings','strict','fixed_1','request_or_generated',null,null,'active','Records validation finding.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.project.open','/api/ac360/school-onboarding/projects/open','POST','school.onboarding.project.open','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_onboarding_projects','strict','fixed_1','request_or_generated',null,null,'active','Opens onboarding project.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.step.update','/api/ac360/school-onboarding/steps/update','POST','school.onboarding.step.update','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_onboarding_steps','strict','fixed_1','request_or_generated',null,null,'active','Updates onboarding step.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.setup_checklist.upsert','/api/ac360/school-onboarding/setup-checklists/upsert','POST','school.setup.checklist.upsert','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_setup_checklists','strict','fixed_1','request_or_generated',null,null,'active','Upserts setup checklist.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.setup_item.complete','/api/ac360/school-onboarding/setup-items/complete','POST','school.setup.item.complete','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_setup_items','strict','fixed_1','request_or_generated',null,null,'active','Completes setup item.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.success_account.upsert','/api/ac360/school-onboarding/success-accounts/upsert','POST','school.client_success.account.upsert','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_client_success_accounts','strict','fixed_1','request_or_generated',null,null,'active','Upserts success account.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.success_touchpoint.record','/api/ac360/school-onboarding/touchpoints/record','POST','school.client_success.touchpoint.record','migration_onboarding_success','AC360-ENG-33','angelcare_360_school_onboarding_success','ac360_school_success_touchpoints','strict','fixed_1','request_or_generated',null,null,'active','Records success touchpoint.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.health_score.compute','/api/ac360/school-onboarding/health-scores/compute','POST','school.client_success.health_score.compute','migration_onboarding_success','AC360-ENG-38','angelcare_360_school_onboarding_success','ac360_school_success_health_scores','strict','fixed_1','request_or_generated',null,null,'active','Computes health score.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.success_playbook.upsert','/api/ac360/school-onboarding/playbooks/upsert','POST','school.client_success.playbook.upsert','migration_onboarding_success','AC360-ENG-52','angelcare_360_school_onboarding_success','ac360_school_success_playbooks','strict','fixed_1','request_or_generated',null,null,'active','Upserts success playbook.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.reconcile','/api/ac360/school-onboarding/reconcile','POST','school.onboarding.reconcile','migration_onboarding_success','AC360-ENG-38','angelcare_360_school_onboarding_success','ac360_school_onboarding_success_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles onboarding success runtime.','{"phase":"phase_2q"}'::jsonb),
('ac360.school_onboarding.alert.resolve','/api/ac360/school-onboarding/alerts/resolve','POST','school.onboarding.alert.resolve','migration_onboarding_success','AC360-ENG-38','angelcare_360_school_onboarding_success','ac360_school_onboarding_success_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves onboarding success alert.','{"phase":"phase_2q"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json||excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, sort_order, status, phase) values
('phase2q.onboarding.overdue.raise_alert','Overdue onboarding raises alert','Onboarding & Success','onboarding.target_go_live.overdue','{"overdue_projects_gt":0}'::jsonb,'{"emit_runtime_alert":"onboarding_overdue"}'::jsonb,310,'active','phase_2q_onboarding_success'),
('phase2q.migration.failed_records.raise_alert','Failed migration records raise alert','Onboarding & Success','migration.records.failed','{"failed_records_gt":0}'::jsonb,'{"emit_runtime_alert":"migration_records_failed"}'::jsonb,311,'active','phase_2q_onboarding_success'),
('phase2q.health_score.red.raise_alert','Red client health score raises alert','Onboarding & Success','client_success.health.red','{"health_status":"red"}'::jsonb,'{"emit_runtime_alert":"client_success_red"}'::jsonb,312,'active','phase_2q_onboarding_success')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values('data_migration_onboarding_setup_client_success','AC360-ENG-52','migration_onboarding_success','Data Migration, Onboarding, Setup & Client Success Runtime','phase_2q_migration_onboarding_client_success','guarded',array['ac360_school_migration_projects','ac360_school_migration_sources','ac360_school_migration_batches','ac360_school_migration_records','ac360_school_data_validation_findings','ac360_school_onboarding_projects','ac360_school_onboarding_steps','ac360_school_setup_checklists','ac360_school_setup_items','ac360_school_client_success_accounts','ac360_school_success_touchpoints','ac360_school_success_health_scores','ac360_school_success_playbooks','ac360_school_onboarding_success_snapshots','ac360_school_onboarding_success_alerts'],array['school.migration.project.create','school.migration.source.upsert','school.migration.batch.create','school.migration.record.process','school.migration.validation.record','school.onboarding.project.open','school.onboarding.step.update','school.setup.checklist.upsert','school.setup.item.complete','school.client_success.account.upsert','school.client_success.touchpoint.record','school.client_success.health_score.compute','school.client_success.playbook.upsert','school.onboarding.reconcile','school.onboarding.alert.resolve'],'{"phase":"phase_2q","uiBuildAllowed":false,"backendOnly":true,"archiveNotDelete":true}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json||excluded.metadata_json,updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. RLS service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_school_migration_projects enable row level security;
alter table public.ac360_school_migration_sources enable row level security;
alter table public.ac360_school_migration_batches enable row level security;
alter table public.ac360_school_migration_records enable row level security;
alter table public.ac360_school_data_validation_findings enable row level security;
alter table public.ac360_school_onboarding_projects enable row level security;
alter table public.ac360_school_onboarding_steps enable row level security;
alter table public.ac360_school_setup_checklists enable row level security;
alter table public.ac360_school_setup_items enable row level security;
alter table public.ac360_school_client_success_accounts enable row level security;
alter table public.ac360_school_success_touchpoints enable row level security;
alter table public.ac360_school_success_health_scores enable row level security;
alter table public.ac360_school_success_playbooks enable row level security;
alter table public.ac360_school_onboarding_success_snapshots enable row level security;
alter table public.ac360_school_onboarding_success_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_school_migration_projects','ac360_school_migration_sources','ac360_school_migration_batches','ac360_school_migration_records','ac360_school_data_validation_findings','ac360_school_onboarding_projects','ac360_school_onboarding_steps','ac360_school_setup_checklists','ac360_school_setup_items','ac360_school_client_success_accounts','ac360_school_success_touchpoints','ac360_school_success_health_scores','ac360_school_success_playbooks','ac360_school_onboarding_success_snapshots','ac360_school_onboarding_success_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_'||t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_'||t, t);
  end loop;
end $$;

commit;
