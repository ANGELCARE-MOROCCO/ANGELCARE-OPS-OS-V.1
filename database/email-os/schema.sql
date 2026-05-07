create extension if not exists pgcrypto;

create table if not exists email_os_mailboxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null unique,
  department text not null default 'General',
  owner text not null default 'Unassigned',
  provider text not null check (provider in ('google_workspace','microsoft_365','smtp_imap','shared_alias')) default 'smtp_imap',
  status text not null check (status in ('healthy','needs_setup','warning','restricted','disabled')) default 'needs_setup',
  inbound_count integer not null default 0,
  outbound_count integer not null default 0,
  unresolved_count integer not null default 0,
  sla_risk_count integer not null default 0,
  restricted boolean not null default false,
  signature text,
  routing_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_threads (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid references email_os_mailboxes(id) on delete set null,
  subject text not null,
  from_name text not null default '',
  from_email text not null default '',
  client_name text,
  department text,
  owner text,
  status text not null check (status in ('unassigned','assigned','waiting_client','waiting_internal','resolved','escalated','archived')) default 'unassigned',
  priority text not null check (priority in ('low','normal','high','critical')) default 'normal',
  sla_minutes_left integer,
  revenue_link text,
  partner_link text,
  tags text[] not null default '{}',
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references email_os_threads(id) on delete cascade,
  mailbox_id uuid references email_os_mailboxes(id) on delete set null,
  direction text not null check (direction in ('inbound','outbound','internal_note')),
  from_name text,
  from_email text,
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  subject text not null default '',
  body text not null default '',
  html_body text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists email_os_drafts (
  id uuid primary key default gen_random_uuid(),
  mailbox_id uuid references email_os_mailboxes(id) on delete set null,
  thread_id uuid references email_os_threads(id) on delete set null,
  to_email text not null,
  cc_emails text[] not null default '{}',
  subject text not null,
  body text not null,
  status text not null check (status in ('draft','approval_required','approved','queued','sent','blocked','failed')) default 'draft',
  approval_reason text,
  created_by text not null default 'Email OS Operator',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_permissions (
  id uuid primary key default gen_random_uuid(),
  user_label text not null,
  role text not null,
  department text not null,
  mailbox_id uuid references email_os_mailboxes(id) on delete cascade,
  can_read boolean not null default false,
  can_send boolean not null default false,
  can_approve boolean not null default false,
  can_admin boolean not null default false,
  temporary_until timestamptz
);

create table if not exists email_os_queue (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  mailbox_id uuid references email_os_mailboxes(id) on delete set null,
  thread_id uuid references email_os_threads(id) on delete set null,
  draft_id uuid references email_os_drafts(id) on delete set null,
  state text not null check (state in ('queued','running','failed','completed','paused')) default 'queued',
  retry_count integer not null default 0,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_audit (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'Email OS Operator',
  action text not null,
  target_type text not null,
  target_id text,
  result text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists email_os_configuration (
  id text primary key default 'email-os-config-main',
  provider_mode text not null default 'mixed',
  default_sla_minutes integer not null default 240,
  retry_limit integer not null default 3,
  audit_retention_days integer not null default 365,
  approval_policy text not null default 'Restricted mailboxes require approval.',
  routing_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into email_os_configuration (id) values ('email-os-config-main') on conflict (id) do nothing;
