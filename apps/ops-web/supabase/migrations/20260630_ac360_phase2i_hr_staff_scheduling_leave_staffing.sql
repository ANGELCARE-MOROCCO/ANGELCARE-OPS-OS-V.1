-- AngelCare 360 Phase 2I - HR, Staff Scheduling, Leave & Staffing Runtime
-- Ref: AC360-PH2I-HR-STAFF-SCHEDULING-LEAVE-STAFFING-2026-06-30
-- Scope: backend/system-only HR runtime. No HR UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2H school ops runtime.

begin;

create extension if not exists pgcrypto;

-- Compatibility safety inherited from Phase 1D/1E lineage.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. HR, staff scheduling, leave and staffing runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_hr_departments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  department_key text not null,
  label text not null,
  department_type text not null default 'operations',
  manager_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, department_key),
  check (department_type in ('direction','pedagogy','operations','finance','admissions','hr','transport','support','custom')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_staff_contracts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_profile_id uuid not null references public.ac360_school_staff_profiles(id) on delete cascade,
  contract_code text not null,
  contract_type text not null default 'employment',
  employment_status text not null default 'active',
  starts_on date not null default current_date,
  ends_on date,
  base_salary_mad numeric not null default 0,
  hourly_rate_mad numeric not null default 0,
  weekly_hours numeric not null default 0,
  probation_until date,
  document_id uuid,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, contract_code),
  check (contract_type in ('employment','service','internship','substitute','consultant','freelance','temporary','other')),
  check (employment_status in ('candidate','probation','active','paused','left','archived')),
  check (status in ('draft','active','expired','terminated','archived'))
);

create table if not exists public.ac360_school_shift_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  shift_key text not null,
  label text not null,
  starts_at time not null,
  ends_at time not null,
  break_minutes integer not null default 0,
  grace_minutes integer not null default 10,
  expected_hours numeric not null default 0,
  applies_to_department text,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, shift_key),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_staff_schedule_cycles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  cycle_key text not null,
  label text not null,
  cycle_type text not null default 'weekly',
  starts_on date not null,
  ends_on date not null,
  status text not null default 'draft',
  published_at timestamptz,
  locked_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, cycle_key),
  check (cycle_type in ('daily','weekly','monthly','event','holiday','custom')),
  check (status in ('draft','published','locked','archived'))
);

create table if not exists public.ac360_school_staff_shift_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  cycle_id uuid references public.ac360_school_staff_schedule_cycles(id) on delete set null,
  staff_profile_id uuid not null references public.ac360_school_staff_profiles(id) on delete cascade,
  shift_profile_id uuid references public.ac360_school_shift_profiles(id) on delete set null,
  assignment_code text not null,
  assignment_date date not null,
  starts_at timestamptz,
  ends_at timestamptz,
  assigned_role text,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  status text not null default 'scheduled',
  attendance_status text,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, assignment_code),
  check (status in ('draft','scheduled','confirmed','checked_in','completed','missed','cancelled','replaced','archived'))
);

create table if not exists public.ac360_school_leave_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  policy_key text not null,
  label text not null,
  leave_type text not null default 'annual',
  yearly_allowance_days numeric not null default 0,
  paid boolean not null default true,
  requires_approval boolean not null default true,
  carryover_allowed boolean not null default false,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, policy_key),
  check (leave_type in ('annual','sick','authorized_absence','training','maternity','family','unpaid','custom')),
  check (status in ('active','paused','archived'))
);

create table if not exists public.ac360_school_leave_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_profile_id uuid not null references public.ac360_school_staff_profiles(id) on delete cascade,
  policy_id uuid references public.ac360_school_leave_policies(id) on delete set null,
  request_code text not null,
  leave_type text not null default 'annual',
  starts_on date not null,
  ends_on date not null,
  total_days numeric not null default 1,
  status text not null default 'pending',
  reason text,
  requested_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  decision_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, request_code),
  check (leave_type in ('annual','sick','authorized_absence','training','maternity','family','unpaid','custom')),
  check (status in ('pending','approved','rejected','cancelled','archived'))
);

create table if not exists public.ac360_school_staffing_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  request_code text not null,
  request_type text not null default 'replacement',
  role_needed text not null,
  department text,
  needed_from date,
  needed_until date,
  priority text not null default 'medium',
  status text not null default 'open',
  requested_by uuid,
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  fulfilled_by_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  fulfilled_at timestamptz,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, request_code),
  check (request_type in ('replacement','substitute','new_hire','temporary_support','training_need','staffing_audit','custom')),
  check (priority in ('low','medium','high','urgent')),
  check (status in ('open','assigned','fulfilled','cancelled','archived'))
);

