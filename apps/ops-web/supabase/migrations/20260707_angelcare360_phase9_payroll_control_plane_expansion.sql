alter table if exists public.angelcare360_payroll_periods
  add column if not exists validated_at timestamptz,
  add column if not exists validated_by uuid references public.app_users(id) on delete set null,
  add column if not exists closed_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists idempotency_key text;

alter table if exists public.angelcare360_payroll_records
  add column if not exists validated_at timestamptz,
  add column if not exists validated_by uuid references public.app_users(id) on delete set null,
  add column if not exists blocked_reason text,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_date date,
  add column if not exists idempotency_key text;

alter table if exists public.angelcare360_payroll_items
  add column if not exists idempotency_key text;

alter table if exists public.angelcare360_payroll_periods
  drop constraint if exists angelcare360_payroll_periods_status_check;

alter table if exists public.angelcare360_payroll_periods
  add constraint angelcare360_payroll_periods_status_check
  check (status in ('draft', 'planned', 'open', 'calculated', 'validated', 'paid', 'closed', 'cancelled', 'archived'));

alter table if exists public.angelcare360_payroll_records
  drop constraint if exists angelcare360_payroll_records_payment_status_check;

alter table if exists public.angelcare360_payroll_records
  add constraint angelcare360_payroll_records_payment_status_check
  check (payment_status in ('not_ready', 'pending', 'confirmed', 'blocked', 'cancelled', 'partial', 'paid', 'failed'));

alter table if exists public.angelcare360_payroll_records
  drop constraint if exists angelcare360_payroll_records_status_check;

alter table if exists public.angelcare360_payroll_records
  add constraint angelcare360_payroll_records_status_check
  check (status in ('draft', 'pending_review', 'validated', 'payment_pending', 'paid', 'blocked', 'cancelled', 'approved', 'archived'));

alter table if exists public.angelcare360_payroll_records
  drop constraint if exists angelcare360_payroll_records_school_id_payroll_period_id_staff_id_key;

create unique index if not exists idx_angelcare360_payroll_records_school_period_staff
  on public.angelcare360_payroll_records (school_id, payroll_period_id, staff_id);

create unique index if not exists idx_angelcare360_payroll_records_school_idempotency
  on public.angelcare360_payroll_records (school_id, idempotency_key);

alter table if exists public.angelcare360_payroll_items
  drop constraint if exists angelcare360_payroll_items_item_type_check;

alter table if exists public.angelcare360_payroll_items
  add constraint angelcare360_payroll_items_item_type_check
  check (item_type in ('base_salary', 'bonus', 'deduction', 'advance', 'adjustment', 'reimbursement', 'other', 'earning', 'allowance'));

alter table if exists public.angelcare360_payroll_items
  drop constraint if exists angelcare360_payroll_items_status_check;

alter table if exists public.angelcare360_payroll_items
  add constraint angelcare360_payroll_items_status_check
  check (status in ('active', 'archived'));
