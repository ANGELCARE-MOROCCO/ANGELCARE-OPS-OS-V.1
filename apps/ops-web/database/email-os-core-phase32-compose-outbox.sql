create table if not exists email_os_core_outbound_messages (
  id text primary key,
  mailbox_id text,
  from_email text,
  to_email text not null,
  cc_email text,
  bcc_email text,
  subject text not null,
  body text not null,
  status text not null default 'queued',
  send_attempts integer not null default 0,
  last_error text,
  provider_message_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists email_os_core_saved_drafts (
  id text primary key,
  mailbox_id text,
  from_email text,
  to_email text,
  cc_email text,
  bcc_email text,
  subject text,
  body text,
  status text not null default 'draft',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_outbound_messages disable row level security;
alter table email_os_core_saved_drafts disable row level security;

create index if not exists email_os_core_outbound_status_idx on email_os_core_outbound_messages(status, created_at desc);
create index if not exists email_os_core_saved_drafts_updated_idx on email_os_core_saved_drafts(updated_at desc);
