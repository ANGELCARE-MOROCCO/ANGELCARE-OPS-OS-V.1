begin;

create extension if not exists pgcrypto;

do $preflight$
declare
  case_id_type text;
  required_column text;
  has_owner_id boolean;
  has_owner_label boolean;
begin
  if to_regclass('public.revenue_b2c_cases') is null then
    raise exception 'BLOCKED: public.revenue_b2c_cases is missing.';
  end if;
  select data_type into case_id_type
  from information_schema.columns
  where table_schema='public' and table_name='revenue_b2c_cases' and column_name='id';
  if case_id_type is distinct from 'uuid' then
    raise exception 'BLOCKED: revenue_b2c_cases.id must be uuid; found %.',coalesce(case_id_type,'missing');
  end if;

  foreach required_column in array array[
    'parent_name','city','service_interest','stage','estimated_value_mad',
    'phone','email','status','created_at','updated_at'
  ] loop
    if not exists(
      select 1 from information_schema.columns
      where table_schema='public' and table_name='revenue_b2c_cases' and column_name=required_column
    ) then
      raise exception 'BLOCKED: revenue_b2c_cases.% is required by Mega ZIP 9.',required_column;
    end if;
  end loop;

  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_b2c_cases' and column_name='owner_id'
  ) into has_owner_id;
  select exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_b2c_cases' and column_name='owner'
  ) into has_owner_label;
  if not has_owner_id and not has_owner_label then
    raise exception 'BLOCKED: revenue_b2c_cases must expose owner_id or owner.';
  end if;

  if to_regclass('public.revenue_tasks') is null then raise exception 'BLOCKED: Phase 4 revenue_tasks is missing.'; end if;
  if to_regclass('public.revenue_appointments') is null then raise exception 'BLOCKED: Phase 5 revenue_appointments is missing.'; end if;
  if to_regclass('public.revenue_proposals') is null then raise exception 'BLOCKED: Phase 6 revenue_proposals is missing.'; end if;
  if to_regclass('public.revenue_contracts') is null then raise exception 'BLOCKED: Phase 7 revenue_contracts is missing.'; end if;
end
$preflight$;

alter table public.revenue_b2c_cases
  add column if not exists family_reference text,
  add column if not exists family_name text,
  add column if not exists urgency text not null default 'medium',
  add column if not exists prospect_text_id text,
  add column if not exists account_id uuid,
  add column if not exists opportunity_id uuid,
  add column if not exists accepted_proposal_id uuid,
  add column if not exists contract_id uuid,
  add column if not exists operational_handoff_id uuid,
  add column if not exists desired_start_date date,
  add column if not exists intake_status text not null default 'pending',
  add column if not exists qualification_status text not null default 'not_started',
  add column if not exists consultation_status text not null default 'not_scheduled',
  add column if not exists recommendation_status text not null default 'not_started',
  add column if not exists quote_status text not null default 'not_started',
  add column if not exists matching_status text not null default 'not_started',
  add column if not exists onboarding_status text not null default 'not_started',
  add column if not exists activation_status text not null default 'not_ready',
  add column if not exists care_start_status text not null default 'not_started',
  add column if not exists relationship_status text not null default 'prospect',
  add column if not exists retention_status text not null default 'not_applicable',
  add column if not exists risk_status text not null default 'clear',
  add column if not exists satisfaction_score numeric(6,2) not null default 0,
  add column if not exists next_action text,
  add column if not exists next_action_at timestamptz,
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists archived_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

update public.revenue_b2c_cases
set family_name=coalesce(nullif(family_name,''),parent_name),
    family_reference=coalesce(nullif(family_reference,''),'AC-B2C-'||upper(substr(replace(id::text,'-',''),1,10))),
    stage=case
      when stage in ('inquiry','new','new_lead') then 'lead'
      when stage='qualification' then 'intake'
      when stage='quote' then 'quoted'
      when stage='care_start' then 'activation_pending'
      when stage='care_started' then 'active'
      else coalesce(stage,'lead')
    end,
    last_activity_at=coalesce(last_activity_at,updated_at,created_at,now())
where family_name is null or family_reference is null or stage in ('inquiry','new','new_lead','qualification','quote','care_start','care_started');

