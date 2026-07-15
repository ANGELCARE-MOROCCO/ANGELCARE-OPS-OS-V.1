-- AngelCare 360 — Operations Source-of-Truth Step 1
-- Purpose: create the real operations runtime backbone feeding Operations workspace and Cockpit de Direction.
-- Scope: operational days, sites, classes/capacity, routines, incidents, tasks, staff coverage, transport events, quality checks, closures and audit proof.

begin;

create extension if not exists pgcrypto;

create table if not exists public.ac360_ops_sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_code text not null,
  site_name text not null,
  city text null,
  address_text text null,
  responsible_label text null,
  capacity_children integer not null default 0 check (capacity_children >= 0),
  status text not null default 'active' check (status in ('active','opening','paused','closed','archived')),
  opening_time time null,
  closing_time time null,
  operational_rules jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, site_code)
);

create table if not exists public.ac360_ops_days (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  scope_key text not null default 'network',
  operational_date date not null default current_date,
  day_code text not null,
  status text not null default 'draft' check (status in ('draft','open','in_progress','waiting_closure','closed','reopened','cancelled','archived')),
  opened_at timestamptz null,
  opened_by uuid null,
  closed_at timestamptz null,
  closed_by uuid null,
  readiness_json jsonb not null default '{}'::jsonb,
  closure_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, scope_key, operational_date)
);

create table if not exists public.ac360_ops_classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_code text not null,
  class_name text not null,
  age_group text null,
  room_label text null,
  capacity_max integer not null default 0 check (capacity_max >= 0),
  staff_required integer not null default 1 check (staff_required >= 0),
  responsible_label text null,
  status text not null default 'active' check (status in ('active','paused','closed','archived')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, class_code)
);

create table if not exists public.ac360_ops_class_capacity_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_id uuid null references public.ac360_ops_classes(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  snapshot_date date not null default current_date,
  children_expected integer not null default 0 check (children_expected >= 0),
  children_present integer not null default 0 check (children_present >= 0),
  staff_expected integer not null default 0 check (staff_expected >= 0),
  staff_present integer not null default 0 check (staff_present >= 0),
  occupancy_rate numeric(7,2) not null default 0,
  staff_coverage_rate numeric(7,2) not null default 0,
  ratio_label text null,
  pressure_status text not null default 'normal' check (pressure_status in ('normal','watch','under_staffed','over_capacity','critical','closed')),
  notes text null,
  proof_reference text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  unique(org_id, class_id, snapshot_date)
);

create table if not exists public.ac360_ops_routine_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  template_code text not null,
  label text not null,
  category text not null default 'routine' check (category in ('arrival','attendance','pedagogy','meal','hygiene','nap','departure','cleaning','safety','parent_communication','routine','other')),
  default_time time null,
  proof_required boolean not null default false,
  escalation_minutes integer not null default 30 check (escalation_minutes >= 0),
  status text not null default 'active' check (status in ('active','paused','archived')),
  instructions text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, template_code)
);

create table if not exists public.ac360_ops_routine_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_id uuid null references public.ac360_ops_classes(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  template_id uuid null references public.ac360_ops_routine_templates(id) on delete set null,
  event_code text not null,
  label text not null,
  category text not null default 'routine',
  status text not null default 'planned' check (status in ('planned','in_progress','completed','late','blocked','cancelled','skipped','archived')),
  scheduled_at timestamptz null,
  started_at timestamptz null,
  completed_at timestamptz null,
  owner_label text null,
  delay_minutes integer not null default 0,
  proof_reference text null,
  notes text null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, event_code)
);

create table if not exists public.ac360_ops_incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_id uuid null references public.ac360_ops_classes(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  incident_code text not null,
  title text not null,
  category text not null default 'operational' check (category in ('child_health','safety','hygiene','meal','transport','parent','staff','infrastructure','pedagogy','operational','other')),
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','assigned','in_progress','waiting_parent','waiting_proof','escalated','resolved','closed','cancelled','archived')),
  child_label text null,
  owner_label text null,
  immediate_action text null,
  parent_notification_required boolean not null default false,
  escalated_to_direction boolean not null default false,
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz null,
  closed_at timestamptz null,
  proof_reference text null,
  description text null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, incident_code)
);

