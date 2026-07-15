alter table if exists public.hr_staff_profiles
  add column if not exists user_id uuid null,
  add column if not exists email text null,
  add column if not exists full_name text null,
  add column if not exists identity_status text default 'pending_identity',
  add column if not exists identity_source text default 'hr_staff_profiles',
  add column if not exists identity_linked_at timestamptz null;

create table if not exists public.hr_user_identity_contracts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid null references public.hr_staff_profiles(id) on delete cascade,
  user_id uuid null,
  email text null,
  full_name text null,
  source text default 'hr',
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(staff_id),
  unique(user_id)
);

insert into public.hr_user_identity_contracts (staff_id, user_id, email, full_name, source, status)
select
  s.id,
  s.user_id,
  lower(trim(s.email)),
  s.full_name,
  'hr_staff_profiles',
  case when s.user_id is not null then 'active' else 'missing_user_id' end
from public.hr_staff_profiles s
on conflict (staff_id) do update
set
  user_id = coalesce(excluded.user_id, public.hr_user_identity_contracts.user_id),
  email = coalesce(excluded.email, public.hr_user_identity_contracts.email),
  full_name = coalesce(excluded.full_name, public.hr_user_identity_contracts.full_name),
  updated_at = now();

update public.hr_staff_profiles s
set
  user_id = u.id,
  identity_status = 'linked',
  identity_source = 'auth_email_match',
  identity_linked_at = now()
from auth.users u
where s.user_id is null
  and s.email is not null
  and lower(trim(s.email)) = lower(trim(u.email));

insert into public.hr_user_identity_contracts (staff_id, user_id, email, full_name, source, status)
select
  s.id,
  s.user_id,
  lower(trim(s.email)),
  s.full_name,
  'auth_email_match',
  case when s.user_id is not null then 'active' else 'missing_user_id' end
from public.hr_staff_profiles s
on conflict (staff_id) do update
set
  user_id = coalesce(excluded.user_id, public.hr_user_identity_contracts.user_id),
  email = coalesce(excluded.email, public.hr_user_identity_contracts.email),
  full_name = coalesce(excluded.full_name, public.hr_user_identity_contracts.full_name),
  status = excluded.status,
  updated_at = now();

create or replace view public.v_hr_identity_contract_resolver as
select
  c.staff_id,
  c.user_id,
  c.email,
  c.full_name,
  s.department,
  s.position,
  s.city,
  c.source,
  c.status
from public.hr_user_identity_contracts c
left join public.hr_staff_profiles s on s.id = c.staff_id;

create or replace view public.v_hr_attendance_resolved_live as
select
  a.*,
  coalesce(s_direct.id, c.staff_id, il.staff_id) as resolved_staff_id,
  coalesce(s_direct.full_name, c.full_name, s_linked.full_name, il.label, 'Unmapped overhead identity') as resolved_staff_name,
  coalesce(s_direct.email, c.email, s_linked.email) as resolved_staff_email,
  coalesce(s_direct.department, c.department, s_linked.department, 'Unmapped department') as resolved_department,
  coalesce(s_direct.position, c.position, s_linked.position, 'Staff') as resolved_position,
  coalesce(s_direct.city, c.city, s_linked.city, 'Head Office') as resolved_city,
  case
    when s_direct.id is not null then 'direct_staff_id'
    when c.staff_id is not null then 'identity_contract'
    when s_linked.id is not null then 'identity_bridge'
    when il.id is not null then 'bridge_unmapped'
    else 'unmapped'
  end as identity_resolution_source
from public.hr_attendance_records a
left join public.hr_staff_profiles s_direct on s_direct.id = a.staff_id
left join public.v_hr_identity_contract_resolver c on c.user_id = a.user_id
left join public.hr_identity_links il
  on il.source = 'overhead_panel'
  and il.source_user_id = a.user_id
left join public.hr_staff_profiles s_linked on s_linked.id = il.staff_id;

update public.hr_attendance_records a
set staff_id = c.staff_id
from public.hr_user_identity_contracts c
where a.staff_id is null
  and a.user_id is not null
  and c.user_id = a.user_id
  and c.staff_id is not null;

update public.app_attendance_logs l
set staff_id = c.staff_id
from public.hr_user_identity_contracts c
where l.staff_id is null
  and l.user_id is not null
  and c.user_id = l.user_id
  and c.staff_id is not null;

create or replace function public.fn_hr_staff_identity_contract_upsert()
returns trigger
language plpgsql
as $$
begin
  insert into public.hr_user_identity_contracts (staff_id, user_id, email, full_name, source, status, updated_at)
  values (
    new.id,
    new.user_id,
    lower(trim(new.email)),
    new.full_name,
    coalesce(new.identity_source, 'hr_staff_profiles'),
    case when new.user_id is not null then 'active' else 'missing_user_id' end,
    now()
  )
  on conflict (staff_id) do update
  set
    user_id = excluded.user_id,
    email = excluded.email,
    full_name = excluded.full_name,
    source = excluded.source,
    status = excluded.status,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_hr_staff_identity_contract_upsert on public.hr_staff_profiles;
create trigger trg_hr_staff_identity_contract_upsert
after insert or update of user_id, email, full_name, identity_source
on public.hr_staff_profiles
for each row
execute function public.fn_hr_staff_identity_contract_upsert();

create or replace function public.fn_app_attendance_log_attach_staff()
returns trigger
language plpgsql
as $$
declare
  resolved_staff uuid;
begin
  if new.staff_id is null and new.user_id is not null then
    select staff_id into resolved_staff
    from public.hr_user_identity_contracts
    where user_id = new.user_id
    limit 1;

    if resolved_staff is not null then
      new.staff_id = resolved_staff;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_app_attendance_log_attach_staff on public.app_attendance_logs;
create trigger trg_app_attendance_log_attach_staff
before insert or update of user_id, staff_id
on public.app_attendance_logs
for each row
execute function public.fn_app_attendance_log_attach_staff();

create or replace function public.fn_hr_attendance_attach_staff()
returns trigger
language plpgsql
as $$
declare
  resolved_staff uuid;
begin
  if new.staff_id is null and new.user_id is not null then
    select staff_id into resolved_staff
    from public.hr_user_identity_contracts
    where user_id = new.user_id
    limit 1;

    if resolved_staff is not null then
      new.staff_id = resolved_staff;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_hr_attendance_attach_staff on public.hr_attendance_records;
create trigger trg_hr_attendance_attach_staff
before insert or update of user_id, staff_id
on public.hr_attendance_records
for each row
execute function public.fn_hr_attendance_attach_staff();

select status, count(*)
from public.hr_user_identity_contracts
group by status
order by count(*) desc;
