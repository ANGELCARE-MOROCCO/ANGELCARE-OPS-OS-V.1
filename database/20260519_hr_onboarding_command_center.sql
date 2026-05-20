create table if not exists public.hr_onboarding_journeys (
  id uuid primary key default gen_random_uuid(),
  title text,
  position text,
  status text default 'In Progress',
  start_date date,
  department text,
  manager text,
  location text,
  employment_type text,
  email text,
  phone text,
  progress int default 0,
  owner text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.hr_onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  journey_id text,
  title text not null,
  owner text,
  status text default 'Pending',
  due_at timestamptz,
  priority text default 'Normal',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.hr_onboarding_documents (
  id uuid primary key default gen_random_uuid(),
  journey_id text,
  title text not null,
  status text default 'Required',
  file_url text,
  created_at timestamptz default now()
);
create table if not exists public.hr_onboarding_activity (
  id uuid primary key default gen_random_uuid(),
  journey_id text,
  type text default 'note',
  title text,
  body text,
  created_at timestamptz default now()
);
