-- AngelCare 360 Phase 2D - Finance, Invoicing, Payments & Receivables Runtime
-- Ref: AC360-PH2D-FINANCE-RECEIVABLES-2026-06-30
-- Scope: DB-first finance runtime under AC360 guard doctrine.
-- Strict rule: no front-end school UI yet. This phase makes finance operations alive through backend APIs/RPCs only.
-- Safe to run multiple times on Supabase Postgres.

create extension if not exists pgcrypto;

-- Compatibility guard for Phase 1D/1E hotfixes.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Finance runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_fee_catalog (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  fee_key text not null,
  label text not null,
  fee_type text not null default 'tuition',
  billing_cycle text not null default 'monthly',
  default_amount_mad numeric not null default 0,
  currency text not null default 'MAD',
  taxable boolean not null default false,
  status text not null default 'active',
  starts_on date default current_date,
  ends_on date,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, fee_key),
  check (fee_type in ('tuition','registration','transport','meal','activity','material','insurance','discount','adjustment','extra','other')),
  check (billing_cycle in ('one_time','weekly','monthly','quarterly','term','annual','custom')),
  check (status in ('active','inactive','archived'))
);

create table if not exists public.ac360_school_billing_cycles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  academic_year_id uuid references public.ac360_academic_years(id) on delete set null,
  cycle_key text not null,
  label text not null,
  period_start date not null,
  period_end date not null,
  invoice_issue_date date not null default current_date,
  invoice_due_date date,
  status text not null default 'open',
  opened_by uuid,
  closed_by uuid,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, cycle_key),
  check (period_end >= period_start),
  check (status in ('draft','open','invoicing','issued','closed','locked','archived'))
);

create table if not exists public.ac360_school_invoice_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  billing_cycle_id uuid references public.ac360_school_billing_cycles(id) on delete set null,
  batch_code text not null,
  batch_type text not null default 'tuition_monthly',
  status text not null default 'draft',
  invoice_count integer not null default 0,
  total_mad numeric not null default 0,
  generated_by uuid,
  generated_at timestamptz,
  issued_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, batch_code),
  check (batch_type in ('tuition_monthly','registration','transport','meal','activity','custom')),
  check (status in ('draft','generated','issued','partially_issued','cancelled','archived'))
);

create table if not exists public.ac360_school_payment_allocations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  payment_id uuid not null references public.ac360_school_fee_payments(id) on delete cascade,
  invoice_id uuid not null references public.ac360_school_tuition_invoices(id) on delete cascade,
  amount_mad numeric not null default 0,
  allocation_status text not null default 'allocated',
  allocated_by uuid,
  allocated_at timestamptz not null default now(),
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, payment_id, invoice_id),
  check (allocation_status in ('allocated','reversed','archived'))
);

create table if not exists public.ac360_school_payment_promises (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  invoice_id uuid references public.ac360_school_tuition_invoices(id) on delete set null,
  promise_code text not null,
  promised_amount_mad numeric not null default 0,
  promised_date date not null,
  status text not null default 'open',
  created_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  notes text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, promise_code),
  check (status in ('open','kept','broken','cancelled','archived'))
);

create table if not exists public.ac360_school_collection_cases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  guardian_id uuid references public.ac360_school_guardians(id) on delete set null,
  invoice_account_id uuid references public.ac360_school_invoice_accounts(id) on delete set null,
  case_code text not null,
  case_stage text not null default 'watch',
  risk_level text not null default 'medium',
  outstanding_mad numeric not null default 0,
  oldest_due_date date,
  status text not null default 'open',
  assigned_to uuid,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, case_code),
  check (case_stage in ('watch','reminder','promise','escalation','director_review','legal_hold','resolved')),
  check (risk_level in ('low','medium','high','critical')),
  check (status in ('open','paused','resolved','cancelled','archived'))
);

create table if not exists public.ac360_school_collection_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  collection_case_id uuid references public.ac360_school_collection_cases(id) on delete cascade,
  invoice_id uuid references public.ac360_school_tuition_invoices(id) on delete set null,
  event_type text not null default 'note',
  event_channel text not null default 'internal',
  amount_mad numeric,
  event_note text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (event_type in ('note','reminder_sent','call','whatsapp','email','promise_created','payment_recorded','escalated','resolved','adjustment')),
  check (event_channel in ('internal','phone','whatsapp','email','meeting','system'))
);

create table if not exists public.ac360_school_finance_adjustments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  invoice_id uuid references public.ac360_school_tuition_invoices(id) on delete cascade,
  adjustment_code text not null,
  adjustment_type text not null default 'discount',
  requested_amount_mad numeric not null default 0,
  approved_amount_mad numeric,
  status text not null default 'requested',
  request_reason text,
  decision_reason text,
  requested_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, adjustment_code),
  check (adjustment_type in ('discount','scholarship','waiver','credit_note','correction','refund','other')),
  check (status in ('requested','approved','rejected','applied','cancelled','archived'))
);

create table if not exists public.ac360_school_finance_reconcile_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  run_code text not null,
  run_date date not null default current_date,
  status text not null default 'completed',
  invoices_checked integer not null default 0,
  overdue_marked integer not null default 0,
  receivables_mad numeric not null default 0,
  payments_mad numeric not null default 0,
  alerts_created integer not null default 0,
  run_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, run_code),
  check (status in ('queued','running','completed','failed','archived'))
);

create table if not exists public.ac360_school_receivable_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  snapshot_date date not null default current_date,
  active_invoice_count integer not null default 0,
  overdue_invoice_count integer not null default 0,
  total_invoiced_mad numeric not null default 0,
  total_paid_mad numeric not null default 0,
  total_receivable_mad numeric not null default 0,
  overdue_receivable_mad numeric not null default 0,
  promise_open_count integer not null default 0,
  collection_case_open_count integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, campus_id, snapshot_date)
);

