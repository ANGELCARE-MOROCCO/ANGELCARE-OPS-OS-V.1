-- AngelCare 360 Phase 5 admissions conversion engine
-- Additive only: enriches the existing admissions foundation with explicit intake and conversion fields.

begin;

alter table if exists public.angelcare360_admission_leads
  add column if not exists child_first_name text,
  add column if not exists child_last_name text,
  add column if not exists child_date_of_birth date,
  add column if not exists relationship_type text,
  add column if not exists priority text not null default 'normal',
  add column if not exists next_action text,
  add column if not exists next_action_at timestamptz,
  add column if not exists responsible_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  add column if not exists notes text;

alter table if exists public.angelcare360_admission_applications
  add column if not exists child_first_name text,
  add column if not exists child_last_name text,
  add column if not exists child_date_of_birth date,
  add column if not exists child_gender text,
  add column if not exists child_nationality text,
  add column if not exists parent_first_name text,
  add column if not exists parent_last_name text,
  add column if not exists relationship_type text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists address text,
  add column if not exists priority text not null default 'normal',
  add column if not exists next_action text,
  add column if not exists next_action_at timestamptz,
  add column if not exists responsible_staff_id uuid references public.angelcare360_staff(id) on delete set null,
  add column if not exists decision_status text not null default 'pending',
  add column if not exists decision_reason text,
  add column if not exists converted_at timestamptz,
  add column if not exists converted_student_id uuid references public.angelcare360_students(id) on delete set null,
  add column if not exists converted_parent_id uuid references public.angelcare360_parents(id) on delete set null,
  add column if not exists converted_enrollment_id uuid references public.angelcare360_class_enrollments(id) on delete set null;

alter table if exists public.angelcare360_admission_required_documents
  add column if not exists is_required boolean not null default true;

do $$
begin
  begin
    alter table public.angelcare360_admission_applications
      drop constraint if exists angelcare360_admission_applications_status_check;
  exception
    when undefined_object then null;
  end;
  alter table public.angelcare360_admission_applications
    add constraint angelcare360_admission_applications_status_check
    check (status in ('open', 'in_review', 'approved', 'rejected', 'waitlisted', 'converted', 'archived'));
end $$;

create index if not exists idx_angelcare360_admission_leads_follow_up
  on public.angelcare360_admission_leads (school_id, next_action_at desc, status)
  where status <> 'archived';

create index if not exists idx_angelcare360_admission_leads_responsible
  on public.angelcare360_admission_leads (school_id, responsible_staff_id, status)
  where responsible_staff_id is not null;

create index if not exists idx_angelcare360_admission_applications_follow_up
  on public.angelcare360_admission_applications (school_id, next_action_at desc, status)
  where status <> 'archived';

create index if not exists idx_angelcare360_admission_applications_responsible
  on public.angelcare360_admission_applications (school_id, responsible_staff_id, status)
  where responsible_staff_id is not null;

create index if not exists idx_angelcare360_admission_applications_converted
  on public.angelcare360_admission_applications (school_id, converted_at desc)
  where converted_at is not null;

create index if not exists idx_angelcare360_admission_required_documents_active
  on public.angelcare360_admission_required_documents (school_id, academic_year_id, sort_order, status)
  where status = 'active';

commit;
