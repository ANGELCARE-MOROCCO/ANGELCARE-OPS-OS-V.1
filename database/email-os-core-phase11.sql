create table if not exists email_os_core_saved_views (
  id text primary key,
  name text not null,
  entity text not null default 'threads',
  filters jsonb not null default '{}',
  owner text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_saved_views disable row level security;

create index if not exists email_os_core_saved_views_entity_idx on email_os_core_saved_views(entity);
create index if not exists email_os_core_saved_views_owner_idx on email_os_core_saved_views(owner);
