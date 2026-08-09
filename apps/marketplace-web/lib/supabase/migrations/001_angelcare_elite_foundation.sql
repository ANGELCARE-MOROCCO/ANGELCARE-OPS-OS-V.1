-- AngelCare Global HR OS - elite foundation schema
create extension if not exists "uuid-ossp";
create table if not exists ac_regions (
  id uuid primary key default uuid_generate_v4(), name text not null, country text not null, city text,
  tier text not null default 'City', currency text not null default 'MAD', language text not null default 'fr',
  labor_rule_pack text not null default 'default', quality_floor int not null default 82, active boolean default true,
  created_at timestamptz default now()
);
create table if not exists ac_people (
  id uuid primary key default uuid_generate_v4(), region_id uuid references ac_regions(id), full_name text not null,
  role text not null, status text not null default 'Candidate', city text, languages text[] default '{}', service_eligibility text[] default '{}',
  reliability_score int default 0, behavior_score int default 0, emotional_intelligence int default 0, punctuality_score int default 0,
  client_rating numeric default 0, mission_count int default 0, incidents_90d int default 0, readiness_score int default 0, risk_level text default 'watch',
  supervisor text, last_review date, next_action text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists ac_skill_matrices (
  person_id uuid primary key references ac_people(id) on delete cascade,
  newborn_care int default 0, postpartum_support int default 0, special_needs int default 0, school_shadowing int default 0,
  hygiene_protocol int default 0, emergency_response int default 0, client_communication int default 0, emotional_regulation int default 0
);
create table if not exists ac_permissions (
  id uuid primary key default uuid_generate_v4(), role text not null, module text not null, action text not null,
  region_scope text not null default 'assigned', created_at timestamptz default now(), unique(role,module,action)
);
create table if not exists ac_audit_logs (
  id uuid primary key default uuid_generate_v4(), actor_id uuid, action text not null, entity_type text not null, entity_id text,
  region text, payload jsonb default '{}', created_at timestamptz default now()
);
create index if not exists idx_ac_people_status on ac_people(status);
create index if not exists idx_ac_people_risk on ac_people(risk_level);