create table if not exists public.ac360_ops_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_id uuid null references public.ac360_ops_classes(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  task_code text not null,
  title text not null,
  task_type text not null default 'operational' check (task_type in ('operational','routine','incident_followup','staffing','transport','quality','closure','reporting','other')),
  priority text not null default 'normal' check (priority in ('low','normal','medium','high','critical')),
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','late','waiting_validation','completed','cancelled','archived')),
  owner_label text null,
  due_at timestamptz null,
  source_entity_type text null,
  source_entity_id uuid null,
  proof_required boolean not null default false,
  proof_reference text null,
  notes text null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, task_code)
);

create table if not exists public.ac360_ops_staff_coverage (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_id uuid null references public.ac360_ops_classes(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  coverage_date date not null default current_date,
  role_label text not null default 'Équipe terrain',
  staff_expected integer not null default 0 check (staff_expected >= 0),
  staff_present integer not null default 0 check (staff_present >= 0),
  staff_absent integer not null default 0 check (staff_absent >= 0),
  replacements_needed integer not null default 0 check (replacements_needed >= 0),
  overtime_hours numeric(8,2) not null default 0,
  coverage_status text not null default 'normal' check (coverage_status in ('normal','watch','under_covered','critical','closed')),
  owner_label text null,
  proof_reference text null,
  notes text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, site_id, class_id, role_label, coverage_date)
);

create table if not exists public.ac360_ops_transport_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  transport_code text not null,
  route_label text not null,
  event_type text not null default 'status' check (event_type in ('departure','arrival','delay','incident','pickup_issue','dropoff_issue','safety_check','closure','status')),
  status text not null default 'open' check (status in ('planned','open','in_progress','resolved','closed','cancelled','archived')),
  delay_minutes integer not null default 0,
  children_count integer not null default 0 check (children_count >= 0),
  vehicle_label text null,
  driver_label text null,
  assistant_label text null,
  parent_notification_required boolean not null default false,
  event_at timestamptz not null default now(),
  proof_reference text null,
  notes text null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, transport_code)
);

create table if not exists public.ac360_ops_quality_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  class_id uuid null references public.ac360_ops_classes(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  check_code text not null,
  check_type text not null default 'field_quality' check (check_type in ('arrival','hygiene','kitchen','classroom','yard','safety','transport','documents','pedagogy','field_quality','other')),
  title text not null,
  status text not null default 'planned' check (status in ('planned','in_progress','passed','failed','non_conformity','action_required','closed','cancelled','archived')),
  score integer not null default 0 check (score between 0 and 100),
  owner_label text null,
  checked_at timestamptz null,
  non_conformities integer not null default 0 check (non_conformities >= 0),
  action_plan_required boolean not null default false,
  proof_reference text null,
  notes text null,
  checklist_json jsonb not null default '[]'::jsonb,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, check_code)
);

create table if not exists public.ac360_ops_day_closures (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete cascade,
  closure_code text not null,
  operational_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft','ready_for_review','correction_required','closed','archived')),
  presence_validated boolean not null default false,
  incidents_reviewed boolean not null default false,
  routines_completed boolean not null default false,
  transport_closed boolean not null default false,
  critical_tasks_closed boolean not null default false,
  direction_summary text null,
  unresolved_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  closed_by uuid null,
  closed_at timestamptz null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, day_id)
);

create table if not exists public.ac360_ops_audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  site_id uuid null references public.ac360_ops_sites(id) on delete set null,
  day_id uuid null references public.ac360_ops_days(id) on delete set null,
  event_code text not null,
  event_type text not null,
  source_workspace text not null default 'operations',
  entity_type text null,
  entity_id uuid null,
  actor_app_user_id uuid null,
  proof_reference text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, event_code)
);

