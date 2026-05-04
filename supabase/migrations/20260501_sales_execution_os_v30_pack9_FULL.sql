-- SALES MODULE V30 PACK 9 — ADVANCED CLOSING SYSTEM
-- Safe migration with IF NOT EXISTS guards.

create table if not exists public.sales_deal_states (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  current_stage text not null default 'qualification',
  previous_stage text,
  probability integer not null default 0 check (probability >= 0 and probability <= 100),
  risk_level text not null default 'medium',
  stage_reason text,
  next_action text,
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_closing_objections (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  category text not null,
  title text not null,
  severity text not null default 'medium',
  objection_text text,
  status text not null default 'open',
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_closing_responses (
  id uuid primary key default gen_random_uuid(),
  objection_id uuid references public.sales_closing_objections(id) on delete cascade,
  response_title text not null,
  response_body text not null,
  recommended_action text not null,
  effectiveness_score integer not null default 50 check (effectiveness_score >= 0 and effectiveness_score <= 100),
  created_at timestamptz not null default now()
);

create table if not exists public.sales_payment_promises (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  amount_mad numeric(12,2) not null default 0,
  due_date date not null,
  status text not null default 'promised',
  pressure_level text not null default 'medium',
  promise_note text,
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_promise_id uuid references public.sales_payment_promises(id) on delete cascade,
  event_type text not null,
  amount_mad numeric(12,2),
  event_note text,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_discount_rules (
  id uuid primary key default gen_random_uuid(),
  role_name text not null,
  max_discount_percent numeric(5,2) not null default 0,
  requires_manager_approval boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_discount_requests (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  requested_discount_percent numeric(5,2) not null default 0,
  requested_amount_mad numeric(12,2),
  reason text not null,
  status text not null default 'pending',
  requested_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_closing_checklist (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  checklist_key text not null,
  label text not null,
  description text,
  completed boolean not null default false,
  blocking boolean not null default true,
  completed_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_activation_events (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  activation_status text not null default 'pending',
  activation_note text,
  handoff_owner_id uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.sales_closing_actions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid,
  lead_id uuid,
  action_type text not null,
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'open',
  due_at timestamptz,
  assigned_to uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_deal_states_deal_id on public.sales_deal_states(deal_id);
create index if not exists idx_sales_deal_states_lead_id on public.sales_deal_states(lead_id);
create index if not exists idx_sales_closing_objections_deal_id on public.sales_closing_objections(deal_id);
create index if not exists idx_sales_payment_promises_deal_id on public.sales_payment_promises(deal_id);
create index if not exists idx_sales_discount_requests_status on public.sales_discount_requests(status);
create index if not exists idx_sales_closing_checklist_deal_id on public.sales_closing_checklist(deal_id);
create index if not exists idx_sales_activation_events_status on public.sales_activation_events(activation_status);
create index if not exists idx_sales_closing_actions_status on public.sales_closing_actions(status);

insert into public.sales_discount_rules (role_name, max_discount_percent, requires_manager_approval)
values
  ('agent', 5, true),
  ('senior_agent', 10, true),
  ('manager', 20, false),
  ('ceo', 100, false)
on conflict do nothing;
