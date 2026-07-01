-- AngelCare 360 Phase 2A - Core School Operations Backend Skeleton
-- Ref: AC360-PH2A-SCHOOL-OPS-SKELETON-2026-06-30
-- Scope: DB-first operational tables + guarded action wiring for core school operations.
-- Strict rule: no front-end school UI yet. This phase makes the real school operations backend alive under AC360 guard doctrine.
-- Safe to run multiple times on Supabase Postgres.

create extension if not exists pgcrypto;

-- Compatibility bridge for Phase 1D/1E installations where this column was hotfixed manually.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Phase 2A module coverage registry
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_ops_modules (
  module_key text primary key,
  engine_code text references public.ac360_foundation_engines(engine_code) on delete set null,
  feature_key text references public.ac360_feature_registry(feature_key) on delete set null,
  label text not null,
  phase text not null default 'phase_2a_core_school_ops_skeleton',
  status text not null default 'backend_ready',
  data_tables text[] not null default '{}',
  guarded_actions text[] not null default '{}',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('planned','backend_ready','guarded','ui_pending','active','archived'))
);

drop trigger if exists trg_ac360_school_ops_modules_updated_at on public.ac360_school_ops_modules;
create trigger trg_ac360_school_ops_modules_updated_at
before update on public.ac360_school_ops_modules
for each row execute function public.ac360_touch_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Core school operations tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_students (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  student_code text not null,
  first_name text not null,
  last_name text,
  preferred_name text,
  date_of_birth date,
  gender text,
  enrollment_status text not null default 'enrolled',
  status text not null default 'active',
  joined_on date default current_date,
  exited_on date,
  primary_language text default 'fr',
  health_notes text,
  allergies text,
  emergency_notes text,
  billing_status text not null default 'billable',
  source_channel text default 'manual',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, student_code),
  check (status in ('active','inactive','restricted','archived')),
  check (enrollment_status in ('prospect','waiting_list','pre_enrolled','enrolled','active','paused','withdrawn','graduated','archived')),
  check (billing_status in ('billable','scholarship','staff_child','paused','non_billable'))
);

create table if not exists public.ac360_school_guardians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  guardian_code text not null,
  full_name text not null,
  relation_label text,
  phone text,
  whatsapp text,
  email text,
  preferred_channel text not null default 'whatsapp',
  portal_status text not null default 'not_invited',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, guardian_code),
  check (status in ('active','inactive','blocked','archived')),
  check (portal_status in ('not_invited','invited','active','restricted','disabled'))
);

create table if not exists public.ac360_school_student_guardians (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  guardian_id uuid not null references public.ac360_school_guardians(id) on delete cascade,
  relation_label text not null default 'guardian',
  is_primary boolean not null default false,
  can_pickup boolean not null default true,
  can_receive_billing boolean not null default true,
  can_receive_reports boolean not null default true,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, student_id, guardian_id),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  membership_id uuid references public.ac360_user_memberships(id) on delete set null,
  staff_code text not null,
  full_name text not null,
  email text,
  phone text,
  staff_type text not null default 'staff',
  department text,
  role_label text,
  employment_status text not null default 'active',
  status text not null default 'active',
  started_on date default current_date,
  ended_on date,
  shift_profile_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, staff_code),
  check (status in ('active','inactive','restricted','archived')),
  check (employment_status in ('candidate','active','probation','paused','left','archived'))
);

create table if not exists public.ac360_school_classes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  class_code text not null,
  name text not null,
  level_label text,
  age_band text,
  capacity_students integer,
  main_teacher_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, class_code),
  check (status in ('active','inactive','full','restricted','archived'))
);

create table if not exists public.ac360_school_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  class_id uuid not null references public.ac360_school_classes(id) on delete cascade,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  status text not null default 'active',
  starts_on date default current_date,
  ends_on date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, student_id, class_id, starts_on),
  check (status in ('active','paused','completed','archived'))
);