create unique index if not exists revenue_b2c_family_reference_uidx on public.revenue_b2c_cases(family_reference) where family_reference is not null;
create index if not exists revenue_b2c_cases_stage_idx_v9 on public.revenue_b2c_cases(stage,updated_at desc);
-- Production compatibility: some legacy B2C schemas expose only the textual `owner`
-- column, while newer schemas also expose `owner_id`. Build the index against the
-- strongest available ownership column rather than assuming `owner_id` exists.
do $owner_index$
begin
  if exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_b2c_cases' and column_name='owner_id'
  ) then
    execute 'create index if not exists revenue_b2c_cases_owner_idx_v9 on public.revenue_b2c_cases(owner_id,stage)';
  elsif exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_b2c_cases' and column_name='owner'
  ) then
    execute 'create index if not exists revenue_b2c_cases_owner_idx_v9 on public.revenue_b2c_cases(owner,stage)';
  else
    raise exception 'BLOCKED: revenue_b2c_cases must expose owner_id or owner.';
  end if;
end
$owner_index$;
create index if not exists revenue_b2c_cases_contact_idx_v9 on public.revenue_b2c_cases(lower(email),phone);
create index if not exists revenue_b2c_cases_contract_idx_v9 on public.revenue_b2c_cases(contract_id);
create index if not exists revenue_b2c_cases_opportunity_idx_v9 on public.revenue_b2c_cases(opportunity_id);

