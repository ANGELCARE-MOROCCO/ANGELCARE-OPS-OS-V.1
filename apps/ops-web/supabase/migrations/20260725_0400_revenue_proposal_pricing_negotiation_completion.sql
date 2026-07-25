-- ANGELCARE Revenue Command Center — Mega ZIP 6
-- Proposal Studio, Pricing, Margin Protection & Negotiation Command
-- Additive, transactional and compatible with the accepted TEXT prospect identity contract.
begin;

create extension if not exists pgcrypto;

do $$
declare expected_count integer := 23; present_count integer;
begin
  if to_regclass('public.revenue_prospects') is null or to_regclass('public.revenue_accounts') is null or
     to_regclass('public.revenue_contacts') is null or to_regclass('public.revenue_opportunities') is null or
     to_regclass('public.revenue_tasks') is null or to_regclass('public.revenue_appointments') is null or
     to_regclass('public.revenue_meeting_outcomes') is null or to_regclass('public.revenue_communication_events') is null then
    raise exception 'Mega ZIP 6 foundation is incomplete. Apply verified Phase 2, 4 and 5 migrations first.';
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_prospects' and column_name='id' and udt_name='text') then
    raise exception 'Mega ZIP 6 expects public.revenue_prospects.id TEXT. Do not convert legacy prospect identifiers.';
  end if;
  if to_regclass('public.revenue_proposals') is not null then
    if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_proposals' and column_name='id' and udt_name='uuid') then
      raise exception 'Existing public.revenue_proposals has an incompatible id contract. Stop and reconcile.';
    end if;
  end if;
  select count(*) into present_count from unnest(array[
      'revenue_proposals','revenue_proposal_versions','revenue_proposal_sections','revenue_proposal_line_items',
      'revenue_pricing_scenarios','revenue_proposal_approval_requests','revenue_discount_requests','revenue_margin_exceptions',
      'revenue_proposal_documents','revenue_proposal_recipients','revenue_proposal_transmissions','revenue_proposal_delivery_events',
      'revenue_proposal_responses','revenue_negotiations','revenue_negotiation_rounds','revenue_negotiation_positions',
      'revenue_proposal_objections','revenue_counteroffers','revenue_concession_requests','revenue_negotiation_decisions',
      'revenue_proposal_status_history','revenue_commercial_outcomes','revenue_contract_handoffs'
    ]) name where to_regclass('public.'||name) is not null;
  if present_count not in (0,expected_count) then
    raise exception 'Partial Mega ZIP 6 schema detected (% of % objects). Stop and reconcile before applying.',present_count,expected_count;
  end if;
end $$;

create sequence if not exists public.revenue_proposal_reference_seq start 1001;

create table if not exists public.revenue_proposals (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('AC-PROP-'||to_char(current_date,'YYYY')||'-'||lpad(nextval('public.revenue_proposal_reference_seq')::text,6,'0')),
  title text not null,
  status text not null default 'draft' check(status in ('draft','internal_preparation','pricing_review','approval_required','approved','ready_to_send','sent','customer_review','revision_requested','negotiation','accepted','rejected','expired','withdrawn','superseded','contract_ready','archived')),
  proposal_type text not null default 'b2b', context_type text not null default 'prospect' check(context_type in ('prospect','partnership','b2c')),
  prospect_id text references public.revenue_prospects(id) on update cascade on delete set null,
  account_id uuid references public.revenue_accounts(id) on delete set null,
  contact_id uuid references public.revenue_contacts(id) on delete set null,
  opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  meeting_outcome_id uuid references public.revenue_meeting_outcomes(id) on delete set null,
  partnership_id text, b2c_case_id text,
  owner text not null default 'BD Officer', currency text not null default 'MAD',
  gross_value numeric(18,2) not null default 0, discount_value numeric(18,2) not null default 0, discount_percent numeric(9,4) not null default 0,
  net_value numeric(18,2) not null default 0, estimated_cost numeric(18,2) not null default 0, gross_margin numeric(18,2) not null default 0,
  margin_percent numeric(9,4) not null default 0, minimum_margin_percent numeric(9,4) not null default 25,
  approval_status text not null default 'not_requested', recipient_status text not null default 'not_prepared', negotiation_status text not null default 'not_started',
  commercial_objective text, client_need text, next_action text, validity_until date, accepted_at timestamptz, rejected_at timestamptz,
  active_version_id uuid, active_pricing_scenario_id uuid, last_activity_at timestamptz not null default now(), archived_at timestamptz,
  version integer not null default 1, metadata jsonb not null default '{}'::jsonb,
  created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(gross_value>=0 and discount_value>=0 and net_value>=0 and estimated_cost>=0),
  check(discount_value<=gross_value), check(margin_percent between -10000 and 10000)
);

