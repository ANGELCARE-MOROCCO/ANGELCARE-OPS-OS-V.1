
create table if not exists public.content_command_versions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  version_label text not null default 'v1.0',
  storage_path text,
  snapshot jsonb not null default '{}'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_command_uploads (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  file_name text not null,
  storage_bucket text not null default 'content-command-center',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.content_command_versions enable row level security;
alter table public.content_command_uploads enable row level security;

drop policy if exists "authenticated read content command versions" on public.content_command_versions;
create policy "authenticated read content command versions" on public.content_command_versions for select to authenticated using (true);

drop policy if exists "authenticated write content command versions" on public.content_command_versions;
create policy "authenticated write content command versions" on public.content_command_versions for all to authenticated using (true) with check (true);

drop policy if exists "authenticated read content command uploads" on public.content_command_uploads;
create policy "authenticated read content command uploads" on public.content_command_uploads for select to authenticated using (true);

drop policy if exists "authenticated write content command uploads" on public.content_command_uploads;
create policy "authenticated write content command uploads" on public.content_command_uploads for all to authenticated using (true) with check (true);
