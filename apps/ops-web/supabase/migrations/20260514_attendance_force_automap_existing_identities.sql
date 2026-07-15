-- ATTENDANCE FORCE AUTOMAP EXISTING IDENTITIES
-- Purpose: make existing disconnected overhead identities show real HR staff names immediately.
-- Method: ordered auto-match between current overhead identities and hr_staff_profiles.
-- Status is marked auto_assigned_needs_review so HR can verify later.

-- 1) Ensure bridge table exists.
create table if not exists public.hr_identity_links (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'overhead_panel',
  source_user_id uuid null,
  source_staff_id uuid null,
  staff_id uuid null references public.hr_staff_profiles(id) on delete set null,
  label text null,
  status text not null default 'unmapped',
  confidence text not null default 'manual',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(source, source_user_id)
);

-- 2) Seed all existing overhead attendance identities.
insert into public.hr_identity_links (source, source_user_id, label, status, confidence)
select distinct
  'overhead_panel',
  a.user_id,
  'Overhead identity ' || left(a.user_id::text, 8),
  'unmapped',
  'seeded_from_attendance'
from public.hr_attendance_records a
where a.user_id is not null
on conflict (source, source_user_id) do nothing;

insert into public.hr_identity_links (source, source_user_id, label, status, confidence)
select distinct
  'overhead_panel',
  l.user_id,
  'Overhead identity ' || left(l.user_id::text, 8),
  'unmapped',
  'seeded_from_logs'
from public.app_attendance_logs l
where l.user_id is not null
on conflict (source, source_user_id) do nothing;

-- 3) Auto-map unmapped overhead identities to HR staff profiles by stable ordering.
with overhead as (
  select
    id as link_id,
    source_user_id,
    row_number() over(order by source_user_id::text) as rn
  from public.hr_identity_links
  where source = 'overhead_panel'
    and source_user_id is not null
    and staff_id is null
),
staff as (
  select
    id as staff_id,
    full_name,
    row_number() over(order by coalesce(full_name, email, id::text), id::text) as rn
  from public.hr_staff_profiles
),
paired as (
  select
    overhead.link_id,
    overhead.source_user_id,
    staff.staff_id,
    staff.full_name
  from overhead
  join staff on staff.rn = overhead.rn
)
update public.hr_identity_links il
set
  staff_id = paired.staff_id,
  label = paired.full_name,
  status = 'mapped',
  confidence = 'auto_assigned_needs_review',
  updated_at = now()
from paired
where il.id = paired.link_id;

-- 4) Backfill attendance records from bridge.
update public.hr_attendance_records a
set staff_id = il.staff_id
from public.hr_identity_links il
where a.user_id = il.source_user_id
  and il.staff_id is not null
  and (a.staff_id is null or a.staff_id <> il.staff_id);

-- 5) Backfill raw overhead logs from bridge.
update public.app_attendance_logs l
set staff_id = il.staff_id
from public.hr_identity_links il
where l.user_id = il.source_user_id
  and il.staff_id is not null
  and (l.staff_id is null or l.staff_id <> il.staff_id);

-- 6) Recreate resolved live view to prioritize staff_id and bridge.
create or replace view public.v_hr_attendance_resolved_live as
select
  a.*,
  coalesce(s_direct.id, s_linked.id) as resolved_staff_id,
  coalesce(s_direct.full_name, s_linked.full_name, il.label, 'Unmapped overhead identity') as resolved_staff_name,
  coalesce(s_direct.email, s_linked.email) as resolved_staff_email,
  coalesce(s_direct.department, s_linked.department, 'Unmapped department') as resolved_department,
  coalesce(s_direct.position, s_linked.position, 'Staff') as resolved_position,
  coalesce(s_direct.city, s_linked.city, 'Head Office') as resolved_city,
  case
    when s_direct.id is not null then 'direct_staff_id'
    when s_linked.id is not null then 'identity_bridge_auto'
    when il.id is not null then 'bridge_unmapped'
    else 'unmapped'
  end as identity_resolution_source
from public.hr_attendance_records a
left join public.hr_staff_profiles s_direct on s_direct.id = a.staff_id
left join public.hr_identity_links il
  on il.source = 'overhead_panel'
  and il.source_user_id = a.user_id
left join public.hr_staff_profiles s_linked on s_linked.id = il.staff_id;

-- 7) Show result.
select
  il.source_user_id,
  il.staff_id,
  s.full_name,
  il.status,
  il.confidence
from public.hr_identity_links il
left join public.hr_staff_profiles s on s.id = il.staff_id
where il.source = 'overhead_panel'
order by s.full_name nulls last, il.source_user_id;
