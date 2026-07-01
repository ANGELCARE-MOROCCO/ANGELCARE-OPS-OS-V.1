-- AngelCare 360 Phase 2H - Admissions CRM, Leads, Visits & Enrollment Conversion Runtime
-- Ref: AC360-PH2H-ADMISSIONS-CRM-LEADS-VISITS-CONVERSION-2026-06-30
-- Scope: backend/system-only admissions runtime. No admissions UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2G school ops runtime.

begin;

create extension if not exists pgcrypto;

-- Compatibility safety inherited from Phase 1D/1E lineage.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Admissions CRM runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_admissions_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  source_key text not null,
  label text not null,
  source_type text not null default 'manual',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, source_key),
  check (source_type in ('manual','walk_in','phone','whatsapp','website','facebook','instagram','referral','event','partner','campaign','import','other')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_admission_pipelines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  pipeline_key text not null,
  label text not null,
  pipeline_type text not null default 'standard',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, pipeline_key),
  check (pipeline_type in ('standard','nursery','kindergarten','school','camp','waitlist','custom')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_admission_stages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  pipeline_id uuid not null references public.ac360_school_admission_pipelines(id) on delete cascade,
  stage_key text not null,
  label text not null,
  stage_type text not null default 'open',
  position integer not null default 100,
  is_conversion_stage boolean not null default false,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(pipeline_id, stage_key),
  check (stage_type in ('open','qualified','visit','offer','application','converted','lost','waitlist','archived')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_admission_leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  pipeline_id uuid references public.ac360_school_admission_pipelines(id) on delete set null,
  stage_id uuid references public.ac360_school_admission_stages(id) on delete set null,
  source_id uuid references public.ac360_school_admissions_sources(id) on delete set null,
  lead_code text not null,
  child_first_name text not null,
  child_last_name text,
  date_of_birth date,
  desired_start_date date,
  desired_level text,
  parent_name text,
  parent_phone text,
  parent_email text,
  preferred_channel text default 'whatsapp',
  lead_status text not null default 'new',
  priority text not null default 'medium',
  score numeric not null default 0,
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  next_followup_at timestamptz,
  lost_reason text,
  converted_student_id uuid references public.ac360_school_students(id) on delete set null,
  converted_at timestamptz,
  status text not null default 'active',
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, lead_code),
  check (preferred_channel in ('phone','whatsapp','email','visit','sms','none')),
  check (lead_status in ('new','qualified','visit_scheduled','visited','offer_sent','application','waitlist','converted','lost','archived')),
  check (priority in ('low','medium','high','urgent')),
  check (status in ('active','paused','converted','lost','archived'))
);

create table if not exists public.ac360_school_admission_lead_guardians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid not null references public.ac360_school_admission_leads(id) on delete cascade,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  guardian_name text not null,
  relationship text default 'parent',
  phone text,
  email text,
  is_primary boolean not null default false,
  consent_status text not null default 'pending',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (relationship in ('mother','father','guardian','parent','grandparent','driver','other')),
  check (consent_status in ('pending','granted','declined','revoked'))
);

create table if not exists public.ac360_school_admission_visits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid not null references public.ac360_school_admission_leads(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  visit_code text not null,
  scheduled_at timestamptz not null,
  visit_type text not null default 'school_visit',
  status text not null default 'scheduled',
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  outcome text,
  completed_at timestamptz,
  no_show_reason text,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, visit_code),
  check (visit_type in ('school_visit','phone_call','video_call','assessment','open_day','custom')),
  check (status in ('scheduled','confirmed','completed','no_show','cancelled','archived'))
);

create table if not exists public.ac360_school_admission_followups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid not null references public.ac360_school_admission_leads(id) on delete cascade,
  followup_code text not null,
  followup_type text not null default 'call',
  due_at timestamptz not null,
  status text not null default 'open',
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  completed_at timestamptz,
  outcome text,
  next_action text,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, followup_code),
  check (followup_type in ('call','whatsapp','email','visit','document','offer','payment','custom')),
  check (status in ('open','done','missed','cancelled','archived'))
);

create table if not exists public.ac360_school_admission_offers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid not null references public.ac360_school_admission_leads(id) on delete cascade,
  offer_code text not null,
  offer_type text not null default 'standard',
  currency text not null default 'MAD',
  registration_fee_mad numeric not null default 0,
  tuition_monthly_mad numeric not null default 0,
  discount_mad numeric not null default 0,
  valid_until date,
  status text not null default 'draft',
  issued_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, offer_code),
  check (offer_type in ('standard','launch','sibling','scholarship','custom')),
  check (status in ('draft','issued','accepted','declined','expired','cancelled','archived'))
);

create table if not exists public.ac360_school_enrollment_applications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid references public.ac360_school_admission_leads(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  offer_id uuid references public.ac360_school_admission_offers(id) on delete set null,
  application_code text not null,
  status text not null default 'draft',
  submitted_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  missing_documents text[] not null default '{}',
  review_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, application_code),
  check (status in ('draft','submitted','in_review','approved','rejected','converted','archived'))
);

create table if not exists public.ac360_school_admission_import_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  batch_code text not null,
  source_label text,
  status text not null default 'queued',
  total_rows integer not null default 0,
  accepted_rows integer not null default 0,
  rejected_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  error_summary text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, batch_code),
  check (status in ('queued','processing','completed','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_admission_duplicate_findings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid references public.ac360_school_admission_leads(id) on delete cascade,
  duplicate_lead_id uuid references public.ac360_school_admission_leads(id) on delete cascade,
  match_type text not null default 'possible',
  match_score numeric not null default 0,
  status text not null default 'open',
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (match_type in ('phone','email','name_birthdate','possible','strong')),
  check (status in ('open','confirmed_duplicate','not_duplicate','merged','ignored','archived'))
);

create table if not exists public.ac360_school_admission_conversion_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  lead_id uuid references public.ac360_school_admission_leads(id) on delete set null,
  event_key text not null,
  event_type text not null default 'admissions_event',
  from_status text,
  to_status text,
  actor_app_user_id uuid,
  message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_school_admission_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  snapshot_date date not null default current_date,
  leads_open integer not null default 0,
  visits_scheduled integer not null default 0,
  offers_issued integer not null default 0,
  applications_open integer not null default 0,
  converted_this_month integer not null default 0,
  lost_this_month integer not null default 0,
  overdue_followups integer not null default 0,
  duplicate_findings_open integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, campus_id, snapshot_date)
);

