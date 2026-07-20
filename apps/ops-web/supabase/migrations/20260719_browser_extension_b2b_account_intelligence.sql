begin;

create extension if not exists pgcrypto;

create table if not exists public.browser_extension_b2b_contexts (
  id uuid primary key default gen_random_uuid(),
  device_id uuid references public.browser_extension_devices(id) on delete set null,
  user_id uuid references public.app_users(id) on delete set null,
  adapter_key text not null,
  page_type text not null default 'unknown',
  source_url text not null,
  source_origin text,
  page_title text,
  selected_text text,
  organization_name text,
  normalized_domain text,
  sector text,
  city text,
  raw_context jsonb not null default '{}'::jsonb,
  resolved_status text not null default 'pending' check (resolved_status in ('pending','unknown','existing','possible_duplicate','branch_candidate','ignored','error')),
  resolved_prospect_id uuid,
  confidence numeric(5,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_identity_matches (
  id uuid primary key default gen_random_uuid(),
  context_id uuid not null references public.browser_extension_b2b_contexts(id) on delete cascade,
  prospect_id uuid not null,
  confidence numeric(5,4) not null,
  match_type text not null,
  match_reasons jsonb not null default '[]'::jsonb,
  prospect_snapshot jsonb not null default '{}'::jsonb,
  selected boolean not null default false,
  created_at timestamptz not null default now(),
  unique(context_id, prospect_id)
);

create table if not exists public.browser_extension_b2b_evidence (
  id uuid primary key default gen_random_uuid(),
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  prospect_id uuid,
  user_id uuid references public.app_users(id) on delete set null,
  device_id uuid references public.browser_extension_devices(id) on delete set null,
  adapter_key text not null,
  source_url text not null,
  evidence_type text not null,
  field_key text,
  observed_value text,
  normalized_value text,
  confidence numeric(5,4) not null default 0.5,
  validation_status text not null default 'unvalidated' check(validation_status in ('unvalidated','confirmed','rejected','superseded')),
  metadata jsonb not null default '{}'::jsonb,
  confirmed_by uuid references public.app_users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_enrichment_proposals (
  id uuid primary key default gen_random_uuid(),
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  prospect_id uuid not null,
  user_id uuid references public.app_users(id) on delete set null,
  proposed_changes jsonb not null default '{}'::jsonb,
  evidence_ids uuid[] not null default '{}',
  status text not null default 'prepared' check(status in ('prepared','applied','rejected','expired')),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_score_snapshots (
  id uuid primary key default gen_random_uuid(),
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  prospect_id uuid,
  user_id uuid references public.app_users(id) on delete set null,
  scoring_version text not null,
  scores jsonb not null,
  contributions jsonb not null default '[]'::jsonb,
  overall_priority text not null,
  explanation text,
  created_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_buying_committee (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  contact_id uuid,
  role_key text not null,
  role_label text not null,
  person_name text,
  job_title text,
  influence_level text not null default 'unknown',
  relationship_strength text not null default 'unknown',
  status text not null default 'missing' check(status in ('missing','identified','engaged','supportive','neutral','blocking','validated')),
  evidence_id uuid references public.browser_extension_b2b_evidence(id) on delete set null,
  notes text,
  created_by uuid references public.app_users(id) on delete set null,
  updated_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(prospect_id, role_key)
);

create table if not exists public.browser_extension_b2b_account_plans (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  status text not null default 'draft' check(status in ('draft','active','completed','superseded')),
  plan_version integer not null default 1,
  objective text not null,
  opportunity_thesis text,
  recommended_offer text,
  target_stakeholders jsonb not null default '[]'::jsonb,
  entry_strategy jsonb not null default '{}'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  expected_value_min numeric(14,2) not null default 0,
  expected_value_max numeric(14,2) not null default 0,
  owner_id uuid references public.app_users(id) on delete set null,
  next_action text,
  next_action_due_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_research_missions (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null,
  account_plan_id uuid references public.browser_extension_b2b_account_plans(id) on delete set null,
  mission_type text not null,
  title text not null,
  objective text not null,
  target_role_key text,
  priority text not null default 'high',
  status text not null default 'open' check(status in ('open','in_progress','completed','blocked','cancelled')),
  assigned_to uuid references public.app_users(id) on delete set null,
  due_at timestamptz,
  completion_evidence_id uuid references public.browser_extension_b2b_evidence(id) on delete set null,
  result_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_duplicate_reviews (
  id uuid primary key default gen_random_uuid(),
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  requested_prospect_payload jsonb not null default '{}'::jsonb,
  candidate_prospect_ids uuid[] not null default '{}',
  review_type text not null check(review_type in ('merge','separate_branch','false_positive')),
  status text not null default 'pending' check(status in ('pending','approved','rejected','resolved')),
  requested_by uuid references public.app_users(id) on delete set null,
  reviewed_by uuid references public.app_users(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.browser_extension_b2b_territory_sweeps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.app_users(id) on delete set null,
  device_id uuid references public.browser_extension_devices(id) on delete set null,
  name text not null,
  territory text not null,
  vertical text,
  status text not null default 'active' check(status in ('active','completed','cancelled')),
  reviewed_count integer not null default 0,
  existing_count integer not null default 0,
  new_target_count integer not null default 0,
  duplicate_count integer not null default 0,
  low_priority_count integer not null default 0,
  estimated_value_min numeric(14,2) not null default 0,
  estimated_value_max numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_b2b_territory_targets (
  id uuid primary key default gen_random_uuid(),
  sweep_id uuid not null references public.browser_extension_b2b_territory_sweeps(id) on delete cascade,
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  prospect_id uuid,
  organization_name text not null,
  city text,
  address text,
  website text,
  phone text,
  vertical text,
  classification text not null default 'unreviewed' check(classification in ('unreviewed','existing','strategic_target','possible_duplicate','low_priority','ignored')),
  score numeric(6,2),
  evidence jsonb not null default '{}'::jsonb,
  assigned_to uuid references public.app_users(id) on delete set null,
  mission_id uuid references public.browser_extension_b2b_research_missions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.browser_extension_adapter_health_events (
  id uuid primary key default gen_random_uuid(),
  adapter_key text not null,
  device_id uuid references public.browser_extension_devices(id) on delete set null,
  user_id uuid references public.app_users(id) on delete set null,
  source_origin text,
  status text not null,
  selector_version text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists browser_ext_b2b_context_user_idx on public.browser_extension_b2b_contexts(user_id, created_at desc);
create index if not exists browser_ext_b2b_context_domain_idx on public.browser_extension_b2b_contexts(normalized_domain);
create index if not exists browser_ext_b2b_match_context_idx on public.browser_extension_b2b_identity_matches(context_id, confidence desc);
create index if not exists browser_ext_b2b_evidence_prospect_idx on public.browser_extension_b2b_evidence(prospect_id, created_at desc);
create index if not exists browser_ext_b2b_score_prospect_idx on public.browser_extension_b2b_score_snapshots(prospect_id, created_at desc);
create index if not exists browser_ext_b2b_committee_prospect_idx on public.browser_extension_b2b_buying_committee(prospect_id, role_key);
create index if not exists browser_ext_b2b_plan_prospect_idx on public.browser_extension_b2b_account_plans(prospect_id, created_at desc);
create index if not exists browser_ext_b2b_mission_prospect_idx on public.browser_extension_b2b_research_missions(prospect_id, status, due_at);
create index if not exists browser_ext_b2b_sweep_user_idx on public.browser_extension_b2b_territory_sweeps(user_id, created_at desc);
create index if not exists browser_ext_b2b_target_sweep_idx on public.browser_extension_b2b_territory_targets(sweep_id, classification);

alter table public.browser_extension_b2b_contexts enable row level security;
alter table public.browser_extension_b2b_identity_matches enable row level security;
alter table public.browser_extension_b2b_evidence enable row level security;
alter table public.browser_extension_b2b_enrichment_proposals enable row level security;
alter table public.browser_extension_b2b_score_snapshots enable row level security;
alter table public.browser_extension_b2b_buying_committee enable row level security;
alter table public.browser_extension_b2b_account_plans enable row level security;
alter table public.browser_extension_b2b_research_missions enable row level security;
alter table public.browser_extension_b2b_duplicate_reviews enable row level security;
alter table public.browser_extension_b2b_territory_sweeps enable row level security;
alter table public.browser_extension_b2b_territory_targets enable row level security;
alter table public.browser_extension_adapter_health_events enable row level security;

update public.browser_extension_release_channels
set version='0.2.0', minimum_version='0.1.0', release_notes='Mega ZIP 2 B2B account discovery and commercial intelligence', updated_at=now()
where channel_key='pilot';

commit;
