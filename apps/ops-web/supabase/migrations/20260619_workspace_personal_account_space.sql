create table if not exists public.workspace_broadcast_memos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  memo_type text not null default 'memo',
  priority text not null default 'normal',
  status text not null default 'active',
  target_roles text[] not null default array[]::text[],
  target_user_ids uuid[] not null default array[]::uuid[],
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_broadcast_memo_receipts (
  id uuid primary key default gen_random_uuid(),
  memo_id uuid not null references public.workspace_broadcast_memos(id) on delete cascade,
  user_id uuid not null,
  acknowledged_at timestamptz,
  comment text,
  commented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (memo_id, user_id)
);

create index if not exists idx_workspace_broadcast_memos_status
on public.workspace_broadcast_memos(status, starts_at, expires_at);

create index if not exists idx_workspace_broadcast_memo_receipts_user
on public.workspace_broadcast_memo_receipts(user_id, memo_id);

alter table public.workspace_broadcast_memos enable row level security;
alter table public.workspace_broadcast_memo_receipts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_broadcast_memos'
      and policyname = 'authenticated_read_workspace_broadcast_memos'
  ) then
    create policy authenticated_read_workspace_broadcast_memos
    on public.workspace_broadcast_memos
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_broadcast_memo_receipts'
      and policyname = 'authenticated_read_own_workspace_broadcast_memo_receipts'
  ) then
    create policy authenticated_read_own_workspace_broadcast_memo_receipts
    on public.workspace_broadcast_memo_receipts
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_broadcast_memo_receipts'
      and policyname = 'authenticated_insert_workspace_broadcast_memo_receipts'
  ) then
    create policy authenticated_insert_workspace_broadcast_memo_receipts
    on public.workspace_broadcast_memo_receipts
    for insert
    to authenticated
    with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_broadcast_memo_receipts'
      and policyname = 'authenticated_update_workspace_broadcast_memo_receipts'
  ) then
    create policy authenticated_update_workspace_broadcast_memo_receipts
    on public.workspace_broadcast_memo_receipts
    for update
    to authenticated
    using (true)
    with check (true);
  end if;
end
$$;

insert into public.workspace_broadcast_memos (
  title,
  message,
  memo_type,
  priority,
  status,
  target_roles
)
select
  'Bienvenue dans votre espace personnel ANGELCARE',
  'Cet espace regroupe vos accès autorisés, vos informations professionnelles, les messages internes importants et les contacts directs avec le siège ANGELCARE.',
  'memo',
  'normal',
  'active',
  array[]::text[]
where not exists (
  select 1
  from public.workspace_broadcast_memos
  where title = 'Bienvenue dans votre espace personnel ANGELCARE'
);
