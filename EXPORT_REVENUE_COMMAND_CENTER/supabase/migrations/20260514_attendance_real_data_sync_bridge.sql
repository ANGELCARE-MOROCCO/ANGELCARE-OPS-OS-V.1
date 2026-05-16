-- ATTENDANCE REAL DATA SYNC BRIDGE
-- Purpose: diagnose and backfill attendance → staff identity mapping.

-- 1) Diagnostic view: shows unmapped attendance records.
create or replace view public.v_hr_attendance_identity_diagnostics as
select
  a.id as attendance_id,
  a.staff_id as attendance_staff_id,
  a.user_id as attendance_user_id,
  a.profile_id as attendance_profile_id,
  a.work_date,
  a.status,
  a.validation_status,
  s.id as resolved_staff_id,
  s.full_name as resolved_staff_name,
  s.email as resolved_staff_email,
  s.department as resolved_department,
  s.position as resolved_position,
  s.city as resolved_city,
  case
    when s.id is not null then 'resolved'
    when a.staff_id is null and a.user_id is null and a.profile_id is null then 'missing_all_identity_keys'
    when a.staff_id is not null then 'staff_id_not_found'
    when a.user_id is not null then 'user_id_not_found'
    when a.profile_id is not null then 'profile_id_not_found'
    else 'unmapped'
  end as mapping_status
from public.hr_attendance_records a
left join public.hr_staff_profiles s
  on s.id = a.staff_id
  or s.user_id = a.user_id
  or s.profile_id = a.profile_id;

-- 2) Diagnostic view for raw overhead panel punch logs.
create or replace view public.v_app_attendance_log_identity_diagnostics as
select
  l.id as log_id,
  l.staff_id as log_staff_id,
  l.user_id as log_user_id,
  l.event_type,
  l.event_at,
  l.source,
  s.id as resolved_staff_id,
  s.full_name as resolved_staff_name,
  s.email as resolved_staff_email,
  s.department as resolved_department,
  s.position as resolved_position,
  s.city as resolved_city,
  case
    when s.id is not null then 'resolved'
    when l.staff_id is null and l.user_id is null then 'missing_identity_keys'
    when l.staff_id is not null then 'staff_id_not_found'
    when l.user_id is not null then 'user_id_not_found'
    else 'unmapped'
  end as mapping_status
from public.app_attendance_logs l
left join public.hr_staff_profiles s
  on s.id = l.staff_id
  or s.user_id = l.user_id;

-- 3) Safe backfill: populate attendance staff_id from matched user_id/profile_id.
update public.hr_attendance_records a
set staff_id = s.id
from public.hr_staff_profiles s
where a.staff_id is null
  and (
    (a.user_id is not null and s.user_id = a.user_id)
    or (a.profile_id is not null and s.profile_id = a.profile_id)
  );

-- 4) Safe backfill: populate raw logs staff_id from matched user_id.
update public.app_attendance_logs l
set staff_id = s.id
from public.hr_staff_profiles s
where l.staff_id is null
  and l.user_id is not null
  and s.user_id = l.user_id;

-- 5) Quick counts.
select mapping_status, count(*)
from public.v_hr_attendance_identity_diagnostics
group by mapping_status
order by count(*) desc;