create table if not exists public.ac360_school_staff_evaluations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_profile_id uuid not null references public.ac360_school_staff_profiles(id) on delete cascade,
  evaluation_code text not null,
  evaluation_type text not null default 'monthly',
  period_start date,
  period_end date,
  score numeric not null default 0,
  strengths text,
  improvement_points text,
  status text not null default 'draft',
  evaluated_by uuid,
  decided_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, evaluation_code),
  check (evaluation_type in ('probation','monthly','quarterly','annual','incident_based','training_followup','custom')),
  check (status in ('draft','completed','reviewed','archived'))
);

create table if not exists public.ac360_school_hr_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  staff_profile_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  event_key text not null,
  event_type text not null default 'info',
  related_entity_type text,
  related_entity_id uuid,
  severity text not null default 'info',
  message text not null,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (event_type in ('info','schedule','leave','staffing','evaluation','contract','compliance','alert')),
  check (severity in ('info','low','medium','high','critical'))
);

create table if not exists public.ac360_school_hr_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  snapshot_date date not null default current_date,
  active_staff_count integer not null default 0,
  scheduled_shift_count integer not null default 0,
  pending_leave_count integer not null default 0,
  open_staffing_request_count integer not null default 0,
  active_contract_count integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, campus_id, snapshot_date)
);

create table if not exists public.ac360_school_hr_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  staff_profile_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  alert_key text not null,
  alert_type text not null default 'hr_attention',
  severity text not null default 'medium',
  title text not null,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  status text not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('hr_attention','leave_conflict','missing_contract','schedule_gap','staffing_gap','evaluation_due','compliance','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','resolved','dismissed','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Indexes, RLS and updated_at triggers
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_hr_departments_org on public.ac360_school_hr_departments(org_id,status);
create index if not exists idx_ac360_staff_contracts_staff on public.ac360_school_staff_contracts(org_id,staff_profile_id,status);
create index if not exists idx_ac360_shift_profiles_org on public.ac360_school_shift_profiles(org_id,status);
create index if not exists idx_ac360_schedule_cycles_org_dates on public.ac360_school_staff_schedule_cycles(org_id,starts_on,ends_on,status);
create index if not exists idx_ac360_shift_assignments_staff_date on public.ac360_school_staff_shift_assignments(org_id,staff_profile_id,assignment_date,status);
create index if not exists idx_ac360_leave_requests_staff_dates on public.ac360_school_leave_requests(org_id,staff_profile_id,starts_on,ends_on,status);
create index if not exists idx_ac360_staffing_requests_org on public.ac360_school_staffing_requests(org_id,status,priority);
create index if not exists idx_ac360_staff_evaluations_staff on public.ac360_school_staff_evaluations(org_id,staff_profile_id,status);
create index if not exists idx_ac360_hr_events_org on public.ac360_school_hr_events(org_id,created_at desc,severity);
create index if not exists idx_ac360_hr_alerts_org on public.ac360_school_hr_alerts(org_id,status,severity);

alter table public.ac360_school_hr_departments enable row level security;
alter table public.ac360_school_staff_contracts enable row level security;
alter table public.ac360_school_shift_profiles enable row level security;
alter table public.ac360_school_staff_schedule_cycles enable row level security;
alter table public.ac360_school_staff_shift_assignments enable row level security;
alter table public.ac360_school_leave_policies enable row level security;
alter table public.ac360_school_leave_requests enable row level security;
alter table public.ac360_school_staffing_requests enable row level security;
alter table public.ac360_school_staff_evaluations enable row level security;
alter table public.ac360_school_hr_events enable row level security;
alter table public.ac360_school_hr_snapshots enable row level security;
alter table public.ac360_school_hr_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_hr_departments','ac360_school_staff_contracts','ac360_school_shift_profiles','ac360_school_staff_schedule_cycles','ac360_school_staff_shift_assignments','ac360_school_leave_policies','ac360_school_leave_requests','ac360_school_staffing_requests','ac360_school_staff_evaluations','ac360_school_hr_events','ac360_school_hr_snapshots','ac360_school_hr_alerts'
  ] loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['ac360_school_hr_departments','ac360_school_staff_contracts','ac360_school_shift_profiles','ac360_school_staff_schedule_cycles','ac360_school_staff_shift_assignments','ac360_school_leave_policies','ac360_school_leave_requests','ac360_school_staffing_requests','ac360_school_staff_evaluations','ac360_school_hr_alerts'] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. HR runtime RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_hr_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_active_staff integer := 0;
  v_scheduled_today integer := 0;
  v_pending_leaves integer := 0;
  v_open_staffing integer := 0;
  v_missing_contracts integer := 0;
  v_open_alerts integer := 0;
