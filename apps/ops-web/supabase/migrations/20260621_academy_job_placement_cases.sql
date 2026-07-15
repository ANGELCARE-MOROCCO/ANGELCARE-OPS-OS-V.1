create table if not exists public.academy_placement_cases (
  id uuid primary key default gen_random_uuid(),
  ref_code text unique not null,
  trainee_id uuid null,
  program_id uuid null,
  cohort_id uuid null,
  partner_id uuid null,
  status text not null default 'ready_for_placement',
  priority text not null default 'normal',
  target_city text null,
  preferred_role text null,
  availability text null,
  advisor_name text null,
  match_score integer not null default 80,
  trainings_passed jsonb not null default '[]'::jsonb,
  spoken_languages jsonb not null default '[]'::jsonb,
  additional_skills jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academy_placement_case_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.academy_placement_cases(id) on delete cascade,
  action_type text not null default 'follow_up',
  title text not null,
  owner_name text null,
  due_at timestamptz null,
  status text not null default 'open',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_placement_cases_trainee_idx on public.academy_placement_cases(trainee_id);
create index if not exists academy_placement_cases_partner_idx on public.academy_placement_cases(partner_id);
create index if not exists academy_placement_cases_status_idx on public.academy_placement_cases(status);
create index if not exists academy_placement_case_actions_case_idx on public.academy_placement_case_actions(case_id);

alter table public.academy_placement_cases enable row level security;
alter table public.academy_placement_case_actions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'academy_placement_cases'
      and policyname = 'academy_placement_cases_authenticated_all'
  ) then
    create policy academy_placement_cases_authenticated_all
      on public.academy_placement_cases
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'academy_placement_case_actions'
      and policyname = 'academy_placement_case_actions_authenticated_all'
  ) then
    create policy academy_placement_case_actions_authenticated_all
      on public.academy_placement_case_actions
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;
