-- EMAIL-OS CORE PHASE 33 — BULK MAILBOX PREINSTALL
-- Menara provider + AngelCare mailbox seed.
-- NOTE: This stores credential values for immediate local testing.
-- For production, move passwords to a proper secret vault and rotate after validation.

create table if not exists email_os_core_provider_profiles (
  id text primary key,
  name text not null,
  provider_key text,
  provider_mode text not null default 'smtp_imap',
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean not null default false,
  imap_host text,
  imap_port integer,
  imap_secure boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_mailboxes (
  id text primary key,
  name text not null,
  address text,
  provider text not null default 'smtp_imap',
  status text not null default 'active',
  owner text not null default 'operations',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_mailbox_credentials (
  id text primary key,
  mailbox_id text,
  provider_profile_id text,
  email_address text,
  username text,
  password_ref text,
  status text not null default 'active',
  last_tested_at timestamptz,
  last_test_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_provider_profiles disable row level security;
alter table email_os_core_mailboxes disable row level security;
alter table email_os_core_mailbox_credentials disable row level security;


insert into email_os_core_provider_profiles (
  id,
  name,
  provider_key,
  provider_mode,
  smtp_host,
  smtp_port,
  smtp_secure,
  imap_host,
  imap_port,
  imap_secure,
  status,
  created_at,
  updated_at
)
values (
  'provider_menara_default',
  'Menara Maroc Telecom',
  'menara',
  'smtp_imap',
  'smtp-auth.menara.ma',
  587,
  false,
  'imap.menara.ma',
  993,
  true,
  'active',
  now(),
  now()
)
on conflict (id) do update set
  name = excluded.name,
  provider_key = excluded.provider_key,
  provider_mode = excluded.provider_mode,
  smtp_host = excluded.smtp_host,
  smtp_port = excluded.smtp_port,
  smtp_secure = excluded.smtp_secure,
  imap_host = excluded.imap_host,
  imap_port = excluded.imap_port,
  imap_secure = excluded.imap_secure,
  status = excluded.status,
  updated_at = now();


insert into email_os_core_mailboxes (
  id,
  name,
  address,
  provider,
  status,
  owner,
  created_at,
  updated_at
)
values
(
  'mbx_supports_angelcare_ma',
  'Support Inbox',
  'supports@angelcare.ma',
  'smtp_imap',
  'active',
  'support',
  now(),
  now()
),
(
  'mbx_ops_angelcare_ma',
  'Operations Inbox',
  'ops@angelcare.ma',
  'smtp_imap',
  'active',
  'operations',
  now(),
  now()
),
(
  'mbx_rh_angelcare_ma',
  'HR Inbox',
  'rh@angelcare.ma',
  'smtp_imap',
  'active',
  'hr',
  now(),
  now()
),
(
  'mbx_commercial_angelcare_ma',
  'Commercial Inbox',
  'Commercial@angelcare.ma',
  'smtp_imap',
  'active',
  'commercial',
  now(),
  now()
),
(
  'mbx_academy_angelcare_ma',
  'Academy Inbox',
  'Academy@angelcare.ma',
  'smtp_imap',
  'active',
  'academy',
  now(),
  now()
),
(
  'mbx_montessori_angelcare_ma',
  'Montessori Inbox',
  'montessori@angelcare.ma',
  'smtp_imap',
  'active',
  'academy',
  now(),
  now()
),
(
  'mbx_flashcartes_angelcare_ma',
  'Flashcartes Inbox',
  'flashcartes@angelcare.ma',
  'smtp_imap',
  'active',
  'academy',
  now(),
  now()
),
(
  'mbx_it_support_angelcare_ma',
  'IT Support Inbox',
  'it.support@angelcare.ma',
  'smtp_imap',
  'active',
  'it',
  now(),
  now()
),
(
  'mbx_homeservice_angelcare_ma',
  'Home Service Inbox',
  'Homeservice@angelcare.ma',
  'smtp_imap',
  'active',
  'operations',
  now(),
  now()
),
(
  'mbx_events_angelcare_ma',
  'Events Inbox',
  'events@angelcare.ma',
  'smtp_imap',
  'active',
  'events',
  now(),
  now()
),
(
  'mbx_exursions_angelcare_ma',
  'Excursions Inbox',
  'exursions@angelcare.ma',
  'smtp_imap',
  'active',
  'events',
  now(),
  now()
),
(
  'mbx_b2b_angelcare_ma',
  'B2B Inbox',
  'b2b@angelcare.ma',
  'smtp_imap',
  'active',
  'sales',
  now(),
  now()
),
(
  'mbx_partenaires_angelcare_ma',
  'Partners Inbox',
  'partenaires@angelcare.ma',
  'smtp_imap',
  'active',
  'partnerships',
  now(),
  now()
)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  provider = excluded.provider,
  status = excluded.status,
  owner = excluded.owner,
  updated_at = now();

insert into email_os_core_mailbox_credentials (
  id,
  mailbox_id,
  provider_profile_id,
  email_address,
  username,
  password_ref,
  status,
  last_tested_at,
  last_test_status,
  created_at,
  updated_at
)
values
(
  'cred_supports_angelcare_ma',
  'mbx_supports_angelcare_ma',
  'provider_menara_default',
  'supports@angelcare.ma',
  'supports@angelcare.ma',
  '60dkz2hg',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_ops_angelcare_ma',
  'mbx_ops_angelcare_ma',
  'provider_menara_default',
  'ops@angelcare.ma',
  'ops@angelcare.ma',
  'ei7qkh5t',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_rh_angelcare_ma',
  'mbx_rh_angelcare_ma',
  'provider_menara_default',
  'rh@angelcare.ma',
  'rh@angelcare.ma',
  'a4cuxrxz',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_commercial_angelcare_ma',
  'mbx_commercial_angelcare_ma',
  'provider_menara_default',
  'Commercial@angelcare.ma',
  'Commercial@angelcare.ma',
  'h4zut7hh',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_academy_angelcare_ma',
  'mbx_academy_angelcare_ma',
  'provider_menara_default',
  'Academy@angelcare.ma',
  'Academy@angelcare.ma',
  'a3kd5p3c',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_montessori_angelcare_ma',
  'mbx_montessori_angelcare_ma',
  'provider_menara_default',
  'montessori@angelcare.ma',
  'montessori@angelcare.ma',
  'nrgaiojx',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_flashcartes_angelcare_ma',
  'mbx_flashcartes_angelcare_ma',
  'provider_menara_default',
  'flashcartes@angelcare.ma',
  'flashcartes@angelcare.ma',
  '8c2blnqf',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_it_support_angelcare_ma',
  'mbx_it_support_angelcare_ma',
  'provider_menara_default',
  'it.support@angelcare.ma',
  'it.support@angelcare.ma',
  'ltd5yx0j',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_homeservice_angelcare_ma',
  'mbx_homeservice_angelcare_ma',
  'provider_menara_default',
  'Homeservice@angelcare.ma',
  'Homeservice@angelcare.ma',
  'sjp6eddv',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_events_angelcare_ma',
  'mbx_events_angelcare_ma',
  'provider_menara_default',
  'events@angelcare.ma',
  'events@angelcare.ma',
  '362u4p3z',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_exursions_angelcare_ma',
  'mbx_exursions_angelcare_ma',
  'provider_menara_default',
  'exursions@angelcare.ma',
  'exursions@angelcare.ma',
  'dvtwqqrk',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_b2b_angelcare_ma',
  'mbx_b2b_angelcare_ma',
  'provider_menara_default',
  'b2b@angelcare.ma',
  'b2b@angelcare.ma',
  'igaloqjz',
  'active',
  null,
  null,
  now(),
  now()
),
(
  'cred_partenaires_angelcare_ma',
  'mbx_partenaires_angelcare_ma',
  'provider_menara_default',
  'partenaires@angelcare.ma',
  'partenaires@angelcare.ma',
  '2sj50qtg',
  'active',
  null,
  null,
  now(),
  now()
)
on conflict (id) do update set
  mailbox_id = excluded.mailbox_id,
  provider_profile_id = excluded.provider_profile_id,
  email_address = excluded.email_address,
  username = excluded.username,
  password_ref = excluded.password_ref,
  status = excluded.status,
  updated_at = now();

create index if not exists email_os_core_mailboxes_address_idx on email_os_core_mailboxes(address);
create index if not exists email_os_core_mailbox_credentials_email_idx on email_os_core_mailbox_credentials(email_address);
create index if not exists email_os_core_mailbox_credentials_mailbox_idx on email_os_core_mailbox_credentials(mailbox_id);
