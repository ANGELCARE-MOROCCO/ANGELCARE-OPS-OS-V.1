-- EMAIL-OS CORE PHASE 28 — ENTERPRISE HARDENING MEGA PACK

-- A. EMAIL RELIABILITY

create table if not exists email_os_core_provider_failover_events (
  id text primary key,
  mailbox_id text,
  primary_provider_profile_id text,
  fallback_provider_profile_id text,
  failover_reason text,
  status text not null default 'pending',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_smtp_retry_policies (
  id text primary key,
  policy_name text not null,
  max_attempts integer not null default 5,
  initial_delay_seconds integer not null default 60,
  backoff_multiplier numeric not null default 2,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_imap_sync_checkpoints (
  id text primary key,
  mailbox_id text not null,
  provider_uid_validity text,
  last_uid text,
  last_synced_at timestamptz,
  status text not null default 'active',
  metadata jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_threading_rules (
  id text primary key,
  rule_name text not null,
  match_type text not null default 'subject_message_id',
  enabled boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_attachment_pipeline_jobs (
  id text primary key,
  attachment_id text,
  pipeline_status text not null default 'queued',
  scan_status text not null default 'pending',
  storage_status text not null default 'pending',
  error text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_spam_rules (
  id text primary key,
  rule_name text not null,
  rule_type text not null default 'keyword',
  pattern text not null,
  action text not null default 'flag',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- B. REALTIME INFRASTRUCTURE

create table if not exists email_os_core_realtime_channels (
  id text primary key,
  channel_key text not null unique,
  channel_type text not null default 'workspace',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_realtime_subscriptions (
  id text primary key,
  channel_key text not null,
  subscriber_key text not null,
  status text not null default 'active',
  last_seen_at timestamptz not null default now()
);

-- C. AI LAYER DEPTH

create table if not exists email_os_core_ai_memory (
  id text primary key,
  memory_type text not null,
  entity_type text,
  entity_id text,
  content text not null,
  embedding_ref text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_ai_workflow_plans (
  id text primary key,
  target_type text not null,
  target_id text,
  plan_status text not null default 'draft',
  objective text not null,
  steps jsonb not null default '[]',
  confidence_score numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_ai_copilot_actions (
  id text primary key,
  action_type text not null,
  target_type text,
  target_id text,
  proposed_by text not null default 'ai-copilot',
  approval_status text not null default 'pending',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create table if not exists email_os_core_ai_resolution_suggestions (
  id text primary key,
  thread_id text not null,
  resolution_type text not null default 'reply',
  suggestion text not null,
  confidence_score numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- D. SECURITY HARDENING

create table if not exists email_os_core_rbac_policies (
  id text primary key,
  role_key text not null,
  resource text not null,
  action text not null,
  effect text not null default 'allow',
  conditions jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_tenant_boundaries (
  id text primary key,
  tenant_key text not null,
  resource_type text not null,
  resource_id text not null,
  isolation_level text not null default 'tenant',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_security_audit_events (
  id text primary key,
  actor text,
  action text not null,
  resource text,
  decision text not null,
  reason text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_secret_vault_refs (
  id text primary key,
  secret_type text not null,
  entity_type text,
  entity_id text,
  vault_provider text not null default 'manual',
  vault_key text not null,
  rotation_due_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- E. UX / PRODUCT MATURITY

create table if not exists email_os_core_product_maturity_checks (
  id text primary key,
  check_key text not null unique,
  check_label text not null,
  check_area text not null,
  status text not null default 'pending',
  notes text,
  updated_at timestamptz not null default now()
);

alter table email_os_core_provider_failover_events disable row level security;
alter table email_os_core_smtp_retry_policies disable row level security;
alter table email_os_core_imap_sync_checkpoints disable row level security;
alter table email_os_core_threading_rules disable row level security;
alter table email_os_core_attachment_pipeline_jobs disable row level security;
alter table email_os_core_spam_rules disable row level security;
alter table email_os_core_realtime_channels disable row level security;
alter table email_os_core_realtime_subscriptions disable row level security;
alter table email_os_core_ai_memory disable row level security;
alter table email_os_core_ai_workflow_plans disable row level security;
alter table email_os_core_ai_copilot_actions disable row level security;
alter table email_os_core_ai_resolution_suggestions disable row level security;
alter table email_os_core_rbac_policies disable row level security;
alter table email_os_core_tenant_boundaries disable row level security;
alter table email_os_core_security_audit_events disable row level security;
alter table email_os_core_secret_vault_refs disable row level security;
alter table email_os_core_product_maturity_checks disable row level security;

create index if not exists email_os_core_failover_mailbox_idx on email_os_core_provider_failover_events(mailbox_id);
create index if not exists email_os_core_imap_checkpoint_mailbox_idx on email_os_core_imap_sync_checkpoints(mailbox_id);
create index if not exists email_os_core_realtime_channels_key_idx on email_os_core_realtime_channels(channel_key);
create index if not exists email_os_core_ai_memory_entity_idx on email_os_core_ai_memory(entity_type, entity_id);
create index if not exists email_os_core_rbac_role_idx on email_os_core_rbac_policies(role_key, resource, action);
create index if not exists email_os_core_security_audit_created_idx on email_os_core_security_audit_events(created_at desc);
