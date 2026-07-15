alter table public.workspace_broadcast_memos
  add column if not exists situation_key text,
  add column if not exists situation_label text,
  add column if not exists template_key text,
  add column if not exists template_label text,
  add column if not exists admin_status text not null default 'open',
  add column if not exists reminder_count integer not null default 0,
  add column if not exists last_reminder_at timestamptz,
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid;

alter table public.workspace_broadcast_memo_receipts
  add column if not exists admin_response text,
  add column if not exists admin_responded_at timestamptz,
  add column if not exists followup_status text not null default 'open',
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid;

create index if not exists idx_workspace_broadcast_memos_admin_status
on public.workspace_broadcast_memos(admin_status, status, created_at desc);

create index if not exists idx_workspace_broadcast_memo_receipts_followup
on public.workspace_broadcast_memo_receipts(followup_status, commented_at);

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_broadcast_memos'
      and policyname = 'admin_insert_workspace_broadcast_memos'
  ) then
    create policy admin_insert_workspace_broadcast_memos
    on public.workspace_broadcast_memos
    for insert
    to authenticated
    with check (
      exists (
        select 1 from public.app_users u
        where u.id = auth.uid()
          and lower(coalesce(u.role, '')) in ('ceo', 'admin', 'super_admin', 'owner')
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workspace_broadcast_memos'
      and policyname = 'admin_update_workspace_broadcast_memos'
  ) then
    create policy admin_update_workspace_broadcast_memos
    on public.workspace_broadcast_memos
    for update
    to authenticated
    using (
      exists (
        select 1 from public.app_users u
        where u.id = auth.uid()
          and lower(coalesce(u.role, '')) in ('ceo', 'admin', 'super_admin', 'owner')
      )
    )
    with check (
      exists (
        select 1 from public.app_users u
        where u.id = auth.uid()
          and lower(coalesce(u.role, '')) in ('ceo', 'admin', 'super_admin', 'owner')
      )
    );
  end if;
end
$$;
