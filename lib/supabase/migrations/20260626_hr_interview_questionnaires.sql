-- AngelCare HR Recruitment · Interview Questionnaires
-- Production-ready storage for internal questionnaire management and public online assessments.

create extension if not exists pgcrypto;

create table if not exists public.hr_interview_questionnaires (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  questionnaire_code text not null default ('IQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  role_target text,
  department text,
  language text not null default 'fr',
  status text not null default 'draft',
  assessment_mode text not null default 'online',
  duration_minutes integer not null default 45,
  pass_score integer not null default 70,
  owner text,
  instructions text,
  questions jsonb not null default '[]'::jsonb,
  competency_matrix jsonb not null default '[]'::jsonb,
  scoring_rules text,
  public_slug text not null unique,
  is_public boolean not null default true,
  allow_multiple_submissions boolean not null default false,
  valid_from date,
  valid_until date,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.hr_interview_questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now(),
  questionnaire_id uuid not null references public.hr_interview_questionnaires(id) on delete cascade,
  candidate_name text not null,
  candidate_email text,
  candidate_phone text,
  city text,
  desired_position text,
  answers jsonb not null default '[]'::jsonb,
  total_score numeric not null default 0,
  status text not null default 'submitted',
  reviewer_notes text,
  candidate_consent boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_hr_interview_questionnaires_status on public.hr_interview_questionnaires(status);
create index if not exists idx_hr_interview_questionnaires_public_slug on public.hr_interview_questionnaires(public_slug);
create index if not exists idx_hr_interview_questionnaires_role on public.hr_interview_questionnaires(role_target);
create index if not exists idx_hr_interview_questionnaire_responses_questionnaire on public.hr_interview_questionnaire_responses(questionnaire_id);
create index if not exists idx_hr_interview_questionnaire_responses_submitted on public.hr_interview_questionnaire_responses(submitted_at desc);

create or replace function public.set_hr_interview_questionnaires_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_hr_interview_questionnaires_updated_at on public.hr_interview_questionnaires;
create trigger trg_hr_interview_questionnaires_updated_at
before update on public.hr_interview_questionnaires
for each row
execute function public.set_hr_interview_questionnaires_updated_at();

alter table public.hr_interview_questionnaires enable row level security;
alter table public.hr_interview_questionnaire_responses enable row level security;

-- The app server uses the Supabase service role, so these policies are intentionally permissive only
-- for authenticated app contexts. Public assessment submissions are performed through server actions.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hr_interview_questionnaires' and policyname = 'hr_interview_questionnaires_authenticated_read'
  ) then
    create policy hr_interview_questionnaires_authenticated_read
      on public.hr_interview_questionnaires for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hr_interview_questionnaires' and policyname = 'hr_interview_questionnaires_authenticated_write'
  ) then
    create policy hr_interview_questionnaires_authenticated_write
      on public.hr_interview_questionnaires for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'hr_interview_questionnaire_responses' and policyname = 'hr_interview_questionnaire_responses_authenticated_read'
  ) then
    create policy hr_interview_questionnaire_responses_authenticated_read
      on public.hr_interview_questionnaire_responses for select
      to authenticated
      using (true);
  end if;
end $$;
