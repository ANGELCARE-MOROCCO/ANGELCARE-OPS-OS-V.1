do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'access_module_registry'
  ) then
    alter table public.access_module_registry enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'access_module_registry'
        and policyname = 'authenticated_read_access_module_registry'
    ) then
      create policy authenticated_read_access_module_registry
      on public.access_module_registry
      for select
      to authenticated
      using (true);
    end if;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'access_route_registry'
  ) then
    alter table public.access_route_registry enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'access_route_registry'
        and policyname = 'authenticated_read_access_route_registry'
    ) then
      create policy authenticated_read_access_route_registry
      on public.access_route_registry
      for select
      to authenticated
      using (true);
    end if;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'access_scan_runs'
  ) then
    alter table public.access_scan_runs enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'access_scan_runs'
        and policyname = 'authenticated_read_access_scan_runs'
    ) then
      create policy authenticated_read_access_scan_runs
      on public.access_scan_runs
      for select
      to authenticated
      using (true);
    end if;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'access_registry_events'
  ) then
    alter table public.access_registry_events enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'access_registry_events'
        and policyname = 'authenticated_read_access_registry_events'
    ) then
      create policy authenticated_read_access_registry_events
      on public.access_registry_events
      for select
      to authenticated
      using (true);
    end if;
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'access_role_templates'
  ) then
    alter table public.access_role_templates enable row level security;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'access_role_templates'
        and policyname = 'authenticated_read_access_role_templates'
    ) then
      create policy authenticated_read_access_role_templates
      on public.access_role_templates
      for select
      to authenticated
      using (true);
    end if;
  end if;
end
$$;
