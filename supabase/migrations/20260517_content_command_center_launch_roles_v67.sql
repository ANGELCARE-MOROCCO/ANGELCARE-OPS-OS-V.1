
create table if not exists public.content_command_members (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  display_name text,
  role text not null default 'viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique(user_email)
);

alter table public.content_command_members enable row level security;

drop policy if exists "authenticated read content command members" on public.content_command_members;
create policy "authenticated read content command members" on public.content_command_members for select to authenticated using (true);

drop policy if exists "authenticated write content command members" on public.content_command_members;
create policy "authenticated write content command members" on public.content_command_members for all to authenticated using (true) with check (true);

insert into public.content_command_members (user_email, display_name, role, status)
values ('info.artab@yahoo.com', 'Kyle Lon', 'admin', 'active')
on conflict (user_email) do update set role = excluded.role, status = excluded.status;