create table if not exists public.revenue_b2c_guardians(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  full_name text not null,
  relationship text,
  phone text,
  email text,
  is_primary boolean not null default false,
  decision_authority text not null default 'shared',
  status text not null default 'active',
  created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists revenue_b2c_one_primary_guardian_uidx on public.revenue_b2c_guardians(b2c_case_id) where is_primary and status='active';

create table if not exists public.revenue_b2c_beneficiaries(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  display_name text not null,
  birth_date date,
  age_group text,
  language_preferences text,
  care_notes text,
  safety_notes text,
  status text not null default 'active',
  created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_emergency_contacts(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  full_name text not null,relationship text,phone text not null,priority_order integer not null default 1,
  status text not null default 'active',created_by uuid,created_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_family_instructions(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  category text not null,instruction text not null,sensitivity text not null default 'standard',
  effective_from timestamptz not null default now(),effective_to timestamptz,status text not null default 'active',
  created_by uuid,created_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_service_requirements(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  beneficiary_id uuid references public.revenue_b2c_beneficiaries(id) on delete set null,
  version integer not null default 1,
  service_type text not null,schedule_summary text,start_date date,end_date date,frequency text,location text,
  language_preferences text,caregiver_profile text,transport_constraints text,safety_considerations text,
  family_priorities text,deal_breakers text,budget_min_mad numeric(18,2) not null default 0,
  budget_max_mad numeric(18,2) not null default 0,status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  check(budget_min_mad>=0 and budget_max_mad>=0 and (budget_max_mad=0 or budget_max_mad>=budget_min_mad))
);
create unique index if not exists revenue_b2c_one_active_requirement_uidx on public.revenue_b2c_service_requirements(b2c_case_id) where status='active';

create table if not exists public.revenue_b2c_needs_assessments(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  requirement_clarity numeric(6,2) not null default 0,service_feasibility numeric(6,2) not null default 0,
  location_feasibility numeric(6,2) not null default 0,schedule_feasibility numeric(6,2) not null default 0,
  budget_alignment numeric(6,2) not null default 0,risk_level text not null default 'medium',
  overall_score numeric(6,2) not null default 0,assessment_summary text,status text not null default 'draft',
  decision text,decision_reason text,finalized_at timestamptz,finalized_by uuid,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_consultations(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  appointment_id uuid references public.revenue_appointments(id) on delete set null,
  status text not null default 'scheduled',objective text,channel text,owner text,outcome text,concerns text,
  decision_readiness numeric(6,2) not null default 0,notes text,follow_up_at timestamptz,
  completed_at timestamptz,completed_by uuid,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_service_recommendations(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  service_line text not null,service_format text not null,recommended_duration text,schedule_fit numeric(6,2) not null default 0,
  suitability_explanation text not null,availability_dependency text,pricing_implication text,risks text,
  status text not null default 'draft',decision_notes text,approved_by uuid,approved_at timestamptz,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_matching_cycles(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  requirement_id uuid not null references public.revenue_b2c_service_requirements(id) on delete restrict,
  rematch_of_cycle_id uuid references public.revenue_b2c_matching_cycles(id) on delete set null,
  selected_candidate_id uuid,target_start_date date,matching_owner text,selection_criteria text,
  status text not null default 'open',closed_at timestamptz,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists revenue_b2c_one_open_matching_uidx on public.revenue_b2c_matching_cycles(b2c_case_id) where status in ('open','presenting','decision_pending');

create table if not exists public.revenue_b2c_matching_candidates(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  matching_cycle_id uuid not null references public.revenue_b2c_matching_cycles(id) on delete cascade,
  caregiver_reference text not null,caregiver_name_snapshot text,
  eligibility_status text not null default 'pending',availability_status text not null default 'unverified',
  availability_evidence text,availability_verified_at timestamptz,availability_verified_by uuid,
  location_fit_score numeric(6,2) not null default 0,schedule_fit_score numeric(6,2) not null default 0,
  language_fit_score numeric(6,2) not null default 0,experience_fit_score numeric(6,2) not null default 0,
  overall_fit_score numeric(6,2) not null default 0,eligibility_reason text,rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(matching_cycle_id,caregiver_reference)
);
alter table public.revenue_b2c_matching_cycles drop constraint if exists revenue_b2c_matching_cycles_selected_candidate_id_fkey;
alter table public.revenue_b2c_matching_cycles add constraint revenue_b2c_matching_cycles_selected_candidate_id_fkey foreign key(selected_candidate_id) references public.revenue_b2c_matching_candidates(id) on delete set null;

create table if not exists public.revenue_b2c_matching_decisions(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  matching_cycle_id uuid not null references public.revenue_b2c_matching_cycles(id) on delete cascade,
  candidate_id uuid references public.revenue_b2c_matching_candidates(id) on delete set null,
  decision text not null,decision_reason text,evidence_reference text,proposed_start_date date,
  decided_by uuid,created_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_onboarding_plans(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  target_start_date date,owner text,parent_briefing_required boolean not null default true,
  status text not null default 'planned',notes text,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists revenue_b2c_one_active_onboarding_uidx on public.revenue_b2c_onboarding_plans(b2c_case_id) where status in ('planned','in_progress','ready');

create table if not exists public.revenue_b2c_onboarding_items(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  onboarding_plan_id uuid not null references public.revenue_b2c_onboarding_plans(id) on delete cascade,
  title text not null,category text,owner text,due_date date,evidence_required text,evidence_reference text,
  completion_notes text,status text not null default 'open',completed_at timestamptz,completed_by uuid,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_activation_gates(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  gate_key text not null,mandatory boolean not null default true,result text not null default 'pending',
  reason text,evidence_reference text,evaluated_at timestamptz,evaluated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
  unique(b2c_case_id,gate_key)
);

create table if not exists public.revenue_b2c_care_starts(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  authorized_start_date date,authorization_reason text,status text not null default 'authorized',
  authorized_by uuid,authorized_at timestamptz,actual_start_at timestamptz,caregiver_reference text,
  start_evidence text,notes text,recorded_by uuid,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_satisfaction_checks(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  score numeric(6,2) not null default 0,service_quality numeric(6,2) not null default 0,
  caregiver_fit numeric(6,2) not null default 0,responsiveness numeric(6,2) not null default 0,
  trust_score numeric(6,2) not null default 0,feedback text,required_correction text,
  follow_up_at timestamptz,status text not null default 'recorded',
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_complaints(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  category text not null,severity text not null default 'medium',description text not null,
  immediate_containment text,quality_reference text,owner text,status text not null default 'open',
  contained_at timestamptz,resolution text,closure_evidence text,closed_at timestamptz,closed_by uuid,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_retention_risks(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  category text not null,severity text not null default 'medium',value_at_risk_mad numeric(18,2) not null default 0,
  reason text not null,due_date date,status text not null default 'open',owner text,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_retention_plans(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  retention_risk_id uuid references public.revenue_b2c_retention_risks(id) on delete set null,
  plan_type text not null default 'retention',objective text not null,actions text,owner text,review_date date,
  expected_value_mad numeric(18,2) not null default 0,status text not null default 'active',
  outcome text,outcome_notes text,closed_at timestamptz,closed_by uuid,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_recovery_plans(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  trigger_type text not null,root_cause text not null,objective text not null,actions text,owner text,deadline date,
  status text not null default 'active',outcome text,created_by uuid,updated_by uuid,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_recovery_checkpoints(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  recovery_plan_id uuid not null references public.revenue_b2c_recovery_plans(id) on delete cascade,
  title text not null,due_date date,success_criteria text not null,status text not null default 'planned',
  result text,evidence_reference text,completed_at timestamptz,completed_by uuid,
  created_by uuid,updated_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_status_history(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  event_type text not null,previous_state jsonb,new_state jsonb,reason text,actor_id uuid,
  metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_evidence(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  evidence_type text not null,reference text not null,sensitivity text not null default 'standard',
  verification_status text not null default 'unverified',verified_by uuid,verified_at timestamptz,rejection_reason text,
  created_by uuid,created_at timestamptz not null default now()
);

create table if not exists public.revenue_b2c_closures(
  id uuid primary key default gen_random_uuid(),
  b2c_case_id uuid not null references public.revenue_b2c_cases(id) on delete cascade,
  closure_type text not null,reason text not null,effective_date date,customer_communication text,
  evidence_reference text,status text not null default 'confirmed',created_by uuid,created_at timestamptz not null default now()
);

create index if not exists revenue_b2c_guardians_case_idx on public.revenue_b2c_guardians(b2c_case_id,status);
create index if not exists revenue_b2c_beneficiaries_case_idx on public.revenue_b2c_beneficiaries(b2c_case_id,status);
create index if not exists revenue_b2c_matching_candidates_cycle_idx on public.revenue_b2c_matching_candidates(matching_cycle_id,overall_fit_score desc);
create index if not exists revenue_b2c_activation_gates_case_idx on public.revenue_b2c_activation_gates(b2c_case_id,mandatory,result);
create index if not exists revenue_b2c_complaints_case_idx on public.revenue_b2c_complaints(b2c_case_id,status,severity);
create index if not exists revenue_b2c_retention_risks_case_idx on public.revenue_b2c_retention_risks(b2c_case_id,status,severity);
create index if not exists revenue_b2c_status_history_case_idx on public.revenue_b2c_status_history(b2c_case_id,created_at desc);

create or replace function public.revenue_b2c_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at=now();
  return new;
end
$$;

do $triggers$
declare t text;
begin
  foreach t in array array[
    'revenue_b2c_guardians','revenue_b2c_beneficiaries','revenue_b2c_service_requirements',
    'revenue_b2c_needs_assessments','revenue_b2c_consultations','revenue_b2c_service_recommendations',
    'revenue_b2c_matching_cycles','revenue_b2c_matching_candidates','revenue_b2c_onboarding_plans',
    'revenue_b2c_onboarding_items','revenue_b2c_activation_gates','revenue_b2c_care_starts',
    'revenue_b2c_satisfaction_checks','revenue_b2c_complaints','revenue_b2c_retention_risks',
    'revenue_b2c_retention_plans','revenue_b2c_recovery_plans','revenue_b2c_recovery_checkpoints'
  ] loop
    execute format('drop trigger if exists %I on public.%I','trg_'||t||'_updated_at',t);
    execute format('create trigger %I before update on public.%I for each row execute function public.revenue_b2c_touch_updated_at()','trg_'||t||'_updated_at',t);
  end loop;
end
$triggers$;

create or replace view public.revenue_b2c_command_view as
select
  c.*,
  (select count(*) from public.revenue_b2c_guardians g where g.b2c_case_id=c.id and g.status='active') as guardian_count,
  (select count(*) from public.revenue_b2c_beneficiaries b where b.b2c_case_id=c.id and b.status='active') as beneficiary_count,
  (select count(*) from public.revenue_b2c_complaints q where q.b2c_case_id=c.id and q.status<>'closed') as open_complaint_count,
  (select count(*) from public.revenue_b2c_retention_risks r where r.b2c_case_id=c.id and r.status='open') as open_retention_risk_count,
  (select count(*) from public.revenue_b2c_activation_gates g where g.b2c_case_id=c.id and g.mandatory and g.result<>'passed') as blocking_gate_count,
  (select max(s.score) from public.revenue_b2c_satisfaction_checks s where s.b2c_case_id=c.id) as latest_satisfaction_score,
  (select max(h.created_at) from public.revenue_b2c_status_history h where h.b2c_case_id=c.id) as last_history_at
from public.revenue_b2c_cases c
where coalesce(c.status,'active')<>'archived';

create or replace view public.revenue_b2c_matching_command_view as
select
  cycle.*,c.family_name,c.parent_name,c.city,c.service_interest,c.estimated_value_mad,
  (select count(*) from public.revenue_b2c_matching_candidates mc where mc.matching_cycle_id=cycle.id) as candidate_count,
  (select count(*) from public.revenue_b2c_matching_candidates mc where mc.matching_cycle_id=cycle.id and mc.availability_status='verified') as verified_candidate_count,
  (select max(mc.overall_fit_score) from public.revenue_b2c_matching_candidates mc where mc.matching_cycle_id=cycle.id) as best_fit_score
from public.revenue_b2c_matching_cycles cycle
join public.revenue_b2c_cases c on c.id=cycle.b2c_case_id;

-- Resolve the live ownership column without assuming that both `owner` and
-- `owner_id` exist. The view always exposes a stable textual `owner` alias.
do $retention_view$
declare
  owner_expression text;
begin
  if exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_b2c_cases' and column_name='owner'
  ) then
    owner_expression := 'c.owner';
  elsif exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='revenue_b2c_cases' and column_name='owner_id'
  ) then
    owner_expression := 'c.owner_id::text';
  else
    raise exception 'BLOCKED: revenue_b2c_cases must expose owner or owner_id.';
  end if;

  execute format($view$
    create or replace view public.revenue_b2c_retention_command_view as
    select
      c.id as b2c_case_id,c.family_name,c.parent_name,%s as owner,
      c.estimated_value_mad,c.satisfaction_score,c.retention_status,c.risk_status,
      coalesce((select sum(r.value_at_risk_mad) from public.revenue_b2c_retention_risks r where r.b2c_case_id=c.id and r.status='open'),0) as value_at_risk_mad,
      (select count(*) from public.revenue_b2c_complaints q where q.b2c_case_id=c.id and q.status<>'closed') as open_complaints,
      (select count(*) from public.revenue_b2c_retention_plans p where p.b2c_case_id=c.id and p.status='active') as active_plans
    from public.revenue_b2c_cases c
    where c.stage in ('active','retention','recovery') or c.retention_status in ('at_risk','recovery')
  $view$, owner_expression);
end
$retention_view$;

create or replace function public.revenue_evaluate_b2c_activation(p_case_id uuid,p_actor_id uuid default null)
returns table(case_id uuid,mandatory_total integer,mandatory_passed integer,activation_status text)
language plpgsql security definer set search_path=public as $$
declare
  item public.revenue_b2c_cases%rowtype;
  contract_pass boolean;
  payment_pass boolean;
  matching_pass boolean;
  onboarding_pass boolean;
  handoff_pass boolean;
  availability_pass boolean;
  instructions_pass boolean;
  emergency_pass boolean;
  total integer;
  passed integer;
  final_status text;
begin
  select * into item from public.revenue_b2c_cases where id=p_case_id for update;
  if not found then raise exception 'Dossier famille introuvable.'; end if;

  select exists(select 1 from public.revenue_contracts c where c.id=item.contract_id and c.status in ('fully_signed','conditions_pending','effective','activation_pending','active','completed')) into contract_pass;
  select exists(select 1 from public.revenue_payment_confirmations p where p.contract_id=item.contract_id and p.reconciliation_status in ('confirmed','partial') and p.confirmed_amount>0) into payment_pass;
  select exists(
    select 1 from public.revenue_b2c_matching_cycles m
    join public.revenue_b2c_matching_candidates mc on mc.id=m.selected_candidate_id
    where m.b2c_case_id=item.id and m.status='accepted' and mc.availability_status='verified'
  ) into matching_pass;
  select not exists(
    select 1 from public.revenue_b2c_onboarding_items oi
    join public.revenue_b2c_onboarding_plans op on op.id=oi.onboarding_plan_id
    where op.b2c_case_id=item.id and oi.status<>'completed'
  ) and exists(select 1 from public.revenue_b2c_onboarding_plans op where op.b2c_case_id=item.id and op.status in ('planned','in_progress','ready')) into onboarding_pass;
  select exists(select 1 from public.revenue_operational_handoffs h where h.id=item.operational_handoff_id and h.status='accepted') into handoff_pass;
  availability_pass:=matching_pass;
  select exists(select 1 from public.revenue_b2c_family_instructions i where i.b2c_case_id=item.id and i.status='active') into instructions_pass;
  select exists(select 1 from public.revenue_b2c_emergency_contacts e where e.b2c_case_id=item.id and e.status='active') into emergency_pass;

  insert into public.revenue_b2c_activation_gates(b2c_case_id,gate_key,mandatory,result,reason,evaluated_at,evaluated_by)
  values
    (item.id,'contract',true,case when contract_pass then 'passed' else 'failed' end,case when contract_pass then 'Contrat valide.' else 'Contrat signé/effectif requis.' end,now(),p_actor_id),
    (item.id,'payment',true,case when payment_pass then 'passed' else 'failed' end,case when payment_pass then 'Paiement confirmé.' else 'Confirmation Finance requise.' end,now(),p_actor_id),
    (item.id,'matching',true,case when matching_pass then 'passed' else 'failed' end,case when matching_pass then 'Matching accepté.' else 'Matching accepté requis.' end,now(),p_actor_id),
    (item.id,'onboarding',true,case when onboarding_pass then 'passed' else 'failed' end,case when onboarding_pass then 'Onboarding complet.' else 'Onboarding incomplet.' end,now(),p_actor_id),
    (item.id,'handoff',true,case when handoff_pass then 'passed' else 'failed' end,case when handoff_pass then 'Handoff accepté.' else 'Handoff opérationnel accepté requis.' end,now(),p_actor_id),
    (item.id,'availability',true,case when availability_pass then 'passed' else 'failed' end,case when availability_pass then 'Disponibilité vérifiée.' else 'Disponibilité caregiver à vérifier.' end,now(),p_actor_id),
    (item.id,'instructions',true,case when instructions_pass then 'passed' else 'failed' end,case when instructions_pass then 'Instructions enregistrées.' else 'Instructions famille requises.' end,now(),p_actor_id),
    (item.id,'emergency_contact',true,case when emergency_pass then 'passed' else 'failed' end,case when emergency_pass then 'Contact urgence disponible.' else 'Contact urgence requis.' end,now(),p_actor_id)
  on conflict(b2c_case_id,gate_key) do update
  set result=excluded.result,reason=excluded.reason,evaluated_at=excluded.evaluated_at,evaluated_by=excluded.evaluated_by,updated_at=now();

  select count(*),count(*) filter(where result='passed') into total,passed
  from public.revenue_b2c_activation_gates where b2c_case_id=item.id and mandatory=true;
  final_status:=case when total>0 and total=passed then 'ready' else 'blocked' end;
  update public.revenue_b2c_cases set activation_status=final_status,stage=case when final_status='ready' then 'activation_pending' else stage end,last_activity_at=now(),updated_at=now(),updated_by=p_actor_id where id=item.id;
  insert into public.revenue_b2c_status_history(b2c_case_id,event_type,previous_state,new_state,reason,actor_id,metadata)
  values(item.id,'b2c_activation_evaluated',to_jsonb(item.activation_status),to_jsonb(final_status),null,p_actor_id,jsonb_build_object('mandatory_total',total,'mandatory_passed',passed));
  return query select item.id,total,passed,final_status;
end
$$;

create or replace function public.revenue_authorize_b2c_activation(p_case_id uuid,p_actor_id uuid,p_decision text,p_reason text)
returns table(case_id uuid,activation_status text,authorized boolean)
language plpgsql security definer set search_path=public as $$
declare
  total integer;passed integer;current_status text;approved boolean;
begin
  perform public.revenue_evaluate_b2c_activation(p_case_id,p_actor_id);
  select count(*),count(*) filter(where result='passed') into total,passed from public.revenue_b2c_activation_gates where b2c_case_id=p_case_id and mandatory=true;
  approved:=p_decision='approved';
  if approved and (total=0 or total<>passed) then raise exception 'Les gates obligatoires ne sont pas satisfaits.'; end if;
  current_status:=case when approved then 'approved' else 'rejected' end;
  update public.revenue_b2c_cases set activation_status=current_status,stage=case when approved then 'activation_pending' else stage end,last_activity_at=now(),updated_at=now(),updated_by=p_actor_id where id=p_case_id;
  insert into public.revenue_b2c_status_history(b2c_case_id,event_type,previous_state,new_state,reason,actor_id)
  values(p_case_id,'b2c_activation_decision',null,to_jsonb(current_status),p_reason,p_actor_id);
  return query select p_case_id,current_status,approved;
end
$$;

create or replace function public.revenue_accept_b2c_match(p_cycle_id uuid,p_candidate_id uuid,p_actor_id uuid,p_evidence text,p_start_date date default null)
returns table(case_id uuid,cycle_id uuid,candidate_id uuid,matching_status text)
language plpgsql security definer set search_path=public as $$
declare
  cycle public.revenue_b2c_matching_cycles%rowtype;
  candidate public.revenue_b2c_matching_candidates%rowtype;
begin
  select * into cycle from public.revenue_b2c_matching_cycles where id=p_cycle_id for update;
  if not found then raise exception 'Cycle matching introuvable.'; end if;
  select * into candidate from public.revenue_b2c_matching_candidates where id=p_candidate_id and matching_cycle_id=p_cycle_id for update;
  if not found then raise exception 'Candidat matching introuvable.'; end if;
  if candidate.availability_status<>'verified' then raise exception 'Disponibilité non vérifiée.'; end if;
  if coalesce(p_evidence,'')='' then raise exception 'Preuve de décision famille requise.'; end if;
  insert into public.revenue_b2c_matching_decisions(b2c_case_id,matching_cycle_id,candidate_id,decision,decision_reason,evidence_reference,proposed_start_date,decided_by)
  values(cycle.b2c_case_id,cycle.id,candidate.id,'accepted','Décision famille confirmée',p_evidence,p_start_date,p_actor_id);
  update public.revenue_b2c_matching_cycles set status='accepted',selected_candidate_id=candidate.id,closed_at=now(),updated_at=now(),updated_by=p_actor_id where id=cycle.id;
  update public.revenue_b2c_cases set matching_status='accepted',stage='confirmed',last_activity_at=now(),updated_at=now(),updated_by=p_actor_id where id=cycle.b2c_case_id;
  return query select cycle.b2c_case_id,cycle.id,candidate.id,'accepted'::text;
end
$$;

do $rls$
declare table_name text;
begin
  foreach table_name in array array[
    'revenue_b2c_guardians','revenue_b2c_beneficiaries','revenue_b2c_emergency_contacts',
    'revenue_b2c_family_instructions','revenue_b2c_service_requirements','revenue_b2c_needs_assessments',
    'revenue_b2c_consultations','revenue_b2c_service_recommendations','revenue_b2c_matching_cycles',
    'revenue_b2c_matching_candidates','revenue_b2c_matching_decisions','revenue_b2c_onboarding_plans',
    'revenue_b2c_onboarding_items','revenue_b2c_activation_gates','revenue_b2c_care_starts',
    'revenue_b2c_satisfaction_checks','revenue_b2c_complaints','revenue_b2c_retention_risks',
    'revenue_b2c_retention_plans','revenue_b2c_recovery_plans','revenue_b2c_recovery_checkpoints',
    'revenue_b2c_status_history','revenue_b2c_evidence','revenue_b2c_closures'
  ] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('drop policy if exists %I on public.%I','b2c_enterprise_authenticated_read',table_name);
    execute format('create policy %I on public.%I for select to authenticated using (auth.uid() is not null)','b2c_enterprise_authenticated_read',table_name);
    execute format('revoke insert,update,delete on public.%I from anon,authenticated',table_name);
    execute format('grant select on public.%I to authenticated',table_name);
    execute format('grant all on public.%I to service_role',table_name);
  end loop;
end
$rls$;

revoke all on function public.revenue_b2c_touch_updated_at() from public,anon,authenticated;
revoke all on function public.revenue_evaluate_b2c_activation(uuid,uuid) from public,anon,authenticated;
revoke all on function public.revenue_authorize_b2c_activation(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.revenue_accept_b2c_match(uuid,uuid,uuid,text,date) from public,anon,authenticated;
grant execute on function public.revenue_evaluate_b2c_activation(uuid,uuid) to service_role;
grant execute on function public.revenue_authorize_b2c_activation(uuid,uuid,text,text) to service_role;
grant execute on function public.revenue_accept_b2c_match(uuid,uuid,uuid,text,date) to service_role;

grant select on public.revenue_b2c_command_view to authenticated,service_role;
grant select on public.revenue_b2c_matching_command_view to authenticated,service_role;
grant select on public.revenue_b2c_retention_command_view to authenticated,service_role;

commit;
