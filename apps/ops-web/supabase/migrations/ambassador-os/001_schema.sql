-- Ambassador OS Core Infrastructure Schema
-- Review before running in Supabase.

create extension if not exists pgcrypto;

create table if not exists ambassador_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  city text not null,
  tier text not null default 'bronze',
  status text not null default 'active',
  health_score integer not null default 75,
  manager_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ambassador_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  campaign_name text not null,
  city text not null,
  status text not null default 'draft',
  priority text not null default 'medium',
  assigned_ambassador_id uuid references ambassador_profiles(id) on delete set null,
  due_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ambassador_proofs (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references ambassador_profiles(id) on delete cascade,
  mission_id uuid references ambassador_missions(id) on delete cascade,
  proof_url text not null,
  status text not null default 'pending',
  quality_score integer default 0,
  risk_flags jsonb not null default '[]',
  reviewer_id uuid,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ambassador_rewards (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references ambassador_profiles(id) on delete cascade,
  mission_id uuid references ambassador_missions(id) on delete set null,
  reward_type text not null,
  amount_mad numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references ambassador_profiles(id) on delete cascade,
  amount_mad numeric not null,
  status text not null default 'pending',
  finance_owner_id uuid,
  approval_notes text,
  payment_reference text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ambassador_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  entity_type text not null,
  entity_id text not null,
  actor_id uuid,
  actor_role text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists ambassador_audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id text not null,
  action text not null,
  actor_id uuid,
  actor_role text not null,
  summary text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists ambassador_ai_memory (
  id uuid primary key default gen_random_uuid(),
  memory_type text not null,
  source_module text not null,
  entity_id text,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists ambassador_ai_actions (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  action_type text not null,
  recommendation text not null,
  confidence_score integer not null,
  risk_level text not null,
  human_approval_required boolean not null default true,
  approval_status text not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ambassador_execution_jobs (
  id uuid primary key default gen_random_uuid(),
  queue_name text not null,
  job_type text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists ambassador_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid,
  channel text not null,
  template_key text not null,
  payload jsonb not null default '{}',
  status text not null default 'queued',
  provider_message_id text,
  sent_at timestamptz,
  failed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);