create table if not exists public.ac360_school_finance_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  student_id uuid references public.ac360_school_students(id) on delete set null,
  invoice_id uuid references public.ac360_school_tuition_invoices(id) on delete set null,
  alert_key text not null,
  alert_type text not null default 'overdue_invoice',
  severity text not null default 'medium',
  title text not null,
  description text,
  amount_mad numeric,
  status text not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (alert_type in ('overdue_invoice','high_receivable','broken_promise','missing_billing_account','payment_unallocated','reconcile_gap','manual_review')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','snoozed','resolved','dismissed','archived'))
);

-- Attach optional batch pointer to existing invoices when Phase 2A table exists.
alter table if exists public.ac360_school_tuition_invoices
  add column if not exists invoice_batch_id uuid references public.ac360_school_invoice_batches(id) on delete set null;

alter table if exists public.ac360_school_tuition_invoices
  add column if not exists billing_cycle_id uuid references public.ac360_school_billing_cycles(id) on delete set null;

create index if not exists idx_ac360_finance_fee_catalog_org on public.ac360_school_fee_catalog(org_id, status, fee_type);
create index if not exists idx_ac360_finance_cycles_org on public.ac360_school_billing_cycles(org_id, status, period_start, period_end);
create index if not exists idx_ac360_finance_batches_org on public.ac360_school_invoice_batches(org_id, status, created_at desc);
create index if not exists idx_ac360_finance_alloc_payment on public.ac360_school_payment_allocations(org_id, payment_id, allocation_status);
create index if not exists idx_ac360_finance_promises_org on public.ac360_school_payment_promises(org_id, status, promised_date);
create index if not exists idx_ac360_finance_cases_org on public.ac360_school_collection_cases(org_id, status, risk_level);
create index if not exists idx_ac360_finance_alerts_org on public.ac360_school_finance_alerts(org_id, status, severity, created_at desc);

-- Updated-at triggers.
do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_fee_catalog','ac360_school_billing_cycles','ac360_school_invoice_batches','ac360_school_payment_allocations',
    'ac360_school_payment_promises','ac360_school_collection_cases','ac360_school_finance_adjustments','ac360_school_finance_reconcile_runs','ac360_school_finance_alerts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 2. RPC helpers
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_finance_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with invoice_base as (
    select *
    from public.ac360_school_tuition_invoices i
    where i.org_id = p_org_id
      and (p_campus_id is null or i.campus_id = p_campus_id)
      and i.status not in ('cancelled','archived','draft')
  ), pay_base as (
    select p.*
    from public.ac360_school_fee_payments p
    where p.org_id = p_org_id
      and p.status not in ('cancelled','archived')
  )
  select jsonb_build_object(
    'org_id', p_org_id,
    'campus_id', p_campus_id,
    'as_of_date', coalesce(p_as_of_date, current_date),
    'invoice_count', coalesce((select count(*) from invoice_base), 0),
    'issued_count', coalesce((select count(*) from invoice_base where status in ('issued','sent','partially_paid','overdue')), 0),
    'paid_count', coalesce((select count(*) from invoice_base where status = 'paid'), 0),
    'overdue_count', coalesce((select count(*) from invoice_base where due_date < coalesce(p_as_of_date, current_date) and status in ('issued','sent','partially_paid','overdue')), 0),
    'total_invoiced_mad', coalesce((select sum(total_mad) from invoice_base), 0),
    'total_paid_mad', coalesce((select sum(paid_mad) from invoice_base), 0),
    'total_receivable_mad', coalesce((select sum(balance_mad) from invoice_base), 0),
    'overdue_receivable_mad', coalesce((select sum(balance_mad) from invoice_base where due_date < coalesce(p_as_of_date, current_date) and status in ('issued','sent','partially_paid','overdue')), 0),
    'payments_recorded_mad', coalesce((select sum(amount_mad) from pay_base), 0),
    'open_promises', coalesce((select count(*) from public.ac360_school_payment_promises where org_id = p_org_id and status='open'), 0),
    'open_collection_cases', coalesce((select count(*) from public.ac360_school_collection_cases where org_id = p_org_id and status='open'), 0),
    'open_alerts', coalesce((select count(*) from public.ac360_school_finance_alerts where org_id = p_org_id and status='open'), 0),
    'latest_snapshot', coalesce((select to_jsonb(s) from public.ac360_school_receivable_snapshots s where s.org_id=p_org_id and (p_campus_id is null or s.campus_id=p_campus_id) order by s.snapshot_date desc, s.created_at desc limit 1), '{}'::jsonb),
    'phase', 'phase_2d_finance_receivables_runtime',
    'uiBuildAllowed', false
  ) into v_result;
  return v_result;
end $$;

