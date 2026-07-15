-- AngelCare 360 Phase 2M - Academy Training, Staff Courses, Assessments & Certificates Runtime
-- Ref: AC360-PH2M-ACADEMY-TRAINING-STAFF-COURSES-ASSESSMENTS-CERTIFICATES-2026-06-30
-- Scope: backend/system-only Academy Training runtime.
-- Strict rule: no Academy Training UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2L school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Academy training runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_academy_programs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  program_key text not null,
  label text not null,
  program_type text not null default 'staff_training',
  target_audience text not null default 'staff',
  duration_hours numeric not null default 0,
  curriculum_json jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, program_key),
  check (program_type in ('staff_training','onboarding','pedagogy','safety','parent_relation','finance_admin','transport','compliance','custom')),
  check (target_audience in ('staff','teachers','assistants','administration','drivers','directors','mixed')),
  check (status in ('draft','published','paused','archived'))
);

create table if not exists public.ac360_school_academy_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  program_id uuid references public.ac360_school_academy_programs(id) on delete set null,
  course_key text not null,
  title text not null,
  course_type text not null default 'training',
  level text not null default 'standard',
  duration_hours numeric not null default 0,
  content_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, course_key),
  check (course_type in ('training','workshop','assessment','orientation','coaching','compliance','custom')),
  check (level in ('basic','standard','advanced','expert','custom')),
  check (status in ('draft','published','paused','archived'))
);

create table if not exists public.ac360_school_academy_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  course_id uuid references public.ac360_school_academy_courses(id) on delete set null,
  session_key text not null,
  title text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  delivery_mode text not null default 'onsite',
  trainer_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  capacity integer,
  status text not null default 'scheduled',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, session_key),
  check (delivery_mode in ('onsite','online','hybrid','self_paced','external')),
  check (status in ('scheduled','confirmed','in_progress','completed','cancelled','archived'))
);

create table if not exists public.ac360_school_academy_enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_id uuid not null references public.ac360_school_staff_profiles(id) on delete cascade,
  program_id uuid references public.ac360_school_academy_programs(id) on delete set null,
  course_id uuid references public.ac360_school_academy_courses(id) on delete set null,
  enrollment_code text not null,
  enrollment_type text not null default 'assigned',
  mandatory boolean not null default false,
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  progress_percent numeric not null default 0,
  status text not null default 'enrolled',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, enrollment_code),
  check (enrollment_type in ('assigned','self_enrolled','mandatory','onboarding','compliance','remedial','custom')),
  check (status in ('enrolled','in_progress','completed','failed','cancelled','expired','archived'))
);

create table if not exists public.ac360_school_academy_attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  session_id uuid references public.ac360_school_academy_sessions(id) on delete cascade,
  enrollment_id uuid references public.ac360_school_academy_enrollments(id) on delete set null,
  staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  attendance_status text not null default 'present',
  check_in_at timestamptz,
  check_out_at timestamptz,
  note text,
  metadata_json jsonb not null default '{}'::jsonb,
  recorded_by uuid,
  created_at timestamptz not null default now(),
  unique(org_id, session_id, staff_id),
  check (attendance_status in ('present','late','absent','excused','left_early','online_completed'))
);

create table if not exists public.ac360_school_academy_assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  course_id uuid references public.ac360_school_academy_courses(id) on delete set null,
  assessment_key text not null,
  title text not null,
  assessment_type text not null default 'quiz',
  max_score numeric not null default 100,
  pass_score numeric not null default 60,
  questions_json jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, assessment_key),
  check (assessment_type in ('quiz','scenario','practical','interview','observation','final','custom')),
  check (status in ('draft','published','paused','archived'))
);

create table if not exists public.ac360_school_academy_assessment_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  assessment_id uuid not null references public.ac360_school_academy_assessments(id) on delete cascade,
  enrollment_id uuid references public.ac360_school_academy_enrollments(id) on delete set null,
  staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  score numeric not null default 0,
  max_score numeric not null default 100,
  result_status text not null default 'pending',
  answers_json jsonb not null default '{}'::jsonb,
  evaluated_by uuid,
  evaluated_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (result_status in ('pending','passed','failed','needs_review','archived'))
);

