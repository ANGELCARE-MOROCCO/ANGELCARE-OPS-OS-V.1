create table if not exists email_os_core_search_index (
  id text primary key,
  entity text not null,
  entity_id text not null,
  title text,
  body text,
  keywords text[],
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_os_core_saved_searches (
  id text primary key,
  name text not null,
  query text not null,
  filters jsonb not null default '{}',
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table email_os_core_search_index disable row level security;
alter table email_os_core_saved_searches disable row level security;

create index if not exists email_os_core_search_index_entity_idx on email_os_core_search_index(entity, entity_id);
create index if not exists email_os_core_saved_searches_owner_idx on email_os_core_saved_searches(owner);
