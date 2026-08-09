create table if not exists public.market_csv_import_queue (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.market_csv_sync_history (
  id uuid primary key default gen_random_uuid(),
  dataset text not null,
  sync_mode text not null,
  row_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.market_csv_import_queue enable row level security;
alter table public.market_csv_sync_history enable row level security;