create index if not exists ac360_ops_sites_org_status_idx on public.ac360_ops_sites(org_id, status, city, site_name);
create index if not exists ac360_ops_days_org_date_idx on public.ac360_ops_days(org_id, operational_date desc, status);
create index if not exists ac360_ops_days_org_scope_date_idx on public.ac360_ops_days(org_id, scope_key, operational_date desc);
create index if not exists ac360_ops_classes_org_site_idx on public.ac360_ops_classes(org_id, site_id, status, class_name);
create index if not exists ac360_ops_capacity_org_date_idx on public.ac360_ops_class_capacity_snapshots(org_id, snapshot_date desc, pressure_status);
create index if not exists ac360_ops_routine_templates_org_idx on public.ac360_ops_routine_templates(org_id, status, category);
create index if not exists ac360_ops_routine_events_org_day_idx on public.ac360_ops_routine_events(org_id, day_id, status, scheduled_at);
create index if not exists ac360_ops_incidents_org_status_idx on public.ac360_ops_incidents(org_id, status, severity, occurred_at desc);
create index if not exists ac360_ops_tasks_org_status_idx on public.ac360_ops_tasks(org_id, status, priority, due_at);
create index if not exists ac360_ops_staff_coverage_org_date_idx on public.ac360_ops_staff_coverage(org_id, coverage_date desc, coverage_status);
create index if not exists ac360_ops_transport_events_org_day_idx on public.ac360_ops_transport_events(org_id, day_id, status, event_at desc);
create index if not exists ac360_ops_quality_checks_org_status_idx on public.ac360_ops_quality_checks(org_id, status, score, created_at desc);
create index if not exists ac360_ops_day_closures_org_date_idx on public.ac360_ops_day_closures(org_id, operational_date desc, status);
create index if not exists ac360_ops_audit_org_created_idx on public.ac360_ops_audit_events(org_id, created_at desc);

create or replace function public.ac360_ops_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_ops_sites','ac360_ops_days','ac360_ops_classes','ac360_ops_routine_templates','ac360_ops_routine_events',
    'ac360_ops_incidents','ac360_ops_tasks','ac360_ops_staff_coverage','ac360_ops_transport_events','ac360_ops_quality_checks','ac360_ops_day_closures'
  ] loop
    if not exists (select 1 from pg_trigger where tgname = t || '_touch_updated_at') then
      execute format('create trigger %I before update on public.%I for each row execute procedure public.ac360_ops_touch_updated_at()', t || '_touch_updated_at', t);
    end if;
  end loop;
end $$;

create or replace function public.ac360_ops_proof_ref(p_prefix text default 'AC360-OPS')
returns text
language sql
as $$
  select p_prefix || '-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
$$;

