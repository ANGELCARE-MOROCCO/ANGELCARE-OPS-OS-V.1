-- HR V2 Workforce Command Center

-- POSITIONS
create table if not exists hr_positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department text,
  created_at timestamp default now()
);

-- DEPARTMENTS
create table if not exists hr_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp default now()
);

-- STAFF PROFILE EXTENSION
create table if not exists hr_staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  position text,
  department text,
  contract_type text,
  status text default 'active',
  created_at timestamp default now()
);

-- ROSTER
create table if not exists hr_rosters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  shift_date date,
  start_time time,
  end_time time,
  role text,
  created_at timestamp default now()
);

-- LEAVE REQUESTS
create table if not exists hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  start_date date,
  end_date date,
  status text default 'pending',
  reason text,
  created_at timestamp default now()
);

-- DOCUMENTS
create table if not exists hr_staff_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  file_url text,
  type text,
  created_at timestamp default now()
);

-- PERFORMANCE
create table if not exists hr_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  score int,
  notes text,
  created_at timestamp default now()
);

-- CERTIFICATIONS
create table if not exists hr_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text,
  valid_until date,
  created_at timestamp default now()
);

-- DISCIPLINARY
create table if not exists hr_disciplinary_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  reason text,
  created_at timestamp default now()
);

-- NOTIFICATIONS
create table if not exists hr_staff_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  message text,
  type text,
  read boolean default false,
  created_at timestamp default now()
);

-- APPROVALS
create table if not exists hr_approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  type text,
  status text default 'pending',
  created_at timestamp default now()
);