create table if not exists public.ac360_school_academy_certificates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_id uuid not null references public.ac360_school_staff_profiles(id) on delete cascade,
  enrollment_id uuid references public.ac360_school_academy_enrollments(id) on delete set null,
  assessment_result_id uuid references public.ac360_school_academy_assessment_results(id) on delete set null,
  certificate_code text not null,
  title text not null,
  issued_on date not null default current_date,
  expires_on date,
  status text not null default 'issued',
  document_id uuid references public.ac360_school_documents(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  issued_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, certificate_code),
  check (status in ('issued','revoked','expired','archived'))
);

create table if not exists public.ac360_school_academy_training_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  staff_id uuid references public.ac360_school_staff_profiles(id) on delete cascade,
  program_id uuid references public.ac360_school_academy_programs(id) on delete set null,
  course_id uuid references public.ac360_school_academy_courses(id) on delete set null,
  assignment_key text not null,
  assignment_reason text not null default 'manual',
  mandatory boolean not null default true,
  due_at timestamptz,
  status text not null default 'open',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, assignment_key),
  check (assignment_reason in ('manual','onboarding','compliance','role_requirement','remediation','renewal','custom')),
  check (status in ('open','in_progress','completed','waived','cancelled','archived'))
);

create table if not exists public.ac360_school_academy_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  severity text not null default 'info',
  message text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('info','warning','critical'))
);

create table if not exists public.ac360_school_academy_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  active_programs integer not null default 0,
  published_courses integer not null default 0,
  scheduled_sessions integer not null default 0,
  active_enrollments integer not null default 0,
  completed_enrollments integer not null default 0,
  issued_certificates integer not null default 0,
  overdue_assignments integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

create table if not exists public.ac360_school_academy_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  severity text not null default 'warning',
  category text not null default 'academy',
  title text not null,
  description text,
  entity_type text,
  entity_id uuid,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('info','warning','critical')),
  check (category in ('academy','training','assessment','certificate','compliance','staff','system')),
  check (status in ('open','in_progress','resolved','dismissed','archived'))
);

create index if not exists idx_ac360_school_academy_programs_org_status on public.ac360_school_academy_programs(org_id,status);
create index if not exists idx_ac360_school_academy_courses_org_status on public.ac360_school_academy_courses(org_id,status);
create index if not exists idx_ac360_school_academy_sessions_org_status on public.ac360_school_academy_sessions(org_id,status);
create index if not exists idx_ac360_school_academy_enrollments_org_status on public.ac360_school_academy_enrollments(org_id,status);
create index if not exists idx_ac360_school_academy_enrollments_staff on public.ac360_school_academy_enrollments(staff_id,status);
create index if not exists idx_ac360_school_academy_certificates_staff on public.ac360_school_academy_certificates(staff_id,status);
create index if not exists idx_ac360_school_academy_alerts_org_status on public.ac360_school_academy_alerts(org_id,status,severity);

