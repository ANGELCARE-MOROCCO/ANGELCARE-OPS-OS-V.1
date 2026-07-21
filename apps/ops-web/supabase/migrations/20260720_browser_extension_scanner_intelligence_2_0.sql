begin;
create extension if not exists pgcrypto;

create table if not exists public.browser_extension_scan_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  device_id uuid references public.browser_extension_devices(id) on delete set null,
  mode text not null check (mode in ('quick','deep','strategic')),
  status text not null default 'prepared' check (status in ('prepared','collecting','researching','resolving','review_required','completed','partial','failed','cancelled')),
  adapter_key text not null,
  source_url text not null,
  source_origin text,
  page_type text,
  scanner_version text not null default 'scanner-intelligence-2.0',
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  resolved_prospect_id uuid,
  requested_sources jsonb not null default '[]'::jsonb,
  discovered_urls jsonb not null default '[]'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  quality jsonb not null default '{}'::jsonb,
  input_context jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  error_code text,
  completed_by uuid references public.app_users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_sessions_user_idx on public.browser_extension_scan_sessions(user_id,created_at desc);
create index if not exists browser_ext_scan_sessions_domain_idx on public.browser_extension_scan_sessions(source_origin,status,created_at desc);
create index if not exists browser_ext_scan_sessions_prospect_idx on public.browser_extension_scan_sessions(resolved_prospect_id,created_at desc);

create table if not exists public.browser_extension_scan_pages (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  page_order integer not null default 1,
  source_url text not null,
  page_title text,
  page_type text not null default 'content',
  fetch_status text not null check(fetch_status in ('fetched','skipped','failed')),
  http_status integer,
  content_type text,
  text_length integer not null default 0,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(scan_session_id,source_url)
);
create index if not exists browser_ext_scan_pages_session_idx on public.browser_extension_scan_pages(scan_session_id,page_order);

