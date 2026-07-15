-- AngelCare 360 Phase 2G - Tasks, Approvals, Workflows & Operations Runtime
-- Ref: AC360-PH2G-TASKS-APPROVALS-WORKFLOWS-OPS-2026-06-30
-- Scope: backend/system-only operational workflow runtime. No school operations UI pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2F school ops runtime.

begin;

create extension if not exists pgcrypto;

-- Compatibility safety inherited from Phase 1D/1E lineage.
alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. Tasks, approvals, workflows and operations runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_task_boards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  board_key text not null,
  label text not null,
  department text,
  board_type text not null default 'operations',
  status text not null default 'active',
  owner_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, board_key),
  check (board_type in ('operations','admissions','finance','attendance','hr','parent_relation','classroom','maintenance','compliance','custom')),
  check (status in ('active','paused','locked','archived'))
);

create table if not exists public.ac360_school_task_status_transitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  task_id uuid not null references public.ac360_school_tasks(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  check (to_status in ('planned','in_progress','blocked','done','cancelled','archived'))
);

create table if not exists public.ac360_school_task_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  task_id uuid not null references public.ac360_school_tasks(id) on delete cascade,
  comment_type text not null default 'note',
  body text not null,
  visibility text not null default 'internal',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (comment_type in ('note','status_update','blocker','resolution','handover','approval_note','system')),
  check (visibility in ('internal','management','parent_visible','staff_visible','system'))
);

create table if not exists public.ac360_school_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  task_id uuid not null references public.ac360_school_tasks(id) on delete cascade,
  item_key text not null,
  label text not null,
  status text not null default 'open',
  position integer not null default 100,
  completed_by uuid,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(task_id, item_key),
  check (status in ('open','done','blocked','cancelled','archived'))
);

create table if not exists public.ac360_school_recurring_task_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  rule_key text not null,
  label text not null,
  department text,
  cadence text not null default 'weekly',
  next_run_on date,
  last_run_on date,
  task_template_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, rule_key),
  check (cadence in ('daily','weekly','monthly','quarterly','annual','manual')),
  check (status in ('active','paused','inactive','archived'))
);

create table if not exists public.ac360_school_approval_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  policy_key text not null,
  label text not null,
  approval_type text not null default 'generic',
  applies_to_entity_type text,
  min_approvals integer not null default 1,
  approver_role_keys text[] not null default '{}',
  status text not null default 'active',
  created_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, policy_key),
  check (approval_type in ('generic','finance_adjustment','student_archive','document_review','attendance_correction','task_completion','workflow_gate','purchase','parent_issue','custom')),
  check (status in ('active','paused','inactive','archived'))
);

create table if not exists public.ac360_school_approval_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  policy_id uuid references public.ac360_school_approval_policies(id) on delete set null,
  request_code text not null,
  approval_type text not null default 'generic',
  related_entity_type text,
  related_entity_id uuid,
  title text not null,
  request_note text,
  status text not null default 'pending',
  requested_by uuid,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, request_code),
  check (status in ('pending','approved','rejected','cancelled','expired','archived'))
);

create table if not exists public.ac360_school_approval_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  approval_request_id uuid not null references public.ac360_school_approval_requests(id) on delete cascade,
  decision text not null,
  decision_note text,
  decided_by uuid,
  decided_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  check (decision in ('approved','rejected','cancelled','commented'))
);

create table if not exists public.ac360_school_workflow_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_key text not null,
  label text not null,
  workflow_type text not null default 'operations',
  version_number integer not null default 1,
  steps_json jsonb not null default '[]'::jsonb,
  status text not null default 'draft',
  created_by uuid,
  published_by uuid,
  published_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, template_key),
  check (workflow_type in ('operations','admissions','finance','attendance','parent_issue','hr','document','transport','custom')),
  check (status in ('draft','published','inactive','archived'))
);

create table if not exists public.ac360_school_workflow_instances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  template_id uuid references public.ac360_school_workflow_templates(id) on delete set null,
  instance_code text not null,
  workflow_type text not null default 'operations',
  related_entity_type text,
  related_entity_id uuid,
  title text not null,
  status text not null default 'running',
  current_step_key text,
  started_by uuid,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, instance_code),
  check (status in ('running','paused','blocked','completed','cancelled','archived'))
);

create table if not exists public.ac360_school_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  workflow_instance_id uuid not null references public.ac360_school_workflow_instances(id) on delete cascade,
  step_key text not null,
  label text not null,
  status text not null default 'pending',
  position integer not null default 100,
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workflow_instance_id, step_key),
  check (status in ('pending','running','blocked','completed','skipped','cancelled'))
);

create table if not exists public.ac360_school_workflow_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  workflow_instance_id uuid references public.ac360_school_workflow_instances(id) on delete cascade,
  workflow_step_id uuid references public.ac360_school_workflow_steps(id) on delete set null,
  event_key text not null,
  event_type text not null default 'status_change',
  actor_app_user_id uuid,
  message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ac360_school_operations_tickets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  ticket_code text not null,
  ticket_type text not null default 'operations',
  title text not null,
  description text,
  severity text not null default 'medium',
  status text not null default 'open',
  related_entity_type text,
  related_entity_id uuid,
  assigned_staff_id uuid references public.ac360_school_staff_profiles(id) on delete set null,
  opened_by uuid,
  opened_at timestamptz not null default now(),
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, ticket_code),
  check (ticket_type in ('operations','maintenance','parent_issue','finance','attendance','safety','staff','classroom','system','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','in_progress','blocked','resolved','dismissed','archived'))
);

create table if not exists public.ac360_school_operations_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  snapshot_date date not null default current_date,
  source_key text not null default 'manual_reconcile',
  open_task_count integer not null default 0,
  overdue_task_count integer not null default 0,
  blocked_task_count integer not null default 0,
  pending_approval_count integer not null default 0,
  running_workflow_count integer not null default 0,
  open_ticket_count integer not null default 0,
  critical_ticket_count integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, campus_id, snapshot_date, source_key)
);

