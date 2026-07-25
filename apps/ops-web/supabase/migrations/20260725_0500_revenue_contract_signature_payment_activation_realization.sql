-- ANGELCARE Revenue Command Center — Excellence v7 / Mega ZIP 7
-- Contracts, Signatures, Payment Gates & Revenue Realization Control Plane
-- Additive, transactional and compatible with the accepted TEXT prospect identity contract.
begin;

create extension if not exists pgcrypto;

do $$
declare
  expected_count integer := 28;
  present_count integer;
begin
  if to_regclass('public.revenue_prospects') is null
     or to_regclass('public.revenue_accounts') is null
     or to_regclass('public.revenue_contacts') is null
     or to_regclass('public.revenue_opportunities') is null
     or to_regclass('public.revenue_tasks') is null
     or to_regclass('public.revenue_proposals') is null
     or to_regclass('public.revenue_proposal_versions') is null
     or to_regclass('public.revenue_commercial_outcomes') is null
     or to_regclass('public.revenue_contract_handoffs') is null then
    raise exception 'Mega ZIP 7 foundation is incomplete. Apply and verify Phase 2, 4, 5 and 6 first.';
  end if;

  if not exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_prospects' and column_name='id' and udt_name='text'
  ) then
    raise exception 'Mega ZIP 7 expects public.revenue_prospects.id TEXT. Do not convert legacy prospect identifiers.';
  end if;

  if to_regclass('public.revenue_contracts') is not null and not exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_contracts' and column_name='id' and udt_name='uuid'
  ) then
    raise exception 'Existing public.revenue_contracts has an incompatible identity contract. Stop and reconcile.';
  end if;

  select count(*) into present_count
  from unnest(array[
    'revenue_contracts','revenue_contract_versions','revenue_contract_sections','revenue_contract_reviews',
    'revenue_contract_approvals','revenue_contract_signatories','revenue_signature_events','revenue_signature_evidence',
    'revenue_contract_conditions','revenue_condition_evidence','revenue_contract_obligations','revenue_obligation_events',
    'revenue_contract_milestones','revenue_payment_terms','revenue_payment_schedules','revenue_payment_requirements',
    'revenue_payment_promises','revenue_payment_promise_events','revenue_collection_actions','revenue_finance_handoffs',
    'revenue_payment_confirmations','revenue_activation_gates','revenue_activation_decisions','revenue_operational_handoffs',
    'revenue_realization_events','revenue_contract_risks','revenue_contract_status_history','revenue_contract_closures'
  ]) name
  where to_regclass('public.'||name) is not null;

  if present_count not in (0,expected_count) then
    raise exception 'Partial Mega ZIP 7 schema detected (% of % objects). Stop and reconcile before applying.',present_count,expected_count;
  end if;
end $$;

create sequence if not exists public.revenue_contract_reference_seq start 1001;

create table if not exists public.revenue_contracts (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('AC-CTR-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.revenue_contract_reference_seq')::text,6,'0')),
  title text not null,
  status text not null default 'draft' check(status in ('draft','internal_review','approval_required','approved','signature_preparation','signature_pending','partially_signed','fully_signed','conditions_pending','effective','activation_pending','active','suspended','completed','expired','terminated','superseded','archived')),
  contract_type text not null default 'commercial_contract',
  context_type text not null default 'partnership' check(context_type in ('prospect','partnership','system')),
  prospect_id text references public.revenue_prospects(id) on update cascade on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  proposal_id uuid references public.revenue_proposals(id) on delete restrict,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete restrict,
  commercial_outcome_id uuid references public.revenue_commercial_outcomes(id) on delete restrict,
  contract_handoff_id uuid unique references public.revenue_contract_handoffs(id) on delete restrict,
  partnership_id text,
  owner text not null default 'Revenue Manager',
  currency text not null default 'MAD',
  contract_value numeric(18,2) not null default 0 check(contract_value>=0),
  signed_value numeric(18,2) not null default 0 check(signed_value>=0),
  realized_value numeric(18,2) not null default 0 check(realized_value>=0),
  review_status text not null default 'not_requested',
  approval_status text not null default 'not_requested',
  signature_status text not null default 'not_prepared',
  effectiveness_status text not null default 'not_ready',
  payment_gate_status text not null default 'not_required',
  activation_status text not null default 'not_ready',
  realization_status text not null default 'not_eligible',
  effective_date date,
  expiry_date date,
  renewal_notice_date date,
  next_action text,
  active_version_id uuid,
  activated_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  check(realized_value<=greatest(contract_value,signed_value))
);

create table if not exists public.revenue_contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  version_number integer not null,
  source_version_id uuid references public.revenue_contract_versions(id) on delete set null,
  revision_reason text not null,
  changes text,
  internal_rationale text,
  contract_snapshot jsonb not null,
  sections_snapshot jsonb not null default '[]'::jsonb,
  obligations_snapshot jsonb not null default '[]'::jsonb,
  milestones_snapshot jsonb not null default '[]'::jsonb,
  payment_snapshot jsonb not null default '{}'::jsonb,
  signatory_snapshot jsonb not null default '[]'::jsonb,
  review_status text not null default 'not_requested',
  approval_status text not null default 'not_requested',
  immutable_at timestamptz not null default now(),
  created_by uuid,
  created_at timestamptz not null default now(),
  unique(contract_id,version_number)
);

alter table public.revenue_contracts drop constraint if exists revenue_contracts_active_version_id_fkey;
alter table public.revenue_contracts add constraint revenue_contracts_active_version_id_fkey foreign key(active_version_id) references public.revenue_contract_versions(id) on delete set null;