create table if not exists public.ac360_school_admission_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  lead_id uuid references public.ac360_school_admission_leads(id) on delete set null,
  alert_key text not null,
  alert_type text not null default 'followup_overdue',
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  resolved_by uuid,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('followup_overdue','visit_no_show','offer_expiring','duplicate_lead','conversion_blocked','pipeline_stale','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','in_review','resolved','dismissed','archived'))
);

-- Updated-at triggers
drop trigger if exists trg_ac360_school_admissions_sources_updated_at on public.ac360_school_admissions_sources;
create trigger trg_ac360_school_admissions_sources_updated_at before update on public.ac360_school_admissions_sources for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_pipelines_updated_at on public.ac360_school_admission_pipelines;
create trigger trg_ac360_school_admission_pipelines_updated_at before update on public.ac360_school_admission_pipelines for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_stages_updated_at on public.ac360_school_admission_stages;
create trigger trg_ac360_school_admission_stages_updated_at before update on public.ac360_school_admission_stages for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_leads_updated_at on public.ac360_school_admission_leads;
create trigger trg_ac360_school_admission_leads_updated_at before update on public.ac360_school_admission_leads for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_lead_guardians_updated_at on public.ac360_school_admission_lead_guardians;
create trigger trg_ac360_school_admission_lead_guardians_updated_at before update on public.ac360_school_admission_lead_guardians for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_visits_updated_at on public.ac360_school_admission_visits;
create trigger trg_ac360_school_admission_visits_updated_at before update on public.ac360_school_admission_visits for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_followups_updated_at on public.ac360_school_admission_followups;
create trigger trg_ac360_school_admission_followups_updated_at before update on public.ac360_school_admission_followups for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_offers_updated_at on public.ac360_school_admission_offers;
create trigger trg_ac360_school_admission_offers_updated_at before update on public.ac360_school_admission_offers for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_enrollment_applications_updated_at on public.ac360_school_enrollment_applications;
create trigger trg_ac360_school_enrollment_applications_updated_at before update on public.ac360_school_enrollment_applications for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_import_batches_updated_at on public.ac360_school_admission_import_batches;
create trigger trg_ac360_school_admission_import_batches_updated_at before update on public.ac360_school_admission_import_batches for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_duplicate_findings_updated_at on public.ac360_school_admission_duplicate_findings;
create trigger trg_ac360_school_admission_duplicate_findings_updated_at before update on public.ac360_school_admission_duplicate_findings for each row execute function public.ac360_touch_updated_at();
drop trigger if exists trg_ac360_school_admission_alerts_updated_at on public.ac360_school_admission_alerts;
create trigger trg_ac360_school_admission_alerts_updated_at before update on public.ac360_school_admission_alerts for each row execute function public.ac360_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_admission_leads_org_status on public.ac360_school_admission_leads(org_id, lead_status, status);
create index if not exists idx_ac360_admission_leads_next_followup on public.ac360_school_admission_leads(org_id, next_followup_at) where status='active';
create index if not exists idx_ac360_admission_leads_parent_phone on public.ac360_school_admission_leads(org_id, parent_phone) where parent_phone is not null;
create index if not exists idx_ac360_admission_visits_org_status on public.ac360_school_admission_visits(org_id, status, scheduled_at);
create index if not exists idx_ac360_admission_followups_org_status on public.ac360_school_admission_followups(org_id, status, due_at);
create index if not exists idx_ac360_admission_offers_org_status on public.ac360_school_admission_offers(org_id, status, valid_until);
create index if not exists idx_ac360_admission_alerts_org_status on public.ac360_school_admission_alerts(org_id, status, severity);

-- -----------------------------------------------------------------------------
-- 3. RLS + service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_school_admissions_sources enable row level security;
alter table public.ac360_school_admission_pipelines enable row level security;
alter table public.ac360_school_admission_stages enable row level security;
alter table public.ac360_school_admission_leads enable row level security;
alter table public.ac360_school_admission_lead_guardians enable row level security;
alter table public.ac360_school_admission_visits enable row level security;
alter table public.ac360_school_admission_followups enable row level security;
alter table public.ac360_school_admission_offers enable row level security;
alter table public.ac360_school_enrollment_applications enable row level security;
alter table public.ac360_school_admission_import_batches enable row level security;
alter table public.ac360_school_admission_duplicate_findings enable row level security;
alter table public.ac360_school_admission_conversion_events enable row level security;
alter table public.ac360_school_admission_snapshots enable row level security;
alter table public.ac360_school_admission_alerts enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'ac360_school_admissions_sources','ac360_school_admission_pipelines','ac360_school_admission_stages','ac360_school_admission_leads',
    'ac360_school_admission_lead_guardians','ac360_school_admission_visits','ac360_school_admission_followups','ac360_school_admission_offers',
    'ac360_school_enrollment_applications','ac360_school_admission_import_batches','ac360_school_admission_duplicate_findings',
    'ac360_school_admission_conversion_events','ac360_school_admission_snapshots','ac360_school_admission_alerts'
  ];
begin
  foreach t in array tables loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Helper and runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_admissions_default_code(p_prefix text)
returns text language sql stable as $$
  select upper(coalesce(nullif(p_prefix,''),'ADM')) || '-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6);
$$;