create table if not exists public.ac360_school_attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  class_id uuid references public.ac360_school_classes(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  session_date date not null default current_date,
  session_key text not null default 'daily',
  status text not null default 'open',
  opened_by uuid,
  closed_by uuid,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, campus_id, class_id, session_date, session_key),
  check (status in ('open','closed','locked','archived'))
);

create table if not exists public.ac360_school_attendance_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  attendance_session_id uuid references public.ac360_school_attendance_sessions(id) on delete cascade,
  student_id uuid references public.ac360_school_students(id) on delete cascade,
  staff_profile_id uuid references public.ac360_school_staff_profiles(id) on delete cascade,
  attendance_type text not null default 'student',
  attendance_status text not null default 'present',
  recorded_at timestamptz not null default now(),
  check_in_at timestamptz,
  check_out_at timestamptz,
  reason text,
  source text not null default 'manual',
  corrected_from_record_id uuid references public.ac360_school_attendance_records(id) on delete set null,
  correction_status text not null default 'none',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (attendance_type in ('student','staff')),
  check (attendance_status in ('present','absent','late','early_out','authorized_absence','sick','holiday','unknown')),
  check (correction_status in ('none','requested','approved','rejected'))
);

create table if not exists public.ac360_school_invoice_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid not null references public.ac360_school_students(id) on delete cascade,
  billing_guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  account_code text not null,
  billing_cycle text not null default 'monthly',
  currency text not null default 'MAD',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, account_code),
  unique(org_id, student_id),
  check (status in ('active','paused','closed','archived'))
);

create table if not exists public.ac360_school_tuition_invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  invoice_account_id uuid references public.ac360_school_invoice_accounts(id) on delete set null,
  invoice_number text not null,
  invoice_type text not null default 'tuition',
  status text not null default 'draft',
  currency text not null default 'MAD',
  issue_date date not null default current_date,
  due_date date,
  subtotal_mad numeric not null default 0,
  discount_mad numeric not null default 0,
  total_mad numeric not null default 0,
  paid_mad numeric not null default 0,
  balance_mad numeric generated always as (greatest(total_mad - paid_mad, 0)) stored,
  generated_by uuid,
  sent_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, invoice_number),
  check (invoice_type in ('tuition','registration','transport','meal','activity','extra','other')),
  check (status in ('draft','issued','sent','partially_paid','paid','overdue','cancelled','archived'))
);

create table if not exists public.ac360_school_tuition_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  invoice_id uuid not null references public.ac360_school_tuition_invoices(id) on delete cascade,
  line_key text not null default 'tuition',
  label text not null,
  quantity numeric not null default 1,
  unit_price_mad numeric not null default 0,
  amount_mad numeric not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ac360_school_fee_payments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  invoice_id uuid references public.ac360_school_tuition_invoices(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  payment_reference text not null,
  payment_method text not null default 'cash',
  status text not null default 'recorded',
  amount_mad numeric not null default 0,
  paid_at timestamptz not null default now(),
  recorded_by uuid,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, payment_reference),
  check (payment_method in ('cash','bank_transfer','cheque','card','online','other')),
  check (status in ('recorded','confirmed','reconciled','cancelled','archived'))
);

create table if not exists public.ac360_school_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  staff_profile_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  document_code text not null,
  document_type text not null default 'general',
  title text not null,
  file_name text,
  file_path text,
  file_size_bytes bigint not null default 0,
  mime_type text,
  status text not null default 'active',
  uploaded_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, document_code),
  check (status in ('active','pending_review','approved','rejected','archived'))
);

create table if not exists public.ac360_school_report_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  report_code text not null,
  report_type text not null default 'standard',
  title text not null,
  status text not null default 'queued',
  requested_by uuid,
  period_start date,
  period_end date,
  output_path text,
  generated_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, report_code),
  check (status in ('queued','running','generated','failed','archived')),
  check (report_type in ('standard','attendance','finance','student','classroom','executive','custom'))
);