create table if not exists public.revenue_contract_sections (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  contract_version_id uuid references public.revenue_contract_versions(id) on delete cascade,
  section_type text not null default 'section',
  title text not null,
  customer_content text,
  internal_content text,
  visibility text not null default 'customer' check(visibility in ('customer','internal','restricted')),
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_reviews (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  contract_version_id uuid references public.revenue_contract_versions(id) on delete set null,
  review_type text not null,
  reviewer text,
  status text not null default 'requested' check(status in ('requested','approved','rejected','correction_required','cancelled')),
  reason text not null,
  decision text,
  evidence text,
  due_at timestamptz,
  requested_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_approvals (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  contract_version_id uuid references public.revenue_contract_versions(id) on delete set null,
  approval_type text not null default 'contract',
  status text not null default 'requested' check(status in ('requested','approved','rejected','correction_required','cancelled')),
  reason text not null,
  evidence text,
  financial_impact jsonb not null default '{}'::jsonb,
  requested_by uuid,
  decided_by uuid,
  decided_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_signatories (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  contract_version_id uuid references public.revenue_contract_versions(id) on delete set null,
  party_type text not null check(party_type in ('angelcare','customer','partner')),
  name text not null,
  email text,
  role text not null,
  signing_order integer not null default 1,
  required boolean not null default true,
  status text not null default 'pending' check(status in ('pending','requested','signed','declined','cancelled')),
  evidence_reference text,
  signed_at timestamptz,
  verified_at timestamptz,
  verified_by uuid,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_signature_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  contract_version_id uuid references public.revenue_contract_versions(id) on delete set null,
  signatory_id uuid references public.revenue_contract_signatories(id) on delete set null,
  event_type text not null,
  status text not null,
  channel text,
  due_at timestamptz,
  reason text,
  evidence_reference text,
  provider_reference text,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_signature_evidence (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  signatory_id uuid references public.revenue_contract_signatories(id) on delete set null,
  signature_event_id uuid references public.revenue_signature_events(id) on delete set null,
  evidence_type text not null default 'document',
  evidence_reference text not null,
  source_system text,
  status text not null default 'pending' check(status in ('pending','verified','rejected')),
  uploaded_by uuid,
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_conditions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  title text not null,
  condition_type text not null,
  description text,
  owner text,
  due_at timestamptz,
  required boolean not null default true,
  status text not null default 'pending' check(status in ('pending','verified','rejected','waived','not_applicable')),
  evidence_requirements text,
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_condition_evidence (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  condition_id uuid not null references public.revenue_contract_conditions(id) on delete cascade,
  evidence_reference text not null,
  evidence_type text not null default 'document',
  source_system text,
  status text not null default 'pending',
  uploaded_by uuid,
  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_obligations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  responsible_party text not null check(responsible_party in ('angelcare','customer','shared')),
  description text not null,
  owner text,
  due_at timestamptz,
  recurrence text,
  evidence_required boolean not null default true,
  acceptance_criteria text,
  status text not null default 'open' check(status in ('open','in_progress','completed','breached','waived','cancelled')),
  risk_status text not null default 'normal',
  completed_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_obligation_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  obligation_id uuid not null references public.revenue_contract_obligations(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  reason text,
  evidence_reference text,
  actor_id uuid,
  occurred_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  title text not null,
  deliverable text,
  acceptance_criteria text,
  owner text,
  due_at timestamptz,
  payment_dependency text not null default 'none',
  activation_dependency boolean not null default false,
  status text not null default 'planned' check(status in ('planned','in_progress','completed','delayed','cancelled')),
  customer_accepted_at timestamptz,
  evidence_reference text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_payment_terms (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  term_type text not null,
  deposit_amount numeric(18,2) not null default 0,
  deposit_percent numeric(9,4) not null default 0,
  payment_days integer not null default 0,
  activation_dependency text not null default 'mandatory' check(activation_dependency in ('mandatory','advisory','none')),
  currency text not null default 'MAD',
  terms text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  check(deposit_amount>=0 and deposit_percent>=0)
);

create table if not exists public.revenue_payment_schedules (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  payment_term_id uuid references public.revenue_payment_terms(id) on delete set null,
  milestone_id uuid references public.revenue_contract_milestones(id) on delete set null,
  schedule_type text not null,
  amount numeric(18,2) not null check(amount>=0),
  percentage numeric(9,4),
  currency text not null default 'MAD',
  due_date date,
  trigger text,
  activation_blocking boolean not null default true,
  invoice_reference text,
  status text not null default 'scheduled' check(status in ('scheduled','invoicing_pending','expected','partially_paid','paid','overdue','waived','cancelled')),
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_payment_requirements (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  payment_schedule_id uuid references public.revenue_payment_schedules(id) on delete set null,
  title text not null,
  amount numeric(18,2) not null default 0 check(amount>=0),
  currency text not null default 'MAD',
  due_date date,
  activation_blocking boolean not null default true,
  finance_reference text,
  status text not null default 'expected' check(status in ('expected','partially_confirmed','confirmed','overdue','waived','cancelled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_payment_promises (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  payment_requirement_id uuid references public.revenue_payment_requirements(id) on delete set null,
  expected_amount numeric(18,2) not null check(expected_amount>0),
  currency text not null default 'MAD',
  promised_date date not null,
  customer_contact text,
  source_reference text,
  confidence text not null default 'medium',
  reason text,
  status text not null default 'confirmed' check(status in ('proposed','confirmed','due_soon','kept','partially_kept','broken','replaced','cancelled')),
  owner text,
  kept_at timestamptz,
  broken_at timestamptz,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_payment_promise_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  payment_promise_id uuid not null references public.revenue_payment_promises(id) on delete cascade,
  event_type text not null,
  reason text,
  actor_id uuid,
  occurred_at timestamptz not null default now()
);

create table if not exists public.revenue_collection_actions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  payment_promise_id uuid references public.revenue_payment_promises(id) on delete set null,
  channel text not null,
  action text not null,
  owner text,
  due_at timestamptz,
  escalation_level text not null default 'none',
  outcome text,
  communication_event_id uuid references public.revenue_communication_events(id) on delete set null,
  status text not null default 'planned' check(status in ('planned','in_progress','completed','failed','cancelled')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_finance_handoffs (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  billing_identity text,
  final_value numeric(18,2) not null default 0 check(final_value>=0),
  currency text not null default 'MAD',
  deposit_required numeric(18,2) not null default 0 check(deposit_required>=0),
  payment_terms text not null,
  finance_recipient text,
  supporting_documents text,
  idempotency_key text not null unique,
  status text not null default 'submitted' check(status in ('draft','submitted','accepted','clarification_required','rejected','completed','cancelled')),
  finance_reference text,
  decision_reason text,
  submitted_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_payment_confirmations (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  finance_handoff_id uuid references public.revenue_finance_handoffs(id) on delete set null,
  payment_requirement_id uuid references public.revenue_payment_requirements(id) on delete set null,
  expected_amount numeric(18,2) not null default 0,
  confirmed_amount numeric(18,2) not null check(confirmed_amount>=0),
  currency text not null default 'MAD',
  payment_date date,
  payment_method text,
  finance_reference text not null unique,
  receipt_reference text,
  evidence_reference text not null,
  reconciliation_status text not null default 'confirmed' check(reconciliation_status in ('confirmed','partial','discrepancy','reversed','rejected')),
  notes text,
  confirmed_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_activation_gates (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  gate_key text not null,
  title text not null,
  mandatory boolean not null default true,
  status text not null default 'pending' check(status in ('pending','passed','failed','waived','not_applicable')),
  reason text,
  evidence_reference text,
  evaluated_by uuid,
  evaluated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contract_id,gate_key)
);

create table if not exists public.revenue_activation_decisions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  decision text not null,
  reason text not null,
  evidence_reference text,
  override boolean not null default false,
  decided_by uuid,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_operational_handoffs (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  receiving_module text not null,
  receiving_owner text not null,
  start_date date,
  service_scope text not null,
  commitments text,
  risks text,
  status text not null default 'submitted' check(status in ('prepared','submitted','accepted','rejected','cancelled','completed')),
  acceptance_notes text,
  submitted_by uuid,
  accepted_by uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_realization_events (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  payment_confirmation_id uuid references public.revenue_payment_confirmations(id) on delete set null,
  reversal_of_id uuid references public.revenue_realization_events(id) on delete set null,
  amount numeric(18,2) not null,
  currency text not null default 'MAD',
  status text not null default 'realized' check(status in ('eligible','realized','partially_realized','reversed','rejected')),
  finance_reference text not null,
  evidence_reference text not null,
  realization_rule text not null,
  realized_at timestamptz not null default now(),
  realized_by uuid,
  created_at timestamptz not null default now(),
  unique(contract_id,finance_reference,status)
);

create table if not exists public.revenue_contract_risks (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  risk_type text not null,
  description text not null,
  severity text not null default 'medium' check(severity in ('low','medium','high','critical')),
  probability_percent numeric(5,2) not null default 0 check(probability_percent between 0 and 100),
  value_at_risk numeric(18,2) not null default 0 check(value_at_risk>=0),
  owner text,
  mitigation text,
  status text not null default 'open' check(status in ('open','monitoring','mitigated','resolved','accepted','closed')),
  resolution text,
  created_by uuid,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_status_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_contract_closures (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.revenue_contracts(id) on delete cascade,
  closure_type text not null,
  status text not null default 'open',
  reason text,
  next_action text,
  effective_date timestamptz,
  evidence text,
  created_by uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists revenue_contracts_status_idx on public.revenue_contracts(status,updated_at desc);
create index if not exists revenue_contracts_context_idx on public.revenue_contracts(context_type,partnership_id,prospect_id,account_id);
create index if not exists revenue_contracts_proposal_idx on public.revenue_contracts(proposal_id,proposal_version_id);
create index if not exists revenue_contracts_expiry_idx on public.revenue_contracts(expiry_date) where status not in ('completed','expired','terminated','archived');
create index if not exists revenue_contract_versions_contract_idx on public.revenue_contract_versions(contract_id,version_number desc);
create index if not exists revenue_contract_signatories_pending_idx on public.revenue_contract_signatories(contract_id,status,signing_order);
create index if not exists revenue_contract_conditions_pending_idx on public.revenue_contract_conditions(contract_id,status,due_at);
create index if not exists revenue_contract_obligations_due_idx on public.revenue_contract_obligations(contract_id,status,due_at);
create index if not exists revenue_payment_requirements_due_idx on public.revenue_payment_requirements(contract_id,status,due_date);
create index if not exists revenue_payment_promises_due_idx on public.revenue_payment_promises(contract_id,status,promised_date);
create index if not exists revenue_activation_gates_contract_idx on public.revenue_activation_gates(contract_id,status);
create index if not exists revenue_contract_risks_open_idx on public.revenue_contract_risks(contract_id,status,severity);
create index if not exists revenue_realization_events_contract_idx on public.revenue_realization_events(contract_id,realized_at desc);

create or replace function public.revenue_mz7_touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
do $$ declare t text; begin
  foreach t in array array[
    'revenue_contracts','revenue_contract_sections','revenue_contract_reviews','revenue_contract_approvals','revenue_contract_signatories',
    'revenue_contract_conditions','revenue_contract_obligations','revenue_contract_milestones','revenue_payment_schedules','revenue_payment_requirements',
    'revenue_payment_promises','revenue_collection_actions','revenue_finance_handoffs','revenue_activation_gates','revenue_operational_handoffs','revenue_contract_risks'
  ] loop
    execute format('drop trigger if exists %I on public.%I','mz7_touch_'||t,t);
    execute format('create trigger %I before update on public.%I for each row execute function public.revenue_mz7_touch_updated_at()','mz7_touch_'||t,t);
  end loop;
end $$;

create or replace function public.revenue_mz7_contract_status_history() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is distinct from new.status then
    insert into public.revenue_contract_status_history(contract_id,from_status,to_status,actor_id,metadata)
    values(new.id,old.status,new.status,new.updated_by,jsonb_build_object('version',new.version,'activation_status',new.activation_status,'payment_gate_status',new.payment_gate_status));
  end if;
  return new;
end$$;
drop trigger if exists revenue_mz7_contract_status_history on public.revenue_contracts;
create trigger revenue_mz7_contract_status_history after update of status on public.revenue_contracts for each row execute function public.revenue_mz7_contract_status_history();

create or replace function public.revenue_create_contract_version(
  p_contract_id uuid,
  p_revision_reason text,
  p_changes text default '',
  p_internal_rationale text default '',
  p_actor_id uuid default null
) returns public.revenue_contract_versions language plpgsql security definer set search_path=public as $$
declare c public.revenue_contracts; v public.revenue_contract_versions; next_version integer;
begin
  select * into c from public.revenue_contracts where id=p_contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;
  select coalesce(max(version_number),0)+1 into next_version from public.revenue_contract_versions where contract_id=c.id;
  insert into public.revenue_contract_versions(
    contract_id,version_number,source_version_id,revision_reason,changes,internal_rationale,contract_snapshot,
    sections_snapshot,obligations_snapshot,milestones_snapshot,payment_snapshot,signatory_snapshot,review_status,approval_status,created_by
  ) values(
    c.id,next_version,c.active_version_id,coalesce(nullif(trim(p_revision_reason),''),'Version contractuelle'),p_changes,p_internal_rationale,to_jsonb(c),
    coalesce((select jsonb_agg(to_jsonb(s) order by s.sort_order) from public.revenue_contract_sections s where s.contract_id=c.id and s.contract_version_id is null),'[]'::jsonb),
    coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at) from public.revenue_contract_obligations o where o.contract_id=c.id),'[]'::jsonb),
    coalesce((select jsonb_agg(to_jsonb(m) order by m.due_at) from public.revenue_contract_milestones m where m.contract_id=c.id),'[]'::jsonb),
    jsonb_build_object('terms',coalesce((select jsonb_agg(to_jsonb(t)) from public.revenue_payment_terms t where t.contract_id=c.id),'[]'::jsonb),'schedules',coalesce((select jsonb_agg(to_jsonb(s)) from public.revenue_payment_schedules s where s.contract_id=c.id),'[]'::jsonb)),
    coalesce((select jsonb_agg(to_jsonb(s) order by s.signing_order) from public.revenue_contract_signatories s where s.contract_id=c.id),'[]'::jsonb),
    c.review_status,c.approval_status,p_actor_id
  ) returning * into v;
  update public.revenue_contracts set active_version_id=v.id,version=version+1,last_activity_at=now(),updated_by=p_actor_id where id=c.id;
  return v;
end$$;

create or replace function public.revenue_create_contract_from_handoff(
  p_contract_handoff_id uuid,
  p_input jsonb default '{}'::jsonb,
  p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare h public.revenue_contract_handoffs; p public.revenue_proposals; existing public.revenue_contracts; c public.revenue_contracts; v public.revenue_contract_versions; task_id uuid;
begin
  select * into h from public.revenue_contract_handoffs where id=p_contract_handoff_id for update;
  if not found then raise exception 'Handoff contractuel introuvable'; end if;
  select * into existing from public.revenue_contracts where contract_handoff_id=h.id;
  if found then return jsonb_build_object('contract_id',existing.id,'contract_reference',existing.reference,'contract_status',existing.status,'idempotent_replay',true); end if;
  select * into p from public.revenue_proposals where id=h.proposal_id for update;
  if not found or p.status<>'contract_ready' then raise exception 'La proposition doit être contract-ready'; end if;
  if p.active_version_id is distinct from h.proposal_version_id then raise exception 'Le handoff ne référence pas la version active acceptée'; end if;
  insert into public.revenue_contracts(
    title,status,contract_type,context_type,prospect_id,account_id,contact_id,opportunity_id,proposal_id,proposal_version_id,
    commercial_outcome_id,contract_handoff_id,partnership_id,owner,currency,contract_value,signed_value,review_status,approval_status,
    signature_status,effectiveness_status,payment_gate_status,activation_status,realization_status,effective_date,expiry_date,next_action,metadata,created_by,updated_by
  ) values(
    coalesce(nullif(trim(p_input->>'title'),''),'Contrat — '||p.title),'draft',coalesce(nullif(p_input->>'contractType',''),case when p.context_type='partnership' then 'partnership_agreement' else 'commercial_contract' end),
    case when p.context_type in ('prospect','partnership') then p.context_type else 'prospect' end,p.prospect_id,p.account_id,p.contact_id,p.opportunity_id,p.id,h.proposal_version_id,h.commercial_outcome_id,h.id,p.partnership_id,
    coalesce(nullif(p_input->>'owner',''),p.owner,'Revenue Manager'),h.currency,h.final_value,h.final_value,'not_requested','not_requested','not_prepared','not_ready',case when h.payment_gate_required then 'requirement_defined' else 'not_required' end,'not_ready','not_eligible',
    nullif(p_input->>'effectiveDate','')::date,nullif(p_input->>'expiryDate','')::date,coalesce(nullif(p_input->>'nextAction',''),'Préparer la version contractuelle 1'),
    jsonb_build_object('source_proposal',p.id,'source_version',h.proposal_version_id,'remaining_conditions',h.remaining_conditions,'final_margin_percent',h.final_margin_percent),p_actor_id,p_actor_id
  ) returning * into c;
  v:=public.revenue_create_contract_version(c.id,'Version initiale depuis proposition acceptée','Transposition du handoff commercial','Version contractuelle initiale',p_actor_id);
  update public.revenue_contract_handoffs set status='consumed' where id=h.id;
  insert into public.revenue_tasks(entity_type,entity_id,prospect_id,title,description,owner,priority,status,expected_outcome,metadata)
  values('contract',c.id::text,c.prospect_id,'Revue contractuelle — '||c.title,'Contrôler clauses, paiement, signatures et conditions d’effectivité.',c.owner,'critical','open','Contrat approuvé et prêt à signer.',jsonb_build_object('contract_id',c.id,'contract_version_id',v.id,'contract_handoff_id',h.id)) returning id into task_id;
  return jsonb_build_object('contract_id',c.id,'contract_reference',c.reference,'contract_version_id',v.id,'task_id',task_id,'contract_status',c.status,'idempotent_replay',false);
end$$;

create or replace function public.revenue_evaluate_contract_effectiveness(
  p_contract_id uuid,
  p_input jsonb default '{}'::jsonb,
  p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.revenue_contracts; pending_approvals integer; pending_signatures integer; pending_conditions integer; blocking_requirements numeric; confirmed_amount numeric; passed boolean;
begin
  select * into c from public.revenue_contracts where id=p_contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;
  select count(*) into pending_approvals from public.revenue_contract_approvals where contract_id=c.id and status='requested';
  select count(*) into pending_signatures from public.revenue_contract_signatories where contract_id=c.id and required and status<>'signed';
  select count(*) into pending_conditions from public.revenue_contract_conditions where contract_id=c.id and required and status not in ('verified','waived','not_applicable');
  select coalesce(sum(amount),0) into blocking_requirements from public.revenue_payment_requirements where contract_id=c.id and activation_blocking and status not in ('waived','cancelled');
  select coalesce(sum(confirmed_amount),0) into confirmed_amount from public.revenue_payment_confirmations where contract_id=c.id and reconciliation_status in ('confirmed','partial');
  passed:=c.approval_status='approved' and pending_approvals=0 and pending_signatures=0 and pending_conditions=0 and confirmed_amount>=blocking_requirements;
  update public.revenue_contracts set effectiveness_status=case when passed then 'effective' else 'conditions_pending' end,status=case when passed then 'effective' else case when status in ('fully_signed','conditions_pending') then 'conditions_pending' else status end end,last_activity_at=now(),updated_by=p_actor_id where id=c.id returning * into c;
  return jsonb_build_object('contract_id',c.id,'effective',passed,'approval_pending',pending_approvals,'signature_pending',pending_signatures,'condition_pending',pending_conditions,'blocking_amount',blocking_requirements,'confirmed_amount',confirmed_amount,'effectiveness_status',c.effectiveness_status);
end$$;

create or replace function public.revenue_evaluate_activation_gates(
  p_contract_id uuid,
  p_input jsonb default '{}'::jsonb,
  p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.revenue_contracts; required_signatures integer; signed_signatures integer; required_conditions integer; verified_conditions integer; blocking_amount numeric; confirmed_amount numeric; finance_ok boolean; critical_risks integer; all_passed boolean; gate jsonb;
begin
  select * into c from public.revenue_contracts where id=p_contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;
  select count(*),count(*) filter(where status='signed') into required_signatures,signed_signatures from public.revenue_contract_signatories where contract_id=c.id and required;
  select count(*),count(*) filter(where status in ('verified','waived','not_applicable')) into required_conditions,verified_conditions from public.revenue_contract_conditions where contract_id=c.id and required;
  select coalesce(sum(amount),0) into blocking_amount from public.revenue_payment_requirements where contract_id=c.id and activation_blocking and status not in ('waived','cancelled');
  select coalesce(sum(confirmed_amount),0) into confirmed_amount from public.revenue_payment_confirmations where contract_id=c.id and reconciliation_status in ('confirmed','partial');
  select exists(select 1 from public.revenue_finance_handoffs where contract_id=c.id and status='accepted') into finance_ok;
  if blocking_amount=0 then finance_ok:=true; end if;
  select count(*) into critical_risks from public.revenue_contract_risks where contract_id=c.id and status in ('open','monitoring') and severity='critical';

  gate:=jsonb_build_object(
    'contract_approval',c.approval_status='approved',
    'required_signatures',required_signatures>0 and required_signatures=signed_signatures,
    'contract_effective',c.effectiveness_status='effective' or c.status='effective',
    'payment_gate',confirmed_amount>=blocking_amount,
    'finance_handoff',finance_ok,
    'critical_risk',critical_risks=0
  );

  insert into public.revenue_activation_gates(contract_id,gate_key,title,mandatory,status,reason,evaluated_by,evaluated_at)
  values
    (c.id,'contract_approval','Approbation contractuelle',true,case when (gate->>'contract_approval')::boolean then 'passed' else 'failed' end,'Le contrat doit être approuvé.',p_actor_id,now()),
    (c.id,'required_signatures','Signatures obligatoires',true,case when (gate->>'required_signatures')::boolean then 'passed' else 'failed' end,'Tous les signataires obligatoires doivent être vérifiés.',p_actor_id,now()),
    (c.id,'contract_effective','Effectivité contractuelle',true,case when (gate->>'contract_effective')::boolean then 'passed' else 'failed' end,'Le contrat doit être effectif.',p_actor_id,now()),
    (c.id,'payment_gate','Gate de paiement',true,case when (gate->>'payment_gate')::boolean then 'passed' else 'failed' end,format('Confirmé %s / requis %s',confirmed_amount,blocking_amount),p_actor_id,now()),
    (c.id,'finance_handoff','Handoff Finance',true,case when (gate->>'finance_handoff')::boolean then 'passed' else 'failed' end,'Le handoff Finance doit être accepté lorsqu’un paiement est requis.',p_actor_id,now()),
    (c.id,'critical_risk','Absence de risque critique',true,case when (gate->>'critical_risk')::boolean then 'passed' else 'failed' end,'Aucun risque critique ne doit rester ouvert.',p_actor_id,now())
  on conflict(contract_id,gate_key) do update set status=excluded.status,reason=excluded.reason,evaluated_by=excluded.evaluated_by,evaluated_at=excluded.evaluated_at,updated_at=now();

  all_passed:=(gate->>'contract_approval')::boolean and (gate->>'required_signatures')::boolean and (gate->>'contract_effective')::boolean and (gate->>'payment_gate')::boolean and (gate->>'finance_handoff')::boolean and (gate->>'critical_risk')::boolean;
  update public.revenue_contracts set activation_status=case when all_passed then 'ready' else 'blocked' end,payment_gate_status=case when confirmed_amount>=blocking_amount then 'payment_confirmed' else payment_gate_status end,status=case when status='effective' then 'activation_pending' else status end,last_activity_at=now(),updated_by=p_actor_id where id=c.id returning * into c;
  return jsonb_build_object('contract_id',c.id,'ready',all_passed,'gates',gate,'activation_status',c.activation_status,'blocking_amount',blocking_amount,'confirmed_amount',confirmed_amount,'critical_risks',critical_risks);
end$$;

create or replace function public.revenue_authorize_contract_activation(
  p_contract_id uuid,
  p_input jsonb default '{}'::jsonb,
  p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.revenue_contracts; failed integer; decision text; d public.revenue_activation_decisions; task_id uuid; override_ok boolean;
begin
  select * into c from public.revenue_contracts where id=p_contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;
  perform public.revenue_evaluate_activation_gates(c.id,p_input,p_actor_id);
  select count(*) into failed from public.revenue_activation_gates where contract_id=c.id and mandatory and status='failed';
  decision:=coalesce(nullif(p_input->>'decision',''),'authorized');
  override_ok:=exists(select 1 from public.revenue_activation_decisions where contract_id=c.id and decision='override_approved' and evidence_reference is not null order by decided_at desc limit 1);
  if decision='authorized' and failed>0 and not override_ok then raise exception 'Des gates obligatoires restent en échec sans dérogation approuvée'; end if;
  if coalesce(nullif(trim(p_input->>'reason'),''),'')='' then raise exception 'La justification de décision est requise'; end if;
  insert into public.revenue_activation_decisions(contract_id,decision,reason,evidence_reference,override,decided_by)
  values(c.id,decision,p_input->>'reason',p_input->>'evidenceReference',false,p_actor_id) returning * into d;
  update public.revenue_contracts set activation_status=case when decision='authorized' then 'authorized' else 'blocked' end,status=case when decision='authorized' then 'activation_pending' else status end,last_activity_at=now(),updated_by=p_actor_id where id=c.id returning * into c;
  if decision='authorized' then
    insert into public.revenue_tasks(entity_type,entity_id,prospect_id,title,description,owner,priority,status,expected_outcome,metadata)
    values('contract',c.id::text,c.prospect_id,'Créer le handoff opérationnel — '||c.title,'Transmettre portée, contacts, obligations, démarrage et risques au module receveur.',c.owner,'critical','open','Handoff accepté et activation exécutée.',jsonb_build_object('contract_id',c.id,'activation_decision_id',d.id)) returning id into task_id;
  end if;
  return jsonb_build_object('contract_id',c.id,'decision_id',d.id,'decision',decision,'activation_status',c.activation_status,'failed_gates',failed,'override_used',override_ok,'task_id',task_id);
end$$;

create or replace function public.revenue_confirm_revenue_realization(
  p_contract_id uuid,
  p_input jsonb,
  p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.revenue_contracts; e public.revenue_realization_events; existing public.revenue_realization_events; amount numeric; total numeric; finance_ref text; evidence_ref text;
begin
  select * into c from public.revenue_contracts where id=p_contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;
  if c.effectiveness_status<>'effective' and c.status not in ('effective','activation_pending','active') then raise exception 'Le contrat doit être effectif'; end if;
  if c.activation_status not in ('authorized','activated') then raise exception 'L’activation doit être autorisée ou exécutée'; end if;
  amount:=greatest(0,coalesce(nullif(p_input->>'amount','')::numeric,0));
  finance_ref:=nullif(trim(p_input->>'financeReference'),'');
  evidence_ref:=nullif(trim(p_input->>'evidenceReference'),'');
  if amount<=0 or finance_ref is null or evidence_ref is null then raise exception 'Montant, référence Finance et preuve autoritative sont requis'; end if;
  select * into existing from public.revenue_realization_events where contract_id=c.id and finance_reference=finance_ref and status in ('realized','partially_realized') order by created_at desc limit 1;
  if found then return jsonb_build_object('contract_id',c.id,'realization_id',existing.id,'amount',existing.amount,'idempotent_replay',true); end if;
  if not exists(select 1 from public.revenue_payment_confirmations where contract_id=c.id and finance_reference=finance_ref and reconciliation_status in ('confirmed','partial')) then raise exception 'La référence Finance ne correspond à aucune confirmation de paiement autoritative'; end if;
  select coalesce(sum(amount),0) into total from public.revenue_realization_events where contract_id=c.id and status in ('realized','partially_realized');
  if total+amount>c.contract_value then raise exception 'La réalisation cumulée dépasserait la valeur contractuelle'; end if;
  insert into public.revenue_realization_events(contract_id,payment_confirmation_id,amount,currency,status,finance_reference,evidence_reference,realization_rule,realized_at,realized_by)
  values(c.id,(select id from public.revenue_payment_confirmations where contract_id=c.id and finance_reference=finance_ref order by created_at desc limit 1),amount,c.currency,case when total+amount>=c.contract_value then 'realized' else 'partially_realized' end,finance_ref,evidence_ref,coalesce(nullif(p_input->>'rule',''),'Paiement confirmé et activation autorisée'),coalesce(nullif(p_input->>'realizedAt','')::timestamptz,now()),p_actor_id) returning * into e;
  update public.revenue_contracts set realized_value=total+amount,realization_status=case when total+amount>=contract_value then 'realized' else 'partially_realized' end,last_activity_at=now(),updated_by=p_actor_id where id=c.id returning * into c;
  return jsonb_build_object('contract_id',c.id,'realization_id',e.id,'amount',e.amount,'cumulative_realized',c.realized_value,'realization_status',c.realization_status,'idempotent_replay',false);
end$$;

create unique index if not exists revenue_realization_events_one_reversal_per_event_idx
  on public.revenue_realization_events(reversal_of_id)
  where reversal_of_id is not null;

create or replace function public.revenue_reverse_revenue_realization(
  p_contract_id uuid,
  p_realization_id uuid,
  p_input jsonb,
  p_actor_id uuid default null
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  c public.revenue_contracts;
  original public.revenue_realization_events;
  reversal public.revenue_realization_events;
  reversal_amount numeric;
  new_total numeric;
  finance_ref text;
  evidence_ref text;
begin
  select * into c from public.revenue_contracts where id=p_contract_id for update;
  if not found then raise exception 'Contrat introuvable'; end if;

  select * into original
  from public.revenue_realization_events
  where id=p_realization_id and contract_id=c.id and status in ('realized','partially_realized')
  for update;
  if not found then raise exception 'Événement de réalisation autoritatif introuvable'; end if;

  select * into reversal
  from public.revenue_realization_events
  where reversal_of_id=original.id
  order by created_at desc
  limit 1;
  if found then
    return jsonb_build_object(
      'contract_id',c.id,
      'realization_id',reversal.id,
      'reversal_of_id',original.id,
      'amount',reversal.amount,
      'cumulative_realized',c.realized_value,
      'idempotent_replay',true
    );
  end if;

  finance_ref:=nullif(trim(p_input->>'financeReference'),'');
  evidence_ref:=nullif(trim(p_input->>'evidenceReference'),'');
  if finance_ref is null or evidence_ref is null then
    raise exception 'Référence Finance et preuve de contrepassation sont requises';
  end if;

  reversal_amount:=abs(original.amount);
  new_total:=greatest(0,c.realized_value-reversal_amount);

  insert into public.revenue_realization_events(
    contract_id,payment_confirmation_id,reversal_of_id,amount,currency,status,
    finance_reference,evidence_reference,realization_rule,realized_at,realized_by
  ) values(
    c.id,original.payment_confirmation_id,original.id,-reversal_amount,c.currency,'reversed',
    finance_ref,evidence_ref,
    coalesce(nullif(p_input->>'reason',''),'Contrepassation autorisée de réalisation'),
    coalesce(nullif(p_input->>'reversedAt','')::timestamptz,now()),p_actor_id
  ) returning * into reversal;

  update public.revenue_contracts
  set realized_value=new_total,
      realization_status=case when new_total=0 then 'eligible' when new_total>=contract_value then 'realized' else 'partially_realized' end,
      last_activity_at=now(),
      updated_by=p_actor_id
  where id=c.id
  returning * into c;

  return jsonb_build_object(
    'contract_id',c.id,
    'realization_id',reversal.id,
    'reversal_of_id',original.id,
    'amount',reversal.amount,
    'cumulative_realized',c.realized_value,
    'realization_status',c.realization_status,
    'idempotent_replay',false
  );
end$$;

-- Build the contract command view against the reconciled live account display-name contract.
-- Phase 2 production uses revenue_accounts.account_name; compatible deployments may expose
-- name or legal_name instead. Dynamic construction prevents a failed transactional cutover.
do $$
declare
  account_label_expression text;
begin
  if exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_accounts' and column_name='account_name'
  ) then
    account_label_expression := 'a.account_name';
  elsif exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_accounts' and column_name='name'
  ) then
    account_label_expression := 'a.name';
  elsif exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_accounts' and column_name='legal_name'
  ) then
    account_label_expression := 'a.legal_name';
  else
    raise exception 'BLOCKED: public.revenue_accounts requires account_name, name, or legal_name for the contract command view.';
  end if;

  execute format($view$
    create or replace view public.revenue_contract_command_view as
    select
      c.*,
      coalesce(%1$s,nullif(c.partnership_id,''),c.title) as entity_name,
      %1$s as account_name,
      o.title as opportunity_title,
      pr.reference as proposal_reference,
      pv.version_number as proposal_version_number,
      (select count(*) from public.revenue_contract_signatories s where s.contract_id=c.id and s.required) as required_signatories,
      (select count(*) from public.revenue_contract_signatories s where s.contract_id=c.id and s.required and s.status='signed') as signed_signatories,
      (select coalesce(sum(pc.confirmed_amount),0) from public.revenue_payment_confirmations pc where pc.contract_id=c.id and pc.reconciliation_status in ('confirmed','partial')) as payment_confirmed_value,
      (select count(*) from public.revenue_contract_obligations ob where ob.contract_id=c.id and ob.status not in ('completed','waived','cancelled') and ob.due_at<now()) as overdue_obligation_count,
      (select count(*) from public.revenue_contract_risks r where r.contract_id=c.id and r.status in ('open','monitoring')) as open_risk_count
    from public.revenue_contracts c
    left join public.revenue_accounts a on a.id=c.account_id
    left join public.revenue_opportunities o on o.id=c.opportunity_id
    left join public.revenue_proposals pr on pr.id=c.proposal_id
    left join public.revenue_proposal_versions pv on pv.id=c.proposal_version_id
  $view$, account_label_expression);
end $$;

create or replace view public.revenue_activation_command_view as
select c.id,c.reference,c.title,c.entity_name,c.contract_value,c.currency,c.status,c.signature_status,c.effectiveness_status,c.payment_gate_status,c.activation_status,c.realization_status,
       count(g.id) as gate_count,count(g.id) filter(where g.status='passed') as passed_gate_count,count(g.id) filter(where g.status='failed') as failed_gate_count
from public.revenue_contract_command_view c
left join public.revenue_activation_gates g on g.contract_id=c.id
group by c.id,c.reference,c.title,c.entity_name,c.contract_value,c.currency,c.status,c.signature_status,c.effectiveness_status,c.payment_gate_status,c.activation_status,c.realization_status;

create or replace view public.revenue_realization_command_view as
select c.id,c.reference,c.title,c.entity_name,c.contract_value,c.realized_value,c.currency,c.activation_status,c.realization_status,
       coalesce(sum(pc.confirmed_amount),0) as payment_confirmed_value,
       greatest(0,c.contract_value-c.realized_value) as remaining_realizable_value
from public.revenue_contract_command_view c
left join public.revenue_payment_confirmations pc on pc.contract_id=c.id and pc.reconciliation_status in ('confirmed','partial')
group by c.id,c.reference,c.title,c.entity_name,c.contract_value,c.realized_value,c.currency,c.activation_status,c.realization_status;

-- RLS: browser roles receive read-only visibility; all mutations pass through protected server APIs.
do $$ declare t text; begin
  foreach t in array array[
    'revenue_contracts','revenue_contract_versions','revenue_contract_sections','revenue_contract_reviews','revenue_contract_approvals',
    'revenue_contract_signatories','revenue_signature_events','revenue_signature_evidence','revenue_contract_conditions','revenue_condition_evidence',
    'revenue_contract_obligations','revenue_obligation_events','revenue_contract_milestones','revenue_payment_terms','revenue_payment_schedules',
    'revenue_payment_requirements','revenue_payment_promises','revenue_payment_promise_events','revenue_collection_actions','revenue_finance_handoffs',
    'revenue_payment_confirmations','revenue_activation_gates','revenue_activation_decisions','revenue_operational_handoffs','revenue_realization_events',
    'revenue_contract_risks','revenue_contract_status_history','revenue_contract_closures'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I','mz7_authenticated_read_'||t,t);
    execute format('create policy %I on public.%I for select to authenticated using (true)','mz7_authenticated_read_'||t,t);
    execute format('revoke insert,update,delete on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;

grant select on public.revenue_contract_command_view,public.revenue_activation_command_view,public.revenue_realization_command_view to authenticated;
revoke all on function public.revenue_create_contract_from_handoff(uuid,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.revenue_create_contract_version(uuid,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.revenue_evaluate_contract_effectiveness(uuid,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.revenue_evaluate_activation_gates(uuid,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.revenue_authorize_contract_activation(uuid,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.revenue_confirm_revenue_realization(uuid,jsonb,uuid) from public,anon,authenticated;
revoke all on function public.revenue_reverse_revenue_realization(uuid,uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.revenue_create_contract_from_handoff(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_create_contract_version(uuid,text,text,text,uuid) to service_role;
grant execute on function public.revenue_evaluate_contract_effectiveness(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_evaluate_activation_gates(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_authorize_contract_activation(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_confirm_revenue_realization(uuid,jsonb,uuid) to service_role;
grant execute on function public.revenue_reverse_revenue_realization(uuid,uuid,jsonb,uuid) to service_role;

commit;
