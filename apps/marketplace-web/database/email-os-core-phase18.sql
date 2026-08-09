create table if not exists email_os_core_credential_vault_refs (
  id text primary key,
  mailbox_credential_id text,
  vault_provider text not null default 'manual',
  vault_key text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_credential_rotations (
  id text primary key,
  mailbox_credential_id text not null,
  rotation_status text not null default 'scheduled',
  reason text,
  rotated_by text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists email_os_core_provider_failover_groups (
  id text primary key,
  name text not null,
  primary_provider_profile_id text,
  fallback_provider_profile_ids text[] not null default '{}',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_credential_vault_refs disable row level security;
alter table email_os_core_credential_rotations disable row level security;
alter table email_os_core_provider_failover_groups disable row level security;

create index if not exists email_os_core_vault_refs_credential_idx on email_os_core_credential_vault_refs(mailbox_credential_id);
create index if not exists email_os_core_rotations_credential_idx on email_os_core_credential_rotations(mailbox_credential_id);
create index if not exists email_os_core_failover_status_idx on email_os_core_provider_failover_groups(status);
