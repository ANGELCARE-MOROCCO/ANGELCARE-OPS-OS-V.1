-- SALES EXECUTION OS V30 - PACK 3 QUOTE, PRICING, PACKAGE AND PAYMENT PROMISE DEPTH

create table if not exists public.sales_package_catalog (
  id bigserial primary key,
  name text not null,
  segment text not null default 'general',
  service_scope text not null default '',
  fit_rules jsonb not null default '{}'::jsonb,
  base_price numeric(12,2),
  currency text not null default 'MAD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_quote_headers (
  id bigserial primary key,
  lead_id bigint,
  family_id bigint,
  package_id bigint references public.sales_package_catalog(id) on delete set null,
  quote_code text unique,
  title text not null,
  segment text not null default 'general',
  city text,
  decision_maker text,
  quote_status text not null default 'draft',
  quote_risk_score integer not null default 0,
  total_amount numeric(12,2) not null default 0,
  currency text not null default 'MAD',
  discount_percent numeric(5,2) not null default 0,
  discount_reason text,
  approval_status text not null default 'not_required',
  payment_deadline timestamptz,
  fulfillment_ready boolean not null default false,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_quote_lines (
  id bigserial primary key,
  quote_id bigint not null references public.sales_quote_headers(id) on delete cascade,
  label text not null,
  description text,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_discount_approvals (
  id bigserial primary key,
  quote_id bigint references public.sales_quote_headers(id) on delete cascade,
  requested_by uuid,
  approved_by uuid,
  requested_discount_percent numeric(5,2) not null default 0,
  requested_reason text not null,
  approval_decision text not null default 'pending',
  approval_note text,
  payment_condition text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.sales_package_recommendations (
  id bigserial primary key,
  lead_id bigint,
  family_id bigint,
  recommended_package text not null,
  recommendation_reason text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  quote_risk_score integer not null default 0,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_quote_headers_lead_id on public.sales_quote_headers(lead_id);
create index if not exists idx_sales_quote_headers_family_id on public.sales_quote_headers(family_id);
create index if not exists idx_sales_quote_headers_status on public.sales_quote_headers(quote_status);
create index if not exists idx_sales_discount_approvals_decision on public.sales_discount_approvals(approval_decision);

insert into public.sales_package_catalog (name, segment, service_scope, fit_rules, base_price)
values
('Essential Family Support Pack', 'B2C Family', 'Standard family need with moderate urgency and clear schedule.', '{"urgency":"medium","complexity":"low_to_medium"}'::jsonb, 350),
('Urgent Care Activation Pack', 'B2C Family', 'High urgency family request requiring fast activation discipline.', '{"urgency":"high","city_fit":"ready"}'::jsonb, 450),
('Monthly Continuity Pack', 'B2C Family', 'Longer family coverage where continuity and price stability matter.', '{"duration_days":"20_plus"}'::jsonb, 315),
('Professional Coverage Pack', 'B2B Facility', 'Professional facility service coverage with structured scope.', '{"segment":"b2b","scope":"structured"}'::jsonb, 500),
('Strategic Managed Contract', 'Enterprise', 'Complex, high-value or multi-site strategic sales opportunity.', '{"complexity":"high","value":"high"}'::jsonb, 680),
('Academy Premium Enrollment', 'Academy', 'Training or enrollment sale with stronger budget and readiness.', '{"segment":"academy","budget":"strong"}'::jsonb, 2500)
on conflict do nothing;