create or replace function public.ac360_school_ensure_admissions_pipeline(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_pipeline_id uuid;
  v_stage_id uuid;
begin
  if p_org_id is null then raise exception 'org_id is required'; end if;

  insert into public.ac360_school_admission_pipelines(org_id,campus_id,pipeline_key,label,pipeline_type,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,'default','Default Admissions Pipeline','standard','active',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,pipeline_key) do update set status='active', updated_at=now()
  returning id into v_pipeline_id;

  if v_pipeline_id is null then
    select id into v_pipeline_id from public.ac360_school_admission_pipelines where org_id=p_org_id and pipeline_key='default' limit 1;
  end if;

  insert into public.ac360_school_admission_stages(org_id,pipeline_id,stage_key,label,stage_type,position,is_conversion_stage,status) values
  (p_org_id,v_pipeline_id,'new','New lead','open',10,false,'active'),
  (p_org_id,v_pipeline_id,'qualified','Qualified','qualified',20,false,'active'),
  (p_org_id,v_pipeline_id,'visit_scheduled','Visit scheduled','visit',30,false,'active'),
  (p_org_id,v_pipeline_id,'offer_sent','Offer sent','offer',40,false,'active'),
  (p_org_id,v_pipeline_id,'application','Application','application',50,false,'active'),
  (p_org_id,v_pipeline_id,'converted','Converted','converted',60,true,'active'),
  (p_org_id,v_pipeline_id,'lost','Lost','lost',90,false,'active')
  on conflict(pipeline_id,stage_key) do update set label=excluded.label, stage_type=excluded.stage_type, position=excluded.position, is_conversion_stage=excluded.is_conversion_stage, status='active', updated_at=now();

  insert into public.ac360_school_admissions_sources(org_id,source_key,label,source_type,status)
  values
  (p_org_id,'manual','Manual entry','manual','active'),
  (p_org_id,'whatsapp','WhatsApp inquiry','whatsapp','active'),
  (p_org_id,'website','Website lead','website','active'),
  (p_org_id,'referral','Parent referral','referral','active')
  on conflict(org_id,source_key) do update set label=excluded.label, source_type=excluded.source_type, status='active', updated_at=now();

  return jsonb_build_object('ok',true,'pipeline_id',v_pipeline_id,'phase','phase_2h_admissions_crm');
end;
$$;

create or replace function public.ac360_school_create_admission_lead(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_child_first_name text default null,
  p_child_last_name text default null,
  p_date_of_birth date default null,
  p_desired_start_date date default null,
  p_desired_level text default null,
  p_parent_name text default null,
  p_parent_phone text default null,
  p_parent_email text default null,
  p_preferred_channel text default 'whatsapp',
  p_source_key text default 'manual',
  p_priority text default 'medium',
  p_score numeric default 0,
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_pipeline_id uuid;
  v_stage_id uuid;
  v_source_id uuid;
  v_lead_id uuid;
  v_code text;
begin
  if p_org_id is null then raise exception 'org_id is required'; end if;
  if nullif(trim(coalesce(p_child_first_name,'')),'') is null then raise exception 'child_first_name is required'; end if;

  perform public.ac360_school_ensure_admissions_pipeline(p_org_id,p_campus_id,p_actor_app_user_id,'{}'::jsonb);
  select id into v_pipeline_id from public.ac360_school_admission_pipelines where org_id=p_org_id and pipeline_key='default' limit 1;
  select id into v_stage_id from public.ac360_school_admission_stages where pipeline_id=v_pipeline_id and stage_key='new' limit 1;
  select id into v_source_id from public.ac360_school_admissions_sources where org_id=p_org_id and source_key=coalesce(nullif(p_source_key,''),'manual') limit 1;
  v_code := public.ac360_admissions_default_code('LEAD');

  insert into public.ac360_school_admission_leads(
    org_id,campus_id,pipeline_id,stage_id,source_id,lead_code,child_first_name,child_last_name,date_of_birth,desired_start_date,desired_level,
    parent_name,parent_phone,parent_email,preferred_channel,lead_status,priority,score,notes,created_by,metadata_json
  ) values(
    p_org_id,p_campus_id,v_pipeline_id,v_stage_id,v_source_id,v_code,trim(p_child_first_name),nullif(trim(coalesce(p_child_last_name,'')),''),p_date_of_birth,p_desired_start_date,p_desired_level,
    p_parent_name,p_parent_phone,p_parent_email,coalesce(nullif(p_preferred_channel,''),'whatsapp'),'new',coalesce(nullif(p_priority,''),'medium'),coalesce(p_score,0),p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)
  ) returning id into v_lead_id;

  if nullif(trim(coalesce(p_parent_name,'')),'') is not null then
    insert into public.ac360_school_admission_lead_guardians(org_id,lead_id,guardian_name,relationship,phone,email,is_primary,consent_status,metadata_json)
    values(p_org_id,v_lead_id,p_parent_name,'parent',p_parent_phone,p_parent_email,true,'pending','{"created_from":"lead_create"}'::jsonb);
  end if;

  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,to_status,actor_app_user_id,message,metadata_json)
  values(p_org_id,v_lead_id,'lead.created','lead_created','new',p_actor_app_user_id,'Admission lead created.',coalesce(p_metadata,'{}'::jsonb));

  return jsonb_build_object('ok',true,'lead_id',v_lead_id,'lead_code',v_code,'status','new');
end;
$$;

create or replace function public.ac360_school_update_admission_stage(
  p_org_id uuid,
  p_lead_id uuid,
  p_stage_key text,
  p_lead_status text default null,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lead public.ac360_school_admission_leads%rowtype;
  v_stage_id uuid;
  v_from text;
  v_to text;
begin
  select * into v_lead from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id;
  if v_lead.id is null then raise exception 'lead not found'; end if;
  v_from := v_lead.lead_status;
  select id, stage_type into v_stage_id, v_to from public.ac360_school_admission_stages where pipeline_id=v_lead.pipeline_id and stage_key=p_stage_key limit 1;
  if v_stage_id is null then raise exception 'stage not found'; end if;
  v_to := coalesce(nullif(p_lead_status,''), case when v_to='open' then 'new' else v_to end);

  update public.ac360_school_admission_leads
  set stage_id=v_stage_id, lead_status=v_to, status=case when v_to='converted' then 'converted' when v_to='lost' then 'lost' else status end, lost_reason=case when v_to='lost' then p_reason else lost_reason end, updated_at=now()
  where id=p_lead_id and org_id=p_org_id;

  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,from_status,to_status,actor_app_user_id,message,metadata_json)
  values(p_org_id,p_lead_id,'lead.stage.updated','stage_transition',v_from,v_to,p_actor_app_user_id,coalesce(p_reason,'Admission stage updated.'),coalesce(p_metadata,'{}'::jsonb));

  return jsonb_build_object('ok',true,'lead_id',p_lead_id,'from_status',v_from,'to_status',v_to);
