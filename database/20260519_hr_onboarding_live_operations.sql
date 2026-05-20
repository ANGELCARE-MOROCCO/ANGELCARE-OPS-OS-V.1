create extension if not exists pgcrypto;

create table if not exists public.hr_onboarding_journeys (
  id text primary key default gen_random_uuid()::text,
  title text,
  candidate_name text,
  position text,
  job_title text,
  status text default 'In Progress',
  current_phase text,
  start_date date,
  startDate date,
  department text,
  manager text,
  location text,
  employment_type text,
  employmentType text,
  email text,
  phone text,
  progress int default 0,
  owner text,
  owner_name text,
  priority text,
  risk_notes text,
  launch_note text,
  stage_pack jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_tasks (
  id text primary key default gen_random_uuid()::text,
  journey_id text,
  group_name text,
  "group" text,
  title text not null,
  owner text,
  priority text default 'Normal',
  status text default 'Pending',
  due_at date,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_documents (
  id text primary key default gen_random_uuid()::text,
  journey_id text,
  title text not null,
  owner text,
  status text default 'Required',
  category text,
  due_at date,
  comment text,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.hr_onboarding_activity (
  id text primary key default gen_random_uuid()::text,
  journey_id text,
  title text not null,
  body text,
  type text default 'note',
  target text,
  channel text,
  phone text,
  wa_url text,
  stage text,
  due_at date,
  created_at timestamptz default now()
);

alter table public.hr_onboarding_journeys enable row level security;
alter table public.hr_onboarding_tasks enable row level security;
alter table public.hr_onboarding_documents enable row level security;
alter table public.hr_onboarding_activity enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hr_onboarding_journeys' and policyname='authenticated_hr_onboarding_journeys_all') then
    create policy authenticated_hr_onboarding_journeys_all on public.hr_onboarding_journeys for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hr_onboarding_tasks' and policyname='authenticated_hr_onboarding_tasks_all') then
    create policy authenticated_hr_onboarding_tasks_all on public.hr_onboarding_tasks for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hr_onboarding_documents' and policyname='authenticated_hr_onboarding_documents_all') then
    create policy authenticated_hr_onboarding_documents_all on public.hr_onboarding_documents for all to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='hr_onboarding_activity' and policyname='authenticated_hr_onboarding_activity_all') then
    create policy authenticated_hr_onboarding_activity_all on public.hr_onboarding_activity for all to authenticated using (true) with check (true);
  end if;
end $$;
