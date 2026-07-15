
-- SALES MODULE V30 PACK 4 — FULFILLMENT ACTIVATION CONTROL
create table if not exists sales_activation_controls (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid null,
  client_name text not null,
  service_scope text not null,
  amount numeric(12,2) default 0,
  payment_status text default 'pending',
  activation_status text default 'review',
  start_deadline timestamptz null,
  ops_owner text null,
  blocker text null,
  next_action text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists sales_promise_locks (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid references sales_activation_controls(id) on delete cascade,
  promise_type text not null,
  promise_value text not null,
  risk_level text default 'medium',
  requires_manager_approval boolean default false,
  approved_by text null,
  created_at timestamptz default now()
);

create table if not exists sales_handoff_risks (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid references sales_activation_controls(id) on delete cascade,
  risk_factor text not null,
  severity text default 'medium',
  mitigation text not null,
  owner text null,
  resolved boolean default false,
  created_at timestamptz default now()
);

create table if not exists sales_won_deal_audits (
  id uuid primary key default gen_random_uuid(),
  activation_id uuid references sales_activation_controls(id) on delete cascade,
  audit_score integer default 0,
  payment_ok boolean default false,
  promise_ok boolean default false,
  scope_ok boolean default false,
  ops_ok boolean default false,
  manager_notes text null,
  created_at timestamptz default now()
);

alter table sales_activation_controls enable row level security;
alter table sales_promise_locks enable row level security;
alter table sales_handoff_risks enable row level security;
alter table sales_won_deal_audits enable row level security;

do $$ begin
  create policy "sales_activation_controls_authenticated" on sales_activation_controls for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sales_promise_locks_authenticated" on sales_promise_locks for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sales_handoff_risks_authenticated" on sales_handoff_risks for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "sales_won_deal_audits_authenticated" on sales_won_deal_audits for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