begin
  select count(*) into v_active_staff from public.ac360_school_staff_profiles s where s.org_id=p_org_id and s.status='active' and s.employment_status in ('active','probation') and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_scheduled_today from public.ac360_school_staff_shift_assignments a where a.org_id=p_org_id and a.assignment_date=coalesce(p_as_of_date,current_date) and a.status in ('scheduled','confirmed','checked_in') and (p_campus_id is null or a.campus_id=p_campus_id);
  select count(*) into v_pending_leaves from public.ac360_school_leave_requests lr join public.ac360_school_staff_profiles s on s.id=lr.staff_profile_id where lr.org_id=p_org_id and lr.status='pending' and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_open_staffing from public.ac360_school_staffing_requests r where r.org_id=p_org_id and r.status in ('open','assigned') and (p_campus_id is null or r.campus_id=p_campus_id);
  select count(*) into v_missing_contracts from public.ac360_school_staff_profiles s left join public.ac360_school_staff_contracts c on c.staff_profile_id=s.id and c.status='active' where s.org_id=p_org_id and s.status='active' and s.employment_status in ('active','probation') and c.id is null and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_open_alerts from public.ac360_school_hr_alerts a where a.org_id=p_org_id and a.status='open' and (p_campus_id is null or a.campus_id=p_campus_id);

  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2i_hr_staff_scheduling_leave_staffing',
    'uiBuildAllowed', false,
    'asOfDate', coalesce(p_as_of_date,current_date),
    'summary', jsonb_build_object(
      'activeStaff', v_active_staff,
      'scheduledToday', v_scheduled_today,
      'pendingLeaveRequests', v_pending_leaves,
      'openStaffingRequests', v_open_staffing,
      'missingContracts', v_missing_contracts,
      'openAlerts', v_open_alerts
    ),
    'latestAlerts', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select id, alert_key, alert_type, severity, title, message, created_at from public.ac360_school_hr_alerts where org_id=p_org_id and status='open' and (p_campus_id is null or campus_id=p_campus_id) order by created_at desc limit 20) x), '[]'::jsonb)
  );
end $$;