create table if not exists public.ac360_school_operations_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid references public.ac360_campuses(id) on delete set null,
  task_id uuid references public.ac360_school_tasks(id) on delete set null,
  approval_request_id uuid references public.ac360_school_approval_requests(id) on delete set null,
  workflow_instance_id uuid references public.ac360_school_workflow_instances(id) on delete set null,
  ticket_id uuid references public.ac360_school_operations_tickets(id) on delete set null,
  alert_code text not null,
  alert_type text not null default 'operations_attention',
  severity text not null default 'medium',
  status text not null default 'open',
  title text not null,
  message text,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_code),
  check (alert_type in ('task_overdue','task_blocked','approval_pending','workflow_blocked','ticket_critical','operations_attention','custom')),
  check (severity in ('low','medium','high','critical')),
  check (status in ('open','in_progress','resolved','dismissed','archived'))
);

-- Extend Phase 2A base task table without breaking previous data.
alter table if exists public.ac360_school_tasks
  add column if not exists board_id uuid references public.ac360_school_task_boards(id) on delete set null,
  add column if not exists start_at timestamptz,
  add column if not exists blocked_reason text,
  add column if not exists approval_request_id uuid references public.ac360_school_approval_requests(id) on delete set null,
  add column if not exists workflow_instance_id uuid references public.ac360_school_workflow_instances(id) on delete set null,
  add column if not exists source_rule_id uuid references public.ac360_school_recurring_task_rules(id) on delete set null;

-- -----------------------------------------------------------------------------
-- 2. Indexes / updated_at triggers / RLS
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_task_boards_org_status on public.ac360_school_task_boards(org_id, status, board_type);
create index if not exists idx_ac360_task_transitions_task on public.ac360_school_task_status_transitions(task_id, changed_at desc);
create index if not exists idx_ac360_task_comments_task on public.ac360_school_task_comments(task_id, created_at desc);
create index if not exists idx_ac360_task_checklist_task on public.ac360_school_task_checklist_items(task_id, status, position);
create index if not exists idx_ac360_recurring_rules_org_status on public.ac360_school_recurring_task_rules(org_id, status, cadence);
create index if not exists idx_ac360_approval_policies_org_status on public.ac360_school_approval_policies(org_id, status, approval_type);
create index if not exists idx_ac360_approval_requests_org_status on public.ac360_school_approval_requests(org_id, status, approval_type);
create index if not exists idx_ac360_workflow_templates_org_status on public.ac360_school_workflow_templates(org_id, status, workflow_type);
create index if not exists idx_ac360_workflow_instances_org_status on public.ac360_school_workflow_instances(org_id, status, workflow_type);
create index if not exists idx_ac360_workflow_steps_instance on public.ac360_school_workflow_steps(workflow_instance_id, status, position);
create index if not exists idx_ac360_operations_tickets_org_status on public.ac360_school_operations_tickets(org_id, status, severity);
create index if not exists idx_ac360_operations_alerts_org_status on public.ac360_school_operations_alerts(org_id, status, severity);

create index if not exists idx_ac360_school_tasks_board_status on public.ac360_school_tasks(board_id, status, priority);
create index if not exists idx_ac360_school_tasks_due_open on public.ac360_school_tasks(org_id, due_at) where status in ('planned','in_progress','blocked');

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_task_boards','ac360_school_task_comments','ac360_school_task_checklist_items','ac360_school_recurring_task_rules',
    'ac360_school_approval_policies','ac360_school_approval_requests','ac360_school_workflow_templates','ac360_school_workflow_instances',
    'ac360_school_workflow_steps','ac360_school_operations_tickets','ac360_school_operations_alerts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_task_boards','ac360_school_task_status_transitions','ac360_school_task_comments','ac360_school_task_checklist_items','ac360_school_recurring_task_rules',
    'ac360_school_approval_policies','ac360_school_approval_requests','ac360_school_approval_decisions','ac360_school_workflow_templates','ac360_school_workflow_instances',
    'ac360_school_workflow_steps','ac360_school_workflow_events','ac360_school_operations_tickets','ac360_school_operations_snapshots','ac360_school_operations_alerts'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. RPCs: dashboard and operations runtime
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_workflows_dashboard(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_as_of_date date default current_date
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2g_tasks_approvals_workflows_operations',
    'uiBuildAllowed', false,
    'counts', jsonb_build_object(
      'boards', (select count(*) from public.ac360_school_task_boards where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='active'),
      'openTasks', (select count(*) from public.ac360_school_tasks where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('planned','in_progress','blocked')),
      'overdueTasks', (select count(*) from public.ac360_school_tasks where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('planned','in_progress','blocked') and due_at is not null and due_at < now()),
      'pendingApprovals', (select count(*) from public.ac360_school_approval_requests where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='pending'),
      'runningWorkflows', (select count(*) from public.ac360_school_workflow_instances where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('running','paused','blocked')),
      'openTickets', (select count(*) from public.ac360_school_operations_tickets where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('open','in_progress','blocked')),
      'openAlerts', (select count(*) from public.ac360_school_operations_alerts where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('open','in_progress'))
    ),
    'latestSnapshot', (select to_jsonb(s) from public.ac360_school_operations_snapshots s where s.org_id=p_org_id and (p_campus_id is null or s.campus_id=p_campus_id) order by s.created_at desc limit 1),
    'recentAlerts', coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select * from public.ac360_school_operations_alerts where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) order by created_at desc limit 10) a), '[]'::jsonb)
  );
end;
$$;

