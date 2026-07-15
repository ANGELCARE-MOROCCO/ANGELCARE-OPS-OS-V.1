create table if not exists email_os_core_provider_profiles (
  id text primary key,
  name text not null,
  provider_type text not null default 'smtp_imap',
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean default false,
  imap_host text,
  imap_port integer,
  imap_secure boolean default true,
  is_default boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_mailbox_credentials (
  id text primary key,
  mailbox_id text not null,
  provider_profile_id text,
  email_address text not null,
  username text not null,
  password_ref text,
  auth_mode text not null default 'password',
  status text not null default 'active',
  last_tested_at timestamptz,
  last_test_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_provider_profiles disable row level security;
alter table email_os_core_mailbox_credentials disable row level security;

create index if not exists email_os_core_provider_profiles_default_idx on email_os_core_provider_profiles(is_default);
create index if not exists email_os_core_mailbox_credentials_mailbox_idx on email_os_core_mailbox_credentials(mailbox_id);
create index if not exists email_os_core_mailbox_credentials_email_idx on email_os_core_mailbox_credentials(email_address);