create table if not exists public.browser_extension_scan_facts (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  context_id uuid references public.browser_extension_b2b_contexts(id) on delete set null,
  field_key text not null,
  observed_value text not null,
  normalized_value text,
  source_url text not null,
  source_title text,
  evidence_excerpt text,
  extraction_method text not null,
  confidence numeric(5,4) not null default 0.5 check(confidence between 0 and 1),
  validation_state text not null default 'detected' check(validation_state in ('detected','inferred','user_confirmed','verified','rejected','conflicting','outdated')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_facts_session_idx on public.browser_extension_scan_facts(scan_session_id,field_key,confidence desc);
create index if not exists browser_ext_scan_facts_context_idx on public.browser_extension_scan_facts(context_id,created_at desc);

create table if not exists public.browser_extension_scan_contacts (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  name text,
  role text,
  department text,
  email text,
  phone text,
  source_url text not null,
  confidence numeric(5,4) not null default 0.5 check(confidence between 0 and 1),
  buying_role_hypothesis text,
  validation_state text not null default 'detected' check(validation_state in ('detected','user_confirmed','verified','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_contacts_session_idx on public.browser_extension_scan_contacts(scan_session_id,confidence desc);

create table if not exists public.browser_extension_scan_signals (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  signal_type text not null check(signal_type in ('growth','need','buying','risk','positioning','operational')),
  signal_key text not null,
  label text not null,
  evidence_excerpt text not null,
  source_url text not null,
  confidence numeric(5,4) not null default 0.5 check(confidence between 0 and 1),
  commercial_interpretation text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_signals_session_idx on public.browser_extension_scan_signals(scan_session_id,signal_type,confidence desc);

create table if not exists public.browser_extension_scan_opportunity_hypotheses (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  program_key text not null,
  title text not null,
  rationale text not null,
  evidence_references jsonb not null default '[]'::jsonb,
  potential_model text,
  confidence numeric(5,4) not null default 0.5 check(confidence between 0 and 1),
  missing_information jsonb not null default '[]'::jsonb,
  estimated_annual_value_min numeric(14,2) not null default 0,
  estimated_annual_value_max numeric(14,2) not null default 0,
  status text not null default 'proposed' check(status in ('proposed','accepted','rejected','converted')),
  converted_opportunity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_hypotheses_session_idx on public.browser_extension_scan_opportunity_hypotheses(scan_session_id,confidence desc);

create table if not exists public.browser_extension_scan_user_decisions (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  decision_type text not null,
  target_type text,
  target_id uuid,
  decision_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_decisions_session_idx on public.browser_extension_scan_user_decisions(scan_session_id,created_at desc);

create table if not exists public.browser_extension_scan_errors (
  id uuid primary key default gen_random_uuid(),
  scan_session_id uuid not null references public.browser_extension_scan_sessions(id) on delete cascade,
  error_code text not null,
  message text not null,
  source_url text,
  recoverable boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists browser_ext_scan_errors_session_idx on public.browser_extension_scan_errors(scan_session_id,created_at desc);

alter table public.browser_extension_scan_sessions enable row level security;
alter table public.browser_extension_scan_pages enable row level security;
alter table public.browser_extension_scan_facts enable row level security;
alter table public.browser_extension_scan_contacts enable row level security;
alter table public.browser_extension_scan_signals enable row level security;
alter table public.browser_extension_scan_opportunity_hypotheses enable row level security;
alter table public.browser_extension_scan_user_decisions enable row level security;
alter table public.browser_extension_scan_errors enable row level security;

insert into public.browser_extension_release_versions(version,channel_key,status,manifest_version,minimum_gateway_version,minimum_schema_version,maximum_rollout_percent,release_notes)
values ('0.7.1','pilot','candidate',3,'0.7.1','scanner2',10,'Scanner Intelligence 2.0 Reality Recovery: account launchpad, multi-pass evidence scan, controlled same-domain research and guided account activation')
on conflict(version) do update set channel_key=excluded.channel_key,status=excluded.status,minimum_gateway_version=excluded.minimum_gateway_version,minimum_schema_version=excluded.minimum_schema_version,maximum_rollout_percent=excluded.maximum_rollout_percent,release_notes=excluded.release_notes,updated_at=now();

insert into public.browser_extension_feature_flags(flag_key,scope_type,scope_reference,enabled,rollout_percent,minimum_version,reason)
values
 ('browser_os.scanner_intelligence_2','global','*',true,100,'0.7.1','Evidence-backed multi-pass scanner and account launchpad'),
 ('browser_os.scanner_deep_research','global','*',true,100,'0.7.1','Controlled same-origin public-page research'),
 ('browser_os.scanner_governed_ai','global','*',false,0,'0.7.1','Enable only after a governed AI provider is configured and approved')
on conflict(flag_key) do update set enabled=excluded.enabled,rollout_percent=excluded.rollout_percent,minimum_version=excluded.minimum_version,reason=excluded.reason,updated_at=now();

update public.browser_extension_release_channels
set version='0.7.1', minimum_version='0.7.0', release_notes='Scanner Intelligence 2.0 Reality Recovery', updated_at=now()
where channel_key in ('development','internal','pilot');

insert into public.browser_extension_compatibility_matrix(extension_version,chrome_min_major,chrome_max_tested_major,gateway_min_version,schema_min_version,operating_system,status,notes)
values
 ('0.7.1',114,150,'0.7.1','scanner2','macOS','supported','Scanner 2.0 pilot; validate controlled same-domain fetch and adapters before stable promotion'),
 ('0.7.1',114,150,'0.7.1','scanner2','Windows','supported','Scanner 2.0 pilot; validate managed Chrome and network policy before stable promotion')
on conflict(extension_version,operating_system,chrome_min_major) do update set chrome_max_tested_major=excluded.chrome_max_tested_major,status=excluded.status,notes=excluded.notes;

commit;