-- -----------------------------------------------------------------------------
-- 2. RPC helpers
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_academy_dashboard(p_org_id uuid, p_as_of_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_programs integer;
  v_courses integer;
  v_sessions integer;
  v_enrollments integer;
  v_completed integer;
  v_certificates integer;
  v_overdue integer;
  v_alerts integer;
begin
  select count(*) into v_programs from public.ac360_school_academy_programs where org_id=p_org_id and status in ('draft','published','paused');
  select count(*) into v_courses from public.ac360_school_academy_courses where org_id=p_org_id and status in ('draft','published','paused');
  select count(*) into v_sessions from public.ac360_school_academy_sessions where org_id=p_org_id and status in ('scheduled','confirmed','in_progress');
  select count(*) into v_enrollments from public.ac360_school_academy_enrollments where org_id=p_org_id and status in ('enrolled','in_progress');
  select count(*) into v_completed from public.ac360_school_academy_enrollments where org_id=p_org_id and status='completed';
  select count(*) into v_certificates from public.ac360_school_academy_certificates where org_id=p_org_id and status='issued';
  select count(*) into v_overdue from public.ac360_school_academy_training_assignments where org_id=p_org_id and status in ('open','in_progress') and due_at is not null and due_at < now();
  select count(*) into v_alerts from public.ac360_school_academy_alerts where org_id=p_org_id and status in ('open','in_progress');

  return jsonb_build_object('ok',true,'asOfDate',coalesce(p_as_of_date,current_date),'programs',v_programs,'courses',v_courses,'activeSessions',v_sessions,'activeEnrollments',v_enrollments,'completedEnrollments',v_completed,'issuedCertificates',v_certificates,'overdueAssignments',v_overdue,'openAlerts',v_alerts,'uiBuildAllowed',false,'phase','phase_2m_academy_training');
end $$;

create or replace function public.ac360_school_academy_upsert_program(
  p_org_id uuid, p_program_id uuid default null, p_program_key text default null, p_label text default null,
  p_program_type text default 'staff_training', p_target_audience text default 'staff', p_duration_hours numeric default 0,
  p_curriculum_json jsonb default '[]'::jsonb, p_status text default 'draft', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(nullif(p_program_key,''),'academy-program-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_academy_programs(id,org_id,program_key,label,program_type,target_audience,duration_hours,curriculum_json,status,created_by,metadata_json)
  values(coalesce(p_program_id,gen_random_uuid()),p_org_id,v_key,coalesce(nullif(p_label,''),'Academy Program'),coalesce(p_program_type,'staff_training'),coalesce(p_target_audience,'staff'),coalesce(p_duration_hours,0),coalesce(p_curriculum_json,'[]'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,program_key) do update set label=excluded.label,program_type=excluded.program_type,target_audience=excluded.target_audience,duration_hours=excluded.duration_hours,curriculum_json=excluded.curriculum_json,status=excluded.status,metadata_json=public.ac360_school_academy_programs.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  insert into public.ac360_school_academy_events(org_id,event_type,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,'program_upserted','academy_program',v_id,'info','Academy program upserted.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'programId',v_id,'programKey',v_key);
end $$;

create or replace function public.ac360_school_academy_upsert_course(
  p_org_id uuid, p_course_id uuid default null, p_program_id uuid default null, p_course_key text default null, p_title text default null,
  p_course_type text default 'training', p_level text default 'standard', p_duration_hours numeric default 0, p_content_json jsonb default '{}'::jsonb,
  p_status text default 'draft', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(nullif(p_course_key,''),'academy-course-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_academy_courses(id,org_id,program_id,course_key,title,course_type,level,duration_hours,content_json,status,created_by,metadata_json)
  values(coalesce(p_course_id,gen_random_uuid()),p_org_id,p_program_id,v_key,coalesce(nullif(p_title,''),'Academy Course'),coalesce(p_course_type,'training'),coalesce(p_level,'standard'),coalesce(p_duration_hours,0),coalesce(p_content_json,'{}'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,course_key) do update set program_id=excluded.program_id,title=excluded.title,course_type=excluded.course_type,level=excluded.level,duration_hours=excluded.duration_hours,content_json=excluded.content_json,status=excluded.status,metadata_json=public.ac360_school_academy_courses.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  insert into public.ac360_school_academy_events(org_id,event_type,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,'course_upserted','academy_course',v_id,'info','Academy course upserted.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'courseId',v_id,'courseKey',v_key);
end $$;

create or replace function public.ac360_school_academy_schedule_session(
  p_org_id uuid, p_campus_id uuid default null, p_course_id uuid default null, p_session_key text default null, p_title text default null,
  p_starts_at timestamptz default now(), p_ends_at timestamptz default null, p_delivery_mode text default 'onsite', p_trainer_staff_id uuid default null,
  p_capacity integer default null, p_status text default 'scheduled', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(nullif(p_session_key,''),'academy-session-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,4));
  insert into public.ac360_school_academy_sessions(org_id,campus_id,course_id,session_key,title,starts_at,ends_at,delivery_mode,trainer_staff_id,capacity,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,p_course_id,v_key,coalesce(nullif(p_title,''),'Academy Session'),coalesce(p_starts_at,now()),p_ends_at,coalesce(p_delivery_mode,'onsite'),p_trainer_staff_id,p_capacity,coalesce(p_status,'scheduled'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,session_key) do update set campus_id=excluded.campus_id,course_id=excluded.course_id,title=excluded.title,starts_at=excluded.starts_at,ends_at=excluded.ends_at,delivery_mode=excluded.delivery_mode,trainer_staff_id=excluded.trainer_staff_id,capacity=excluded.capacity,status=excluded.status,metadata_json=public.ac360_school_academy_sessions.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  insert into public.ac360_school_academy_events(org_id,event_type,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,'session_scheduled','academy_session',v_id,'info','Academy session scheduled.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'sessionId',v_id,'sessionKey',v_key);
end $$;

create or replace function public.ac360_school_academy_enroll_staff(
  p_org_id uuid, p_staff_id uuid, p_program_id uuid default null, p_course_id uuid default null, p_enrollment_type text default 'assigned',
  p_mandatory boolean default false, p_due_at timestamptz default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_code text;
begin
  v_code := 'ENR-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,6);
  insert into public.ac360_school_academy_enrollments(org_id,staff_id,program_id,course_id,enrollment_code,enrollment_type,mandatory,due_at,created_by,metadata_json)
  values(p_org_id,p_staff_id,p_program_id,p_course_id,v_code,coalesce(p_enrollment_type,'assigned'),coalesce(p_mandatory,false),p_due_at,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  insert into public.ac360_school_academy_events(org_id,event_type,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,'staff_enrolled','academy_enrollment',v_id,'info','Staff enrolled in Academy training.',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'enrollmentId',v_id,'enrollmentCode',v_code);
end $$;

create or replace function public.ac360_school_academy_record_attendance(
  p_org_id uuid, p_session_id uuid, p_staff_id uuid default null, p_enrollment_id uuid default null, p_attendance_status text default 'present',
  p_check_in_at timestamptz default now(), p_check_out_at timestamptz default null, p_note text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into public.ac360_school_academy_attendance(org_id,session_id,enrollment_id,staff_id,attendance_status,check_in_at,check_out_at,note,recorded_by,metadata_json)
  values(p_org_id,p_session_id,p_enrollment_id,p_staff_id,coalesce(p_attendance_status,'present'),p_check_in_at,p_check_out_at,p_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,session_id,staff_id) do update set enrollment_id=excluded.enrollment_id,attendance_status=excluded.attendance_status,check_in_at=excluded.check_in_at,check_out_at=excluded.check_out_at,note=excluded.note,metadata_json=public.ac360_school_academy_attendance.metadata_json || excluded.metadata_json
  returning id into v_id;
  return jsonb_build_object('ok',true,'attendanceId',v_id);
end $$;

create or replace function public.ac360_school_academy_upsert_assessment(
  p_org_id uuid, p_assessment_id uuid default null, p_course_id uuid default null, p_assessment_key text default null, p_title text default null,
  p_assessment_type text default 'quiz', p_max_score numeric default 100, p_pass_score numeric default 60, p_questions_json jsonb default '[]'::jsonb,
  p_status text default 'draft', p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_key text;
begin
  v_key := coalesce(nullif(p_assessment_key,''),'academy-assessment-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_academy_assessments(id,org_id,course_id,assessment_key,title,assessment_type,max_score,pass_score,questions_json,status,created_by,metadata_json)
  values(coalesce(p_assessment_id,gen_random_uuid()),p_org_id,p_course_id,v_key,coalesce(nullif(p_title,''),'Academy Assessment'),coalesce(p_assessment_type,'quiz'),coalesce(p_max_score,100),coalesce(p_pass_score,60),coalesce(p_questions_json,'[]'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,assessment_key) do update set course_id=excluded.course_id,title=excluded.title,assessment_type=excluded.assessment_type,max_score=excluded.max_score,pass_score=excluded.pass_score,questions_json=excluded.questions_json,status=excluded.status,metadata_json=public.ac360_school_academy_assessments.metadata_json || excluded.metadata_json,updated_at=now()
  returning id into v_id;
  return jsonb_build_object('ok',true,'assessmentId',v_id,'assessmentKey',v_key);
end $$;

create or replace function public.ac360_school_academy_record_assessment_result(
  p_org_id uuid, p_assessment_id uuid, p_staff_id uuid default null, p_enrollment_id uuid default null, p_score numeric default 0,
  p_max_score numeric default 100, p_answers_json jsonb default '{}'::jsonb, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_pass numeric; v_status text;
begin
  select pass_score into v_pass from public.ac360_school_academy_assessments where id=p_assessment_id and org_id=p_org_id;
  v_status := case when coalesce(p_score,0) >= coalesce(v_pass,60) then 'passed' else 'failed' end;
  insert into public.ac360_school_academy_assessment_results(org_id,assessment_id,enrollment_id,staff_id,score,max_score,result_status,answers_json,evaluated_by,metadata_json)
  values(p_org_id,p_assessment_id,p_enrollment_id,p_staff_id,coalesce(p_score,0),coalesce(p_max_score,100),v_status,coalesce(p_answers_json,'{}'::jsonb),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  if p_enrollment_id is not null and v_status='passed' then update public.ac360_school_academy_enrollments set progress_percent=100,status='completed',completed_at=now(),updated_at=now() where id=p_enrollment_id and org_id=p_org_id; end if;
  return jsonb_build_object('ok',true,'assessmentResultId',v_id,'resultStatus',v_status);
end $$;

create or replace function public.ac360_school_academy_issue_certificate(
  p_org_id uuid, p_staff_id uuid, p_enrollment_id uuid default null, p_assessment_result_id uuid default null, p_title text default null,
  p_expires_on date default null, p_document_id uuid default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_code text;
begin
  v_code := 'AC360-CERT-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_academy_certificates(org_id,staff_id,enrollment_id,assessment_result_id,certificate_code,title,expires_on,document_id,issued_by,metadata_json)
  values(p_org_id,p_staff_id,p_enrollment_id,p_assessment_result_id,v_code,coalesce(nullif(p_title,''),'AngelCare 360 Academy Certificate'),p_expires_on,p_document_id,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'certificateId',v_id,'certificateCode',v_code);
end $$;

create or replace function public.ac360_school_academy_create_assignment(
  p_org_id uuid, p_staff_id uuid default null, p_program_id uuid default null, p_course_id uuid default null, p_assignment_reason text default 'manual',
  p_mandatory boolean default true, p_due_at timestamptz default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_id uuid; v_key text;
begin
  v_key := 'ASSIGN-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,6);
  insert into public.ac360_school_academy_training_assignments(org_id,staff_id,program_id,course_id,assignment_key,assignment_reason,mandatory,due_at,created_by,metadata_json)
  values(p_org_id,p_staff_id,p_program_id,p_course_id,v_key,coalesce(p_assignment_reason,'manual'),coalesce(p_mandatory,true),p_due_at,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning id into v_id;
  return jsonb_build_object('ok',true,'assignmentId',v_id,'assignmentKey',v_key);
end $$;

create or replace function public.ac360_school_academy_reconcile(p_org_id uuid, p_as_of_date date default current_date, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_programs integer; v_courses integer; v_sessions integer; v_active_enrollments integer; v_completed integer; v_certificates integer; v_overdue integer;
begin
  select count(*) into v_programs from public.ac360_school_academy_programs where org_id=p_org_id and status='published';
  select count(*) into v_courses from public.ac360_school_academy_courses where org_id=p_org_id and status='published';
  select count(*) into v_sessions from public.ac360_school_academy_sessions where org_id=p_org_id and status in ('scheduled','confirmed','in_progress');
  select count(*) into v_active_enrollments from public.ac360_school_academy_enrollments where org_id=p_org_id and status in ('enrolled','in_progress');
  select count(*) into v_completed from public.ac360_school_academy_enrollments where org_id=p_org_id and status='completed';
  select count(*) into v_certificates from public.ac360_school_academy_certificates where org_id=p_org_id and status='issued';
  select count(*) into v_overdue from public.ac360_school_academy_training_assignments where org_id=p_org_id and status in ('open','in_progress') and due_at is not null and due_at < now();
  insert into public.ac360_school_academy_snapshots(org_id,snapshot_date,active_programs,published_courses,scheduled_sessions,active_enrollments,completed_enrollments,issued_certificates,overdue_assignments,metadata_json)
  values(p_org_id,coalesce(p_as_of_date,current_date),v_programs,v_courses,v_sessions,v_active_enrollments,v_completed,v_certificates,v_overdue,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,snapshot_date) do update set active_programs=excluded.active_programs,published_courses=excluded.published_courses,scheduled_sessions=excluded.scheduled_sessions,active_enrollments=excluded.active_enrollments,completed_enrollments=excluded.completed_enrollments,issued_certificates=excluded.issued_certificates,overdue_assignments=excluded.overdue_assignments,metadata_json=public.ac360_school_academy_snapshots.metadata_json || excluded.metadata_json,created_at=now();
  if v_overdue > 0 then
    insert into public.ac360_school_academy_alerts(org_id,alert_key,severity,category,title,description,metadata_json)
    values(p_org_id,'academy-overdue-assignments-'||coalesce(p_as_of_date,current_date),'warning','compliance','Overdue Academy training assignments',v_overdue||' training assignment(s) are overdue.',jsonb_build_object('overdueAssignments',v_overdue))
    on conflict(org_id,alert_key) do update set severity=excluded.severity,title=excluded.title,description=excluded.description,status='open',metadata_json=public.ac360_school_academy_alerts.metadata_json || excluded.metadata_json,updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'activePrograms',v_programs,'publishedCourses',v_courses,'scheduledSessions',v_sessions,'activeEnrollments',v_active_enrollments,'completedEnrollments',v_completed,'issuedCertificates',v_certificates,'overdueAssignments',v_overdue);
end $$;

create or replace function public.ac360_school_academy_resolve_alert(p_org_id uuid, p_alert_id uuid, p_resolution_note text default null, p_actor_app_user_id uuid default null, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
begin
  update public.ac360_school_academy_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,resolution_note=p_resolution_note,metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id;
  return jsonb_build_object('ok',true,'alertId',p_alert_id,'status','resolved');
end $$;

-- -----------------------------------------------------------------------------
-- 3. Feature registry, actions, wiring, module coverage and rules
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('academy_training_module','school_operations','academy_training','Academy Training Module','Staff courses, sessions, assessments, certificates and training compliance runtime.','access',false,true,false,null,0,'{"phase":"phase_2m","growthMenu":"academy_training_module"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_addons(addon_key,label,family,description,billing_model,monthly_price_mad,setup_price_mad,unit_label,included_allowance_json,cancellable,data_preservation_policy,status,metadata_json) values
('academy_training_module','Academy Training, Assessments & Certificates','academy_training','Staff training records, course library, sessions, assessments, certificates, compliance snapshots and Academy alerts.','monthly',990,0,'institution','{"included":"academy_training_runtime","certificates":"standard","assessments":"standard","sessions":"standard"}'::jsonb,true,'preserve_data_read_only_after_period','active','{"phase":"phase_2m","recommendedFor":"schools wanting staff professionalization, compliance and continuous training"}'::jsonb)
on conflict(addon_key) do update set label=excluded.label,family=excluded.family,description=excluded.description,billing_model=excluded.billing_model,monthly_price_mad=excluded.monthly_price_mad,setup_price_mad=excluded.setup_price_mad,included_allowance_json=excluded.included_allowance_json,cancellable=excluded.cancellable,data_preservation_policy=excluded.data_preservation_policy,status=excluded.status,metadata_json=public.ac360_addons.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.academy.program.upsert','academy_training_module','AC360-ENG-52','Upsert Academy program','Create or update Academy training program.','academy.program.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.course.upsert','academy_training_module','AC360-ENG-52','Upsert Academy course','Create or update Academy course.','academy.course.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.session.schedule','academy_training_module','AC360-ENG-52','Schedule Academy session','Schedule staff training session.','academy.session.schedule','automation',1,'require_upgrade','{"access_type":"usage","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.staff.enroll','academy_training_module','AC360-ENG-52','Enroll staff in Academy','Enroll staff into program/course.','academy.staff.enroll','automation',1,'require_upgrade','{"access_type":"usage","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.attendance.record','academy_training_module','AC360-ENG-52','Record Academy attendance','Record training session attendance.','academy.attendance.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.assessment.upsert','academy_training_module','AC360-ENG-52','Upsert Academy assessment','Create or update Academy assessment.','academy.assessment.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.assessment_result.record','academy_training_module','AC360-ENG-52','Record assessment result','Record Academy assessment result.','academy.assessment_result.record','report',1,'require_upgrade','{"access_type":"usage","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.certificate.issue','academy_training_module','AC360-ENG-52','Issue Academy certificate','Issue staff training certificate.','academy.certificate.issue','report',2,'require_upgrade','{"access_type":"usage","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.assignment.create','academy_training_module','AC360-ENG-52','Create training assignment','Assign mandatory or optional training.','academy.assignment.create','automation',1,'require_upgrade','{"access_type":"usage","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.reconcile','academy_training_module','AC360-ENG-52','Reconcile Academy runtime','Refresh Academy snapshots and alerts.','academy.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb),
('school.academy.alert.resolve','academy_training_module','AC360-ENG-52','Resolve Academy alert','Resolve Academy alert.','academy.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2m_academy","suggested_addon_key":"academy_training_module"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_academy.program.upsert','/api/ac360/school-academy/programs/upsert','POST','school.academy.program.upsert','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_programs','strict','fixed_1','request_or_generated',null,null,'active','Upserts Academy program.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.course.upsert','/api/ac360/school-academy/courses/upsert','POST','school.academy.course.upsert','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_courses','strict','fixed_1','request_or_generated',null,null,'active','Upserts Academy course.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.session.schedule','/api/ac360/school-academy/sessions/schedule','POST','school.academy.session.schedule','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_sessions','strict','fixed_1','request_or_generated',null,null,'active','Schedules Academy session.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.staff.enroll','/api/ac360/school-academy/enrollments/staff','POST','school.academy.staff.enroll','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_enrollments','strict','fixed_1','request_or_generated',null,null,'active','Enrolls staff in Academy training.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.attendance.record','/api/ac360/school-academy/attendance/record','POST','school.academy.attendance.record','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_attendance','strict','fixed_1','request_or_generated',null,null,'active','Records Academy attendance.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.assessment.upsert','/api/ac360/school-academy/assessments/upsert','POST','school.academy.assessment.upsert','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_assessments','strict','fixed_1','request_or_generated',null,null,'active','Upserts Academy assessment.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.assessment_result.record','/api/ac360/school-academy/assessment-results/record','POST','school.academy.assessment_result.record','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_assessment_results','strict','fixed_1','request_or_generated',null,null,'active','Records Academy assessment result.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.certificate.issue','/api/ac360/school-academy/certificates/issue','POST','school.academy.certificate.issue','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_certificates','strict','fixed_1','request_or_generated',null,null,'active','Issues Academy certificate.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.assignment.create','/api/ac360/school-academy/assignments/create','POST','school.academy.assignment.create','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_training_assignments','strict','fixed_1','request_or_generated',null,null,'active','Creates training assignment.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.reconcile','/api/ac360/school-academy/reconcile','POST','school.academy.reconcile','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles Academy runtime.','{"phase":"phase_2m"}'::jsonb),
('ac360.school_academy.alert.resolve','/api/ac360/school-academy/alerts/resolve','POST','school.academy.alert.resolve','academy_training_module','AC360-ENG-52','angelcare_360_school_academy','ac360_school_academy_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves Academy alert.','{"phase":"phase_2m"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_school_ops_modules(module_key,engine_code,feature_key,label,phase,status,data_tables,guarded_actions,metadata_json)
values('academy_training_staff_courses_assessments_certificates','AC360-ENG-52','academy_training_module','Academy Training, Staff Courses, Assessments & Certificates Runtime','phase_2m_academy_training_staff_courses_assessments_certificates','guarded',array['ac360_school_academy_programs','ac360_school_academy_courses','ac360_school_academy_sessions','ac360_school_academy_enrollments','ac360_school_academy_assessments','ac360_school_academy_certificates','ac360_school_academy_alerts'],array['school.academy.program.upsert','school.academy.course.upsert','school.academy.session.schedule','school.academy.staff.enroll','school.academy.attendance.record','school.academy.assessment.upsert','school.academy.assessment_result.record','school.academy.certificate.issue','school.academy.assignment.create','school.academy.reconcile','school.academy.alert.resolve'],'{"phase":"phase_2m","uiBuildAllowed":false,"archiveNotDelete":true,"growthMenu":"academy_training_module"}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2m.academy.no_ui_before_backend_gate','No Academy UI before backend gate','School Operations System','phase2m.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,250,'active','phase_2m_academy'),
('phase2m.academy.guard_every_action','Every Academy action is guarded','School Operations System','school_academy.action.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,251,'active','phase_2m_academy'),
('phase2m.academy.overdue_training_alert','Overdue training assignments create alerts','School Operations System','school_academy.training_assignment.overdue','{"due_at":"past"}'::jsonb,'{"create_alert":true,"severity":"warning"}'::jsonb,252,'active','phase_2m_academy'),
('phase2m.academy.certificate_expiry_watch','Certificate expiry creates compliance alert','School Operations System','school_academy.certificate.near_expiry','{"expires_within_days":30}'::jsonb,'{"create_alert":true,"severity":"warning"}'::jsonb,253,'active','phase_2m_academy')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

-- RLS lockdown: service role/runtime only until UI build is explicitly authorized.
alter table public.ac360_school_academy_programs enable row level security;
alter table public.ac360_school_academy_courses enable row level security;
alter table public.ac360_school_academy_sessions enable row level security;
alter table public.ac360_school_academy_enrollments enable row level security;
alter table public.ac360_school_academy_attendance enable row level security;
alter table public.ac360_school_academy_assessments enable row level security;
alter table public.ac360_school_academy_assessment_results enable row level security;
alter table public.ac360_school_academy_certificates enable row level security;
alter table public.ac360_school_academy_training_assignments enable row level security;
alter table public.ac360_school_academy_events enable row level security;
alter table public.ac360_school_academy_snapshots enable row level security;
alter table public.ac360_school_academy_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ac360_school_academy_programs','ac360_school_academy_courses','ac360_school_academy_sessions','ac360_school_academy_enrollments','ac360_school_academy_attendance','ac360_school_academy_assessments','ac360_school_academy_assessment_results','ac360_school_academy_certificates','ac360_school_academy_training_assignments','ac360_school_academy_events','ac360_school_academy_snapshots','ac360_school_academy_alerts'] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_' || t, t);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', 'ac360_service_role_' || t, t);
  end loop;
end $$;

commit;
