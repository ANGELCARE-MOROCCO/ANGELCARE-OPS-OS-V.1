-- AngelCare 360 payment gate / document export engine backbone
-- Safe additive migration for the demo customer blocking overlay.

begin;

create extension if not exists pgcrypto;

create table if not exists public.angelcare360_operator_payment_gates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  tenant_id uuid,
  invoice_id uuid,
  subscription_id uuid,
  gate_code text not null unique,
  status text not null,
  amount_due_mad numeric not null default 0,
  currency text not null default 'MAD',
  reason text not null,
  due_date date,
  blocking boolean not null default true,
  provider_key text,
  checkout_url text,
  online_payment_reference text,
  manual_processed_by uuid,
  manual_processed_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status in ('active', 'online_processing', 'manual_pending', 'processed', 'waived', 'cancelled', 'expired'))
);

create index if not exists angelcare360_operator_payment_gates_client_idx on public.angelcare360_operator_payment_gates (client_id);
create index if not exists angelcare360_operator_payment_gates_tenant_idx on public.angelcare360_operator_payment_gates (tenant_id);
create index if not exists angelcare360_operator_payment_gates_invoice_idx on public.angelcare360_operator_payment_gates (invoice_id);
create index if not exists angelcare360_operator_payment_gates_subscription_idx on public.angelcare360_operator_payment_gates (subscription_id);
create index if not exists angelcare360_operator_payment_gates_status_idx on public.angelcare360_operator_payment_gates (status);
create index if not exists angelcare360_operator_payment_gates_due_date_idx on public.angelcare360_operator_payment_gates (due_date);
create index if not exists angelcare360_operator_payment_gates_created_at_idx on public.angelcare360_operator_payment_gates (created_at);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where p.proname = 'angelcare360_touch_updated_at'
      and n.nspname = 'public'
  ) then
    execute 'drop trigger if exists trg_angelcare360_operator_payment_gates_updated_at on public.angelcare360_operator_payment_gates';
    execute 'create trigger trg_angelcare360_operator_payment_gates_updated_at before update on public.angelcare360_operator_payment_gates for each row execute function public.angelcare360_touch_updated_at()';
  end if;
end $$;

commit;
