create table if not exists email_os_core_mailboxes (id text primary key, name text not null, address text not null, provider text not null default 'smtp_imap', status text not null default 'active', owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists email_os_core_templates (id text primary key, name text not null, subject text, body text, category text default 'General', status text default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists email_os_core_threads (id text primary key, mailbox_id text, from_email text, subject text, preview text, status text default 'open', priority text default 'normal', owner text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists email_os_core_drafts (id text primary key, mailbox_id text, to_email text, subject text, body text, status text default 'draft', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists email_os_core_queue (id text primary key, type text not null default 'send', status text not null default 'queued', payload jsonb not null default '{}', attempts integer not null default 0, last_error text, scheduled_at timestamptz not null default now(), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists email_os_core_audit (id text primary key, action text not null, target_type text, target_id text, severity text not null default 'info', details jsonb not null default '{}', created_at timestamptz not null default now());
create table if not exists email_os_core_automation (id text primary key, name text not null, trigger text, action text, enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

alter table email_os_core_mailboxes disable row level security;
alter table email_os_core_templates disable row level security;
alter table email_os_core_threads disable row level security;
alter table email_os_core_drafts disable row level security;
alter table email_os_core_queue disable row level security;
alter table email_os_core_audit disable row level security;
alter table email_os_core_automation disable row level security;

create index if not exists email_os_core_mailboxes_updated_idx on email_os_core_mailboxes(updated_at desc);
create index if not exists email_os_core_templates_updated_idx on email_os_core_templates(updated_at desc);
create index if not exists email_os_core_threads_updated_idx on email_os_core_threads(updated_at desc);
create index if not exists email_os_core_queue_scheduled_idx on email_os_core_queue(scheduled_at desc);
create index if not exists email_os_core_audit_created_idx on email_os_core_audit(created_at desc);
create index if not exists email_os_core_automation_updated_idx on email_os_core_automation(updated_at desc);
