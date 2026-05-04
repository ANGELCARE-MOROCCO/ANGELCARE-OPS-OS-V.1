create table if not exists market_os_ambassadors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_type text,
  city text,
  status text default 'candidate',
  assigned_manager text,
  commission_rules jsonb default '{}'::jsonb,
  performance jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_ambassador_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  program_type text,
  status text default 'draft',
  configuration jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_type text,
  city text,
  status text default 'prospect',
  assigned_manager text,
  contract jsonb default '{}'::jsonb,
  performance jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists market_os_partner_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  program_type text,
  status text default 'draft',
  configuration jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
