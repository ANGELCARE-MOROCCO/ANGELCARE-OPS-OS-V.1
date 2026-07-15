
-- AngelCare 360 Phase 2C - Attendance, Presence & Daily Operations Runtime
-- Backend/system-only phase. No school UI/front-end pages are introduced here.

begin;

-- -----------------------------------------------------------------------------
-- 0. Compatibility guards from prior Phase 1D/1E action wiring
-- -----------------------------------------------------------------------------
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Daily attendance / presence / operation tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_attendance_policy_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  policy_key text not null default 'default',
  label text not null default 'Default attendance policy',
  attendance_scope text not null default 'student_and_staff',
  timezone text not null default 'Africa/Casablanca',
  school_day_start time not null default '08:00',
  school_day_end time not null default '18:00',
  late_grace_minutes integer not null default 10,
  absent_after_time time default '10:00',
  pickup_deadline_time time default '18:30',
  require_checkout boolean not null default true,
  require_reason_for_absence boolean not null default false,
  allow_teacher_corrections boolean not null default false,
  correction_requires_approval boolean not null default true,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, campus_id, policy_key),
  check (attendance_scope in ('student','staff','student_and_staff')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_attendance_daybooks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  attendance_policy_id uuid references public.ac360_school_attendance_policy_profiles(id) on delete set null,
  operation_date date not null default current_date,
  daybook_key text not null default 'daily',
  status text not null default 'open',
  expected_students integer not null default 0,
  present_students integer not null default 0,
  absent_students integer not null default 0,
  late_students integer not null default 0,
  early_out_students integer not null default 0,
  authorized_absence_students integer not null default 0,
  unknown_students integer not null default 0,
  checked_in_staff integer not null default 0,
  open_issues_count integer not null default 0,
  opened_by uuid,
  closed_by uuid,
  reconciled_by uuid,
  opened_at timestamptz not null default now(),
  reconciled_at timestamptz,
  closed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('draft','open','reconciled','closed','locked','archived'))
);

create unique index if not exists ux_ac360_attendance_daybooks_scope
  on public.ac360_school_attendance_daybooks(
    org_id,
    coalesce(campus_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
    operation_date,
    daybook_key
  );

create table if not exists public.ac360_school_attendance_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  daybook_id uuid references public.ac360_school_attendance_daybooks(id) on delete set null,
  attendance_session_id uuid references public.ac360_school_attendance_sessions(id) on delete set null,
  attendance_record_id uuid references public.ac360_school_attendance_records(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  staff_profile_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  attendance_type text not null default 'student',
  event_type text not null,
  attendance_status text,
  event_at timestamptz not null default now(),
  source text not null default 'manual',
  actor_app_user_id uuid,
  reason text,
  previous_status text,
  correction_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (attendance_type in ('student','staff')),
  check (event_type in ('session_opened','session_closed','check_in','check_out','mark_present','mark_absent','mark_late','mark_early_out','mark_authorized_absence','staff_check_in','staff_check_out','correction_requested','correction_approved','correction_rejected','reconciled','alert_created','alert_resolved'))
);

create table if not exists public.ac360_school_attendance_corrections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  daybook_id uuid references public.ac360_school_attendance_daybooks(id) on delete set null,
  attendance_session_id uuid references public.ac360_school_attendance_sessions(id) on delete set null,
  attendance_record_id uuid references public.ac360_school_attendance_records(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  staff_profile_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  requested_status text,
  requested_check_in_at timestamptz,
  requested_check_out_at timestamptz,
  request_reason text,
  decision_status text not null default 'requested',
  decision_reason text,
  requested_by uuid,
  decided_by uuid,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (decision_status in ('requested','approved','rejected','cancelled','archived')),
  check (requested_status is null or requested_status in ('present','absent','late','early_out','authorized_absence','sick','holiday','unknown'))
);

create table if not exists public.ac360_school_daily_ops_reconcile_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  operation_date date not null default current_date,
  run_status text not null default 'completed',
  sessions_checked integer not null default 0,
  records_checked integer not null default 0,
  daybooks_reconciled integer not null default 0,
  alerts_created integer not null default 0,
  open_issues_count integer not null default 0,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (run_status in ('started','completed','completed_with_issues','failed','archived'))
);