create or replace function public.ac360_school_upsert_fee_catalog_item(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_fee_key text default null,
  p_label text default null,
  p_fee_type text default 'tuition',
  p_billing_cycle text default 'monthly',
  p_default_amount_mad numeric default 0,
  p_status text default 'active',
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(nullif(trim(p_fee_key), ''), 'fee-' || substr(gen_random_uuid()::text, 1, 8));
  v_row public.ac360_school_fee_catalog;
begin
  insert into public.ac360_school_fee_catalog(org_id, campus_id, fee_key, label, fee_type, billing_cycle, default_amount_mad, status, metadata_json)
  values (p_org_id, p_campus_id, v_key, coalesce(nullif(trim(p_label), ''), v_key), coalesce(p_fee_type,'tuition'), coalesce(p_billing_cycle,'monthly'), greatest(coalesce(p_default_amount_mad,0),0), coalesce(p_status,'active'), coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, fee_key) do update set
    campus_id=excluded.campus_id,
    label=excluded.label,
    fee_type=excluded.fee_type,
    billing_cycle=excluded.billing_cycle,
    default_amount_mad=excluded.default_amount_mad,
    status=excluded.status,
    metadata_json=public.ac360_school_fee_catalog.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_row;
  return jsonb_build_object('ok', true, 'fee_catalog_item', to_jsonb(v_row));
end $$;

create or replace function public.ac360_school_open_billing_cycle(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_academic_year_id uuid default null,
  p_cycle_key text default null,
  p_label text default null,
  p_period_start date default current_date,
  p_period_end date default null,
  p_invoice_due_date date default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(nullif(trim(p_cycle_key), ''), 'cycle-' || to_char(coalesce(p_period_start,current_date), 'YYYY-MM') || '-' || substr(gen_random_uuid()::text, 1, 6));
  v_end date := coalesce(p_period_end, (date_trunc('month', coalesce(p_period_start,current_date)) + interval '1 month - 1 day')::date);
  v_row public.ac360_school_billing_cycles;
begin
  insert into public.ac360_school_billing_cycles(org_id, campus_id, academic_year_id, cycle_key, label, period_start, period_end, invoice_due_date, status, opened_by, metadata_json)
  values (p_org_id, p_campus_id, p_academic_year_id, v_key, coalesce(nullif(trim(p_label), ''), v_key), coalesce(p_period_start,current_date), v_end, p_invoice_due_date, 'open', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, cycle_key) do update set
    campus_id=excluded.campus_id,
    academic_year_id=excluded.academic_year_id,
    label=excluded.label,
    period_start=excluded.period_start,
    period_end=excluded.period_end,
    invoice_due_date=excluded.invoice_due_date,
    status='open',
    metadata_json=public.ac360_school_billing_cycles.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_row;
  return jsonb_build_object('ok', true, 'billing_cycle', to_jsonb(v_row));
end $$;

create or replace function public.ac360_school_issue_invoice(
  p_org_id uuid,
  p_student_id uuid,
  p_invoice_account_id uuid default null,
  p_campus_id uuid default null,
  p_academic_year_id uuid default null,
  p_billing_cycle_id uuid default null,
  p_invoice_batch_id uuid default null,
  p_invoice_number text default null,
  p_invoice_type text default 'tuition',
  p_due_date date default null,
  p_lines jsonb default '[]'::jsonb,
  p_discount_mad numeric default 0,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.ac360_school_tuition_invoices;
  v_number text := coalesce(nullif(trim(p_invoice_number), ''), 'AC360-INV-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6));
  v_subtotal numeric := 0;
  v_line jsonb;
  v_line_count integer := 0;
  v_account_id uuid := p_invoice_account_id;
begin
  if p_student_id is null then
    raise exception 'student_id is required';
  end if;

  if v_account_id is null then
    select id into v_account_id
    from public.ac360_school_invoice_accounts
    where org_id = p_org_id and student_id = p_student_id and status = 'active'
    limit 1;
  end if;

  if v_account_id is null then
    insert into public.ac360_school_invoice_accounts(org_id, student_id, account_code, billing_cycle, status, metadata_json)
    values (p_org_id, p_student_id, 'ACC-' || substr(p_student_id::text,1,8), 'monthly', 'active', '{"auto_created_by":"phase_2d_finance"}'::jsonb)
    on conflict (org_id, student_id) do update set updated_at=now()
    returning id into v_account_id;
  end if;

  if jsonb_typeof(coalesce(p_lines, '[]'::jsonb)) <> 'array' then
    raise exception 'p_lines must be a JSON array';
  end if;

  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    v_subtotal := v_subtotal + greatest(coalesce((v_line->>'amount_mad')::numeric, coalesce((v_line->>'quantity')::numeric,1) * coalesce((v_line->>'unit_price_mad')::numeric,0)), 0);
    v_line_count := v_line_count + 1;
  end loop;

  if v_line_count = 0 then
    v_subtotal := 0;
  end if;

  insert into public.ac360_school_tuition_invoices(org_id, campus_id, academic_year_id, student_id, invoice_account_id, invoice_batch_id, billing_cycle_id, invoice_number, invoice_type, status, due_date, subtotal_mad, discount_mad, total_mad, generated_by, metadata_json)
  values (p_org_id, p_campus_id, p_academic_year_id, p_student_id, v_account_id, p_invoice_batch_id, p_billing_cycle_id, v_number, coalesce(p_invoice_type,'tuition'), 'issued', p_due_date, v_subtotal, greatest(coalesce(p_discount_mad,0),0), greatest(v_subtotal - greatest(coalesce(p_discount_mad,0),0),0), p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb))
  returning * into v_invoice;

  for v_line in select * from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) loop
    insert into public.ac360_school_tuition_invoice_lines(org_id, invoice_id, line_key, label, quantity, unit_price_mad, amount_mad, metadata_json)
    values (
      p_org_id,
      v_invoice.id,
      coalesce(nullif(v_line->>'line_key',''), 'line-' || substr(gen_random_uuid()::text,1,8)),
      coalesce(nullif(v_line->>'label',''), 'Fee line'),
      coalesce((v_line->>'quantity')::numeric, 1),
      coalesce((v_line->>'unit_price_mad')::numeric, 0),
      greatest(coalesce((v_line->>'amount_mad')::numeric, coalesce((v_line->>'quantity')::numeric,1) * coalesce((v_line->>'unit_price_mad')::numeric,0)), 0),
      coalesce(v_line->'metadata_json', '{}'::jsonb)
    );
  end loop;

  insert into public.ac360_school_operation_events(org_id, student_id, event_type, event_source, title, description, metadata_json)
  values (p_org_id, p_student_id, 'finance_invoice_issued', 'phase_2d_finance', 'Invoice issued', 'Finance runtime issued invoice ' || v_invoice.invoice_number, jsonb_build_object('invoice_id', v_invoice.id, 'invoice_number', v_invoice.invoice_number, 'total_mad', v_invoice.total_mad));

  return jsonb_build_object('ok', true, 'invoice', to_jsonb(v_invoice), 'line_count', v_line_count);
end $$;

create or replace function public.ac360_school_generate_invoice_batch(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_billing_cycle_id uuid default null,
  p_due_date date default null,
  p_fee_key text default null,
  p_default_amount_mad numeric default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch public.ac360_school_invoice_batches;
  v_code text := 'BATCH-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_student record;
  v_amount numeric := greatest(coalesce(p_default_amount_mad, 0), 0);
  v_invoice_result jsonb;
  v_count integer := 0;
  v_total numeric := 0;
  v_cycle public.ac360_school_billing_cycles;
begin
  if p_billing_cycle_id is not null then
    select * into v_cycle from public.ac360_school_billing_cycles where id=p_billing_cycle_id and org_id=p_org_id;
  end if;

  if v_amount <= 0 and p_fee_key is not null then
    select default_amount_mad into v_amount
    from public.ac360_school_fee_catalog
    where org_id=p_org_id and fee_key=p_fee_key and status='active'
    limit 1;
    v_amount := greatest(coalesce(v_amount,0),0);
  end if;

  insert into public.ac360_school_invoice_batches(org_id, campus_id, billing_cycle_id, batch_code, status, generated_by, generated_at, metadata_json)
  values (p_org_id, p_campus_id, p_billing_cycle_id, v_code, 'generated', p_actor_app_user_id, now(), coalesce(p_metadata,'{}'::jsonb))
  returning * into v_batch;

  for v_student in
    select s.*
    from public.ac360_school_students s
    where s.org_id=p_org_id
      and s.status='active'
      and s.enrollment_status in ('enrolled','active')
      and (p_campus_id is null or s.campus_id=p_campus_id)
  loop
    v_invoice_result := public.ac360_school_issue_invoice(
      p_org_id,
      v_student.id,
      null,
      v_student.campus_id,
      v_student.academic_year_id,
      p_billing_cycle_id,
      v_batch.id,
      null,
      'tuition',
      coalesce(p_due_date, v_cycle.invoice_due_date, current_date + 10),
      jsonb_build_array(jsonb_build_object('line_key', coalesce(p_fee_key,'tuition'), 'label', 'Monthly tuition', 'quantity', 1, 'unit_price_mad', v_amount, 'amount_mad', v_amount)),
      0,
      p_actor_app_user_id,
      jsonb_build_object('source','batch','batch_id',v_batch.id)
    );
    v_count := v_count + 1;
    v_total := v_total + v_amount;
  end loop;

  update public.ac360_school_invoice_batches
  set invoice_count=v_count, total_mad=v_total, updated_at=now()
  where id=v_batch.id
  returning * into v_batch;

  return jsonb_build_object('ok', true, 'batch', to_jsonb(v_batch), 'invoice_count', v_count, 'total_mad', v_total);
end $$;

create or replace function public.ac360_school_record_fee_payment(
  p_org_id uuid,
  p_invoice_id uuid default null,
  p_student_id uuid default null,
  p_payment_reference text default null,
  p_payment_method text default 'cash',
  p_amount_mad numeric default 0,
  p_paid_at timestamptz default now(),
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.ac360_school_fee_payments;
  v_ref text := coalesce(nullif(trim(p_payment_reference), ''), 'PAY-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6));
  v_invoice public.ac360_school_tuition_invoices;
begin
  if p_invoice_id is not null then
    select * into v_invoice from public.ac360_school_tuition_invoices where id=p_invoice_id and org_id=p_org_id;
    if not found then
      raise exception 'invoice not found';
    end if;
  end if;

  insert into public.ac360_school_fee_payments(org_id, invoice_id, student_id, payment_reference, payment_method, status, amount_mad, paid_at, recorded_by, notes, metadata_json)
  values (p_org_id, p_invoice_id, coalesce(p_student_id, v_invoice.student_id), v_ref, coalesce(p_payment_method,'cash'), 'recorded', greatest(coalesce(p_amount_mad,0),0), coalesce(p_paid_at, now()), p_actor_app_user_id, p_notes, coalesce(p_metadata,'{}'::jsonb))
  returning * into v_payment;

  if p_invoice_id is not null then
    insert into public.ac360_school_payment_allocations(org_id, payment_id, invoice_id, amount_mad, allocated_by, notes, metadata_json)
    values (p_org_id, v_payment.id, p_invoice_id, v_payment.amount_mad, p_actor_app_user_id, 'Auto-allocation from payment record', '{"auto_allocated":true}'::jsonb)
    on conflict (org_id, payment_id, invoice_id) do update set amount_mad=excluded.amount_mad, allocation_status='allocated', updated_at=now();

    update public.ac360_school_tuition_invoices
    set paid_mad = least(total_mad, paid_mad + v_payment.amount_mad),
        status = case
          when least(total_mad, paid_mad + v_payment.amount_mad) >= total_mad then 'paid'
          when least(total_mad, paid_mad + v_payment.amount_mad) > 0 then 'partially_paid'
          else status
        end,
        updated_at=now()
    where id=p_invoice_id and org_id=p_org_id;
  end if;

  insert into public.ac360_school_collection_events(org_id, invoice_id, event_type, event_channel, amount_mad, event_note, actor_app_user_id, metadata_json)
  values (p_org_id, p_invoice_id, 'payment_recorded', 'system', v_payment.amount_mad, 'Payment recorded through Phase 2D finance runtime', p_actor_app_user_id, jsonb_build_object('payment_id', v_payment.id, 'payment_reference', v_payment.payment_reference));

  return jsonb_build_object('ok', true, 'payment', to_jsonb(v_payment));
end $$;

create or replace function public.ac360_school_allocate_payment(
  p_org_id uuid,
  p_payment_id uuid,
  p_invoice_id uuid,
  p_amount_mad numeric default null,
  p_actor_app_user_id uuid default null,
  p_notes text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.ac360_school_fee_payments;
  v_amount numeric;
  v_allocation public.ac360_school_payment_allocations;
begin
  select * into v_payment from public.ac360_school_fee_payments where id=p_payment_id and org_id=p_org_id;
  if not found then raise exception 'payment not found'; end if;

  v_amount := greatest(coalesce(p_amount_mad, v_payment.amount_mad), 0);

  insert into public.ac360_school_payment_allocations(org_id, payment_id, invoice_id, amount_mad, allocated_by, notes, metadata_json)
  values (p_org_id, p_payment_id, p_invoice_id, v_amount, p_actor_app_user_id, p_notes, coalesce(p_metadata,'{}'::jsonb))
  on conflict (org_id, payment_id, invoice_id) do update set
    amount_mad=excluded.amount_mad,
    allocation_status='allocated',
    allocated_by=excluded.allocated_by,
    notes=excluded.notes,
    metadata_json=public.ac360_school_payment_allocations.metadata_json || excluded.metadata_json,
    updated_at=now()
  returning * into v_allocation;

  update public.ac360_school_tuition_invoices
  set paid_mad = least(total_mad, coalesce((select sum(amount_mad) from public.ac360_school_payment_allocations where org_id=p_org_id and invoice_id=p_invoice_id and allocation_status='allocated'),0)),
      status = case
        when coalesce((select sum(amount_mad) from public.ac360_school_payment_allocations where org_id=p_org_id and invoice_id=p_invoice_id and allocation_status='allocated'),0) >= total_mad then 'paid'
        when coalesce((select sum(amount_mad) from public.ac360_school_payment_allocations where org_id=p_org_id and invoice_id=p_invoice_id and allocation_status='allocated'),0) > 0 then 'partially_paid'
        else status
      end,
      updated_at=now()
  where org_id=p_org_id and id=p_invoice_id;

  return jsonb_build_object('ok', true, 'allocation', to_jsonb(v_allocation));
end $$;

create or replace function public.ac360_school_mark_invoice_overdue(
  p_org_id uuid,
  p_invoice_id uuid,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.ac360_school_tuition_invoices;
  v_alert_key text;
begin
  update public.ac360_school_tuition_invoices
  set status='overdue', updated_at=now(), metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb)
  where org_id=p_org_id and id=p_invoice_id and status in ('issued','sent','partially_paid','overdue')
  returning * into v_invoice;

  if not found then
    raise exception 'invoice not found or not overdue eligible';
  end if;

  v_alert_key := 'overdue-' || v_invoice.id::text;
  insert into public.ac360_school_finance_alerts(org_id, campus_id, student_id, invoice_id, alert_key, alert_type, severity, title, description, amount_mad, metadata_json)
  values (p_org_id, v_invoice.campus_id, v_invoice.student_id, v_invoice.id, v_alert_key, 'overdue_invoice', case when v_invoice.balance_mad >= 5000 then 'high' else 'medium' end, 'Overdue invoice', 'Invoice ' || v_invoice.invoice_number || ' is overdue.', v_invoice.balance_mad, jsonb_build_object('source','mark_invoice_overdue'))
  on conflict (org_id, alert_key) do update set amount_mad=excluded.amount_mad, severity=excluded.severity, status='open', updated_at=now();

  return jsonb_build_object('ok', true, 'invoice', to_jsonb(v_invoice));
end $$;

create or replace function public.ac360_school_create_payment_promise(
  p_org_id uuid,
  p_student_id uuid default null,
  p_guardian_id uuid default null,
  p_invoice_id uuid default null,
  p_promised_amount_mad numeric default 0,
  p_promised_date date default current_date,
  p_notes text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promise public.ac360_school_payment_promises;
  v_code text := 'PROM-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);
begin
  insert into public.ac360_school_payment_promises(org_id, student_id, guardian_id, invoice_id, promise_code, promised_amount_mad, promised_date, status, created_by, notes, metadata_json)
  values (p_org_id, p_student_id, p_guardian_id, p_invoice_id, v_code, greatest(coalesce(p_promised_amount_mad,0),0), coalesce(p_promised_date,current_date), 'open', p_actor_app_user_id, p_notes, coalesce(p_metadata,'{}'::jsonb))
  returning * into v_promise;

  insert into public.ac360_school_collection_events(org_id, invoice_id, event_type, event_channel, amount_mad, event_note, actor_app_user_id, metadata_json)
  values (p_org_id, p_invoice_id, 'promise_created', 'system', v_promise.promised_amount_mad, p_notes, p_actor_app_user_id, jsonb_build_object('promise_id', v_promise.id, 'promised_date', v_promise.promised_date));

  return jsonb_build_object('ok', true, 'payment_promise', to_jsonb(v_promise));
end $$;

create or replace function public.ac360_school_decide_finance_adjustment(
  p_org_id uuid,
  p_invoice_id uuid,
  p_adjustment_type text default 'discount',
  p_requested_amount_mad numeric default 0,
  p_status text default 'approved',
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_adjustment public.ac360_school_finance_adjustments;
  v_code text := 'ADJ-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_amount numeric := greatest(coalesce(p_requested_amount_mad,0),0);
begin
  insert into public.ac360_school_finance_adjustments(org_id, invoice_id, adjustment_code, adjustment_type, requested_amount_mad, approved_amount_mad, status, request_reason, decision_reason, requested_by, decided_by, decided_at, metadata_json)
  values (p_org_id, p_invoice_id, v_code, coalesce(p_adjustment_type,'discount'), v_amount, case when p_status in ('approved','applied') then v_amount else null end, coalesce(p_status,'approved'), p_reason, p_reason, p_actor_app_user_id, p_actor_app_user_id, now(), coalesce(p_metadata,'{}'::jsonb))
  returning * into v_adjustment;

  if p_status in ('approved','applied') and v_amount > 0 then
    update public.ac360_school_tuition_invoices
    set discount_mad = discount_mad + v_amount,
        total_mad = greatest(total_mad - v_amount, 0),
        status = case when paid_mad >= greatest(total_mad - v_amount,0) then 'paid' else status end,
        updated_at=now()
    where org_id=p_org_id and id=p_invoice_id;
  end if;

  insert into public.ac360_school_collection_events(org_id, invoice_id, event_type, event_channel, amount_mad, event_note, actor_app_user_id, metadata_json)
  values (p_org_id, p_invoice_id, 'adjustment', 'system', v_amount, p_reason, p_actor_app_user_id, jsonb_build_object('adjustment_id', v_adjustment.id, 'status', v_adjustment.status));

  return jsonb_build_object('ok', true, 'adjustment', to_jsonb(v_adjustment));
end $$;

create or replace function public.ac360_school_reconcile_receivables(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_run_date date default current_date,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run public.ac360_school_finance_reconcile_runs;
  v_code text := 'FIN-REC-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_checked integer := 0;
  v_overdue integer := 0;
  v_total numeric := 0;
  v_paid numeric := 0;
  v_receivable numeric := 0;
  v_overdue_receivable numeric := 0;
  v_alerts integer := 0;
  v_invoice record;
begin
  insert into public.ac360_school_finance_reconcile_runs(org_id, campus_id, run_code, run_date, status, run_by, metadata_json)
  values (p_org_id, p_campus_id, v_code, coalesce(p_run_date,current_date), 'running', p_actor_app_user_id, coalesce(p_metadata,'{}'::jsonb))
  returning * into v_run;

  for v_invoice in
    select * from public.ac360_school_tuition_invoices
    where org_id=p_org_id
      and (p_campus_id is null or campus_id=p_campus_id)
      and status in ('issued','sent','partially_paid','overdue')
  loop
    v_checked := v_checked + 1;
    if v_invoice.due_date is not null and v_invoice.due_date < coalesce(p_run_date,current_date) and v_invoice.balance_mad > 0 then
      update public.ac360_school_tuition_invoices set status='overdue', updated_at=now() where id=v_invoice.id;
      v_overdue := v_overdue + 1;
      v_overdue_receivable := v_overdue_receivable + v_invoice.balance_mad;
      insert into public.ac360_school_finance_alerts(org_id, campus_id, student_id, invoice_id, alert_key, alert_type, severity, title, description, amount_mad, metadata_json)
      values (p_org_id, v_invoice.campus_id, v_invoice.student_id, v_invoice.id, 'overdue-' || v_invoice.id::text, 'overdue_invoice', case when v_invoice.balance_mad >= 5000 then 'high' else 'medium' end, 'Overdue invoice', 'Invoice ' || v_invoice.invoice_number || ' is overdue.', v_invoice.balance_mad, jsonb_build_object('source','receivables_reconcile','run_id',v_run.id))
      on conflict (org_id, alert_key) do update set amount_mad=excluded.amount_mad, severity=excluded.severity, status='open', updated_at=now();
      v_alerts := v_alerts + 1;
    end if;
  end loop;

  select coalesce(sum(total_mad),0), coalesce(sum(paid_mad),0), coalesce(sum(balance_mad),0)
  into v_total, v_paid, v_receivable
  from public.ac360_school_tuition_invoices
  where org_id=p_org_id
    and (p_campus_id is null or campus_id=p_campus_id)
    and status not in ('cancelled','archived','draft');

  insert into public.ac360_school_receivable_snapshots(org_id, campus_id, snapshot_date, active_invoice_count, overdue_invoice_count, total_invoiced_mad, total_paid_mad, total_receivable_mad, overdue_receivable_mad, promise_open_count, collection_case_open_count, metadata_json)
  values (
    p_org_id, p_campus_id, coalesce(p_run_date,current_date),
    coalesce((select count(*) from public.ac360_school_tuition_invoices where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status not in ('cancelled','archived','draft')),0),
    coalesce((select count(*) from public.ac360_school_tuition_invoices where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='overdue'),0),
    v_total, v_paid, v_receivable, v_overdue_receivable,
    coalesce((select count(*) from public.ac360_school_payment_promises where org_id=p_org_id and status='open'),0),
    coalesce((select count(*) from public.ac360_school_collection_cases where org_id=p_org_id and status='open'),0),
    jsonb_build_object('run_id', v_run.id)
  )
  on conflict (org_id, campus_id, snapshot_date) do update set
    active_invoice_count=excluded.active_invoice_count,
    overdue_invoice_count=excluded.overdue_invoice_count,
    total_invoiced_mad=excluded.total_invoiced_mad,
    total_paid_mad=excluded.total_paid_mad,
    total_receivable_mad=excluded.total_receivable_mad,
    overdue_receivable_mad=excluded.overdue_receivable_mad,
    promise_open_count=excluded.promise_open_count,
    collection_case_open_count=excluded.collection_case_open_count,
    metadata_json=public.ac360_school_receivable_snapshots.metadata_json || excluded.metadata_json;

  update public.ac360_school_finance_reconcile_runs
  set status='completed', invoices_checked=v_checked, overdue_marked=v_overdue, receivables_mad=v_receivable, payments_mad=v_paid, alerts_created=v_alerts, updated_at=now()
  where id=v_run.id
  returning * into v_run;

  return jsonb_build_object('ok', true, 'run', to_jsonb(v_run));
exception when others then
  update public.ac360_school_finance_reconcile_runs set status='failed', metadata_json=metadata_json || jsonb_build_object('error', sqlerrm), updated_at=now() where id=v_run.id;
  raise;
end $$;

create or replace function public.ac360_school_resolve_finance_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_alert public.ac360_school_finance_alerts;
begin
  update public.ac360_school_finance_alerts
  set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), resolution_note=p_resolution_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now()
  where id=p_alert_id and org_id=p_org_id
  returning * into v_alert;
  if not found then raise exception 'finance alert not found'; end if;
  return jsonb_build_object('ok', true, 'alert', to_jsonb(v_alert));
end $$;

-- -----------------------------------------------------------------------------
-- 3. Action registry and wiring seeds
-- -----------------------------------------------------------------------------
insert into public.ac360_action_registry(action_key, feature_key, engine_code, label, description, entitlement_key, meter_key, credit_cost, restriction_behavior, metadata_json) values
('school.finance.fee_catalog.upsert','finance_basic','AC360-ENG-49','Upsert finance fee catalog','Create/update tuition, registration, transport, meal or extra fee catalog item.','finance.fee_catalog.write',null,0,'block','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime"}'::jsonb),
('school.finance.billing_cycle.open','finance_basic','AC360-ENG-49','Open billing cycle','Open monthly/term billing cycle for a campus or whole institution.','finance.billing_cycle.open',null,0,'block','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime"}'::jsonb),
('school.finance.invoice_batch.generate','finance_advanced','AC360-ENG-49','Generate invoice batch','Bulk-generate invoices for active students in a billing cycle.','finance.invoice_batch.generate','report_generation',10,'require_topup','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime","suggested_addon_key":"finance_power"}'::jsonb),
('school.finance.invoice.issue','finance_basic','AC360-ENG-49','Issue invoice','Issue one tuition/fee invoice with line items.','finance.invoice.issue',null,0,'block','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime"}'::jsonb),
('school.finance.payment.record','finance_basic','AC360-ENG-49','Record fee payment','Record cash, bank, cheque, card, online or other school fee payment.','finance.payment.record',null,0,'block','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime"}'::jsonb),
('school.finance.payment.allocate','finance_basic','AC360-ENG-49','Allocate payment','Allocate a payment to an invoice and refresh paid/balance status.','finance.payment.allocate',null,0,'block','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime"}'::jsonb),
('school.finance.receivables.reconcile','finance_advanced','AC360-ENG-49','Reconcile receivables','Mark overdue invoices, snapshot receivables and create finance alerts.','finance.receivables.reconcile','report_generation',10,'require_topup','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime","suggested_addon_key":"finance_power"}'::jsonb),
('school.finance.invoice.mark_overdue','finance_advanced','AC360-ENG-49','Mark invoice overdue','Mark one invoice overdue and create collection alert.','finance.invoice.mark_overdue',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime","suggested_addon_key":"finance_power"}'::jsonb),
('school.finance.payment_promise.create','finance_advanced','AC360-ENG-49','Create payment promise','Create parent/guardian payment promise for receivables follow-up.','finance.payment_promise.create',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime","suggested_addon_key":"finance_power"}'::jsonb),
('school.finance.adjustment.decide','finance_advanced','AC360-ENG-49','Decide finance adjustment','Approve/reject/apply discount, waiver, correction or credit note.','finance.adjustment.decide',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime","suggested_addon_key":"finance_power"}'::jsonb),
('school.finance.alert.resolve','finance_advanced','AC360-ENG-49','Resolve finance alert','Resolve overdue/receivables/manual-review finance alert.','finance.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2d_finance_receivables_runtime","suggested_addon_key":"finance_power"}'::jsonb)
on conflict (action_key) do update set
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  label=excluded.label,
  description=excluded.description,
  entitlement_key=excluded.entitlement_key,
  meter_key=excluded.meter_key,
  credit_cost=excluded.credit_cost,
  restriction_behavior=excluded.restriction_behavior,
  metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,
  updated_at=now();

insert into public.ac360_app_action_wiring(
  wiring_key, route_path, http_method, action_key, feature_key, engine_code, target_module, target_table,
  enforcement_mode, quantity_strategy, idempotency_strategy, current_capacity_strategy, fallback_action_key, status, description, metadata_json
) values
('ac360.school_finance.fee_catalog.upsert','/api/ac360/school-finance/fee-catalog/upsert','POST','school.finance.fee_catalog.upsert','finance_basic','AC360-ENG-49','angelcare_360_school_finance','ac360_school_fee_catalog','strict','fixed_1','request_or_generated',null,null,'active','Upserts school fee catalog item under finance entitlement.','{"phase":"phase_2d","uiBuildAllowed":false}'::jsonb),
('ac360.school_finance.billing_cycle.open','/api/ac360/school-finance/billing-cycles/open','POST','school.finance.billing_cycle.open','finance_basic','AC360-ENG-49','angelcare_360_school_finance','ac360_school_billing_cycles','strict','fixed_1','request_or_generated',null,null,'active','Opens school billing cycle under finance entitlement.','{"phase":"phase_2d","uiBuildAllowed":false}'::jsonb),
('ac360.school_finance.invoice_batch.generate','/api/ac360/school-finance/invoice-batches/generate','POST','school.finance.invoice_batch.generate','finance_advanced','AC360-ENG-49','angelcare_360_school_finance','ac360_school_invoice_batches','strict','fixed_1','request_or_generated',null,'school.finance.invoice.issue','active','Bulk-generates student invoices under Finance Power / advanced finance guard.','{"phase":"phase_2d","uiBuildAllowed":false,"suggested_addon_key":"finance_power"}'::jsonb),
('ac360.school_finance.invoice.issue','/api/ac360/school-finance/invoices/issue','POST','school.finance.invoice.issue','finance_basic','AC360-ENG-49','angelcare_360_school_finance','ac360_school_tuition_invoices','strict','fixed_1','request_or_generated',null,'school.invoice.create','active','Issues one school finance invoice under guard.','{"phase":"phase_2d","uiBuildAllowed":false}'::jsonb),
('ac360.school_finance.payment.record','/api/ac360/school-finance/payments/record','POST','school.finance.payment.record','finance_basic','AC360-ENG-49','angelcare_360_school_finance','ac360_school_fee_payments','strict','fixed_1','request_or_generated',null,null,'active','Records payment under finance guard.','{"phase":"phase_2d","uiBuildAllowed":false}'::jsonb),
('ac360.school_finance.payment.allocate','/api/ac360/school-finance/payments/allocate','POST','school.finance.payment.allocate','finance_basic','AC360-ENG-49','angelcare_360_school_finance','ac360_school_payment_allocations','strict','fixed_1','request_or_generated',null,null,'active','Allocates payment to invoice and refreshes invoice status.','{"phase":"phase_2d","uiBuildAllowed":false}'::jsonb),
('ac360.school_finance.receivables.reconcile','/api/ac360/school-finance/receivables/reconcile','POST','school.finance.receivables.reconcile','finance_advanced','AC360-ENG-49','angelcare_360_school_finance','ac360_school_finance_reconcile_runs','strict','fixed_1','request_or_generated',null,'school.finance.invoice.mark_overdue','active','Runs finance receivables reconciliation and alert creation.','{"phase":"phase_2d","uiBuildAllowed":false,"suggested_addon_key":"finance_power"}'::jsonb),
('ac360.school_finance.invoice.mark_overdue','/api/ac360/school-finance/invoices/mark-overdue','POST','school.finance.invoice.mark_overdue','finance_advanced','AC360-ENG-49','angelcare_360_school_finance','ac360_school_tuition_invoices','strict','fixed_1','request_or_generated',null,null,'active','Marks one invoice overdue and creates collection alert.','{"phase":"phase_2d","uiBuildAllowed":false,"suggested_addon_key":"finance_power"}'::jsonb),
('ac360.school_finance.payment_promise.create','/api/ac360/school-finance/payment-promises/create','POST','school.finance.payment_promise.create','finance_advanced','AC360-ENG-49','angelcare_360_school_finance','ac360_school_payment_promises','strict','fixed_1','request_or_generated',null,null,'active','Creates payment promise under receivables governance.','{"phase":"phase_2d","uiBuildAllowed":false,"suggested_addon_key":"finance_power"}'::jsonb),
('ac360.school_finance.adjustment.decide','/api/ac360/school-finance/adjustments/decide','POST','school.finance.adjustment.decide','finance_advanced','AC360-ENG-49','angelcare_360_school_finance','ac360_school_finance_adjustments','strict','fixed_1','request_or_generated',null,null,'active','Decides finance adjustment under approval governance.','{"phase":"phase_2d","uiBuildAllowed":false,"suggested_addon_key":"finance_power"}'::jsonb),
('ac360.school_finance.alert.resolve','/api/ac360/school-finance/alerts/resolve','POST','school.finance.alert.resolve','finance_advanced','AC360-ENG-49','angelcare_360_school_finance','ac360_school_finance_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves finance alert while preserving ledger.','{"phase":"phase_2d","uiBuildAllowed":false,"suggested_addon_key":"finance_power"}'::jsonb)
on conflict (wiring_key) do update set
  route_path=excluded.route_path,
  http_method=excluded.http_method,
  action_key=excluded.action_key,
  feature_key=excluded.feature_key,
  engine_code=excluded.engine_code,
  target_module=excluded.target_module,
  target_table=excluded.target_table,
  enforcement_mode=excluded.enforcement_mode,
  quantity_strategy=excluded.quantity_strategy,
  idempotency_strategy=excluded.idempotency_strategy,
  current_capacity_strategy=excluded.current_capacity_strategy,
  fallback_action_key=excluded.fallback_action_key,
  status=excluded.status,
  description=excluded.description,
  metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,
  updated_at=now();

-- Extend Phase 2 module registry consistently with Phase 2A.
insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values
('finance_receivables_runtime','AC360-ENG-49','finance_advanced','Finance, Invoicing, Payments & Receivables Runtime','phase_2d_finance_receivables_runtime','guarded',array['ac360_school_fee_catalog','ac360_school_billing_cycles','ac360_school_invoice_batches','ac360_school_payment_allocations','ac360_school_payment_promises','ac360_school_collection_cases','ac360_school_collection_events','ac360_school_finance_adjustments','ac360_school_finance_reconcile_runs','ac360_school_receivable_snapshots','ac360_school_finance_alerts'],array['school.finance.fee_catalog.upsert','school.finance.billing_cycle.open','school.finance.invoice_batch.generate','school.finance.invoice.issue','school.finance.payment.record','school.finance.payment.allocate','school.finance.receivables.reconcile','school.finance.invoice.mark_overdue','school.finance.payment_promise.create','school.finance.adjustment.decide','school.finance.alert.resolve'],'{"phase":"phase_2d","uiBuildAllowed":false,"archiveNotDelete":true,"finance_power_addon_recommended":true}'::jsonb)
on conflict (module_key) do update set
  engine_code=excluded.engine_code,
  feature_key=excluded.feature_key,
  label=excluded.label,
  phase=excluded.phase,
  status=excluded.status,
  data_tables=excluded.data_tables,
  guarded_actions=excluded.guarded_actions,
  metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,
  updated_at=now();

-- Automation rules use Phase 1 table shape: system_group + trigger_event.
insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, status, phase, sort_order) values
('school_finance_overdue_recommend_finance_power','Overdue receivables recommend Finance Power','School Finance','finance.overdue.detected','{"overdue_receivable_mad_gt":0}'::jsonb,'{"recommend_addon":"finance_power","create_alert":true}'::jsonb,'active','phase_2d_finance_receivables_runtime',240),
('school_finance_low_collection_create_alert','Receivables reconciliation creates management alert','School Finance','finance.reconciliation.completed','{"overdue_invoice_count_gt":0}'::jsonb,'{"create_finance_alert":true,"severity":"medium"}'::jsonb,'active','phase_2d_finance_receivables_runtime',241)
on conflict (rule_key) do update set
  label=excluded.label,
  system_group=excluded.system_group,
  trigger_event=excluded.trigger_event,
  condition_json=excluded.condition_json,
  action_json=excluded.action_json,
  status=excluded.status,
  phase=excluded.phase,
  sort_order=excluded.sort_order,
  updated_at=now();

-- -----------------------------------------------------------------------------
-- 4. RLS service-role policies for backend API control
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'ac360_school_fee_catalog','ac360_school_billing_cycles','ac360_school_invoice_batches','ac360_school_payment_allocations',
    'ac360_school_payment_promises','ac360_school_collection_cases','ac360_school_collection_events','ac360_school_finance_adjustments',
    'ac360_school_finance_reconcile_runs','ac360_school_receivable_snapshots','ac360_school_finance_alerts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;