create or replace function public.ac360_school_upsert_hr_department(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_department_key text default null,
  p_label text default null,
  p_department_type text default 'operations',
  p_manager_staff_id uuid default null,
  p_status text default 'active',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text := coalesce(nullif(trim(p_department_key),''),'dept-' || substr(gen_random_uuid()::text,1,8));
begin
  insert into public.ac360_school_hr_departments(org_id,campus_id,department_key,label,department_type,manager_staff_id,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),v_key),coalesce(p_department_type,'operations'),p_manager_staff_id,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,department_key) do update set campus_id=excluded.campus_id,label=excluded.label,department_type=excluded.department_type,manager_staff_id=excluded.manager_staff_id,status=excluded.status,metadata_json=public.ac360_school_hr_departments.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  insert into public.ac360_school_hr_events(org_id,campus_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_campus_id,'hr.department.upsert','info','hr_department',v_id,'info','HR department upserted.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'departmentId',v_id);
end $$;

create or replace function public.ac360_school_upsert_staff_contract(
  p_org_id uuid,
  p_staff_profile_id uuid,
  p_contract_code text default null,
  p_contract_type text default 'employment',
  p_employment_status text default 'active',
  p_starts_on date default current_date,
  p_ends_on date default null,
  p_base_salary_mad numeric default 0,
  p_hourly_rate_mad numeric default 0,
  p_weekly_hours numeric default 0,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := coalesce(nullif(trim(p_contract_code),''),'CTR-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6));
begin
  if p_staff_profile_id is null then return jsonb_build_object('ok',false,'error','staffProfileId is required.'); end if;
  insert into public.ac360_school_staff_contracts(org_id,staff_profile_id,contract_code,contract_type,employment_status,starts_on,ends_on,base_salary_mad,hourly_rate_mad,weekly_hours,status,created_by,metadata_json)
  values(p_org_id,p_staff_profile_id,v_code,coalesce(p_contract_type,'employment'),coalesce(p_employment_status,'active'),coalesce(p_starts_on,current_date),p_ends_on,greatest(coalesce(p_base_salary_mad,0),0),greatest(coalesce(p_hourly_rate_mad,0),0),greatest(coalesce(p_weekly_hours,0),0),'active',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,contract_code) do update set staff_profile_id=excluded.staff_profile_id,contract_type=excluded.contract_type,employment_status=excluded.employment_status,starts_on=excluded.starts_on,ends_on=excluded.ends_on,base_salary_mad=excluded.base_salary_mad,hourly_rate_mad=excluded.hourly_rate_mad,weekly_hours=excluded.weekly_hours,metadata_json=public.ac360_school_staff_contracts.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  update public.ac360_school_staff_profiles set employment_status=coalesce(p_employment_status,employment_status), updated_at=now() where id=p_staff_profile_id and org_id=p_org_id;
  insert into public.ac360_school_hr_events(org_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_staff_profile_id,'hr.contract.upsert','contract','staff_contract',v_id,'info','Staff contract upserted.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'contractId',v_id);
end $$;

create or replace function public.ac360_school_upsert_shift_profile(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_shift_key text default null,
  p_label text default null,
  p_starts_at time default '08:00',
  p_ends_at time default '17:00',
  p_break_minutes integer default 0,
  p_grace_minutes integer default 10,
  p_expected_hours numeric default 0,
  p_applies_to_department text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text := coalesce(nullif(trim(p_shift_key),''),'shift-' || substr(gen_random_uuid()::text,1,8));
begin
  insert into public.ac360_school_shift_profiles(org_id,campus_id,shift_key,label,starts_at,ends_at,break_minutes,grace_minutes,expected_hours,applies_to_department,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),v_key),coalesce(p_starts_at,'08:00'),coalesce(p_ends_at,'17:00'),greatest(coalesce(p_break_minutes,0),0),greatest(coalesce(p_grace_minutes,0),0),greatest(coalesce(p_expected_hours,0),0),p_applies_to_department,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,shift_key) do update set campus_id=excluded.campus_id,label=excluded.label,starts_at=excluded.starts_at,ends_at=excluded.ends_at,break_minutes=excluded.break_minutes,grace_minutes=excluded.grace_minutes,expected_hours=excluded.expected_hours,applies_to_department=excluded.applies_to_department,metadata_json=public.ac360_school_shift_profiles.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'shiftProfileId',v_id);
end $$;

create or replace function public.ac360_school_open_staff_schedule_cycle(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_cycle_key text default null,
  p_label text default null,
  p_cycle_type text default 'weekly',
  p_starts_on date default current_date,
  p_ends_on date default current_date,
  p_status text default 'draft',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text := coalesce(nullif(trim(p_cycle_key),''),'cycle-' || to_char(coalesce(p_starts_on,current_date),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6));
begin
  insert into public.ac360_school_staff_schedule_cycles(org_id,campus_id,cycle_key,label,cycle_type,starts_on,ends_on,status,published_at,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),v_key),coalesce(p_cycle_type,'weekly'),coalesce(p_starts_on,current_date),coalesce(p_ends_on,coalesce(p_starts_on,current_date)),coalesce(p_status,'draft'),case when p_status='published' then now() else null end,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,cycle_key) do update set campus_id=excluded.campus_id,label=excluded.label,cycle_type=excluded.cycle_type,starts_on=excluded.starts_on,ends_on=excluded.ends_on,status=excluded.status,published_at=coalesce(public.ac360_school_staff_schedule_cycles.published_at, excluded.published_at),metadata_json=public.ac360_school_staff_schedule_cycles.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'cycleId',v_id);
end $$;

