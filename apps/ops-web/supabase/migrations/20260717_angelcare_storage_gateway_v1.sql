begin;

create table if not exists public.angelcare_storage_files (
  id text primary key,
  module_key text not null,
  mailbox_id text null,
  entity_type text not null,
  entity_id text null,
  original_filename text not null,
  safe_filename text not null,
  content_type text null,
  size_bytes bigint not null,
  sha256_hash text not null,
  storage_provider text not null default 'windows_node',
  storage_node text not null default 'angelcare-windows-node-01',
  storage_bucket text not null,
  storage_key text not null,
  status text not null default 'active',
  created_by text null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz null,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.angelcare_storage_events (
  id text primary key,
  file_id text references public.angelcare_storage_files(id) on delete set null,
  action text not null,
  module_key text not null,
  actor_user_id text null,
  ip_address text null,
  user_agent text null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.angelcare_storage_quotas (
  id text primary key,
  module_key text not null,
  quota_bytes bigint not null,
  warning_threshold_bytes bigint not null,
  critical_threshold_bytes bigint not null,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists angelcare_storage_files_module_idx
  on public.angelcare_storage_files (module_key, created_at desc);

create index if not exists angelcare_storage_files_mailbox_idx
  on public.angelcare_storage_files (mailbox_id, created_at desc);

create index if not exists angelcare_storage_files_entity_idx
  on public.angelcare_storage_files (module_key, entity_type, entity_id);

create index if not exists angelcare_storage_files_status_idx
  on public.angelcare_storage_files (status, deleted_at, created_at desc);

create index if not exists angelcare_storage_files_hash_idx
  on public.angelcare_storage_files (sha256_hash);

create index if not exists angelcare_storage_events_file_idx
  on public.angelcare_storage_events (file_id, created_at desc);

create index if not exists angelcare_storage_events_module_idx
  on public.angelcare_storage_events (module_key, created_at desc);

create index if not exists angelcare_storage_quotas_module_idx
  on public.angelcare_storage_quotas (module_key, created_at desc);

alter table public.angelcare_storage_files replica identity full;
alter table public.angelcare_storage_events replica identity full;
alter table public.angelcare_storage_quotas replica identity full;

commit;
