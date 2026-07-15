create table if not exists sales_contract_payment_cases (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  client_name text not null,
  offer_name text,
  contract_status text not null default 'draft',
  payment_status text not null default 'payment_promised',
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  promised_at timestamptz,
  deadline_at timestamptz,
  risk text not null default 'medium',
  owner text,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_contract_release_gates (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  contract_signed boolean not null default false,
  payment_confirmed boolean not null default false,
  documents_verified boolean not null default false,
  manager_override boolean not null default false,
  release_allowed boolean not null default false,
  release_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sales_payment_enforcement_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references sales_contract_payment_cases(id) on delete cascade,
  event_type text not null,
  event_note text,
  actor text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_contract_payment_cases_deal_id on sales_contract_payment_cases(deal_id);
create index if not exists idx_sales_contract_payment_cases_risk on sales_contract_payment_cases(risk);
create index if not exists idx_sales_contract_release_gates_deal_id on sales_contract_release_gates(deal_id);
create index if not exists idx_sales_payment_enforcement_events_case_id on sales_payment_enforcement_events(case_id);
