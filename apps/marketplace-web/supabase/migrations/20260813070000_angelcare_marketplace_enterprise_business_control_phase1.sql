begin;
create extension if not exists pgcrypto;

-- ============================================================================
-- ANGELCARE MARKETPLACE — ENTERPRISE BUSINESS CONTROL / PHASE 1
-- Additive only. Provides canonical operator-managed commerce records missing
-- from the existing Marketplace model without replacing working authorities.
-- ============================================================================

-- Admin-created/prospect customers may exist before portal identity claiming.
alter table if exists public.angelcare_marketplace_customer_accounts
  alter column auth_user_id drop not null;

create table if not exists public.angelcare_marketplace_family_guardians(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('GUA-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  family_account_id uuid not null references public.angelcare_marketplace_family_accounts(id) on delete cascade,
  customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id) on delete set null,
  full_name text not null,
  relationship text not null default 'guardian',
  email text,
  phone text,
  is_primary boolean not null default false,
  status text not null default 'active' check(status in('active','inactive','archived')),
  notes text,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_family_guardians_family_idx on public.angelcare_marketplace_family_guardians(family_account_id,is_primary desc,status,updated_at desc);
create unique index if not exists ac_family_guardian_primary_uq on public.angelcare_marketplace_family_guardians(family_account_id) where is_primary=true and status='active';

create table if not exists public.angelcare_marketplace_order_lines(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('LIN-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  journey_id uuid not null references public.angelcare_marketplace_journeys(id) on delete cascade,
  catalog_item_id uuid references public.angelcare_marketplace_catalog_items(id) on delete set null,
  catalog_variant_id uuid references public.angelcare_marketplace_catalog_variants(id) on delete set null,
  line_type text not null default 'catalog_item',
  title text not null,
  quantity numeric(14,3) not null default 1 check(quantity>0),
  unit_price numeric(16,2) not null default 0 check(unit_price>=0),
  discount_amount numeric(16,2) not null default 0 check(discount_amount>=0),
  tax_amount numeric(16,2) not null default 0 check(tax_amount>=0),
  line_total numeric(16,2) not null default 0 check(line_total>=0),
  currency_label text not null default 'Dh',
  configuration jsonb not null default '{}',
  fulfillment_config jsonb not null default '{}',
  status text not null default 'active' check(status in('active','cancelled','refunded','fulfilled','archived')),
  sort_order integer not null default 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_order_lines_journey_idx on public.angelcare_marketplace_order_lines(journey_id,status,sort_order,created_at);
create index if not exists ac_order_lines_catalog_idx on public.angelcare_marketplace_order_lines(catalog_item_id,created_at desc);

create table if not exists public.angelcare_marketplace_finance_invoices(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('INV-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  invoice_number text unique not null,
  customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id),
  family_account_id uuid references public.angelcare_marketplace_family_accounts(id),
  journey_id uuid references public.angelcare_marketplace_journeys(id),
  revenue_stream_id uuid,
  status text not null default 'draft' check(status in('draft','issued','partially_paid','paid','overdue','cancelled','credited')),
  currency_label text not null default 'Dh',
  subtotal numeric(16,2) not null default 0,
  discount_total numeric(16,2) not null default 0,
  tax_total numeric(16,2) not null default 0,
  total_amount numeric(16,2) not null default 0,
  paid_amount numeric(16,2) not null default 0,
  balance_due numeric(16,2) generated always as (greatest(total_amount-paid_amount,0)) stored,
  due_at timestamptz,
  issued_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  billing_details jsonb not null default '{}',
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_finance_invoices_customer_idx on public.angelcare_marketplace_finance_invoices(customer_account_id,status,updated_at desc);
create index if not exists ac_finance_invoices_journey_idx on public.angelcare_marketplace_finance_invoices(journey_id,updated_at desc);

create table if not exists public.angelcare_marketplace_finance_invoice_lines(
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.angelcare_marketplace_finance_invoices(id) on delete cascade,
  catalog_item_id uuid references public.angelcare_marketplace_catalog_items(id) on delete set null,
  description text not null,
  quantity numeric(14,3) not null default 1 check(quantity>0),
  unit_price numeric(16,2) not null default 0 check(unit_price>=0),
  discount_amount numeric(16,2) not null default 0 check(discount_amount>=0),
  tax_amount numeric(16,2) not null default 0 check(tax_amount>=0),
  line_total numeric(16,2) not null default 0 check(line_total>=0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_invoice_lines_invoice_idx on public.angelcare_marketplace_finance_invoice_lines(invoice_id,sort_order,created_at);

create table if not exists public.angelcare_marketplace_finance_receipts(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('RCT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  receipt_number text unique not null,
  payment_intent_id uuid not null references public.angelcare_marketplace_payment_intents(id),
  invoice_id uuid references public.angelcare_marketplace_finance_invoices(id),
  customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id),
  amount numeric(16,2) not null check(amount>0),
  currency_label text not null default 'Dh',
  payment_method text,
  provider_reference text,
  status text not null default 'issued' check(status in('issued','cancelled','replaced')),
  issued_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists ac_finance_receipts_payment_idx on public.angelcare_marketplace_finance_receipts(payment_intent_id,issued_at desc);
create index if not exists ac_finance_receipts_invoice_idx on public.angelcare_marketplace_finance_receipts(invoice_id,issued_at desc);

create table if not exists public.angelcare_marketplace_promotions(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('PRO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  promotion_key text unique not null,
  name text not null,
  description text,
  code text,
  promotion_type text not null default 'percent' check(promotion_type in('percent','fixed','wallet_credit','free_delivery','custom')),
  value numeric(16,2) not null default 0 check(value>=0),
  minimum_order_amount numeric(16,2) not null default 0 check(minimum_order_amount>=0),
  maximum_discount_amount numeric(16,2),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  customer_usage_limit integer,
  automatic boolean not null default false,
  status text not null default 'draft' check(status in('draft','active','paused','expired','archived')),
  priority integer not null default 0,
  content jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists ac_promotions_code_uq on public.angelcare_marketplace_promotions(lower(code)) where code is not null and status<>'archived';
create index if not exists ac_promotions_active_idx on public.angelcare_marketplace_promotions(status,starts_at,ends_at,priority desc);

create table if not exists public.angelcare_marketplace_promotion_targets(
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.angelcare_marketplace_promotions(id) on delete cascade,
  target_type text not null check(target_type in('all','catalog_item','category','territory','customer','customer_kind','journey_type')),
  target_value text,
  created_at timestamptz not null default now()
);
create index if not exists ac_promotion_targets_promotion_idx on public.angelcare_marketplace_promotion_targets(promotion_id,target_type,target_value);

create table if not exists public.angelcare_marketplace_promotion_redemptions(
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.angelcare_marketplace_promotions(id),
  customer_account_id uuid references public.angelcare_marketplace_customer_accounts(id),
  journey_id uuid references public.angelcare_marketplace_journeys(id),
  payment_intent_id uuid references public.angelcare_marketplace_payment_intents(id),
  original_amount numeric(16,2) not null default 0,
  discount_amount numeric(16,2) not null default 0,
  redeemed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'
);
create index if not exists ac_promotion_redemptions_idx on public.angelcare_marketplace_promotion_redemptions(promotion_id,customer_account_id,redeemed_at desc);

create table if not exists public.angelcare_marketplace_customer_subscriptions(
  id uuid primary key default gen_random_uuid(),
  public_reference text unique not null default ('SUB-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  customer_account_id uuid not null references public.angelcare_marketplace_customer_accounts(id),
  catalog_item_id uuid references public.angelcare_marketplace_catalog_items(id),
  status text not null default 'draft' check(status in('draft','trial','active','paused','past_due','cancelled','expired')),
  billing_period text not null default 'monthly',
  quantity numeric(14,3) not null default 1 check(quantity>0),
  amount numeric(16,2) not null default 0 check(amount>=0),
  currency_label text not null default 'Dh',
  starts_at timestamptz,
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  next_billing_at timestamptz,
  renewal_mode text not null default 'automatic' check(renewal_mode in('automatic','manual','non_renewing')),
  cancel_reason text,
  metadata jsonb not null default '{}',
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ac_customer_subscriptions_customer_idx on public.angelcare_marketplace_customer_subscriptions(customer_account_id,status,updated_at desc);
create index if not exists ac_customer_subscriptions_billing_idx on public.angelcare_marketplace_customer_subscriptions(status,next_billing_at);

-- Consistent RLS posture: operator/server access is through service_role APIs.
alter table public.angelcare_marketplace_family_guardians enable row level security;
alter table public.angelcare_marketplace_order_lines enable row level security;
alter table public.angelcare_marketplace_finance_invoices enable row level security;
alter table public.angelcare_marketplace_finance_invoice_lines enable row level security;
alter table public.angelcare_marketplace_finance_receipts enable row level security;
alter table public.angelcare_marketplace_promotions enable row level security;
alter table public.angelcare_marketplace_promotion_targets enable row level security;
alter table public.angelcare_marketplace_promotion_redemptions enable row level security;
alter table public.angelcare_marketplace_customer_subscriptions enable row level security;

grant all on table public.angelcare_marketplace_family_guardians to service_role;
grant all on table public.angelcare_marketplace_order_lines to service_role;
grant all on table public.angelcare_marketplace_finance_invoices to service_role;
grant all on table public.angelcare_marketplace_finance_invoice_lines to service_role;
grant all on table public.angelcare_marketplace_finance_receipts to service_role;
grant all on table public.angelcare_marketplace_promotions to service_role;
grant all on table public.angelcare_marketplace_promotion_targets to service_role;
grant all on table public.angelcare_marketplace_promotion_redemptions to service_role;
grant all on table public.angelcare_marketplace_customer_subscriptions to service_role;

commit;
