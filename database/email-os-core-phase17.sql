create table if not exists email_os_core_credential_tests (
  id text primary key,
  mailbox_credential_id text,
  provider_profile_id text,
  email_address text,
  test_type text not null,
  status text not null,
  error text,
  metadata jsonb not null default '{}',
  tested_at timestamptz not null default now()
);

alter table email_os_core_credential_tests disable row level security;

create index if not exists email_os_core_credential_tests_credential_idx on email_os_core_credential_tests(mailbox_credential_id);
create index if not exists email_os_core_credential_tests_tested_idx on email_os_core_credential_tests(tested_at desc);
