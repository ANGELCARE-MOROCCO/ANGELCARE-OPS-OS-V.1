-- ATTENDANCE FORCE IDENTITY BRIDGE FIX
-- This creates a permanent bridge between disconnected overhead-panel user_id values
-- and real HR staff profiles.

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

-- Seed identity links from existing disconnected attendance user IDs.
insert into public.hr_identity_links (source, source_user_id, label, status, confidence)
select distinct
  'overhead_panel',
  a.user_id,
  'Overhead identity ' || left(a.user_id::text, 8),
  'unmapped',
  'seeded'
from public.hr_attendance_records a
where a.user_id is not null
on conflict (source, source_user_id) do nothing;

-- Seed identity links from raw overhead punch logs too.
insert into public.hr_identity_links (source, source_user_id, label, status, confidence)
select distinct
  'overhead_panel',
  l.user_id,
  'Overhead identity ' || left(l.user_id::text, 8),
  'unmapped',
  'seeded'
from public.app_attendance_logs l
where l.user_id is not null
on conflict (source, source_user_id) do nothing;

-- Resolved attendance view.
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
    when s_linked.id is not null then 'identity_bridge'
    when il.id is not null then 'bridge_unmapped'
    else 'unmapped'
  end as identity_resolution_source
from public.hr_attendance_records a
left join public.hr_staff_profiles s_direct on s_direct.id = a.staff_id
left join public.hr_identity_links il
  on il.source = 'overhead_panel'
  and il.source_user_id = a.user_id
left join public.hr_staff_profiles s_linked on s_linked.id = il.staff_id;

-- Apply bridge staff_id into attendance once mapped.
update public.hr_attendance_records a
set staff_id = il.staff_id
from public.hr_identity_links il
where a.staff_id is null
  and a.user_id = il.source_user_id
  and il.staff_id is not null;

-- Same for raw logs.
update public.app_attendance_logs l
set staff_id = il.staff_id
from public.hr_identity_links il
where l.staff_id is null
  and l.user_id = il.source_user_id
  and il.staff_id is not null;

-- Optional emergency auto-link.
-- WARNING: This maps unmapped overhead identities to HR staff by row order.
-- Use only if you urgently need demo/production visual continuity and will verify later.
-- Uncomment to use:
--
-- with ids as (
--   select source_user_id, row_number() over(order by source_user_id) rn
--   from public.hr_identity_links
--   where source = 'overhead_panel' and staff_id is null
-- ),
-- staff as (
--   select id as staff_id, full_name, row_number() over(order by full_name, id) rn
--   from public.hr_staff_profiles
-- )
-- update public.hr_identity_links il
-- set staff_id = staff.staff_id,
--     label = staff.full_name,
--     status = 'mapped',
--     confidence = 'emergency_order_match',
--     updated_at = now()
-- from ids
-- join staff on staff.rn = ids.rn
-- where il.source_user_id = ids.source_user_id
--   and il.staff_id is null;
