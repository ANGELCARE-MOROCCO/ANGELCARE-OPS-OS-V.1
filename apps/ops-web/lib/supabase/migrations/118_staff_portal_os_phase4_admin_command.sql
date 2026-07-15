create extension if not exists pgcrypto;

alter table staff_control_memos add column if not exists target_role text;
alter table staff_control_memos add column if not exists target_department text;
alter table staff_control_memos add column if not exists created_by uuid;
alter table staff_control_memos add column if not exists updated_at timestamptz not null default now();

alter table staff_service_requests add column if not exists assigned_to uuid;
alter table staff_service_requests add column if not exists response text;
alter table staff_service_requests add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_staff_control_memos_target_role_phase4 on staff_control_memos(target_role);
create index if not exists idx_staff_control_memos_target_department_phase4 on staff_control_memos(target_department);
create index if not exists idx_staff_service_requests_priority_phase4 on staff_service_requests(priority);

select 'Staff Portal OS Phase 4 admin command installed' as result;