create or replace function public.ac360_ops_runtime_summary(p_org_id uuid, p_operational_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sites int := 0;
  v_days int := 0;
  v_open_days int := 0;
  v_classes int := 0;
  v_children_expected int := 0;
  v_children_present int := 0;
  v_staff_expected int := 0;
  v_staff_present int := 0;
  v_routines_total int := 0;
  v_routines_done int := 0;
  v_incidents_open int := 0;
  v_incidents_critical int := 0;
  v_tasks_open int := 0;
  v_tasks_late int := 0;
  v_transport_delays int := 0;
  v_quality_open int := 0;
  v_closures_closed int := 0;
  v_occupancy numeric := 0;
  v_staff_coverage numeric := 0;
  v_routine_rate numeric := 0;
begin
  select count(*) into v_sites from public.ac360_ops_sites where org_id = p_org_id and status <> 'archived';
  select count(*), count(*) filter (where status in ('open','in_progress','waiting_closure')) into v_days, v_open_days from public.ac360_ops_days where org_id = p_org_id and operational_date = p_operational_date;
  select count(*) into v_classes from public.ac360_ops_classes where org_id = p_org_id and status <> 'archived';
  select coalesce(sum(children_expected),0), coalesce(sum(children_present),0), coalesce(sum(staff_expected),0), coalesce(sum(staff_present),0)
    into v_children_expected, v_children_present, v_staff_expected, v_staff_present
    from public.ac360_ops_class_capacity_snapshots where org_id = p_org_id and snapshot_date = p_operational_date;
  select count(*), count(*) filter (where status = 'completed') into v_routines_total, v_routines_done from public.ac360_ops_routine_events where org_id = p_org_id and coalesce(scheduled_at::date, p_operational_date) = p_operational_date;
  select count(*) filter (where status not in ('resolved','closed','cancelled','archived')), count(*) filter (where severity = 'critical' and status not in ('resolved','closed','cancelled','archived'))
    into v_incidents_open, v_incidents_critical from public.ac360_ops_incidents where org_id = p_org_id and occurred_at::date <= p_operational_date;
  select count(*) filter (where status not in ('completed','cancelled','archived')), count(*) filter (where status = 'late' or (due_at is not null and due_at < now() and status not in ('completed','cancelled','archived')))
    into v_tasks_open, v_tasks_late from public.ac360_ops_tasks where org_id = p_org_id;
  select count(*) into v_transport_delays from public.ac360_ops_transport_events where org_id = p_org_id and event_at::date = p_operational_date and (event_type = 'delay' or delay_minutes > 0) and status not in ('closed','cancelled','archived');
  select count(*) into v_quality_open from public.ac360_ops_quality_checks where org_id = p_org_id and status in ('planned','in_progress','failed','non_conformity','action_required');
  select count(*) into v_closures_closed from public.ac360_ops_day_closures where org_id = p_org_id and operational_date = p_operational_date and status = 'closed';

  v_occupancy := case when v_children_expected > 0 then round((v_children_present::numeric / v_children_expected::numeric) * 100, 2) else 0 end;
  v_staff_coverage := case when v_staff_expected > 0 then round((v_staff_present::numeric / v_staff_expected::numeric) * 100, 2) else 0 end;
  v_routine_rate := case when v_routines_total > 0 then round((v_routines_done::numeric / v_routines_total::numeric) * 100, 2) else 0 end;

  return jsonb_build_object(
    'operationalDate', p_operational_date,
    'sitesActive', v_sites,
    'daysTotal', v_days,
    'daysOpen', v_open_days,
    'classesActive', v_classes,
    'childrenExpected', v_children_expected,
    'childrenPresent', v_children_present,
    'staffExpected', v_staff_expected,
    'staffPresent', v_staff_present,
    'occupancyRate', v_occupancy,
    'staffCoverageRate', v_staff_coverage,
    'routinesTotal', v_routines_total,
    'routinesCompleted', v_routines_done,
    'routineCompletionRate', v_routine_rate,
    'incidentsOpen', v_incidents_open,
    'incidentsCritical', v_incidents_critical,
    'tasksOpen', v_tasks_open,
    'tasksLate', v_tasks_late,
    'transportDelays', v_transport_delays,
    'qualityChecksOpen', v_quality_open,
    'closuresClosed', v_closures_closed,
    'sourceOfTruthReady', true
  );
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_ops_sites','ac360_ops_days','ac360_ops_classes','ac360_ops_class_capacity_snapshots','ac360_ops_routine_templates','ac360_ops_routine_events',
    'ac360_ops_incidents','ac360_ops_tasks','ac360_ops_staff_coverage','ac360_ops_transport_events','ac360_ops_quality_checks','ac360_ops_day_closures','ac360_ops_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', 'ac360_ops_service_role_all_' || t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_ops_service_role_all_' || t, t);
    execute format('drop policy if exists %I on public.%I', 'ac360_ops_member_read_' || t, t);
    execute format('create policy %I on public.%I for select using (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active''))', 'ac360_ops_member_read_' || t, t, t);
    execute format('drop policy if exists %I on public.%I', 'ac360_ops_member_insert_' || t, t);
    execute format('create policy %I on public.%I for insert with check (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active''))', 'ac360_ops_member_insert_' || t, t, t);
    execute format('drop policy if exists %I on public.%I', 'ac360_ops_member_update_' || t, t);
    execute format('create policy %I on public.%I for update using (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active'')) with check (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active''))', 'ac360_ops_member_update_' || t, t, t, t);
  end loop;
end $$;

comment on table public.ac360_ops_days is 'AngelCare 360 Operations source-of-truth: real operational day opening, live execution and closure backbone.';
comment on table public.ac360_ops_routine_events is 'AngelCare 360 Operations source-of-truth: routine execution events feeding operations KPIs and cockpit summaries.';
comment on table public.ac360_ops_incidents is 'AngelCare 360 Operations source-of-truth: operational incident register with severity, assignment, proof and closure.';
comment on table public.ac360_ops_tasks is 'AngelCare 360 Operations source-of-truth: terrain task queue with ownership, status, proof and escalation readiness.';
comment on function public.ac360_ops_runtime_summary(uuid, date) is 'Returns source-of-truth Operations summary for workspace and Cockpit de Direction KPIs.';

commit;
