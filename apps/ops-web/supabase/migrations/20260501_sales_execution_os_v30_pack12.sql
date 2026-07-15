create table if not exists sales_revenue_protection_cases (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  client_name text not null,
  package_name text,
  amount numeric default 0,
  risk_level text not null default 'medium',
  status text not null default 'monitoring',
  owner_id uuid,
  next_action text,
  due_at timestamptz,
  protection_score integer default 0,
  blockers jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sales_revenue_protection_events (
  id uuid primary key default gen_random_uuid(),
  protection_case_id uuid references sales_revenue_protection_cases(id) on delete cascade,
  event_type text not null,
  event_note text,
  actor_id uuid,
  created_at timestamptz default now()
);

create table if not exists sales_post_close_assurance_checklists (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  checklist_key text not null,
  title text not null,
  description text,
  required boolean default true,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_sales_revenue_protection_cases_deal_id on sales_revenue_protection_cases(deal_id);
create index if not exists idx_sales_revenue_protection_cases_risk on sales_revenue_protection_cases(risk_level);
create index if not exists idx_sales_revenue_protection_cases_status on sales_revenue_protection_cases(status);