create or replace function public.ac360_school_assign_staff_shift(
  p_org_id uuid,
  p_staff_profile_id uuid,
  p_campus_id uuid default null,
  p_cycle_id uuid default null,
  p_shift_profile_id uuid default null,
  p_assignment_date date default current_date,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_assigned_role text default null,
  p_class_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := 'SHF-' || to_char(coalesce(p_assignment_date,current_date),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,8);
begin
  if p_staff_profile_id is null then return jsonb_build_object('ok',false,'error','staffProfileId is required.'); end if;
  insert into public.ac360_school_staff_shift_assignments(org_id,campus_id,cycle_id,staff_profile_id,shift_profile_id,assignment_code,assignment_date,starts_at,ends_at,assigned_role,class_id,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,p_cycle_id,p_staff_profile_id,p_shift_profile_id,v_code,coalesce(p_assignment_date,current_date),p_starts_at,p_ends_at,p_assigned_role,p_class_id,'scheduled',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning id into v_id;
  insert into public.ac360_school_hr_events(org_id,campus_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_campus_id,p_staff_profile_id,'hr.shift.assign','schedule','staff_shift_assignment',v_id,'info','Staff shift assigned.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'assignmentId',v_id);
end $$;

create or replace function public.ac360_school_update_staff_shift_status(
  p_org_id uuid,
  p_assignment_id uuid,
  p_status text,
  p_attendance_status text default null,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.ac360_school_staff_shift_assignments%rowtype;
begin
  if p_assignment_id is null then return jsonb_build_object('ok',false,'error','assignmentId is required.'); end if;
  update public.ac360_school_staff_shift_assignments set status=coalesce(p_status,status), attendance_status=coalesce(p_attendance_status,attendance_status), notes=coalesce(p_reason,notes), updated_at=now(), metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb) where id=p_assignment_id and org_id=p_org_id returning * into v_row;
  if v_row.id is null then return jsonb_build_object('ok',false,'error','Shift assignment not found.'); end if;
  insert into public.ac360_school_hr_events(org_id,campus_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,v_row.campus_id,v_row.staff_profile_id,'hr.shift.status.update','schedule','staff_shift_assignment',v_row.id,'info','Staff shift status updated to ' || coalesce(p_status,'unchanged') || '.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'assignmentId',v_row.id,'status',v_row.status);
end $$;

create or replace function public.ac360_school_upsert_leave_policy(
  p_org_id uuid,
  p_policy_key text default null,
  p_label text default null,
  p_leave_type text default 'annual',
  p_yearly_allowance_days numeric default 0,
  p_paid boolean default true,
  p_requires_approval boolean default true,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_key text := coalesce(nullif(trim(p_policy_key),''),'leave-' || coalesce(p_leave_type,'annual'));
begin
  insert into public.ac360_school_leave_policies(org_id,policy_key,label,leave_type,yearly_allowance_days,paid,requires_approval,created_by,metadata_json)
  values(p_org_id,v_key,coalesce(nullif(trim(p_label),''),v_key),coalesce(p_leave_type,'annual'),greatest(coalesce(p_yearly_allowance_days,0),0),coalesce(p_paid,true),coalesce(p_requires_approval,true),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,policy_key) do update set label=excluded.label,leave_type=excluded.leave_type,yearly_allowance_days=excluded.yearly_allowance_days,paid=excluded.paid,requires_approval=excluded.requires_approval,metadata_json=public.ac360_school_leave_policies.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'policyId',v_id);
end $$;

create or replace function public.ac360_school_create_leave_request(
  p_org_id uuid,
  p_staff_profile_id uuid,
  p_policy_id uuid default null,
  p_leave_type text default 'annual',
  p_starts_on date default current_date,
  p_ends_on date default current_date,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := 'LV-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6); v_days numeric;
begin
  if p_staff_profile_id is null then return jsonb_build_object('ok',false,'error','staffProfileId is required.'); end if;
  v_days := greatest((coalesce(p_ends_on,p_starts_on,current_date) - coalesce(p_starts_on,current_date) + 1),1);
  insert into public.ac360_school_leave_requests(org_id,staff_profile_id,policy_id,request_code,leave_type,starts_on,ends_on,total_days,status,reason,requested_by,metadata_json)
  values(p_org_id,p_staff_profile_id,p_policy_id,v_code,coalesce(p_leave_type,'annual'),coalesce(p_starts_on,current_date),coalesce(p_ends_on,coalesce(p_starts_on,current_date)),v_days,'pending',p_reason,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_hr_events(org_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_staff_profile_id,'hr.leave_request.create','leave','leave_request',v_id,'medium','Leave request created.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'leaveRequestId',v_id,'totalDays',v_days);
end $$;

create or replace function public.ac360_school_decide_leave_request(
  p_org_id uuid,
  p_leave_request_id uuid,
  p_decision text,
  p_decision_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.ac360_school_leave_requests%rowtype; v_status text := case when lower(coalesce(p_decision,'')) in ('approve','approved') then 'approved' when lower(coalesce(p_decision,'')) in ('reject','rejected') then 'rejected' else coalesce(p_decision,'pending') end;
begin
  update public.ac360_school_leave_requests set status=v_status, decided_by=p_actor_app_user_id, decided_at=now(), decision_note=p_decision_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_leave_request_id and org_id=p_org_id returning * into v_row;
  if v_row.id is null then return jsonb_build_object('ok',false,'error','Leave request not found.'); end if;
  insert into public.ac360_school_hr_events(org_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,v_row.staff_profile_id,'hr.leave_request.decide','leave','leave_request',v_row.id,'medium','Leave request ' || v_status || '.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'leaveRequestId',v_row.id,'status',v_status);
end $$;

create or replace function public.ac360_school_open_staffing_request(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_request_type text default 'replacement',
  p_role_needed text default null,
  p_department text default null,
  p_needed_from date default null,
  p_needed_until date default null,
  p_priority text default 'medium',
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := 'STF-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6);
begin
  insert into public.ac360_school_staffing_requests(org_id,campus_id,request_code,request_type,role_needed,department,needed_from,needed_until,priority,status,requested_by,notes,metadata_json)
  values(p_org_id,p_campus_id,v_code,coalesce(p_request_type,'replacement'),coalesce(nullif(trim(p_role_needed),''),'Staff support'),p_department,p_needed_from,p_needed_until,coalesce(p_priority,'medium'),'open',p_actor_app_user_id,p_notes,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_hr_events(org_id,campus_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_campus_id,'hr.staffing_request.open','staffing','staffing_request',v_id,'high','Staffing request opened.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'staffingRequestId',v_id);
end $$;

create or replace function public.ac360_school_fulfill_staffing_request(
  p_org_id uuid,
  p_staffing_request_id uuid,
  p_fulfilled_by_staff_id uuid default null,
  p_status text default 'fulfilled',
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.ac360_school_staffing_requests%rowtype;
begin
  update public.ac360_school_staffing_requests set fulfilled_by_staff_id=p_fulfilled_by_staff_id, status=coalesce(p_status,'fulfilled'), fulfilled_at=case when coalesce(p_status,'fulfilled')='fulfilled' then now() else fulfilled_at end, notes=coalesce(p_notes,notes), metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_staffing_request_id and org_id=p_org_id returning * into v_row;
  if v_row.id is null then return jsonb_build_object('ok',false,'error','Staffing request not found.'); end if;
  insert into public.ac360_school_hr_events(org_id,campus_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,v_row.campus_id,p_fulfilled_by_staff_id,'hr.staffing_request.fulfill','staffing','staffing_request',v_row.id,'medium','Staffing request updated to ' || v_row.status || '.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'staffingRequestId',v_row.id,'status',v_row.status);
end $$;

create or replace function public.ac360_school_create_staff_evaluation(
  p_org_id uuid,
  p_staff_profile_id uuid,
  p_evaluation_type text default 'monthly',
  p_period_start date default null,
  p_period_end date default null,
  p_score numeric default 0,
  p_strengths text default null,
  p_improvement_points text default null,
  p_status text default 'completed',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_code text := 'EVAL-' || to_char(now(),'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text,1,6);
begin
  if p_staff_profile_id is null then return jsonb_build_object('ok',false,'error','staffProfileId is required.'); end if;
  insert into public.ac360_school_staff_evaluations(org_id,staff_profile_id,evaluation_code,evaluation_type,period_start,period_end,score,strengths,improvement_points,status,evaluated_by,decided_at,metadata_json)
  values(p_org_id,p_staff_profile_id,v_code,coalesce(p_evaluation_type,'monthly'),p_period_start,p_period_end,greatest(coalesce(p_score,0),0),p_strengths,p_improvement_points,coalesce(p_status,'completed'),p_actor_app_user_id,now(),coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_hr_events(org_id,staff_profile_id,event_key,event_type,related_entity_type,related_entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_staff_profile_id,'hr.evaluation.create','evaluation','staff_evaluation',v_id,'info','Staff evaluation created.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'evaluationId',v_id);
end $$;

create or replace function public.ac360_school_reconcile_hr(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_active integer:=0; v_sched integer:=0; v_leave integer:=0; v_staffing integer:=0; v_contracts integer:=0; v_missing integer:=0; v_alert_id uuid;
begin
  select count(*) into v_active from public.ac360_school_staff_profiles where org_id=p_org_id and status='active' and employment_status in ('active','probation') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_sched from public.ac360_school_staff_shift_assignments where org_id=p_org_id and assignment_date=current_date and status in ('scheduled','confirmed','checked_in') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_leave from public.ac360_school_leave_requests lr join public.ac360_school_staff_profiles s on s.id=lr.staff_profile_id where lr.org_id=p_org_id and lr.status='pending' and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_staffing from public.ac360_school_staffing_requests where org_id=p_org_id and status in ('open','assigned') and (p_campus_id is null or campus_id=p_campus_id);
  select count(*) into v_contracts from public.ac360_school_staff_contracts c join public.ac360_school_staff_profiles s on s.id=c.staff_profile_id where c.org_id=p_org_id and c.status='active' and (p_campus_id is null or s.campus_id=p_campus_id);
  select count(*) into v_missing from public.ac360_school_staff_profiles s left join public.ac360_school_staff_contracts c on c.staff_profile_id=s.id and c.status='active' where s.org_id=p_org_id and s.status='active' and s.employment_status in ('active','probation') and c.id is null and (p_campus_id is null or s.campus_id=p_campus_id);

  insert into public.ac360_school_hr_snapshots(org_id,campus_id,snapshot_date,active_staff_count,scheduled_shift_count,pending_leave_count,open_staffing_request_count,active_contract_count,metadata_json)
  values(p_org_id,p_campus_id,current_date,v_active,v_sched,v_leave,v_staffing,v_contracts,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,campus_id,snapshot_date) do update set active_staff_count=excluded.active_staff_count,scheduled_shift_count=excluded.scheduled_shift_count,pending_leave_count=excluded.pending_leave_count,open_staffing_request_count=excluded.open_staffing_request_count,active_contract_count=excluded.active_contract_count,metadata_json=public.ac360_school_hr_snapshots.metadata_json || excluded.metadata_json;

  if v_missing > 0 then
    insert into public.ac360_school_hr_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'missing_contracts-' || coalesce(p_campus_id::text,'all'),'missing_contract','high','Staff contracts missing',v_missing || ' active staff profile(s) have no active contract.',jsonb_build_object('missingContracts',v_missing))
    on conflict(org_id,alert_key) do update set status='open',severity=excluded.severity,title=excluded.title,message=excluded.message,metadata_json=public.ac360_school_hr_alerts.metadata_json || excluded.metadata_json,updated_at=now()
    returning id into v_alert_id;
  end if;

  if v_staffing > 0 then
    insert into public.ac360_school_hr_alerts(org_id,campus_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'open_staffing-' || coalesce(p_campus_id::text,'all'),'staffing_gap','medium','Open staffing requests',v_staffing || ' staffing request(s) remain open.',jsonb_build_object('openStaffingRequests',v_staffing))
    on conflict(org_id,alert_key) do update set status='open',severity=excluded.severity,title=excluded.title,message=excluded.message,metadata_json=public.ac360_school_hr_alerts.metadata_json || excluded.metadata_json,updated_at=now();
  end if;

  insert into public.ac360_school_hr_events(org_id,campus_id,event_key,event_type,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_campus_id,'hr.reconcile','compliance','info','HR runtime reconciled.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'activeStaff',v_active,'scheduledToday',v_sched,'pendingLeaves',v_leave,'openStaffingRequests',v_staffing,'missingContracts',v_missing);
end $$;

create or replace function public.ac360_school_resolve_hr_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  update public.ac360_school_hr_alerts set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb) || jsonb_build_object('resolutionNote',p_resolution_note), updated_at=now() where id=p_alert_id and org_id=p_org_id returning id into v_id;
  if v_id is null then return jsonb_build_object('ok',false,'error','HR alert not found.'); end if;
  return jsonb_build_object('ok',true,'alertId',v_id,'status','resolved');
end $$;

-- -----------------------------------------------------------------------------
-- 4. Action registry and real route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('school.hr.department.upsert','hr_staffing','AC360-ENG-52','Upsert HR department','Create or update HR/department structure.','hr.department.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.contract.upsert','hr_staffing','AC360-ENG-52','Upsert staff contract','Create or update staff contract/governance record.','hr.contract.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.shift_profile.upsert','hr_staffing','AC360-ENG-52','Upsert shift profile','Create or update staff shift policy/profile.','hr.shift_profile.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.schedule_cycle.open','hr_staffing','AC360-ENG-52','Open schedule cycle','Open/publish staff schedule cycle.','hr.schedule_cycle.open',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.shift.assign','hr_staffing','AC360-ENG-52','Assign staff shift','Assign one staff shift under guarded HR runtime.','hr.shift.assign',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.shift.status.update','hr_staffing','AC360-ENG-52','Update shift status','Update staff shift status while preserving event history.','hr.shift.status.update',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.leave_policy.upsert','hr_staffing','AC360-ENG-52','Upsert leave policy','Create or update staff leave policy.','hr.leave_policy.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.leave_request.create','hr_staffing','AC360-ENG-52','Create leave request','Create staff leave request.','hr.leave_request.create',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.leave_request.decide','hr_staffing','AC360-ENG-52','Decide leave request','Approve/reject leave request.','hr.leave_request.decide',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.staffing_request.open','hr_staffing','AC360-ENG-52','Open staffing request','Open replacement/substitute/new hire staffing request.','hr.staffing_request.open',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.staffing_request.fulfill','hr_staffing','AC360-ENG-52','Fulfill staffing request','Assign or fulfill staff replacement request.','hr.staffing_request.fulfill',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.evaluation.create','hr_staffing','AC360-ENG-52','Create staff evaluation','Create staff evaluation record.','hr.evaluation.create',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.compliance.reconcile','hr_staffing','AC360-ENG-52','Reconcile HR runtime','Refresh HR snapshots, compliance and staffing alerts.','hr.compliance.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb),
('school.hr.alert.resolve','hr_staffing','AC360-ENG-52','Resolve HR alert','Resolve HR/staffing alert.','hr.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2i_hr_staffing","suggested_addon_key":"hr_staffing"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_hr.department.upsert','/api/ac360/school-hr/departments/upsert','POST','school.hr.department.upsert','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_hr_departments','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Upserts HR department under AC360 HR guard.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.contract.upsert','/api/ac360/school-hr/contracts/upsert','POST','school.hr.contract.upsert','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staff_contracts','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Upserts staff contract under AC360 HR guard.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.shift_profile.upsert','/api/ac360/school-hr/shift-profiles/upsert','POST','school.hr.shift_profile.upsert','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_shift_profiles','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Upserts shift profile under AC360 HR guard.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.schedule_cycle.open','/api/ac360/school-hr/schedule-cycles/open','POST','school.hr.schedule_cycle.open','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staff_schedule_cycles','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Opens schedule cycle under AC360 HR guard.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.shift.assign','/api/ac360/school-hr/shifts/assign','POST','school.hr.shift.assign','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staff_shift_assignments','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Assigns staff shift under AC360 HR guard.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.shift.status','/api/ac360/school-hr/shifts/status','POST','school.hr.shift.status.update','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staff_shift_assignments','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Updates staff shift status.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.leave_policy.upsert','/api/ac360/school-hr/leave-policies/upsert','POST','school.hr.leave_policy.upsert','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_leave_policies','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Upserts leave policy.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.leave_request.create','/api/ac360/school-hr/leave-requests/create','POST','school.hr.leave_request.create','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_leave_requests','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Creates leave request.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.leave_request.decide','/api/ac360/school-hr/leave-requests/decide','POST','school.hr.leave_request.decide','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_leave_requests','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Decides leave request.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.staffing_request.open','/api/ac360/school-hr/staffing-requests/open','POST','school.hr.staffing_request.open','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staffing_requests','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Opens staffing request.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.staffing_request.fulfill','/api/ac360/school-hr/staffing-requests/fulfill','POST','school.hr.staffing_request.fulfill','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staffing_requests','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Fulfills staffing request.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.evaluation.create','/api/ac360/school-hr/evaluations/create','POST','school.hr.evaluation.create','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_staff_evaluations','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Creates staff evaluation.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.compliance.reconcile','/api/ac360/school-hr/compliance/reconcile','POST','school.hr.compliance.reconcile','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_hr_snapshots','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Reconciles HR runtime.','{"phase":"phase_2i"}'::jsonb),
('ac360.school_hr.alert.resolve','/api/ac360/school-hr/alerts/resolve','POST','school.hr.alert.resolve','hr_staffing','AC360-ENG-52','angelcare_360_school_hr','ac360_school_hr_alerts','strict','fixed_1','request_or_generated',null,'hr.recruitment_create','active','Resolves HR alert.','{"phase":"phase_2i"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

-- Phase 2 module coverage registry.
insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values('hr_staff_scheduling_leave_staffing','AC360-ENG-52','hr_staffing','HR, Staff Scheduling, Leave & Staffing Runtime','phase_2i_hr_staff_scheduling_leave_staffing','guarded',array['ac360_school_hr_departments','ac360_school_staff_contracts','ac360_school_shift_profiles','ac360_school_staff_schedule_cycles','ac360_school_staff_shift_assignments','ac360_school_leave_requests','ac360_school_staffing_requests','ac360_school_staff_evaluations','ac360_school_hr_alerts'],array['school.hr.department.upsert','school.hr.contract.upsert','school.hr.shift_profile.upsert','school.hr.schedule_cycle.open','school.hr.shift.assign','school.hr.shift.status.update','school.hr.leave_policy.upsert','school.hr.leave_request.create','school.hr.leave_request.decide','school.hr.staffing_request.open','school.hr.staffing_request.fulfill','school.hr.evaluation.create','school.hr.compliance.reconcile','school.hr.alert.resolve'],'{"phase":"phase_2i","uiBuildAllowed":false,"archiveNotDelete":true,"growthMenu":"hr_staffing"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2i.hr.no_ui_before_backend_gate','No HR UI before backend gate','School Operations System','phase2i.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,190,'active','phase_2i_hr_staffing'),
('phase2i.hr.guard_every_action','Every HR action is guarded','School Operations System','school_hr.action.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,191,'active','phase_2i_hr_staffing'),
('phase2i.hr.archive_not_delete','HR records preserve trace and avoid delete','School Operations System','school_hr.record.lifecycle','{"delete_strategy":"disabled"}'::jsonb,'{"archive_not_delete":true,"preserve_events":true}'::jsonb,192,'active','phase_2i_hr_staffing'),
('phase2i.hr_recommend_staffing','Recommend HR Staffing when gaps appear','School Operations System','school_hr.staffing_gap','{"open_staffing_threshold":1,"missing_contract_threshold":1}'::jsonb,'{"recommend_addon":"hr_staffing","create_growth_menu_prompt":true}'::jsonb,193,'active','phase_2i_hr_staffing')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

commit;
