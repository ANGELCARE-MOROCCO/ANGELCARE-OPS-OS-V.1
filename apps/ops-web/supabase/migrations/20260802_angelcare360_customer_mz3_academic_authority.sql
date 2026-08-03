begin;

create table if not exists public.angelcare360_attendance_correction_requests (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  title text not null, detail text, attendance_record_id uuid, original_state jsonb not null default '{}'::jsonb, requested_state jsonb not null default '{}'::jsonb,
  reason text, evidence_json jsonb not null default '{}'::jsonb, status text not null default 'open', severity text not null default 'info', requested_by uuid,
  approved_by uuid, approved_at timestamptz, rejected_by uuid, rejected_at timestamptz, resolved_by uuid, resolved_at timestamptz,
  created_by uuid, metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_attendance_day_closures (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  closure_date date, title text not null, detail text, status text not null default 'open', severity text not null default 'info', blocker_count integer not null default 0,
  readiness_json jsonb not null default '{}'::jsonb, requested_by uuid, requested_at timestamptz not null default now(), approved_by uuid, approved_at timestamptz,
  reopened_by uuid, reopened_at timestamptz, reopen_reason text, resolved_by uuid, resolved_at timestamptz, created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_timetable_publication_runs (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  title text not null, detail text, academic_year_id uuid, revision_code text, effective_at timestamptz, status text not null default 'open', severity text not null default 'info',
  impact_json jsonb not null default '{}'::jsonb, conflict_count integer not null default 0, requested_by uuid, approved_by uuid, published_by uuid, published_at timestamptz,
  supersedes_run_id uuid references public.angelcare360_timetable_publication_runs(id), resolved_by uuid, resolved_at timestamptz, created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_timetable_conflict_findings (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  publication_run_id uuid references public.angelcare360_timetable_publication_runs(id) on delete cascade, slot_id uuid, conflict_type text not null,
  title text not null, detail text, status text not null default 'open', severity text not null default 'warning', related_slot_ids uuid[] not null default '{}',
  resolution text, resolved_by uuid, resolved_at timestamptz, metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_timetable_revisions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  publication_run_id uuid references public.angelcare360_timetable_publication_runs(id) on delete cascade, revision_code text not null, status text not null default 'draft',
  snapshot_json jsonb not null default '{}'::jsonb, change_summary_json jsonb not null default '{}'::jsonb, created_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.angelcare360_grade_correction_requests (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  title text not null, detail text, mark_id uuid, student_id uuid, exam_id uuid, original_value numeric, requested_value numeric, reason text,
  evidence_json jsonb not null default '{}'::jsonb, status text not null default 'open', severity text not null default 'info', requested_by uuid,
  approved_by uuid, approved_at timestamptz, rejected_by uuid, rejected_at timestamptz, resolved_by uuid, resolved_at timestamptz, created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_academic_validation_batches (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  title text not null, detail text, academic_year_id uuid, term_id uuid, class_id uuid, validation_level text not null default 'academic_management',
  status text not null default 'open', severity text not null default 'info', readiness_json jsonb not null default '{}'::jsonb, requested_by uuid,
  approved_by uuid, approved_at timestamptz, resolved_by uuid, resolved_at timestamptz, created_by uuid, metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.angelcare360_average_computation_revisions (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  academic_year_id uuid, term_id uuid, class_id uuid, student_id uuid, formula_code text, formula_version integer not null default 1,
  input_snapshot jsonb not null default '{}'::jsonb, result_snapshot jsonb not null default '{}'::jsonb, rounding_rule text, status text not null default 'computed',
  created_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.angelcare360_report_card_publication_runs (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.angelcare360_schools(id) on delete cascade,
  title text not null, detail text, academic_year_id uuid, term_id uuid, class_id uuid, effective_at timestamptz,
  status text not null default 'open', severity text not null default 'info', readiness_json jsonb not null default '{}'::jsonb,
  published_count integer not null default 0, blocked_count integer not null default 0, skipped_count integer not null default 0,
  requested_by uuid, approved_by uuid, published_by uuid, published_at timestamptz, resolved_by uuid, resolved_at timestamptz, created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists ac360_attendance_correction_school_status_idx on public.angelcare360_attendance_correction_requests(school_id,status,created_at desc);
create index if not exists ac360_day_closure_school_date_idx on public.angelcare360_attendance_day_closures(school_id,closure_date desc,status);
create index if not exists ac360_timetable_publication_school_status_idx on public.angelcare360_timetable_publication_runs(school_id,status,created_at desc);
create index if not exists ac360_timetable_conflict_school_status_idx on public.angelcare360_timetable_conflict_findings(school_id,status,severity);
create index if not exists ac360_grade_correction_school_status_idx on public.angelcare360_grade_correction_requests(school_id,status,created_at desc);
create index if not exists ac360_academic_validation_school_status_idx on public.angelcare360_academic_validation_batches(school_id,status,created_at desc);
create index if not exists ac360_report_publication_school_status_idx on public.angelcare360_report_card_publication_runs(school_id,status,created_at desc);

do $$ declare t text; begin
  foreach t in array array[
    'angelcare360_attendance_correction_requests','angelcare360_attendance_day_closures','angelcare360_timetable_publication_runs',
    'angelcare360_timetable_conflict_findings','angelcare360_timetable_revisions','angelcare360_grade_correction_requests',
    'angelcare360_academic_validation_batches','angelcare360_average_computation_revisions','angelcare360_report_card_publication_runs'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists angelcare360_service_role_all on public.%I',t);
    execute format('create policy angelcare360_service_role_all on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

commit;