create table if not exists public.ac360_school_daily_ops_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  daybook_id uuid references public.ac360_school_attendance_daybooks(id) on delete set null,
  attendance_session_id uuid references public.ac360_school_attendance_sessions(id) on delete set null,
  attendance_record_id uuid references public.ac360_school_attendance_records(id) on delete set null,
  alert_key text not null,
  alert_type text not null,
  severity text not null default 'medium',
  subject_type text not null default 'attendance',
  subject_id uuid,
  message text not null,
  status text not null default 'active',
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('low','medium','high','critical')),
  check (status in ('active','acknowledged','resolved','dismissed','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Indexes, triggers, RLS service-role policies
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_att_policy_org_status on public.ac360_school_attendance_policy_profiles(org_id, status);
create index if not exists idx_ac360_att_daybook_org_date on public.ac360_school_attendance_daybooks(org_id, operation_date desc, status);
create index if not exists idx_ac360_att_events_org_event on public.ac360_school_attendance_events(org_id, event_at desc, event_type);
create index if not exists idx_ac360_att_events_record on public.ac360_school_attendance_events(attendance_record_id, event_at desc);
create index if not exists idx_ac360_att_corrections_org_status on public.ac360_school_attendance_corrections(org_id, decision_status, requested_at desc);
create index if not exists idx_ac360_daily_alerts_org_status on public.ac360_school_daily_ops_alerts(org_id, status, severity, opened_at desc);
create index if not exists idx_ac360_daily_reconcile_org_date on public.ac360_school_daily_ops_reconcile_runs(org_id, operation_date desc);

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_attendance_policy_profiles',
    'ac360_school_attendance_daybooks',
    'ac360_school_attendance_corrections',
    'ac360_school_daily_ops_alerts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

alter table public.ac360_school_attendance_policy_profiles enable row level security;
alter table public.ac360_school_attendance_daybooks enable row level security;
alter table public.ac360_school_attendance_events enable row level security;
alter table public.ac360_school_attendance_corrections enable row level security;
alter table public.ac360_school_daily_ops_reconcile_runs enable row level security;
alter table public.ac360_school_daily_ops_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_attendance_policy_profiles',
    'ac360_school_attendance_daybooks',
    'ac360_school_attendance_events',
    'ac360_school_attendance_corrections',
    'ac360_school_daily_ops_reconcile_runs',
    'ac360_school_daily_ops_alerts'
  ] loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. Helper functions
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_find_or_create_daybook(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_class_id uuid default null,
  p_academic_year_id uuid default null,
  p_operation_date date default current_date,
  p_daybook_key text default 'daily',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daybook_id uuid;
  v_policy_id uuid;
  v_academic_year_id uuid := p_academic_year_id;
begin
  if p_org_id is null then
    raise exception 'AC360 organization id is required for daybook.';
  end if;

  if v_academic_year_id is null then
    select id into v_academic_year_id
    from public.ac360_academic_years
    where org_id = p_org_id and status in ('active','planning')
    order by starts_on desc nulls last, created_at desc
    limit 1;
  end if;

  select id into v_policy_id
  from public.ac360_school_attendance_policy_profiles
  where org_id = p_org_id
    and (campus_id is not distinct from p_campus_id or campus_id is null)
    and status = 'active'
  order by case when campus_id is not null then 0 else 1 end, created_at desc
  limit 1;

  if v_policy_id is null then
    insert into public.ac360_school_attendance_policy_profiles(org_id, campus_id, policy_key, label, metadata_json)
    values (p_org_id, p_campus_id, 'default', 'Default attendance policy', jsonb_build_object('created_by_phase','phase_2c_attendance_presence_daily_ops'))
    on conflict (org_id, campus_id, policy_key) do update set status='active'
    returning id into v_policy_id;
  end if;

  select id into v_daybook_id
  from public.ac360_school_attendance_daybooks
  where org_id = p_org_id
    and campus_id is not distinct from p_campus_id
    and class_id is not distinct from p_class_id
    and operation_date = coalesce(p_operation_date, current_date)
    and daybook_key = coalesce(nullif(p_daybook_key,''), 'daily')
  limit 1;

  if v_daybook_id is null then
    insert into public.ac360_school_attendance_daybooks(
      org_id, campus_id, class_id, academic_year_id, attendance_policy_id, operation_date, daybook_key, opened_by, metadata_json
    ) values (
      p_org_id, p_campus_id, p_class_id, v_academic_year_id, v_policy_id, coalesce(p_operation_date, current_date), coalesce(nullif(p_daybook_key,''), 'daily'), p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb)
    ) returning id into v_daybook_id;
  else
    update public.ac360_school_attendance_daybooks
    set status = case when status in ('draft','archived') then 'open' else status end,
        attendance_policy_id = coalesce(attendance_policy_id, v_policy_id),
        metadata_json = metadata_json || coalesce(p_metadata,'{}'::jsonb)
    where id = v_daybook_id;
  end if;

  return v_daybook_id;
end;
$$;

create or replace function public.ac360_school_refresh_daybook_counts(p_daybook_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daybook record;
  v_expected integer := 0;
  v_present integer := 0;
  v_absent integer := 0;
  v_late integer := 0;
  v_early integer := 0;
  v_authorized integer := 0;
  v_unknown integer := 0;
  v_staff integer := 0;
  v_issues integer := 0;
begin
  select * into v_daybook from public.ac360_school_attendance_daybooks where id = p_daybook_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'Daybook not found');
  end if;

  if v_daybook.class_id is not null then
    select count(*)::integer into v_expected
    from public.ac360_school_class_enrollments
    where org_id = v_daybook.org_id and class_id = v_daybook.class_id and status in ('active','pending');
  else
    select count(*)::integer into v_expected
    from public.ac360_school_students
    where org_id = v_daybook.org_id and status = 'active' and enrollment_status in ('enrolled','pre_enrolled','trial');
  end if;

  select
    count(*) filter (where r.attendance_type='student' and r.attendance_status in ('present','late','early_out'))::integer,
    count(*) filter (where r.attendance_type='student' and r.attendance_status = 'absent')::integer,
    count(*) filter (where r.attendance_type='student' and r.attendance_status = 'late')::integer,
    count(*) filter (where r.attendance_type='student' and r.attendance_status = 'early_out')::integer,
    count(*) filter (where r.attendance_type='student' and r.attendance_status = 'authorized_absence')::integer,
    count(*) filter (where r.attendance_type='student' and r.attendance_status = 'unknown')::integer,
    count(*) filter (where r.attendance_type='staff' and r.check_in_at is not null and r.attendance_status in ('present','late','early_out'))::integer,
    count(*) filter (where r.correction_status='requested' or (r.attendance_status='absent' and coalesce(r.reason,'')='') or (r.check_in_at is not null and r.check_out_at is null and r.attendance_status in ('present','late','early_out')))::integer
  into v_present, v_absent, v_late, v_early, v_authorized, v_unknown, v_staff, v_issues
  from public.ac360_school_attendance_records r
  join public.ac360_school_attendance_sessions s on s.id = r.attendance_session_id
  where r.org_id = v_daybook.org_id
    and s.session_date = v_daybook.operation_date
    and s.campus_id is not distinct from v_daybook.campus_id
    and s.class_id is not distinct from v_daybook.class_id;

  update public.ac360_school_attendance_daybooks
  set expected_students = coalesce(v_expected, 0),
      present_students = coalesce(v_present, 0),
      absent_students = coalesce(v_absent, 0),
      late_students = coalesce(v_late, 0),
      early_out_students = coalesce(v_early, 0),
      authorized_absence_students = coalesce(v_authorized, 0),
      unknown_students = greatest(coalesce(v_expected,0) - coalesce(v_present,0) - coalesce(v_absent,0) - coalesce(v_authorized,0), 0) + coalesce(v_unknown,0),
      checked_in_staff = coalesce(v_staff, 0),
      open_issues_count = coalesce(v_issues, 0)
  where id = p_daybook_id;

  return jsonb_build_object(
    'ok', true,
    'daybookId', p_daybook_id,
    'expectedStudents', coalesce(v_expected, 0),
    'presentStudents', coalesce(v_present, 0),
    'absentStudents', coalesce(v_absent, 0),
    'lateStudents', coalesce(v_late, 0),
    'openIssues', coalesce(v_issues, 0)
  );
end;
$$;

create or replace function public.ac360_school_open_attendance_session(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_class_id uuid default null,
  p_academic_year_id uuid default null,
  p_session_date date default current_date,
  p_session_key text default 'daily',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_daybook_id uuid;
  v_academic_year_id uuid := p_academic_year_id;
begin
  if p_org_id is null then
    return jsonb_build_object('ok', false, 'error', 'AC360 organization id is required.');
  end if;

  if v_academic_year_id is null then
    select id into v_academic_year_id
    from public.ac360_academic_years
    where org_id = p_org_id and status in ('active','planning')
    order by starts_on desc nulls last, created_at desc
    limit 1;
  end if;

  v_daybook_id := public.ac360_school_find_or_create_daybook(p_org_id, p_campus_id, p_class_id, v_academic_year_id, coalesce(p_session_date,current_date), coalesce(nullif(p_session_key,''),'daily'), p_actor_app_user_id, p_metadata);

  select id into v_session_id
  from public.ac360_school_attendance_sessions
  where org_id = p_org_id
    and campus_id is not distinct from p_campus_id
    and class_id is not distinct from p_class_id
    and session_date = coalesce(p_session_date, current_date)
    and session_key = coalesce(nullif(p_session_key,''),'daily')
  limit 1;

  if v_session_id is null then
    insert into public.ac360_school_attendance_sessions(
      org_id, campus_id, class_id, academic_year_id, session_date, session_key, status, opened_by, metadata_json
    ) values (
      p_org_id, p_campus_id, p_class_id, v_academic_year_id, coalesce(p_session_date, current_date), coalesce(nullif(p_session_key,''),'daily'), 'open', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb)
    ) returning id into v_session_id;
  else
    update public.ac360_school_attendance_sessions
    set status = case when status in ('closed','locked') then status else 'open' end,
        metadata_json = metadata_json || coalesce(p_metadata,'{}'::jsonb)
    where id = v_session_id;
  end if;

  insert into public.ac360_school_attendance_events(org_id, daybook_id, attendance_session_id, event_type, attendance_type, actor_app_user_id, source, reason, metadata_json)
  values (p_org_id, v_daybook_id, v_session_id, 'session_opened', 'student', p_actor_app_user_id, 'system', 'Attendance session opened or confirmed.', coalesce(p_metadata,'{}'::jsonb));

  perform public.ac360_school_refresh_daybook_counts(v_daybook_id);

  return jsonb_build_object('ok', true, 'sessionId', v_session_id, 'daybookId', v_daybook_id, 'status', 'open');
end;
$$;

create or replace function public.ac360_school_record_attendance_event(
  p_org_id uuid,
  p_attendance_session_id uuid default null,
  p_daybook_id uuid default null,
  p_student_id uuid default null,
  p_staff_profile_id uuid default null,
  p_attendance_type text default null,
  p_event_type text default 'check_in',
  p_attendance_status text default null,
  p_event_at timestamptz default now(),
  p_reason text default null,
  p_source text default 'manual',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_session_id uuid := p_attendance_session_id;
  v_daybook_id uuid := p_daybook_id;
  v_type text := coalesce(nullif(p_attendance_type,''), case when p_staff_profile_id is not null then 'staff' else 'student' end);
  v_status text := p_attendance_status;
  v_record_id uuid;
  v_previous_status text;
begin
  if p_org_id is null then return jsonb_build_object('ok', false, 'error', 'AC360 organization id is required.'); end if;
  if p_student_id is null and p_staff_profile_id is null then return jsonb_build_object('ok', false, 'error', 'studentId or staffProfileId is required.'); end if;

  if v_status is null then
    v_status := case p_event_type
      when 'mark_absent' then 'absent'
      when 'mark_late' then 'late'
      when 'mark_early_out' then 'early_out'
      when 'mark_authorized_absence' then 'authorized_absence'
      when 'staff_check_in' then 'present'
      when 'staff_check_out' then 'present'
      when 'check_in' then 'present'
      when 'check_out' then null
      else 'present'
    end;
  end if;

  if v_session_id is null then
    select * into v_session
    from public.ac360_school_attendance_sessions
    where org_id = p_org_id
      and session_date = (coalesce(p_event_at, now()) at time zone 'Africa/Casablanca')::date
      and status = 'open'
    order by created_at desc
    limit 1;

    if not found then
      select (public.ac360_school_open_attendance_session(p_org_id, null, null, null, (coalesce(p_event_at, now()) at time zone 'Africa/Casablanca')::date, 'daily', p_actor_app_user_id, jsonb_build_object('auto_opened_by','record_attendance_event'))) ->> 'sessionId'
      into v_session_id;
      v_session_id := v_session_id::uuid;
    else
      v_session_id := v_session.id;
    end if;
  end if;

  select * into v_session from public.ac360_school_attendance_sessions where id = v_session_id and org_id = p_org_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Attendance session not found.'); end if;
  if v_session.status in ('closed','locked','archived') then return jsonb_build_object('ok', false, 'error', 'Attendance session is not open.'); end if;

  if v_daybook_id is null then
    v_daybook_id := public.ac360_school_find_or_create_daybook(p_org_id, v_session.campus_id, v_session.class_id, v_session.academic_year_id, v_session.session_date, v_session.session_key, p_actor_app_user_id, p_metadata);
  end if;

  select id, attendance_status into v_record_id, v_previous_status
  from public.ac360_school_attendance_records
  where org_id = p_org_id
    and attendance_session_id = v_session_id
    and attendance_type = v_type
    and student_id is not distinct from p_student_id
    and staff_profile_id is not distinct from p_staff_profile_id
  order by created_at desc
  limit 1;

  if v_record_id is null then
    insert into public.ac360_school_attendance_records(
      org_id, attendance_session_id, student_id, staff_profile_id, attendance_type, attendance_status, recorded_at, check_in_at, check_out_at, reason, source, created_by, metadata_json
    ) values (
      p_org_id, v_session_id, p_student_id, p_staff_profile_id, v_type, coalesce(v_status,'present'), coalesce(p_event_at, now()),
      case when p_event_type in ('check_in','staff_check_in','mark_present','mark_late') then coalesce(p_event_at, now()) else null end,
      case when p_event_type in ('check_out','staff_check_out','mark_early_out') then coalesce(p_event_at, now()) else null end,
      p_reason, coalesce(nullif(p_source,''),'manual'), p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb)
    ) returning id into v_record_id;
  else
    update public.ac360_school_attendance_records
    set attendance_status = coalesce(v_status, attendance_status),
        recorded_at = coalesce(p_event_at, now()),
        check_in_at = case when p_event_type in ('check_in','staff_check_in','mark_present','mark_late') then coalesce(check_in_at, coalesce(p_event_at, now())) else check_in_at end,
        check_out_at = case when p_event_type in ('check_out','staff_check_out','mark_early_out') then coalesce(p_event_at, now()) else check_out_at end,
        reason = coalesce(p_reason, reason),
        source = coalesce(nullif(p_source,''), source),
        metadata_json = metadata_json || coalesce(p_metadata,'{}'::jsonb)
    where id = v_record_id;
  end if;

  insert into public.ac360_school_attendance_events(
    org_id, daybook_id, attendance_session_id, attendance_record_id, student_id, staff_profile_id, attendance_type, event_type, attendance_status, event_at, source, actor_app_user_id, reason, previous_status, metadata_json
  ) values (
    p_org_id, v_daybook_id, v_session_id, v_record_id, p_student_id, p_staff_profile_id, v_type, p_event_type, coalesce(v_status, v_previous_status), coalesce(p_event_at, now()), coalesce(nullif(p_source,''),'manual'), p_actor_app_user_id, p_reason, v_previous_status, coalesce(p_metadata,'{}'::jsonb)
  );

  perform public.ac360_school_refresh_daybook_counts(v_daybook_id);

  return jsonb_build_object('ok', true, 'sessionId', v_session_id, 'daybookId', v_daybook_id, 'recordId', v_record_id, 'status', coalesce(v_status, v_previous_status), 'eventType', p_event_type);
end;
$$;

create or replace function public.ac360_school_request_attendance_correction(
  p_org_id uuid,
  p_attendance_record_id uuid,
  p_requested_status text default null,
  p_requested_check_in_at timestamptz default null,
  p_requested_check_out_at timestamptz default null,
  p_request_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record record;
  v_daybook_id uuid;
  v_correction_id uuid;
begin
  select * into v_record from public.ac360_school_attendance_records where id = p_attendance_record_id and org_id = p_org_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Attendance record not found.'); end if;

  select public.ac360_school_find_or_create_daybook(s.org_id, s.campus_id, s.class_id, s.academic_year_id, s.session_date, s.session_key, p_actor_app_user_id, p_metadata)
  into v_daybook_id
  from public.ac360_school_attendance_sessions s
  where s.id = v_record.attendance_session_id;

  insert into public.ac360_school_attendance_corrections(
    org_id, daybook_id, attendance_session_id, attendance_record_id, student_id, staff_profile_id, requested_status, requested_check_in_at, requested_check_out_at, request_reason, requested_by, metadata_json
  ) values (
    p_org_id, v_daybook_id, v_record.attendance_session_id, v_record.id, v_record.student_id, v_record.staff_profile_id, p_requested_status, p_requested_check_in_at, p_requested_check_out_at, p_request_reason, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb)
  ) returning id into v_correction_id;

  update public.ac360_school_attendance_records set correction_status='requested' where id = v_record.id;

  insert into public.ac360_school_attendance_events(org_id, daybook_id, attendance_session_id, attendance_record_id, student_id, staff_profile_id, attendance_type, event_type, attendance_status, actor_app_user_id, reason, correction_id, metadata_json)
  values (p_org_id, v_daybook_id, v_record.attendance_session_id, v_record.id, v_record.student_id, v_record.staff_profile_id, v_record.attendance_type, 'correction_requested', coalesce(p_requested_status, v_record.attendance_status), p_actor_app_user_id, p_request_reason, v_correction_id, coalesce(p_metadata,'{}'::jsonb));

  perform public.ac360_school_refresh_daybook_counts(v_daybook_id);
  return jsonb_build_object('ok', true, 'correctionId', v_correction_id, 'recordId', v_record.id, 'decisionStatus', 'requested');
end;
$$;

create or replace function public.ac360_school_decide_attendance_correction(
  p_org_id uuid,
  p_correction_id uuid,
  p_decision_status text,
  p_decision_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_correction record;
  v_event_type text;
begin
  if p_decision_status not in ('approved','rejected','cancelled') then
    return jsonb_build_object('ok', false, 'error', 'Decision must be approved, rejected or cancelled.');
  end if;

  select * into v_correction from public.ac360_school_attendance_corrections where id = p_correction_id and org_id = p_org_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Correction request not found.'); end if;

  update public.ac360_school_attendance_corrections
  set decision_status = p_decision_status,
      decision_reason = p_decision_reason,
      decided_by = p_actor_app_user_id,
      decided_at = now(),
      metadata_json = metadata_json || coalesce(p_metadata,'{}'::jsonb)
  where id = p_correction_id;

  if p_decision_status = 'approved' then
    update public.ac360_school_attendance_records
    set attendance_status = coalesce(v_correction.requested_status, attendance_status),
        check_in_at = coalesce(v_correction.requested_check_in_at, check_in_at),
        check_out_at = coalesce(v_correction.requested_check_out_at, check_out_at),
        correction_status = 'approved',
        reason = coalesce(p_decision_reason, reason),
        metadata_json = metadata_json || jsonb_build_object('lastApprovedCorrectionId', p_correction_id)
    where id = v_correction.attendance_record_id;
    v_event_type := 'correction_approved';
  elsif p_decision_status = 'rejected' then
    update public.ac360_school_attendance_records set correction_status='rejected' where id = v_correction.attendance_record_id;
    v_event_type := 'correction_rejected';
  else
    update public.ac360_school_attendance_records set correction_status='none' where id = v_correction.attendance_record_id;
    v_event_type := 'correction_rejected';
  end if;

  insert into public.ac360_school_attendance_events(org_id, daybook_id, attendance_session_id, attendance_record_id, student_id, staff_profile_id, attendance_type, event_type, attendance_status, actor_app_user_id, reason, correction_id, metadata_json)
  values (p_org_id, v_correction.daybook_id, v_correction.attendance_session_id, v_correction.attendance_record_id, v_correction.student_id, v_correction.staff_profile_id, case when v_correction.staff_profile_id is not null then 'staff' else 'student' end, v_event_type, v_correction.requested_status, p_actor_app_user_id, p_decision_reason, p_correction_id, coalesce(p_metadata,'{}'::jsonb));

  perform public.ac360_school_refresh_daybook_counts(v_correction.daybook_id);
  return jsonb_build_object('ok', true, 'correctionId', p_correction_id, 'decisionStatus', p_decision_status);
end;
$$;

create or replace function public.ac360_school_close_attendance_session(
  p_org_id uuid,
  p_attendance_session_id uuid,
  p_close_status text default 'closed',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_daybook_id uuid;
  v_counts jsonb;
begin
  select * into v_session from public.ac360_school_attendance_sessions where id = p_attendance_session_id and org_id = p_org_id;
  if not found then return jsonb_build_object('ok', false, 'error', 'Attendance session not found.'); end if;
  if p_close_status not in ('closed','locked') then p_close_status := 'closed'; end if;

  update public.ac360_school_attendance_sessions
  set status = p_close_status, closed_by = p_actor_app_user_id, closed_at = now(), metadata_json = metadata_json || coalesce(p_metadata,'{}'::jsonb)
  where id = p_attendance_session_id;

  v_daybook_id := public.ac360_school_find_or_create_daybook(p_org_id, v_session.campus_id, v_session.class_id, v_session.academic_year_id, v_session.session_date, v_session.session_key, p_actor_app_user_id, p_metadata);
  v_counts := public.ac360_school_refresh_daybook_counts(v_daybook_id);

  update public.ac360_school_attendance_daybooks
  set status = case when p_close_status='locked' then 'locked' else 'closed' end,
      closed_by = p_actor_app_user_id,
      closed_at = now()
  where id = v_daybook_id;

  insert into public.ac360_school_attendance_events(org_id, daybook_id, attendance_session_id, event_type, attendance_type, actor_app_user_id, source, reason, metadata_json)
  values (p_org_id, v_daybook_id, p_attendance_session_id, 'session_closed', 'student', p_actor_app_user_id, 'system', 'Attendance session closed safely.', coalesce(p_metadata,'{}'::jsonb));

  return jsonb_build_object('ok', true, 'sessionId', p_attendance_session_id, 'daybookId', v_daybook_id, 'status', p_close_status, 'counts', v_counts);
end;
$$;

create or replace function public.ac360_school_run_daily_ops_reconcile(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_operation_date date default current_date,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daybook record;
  v_sessions integer := 0;
  v_records integer := 0;
  v_daybooks integer := 0;
  v_alerts integer := 0;
  v_open_issues integer := 0;
  v_run_status text := 'completed';
  v_run_id uuid;
  v_alert_key text;
begin
  for v_daybook in
    select * from public.ac360_school_attendance_daybooks
    where org_id = p_org_id
      and campus_id is not distinct from p_campus_id
      and operation_date = coalesce(p_operation_date, current_date)
      and status in ('open','reconciled','closed')
  loop
    perform public.ac360_school_refresh_daybook_counts(v_daybook.id);
    update public.ac360_school_attendance_daybooks
    set status = case when status='open' then 'reconciled' else status end,
        reconciled_by = p_actor_app_user_id,
        reconciled_at = now()
    where id = v_daybook.id;
    v_daybooks := v_daybooks + 1;
  end loop;

  select count(*)::integer into v_sessions
  from public.ac360_school_attendance_sessions
  where org_id = p_org_id
    and campus_id is not distinct from p_campus_id
    and session_date = coalesce(p_operation_date, current_date);

  select count(*)::integer into v_records
  from public.ac360_school_attendance_records r
  join public.ac360_school_attendance_sessions s on s.id = r.attendance_session_id
  where r.org_id = p_org_id
    and s.campus_id is not distinct from p_campus_id
    and s.session_date = coalesce(p_operation_date, current_date);

  select coalesce(sum(open_issues_count),0)::integer into v_open_issues
  from public.ac360_school_attendance_daybooks
  where org_id = p_org_id
    and campus_id is not distinct from p_campus_id
    and operation_date = coalesce(p_operation_date, current_date);

  if v_open_issues > 0 then
    v_run_status := 'completed_with_issues';
    v_alert_key := 'daily-ops-issues-' || p_org_id::text || '-' || coalesce(p_campus_id::text,'all') || '-' || coalesce(p_operation_date,current_date)::text;
    insert into public.ac360_school_daily_ops_alerts(org_id, campus_id, alert_key, alert_type, severity, subject_type, message, metadata_json)
    values (p_org_id, p_campus_id, v_alert_key, 'daily_ops_open_issues', case when v_open_issues > 10 then 'high' else 'medium' end, 'attendance_day', 'Daily attendance reconciliation detected open issues requiring review.', jsonb_build_object('openIssues',v_open_issues,'operationDate',coalesce(p_operation_date,current_date)))
    on conflict (org_id, alert_key) do update set status='active', severity=excluded.severity, message=excluded.message, metadata_json=public.ac360_school_daily_ops_alerts.metadata_json || excluded.metadata_json;
    v_alerts := v_alerts + 1;
  end if;

  insert into public.ac360_school_daily_ops_reconcile_runs(org_id, campus_id, operation_date, run_status, sessions_checked, records_checked, daybooks_reconciled, alerts_created, open_issues_count, actor_app_user_id, metadata_json)
  values (p_org_id, p_campus_id, coalesce(p_operation_date,current_date), v_run_status, v_sessions, v_records, v_daybooks, v_alerts, v_open_issues, p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb))
  returning id into v_run_id;

  return jsonb_build_object('ok', true, 'runId', v_run_id, 'runStatus', v_run_status, 'sessionsChecked', v_sessions, 'recordsChecked', v_records, 'daybooksReconciled', v_daybooks, 'alertsCreated', v_alerts, 'openIssues', v_open_issues);
end;
$$;

create or replace function public.ac360_school_resolve_daily_ops_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ac360_school_daily_ops_alerts
  set status='resolved', resolved_at=now(), resolved_by=p_actor_app_user_id, resolution_note=p_resolution_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb)
  where id = p_alert_id and org_id = p_org_id;

  if not found then return jsonb_build_object('ok', false, 'error', 'Daily operations alert not found.'); end if;
  return jsonb_build_object('ok', true, 'alertId', p_alert_id, 'status', 'resolved');
end;
$$;

create or replace function public.ac360_school_attendance_daily_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_operation_date date default current_date
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daybooks jsonb;
  v_alerts jsonb;
  v_recent_events jsonb;
  v_totals jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(d) order by d.operation_date desc, d.created_at desc), '[]'::jsonb)
  into v_daybooks
  from public.ac360_school_attendance_daybooks d
  where d.org_id = p_org_id
    and d.campus_id is not distinct from p_campus_id
    and d.operation_date = coalesce(p_operation_date,current_date);

  select jsonb_build_object(
    'expectedStudents', coalesce(sum(expected_students),0),
    'presentStudents', coalesce(sum(present_students),0),
    'absentStudents', coalesce(sum(absent_students),0),
    'lateStudents', coalesce(sum(late_students),0),
    'earlyOutStudents', coalesce(sum(early_out_students),0),
    'authorizedAbsenceStudents', coalesce(sum(authorized_absence_students),0),
    'unknownStudents', coalesce(sum(unknown_students),0),
    'checkedInStaff', coalesce(sum(checked_in_staff),0),
    'openIssues', coalesce(sum(open_issues_count),0)
  ) into v_totals
  from public.ac360_school_attendance_daybooks d
  where d.org_id = p_org_id
    and d.campus_id is not distinct from p_campus_id
    and d.operation_date = coalesce(p_operation_date,current_date);

  select coalesce(jsonb_agg(to_jsonb(a) order by a.opened_at desc), '[]'::jsonb)
  into v_alerts
  from public.ac360_school_daily_ops_alerts a
  where a.org_id = p_org_id
    and a.campus_id is not distinct from p_campus_id
    and a.status in ('active','acknowledged')
  limit 50;

  select coalesce(jsonb_agg(to_jsonb(e) order by e.event_at desc), '[]'::jsonb)
  into v_recent_events
  from (
    select * from public.ac360_school_attendance_events e
    where e.org_id = p_org_id
      and e.event_at >= coalesce(p_operation_date,current_date)::timestamptz
      and e.event_at < (coalesce(p_operation_date,current_date) + interval '1 day')::timestamptz
    order by e.event_at desc
    limit 80
  ) e;

  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2c_attendance_presence_daily_ops',
    'uiBuildAllowed', false,
    'orgId', p_org_id,
    'campusId', p_campus_id,
    'operationDate', coalesce(p_operation_date,current_date),
    'totals', coalesce(v_totals, '{}'::jsonb),
    'daybooks', v_daybooks,
    'alerts', v_alerts,
    'recentEvents', v_recent_events
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 4. Feature/action registry and route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('school.attendance.session.open','attendance_basic','AC360-ENG-48','Open attendance session','Open or confirm a guarded daily attendance session.','attendance.session.open',null,0,'block','{"access_type":"write","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb),
('school.attendance.event.record','attendance_basic','AC360-ENG-48','Record attendance event','Record check-in, check-out, absence, lateness or staff presence event.','attendance.event.record',null,0,'block','{"access_type":"write","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb),
('school.attendance.correction.request','attendance_advanced','AC360-ENG-48','Request attendance correction','Request a controlled correction for a previous attendance record.','attendance.correction.request',null,0,'require_upgrade','{"access_type":"write","suggested_feature":"attendance_advanced","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb),
('school.attendance.correction.decide','attendance_advanced','AC360-ENG-48','Approve or reject attendance correction','Approve, reject or cancel an attendance correction request.','attendance.correction.decide',null,0,'require_upgrade','{"access_type":"write","suggested_feature":"attendance_advanced","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb),
('school.attendance.session.close','attendance_basic','AC360-ENG-48','Close attendance session','Close or lock a daily attendance session safely.','attendance.session.close',null,0,'block','{"access_type":"write","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb),
('school.daily_ops.reconcile','attendance_advanced','AC360-ENG-48','Reconcile daily operations','Run daily attendance and presence reconciliation with alerts.','daily_ops.reconcile',null,0,'require_upgrade','{"access_type":"write","suggested_feature":"attendance_advanced","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb),
('school.daily_ops.alert.resolve','attendance_advanced','AC360-ENG-48','Resolve daily operations alert','Resolve an operational attendance alert with an auditable note.','daily_ops.alert.resolve',null,0,'require_upgrade','{"access_type":"write","suggested_feature":"attendance_advanced","phase":"phase_2c_attendance_presence_daily_ops"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json;

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table, enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.school_attendance.session.open','/api/ac360/school-attendance/sessions/open','POST','school.attendance.session.open','attendance_basic','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_attendance_sessions','strict','fixed_1','request_or_generated',null,null,'active','Opens guarded daily attendance sessions.','{"phase":"phase_2c"}'::jsonb),
('ac360.school_attendance.event.record','/api/ac360/school-attendance/events/record','POST','school.attendance.event.record','attendance_basic','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_attendance_records','strict','fixed_1','request_or_generated',null,'school.attendance.record','active','Records granular attendance/presence events.','{"phase":"phase_2c"}'::jsonb),
('ac360.school_attendance.correction.request','/api/ac360/school-attendance/corrections/request','POST','school.attendance.correction.request','attendance_advanced','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_attendance_corrections','strict','fixed_1','request_or_generated',null,null,'active','Requests auditable attendance correction.','{"phase":"phase_2c"}'::jsonb),
('ac360.school_attendance.correction.decide','/api/ac360/school-attendance/corrections/decide','POST','school.attendance.correction.decide','attendance_advanced','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_attendance_corrections','strict','fixed_1','request_or_generated',null,null,'active','Approves or rejects attendance correction.','{"phase":"phase_2c"}'::jsonb),
('ac360.school_attendance.session.close','/api/ac360/school-attendance/sessions/close','POST','school.attendance.session.close','attendance_basic','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_attendance_sessions','strict','fixed_1','request_or_generated',null,null,'active','Closes or locks attendance sessions safely.','{"phase":"phase_2c"}'::jsonb),
('ac360.school_daily_ops.reconcile','/api/ac360/school-attendance/daily/reconcile','POST','school.daily_ops.reconcile','attendance_advanced','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_daily_ops_reconcile_runs','strict','fixed_1','request_or_generated',null,null,'active','Reconciles daily attendance operations and alerts.','{"phase":"phase_2c"}'::jsonb),
('ac360.school_daily_ops.alert.resolve','/api/ac360/school-attendance/alerts/resolve','POST','school.daily_ops.alert.resolve','attendance_advanced','AC360-ENG-48','angelcare_360_school_attendance','ac360_school_daily_ops_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves daily operations attendance alerts.','{"phase":"phase_2c"}'::jsonb)
on conflict (wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  fallback_action_key=excluded.fallback_action_key,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json;

insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, sort_order, status, phase) values
('phase2c.attendance.open_session.audit','Audit opened attendance sessions','school_attendance','school.attendance.session.open','{"phase":"phase_2c"}'::jsonb,'{"write_event":"ac360_school_attendance_events"}'::jsonb,210,'active','phase_2c_attendance_presence_daily_ops'),
('phase2c.attendance.correction.requires_approval','Attendance correction approval required','school_attendance','school.attendance.correction.request','{"feature":"attendance_advanced"}'::jsonb,'{"create_correction_status":"requested"}'::jsonb,211,'active','phase_2c_attendance_presence_daily_ops'),
('phase2c.daily_ops.reconcile_alerts','Daily reconciliation creates operational alerts','school_attendance','school.daily_ops.reconcile','{"openIssues":">0"}'::jsonb,'{"create_alert":"daily_ops_open_issues"}'::jsonb,212,'active','phase_2c_attendance_presence_daily_ops')
on conflict (rule_key) do update set
  label=excluded.label,
  system_group=excluded.system_group,
  trigger_event=excluded.trigger_event,
  condition_json=excluded.condition_json,
  action_json=excluded.action_json,
  sort_order=excluded.sort_order,
  status=excluded.status,
  phase=excluded.phase;

-- Extend Phase 2 module coverage registry.
-- Phase 2A created this registry as ac360_school_ops_modules; keep naming consistent.
insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values
('attendance_presence_daily_ops','AC360-ENG-48','attendance_advanced','Attendance, Presence & Daily Operations Runtime','phase_2c_attendance_presence_daily_ops','guarded',array['ac360_school_attendance_daybooks','ac360_school_attendance_events','ac360_school_attendance_corrections','ac360_school_daily_ops_alerts'],array['school.attendance.session.open','school.attendance.event.record','school.attendance.correction.request','school.attendance.correction.decide','school.attendance.session.close','school.daily_ops.reconcile','school.daily_ops.alert.resolve'],'{"phase":"phase_2c","uiBuildAllowed":false,"archiveNotDelete":true}'::jsonb)
on conflict (module_key) do update set
  engine_code=excluded.engine_code,
  feature_key=excluded.feature_key,
  label=excluded.label,
  phase=excluded.phase,
  status=excluded.status,
  data_tables=excluded.data_tables,
  guarded_actions=excluded.guarded_actions,
  metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,
  updated_at=now();

commit;
