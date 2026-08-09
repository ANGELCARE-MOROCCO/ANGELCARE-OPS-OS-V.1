create table if not exists email_os_core_mailboxes (
  id text primary key,
  name text not null,
  email_address text not null,
  provider text,
  provider_profile_id text,
  status text default 'active',
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists email_os_core_outbox (
  id text primary key,
  mailbox_id text,
  to_email text,
  cc_email text,
  bcc_email text,
  subject text,
  body text,
  status text default 'queued',
  provider_message_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
