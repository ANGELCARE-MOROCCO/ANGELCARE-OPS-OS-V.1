create table if not exists public.system_module_flags (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  module_label text not null,
  enabled boolean not null default true,
  status text not null default 'active',
  reason text,
  last_action text,
  updated_by uuid,
  updated_by_email text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_system_module_flags_module_key
on public.system_module_flags(module_key);

alter table public.system_module_flags enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_module_flags'
      and policyname = 'authenticated_read_system_module_flags'
  ) then
    create policy authenticated_read_system_module_flags
    on public.system_module_flags
    for select
    to authenticated
    using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'system_module_flags'
      and policyname = 'admin_write_system_module_flags'
  ) then
    create policy admin_write_system_module_flags
    on public.system_module_flags
    for all
    to authenticated
    using (
      exists (
        select 1
        from public.app_users u
        where u.id = auth.uid()
          and lower(coalesce(u.role, '')) in ('ceo', 'admin', 'super_admin', 'owner')
      )
    )
    with check (
      exists (
        select 1
        from public.app_users u
        where u.id = auth.uid()
          and lower(coalesce(u.role, '')) in ('ceo', 'admin', 'super_admin', 'owner')
      )
    );
  end if;
end
$$;

insert into public.system_module_flags (
  module_key,
  module_label,
  enabled,
  status,
  reason,
  last_action
)
values (
  'voice_terminal',
  'Voice Terminal',
  true,
  'active',
  'Default enabled runtime module.',
  'initialized'
)
on conflict (module_key)
do nothing;