create table if not exists public.ac360_school_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  message_code text not null,
  channel text not null default 'email',
  audience_type text not null default 'parents',
  subject text,
  body text not null,
  status text not null default 'draft',
  recipient_count integer not null default 1,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, message_code),
  check (channel in ('email','whatsapp','sms','push','internal')),
  check (audience_type in ('parents','staff','class','student','custom')),
  check (status in ('draft','scheduled','sent','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  task_code text not null,
  title text not null,
  description text,
  department text,
  status text not null default 'planned',
  priority text not null default 'medium',
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  related_entity_type text,
  related_entity_id uuid,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, task_code),
  check (status in ('planned','in_progress','blocked','done','cancelled','archived')),
  check (priority in ('low','medium','high','urgent'))
);

create table if not exists public.ac360_school_operation_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  event_key text not null,
  action_key text references public.ac360_action_registry(action_key) on delete set null,
  entity_type text,
  entity_id uuid,
  severity text not null default 'info',
  message text not null,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('debug','info','warning','high','critical'))
);

-- -----------------------------------------------------------------------------
-- 3. Indexes + updated_at triggers
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_school_students_org_status on public.ac360_school_students(org_id, status, enrollment_status);
create index if not exists idx_ac360_school_students_campus on public.ac360_school_students(campus_id, status);
create index if not exists idx_ac360_school_guardians_org_status on public.ac360_school_guardians(org_id, status, portal_status);
create index if not exists idx_ac360_school_student_guardians_student on public.ac360_school_student_guardians(student_id, status);
create index if not exists idx_ac360_school_staff_org_status on public.ac360_school_staff_profiles(org_id, status, employment_status);
create index if not exists idx_ac360_school_classes_org_status on public.ac360_school_classes(org_id, status);
create index if not exists idx_ac360_school_class_enrollments_student on public.ac360_school_class_enrollments(student_id, status);
create index if not exists idx_ac360_school_attendance_sessions_org_date on public.ac360_school_attendance_sessions(org_id, session_date, status);
create index if not exists idx_ac360_school_attendance_records_org_type on public.ac360_school_attendance_records(org_id, attendance_type, attendance_status, recorded_at desc);
create index if not exists idx_ac360_school_invoices_org_status on public.ac360_school_tuition_invoices(org_id, status, issue_date desc);
create index if not exists idx_ac360_school_payments_org_status on public.ac360_school_fee_payments(org_id, status, paid_at desc);
create index if not exists idx_ac360_school_documents_org_status on public.ac360_school_documents(org_id, status, document_type);
create index if not exists idx_ac360_school_report_jobs_org_status on public.ac360_school_report_jobs(org_id, status, report_type);
create index if not exists idx_ac360_school_messages_org_status on public.ac360_school_messages(org_id, status, channel);
create index if not exists idx_ac360_school_tasks_org_status on public.ac360_school_tasks(org_id, status, priority);
create index if not exists idx_ac360_school_operation_events_org_created on public.ac360_school_operation_events(org_id, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_students','ac360_school_guardians','ac360_school_student_guardians','ac360_school_staff_profiles',
    'ac360_school_classes','ac360_school_class_enrollments','ac360_school_attendance_sessions','ac360_school_attendance_records',
    'ac360_school_invoice_accounts','ac360_school_tuition_invoices','ac360_school_tuition_invoice_lines','ac360_school_fee_payments',
    'ac360_school_documents','ac360_school_report_jobs','ac360_school_messages','ac360_school_tasks'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4. Service-role RLS policies for backend API control
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_ops_modules','ac360_school_students','ac360_school_guardians','ac360_school_student_guardians','ac360_school_staff_profiles',
    'ac360_school_classes','ac360_school_class_enrollments','ac360_school_attendance_sessions','ac360_school_attendance_records',
    'ac360_school_invoice_accounts','ac360_school_tuition_invoices','ac360_school_tuition_invoice_lines','ac360_school_fee_payments',
    'ac360_school_documents','ac360_school_report_jobs','ac360_school_messages','ac360_school_tasks','ac360_school_operation_events'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 5. Phase 2A action registry and wiring seeds
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('school_ops.bootstrap','academic_years','AC360-ENG-04','Bootstrap school operations skeleton','Create or verify base school operations primitives for one tenant.','school_ops.bootstrap',null,0,'block','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.student.create','student_core','AC360-ENG-45','Create school student','Create one active school student under capacity governance.','capacity.students','student_capacity',0,'require_upgrade','{"access_type":"write","capacity_key":"students","suggested_addon_key":"extra_50_students","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.guardian.create','parent_portal_basic','AC360-ENG-46','Create guardian record','Create one parent/guardian record linked to school operations.','parents.basic',null,0,'block','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.staff.create','staff_core','AC360-ENG-09','Create staff profile','Create one school staff profile under staff capacity governance.','capacity.staff_users','staff_user_capacity',0,'require_upgrade','{"access_type":"write","capacity_key":"staff_users","suggested_addon_key":"extra_5_staff","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.class.create','classroom_core','AC360-ENG-47','Create school class','Create one classroom/group under class capacity governance.','capacity.classes',null,0,'require_upgrade','{"access_type":"write","capacity_key":"classes","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.enrollment.create','student_core','AC360-ENG-45','Create class enrollment','Assign one student to one class while preserving lifecycle history.','students.enrollment.create',null,0,'block','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.attendance.record','attendance_basic','AC360-ENG-48','Record school attendance','Record student/staff attendance in a guarded session.','attendance.record',null,0,'block','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.invoice.create','finance_basic','AC360-ENG-49','Create school invoice','Create tuition/fee invoice record for a student account.','finance.invoice.create',null,0,'block','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.document.upload','documents_storage','AC360-ENG-50','Register school document','Register document metadata/file under storage capacity governance.','documents.upload','storage_gb',0,'require_upgrade','{"access_type":"write","capacity_key":"storage_gb","suggested_addon_key":"storage_25gb","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.message.send','communication_basic','AC360-ENG-33','Create/send school message','Create one school communication message and meter recipient volume.','communication.basic','email_message',1,'require_topup','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.report.generate','reports_basic','AC360-ENG-51','Generate school report job','Queue one report generation job and meter report credits.','reports.generate','report_generation',10,'require_topup','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb),
('school.task.create','tasks_basic','AC360-ENG-52','Create school operations task','Create one internal school operation task.','tasks.basic',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2a_core_school_ops_skeleton"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table,
  enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.school_ops.bootstrap','/api/ac360/school-ops/bootstrap','POST','school_ops.bootstrap','academic_years','AC360-ENG-04','angelcare_360_school_ops',null,'strict','fixed_1','request_or_generated',null,null,'active','Bootstraps Phase 2A school operations backend primitives under guard.','{"phase":"phase_2a","no_frontend":true}'::jsonb),
('ac360.school_ops.student.create','/api/ac360/school-ops/students','POST','school.student.create','student_core','AC360-ENG-45','angelcare_360_school_ops','ac360_school_students','strict','fixed_1','request_or_generated','students_live_count',null,'active','Creates school student through AC360 capacity guard.','{"phase":"phase_2a","capacity_key":"students"}'::jsonb),
('ac360.school_ops.guardian.create','/api/ac360/school-ops/guardians','POST','school.guardian.create','parent_portal_basic','AC360-ENG-46','angelcare_360_school_ops','ac360_school_guardians','strict','fixed_1','request_or_generated',null,null,'active','Creates guardian record through AC360 guard.','{"phase":"phase_2a"}'::jsonb),
('ac360.school_ops.staff.create','/api/ac360/school-ops/staff','POST','school.staff.create','staff_core','AC360-ENG-09','angelcare_360_school_ops','ac360_school_staff_profiles','strict','fixed_1','request_or_generated','staff_users_live_count',null,'active','Creates staff profile through AC360 staff capacity guard.','{"phase":"phase_2a","capacity_key":"staff_users"}'::jsonb),
('ac360.school_ops.class.create','/api/ac360/school-ops/classes','POST','school.class.create','classroom_core','AC360-ENG-47','angelcare_360_school_ops','ac360_school_classes','strict','fixed_1','request_or_generated','classes_live_count',null,'active','Creates classroom/group through AC360 class capacity guard.','{"phase":"phase_2a","capacity_key":"classes"}'::jsonb),
('ac360.school_ops.enrollment.create','/api/ac360/school-ops/enrollments','POST','school.enrollment.create','student_core','AC360-ENG-45','angelcare_360_school_ops','ac360_school_class_enrollments','strict','fixed_1','request_or_generated',null,null,'active','Assigns a student to a class under guarded lifecycle control.','{"phase":"phase_2a"}'::jsonb),
('ac360.school_ops.attendance.record','/api/ac360/school-ops/attendance','POST','school.attendance.record','attendance_basic','AC360-ENG-48','angelcare_360_school_ops','ac360_school_attendance_records','strict','fixed_1','request_or_generated',null,null,'active','Records attendance under AC360 operational guard.','{"phase":"phase_2a"}'::jsonb),
('ac360.school_ops.invoice.create','/api/ac360/school-ops/invoices','POST','school.invoice.create','finance_basic','AC360-ENG-49','angelcare_360_school_ops','ac360_school_tuition_invoices','strict','fixed_1','request_or_generated',null,null,'active','Creates school tuition/fee invoice under finance entitlement.','{"phase":"phase_2a"}'::jsonb),
('ac360.school_ops.document.upload','/api/ac360/school-ops/documents','POST','school.document.upload','documents_storage','AC360-ENG-50','angelcare_360_school_ops','ac360_school_documents','strict','storage_gb','request_or_generated','storage_gb_live_sum',null,'active','Registers school document under AC360 storage guard.','{"phase":"phase_2a","capacity_key":"storage_gb"}'::jsonb),
('ac360.school_ops.message.send','/api/ac360/school-ops/messages','POST','school.message.send','communication_basic','AC360-ENG-33','angelcare_360_school_ops','ac360_school_messages','strict','recipient_count','request_or_generated',null,null,'active','Creates/sends school message with recipient credit metering.','{"phase":"phase_2a","meter":"email_message"}'::jsonb),
('ac360.school_ops.report.generate','/api/ac360/school-ops/reports','POST','school.report.generate','reports_basic','AC360-ENG-51','angelcare_360_school_ops','ac360_school_report_jobs','strict','fixed_1','request_or_generated',null,null,'active','Queues report generation through report credits.','{"phase":"phase_2a","meter":"report_generation"}'::jsonb),
('ac360.school_ops.task.create','/api/ac360/school-ops/tasks','POST','school.task.create','tasks_basic','AC360-ENG-52','angelcare_360_school_ops','ac360_school_tasks','strict','fixed_1','request_or_generated',null,'operations.task_create','active','Creates internal school operations task under task entitlement.','{"phase":"phase_2a"}'::jsonb)
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
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 6. Module matrix + automation rules + permissions
-- -----------------------------------------------------------------------------
insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, status, data_tables, guarded_actions, metadata_json) values
('students','AC360-ENG-45','student_core','Students & lifecycle backend','guarded',array['ac360_school_students','ac360_school_student_guardians'],array['school.student.create','school.enrollment.create'],'{"phase":"phase_2a"}'::jsonb),
('parents','AC360-ENG-46','parent_portal_basic','Parents / guardians backend','guarded',array['ac360_school_guardians','ac360_school_student_guardians'],array['school.guardian.create'],'{"phase":"phase_2a"}'::jsonb),
('staff','AC360-ENG-09','staff_core','Staff profiles backend','guarded',array['ac360_school_staff_profiles'],array['school.staff.create'],'{"phase":"phase_2a"}'::jsonb),
('classes','AC360-ENG-47','classroom_core','Classes and enrollments backend','guarded',array['ac360_school_classes','ac360_school_class_enrollments'],array['school.class.create','school.enrollment.create'],'{"phase":"phase_2a"}'::jsonb),
('attendance','AC360-ENG-48','attendance_basic','Attendance backend','guarded',array['ac360_school_attendance_sessions','ac360_school_attendance_records'],array['school.attendance.record'],'{"phase":"phase_2a"}'::jsonb),
('finance','AC360-ENG-49','finance_basic','School tuition finance backend','guarded',array['ac360_school_invoice_accounts','ac360_school_tuition_invoices','ac360_school_tuition_invoice_lines','ac360_school_fee_payments'],array['school.invoice.create'],'{"phase":"phase_2a"}'::jsonb),
('documents','AC360-ENG-50','documents_storage','Document/storage backend','guarded',array['ac360_school_documents'],array['school.document.upload'],'{"phase":"phase_2a"}'::jsonb),
('reports','AC360-ENG-51','reports_basic','Report jobs backend','guarded',array['ac360_school_report_jobs'],array['school.report.generate'],'{"phase":"phase_2a"}'::jsonb),
('communication','AC360-ENG-33','communication_basic','School communication backend','guarded',array['ac360_school_messages'],array['school.message.send'],'{"phase":"phase_2a"}'::jsonb),
('tasks','AC360-ENG-52','tasks_basic','School task operations backend','guarded',array['ac360_school_tasks'],array['school.task.create'],'{"phase":"phase_2a"}'::jsonb)
on conflict (module_key) do update set engine_code=excluded.engine_code, feature_key=excluded.feature_key, label=excluded.label, status=excluded.status, data_tables=excluded.data_tables, guarded_actions=excluded.guarded_actions, metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json, updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase) values
('phase2a.school_ops.no_ui_before_backend_gate','No school UI before backend gate','School Operations System','phase2a.backend.ready','{"ui_build_allowed":false}'::jsonb,'{"require_user_frontend_instructions":true,"block_frontend_drift":true}'::jsonb,120,'active','phase_2a_core_school_ops_skeleton'),
('phase2a.school_ops.guard_every_create','Every school create action is guarded','School Operations System','school_ops.create.before_execute','{"enforcement_mode":"strict"}'::jsonb,'{"call_ac360_guard":true,"record_usage_after_success":true}'::jsonb,121,'active','phase_2a_core_school_ops_skeleton'),
('phase2a.school_ops.capacity_snapshots','School capacity snapshots are live','School Operations System','school_ops.capacity.changed','{"capacity_keys":["students","staff_users","classes","storage_gb"]}'::jsonb,'{"refresh_capacity_snapshot":true,"recommend_upgrade_at_limit":true}'::jsonb,122,'active','phase_2a_core_school_ops_skeleton'),
('phase2a.school_ops_data_preservation','Core school records preserve history','School Operations System','school_ops.cancel_or_archive','{"delete_strategy":"disabled"}'::jsonb,'{"archive_not_delete":true,"read_only_after_cancel":true}'::jsonb,123,'active','phase_2a_core_school_ops_skeleton')
on conflict (rule_key) do update set label=excluded.label, condition_json=excluded.condition_json, action_json=excluded.action_json, sort_order=excluded.sort_order, status=excluded.status, phase=excluded.phase, updated_at=now();

insert into public.ac360_permissions(permission_key, category, label, description, risk_level, is_system_locked) values
('ac360.school_ops.view','AC360 School Ops','View school operations backend','Allows viewing core school operations backend records and readiness.', 'medium', true),
('ac360.school_ops.write','AC360 School Ops','Write school operations records','Allows guarded creation of school operations records.', 'high', true),
('ac360.school_ops.bootstrap','AC360 School Ops','Bootstrap school operations','Allows bootstrapping Phase 2A backend primitives for a tenant.', 'critical', true)
on conflict (permission_key) do update set label=excluded.label, description=excluded.description, risk_level=excluded.risk_level, updated_at=now();

-- -----------------------------------------------------------------------------
-- 7. Capacity + readiness RPCs
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_current_capacity(
  p_org_id uuid,
  p_capacity_key text
)
returns numeric
language plpgsql
security definer
as $$
declare
  v_value numeric := 0;
begin
  if p_org_id is null then return 0; end if;

  if p_capacity_key = 'students' then
    select count(*)::numeric into v_value
    from public.ac360_school_students
    where org_id = p_org_id
      and status = 'active'
      and enrollment_status in ('pre_enrolled','enrolled','active');
  elsif p_capacity_key = 'staff_users' then
    select count(*)::numeric into v_value
    from public.ac360_school_staff_profiles
    where org_id = p_org_id
      and status = 'active'
      and employment_status in ('active','probation');
  elsif p_capacity_key = 'classes' then
    select count(*)::numeric into v_value
    from public.ac360_school_classes
    where org_id = p_org_id and status in ('active','full');
  elsif p_capacity_key = 'storage_gb' then
    select coalesce(sum(file_size_bytes),0)::numeric / 1073741824.0 into v_value
    from public.ac360_school_documents
    where org_id = p_org_id and status in ('active','pending_review','approved');
  elsif p_capacity_key = 'reports_monthly' then
    select count(*)::numeric into v_value
    from public.ac360_school_report_jobs
    where org_id = p_org_id
      and created_at >= date_trunc('month', now())
      and status <> 'archived';
  else
    select 0::numeric into v_value;
  end if;

  return greatest(coalesce(v_value,0),0);
end;
$$;

create or replace function public.ac360_school_ops_readiness_dashboard(
  p_org_id uuid default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_org_id uuid := p_org_id;
  v_counts jsonb := '{}'::jsonb;
  v_modules jsonb := '[]'::jsonb;
  v_wiring_count integer := 0;
  v_required_tables text[] := array[
    'ac360_school_students','ac360_school_guardians','ac360_school_student_guardians','ac360_school_staff_profiles',
    'ac360_school_classes','ac360_school_class_enrollments','ac360_school_attendance_sessions','ac360_school_attendance_records',
    'ac360_school_invoice_accounts','ac360_school_tuition_invoices','ac360_school_tuition_invoice_lines','ac360_school_fee_payments',
    'ac360_school_documents','ac360_school_report_jobs','ac360_school_messages','ac360_school_tasks','ac360_school_operation_events'
  ];
  v_missing text[] := '{}';
  t text;
begin
  foreach t in array v_required_tables loop
    if to_regclass('public.' || t) is null then
      v_missing := array_append(v_missing, t);
    end if;
  end loop;

  select count(*) into v_wiring_count
  from public.ac360_app_action_wiring
  where wiring_key like 'ac360.school_ops.%'
    and status = 'active';

  select coalesce(jsonb_agg(to_jsonb(m) order by m.module_key), '[]'::jsonb) into v_modules
  from public.ac360_school_ops_modules m;

  if v_org_id is not null then
    v_counts := jsonb_build_object(
      'students', public.ac360_school_current_capacity(v_org_id, 'students'),
      'staffUsers', public.ac360_school_current_capacity(v_org_id, 'staff_users'),
      'classes', public.ac360_school_current_capacity(v_org_id, 'classes'),
      'storageGb', round(public.ac360_school_current_capacity(v_org_id, 'storage_gb'), 4),
      'reportsThisMonth', public.ac360_school_current_capacity(v_org_id, 'reports_monthly'),
      'guardians', (select count(*) from public.ac360_school_guardians where org_id = v_org_id and status = 'active'),
      'attendanceRecords', (select count(*) from public.ac360_school_attendance_records where org_id = v_org_id),
      'schoolInvoices', (select count(*) from public.ac360_school_tuition_invoices where org_id = v_org_id and status <> 'archived'),
      'messages', (select count(*) from public.ac360_school_messages where org_id = v_org_id and status <> 'archived'),
      'tasks', (select count(*) from public.ac360_school_tasks where org_id = v_org_id and status <> 'archived')
    );
  end if;

  return jsonb_build_object(
    'ok', array_length(v_missing,1) is null and v_wiring_count >= 12,
    'phase', 'phase_2a_core_school_ops_skeleton',
    'uiBuildAllowed', false,
    'message', 'Phase 2A backend skeleton is DB-first and guarded. Front-end/UI build remains intentionally locked until user gives instructions.',
    'requiredTableCount', array_length(v_required_tables,1),
    'missingTables', coalesce(to_jsonb(v_missing), '[]'::jsonb),
    'activeSchoolOpsWiringCount', v_wiring_count,
    'modules', v_modules,
    'counts', v_counts,
    'checkedAt', now()
  );
end;
$$;

create or replace function public.ac360_bootstrap_school_ops_skeleton(
  p_org_id uuid,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_org public.ac360_organizations%rowtype;
  v_campus public.ac360_campuses%rowtype;
  v_year public.ac360_academic_years%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;

  select * into v_org from public.ac360_organizations where id = p_org_id limit 1;
  if v_org.id is null then raise exception 'AC360 organization not found'; end if;

  select * into v_campus from public.ac360_campuses where org_id = p_org_id and status = 'active' order by created_at asc limit 1;
  if v_campus.id is null then
    insert into public.ac360_campuses(org_id, campus_code, name, status, city, metadata_json)
    values (p_org_id, 'MAIN', coalesce(v_org.display_name,'AngelCare 360') || ' - Main Campus', 'active', v_org.city, '{"created_by":"phase_2a_bootstrap"}'::jsonb)
    returning * into v_campus;
  end if;

  select * into v_year from public.ac360_academic_years where org_id = p_org_id and status = 'active' order by created_at desc limit 1;
  if v_year.id is null then
    insert into public.ac360_academic_years(org_id, label, status, starts_on, ends_on, metadata_json)
    values (p_org_id, '2026-2027', 'active', date '2026-09-01', date '2027-07-31', '{"created_by":"phase_2a_bootstrap"}'::jsonb)
    on conflict (org_id, label) do update set status='active', updated_at=now()
    returning * into v_year;
  end if;

  update public.ac360_organizations
  set current_academic_year_id = coalesce(current_academic_year_id, v_year.id), lifecycle_status = case when lifecycle_status = 'prospect' then 'onboarding' else lifecycle_status end, updated_at = now()
  where id = p_org_id;

  insert into public.ac360_school_operation_events(org_id, campus_id, event_key, action_key, entity_type, entity_id, severity, message, actor_app_user_id, metadata_json)
  values (p_org_id, v_campus.id, 'phase2a.bootstrap.completed', 'school_ops.bootstrap', 'organization', p_org_id, 'info', 'Phase 2A core school operations backend skeleton bootstrapped.', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb));

  perform public.ac360_measure_capacity(p_org_id, 'students', public.ac360_school_current_capacity(p_org_id,'students'), 'ac360_school_students', '{"source":"phase_2a_bootstrap"}'::jsonb);
  perform public.ac360_measure_capacity(p_org_id, 'staff_users', public.ac360_school_current_capacity(p_org_id,'staff_users'), 'ac360_school_staff_profiles', '{"source":"phase_2a_bootstrap"}'::jsonb);
  perform public.ac360_measure_capacity(p_org_id, 'classes', public.ac360_school_current_capacity(p_org_id,'classes'), 'ac360_school_classes', '{"source":"phase_2a_bootstrap"}'::jsonb);
  perform public.ac360_measure_capacity(p_org_id, 'storage_gb', public.ac360_school_current_capacity(p_org_id,'storage_gb'), 'ac360_school_documents', '{"source":"phase_2a_bootstrap"}'::jsonb);

  return jsonb_build_object('ok', true, 'orgId', p_org_id, 'campusId', v_campus.id, 'academicYearId', v_year.id, 'readiness', public.ac360_school_ops_readiness_dashboard(p_org_id));
end;
$$;

-- -----------------------------------------------------------------------------
-- 8. Phase 2A audit event
-- -----------------------------------------------------------------------------
insert into public.ac360_policy_events(org_id, event_key, severity, message, metadata_json)
select null, 'phase2a.school_ops_skeleton.migration_applied', 'info', 'AC360 Phase 2A core school operations backend skeleton migration applied.', '{"phase":"phase_2a_core_school_ops_skeleton","ui_build_allowed":false}'::jsonb
where to_regclass('public.ac360_policy_events') is not null;