create table if not exists public.revenue_proposal_versions (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  version_number integer not null, source_version_id uuid references public.revenue_proposal_versions(id) on delete set null,
  revision_reason text not null, customer_changes text, internal_rationale text,
  proposal_snapshot jsonb not null, sections_snapshot jsonb not null default '[]'::jsonb, line_items_snapshot jsonb not null default '[]'::jsonb,
  pricing_snapshot jsonb not null default '{}'::jsonb, terms_snapshot jsonb not null default '{}'::jsonb,
  approval_status text not null default 'not_requested', document_status text not null default 'not_generated', immutable_at timestamptz not null default now(),
  created_by uuid, created_at timestamptz not null default now(), unique(proposal_id,version_number)
);

alter table public.revenue_proposals drop constraint if exists revenue_proposals_active_version_id_fkey;
alter table public.revenue_proposals add constraint revenue_proposals_active_version_id_fkey foreign key(active_version_id) references public.revenue_proposal_versions(id) on delete set null;

create table if not exists public.revenue_proposal_sections (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete cascade,
  section_key text not null, title text not null, customer_content text, internal_content text, customer_visible boolean not null default true,
  sort_order integer not null default 0, metadata jsonb not null default '{}'::jsonb, created_by uuid, updated_by uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.revenue_proposal_line_items (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete cascade,
  service_code text, label text not null, description text, quantity numeric(14,4) not null default 1, unit_price numeric(18,2) not null default 0,
  gross_value numeric(18,2) not null default 0, discount_value numeric(18,2) not null default 0, net_value numeric(18,2) not null default 0,
  estimated_cost numeric(18,2) not null default 0, gross_margin numeric(18,2) not null default 0,
  optional boolean not null default false, internal_only boolean not null default false, sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb, created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(quantity>=0 and unit_price>=0 and gross_value>=0 and discount_value>=0 and net_value>=0 and estimated_cost>=0), check(discount_value<=gross_value)
);

create table if not exists public.revenue_pricing_scenarios (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  name text not null, model text not null default 'standard', currency text not null default 'MAD',
  gross_value numeric(18,2) not null default 0, discount_value numeric(18,2) not null default 0, discount_percent numeric(9,4) not null default 0,
  net_value numeric(18,2) not null default 0, estimated_cost numeric(18,2) not null default 0, gross_margin numeric(18,2) not null default 0,
  margin_percent numeric(9,4) not null default 0, minimum_margin_percent numeric(9,4) not null default 25,
  approval_required boolean not null default false, is_active boolean not null default false, assumptions text, metadata jsonb not null default '{}'::jsonb,
  created_by uuid, created_at timestamptz not null default now()
);
alter table public.revenue_proposals drop constraint if exists revenue_proposals_active_pricing_scenario_id_fkey;
alter table public.revenue_proposals add constraint revenue_proposals_active_pricing_scenario_id_fkey foreign key(active_pricing_scenario_id) references public.revenue_pricing_scenarios(id) on delete set null;

create table if not exists public.revenue_proposal_approval_requests (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete set null,
  request_type text not null, status text not null default 'requested' check(status in ('requested','approved','rejected','correction_required','cancelled')),
  reason text not null, financial_impact jsonb not null default '{}'::jsonb, evidence jsonb not null default '{}'::jsonb,
  requested_by uuid, decided_by uuid, decided_at timestamptz, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.revenue_discount_requests (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  requested_value numeric(18,2) not null default 0, requested_percent numeric(9,4) not null default 0, reason text not null, evidence text,
  status text not null default 'requested', requested_by uuid, decided_by uuid, decision_reason text, decided_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.revenue_margin_exceptions (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposed_margin_percent numeric(9,4) not null, minimum_margin_percent numeric(9,4) not null, reason text not null, mitigation text,
  status text not null default 'requested', requested_by uuid, decided_by uuid, decision_reason text, decided_at timestamptz, created_at timestamptz not null default now()
);

create table if not exists public.revenue_proposal_documents (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid not null references public.revenue_proposal_versions(id) on delete cascade,
  document_type text not null, status text not null default 'generated', storage_path text, content_snapshot jsonb not null default '{}'::jsonb,
  generated_by uuid, generated_at timestamptz not null default now(), invalidated_at timestamptz
);
create table if not exists public.revenue_proposal_recipients (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete set null, contact_id uuid references public.revenue_contacts(id) on delete set null,
  name text, address text not null, channel text not null, role text, created_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.revenue_proposal_transmissions (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid not null references public.revenue_proposal_versions(id) on delete restrict, recipient_id uuid not null references public.revenue_proposal_recipients(id) on delete restrict,
  channel text not null, subject text, message text, status text not null default 'prepared', provider_reference text, sent_at timestamptz,
  idempotency_key text not null unique, failure_reason text, created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.revenue_proposal_delivery_events (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  transmission_id uuid not null references public.revenue_proposal_transmissions(id) on delete cascade,
  event_type text not null, provider_reference text, occurred_at timestamptz not null, evidence jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.revenue_proposal_responses (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete set null, recipient_id uuid references public.revenue_proposal_recipients(id) on delete set null,
  response_type text not null, summary text not null, received_at timestamptz not null, next_action text, evidence text, recorded_by uuid, created_at timestamptz not null default now()
);

create table if not exists public.revenue_negotiations (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete set null, title text not null,
  status text not null default 'open', current_round integer not null default 1, angelcare_position_value numeric(18,2) not null default 0,
  customer_position_value numeric(18,2) not null default 0, current_margin_percent numeric(9,4) not null default 0,
  opening_position text, decision_deadline date, owner text not null default 'BD Officer', version integer not null default 1,
  created_by uuid, updated_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), closed_at timestamptz
);
create table if not exists public.revenue_negotiation_rounds (
  id uuid primary key default gen_random_uuid(), negotiation_id uuid not null references public.revenue_negotiations(id) on delete cascade,
  round_number integer not null, status text not null default 'open', summary text, opened_by uuid, closed_by uuid,
  opened_at timestamptz not null default now(), closed_at timestamptz, created_at timestamptz not null default now(), unique(negotiation_id,round_number)
);
create table if not exists public.revenue_negotiation_positions (
  id uuid primary key default gen_random_uuid(), negotiation_id uuid not null references public.revenue_negotiations(id) on delete cascade,
  round_id uuid references public.revenue_negotiation_rounds(id) on delete set null, party text not null check(party in ('angelcare','customer')),
  position_value numeric(18,2) not null default 0, position_text text, terms jsonb not null default '{}'::jsonb, recorded_by uuid, recorded_at timestamptz not null default now()
);
create table if not exists public.revenue_proposal_objections (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  negotiation_id uuid references public.revenue_negotiations(id) on delete cascade, category text not null, wording text not null,
  source_contact_name text, source_contact_id uuid references public.revenue_contacts(id) on delete set null, severity text not null default 'medium',
  response_strategy text, resolution_status text not null default 'open', resolution text, resolved_by uuid, resolved_at timestamptz,
  created_by uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.revenue_counteroffers (
  id uuid primary key default gen_random_uuid(), negotiation_id uuid not null references public.revenue_negotiations(id) on delete cascade,
  proposal_id uuid not null references public.revenue_proposals(id) on delete cascade, proposed_value numeric(18,2) not null default 0,
  requested_discount_percent numeric(9,4) not null default 0, requested_change text, response_deadline date, source_evidence text,
  status text not null default 'received', received_by uuid, received_at timestamptz not null default now(), responded_at timestamptz
);
create table if not exists public.revenue_concession_requests (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  negotiation_id uuid not null references public.revenue_negotiations(id) on delete cascade, round_id uuid references public.revenue_negotiation_rounds(id) on delete set null,
  concession_type text not null, reason text not null, financial_value numeric(18,2) not null default 0, internal_cost numeric(18,2) not null default 0,
  margin_impact_value numeric(18,2) not null default 0, expires_at date, status text not null default 'requested', requested_by uuid,
  decided_by uuid, decision_reason text, decided_at timestamptz, used_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.revenue_negotiation_decisions (
  id uuid primary key default gen_random_uuid(), negotiation_id uuid not null references public.revenue_negotiations(id) on delete cascade,
  proposal_id uuid not null references public.revenue_proposals(id) on delete cascade, round_id uuid references public.revenue_negotiation_rounds(id) on delete set null,
  decision_type text not null, rationale text not null, angelcare_position_value numeric(18,2) not null default 0,
  financial_impact jsonb not null default '{}'::jsonb, decided_by uuid, created_at timestamptz not null default now()
);
create table if not exists public.revenue_proposal_status_history (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  from_status text, to_status text not null, reason text, actor_id uuid, source text not null default 'api', correlation_id uuid not null default gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.revenue_commercial_outcomes (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete cascade,
  proposal_version_id uuid references public.revenue_proposal_versions(id) on delete restrict, negotiation_id uuid references public.revenue_negotiations(id) on delete set null,
  outcome text not null, final_value numeric(18,2) not null default 0, final_discount_value numeric(18,2) not null default 0,
  final_margin_percent numeric(9,4) not null default 0, accepted_terms text, remaining_conditions text, decision_reason text not null, evidence jsonb not null default '{}'::jsonb,
  decision_maker_contact_id uuid references public.revenue_contacts(id) on delete set null, decided_by uuid, decided_at timestamptz not null default now()
);
create table if not exists public.revenue_contract_handoffs (
  id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.revenue_proposals(id) on delete restrict,
  proposal_version_id uuid not null references public.revenue_proposal_versions(id) on delete restrict, commercial_outcome_id uuid not null references public.revenue_commercial_outcomes(id) on delete restrict,
  account_id uuid references public.revenue_accounts(id) on delete set null, opportunity_id uuid references public.revenue_opportunities(id) on delete set null,
  prospect_id text references public.revenue_prospects(id) on update cascade on delete set null,
  final_value numeric(18,2) not null, currency text not null default 'MAD', final_margin_percent numeric(9,4) not null,
  status text not null default 'ready', remaining_conditions text, payment_gate_required boolean not null default true,
  created_by uuid, created_at timestamptz not null default now(), unique(proposal_id,proposal_version_id)
);

create index if not exists revenue_proposals_context_idx on public.revenue_proposals(context_type,prospect_id,partnership_id,b2c_case_id);
create index if not exists revenue_proposals_status_idx on public.revenue_proposals(status,updated_at desc);
create index if not exists revenue_proposals_opportunity_idx on public.revenue_proposals(opportunity_id);
create index if not exists revenue_proposals_validity_idx on public.revenue_proposals(validity_until) where status not in ('accepted','rejected','expired','archived');
create index if not exists revenue_proposal_versions_proposal_idx on public.revenue_proposal_versions(proposal_id,version_number desc);
create index if not exists revenue_proposal_lines_proposal_idx on public.revenue_proposal_line_items(proposal_id,sort_order);
create index if not exists revenue_negotiations_proposal_idx on public.revenue_negotiations(proposal_id,status,updated_at desc);
create index if not exists revenue_objections_open_idx on public.revenue_proposal_objections(negotiation_id,resolution_status);
create index if not exists revenue_concessions_pending_idx on public.revenue_concession_requests(negotiation_id,status);
create index if not exists revenue_transmissions_proposal_idx on public.revenue_proposal_transmissions(proposal_id,created_at desc);

create or replace function public.revenue_mz6_touch_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now();return new;end$$;
do $$ declare t text; begin foreach t in array array['revenue_proposals','revenue_proposal_sections','revenue_proposal_line_items','revenue_proposal_approval_requests','revenue_proposal_transmissions','revenue_negotiations','revenue_proposal_objections'] loop execute format('drop trigger if exists %I on public.%I','mz6_touch_'||t,t);execute format('create trigger %I before update on public.%I for each row execute function public.revenue_mz6_touch_updated_at()','mz6_touch_'||t,t);end loop;end$$;

create or replace function public.revenue_recalculate_proposal(p_proposal_id uuid) returns public.revenue_proposals language plpgsql security definer set search_path=public as $$
declare v public.revenue_proposals; g numeric:=0; d numeric:=0; n numeric:=0; c numeric:=0; m numeric:=0; mp numeric:=0;
begin
  select coalesce(sum(gross_value),0),coalesce(sum(discount_value),0),coalesce(sum(net_value),0),coalesce(sum(estimated_cost),0) into g,d,n,c from public.revenue_proposal_line_items where proposal_id=p_proposal_id and proposal_version_id is null;
  m:=n-c; mp:=case when n>0 then (m/n)*100 else 0 end;
  update public.revenue_proposals set gross_value=g,discount_value=d,discount_percent=case when g>0 then (d/g)*100 else 0 end,net_value=n,estimated_cost=c,gross_margin=m,margin_percent=mp,last_activity_at=now(),version=version+1 where id=p_proposal_id returning * into v;
  return v;
end$$;

create or replace function public.revenue_mz6_recalculate_line_trigger() returns trigger language plpgsql security definer set search_path=public as $$begin if tg_op='DELETE' then perform public.revenue_recalculate_proposal(old.proposal_id);return old;else perform public.revenue_recalculate_proposal(new.proposal_id);return new;end if;end$$;
drop trigger if exists revenue_mz6_line_recalculate on public.revenue_proposal_line_items;
create trigger revenue_mz6_line_recalculate after insert or update or delete on public.revenue_proposal_line_items for each row execute function public.revenue_mz6_recalculate_line_trigger();

create or replace function public.revenue_mz6_status_history() returns trigger language plpgsql security definer set search_path=public as $$begin if old.status is distinct from new.status then insert into public.revenue_proposal_status_history(proposal_id,from_status,to_status,actor_id,metadata) values(new.id,old.status,new.status,new.updated_by,jsonb_build_object('version',new.version));end if;return new;end$$;
drop trigger if exists revenue_mz6_proposal_status_history on public.revenue_proposals;
create trigger revenue_mz6_proposal_status_history after update of status on public.revenue_proposals for each row execute function public.revenue_mz6_status_history();

create or replace function public.revenue_create_proposal_version(p_proposal_id uuid,p_revision_reason text,p_customer_changes text default '',p_internal_rationale text default '',p_actor_id uuid default null)
returns public.revenue_proposal_versions language plpgsql security definer set search_path=public as $$
declare p public.revenue_proposals; v public.revenue_proposal_versions; next_version integer;
begin
  select * into p from public.revenue_proposals where id=p_proposal_id for update;if not found then raise exception 'Proposition introuvable';end if;
  select coalesce(max(version_number),0)+1 into next_version from public.revenue_proposal_versions where proposal_id=p_proposal_id;
  insert into public.revenue_proposal_versions(proposal_id,version_number,source_version_id,revision_reason,customer_changes,internal_rationale,proposal_snapshot,sections_snapshot,line_items_snapshot,pricing_snapshot,terms_snapshot,approval_status,created_by)
  values(p.id,next_version,p.active_version_id,coalesce(nullif(trim(p_revision_reason),''),'Version commerciale'),p_customer_changes,p_internal_rationale,to_jsonb(p),
    coalesce((select jsonb_agg(to_jsonb(s) order by s.sort_order) from public.revenue_proposal_sections s where s.proposal_id=p.id and s.proposal_version_id is null),'[]'::jsonb),
    coalesce((select jsonb_agg(to_jsonb(l) order by l.sort_order) from public.revenue_proposal_line_items l where l.proposal_id=p.id and l.proposal_version_id is null),'[]'::jsonb),
    jsonb_build_object('gross_value',p.gross_value,'discount_value',p.discount_value,'net_value',p.net_value,'estimated_cost',p.estimated_cost,'gross_margin',p.gross_margin,'margin_percent',p.margin_percent,'minimum_margin_percent',p.minimum_margin_percent,'currency',p.currency),
    jsonb_build_object('validity_until',p.validity_until,'commercial_objective',p.commercial_objective,'client_need',p.client_need),p.approval_status,p_actor_id) returning * into v;
  update public.revenue_proposals set active_version_id=v.id,version=version+1,last_activity_at=now(),updated_by=p_actor_id where id=p.id;
  return v;
end$$;

create or replace function public.revenue_apply_commercial_outcome(p_proposal_id uuid,p_input jsonb,p_actor_id uuid default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  p public.revenue_proposals;
  n public.revenue_negotiations;
  o public.revenue_commercial_outcomes;
  h public.revenue_contract_handoffs;
  task_id uuid;
  outcome_code text;
  final_value numeric;
  final_discount numeric;
  final_margin numeric;
  accepted boolean;
  decision_reason text;
  acceptance_evidence jsonb;
  acceptance_reference text;
begin
  select * into p from public.revenue_proposals where id=p_proposal_id for update;
  if not found then raise exception 'Proposition introuvable'; end if;
  if p.active_version_id is null then raise exception 'Une version immuable active est requise'; end if;

  select * into h from public.revenue_contract_handoffs
  where proposal_id=p.id and proposal_version_id=p.active_version_id
  order by created_at desc limit 1;
  if found then
    select * into o from public.revenue_commercial_outcomes where id=h.commercial_outcome_id;
    return jsonb_build_object('proposal_id',p.id,'proposal_status',p.status,'commercial_outcome_id',o.id,'contract_handoff_id',h.id,'task_id',null,'accepted',true,'final_value',h.final_value,'final_margin_percent',h.final_margin_percent,'idempotent_replay',true);
  end if;

  outcome_code:=coalesce(nullif(p_input->>'outcome',''),'rejected');
  final_value:=greatest(0,coalesce(nullif(p_input->>'finalValue','')::numeric,p.net_value));
  final_discount:=greatest(0,coalesce(nullif(p_input->>'finalDiscountValue','')::numeric,p.discount_value));
  final_margin:=coalesce(nullif(p_input->>'finalMarginPercent','')::numeric,p.margin_percent);
  decision_reason:=coalesce(nullif(trim(p_input->>'decisionReason'),''),nullif(trim(p_input->>'acceptedTerms'),''));
  acceptance_evidence:=coalesce(p_input->'evidence','{}'::jsonb);
  acceptance_reference:=coalesce(nullif(trim(p_input->>'acceptanceEvidence'),''),nullif(trim(acceptance_evidence->>'reference'),''));
  accepted:=outcome_code in ('accepted_as_proposed','accepted_after_negotiation','conditionally_accepted');

  if decision_reason is null then raise exception 'Le motif de décision commerciale est requis'; end if;
  if final_discount>p.gross_value then raise exception 'La remise finale ne peut pas dépasser la valeur brute'; end if;
  if accepted then
    if p.approval_status<>'approved' then raise exception 'La proposition doit être approuvée avant acceptation finale'; end if;
    if final_value<=0 then raise exception 'La valeur finale acceptée doit être strictement positive'; end if;
    if coalesce(nullif(trim(p_input->>'acceptedTerms'),''),'')='' then raise exception 'Les conditions commerciales acceptées sont requises'; end if;
    if acceptance_reference is null then raise exception 'Une preuve ou référence d’acceptation est requise'; end if;
    if exists(select 1 from public.revenue_proposal_approval_requests ar where ar.proposal_id=p.id and ar.status='requested') then
      raise exception 'Une approbation interne reste en attente';
    end if;
    if final_margin<p.minimum_margin_percent and not exists(
      select 1 from public.revenue_margin_exceptions me where me.proposal_id=p.id and me.status='approved'
    ) then raise exception 'La marge finale est sous le seuil sans exception approuvée'; end if;
    if exists(select 1 from public.revenue_concession_requests cr where cr.proposal_id=p.id and cr.status in ('requested','pending')) then
      raise exception 'Une concession reste en attente de décision';
    end if;
  end if;

  select * into n from public.revenue_negotiations where proposal_id=p.id order by created_at desc limit 1;
  insert into public.revenue_commercial_outcomes(
    proposal_id,proposal_version_id,negotiation_id,outcome,final_value,final_discount_value,final_margin_percent,
    accepted_terms,remaining_conditions,decision_reason,evidence,decided_by
  ) values(
    p.id,p.active_version_id,n.id,outcome_code,final_value,final_discount,final_margin,
    p_input->>'acceptedTerms',p_input->>'remainingConditions',decision_reason,acceptance_evidence,p_actor_id
  ) returning * into o;

  if accepted then
    update public.revenue_proposals set
      status='contract_ready',recipient_status='accepted',
      negotiation_status=case when n.id is null then negotiation_status else 'agreement_reached' end,
      net_value=final_value,discount_value=final_discount,gross_margin=final_value-estimated_cost,margin_percent=final_margin,
      accepted_at=now(),last_activity_at=now(),version=version+1,updated_by=p_actor_id
    where id=p.id returning * into p;
    if n.id is not null then
      update public.revenue_negotiations set status='agreement_reached',closed_at=now(),updated_by=p_actor_id,version=version+1 where id=n.id;
    end if;
    insert into public.revenue_contract_handoffs(
      proposal_id,proposal_version_id,commercial_outcome_id,account_id,opportunity_id,prospect_id,
      final_value,currency,final_margin_percent,remaining_conditions,created_by
    ) values(
      p.id,p.active_version_id,o.id,p.account_id,p.opportunity_id,p.prospect_id,
      final_value,p.currency,final_margin,p_input->>'remainingConditions',p_actor_id
    ) returning * into h;
    insert into public.revenue_tasks(entity_type,entity_id,prospect_id,title,description,owner,priority,status,expected_outcome,metadata)
    values('proposal',p.id::text,p.prospect_id,'Préparer le contrat — '||p.title,
      'Transformer la position commerciale acceptée en contrat gouverné.',p.owner,'critical','open',
      'Contrat préparé avec conditions, signature et gates de paiement.',
      jsonb_build_object('proposal_id',p.id,'contract_handoff_id',h.id,'commercial_outcome_id',o.id)
    ) returning id into task_id;
  else
    update public.revenue_proposals set
      status=case when outcome_code='withdrawn' then 'withdrawn' when outcome_code='expired' then 'expired' when outcome_code='superseded' then 'superseded' else 'rejected' end,
      rejected_at=now(),last_activity_at=now(),version=version+1,updated_by=p_actor_id
    where id=p.id returning * into p;
    if n.id is not null then update public.revenue_negotiations set status='rejected',closed_at=now(),updated_by=p_actor_id,version=version+1 where id=n.id; end if;
  end if;
  return jsonb_build_object('proposal_id',p.id,'proposal_status',p.status,'commercial_outcome_id',o.id,'contract_handoff_id',h.id,'task_id',task_id,'accepted',accepted,'final_value',final_value,'final_margin_percent',final_margin,'idempotent_replay',false);
end$$;

create or replace view public.revenue_proposal_command_view as
select p.*,
  coalesce(a.legal_name,a.account_name,pr.company,pr.name,p.partnership_id,p.b2c_case_id,'Dossier commercial') as entity_name,
  coalesce(a.legal_name,a.account_name) as account_name,o.title as opportunity_title,c.full_name as primary_contact_name,c.email as primary_contact_email,
  coalesce((select count(*) from public.revenue_proposal_versions v where v.proposal_id=p.id),0) as version_count,
  coalesce((select count(*) from public.revenue_proposal_line_items l where l.proposal_id=p.id and l.proposal_version_id is null),0) as line_count,
  coalesce((select count(*) from public.revenue_proposal_approval_requests ar where ar.proposal_id=p.id and ar.status='requested'),0) as pending_approval_count,
  coalesce((select count(*) from public.revenue_proposal_objections ob where ob.proposal_id=p.id and ob.resolution_status not in ('resolved','closed')),0) as open_objection_count,
  coalesce((select count(*) from public.revenue_concession_requests cr where cr.proposal_id=p.id and cr.status in ('requested','pending')),0) as pending_concession_count
from public.revenue_proposals p
left join public.revenue_accounts a on a.id=p.account_id
left join public.revenue_opportunities o on o.id=p.opportunity_id
left join public.revenue_contacts c on c.id=p.contact_id
left join public.revenue_prospects pr on pr.id=p.prospect_id;

create or replace view public.revenue_negotiation_command_view as
select n.*,p.reference,p.title as proposal_title,p.entity_name,p.net_value,p.margin_percent,p.minimum_margin_percent,p.validity_until,
  coalesce((select count(*) from public.revenue_proposal_objections o where o.negotiation_id=n.id and o.resolution_status not in ('resolved','closed')),0) as open_objection_count,
  coalesce((select count(*) from public.revenue_concession_requests c where c.negotiation_id=n.id and c.status in ('requested','pending')),0) as pending_concession_count
from public.revenue_negotiations n join public.revenue_proposal_command_view p on p.id=n.proposal_id;

-- RLS: browser roles receive read-only visibility; all mutations pass through protected server commands.
do $$ declare t text; begin foreach t in array array[
'revenue_proposals','revenue_proposal_versions','revenue_proposal_sections','revenue_proposal_line_items','revenue_pricing_scenarios','revenue_proposal_approval_requests','revenue_discount_requests','revenue_margin_exceptions','revenue_proposal_documents','revenue_proposal_recipients','revenue_proposal_transmissions','revenue_proposal_delivery_events','revenue_proposal_responses','revenue_negotiations','revenue_negotiation_rounds','revenue_negotiation_positions','revenue_proposal_objections','revenue_counteroffers','revenue_concession_requests','revenue_negotiation_decisions','revenue_proposal_status_history','revenue_commercial_outcomes','revenue_contract_handoffs'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists %I on public.%I','mz6_authenticated_read_'||t,t);
  execute format('create policy %I on public.%I for select to authenticated using (true)','mz6_authenticated_read_'||t,t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant all on public.%I to service_role',t);
end loop;end$$;

grant select on public.revenue_proposal_command_view,public.revenue_negotiation_command_view to authenticated,service_role;
grant usage,select on sequence public.revenue_proposal_reference_seq to service_role;
revoke all on function public.revenue_recalculate_proposal(uuid) from public,anon,authenticated;
revoke all on function public.revenue_create_proposal_version(uuid,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.revenue_apply_commercial_outcome(uuid,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.revenue_recalculate_proposal(uuid) to service_role;
grant execute on function public.revenue_create_proposal_version(uuid,text,text,text,uuid) to service_role;
grant execute on function public.revenue_apply_commercial_outcome(uuid,jsonb,uuid) to service_role;

commit;
