create table if not exists email_os_core_deleted_records (
  id text primary key,
  entity text not null,
  record_id text not null,
  payload jsonb not null default '{}',
  deleted_by text,
  deleted_at timestamptz not null default now(),
  recovery_status text not null default 'recoverable'
);

create table if not exists email_os_core_retention_policies (
  id text primary key,
  entity text not null,
  policy_name text not null,
  retention_days integer not null default 365,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_deleted_records disable row level security;
alter table email_os_core_retention_policies disable row level security;

create index if not exists email_os_core_deleted_entity_idx on email_os_core_deleted_records(entity);
create index if not exists email_os_core_deleted_deleted_at_idx on email_os_core_deleted_records(deleted_at desc);
create index if not exists email_os_core_retention_entity_idx on email_os_core_retention_policies(entity);
