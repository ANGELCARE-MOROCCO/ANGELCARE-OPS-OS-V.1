create table if not exists email_os_core_mailbox_permissions (
  id text primary key,
  mailbox_id text not null,
  principal_type text not null default 'role',
  principal_id text not null,
  can_read boolean not null default true,
  can_compose boolean not null default false,
  can_send boolean not null default false,
  can_manage boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_access_profiles (
  id text primary key,
  name text not null,
  role_key text not null,
  description text,
  permissions jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_access_audit (
  id text primary key,
  principal_type text,
  principal_id text,
  action text not null,
  mailbox_id text,
  decision text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table email_os_core_mailbox_permissions disable row level security;
alter table email_os_core_access_profiles disable row level security;
alter table email_os_core_access_audit disable row level security;

create index if not exists email_os_core_mailbox_permissions_mailbox_idx on email_os_core_mailbox_permissions(mailbox_id);
create index if not exists email_os_core_mailbox_permissions_principal_idx on email_os_core_mailbox_permissions(principal_type, principal_id);
create index if not exists email_os_core_access_audit_created_idx on email_os_core_access_audit(created_at desc);
