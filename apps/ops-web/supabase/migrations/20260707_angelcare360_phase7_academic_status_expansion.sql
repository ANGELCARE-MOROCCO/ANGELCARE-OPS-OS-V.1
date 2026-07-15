do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.angelcare360_lessons'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.angelcare360_lessons drop constraint %I', constraint_name);
  end if;

  alter table public.angelcare360_lessons
    add constraint angelcare360_lessons_status_check_v2
    check (status in ('draft', 'planned', 'completed', 'cancelled', 'archived'));
end $$;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.angelcare360_assignment_submissions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.angelcare360_assignment_submissions drop constraint %I', constraint_name);
  end if;

  alter table public.angelcare360_assignment_submissions
    add constraint angelcare360_assignment_submissions_status_check_v2
    check (status in ('pending', 'draft', 'submitted', 'late', 'reviewed', 'graded', 'missing', 'archived'));
end $$;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.angelcare360_exams'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.angelcare360_exams drop constraint %I', constraint_name);
  end if;

  alter table public.angelcare360_exams
    add constraint angelcare360_exams_status_check_v2
    check (status in ('draft', 'planned', 'scheduled', 'active', 'open', 'completed', 'closed', 'graded', 'archived'));
end $$;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.angelcare360_report_cards'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%status%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.angelcare360_report_cards drop constraint %I', constraint_name);
  end if;

  alter table public.angelcare360_report_cards
    add constraint angelcare360_report_cards_status_check_v2
    check (status in ('draft', 'calculated', 'reviewed', 'approved', 'published', 'archived'));
end $$;

alter table public.angelcare360_marks
  add column if not exists mark_state text not null default 'present';

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.angelcare360_marks'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%mark_state%'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.angelcare360_marks drop constraint %I', constraint_name);
  end if;

  alter table public.angelcare360_marks
    add constraint angelcare360_marks_mark_state_check_v2
    check (mark_state in ('present', 'absent', 'exempt', 'pending'));
end $$;