create or replace function public.ac360_school_upsert_task_board(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_board_key text default null,
  p_label text default null,
  p_department text default null,
  p_board_type text default 'operations',
  p_status text default 'active',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_board public.ac360_school_task_boards%rowtype; v_key text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  v_key := coalesce(nullif(trim(p_board_key),''), lower(regexp_replace(coalesce(p_label,'operations-board'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_task_boards(org_id,campus_id,board_key,label,department,board_type,status,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),'Operations Board'),p_department,coalesce(p_board_type,'operations'),coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id, board_key) do update set label=excluded.label, department=excluded.department, board_type=excluded.board_type, status=excluded.status, metadata_json=public.ac360_school_task_boards.metadata_json || excluded.metadata_json, updated_at=now()
  returning * into v_board;
  insert into public.ac360_school_operation_events(org_id,campus_id,event_key,action_key,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json)
  values(p_org_id,p_campus_id,'school_ops.task_board.upserted','school.task.board.upsert','task_board',v_board.id,'info','Task board upserted.',p_actor_app_user_id,jsonb_build_object('phase','phase_2g'));
  return jsonb_build_object('ok',true,'board',to_jsonb(v_board));
end;
$$;

create or replace function public.ac360_school_update_task_status(
  p_org_id uuid,
  p_task_id uuid,
  p_to_status text,
  p_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare v_task public.ac360_school_tasks%rowtype; v_from text;
begin
  if p_org_id is null or p_task_id is null then raise exception 'p_org_id and p_task_id are required'; end if;
  select * into v_task from public.ac360_school_tasks where id=p_task_id and org_id=p_org_id for update;
  if v_task.id is null then raise exception 'Task not found'; end if;
  v_from := v_task.status;
  update public.ac360_school_tasks set status=p_to_status, blocked_reason=case when p_to_status='blocked' then p_reason else blocked_reason end, completed_at=case when p_to_status='done' then now() else completed_at end, updated_at=now() where id=p_task_id returning * into v_task;
  insert into public.ac360_school_task_status_transitions(org_id,task_id,from_status,to_status,reason,changed_by,metadata_json) values(p_org_id,p_task_id,v_from,p_to_status,p_reason,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  insert into public.ac360_school_operation_events(org_id,campus_id,event_key,action_key,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,v_task.campus_id,'school_ops.task.status_changed','school.task.status.update','task',v_task.id,'info','Task status updated from '||coalesce(v_from,'none')||' to '||p_to_status||'.',p_actor_app_user_id,jsonb_build_object('phase','phase_2g'));
  return jsonb_build_object('ok',true,'task',to_jsonb(v_task),'fromStatus',v_from,'toStatus',p_to_status);
end;
$$;

create or replace function public.ac360_school_add_task_comment(
  p_org_id uuid,
  p_task_id uuid,
  p_body text,
  p_comment_type text default 'note',
  p_visibility text default 'internal',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_comment public.ac360_school_task_comments%rowtype; v_campus uuid;
begin
  if p_org_id is null or p_task_id is null then raise exception 'p_org_id and p_task_id are required'; end if;
  select campus_id into v_campus from public.ac360_school_tasks where id=p_task_id and org_id=p_org_id;
  if v_campus is null and not exists(select 1 from public.ac360_school_tasks where id=p_task_id and org_id=p_org_id) then raise exception 'Task not found'; end if;
  insert into public.ac360_school_task_comments(org_id,task_id,comment_type,body,visibility,created_by,metadata_json) values(p_org_id,p_task_id,coalesce(p_comment_type,'note'),coalesce(p_body,''),coalesce(p_visibility,'internal'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_comment;
  insert into public.ac360_school_operation_events(org_id,campus_id,event_key,action_key,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,v_campus,'school_ops.task.comment_added','school.task.comment.add','task_comment',v_comment.id,'info','Task comment added.',p_actor_app_user_id,jsonb_build_object('phase','phase_2g','taskId',p_task_id));
  return jsonb_build_object('ok',true,'comment',to_jsonb(v_comment));
end; $$;

create or replace function public.ac360_school_upsert_task_checklist_item(
  p_org_id uuid,
  p_task_id uuid,
  p_item_key text default null,
  p_label text default null,
  p_status text default 'open',
  p_position integer default 100,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_item public.ac360_school_task_checklist_items%rowtype; v_key text; v_campus uuid;
begin
  if p_org_id is null or p_task_id is null then raise exception 'p_org_id and p_task_id are required'; end if;
  select campus_id into v_campus from public.ac360_school_tasks where id=p_task_id and org_id=p_org_id;
  v_key := coalesce(nullif(trim(p_item_key),''),'item-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_task_checklist_items(org_id,task_id,item_key,label,status,position,completed_by,completed_at,metadata_json)
  values(p_org_id,p_task_id,v_key,coalesce(nullif(trim(p_label),''),'Checklist item'),coalesce(p_status,'open'),coalesce(p_position,100),case when p_status='done' then p_actor_app_user_id else null end,case when p_status='done' then now() else null end,coalesce(p_metadata,'{}'::jsonb))
  on conflict(task_id,item_key) do update set label=excluded.label,status=excluded.status,position=excluded.position,completed_by=case when excluded.status='done' then excluded.completed_by else public.ac360_school_task_checklist_items.completed_by end,completed_at=case when excluded.status='done' then coalesce(public.ac360_school_task_checklist_items.completed_at,now()) else null end,metadata_json=public.ac360_school_task_checklist_items.metadata_json || excluded.metadata_json,updated_at=now()
  returning * into v_item;
  insert into public.ac360_school_operation_events(org_id,campus_id,event_key,action_key,entity_type,entity_id,severity,message,actor_app_user_id,metadata_json) values(p_org_id,v_campus,'school_ops.task.checklist_upserted','school.task.checklist.upsert','task_checklist_item',v_item.id,'info','Task checklist item upserted.',p_actor_app_user_id,jsonb_build_object('phase','phase_2g','taskId',p_task_id));
  return jsonb_build_object('ok',true,'item',to_jsonb(v_item));
end; $$;

create or replace function public.ac360_school_create_recurring_task_rule(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_rule_key text default null,
  p_label text default null,
  p_department text default null,
  p_cadence text default 'weekly',
  p_next_run_on date default null,
  p_task_template jsonb default '{}'::jsonb,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_rule public.ac360_school_recurring_task_rules%rowtype; v_key text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  v_key := coalesce(nullif(trim(p_rule_key),''),'rule-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_recurring_task_rules(org_id,campus_id,rule_key,label,department,cadence,next_run_on,task_template_json,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),'Recurring task rule'),p_department,coalesce(p_cadence,'weekly'),coalesce(p_next_run_on,current_date),coalesce(p_task_template,'{}'::jsonb),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,rule_key) do update set label=excluded.label,department=excluded.department,cadence=excluded.cadence,next_run_on=excluded.next_run_on,task_template_json=excluded.task_template_json,metadata_json=public.ac360_school_recurring_task_rules.metadata_json || excluded.metadata_json,updated_at=now()
  returning * into v_rule;
  return jsonb_build_object('ok',true,'rule',to_jsonb(v_rule));
end; $$;

create or replace function public.ac360_school_generate_recurring_tasks(
  p_org_id uuid,
  p_rule_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_rule record; v_task public.ac360_school_tasks%rowtype; v_count integer := 0; v_code text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  for v_rule in select * from public.ac360_school_recurring_task_rules where org_id=p_org_id and status='active' and (p_rule_id is null or id=p_rule_id) loop
    v_code := 'TASK-REC-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,6);
    insert into public.ac360_school_tasks(org_id,campus_id,task_code,title,description,department,status,priority,assigned_staff_id,due_at,created_by,source_rule_id,metadata_json)
    values(v_rule.org_id,v_rule.campus_id,v_code,coalesce(v_rule.task_template_json->>'title',v_rule.label),v_rule.task_template_json->>'description',coalesce(v_rule.department,v_rule.task_template_json->>'department'),'planned',coalesce(v_rule.task_template_json->>'priority','medium'),null,(current_date + interval '1 day')::timestamptz,p_actor_app_user_id,v_rule.id,jsonb_build_object('generatedFromRule',v_rule.rule_key,'phase','phase_2g') || coalesce(p_metadata,'{}'::jsonb)) returning * into v_task;
    update public.ac360_school_recurring_task_rules set last_run_on=current_date, next_run_on=case cadence when 'daily' then current_date + 1 when 'weekly' then current_date + 7 when 'monthly' then (current_date + interval '1 month')::date when 'quarterly' then (current_date + interval '3 months')::date when 'annual' then (current_date + interval '1 year')::date else next_run_on end, updated_at=now() where id=v_rule.id;
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('ok',true,'generatedCount',v_count);
end; $$;

create or replace function public.ac360_school_upsert_approval_policy(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_policy_key text default null,
  p_label text default null,
  p_approval_type text default 'generic',
  p_applies_to_entity_type text default null,
  p_min_approvals integer default 1,
  p_approver_role_keys text[] default '{}',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_policy public.ac360_school_approval_policies%rowtype; v_key text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  v_key := coalesce(nullif(trim(p_policy_key),''),'policy-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_approval_policies(org_id,campus_id,policy_key,label,approval_type,applies_to_entity_type,min_approvals,approver_role_keys,created_by,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),'Approval Policy'),coalesce(p_approval_type,'generic'),p_applies_to_entity_type,greatest(coalesce(p_min_approvals,1),1),coalesce(p_approver_role_keys,'{}'::text[]),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,policy_key) do update set label=excluded.label,approval_type=excluded.approval_type,applies_to_entity_type=excluded.applies_to_entity_type,min_approvals=excluded.min_approvals,approver_role_keys=excluded.approver_role_keys,metadata_json=public.ac360_school_approval_policies.metadata_json || excluded.metadata_json,updated_at=now()
  returning * into v_policy;
  return jsonb_build_object('ok',true,'policy',to_jsonb(v_policy));
end; $$;

create or replace function public.ac360_school_request_approval(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_policy_key text default null,
  p_request_code text default null,
  p_approval_type text default 'generic',
  p_related_entity_type text default null,
  p_related_entity_id uuid default null,
  p_title text default null,
  p_request_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_req public.ac360_school_approval_requests%rowtype; v_policy_id uuid; v_code text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  select id into v_policy_id from public.ac360_school_approval_policies where org_id=p_org_id and policy_key=p_policy_key limit 1;
  v_code := coalesce(nullif(trim(p_request_code),''),'APR-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,6));
  insert into public.ac360_school_approval_requests(org_id,campus_id,policy_id,request_code,approval_type,related_entity_type,related_entity_id,title,request_note,requested_by,metadata_json)
  values(p_org_id,p_campus_id,v_policy_id,v_code,coalesce(p_approval_type,'generic'),p_related_entity_type,p_related_entity_id,coalesce(nullif(trim(p_title),''),'Approval Request'),p_request_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_req;
  return jsonb_build_object('ok',true,'approvalRequest',to_jsonb(v_req));
end; $$;

create or replace function public.ac360_school_decide_approval(
  p_org_id uuid,
  p_approval_request_id uuid,
  p_decision text,
  p_decision_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_req public.ac360_school_approval_requests%rowtype; v_dec public.ac360_school_approval_decisions%rowtype;
begin
  if p_org_id is null or p_approval_request_id is null then raise exception 'p_org_id and p_approval_request_id are required'; end if;
  select * into v_req from public.ac360_school_approval_requests where id=p_approval_request_id and org_id=p_org_id for update;
  if v_req.id is null then raise exception 'Approval request not found'; end if;
  insert into public.ac360_school_approval_decisions(org_id,approval_request_id,decision,decision_note,decided_by,metadata_json) values(p_org_id,p_approval_request_id,p_decision,p_decision_note,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_dec;
  if p_decision in ('approved','rejected','cancelled') then update public.ac360_school_approval_requests set status=p_decision, decided_at=now(), updated_at=now() where id=p_approval_request_id returning * into v_req; end if;
  return jsonb_build_object('ok',true,'approvalRequest',to_jsonb(v_req),'decision',to_jsonb(v_dec));
end; $$;

create or replace function public.ac360_school_upsert_workflow_template(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_template_key text default null,
  p_label text default null,
  p_workflow_type text default 'operations',
  p_steps_json jsonb default '[]'::jsonb,
  p_status text default 'draft',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_tpl public.ac360_school_workflow_templates%rowtype; v_key text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  v_key := coalesce(nullif(trim(p_template_key),''),'workflow-'||substr(gen_random_uuid()::text,1,8));
  insert into public.ac360_school_workflow_templates(org_id,campus_id,template_key,label,workflow_type,steps_json,status,created_by,published_by,published_at,metadata_json)
  values(p_org_id,p_campus_id,v_key,coalesce(nullif(trim(p_label),''),'Workflow Template'),coalesce(p_workflow_type,'operations'),coalesce(p_steps_json,'[]'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,case when p_status='published' then p_actor_app_user_id else null end,case when p_status='published' then now() else null end,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,template_key) do update set label=excluded.label,workflow_type=excluded.workflow_type,steps_json=excluded.steps_json,status=excluded.status,published_by=excluded.published_by,published_at=excluded.published_at,metadata_json=public.ac360_school_workflow_templates.metadata_json || excluded.metadata_json,updated_at=now()
  returning * into v_tpl;
  return jsonb_build_object('ok',true,'template',to_jsonb(v_tpl));
end; $$;

create or replace function public.ac360_school_start_workflow_instance(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_template_key text default null,
  p_instance_code text default null,
  p_workflow_type text default 'operations',
  p_related_entity_type text default null,
  p_related_entity_id uuid default null,
  p_title text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_tpl public.ac360_school_workflow_templates%rowtype; v_inst public.ac360_school_workflow_instances%rowtype; v_code text; v_steps jsonb; v_step jsonb; v_pos int := 10; v_first text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  select * into v_tpl from public.ac360_school_workflow_templates where org_id=p_org_id and template_key=p_template_key limit 1;
  v_steps := coalesce(v_tpl.steps_json, '[]'::jsonb);
  if jsonb_typeof(v_steps) <> 'array' then v_steps := '[]'::jsonb; end if;
  v_code := coalesce(nullif(trim(p_instance_code),''),'WF-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,6));
  insert into public.ac360_school_workflow_instances(org_id,campus_id,template_id,instance_code,workflow_type,related_entity_type,related_entity_id,title,status,started_by,metadata_json)
  values(p_org_id,p_campus_id,v_tpl.id,v_code,coalesce(p_workflow_type,v_tpl.workflow_type,'operations'),p_related_entity_type,p_related_entity_id,coalesce(nullif(trim(p_title),''),coalesce(v_tpl.label,'Workflow Instance')),'running',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_inst;
  for v_step in select * from jsonb_array_elements(v_steps) loop
    if v_first is null then v_first := coalesce(v_step->>'key','step-'||v_pos); end if;
    insert into public.ac360_school_workflow_steps(org_id,workflow_instance_id,step_key,label,status,position,metadata_json) values(p_org_id,v_inst.id,coalesce(v_step->>'key','step-'||v_pos),coalesce(v_step->>'label',v_step->>'key','Step'),'pending',coalesce((v_step->>'position')::int,v_pos),v_step);
    v_pos := v_pos + 10;
  end loop;
  update public.ac360_school_workflow_instances set current_step_key=v_first where id=v_inst.id returning * into v_inst;
  insert into public.ac360_school_workflow_events(org_id,workflow_instance_id,event_key,event_type,actor_app_user_id,message,metadata_json) values(p_org_id,v_inst.id,'workflow.started','status_change',p_actor_app_user_id,'Workflow instance started.',jsonb_build_object('phase','phase_2g'));
  return jsonb_build_object('ok',true,'workflowInstance',to_jsonb(v_inst));
end; $$;

create or replace function public.ac360_school_advance_workflow_step(
  p_org_id uuid,
  p_workflow_instance_id uuid,
  p_step_key text,
  p_status text default 'completed',
  p_message text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_step public.ac360_school_workflow_steps%rowtype; v_next text; v_inst public.ac360_school_workflow_instances%rowtype;
begin
  if p_org_id is null or p_workflow_instance_id is null or p_step_key is null then raise exception 'p_org_id, p_workflow_instance_id and p_step_key are required'; end if;
  update public.ac360_school_workflow_steps set status=p_status, started_at=coalesce(started_at,now()), completed_at=case when p_status in ('completed','skipped','cancelled') then now() else completed_at end, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now() where org_id=p_org_id and workflow_instance_id=p_workflow_instance_id and step_key=p_step_key returning * into v_step;
  if v_step.id is null then raise exception 'Workflow step not found'; end if;
  select step_key into v_next from public.ac360_school_workflow_steps where workflow_instance_id=p_workflow_instance_id and position > v_step.position and status='pending' order by position asc limit 1;
  update public.ac360_school_workflow_instances set current_step_key=v_next, status=case when v_next is null and p_status in ('completed','skipped') then 'completed' else status end, completed_at=case when v_next is null and p_status in ('completed','skipped') then now() else completed_at end, updated_at=now() where id=p_workflow_instance_id and org_id=p_org_id returning * into v_inst;
  insert into public.ac360_school_workflow_events(org_id,workflow_instance_id,workflow_step_id,event_key,event_type,actor_app_user_id,message,metadata_json) values(p_org_id,p_workflow_instance_id,v_step.id,'workflow.step.'||p_status,'step_change',p_actor_app_user_id,p_message,coalesce(p_metadata,'{}'::jsonb));
  return jsonb_build_object('ok',true,'workflowInstance',to_jsonb(v_inst),'step',to_jsonb(v_step));
end; $$;

create or replace function public.ac360_school_record_workflow_event(
  p_org_id uuid,
  p_workflow_instance_id uuid default null,
  p_workflow_step_id uuid default null,
  p_event_key text default 'workflow.event',
  p_event_type text default 'status_change',
  p_message text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_event public.ac360_school_workflow_events%rowtype;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  insert into public.ac360_school_workflow_events(org_id,workflow_instance_id,workflow_step_id,event_key,event_type,actor_app_user_id,message,metadata_json) values(p_org_id,p_workflow_instance_id,p_workflow_step_id,coalesce(p_event_key,'workflow.event'),coalesce(p_event_type,'status_change'),p_actor_app_user_id,p_message,coalesce(p_metadata,'{}'::jsonb)) returning * into v_event;
  return jsonb_build_object('ok',true,'event',to_jsonb(v_event));
end; $$;

create or replace function public.ac360_school_open_operation_ticket(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_ticket_code text default null,
  p_ticket_type text default 'operations',
  p_title text default null,
  p_description text default null,
  p_severity text default 'medium',
  p_related_entity_type text default null,
  p_related_entity_id uuid default null,
  p_assigned_staff_id uuid default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_ticket public.ac360_school_operations_tickets%rowtype; v_code text;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  v_code := coalesce(nullif(trim(p_ticket_code),''),'OPS-'||to_char(now(),'YYYYMMDDHH24MISS')||'-'||substr(gen_random_uuid()::text,1,6));
  insert into public.ac360_school_operations_tickets(org_id,campus_id,ticket_code,ticket_type,title,description,severity,related_entity_type,related_entity_id,assigned_staff_id,opened_by,metadata_json)
  values(p_org_id,p_campus_id,v_code,coalesce(p_ticket_type,'operations'),coalesce(nullif(trim(p_title),''),'Operations Ticket'),p_description,coalesce(p_severity,'medium'),p_related_entity_type,p_related_entity_id,p_assigned_staff_id,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_ticket;
  return jsonb_build_object('ok',true,'ticket',to_jsonb(v_ticket));
end; $$;

create or replace function public.ac360_school_resolve_operation_ticket(
  p_org_id uuid,
  p_ticket_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_ticket public.ac360_school_operations_tickets%rowtype;
begin
  if p_org_id is null or p_ticket_id is null then raise exception 'p_org_id and p_ticket_id are required'; end if;
  update public.ac360_school_operations_tickets set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), resolution_note=p_resolution_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_ticket_id and org_id=p_org_id returning * into v_ticket;
  if v_ticket.id is null then raise exception 'Ticket not found'; end if;
  return jsonb_build_object('ok',true,'ticket',to_jsonb(v_ticket));
end; $$;

create or replace function public.ac360_school_reconcile_operations(
  p_org_id uuid,
  p_campus_id uuid default null,
  p_source_key text default 'manual_reconcile',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_snapshot public.ac360_school_operations_snapshots%rowtype; v_overdue integer; v_blocked integer; v_pending integer; v_running integer; v_open_tickets integer; v_critical integer;
begin
  if p_org_id is null then raise exception 'p_org_id is required'; end if;
  select count(*) into v_overdue from public.ac360_school_tasks where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('planned','in_progress','blocked') and due_at is not null and due_at < now();
  select count(*) into v_blocked from public.ac360_school_tasks where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='blocked';
  select count(*) into v_pending from public.ac360_school_approval_requests where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status='pending';
  select count(*) into v_running from public.ac360_school_workflow_instances where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('running','paused','blocked');
  select count(*) into v_open_tickets from public.ac360_school_operations_tickets where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('open','in_progress','blocked');
  select count(*) into v_critical from public.ac360_school_operations_tickets where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('open','in_progress','blocked') and severity='critical';
  insert into public.ac360_school_operations_snapshots(org_id,campus_id,snapshot_date,source_key,open_task_count,overdue_task_count,blocked_task_count,pending_approval_count,running_workflow_count,open_ticket_count,critical_ticket_count,metadata_json)
  values(p_org_id,p_campus_id,current_date,coalesce(p_source_key,'manual_reconcile'),(select count(*) from public.ac360_school_tasks where org_id=p_org_id and (p_campus_id is null or campus_id=p_campus_id) and status in ('planned','in_progress','blocked')),v_overdue,v_blocked,v_pending,v_running,v_open_tickets,v_critical,coalesce(p_metadata,'{}'::jsonb))
  on conflict(org_id,campus_id,snapshot_date,source_key) do update set open_task_count=excluded.open_task_count,overdue_task_count=excluded.overdue_task_count,blocked_task_count=excluded.blocked_task_count,pending_approval_count=excluded.pending_approval_count,running_workflow_count=excluded.running_workflow_count,open_ticket_count=excluded.open_ticket_count,critical_ticket_count=excluded.critical_ticket_count,metadata_json=public.ac360_school_operations_snapshots.metadata_json || excluded.metadata_json,created_at=now()
  returning * into v_snapshot;
  if v_overdue > 0 then
    insert into public.ac360_school_operations_alerts(org_id,campus_id,alert_code,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'OPS-OVERDUE-'||current_date,'task_overdue','high','Overdue school operations tasks',v_overdue::text || ' open tasks are overdue.',jsonb_build_object('count',v_overdue,'phase','phase_2g'))
    on conflict(org_id,alert_code) do update set status='open',message=excluded.message,updated_at=now();
  end if;
  if v_critical > 0 then
    insert into public.ac360_school_operations_alerts(org_id,campus_id,alert_code,alert_type,severity,title,message,metadata_json)
    values(p_org_id,p_campus_id,'OPS-CRITICAL-TICKETS-'||current_date,'ticket_critical','critical','Critical operations tickets open',v_critical::text || ' critical tickets require resolution.',jsonb_build_object('count',v_critical,'phase','phase_2g'))
    on conflict(org_id,alert_code) do update set status='open',message=excluded.message,updated_at=now();
  end if;
  return jsonb_build_object('ok',true,'snapshot',to_jsonb(v_snapshot));
end; $$;

create or replace function public.ac360_school_resolve_operations_alert(
  p_org_id uuid,
  p_alert_id uuid,
  p_resolution_note text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer as $$
declare v_alert public.ac360_school_operations_alerts%rowtype;
begin
  if p_org_id is null or p_alert_id is null then raise exception 'p_org_id and p_alert_id are required'; end if;
  update public.ac360_school_operations_alerts set status='resolved', resolved_by=p_actor_app_user_id, resolved_at=now(), resolution_note=p_resolution_note, metadata_json=metadata_json || coalesce(p_metadata,'{}'::jsonb), updated_at=now() where id=p_alert_id and org_id=p_org_id returning * into v_alert;
  if v_alert.id is null then raise exception 'Operations alert not found'; end if;
  return jsonb_build_object('ok',true,'alert',to_jsonb(v_alert));
end; $$;

-- -----------------------------------------------------------------------------
-- 4. Feature/action registry and action wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,status,metadata_json)
values
('tasks_advanced','tasks','Tasks & Operations','Advanced school tasks','Task boards, comments, checklists, status transitions and recurring tasks.','access',false,true,false,'automation_run',0,'active','{"phase":"phase_2g","growth_menu":true}'::jsonb),
('approvals_workflows','operations','Tasks & Operations','Approvals and workflows','Approval policies, approval requests, workflow templates and workflow instances.','access',false,true,false,'automation_run',0,'active','{"phase":"phase_2g","growth_menu":true}'::jsonb),
('operations_runtime','operations','Tasks & Operations','Daily operations runtime','Operations tickets, snapshots, alerts and reconciliation.','access',true,true,false,'automation_run',0,'active','{"phase":"phase_2g"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,default_meter_key=excluded.default_meter_key,default_credit_cost=excluded.default_credit_cost,status=excluded.status,metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json)
values
('school.task.board.upsert','tasks_advanced','AC360-ENG-52','Upsert task board','Create or update school operations task board.','tasks.advanced',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.task.status.update','tasks_advanced','AC360-ENG-52','Update task status','Move a school task across status states.','tasks.update',null,0,'block','{"phase":"phase_2g"}'::jsonb),
('school.task.comment.add','tasks_advanced','AC360-ENG-52','Add task comment','Add note, blocker, handover or resolution comment.','tasks.advanced',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.task.checklist.upsert','tasks_advanced','AC360-ENG-52','Upsert task checklist item','Create/update task checklist item.','tasks.advanced',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.task.recurring_rule.create','tasks_advanced','AC360-ENG-52','Create recurring task rule','Create recurring task automation rule.','tasks.recurring','automation_run',5,'require_topup','{"phase":"phase_2g"}'::jsonb),
('school.task.recurring.generate','tasks_advanced','AC360-ENG-52','Generate recurring tasks','Generate tasks from recurring task rules.','tasks.recurring','automation_run',5,'require_topup','{"phase":"phase_2g"}'::jsonb),
('school.approval.policy.upsert','approvals_workflows','AC360-ENG-52','Upsert approval policy','Create/update approval policy.','approvals.manage',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.approval.request','approvals_workflows','AC360-ENG-52','Request approval','Open approval request under governance.','approvals.request',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.approval.decide','approvals_workflows','AC360-ENG-52','Decide approval','Approve/reject/cancel approval request.','approvals.decide',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.workflow.template.upsert','approvals_workflows','AC360-ENG-52','Upsert workflow template','Create/update school workflow template.','workflows.manage',null,0,'require_upgrade','{"phase":"phase_2g"}'::jsonb),
('school.workflow.instance.start','approvals_workflows','AC360-ENG-52','Start workflow instance','Start school workflow instance.','workflows.run','automation_run',10,'require_topup','{"phase":"phase_2g"}'::jsonb),
('school.workflow.step.advance','approvals_workflows','AC360-ENG-52','Advance workflow step','Advance one workflow step.','workflows.run','automation_run',3,'require_topup','{"phase":"phase_2g"}'::jsonb),
('school.workflow.event.record','approvals_workflows','AC360-ENG-52','Record workflow event','Record workflow event/audit trail.','workflows.run',null,0,'block','{"phase":"phase_2g"}'::jsonb),
('school.operations.ticket.open','operations_runtime','AC360-ENG-52','Open operations ticket','Open operations/maintenance/parent issue ticket.','operations.tickets',null,0,'block','{"phase":"phase_2g"}'::jsonb),
('school.operations.ticket.resolve','operations_runtime','AC360-ENG-52','Resolve operations ticket','Resolve operations ticket with note.','operations.tickets',null,0,'block','{"phase":"phase_2g"}'::jsonb),
('school.operations.reconcile','operations_runtime','AC360-ENG-52','Reconcile operations runtime','Compute task/approval/workflow/ticket snapshot.','operations.reconcile','automation_run',5,'require_topup','{"phase":"phase_2g"}'::jsonb),
('school.operations.alert.resolve','operations_runtime','AC360-ENG-52','Resolve operations alert','Resolve operations alert.','operations.alerts',null,0,'block','{"phase":"phase_2g"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_workflows.task_board.upsert','/api/ac360/school-workflows/task-boards/upsert','POST','school.task.board.upsert','tasks_advanced','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_task_boards','strict','fixed_1','request_or_generated',null,'school.task.create','active','Upserts task board under AC360 task governance.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.task.status_update','/api/ac360/school-workflows/tasks/status','POST','school.task.status.update','tasks_advanced','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_tasks','strict','fixed_1','request_or_generated',null,'school.task.create','active','Updates task status.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.task.comment','/api/ac360/school-workflows/tasks/comment','POST','school.task.comment.add','tasks_advanced','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_task_comments','strict','fixed_1','request_or_generated',null,'school.task.create','active','Adds task comment.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.task.checklist','/api/ac360/school-workflows/tasks/checklist','POST','school.task.checklist.upsert','tasks_advanced','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_task_checklist_items','strict','fixed_1','request_or_generated',null,'school.task.create','active','Upserts task checklist item.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.task.recurring_rule','/api/ac360/school-workflows/tasks/recurring-rules/create','POST','school.task.recurring_rule.create','tasks_advanced','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_recurring_task_rules','strict','fixed_1','request_or_generated',null,'school.task.create','active','Creates recurring task rule.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.task.recurring_generate','/api/ac360/school-workflows/tasks/recurring-rules/generate','POST','school.task.recurring.generate','tasks_advanced','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_tasks','strict','fixed_1','request_or_generated',null,'school.task.create','active','Generates recurring tasks.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.approval_policy.upsert','/api/ac360/school-workflows/approvals/policies/upsert','POST','school.approval.policy.upsert','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_approval_policies','strict','fixed_1','request_or_generated',null,null,'active','Upserts approval policy.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.approval.request','/api/ac360/school-workflows/approvals/request','POST','school.approval.request','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_approval_requests','strict','fixed_1','request_or_generated',null,null,'active','Requests approval.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.approval.decide','/api/ac360/school-workflows/approvals/decide','POST','school.approval.decide','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_approval_decisions','strict','fixed_1','request_or_generated',null,null,'active','Decides approval request.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.template.upsert','/api/ac360/school-workflows/workflows/templates/upsert','POST','school.workflow.template.upsert','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_workflow_templates','strict','fixed_1','request_or_generated',null,null,'active','Upserts workflow template.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.instance.start','/api/ac360/school-workflows/workflows/start','POST','school.workflow.instance.start','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_workflow_instances','strict','fixed_1','request_or_generated',null,null,'active','Starts workflow instance.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.step.advance','/api/ac360/school-workflows/workflows/advance-step','POST','school.workflow.step.advance','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_workflow_steps','strict','fixed_1','request_or_generated',null,null,'active','Advances workflow step.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.event.record','/api/ac360/school-workflows/workflows/events/record','POST','school.workflow.event.record','approvals_workflows','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_workflow_events','strict','fixed_1','request_or_generated',null,null,'active','Records workflow event.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.ticket.open','/api/ac360/school-workflows/operations/tickets/open','POST','school.operations.ticket.open','operations_runtime','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_operations_tickets','strict','fixed_1','request_or_generated',null,null,'active','Opens operations ticket.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.ticket.resolve','/api/ac360/school-workflows/operations/tickets/resolve','POST','school.operations.ticket.resolve','operations_runtime','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_operations_tickets','strict','fixed_1','request_or_generated',null,null,'active','Resolves operations ticket.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.operations.reconcile','/api/ac360/school-workflows/operations/reconcile','POST','school.operations.reconcile','operations_runtime','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_operations_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles operations runtime.','{"phase":"phase_2g"}'::jsonb),
('ac360.school_workflows.operations.alert.resolve','/api/ac360/school-workflows/operations/alerts/resolve','POST','school.operations.alert.resolve','operations_runtime','AC360-ENG-52','angelcare_360_school_workflows','ac360_school_operations_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves operations alert.','{"phase":"phase_2g"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

-- Phase 2 module coverage registry.
insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values
('tasks_approvals_workflows_operations','AC360-ENG-52','operations_runtime','Tasks, Approvals, Workflows & Operations Runtime','phase_2g_tasks_approvals_workflows_operations','guarded',array['ac360_school_task_boards','ac360_school_task_status_transitions','ac360_school_task_comments','ac360_school_task_checklist_items','ac360_school_recurring_task_rules','ac360_school_approval_policies','ac360_school_approval_requests','ac360_school_approval_decisions','ac360_school_workflow_templates','ac360_school_workflow_instances','ac360_school_workflow_steps','ac360_school_workflow_events','ac360_school_operations_tickets','ac360_school_operations_snapshots','ac360_school_operations_alerts'],array['school.task.board.upsert','school.task.status.update','school.task.comment.add','school.task.checklist.upsert','school.task.recurring_rule.create','school.task.recurring.generate','school.approval.policy.upsert','school.approval.request','school.approval.decide','school.workflow.template.upsert','school.workflow.instance.start','school.workflow.step.advance','school.workflow.event.record','school.operations.ticket.open','school.operations.ticket.resolve','school.operations.reconcile','school.operations.alert.resolve'],'{"phase":"phase_2g","uiBuildAllowed":false,"backendFirst":true}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code, feature_key=excluded.feature_key, label=excluded.label, phase=excluded.phase, status=excluded.status, data_tables=excluded.data_tables, guarded_actions=excluded.guarded_actions, metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json, updated_at=now();

insert into public.ac360_automation_rules(rule_key,label,system_group,trigger_event,condition_json,action_json,sort_order,status,phase)
values
('phase2g.task_overdue_alert','Create operations alert when tasks are overdue','school_workflows','task.overdue_detected','{"source":"operations_reconcile"}'::jsonb,'{"action":"create_alert","type":"task_overdue"}'::jsonb,2701,'active','phase_2g_tasks_approvals_workflows_operations'),
('phase2g.critical_ticket_escalation','Escalate critical operations tickets','school_workflows','ticket.critical_open','{"severity":"critical"}'::jsonb,'{"action":"create_alert","type":"ticket_critical"}'::jsonb,2702,'active','phase_2g_tasks_approvals_workflows_operations'),
('phase2g.approval_pending_attention','Flag pending approvals for management','school_workflows','approval.pending','{"status":"pending"}'::jsonb,'{"action":"management_attention"}'::jsonb,2703,'active','phase_2g_tasks_approvals_workflows_operations')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

commit;