end;
$$;

create or replace function public.ac360_school_link_admission_guardian(
  p_org_id uuid,
  p_lead_id uuid,
  p_guardian_id uuid default null,
  p_guardian_name text default null,
  p_relationship text default 'parent',
  p_phone text default null,
  p_email text default null,
  p_is_primary boolean default false,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_id uuid; begin
  if not exists(select 1 from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id) then raise exception 'lead not found'; end if;
  insert into public.ac360_school_admission_lead_guardians(org_id,lead_id,guardian_id,guardian_name,relationship,phone,email,is_primary,consent_status,metadata_json)
  values(p_org_id,p_lead_id,p_guardian_id,coalesce(nullif(p_guardian_name,''),'Guardian'),coalesce(nullif(p_relationship,''),'parent'),p_phone,p_email,coalesce(p_is_primary,false),'pending',coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,actor_app_user_id,message,metadata_json) values(p_org_id,p_lead_id,'lead.guardian.linked','guardian_link',p_actor_app_user_id,'Guardian linked to admission lead.',coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'lead_guardian_id',v_id);
end $$;

create or replace function public.ac360_school_schedule_admission_visit(
  p_org_id uuid,
  p_lead_id uuid,
  p_campus_id uuid default null,
  p_scheduled_at timestamptz default null,
  p_visit_type text default 'school_visit',
  p_assigned_staff_id uuid default null,
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_id uuid; v_code text; begin
  if p_scheduled_at is null then raise exception 'scheduled_at is required'; end if;
  if not exists(select 1 from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id) then raise exception 'lead not found'; end if;
  v_code := public.ac360_admissions_default_code('VISIT');
  insert into public.ac360_school_admission_visits(org_id,lead_id,campus_id,visit_code,scheduled_at,visit_type,status,assigned_staff_id,notes,created_by,metadata_json)
  values(p_org_id,p_lead_id,p_campus_id,v_code,p_scheduled_at,coalesce(nullif(p_visit_type,''),'school_visit'),'scheduled',p_assigned_staff_id,p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  update public.ac360_school_admission_leads set lead_status='visit_scheduled', next_followup_at=p_scheduled_at + interval '1 day', updated_at=now() where id=p_lead_id and org_id=p_org_id and lead_status not in ('converted','lost');
  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,to_status,actor_app_user_id,message,metadata_json) values(p_org_id,p_lead_id,'visit.scheduled','visit','visit_scheduled',p_actor_app_user_id,'Admission visit scheduled.',coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'visit_id',v_id,'visit_code',v_code);
end $$;

create or replace function public.ac360_school_complete_admission_visit(
  p_org_id uuid,
  p_visit_id uuid,
  p_status text default 'completed',
  p_outcome text default null,
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_lead_id uuid; begin
  select lead_id into v_lead_id from public.ac360_school_admission_visits where id=p_visit_id and org_id=p_org_id;
  if v_lead_id is null then raise exception 'visit not found'; end if;
  update public.ac360_school_admission_visits set status=coalesce(nullif(p_status,''),'completed'), outcome=p_outcome, notes=coalesce(p_notes,notes), completed_at=case when p_status in ('completed','no_show','cancelled') then now() else completed_at end, updated_at=now() where id=p_visit_id and org_id=p_org_id;
  if p_status='completed' then update public.ac360_school_admission_leads set lead_status='visited', updated_at=now() where id=v_lead_id and org_id=p_org_id and lead_status not in ('converted','lost'); end if;
  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,to_status,actor_app_user_id,message,metadata_json) values(p_org_id,v_lead_id,'visit.completed','visit',p_status,p_actor_app_user_id,coalesce(p_outcome,'Admission visit completed.'),coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'visit_id',p_visit_id,'lead_id',v_lead_id,'status',p_status);
end $$;

create or replace function public.ac360_school_create_admission_followup(
  p_org_id uuid,
  p_lead_id uuid,
  p_due_at timestamptz,
  p_followup_type text default 'call',
  p_assigned_staff_id uuid default null,
  p_next_action text default null,
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_id uuid; v_code text; begin
  if p_due_at is null then raise exception 'due_at is required'; end if;
  if not exists(select 1 from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id) then raise exception 'lead not found'; end if;
  v_code := public.ac360_admissions_default_code('FU');
  insert into public.ac360_school_admission_followups(org_id,lead_id,followup_code,followup_type,due_at,status,assigned_staff_id,next_action,notes,created_by,metadata_json)
  values(p_org_id,p_lead_id,v_code,coalesce(nullif(p_followup_type,''),'call'),p_due_at,'open',p_assigned_staff_id,p_next_action,p_notes,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  update public.ac360_school_admission_leads set next_followup_at=p_due_at, updated_at=now() where id=p_lead_id and org_id=p_org_id;
  return jsonb_build_object('ok',true,'followup_id',v_id,'followup_code',v_code);
end $$;

create or replace function public.ac360_school_complete_admission_followup(
  p_org_id uuid,
  p_followup_id uuid,
  p_outcome text default null,
  p_next_action text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_lead_id uuid; begin
  select lead_id into v_lead_id from public.ac360_school_admission_followups where id=p_followup_id and org_id=p_org_id;
  if v_lead_id is null then raise exception 'followup not found'; end if;
  update public.ac360_school_admission_followups set status='done', outcome=p_outcome, next_action=coalesce(p_next_action,next_action), completed_at=now(), updated_at=now() where id=p_followup_id and org_id=p_org_id;
  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,actor_app_user_id,message,metadata_json) values(p_org_id,v_lead_id,'followup.completed','followup',p_actor_app_user_id,coalesce(p_outcome,'Admission follow-up completed.'),coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'followup_id',p_followup_id,'lead_id',v_lead_id);
end $$;

create or replace function public.ac360_school_generate_admission_offer(
  p_org_id uuid,
  p_lead_id uuid,
  p_offer_type text default 'standard',
  p_registration_fee_mad numeric default 0,
  p_tuition_monthly_mad numeric default 0,
  p_discount_mad numeric default 0,
  p_valid_until date default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_id uuid; v_code text; begin
  if not exists(select 1 from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id) then raise exception 'lead not found'; end if;
  v_code := public.ac360_admissions_default_code('OFFER');
  insert into public.ac360_school_admission_offers(org_id,lead_id,offer_code,offer_type,registration_fee_mad,tuition_monthly_mad,discount_mad,valid_until,status,issued_at,created_by,metadata_json)
  values(p_org_id,p_lead_id,v_code,coalesce(nullif(p_offer_type,''),'standard'),coalesce(p_registration_fee_mad,0),coalesce(p_tuition_monthly_mad,0),coalesce(p_discount_mad,0),p_valid_until,'issued',now(),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  update public.ac360_school_admission_leads set lead_status='offer_sent', updated_at=now() where id=p_lead_id and org_id=p_org_id and lead_status not in ('converted','lost');
  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,to_status,actor_app_user_id,message,metadata_json) values(p_org_id,p_lead_id,'offer.issued','offer','offer_sent',p_actor_app_user_id,'Admission offer issued.',coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'offer_id',v_id,'offer_code',v_code,'status','issued');
end $$;

create or replace function public.ac360_school_decide_admission_offer(
  p_org_id uuid,
  p_offer_id uuid,
  p_decision text,
  p_decision_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_lead_id uuid; v_status text; begin
  select lead_id into v_lead_id from public.ac360_school_admission_offers where id=p_offer_id and org_id=p_org_id;
  if v_lead_id is null then raise exception 'offer not found'; end if;
  v_status := case when p_decision in ('accept','accepted','approve','approved') then 'accepted' when p_decision in ('decline','declined','reject','rejected') then 'declined' else p_decision end;
  if v_status not in ('accepted','declined','expired','cancelled') then raise exception 'invalid offer decision'; end if;
  update public.ac360_school_admission_offers set status=v_status, decision_note=p_decision_note, decided_at=now(), updated_at=now() where id=p_offer_id and org_id=p_org_id;
  if v_status='accepted' then update public.ac360_school_admission_leads set lead_status='application', updated_at=now() where id=v_lead_id and org_id=p_org_id and lead_status not in ('converted','lost'); end if;
  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,to_status,actor_app_user_id,message,metadata_json) values(p_org_id,v_lead_id,'offer.decided','offer',v_status,p_actor_app_user_id,coalesce(p_decision_note,'Admission offer decided.'),coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'offer_id',p_offer_id,'lead_id',v_lead_id,'status',v_status);
end $$;

create or replace function public.ac360_school_create_enrollment_application(
  p_org_id uuid,
  p_lead_id uuid,
  p_offer_id uuid default null,
  p_status text default 'submitted',
  p_missing_documents text[] default '{}',
  p_review_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_id uuid; v_code text; begin
  if not exists(select 1 from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id) then raise exception 'lead not found'; end if;
  v_code := public.ac360_admissions_default_code('APP');
  insert into public.ac360_school_enrollment_applications(org_id,lead_id,offer_id,application_code,status,submitted_at,missing_documents,review_note,created_by,metadata_json)
  values(p_org_id,p_lead_id,p_offer_id,v_code,coalesce(nullif(p_status,''),'submitted'),case when p_status in ('submitted','in_review','approved') then now() else null end,coalesce(p_missing_documents,'{}'::text[]),p_review_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  update public.ac360_school_admission_leads set lead_status='application', updated_at=now() where id=p_lead_id and org_id=p_org_id and lead_status not in ('converted','lost');
  return jsonb_build_object('ok',true,'application_id',v_id,'application_code',v_code);
end $$;

create or replace function public.ac360_school_convert_admission_to_student(
  p_org_id uuid,
  p_lead_id uuid,
  p_class_id uuid default null,
  p_academic_year_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare
  v_lead public.ac360_school_admission_leads%rowtype;
  v_student_id uuid;
  v_student_code text;
  v_guardian record;
  v_student_guardian_id uuid;
begin
  select * into v_lead from public.ac360_school_admission_leads where id=p_lead_id and org_id=p_org_id;
  if v_lead.id is null then raise exception 'lead not found'; end if;
  if v_lead.converted_student_id is not null then return jsonb_build_object('ok',true,'student_id',v_lead.converted_student_id,'already_converted',true); end if;

  v_student_code := public.ac360_admissions_default_code('STU');
  insert into public.ac360_school_students(org_id,campus_id,academic_year_id,student_code,first_name,last_name,date_of_birth,enrollment_status,status,joined_on,source_channel,created_by,metadata_json)
  values(p_org_id,v_lead.campus_id,coalesce(p_academic_year_id,v_lead.academic_year_id),v_student_code,v_lead.child_first_name,v_lead.child_last_name,v_lead.date_of_birth,'enrolled','active',current_date,'admissions_crm',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('admission_lead_id',p_lead_id)) returning id into v_student_id;

  if p_class_id is not null then
    insert into public.ac360_school_class_enrollments(org_id,student_id,class_id,status,starts_on,metadata_json)
    values(p_org_id,v_student_id,p_class_id,'active',current_date,'{"source":"admissions_conversion"}'::jsonb)
    on conflict do nothing;
  end if;

  for v_guardian in select * from public.ac360_school_admission_lead_guardians where lead_id=p_lead_id and org_id=p_org_id loop
    if v_guardian.guardian_id is not null then
      insert into public.ac360_school_student_guardians(org_id,student_id,guardian_id,relation_label,is_primary,status,metadata_json)
      values(p_org_id,v_student_id,v_guardian.guardian_id,v_guardian.relationship,v_guardian.is_primary,'active','{"source":"admissions_conversion"}'::jsonb)
      on conflict do nothing;
    end if;
  end loop;

  update public.ac360_school_admission_leads set lead_status='converted', status='converted', converted_student_id=v_student_id, converted_at=now(), updated_at=now() where id=p_lead_id and org_id=p_org_id;
  update public.ac360_school_enrollment_applications set status='converted', student_id=v_student_id, updated_at=now() where lead_id=p_lead_id and org_id=p_org_id and status <> 'archived';

  insert into public.ac360_school_admission_conversion_events(org_id,lead_id,event_key,event_type,to_status,actor_app_user_id,message,metadata_json) values(p_org_id,p_lead_id,'lead.converted_to_student','conversion','converted',p_actor_app_user_id,'Admission lead converted to active student.',coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'student_id',v_student_id,'student_code',v_student_code,'lead_id',p_lead_id);
end $$;

create or replace function public.ac360_school_create_admission_import_batch(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_source_label text default null,
  p_total_rows integer default 0,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_id uuid; v_code text; begin
  v_code := public.ac360_admissions_default_code('IMP');
  insert into public.ac360_school_admission_import_batches(org_id,campus_id,batch_code,source_label,total_rows,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_code,p_source_label,coalesce(p_total_rows,0),'queued',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'batch_id',v_id,'batch_code',v_code);
end $$;

create or replace function public.ac360_school_scan_admission_duplicates(
  p_org_id uuid,
  p_lead_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_count integer := 0; begin
  insert into public.ac360_school_admission_duplicate_findings(org_id,lead_id,duplicate_lead_id,match_type,match_score,status,metadata_json)
  select p_org_id,a.id,b.id,
    case when a.parent_phone is not null and a.parent_phone=b.parent_phone then 'phone'
         when a.parent_email is not null and lower(a.parent_email)=lower(b.parent_email) then 'email'
         else 'name_birthdate' end,
    case when a.parent_phone is not null and a.parent_phone=b.parent_phone then 95 else 80 end,
    'open',
    jsonb_build_object('source','phase_2h_duplicate_scan')
  from public.ac360_school_admission_leads a
  join public.ac360_school_admission_leads b on b.org_id=a.org_id and b.id<>a.id
  where a.org_id=p_org_id
    and (p_lead_id is null or a.id=p_lead_id)
    and a.status='active' and b.status='active'
    and (
      (a.parent_phone is not null and a.parent_phone=b.parent_phone)
      or (a.parent_email is not null and b.parent_email is not null and lower(a.parent_email)=lower(b.parent_email))
      or (lower(coalesce(a.child_first_name,''))=lower(coalesce(b.child_first_name,'')) and coalesce(a.date_of_birth,'1900-01-01'::date)=coalesce(b.date_of_birth,'1900-01-01'::date))
    )
  on conflict do nothing;
  get diagnostics v_count = row_count;
  return jsonb_build_object('ok',true,'duplicates_created',v_count);
end $$;

create or replace function public.ac360_school_reconcile_admissions(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare
  v_open integer; v_visits integer; v_offers integer; v_apps integer; v_converted integer; v_lost integer; v_overdue integer; v_dupes integer;
begin
  select count(*) into v_open from public.ac360_school_admission_leads where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='active' and lead_status not in ('converted','lost','archived');
  select count(*) into v_visits from public.ac360_school_admission_visits where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('scheduled','confirmed');
  select count(*) into v_offers from public.ac360_school_admission_offers o join public.ac360_school_admission_leads l on l.id=o.lead_id where o.org_id=p_org_id and (p_campus_id is null or l.campus_id=p_campus_id) and o.status='issued';
  select count(*) into v_apps from public.ac360_school_enrollment_applications a left join public.ac360_school_admission_leads l on l.id=a.lead_id where a.org_id=p_org_id and (p_campus_id is null or l.campus_id=p_campus_id) and a.status in ('submitted','in_review','approved');
  select count(*) into v_converted from public.ac360_school_admission_leads where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and converted_at >= date_trunc('month',now());
  select count(*) into v_lost from public.ac360_school_admission_leads where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='lost' and updated_at >= date_trunc('month',now());
  select count(*) into v_overdue from public.ac360_school_admission_followups f join public.ac360_school_admission_leads l on l.id=f.lead_id where f.org_id=p_org_id and (p_campus_id is null or l.campus_id=p_campus_id) and f.status='open' and f.due_at < now();
  select count(*) into v_dupes from public.ac360_school_admission_duplicate_findings where org_id=p_org_id and status='open';

  insert into public.ac360_school_admission_snapshots(org_id,campus_id,snapshot_date,leads_open,visits_scheduled,offers_issued,applications_open,converted_this_month,lost_this_month,overdue_followups,duplicate_findings_open,metadata_json)
  values(p_org_id,p_campus_id,current_date,v_open,v_visits,v_offers,v_apps,v_converted,v_lost,v_overdue,v_dupes,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,campus_id,snapshot_date) do update set leads_open=excluded.leads_open, visits_scheduled=excluded.visits_scheduled, offers_issued=excluded.offers_issued, applications_open=excluded.applications_open, converted_this_month=excluded.converted_this_month, lost_this_month=excluded.lost_this_month, overdue_followups=excluded.overdue_followups, duplicate_findings_open=excluded.duplicate_findings_open, metadata_json=public.ac360_school_admission_snapshots.metadata_json || excluded.metadata_json, created_at=now();

  if v_overdue > 0 then
    insert into public.ac360_school_admission_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'admissions.overdue_followups.'||current_date,'followup_overdue',case when v_overdue >= 10 then 'high' else 'medium' end,'Admissions follow-ups overdue',v_overdue || ' admissions follow-ups are overdue.',jsonb_build_object('count',v_overdue))
    on conflict(org_id,alert_key) do update set severity=excluded.severity, message=excluded.message, status='open', updated_at=now();
  end if;
  if v_dupes > 0 then
    insert into public.ac360_school_admission_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'admissions.duplicate_findings.'||current_date,'duplicate_lead','medium','Admissions duplicate findings',v_dupes || ' possible duplicate admission leads require review.',jsonb_build_object('count',v_dupes))
    on conflict(org_id,alert_key) do update set message=excluded.message, status='open', updated_at=now();
  end if;

  return jsonb_build_object('ok',true,'leads_open',v_open,'visits_scheduled',v_visits,'offers_issued',v_offers,'applications_open',v_apps,'converted_this_month',v_converted,'lost_this_month',v_lost,'overdue_followups',v_overdue,'duplicate_findings_open',v_dupes);
end $$;

create or replace function public.ac360_school_resolve_admission_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
begin
  update public.ac360_school_admission_alerts set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('resolution_note',p_resolution_note), updated_at=now() where id=p_alert_id and org_id=p_org_id;
  if not found then raise exception 'alert not found'; end if;
  return jsonb_build_object('ok',true,'alert_id',p_alert_id,'status','resolved');
end $$;

create or replace function public.ac360_school_admissions_dashboard(
  p_org_id uuid default null,
  p_campus_id uuid default null,
  p_as_of_date date default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_org_id uuid := p_org_id; v_snapshot jsonb; v_stage_counts jsonb; v_alerts jsonb; v_recent jsonb;
begin
  if v_org_id is null then select id into v_org_id from public.ac360_organizations where status in ('active','trial','grace') order by created_at asc limit 1; end if;
  if v_org_id is null then return jsonb_build_object('ok',false,'reason','No AC360 organization found.'); end if;

  perform public.ac360_school_reconcile_admissions(v_org_id,p_campus_id,null,'{"source":"dashboard_auto_reconcile"}'::jsonb);

  select to_jsonb(s) into v_snapshot from public.ac360_school_admission_snapshots s where s.org_id=v_org_id and (p_campus_id is null or s.campus_id=p_campus_id) and s.snapshot_date=coalesce(p_as_of_date,current_date) order by created_at desc limit 1;
  select coalesce(jsonb_agg(jsonb_build_object('lead_status',lead_status,'count',count)), '[]'::jsonb) into v_stage_counts from (select lead_status,count(*)::int from public.ac360_school_admission_leads where org_id=v_org_id and (p_campus_id is null or campus_id=p_campus_id) group by lead_status order by lead_status) q;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',alert_type,'severity',severity,'title',title,'message',message,'created_at',created_at) order by created_at desc), '[]'::jsonb) into v_alerts from public.ac360_school_admission_alerts where org_id=v_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('open','in_review') limit 20;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'lead_code',lead_code,'child_first_name',child_first_name,'lead_status',lead_status,'priority',priority,'created_at',created_at) order by created_at desc), '[]'::jsonb) into v_recent from (select * from public.ac360_school_admission_leads where org_id=v_org_id and (p_campus_id is null or campus_id=p_campus_id) order by created_at desc limit 20) l;

  return jsonb_build_object('ok',true,'org_id',v_org_id,'phase','phase_2h_admissions_crm','uiBuildAllowed',false,'snapshot',coalesce(v_snapshot,'{}'::jsonb),'stage_counts',v_stage_counts,'alerts',v_alerts,'recent_leads',v_recent);
end $$;

-- -----------------------------------------------------------------------------
-- 5. Action registry + real route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json)
values
('school.admissions.pipeline.ensure','admissions_basic','AC360-ENG-45','Ensure admissions pipeline','Create or repair default admissions pipeline and stages.','admissions.pipeline.ensure',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.lead.create','admissions_basic','AC360-ENG-45','Create admissions lead','Create admissions prospect/lead record.','admissions.lead.create',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.lead.stage.update','admissions_basic','AC360-ENG-45','Update admissions lead stage','Move lead through admissions pipeline.','admissions.lead.stage_update',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.guardian.link','admissions_basic','AC360-ENG-46','Link admissions guardian','Link guardian/contact to admissions lead.','admissions.guardian.link',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.visit.schedule','admissions_basic','AC360-ENG-45','Schedule admissions visit','Schedule school visit/call/assessment for admissions lead.','admissions.visit.schedule',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.visit.complete','admissions_basic','AC360-ENG-45','Complete admissions visit','Record visit result/no-show/cancelled status.','admissions.visit.complete',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.followup.create','admissions_basic','AC360-ENG-45','Create admissions follow-up','Create admissions follow-up action.','admissions.followup.create',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.followup.complete','admissions_basic','AC360-ENG-45','Complete admissions follow-up','Complete admissions follow-up action.','admissions.followup.complete',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.offer.generate','admissions_basic','AC360-ENG-49','Generate admissions offer','Generate admissions commercial offer.','admissions.offer.generate','report_generation',5,'require_topup','{"phase":"phase_2h"}'::jsonb),
('school.admissions.offer.decide','admissions_basic','AC360-ENG-49','Decide admissions offer','Accept/decline/expire admissions offer.','admissions.offer.decide',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.application.create','admissions_basic','AC360-ENG-45','Create enrollment application','Create application file from admissions lead.','admissions.application.create',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb),
('school.admissions.convert_to_student','admissions_basic','AC360-ENG-45','Convert lead to student','Convert admissions lead into active student and preserve source trace.','admissions.convert_to_student','student_capacity',0,'require_upgrade','{"phase":"phase_2h","capacity_key":"students"}'::jsonb),
('school.admissions.import_batch.create','admissions_advanced','AC360-ENG-45','Create admissions import batch','Create lead import batch for CSV/Excel ingestion.','admissions.import_batch.create','automation_credit',1,'require_topup','{"phase":"phase_2h","suggested_addon_key":"advanced_admissions"}'::jsonb),
('school.admissions.duplicate_scan','admissions_advanced','AC360-ENG-45','Scan duplicate admissions leads','Detect duplicate leads by phone/email/name/date of birth.','admissions.duplicate_scan','automation_credit',3,'require_topup','{"phase":"phase_2h","suggested_addon_key":"advanced_admissions"}'::jsonb),
('school.admissions.reconcile','admissions_basic','AC360-ENG-45','Reconcile admissions runtime','Reconcile admissions snapshots/alerts.','admissions.reconcile','automation_credit',5,'require_topup','{"phase":"phase_2h"}'::jsonb),
('school.admissions.alert.resolve','admissions_basic','AC360-ENG-45','Resolve admissions alert','Resolve admissions runtime alert.','admissions.alert.resolve',null,0,'require_upgrade','{"phase":"phase_2h"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_admissions.pipeline.ensure','/api/ac360/school-admissions/pipeline/ensure','POST','school.admissions.pipeline.ensure','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_pipelines','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Ensures admissions pipeline under AC360 guard.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.lead.create','/api/ac360/school-admissions/leads/create','POST','school.admissions.lead.create','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_leads','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Creates admissions lead under AC360 guard.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.lead.stage','/api/ac360/school-admissions/leads/stage','POST','school.admissions.lead.stage.update','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_leads','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Updates admissions lead stage.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.guardian.link','/api/ac360/school-admissions/guardians/link','POST','school.admissions.guardian.link','admissions_basic','AC360-ENG-46','angelcare_360_school_admissions','ac360_school_admission_lead_guardians','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Links guardian to admissions lead.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.visit.schedule','/api/ac360/school-admissions/visits/schedule','POST','school.admissions.visit.schedule','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_visits','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Schedules admissions visit.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.visit.complete','/api/ac360/school-admissions/visits/complete','POST','school.admissions.visit.complete','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_visits','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Completes admissions visit.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.followup.create','/api/ac360/school-admissions/followups/create','POST','school.admissions.followup.create','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_followups','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Creates admissions follow-up.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.followup.complete','/api/ac360/school-admissions/followups/complete','POST','school.admissions.followup.complete','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_followups','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Completes admissions follow-up.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.offer.generate','/api/ac360/school-admissions/offers/generate','POST','school.admissions.offer.generate','admissions_basic','AC360-ENG-49','angelcare_360_school_admissions','ac360_school_admission_offers','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Generates admissions offer.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.offer.decide','/api/ac360/school-admissions/offers/decide','POST','school.admissions.offer.decide','admissions_basic','AC360-ENG-49','angelcare_360_school_admissions','ac360_school_admission_offers','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Decides admissions offer.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.application.create','/api/ac360/school-admissions/applications/create','POST','school.admissions.application.create','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_enrollment_applications','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Creates enrollment application.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.convert','/api/ac360/school-admissions/convert','POST','school.admissions.convert_to_student','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_students','strict','fixed_1','request_or_generated','students','student.create','active','Converts admissions lead to student.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.import_batch.create','/api/ac360/school-admissions/import-batches/create','POST','school.admissions.import_batch.create','admissions_advanced','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_import_batches','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Creates admissions import batch.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.duplicate_scan','/api/ac360/school-admissions/duplicates/scan','POST','school.admissions.duplicate_scan','admissions_advanced','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_duplicate_findings','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Scans duplicate admissions leads.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.reconcile','/api/ac360/school-admissions/reconcile','POST','school.admissions.reconcile','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_snapshots','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Reconciles admissions runtime.','{"phase":"phase_2h"}'::jsonb),
('ac360.school_admissions.alert.resolve','/api/ac360/school-admissions/alerts/resolve','POST','school.admissions.alert.resolve','admissions_basic','AC360-ENG-45','angelcare_360_school_admissions','ac360_school_admission_alerts','strict','fixed_1','request_or_generated',null,'admissions.lead_create','active','Resolves admissions alert.','{"phase":"phase_2h"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

-- Phase 2 module coverage registry.
insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values('admissions_crm','AC360-ENG-45','admissions_basic','Admissions CRM, Leads, Visits & Enrollment Conversion Runtime','phase_2h_admissions_crm_leads_visits_conversion','guarded',array['ac360_school_admission_leads','ac360_school_admission_visits','ac360_school_admission_followups','ac360_school_admission_offers','ac360_school_enrollment_applications','ac360_school_admission_alerts'],array['school.admissions.pipeline.ensure','school.admissions.lead.create','school.admissions.lead.stage.update','school.admissions.guardian.link','school.admissions.visit.schedule','school.admissions.visit.complete','school.admissions.followup.create','school.admissions.followup.complete','school.admissions.offer.generate','school.admissions.offer.decide','school.admissions.application.create','school.admissions.convert_to_student','school.admissions.import_batch.create','school.admissions.duplicate_scan','school.admissions.reconcile','school.admissions.alert.resolve'],'{"phase":"phase_2h","uiBuildAllowed":false,"archiveNotDelete":true,"growthMenu":"advanced_admissions"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2h.admissions.no_ui_before_backend_gate','No admissions UI before backend gate','School Operations System','phase2h.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,180,'active','phase_2h_admissions_crm'),
('phase2h.admissions.guard_every_action','Every admissions action is guarded','School Operations System','school_admissions.action.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,181,'active','phase_2h_admissions_crm'),
('phase2h.admissions.convert_preserves_trace','Admissions conversion preserves source trace','School Operations System','school_admissions.convert_to_student','{"delete_strategy":"disabled"}'::jsonb,'{"archive_not_delete":true,"link_source_lead":true,"preserve_conversion_events":true}'::jsonb,182,'active','phase_2h_admissions_crm'),
('phase2h.admissions_recommend_advanced','Recommend advanced admissions when usage grows','School Operations System','school_admissions.high_volume','{"open_leads_threshold":50,"duplicates_threshold":5}'::jsonb,'{"recommend_addon":"advanced_admissions","create_growth_menu_prompt":true}'::jsonb,183,'active','phase_2h_admissions_crm')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

commit;
