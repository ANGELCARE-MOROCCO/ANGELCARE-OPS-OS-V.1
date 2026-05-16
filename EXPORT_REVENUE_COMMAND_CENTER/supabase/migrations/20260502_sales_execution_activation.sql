create extension if not exists pgcrypto;

create table if not exists public.sales_quotes (
  id uuid primary key default gen_random_uuid(),
  quote_ref text unique not null,
  client_name text not null,
  client_phone text,
  client_email text,
  source text default 'sales',
  package_name text,
  service_category text,
  city_zone text,
  duration_days integer default 1,
  validity_until date,
  payment_deadline date,
  discount_percent numeric default 0,
  discount_reason text,
  subtotal numeric default 0,
  discount_amount numeric default 0,
  tax_amount numeric default 0,
  total_amount numeric default 0,
  status text not null default 'draft' check (status in ('draft','sent','confirmed','ordered','cancelled')),
  cancellation_reason text,
  confirmed_at timestamptz,
  notes text,
  lines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text unique not null,
  quote_id uuid references public.sales_quotes(id) on delete set null,
  client_name text not null,
  status text not null default 'confirmed' check (status in ('confirmed','in_fulfillment','delivered','cancelled')),
  package_name text,
  total_amount numeric default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_ref text unique not null,
  quote_id uuid references public.sales_quotes(id) on delete set null,
  client_name text not null,
  status text not null default 'issued' check (status in ('draft','issued','paid','overdue','cancelled')),
  subtotal numeric default 0,
  tax_amount numeric default 0,
  total_amount numeric default 0,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_delivery_notices (
  id uuid primary key default gen_random_uuid(),
  delivery_ref text unique not null,
  quote_id uuid references public.sales_quotes(id) on delete set null,
  client_name text not null,
  status text not null default 'ready' check (status in ('ready','scheduled','delivered','cancelled')),
  service_category text,
  city_zone text,
  scheduled_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales_document_exports (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.sales_quotes(id) on delete cascade,
  document_type text not null check (document_type in ('quote','order','invoice','delivery')),
  document_ref text not null,
  status text not null default 'ready',
  document_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_quotes_status on public.sales_quotes(status);
create index if not exists idx_sales_orders_quote on public.sales_orders(quote_id);
create index if not exists idx_sales_invoices_quote on public.sales_invoices(quote_id);
create index if not exists idx_sales_delivery_quote on public.sales_delivery_notices(quote_id);
