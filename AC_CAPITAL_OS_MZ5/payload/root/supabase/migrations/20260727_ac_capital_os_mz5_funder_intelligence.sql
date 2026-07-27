-- AC CAPITAL OS Mega ZIP 05 - Funder & Investor Intelligence Room
-- Contract token: MZ5_AC_CAPITAL_OS_FUNDER_INTELLIGENCE

create table if not exists ac_capital_funders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  funder_type text not null,
  country text,
  region text,
  funding_stage_focus text,
  sector_focus text[] default '{}',
  ticket_min numeric,
  ticket_max numeric,
  currency_label text default 'Unknown',
  website_url text,
  source_confidence integer default 0,
  angelcare_fit_score integer default 0,
  relationship_status text default 'Researching',
  relationship_temperature text default 'Cold',
  strategic_priority text default 'medium',
  recommended_narrative text,
  owner text,
  next_action text,
  next_action_due_date date,
  founder_level_approach boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_contacts (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  contact_name text not null,
  role_title text,
  email text,
  phone text,
  preferred_language text,
  communication_style text,
  relationship_status text,
  last_contact_at timestamptz,
  next_contact_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_relationship_events (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  event_date timestamptz default now(),
  event_type text not null,
  title text not null,
  summary text,
  owner text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_psychology_briefs (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  decision_style text,
  likely_priorities text[] default '{}',
  likely_concerns text[] default '{}',
  proof_required text[] default '{}',
  language_to_use text[] default '{}',
  language_to_avoid text[] default '{}',
  founder_level_required boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_objections (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  objection_title text not null,
  severity text not null,
  reason text,
  best_response text,
  required_proof text,
  owner text,
  related_document text,
  founder_review_required boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_narratives (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  narrative_type text not null,
  recommended_angle text,
  opening_message text,
  proof_to_emphasize text[] default '{}',
  numbers_to_mention_carefully text[] default '{}',
  risks_to_avoid_overclaiming text[] default '{}',
  documents_to_attach text[] default '{}',
  ideal_next_action text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_opportunity_links (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  radar_opportunity_id uuid,
  qualification_dossier_id uuid,
  opportunity_title text not null,
  radar_origin text,
  qualification_decision text,
  fit_score integer,
  status text,
  next_action text,
  created_at timestamptz not null default now()
);

create table if not exists ac_capital_funder_followup_actions (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references ac_capital_funders(id) on delete cascade,
  title text not null,
  priority text default 'medium',
  due_date date,
  owner text,
  action_type text,
  instruction text,
  status text default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
