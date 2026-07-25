-- ANGELCARE Revenue Command Center Excellence v4 / Mega ZIP 4
-- Revenue Execution, Tasks, Approvals & Accountability Control Plane
-- ADDITIVE ONLY. Requires preflight CUTOVER_GATE = READY.

begin;
create extension if not exists pgcrypto;

do $$
begin
  if to_regclass('public.revenue_tasks') is null then raise exception 'BLOCKED: public.revenue_tasks is missing'; end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='revenue_tasks' and column_name='id' and udt_name='uuid') then
    raise exception 'BLOCKED: public.revenue_tasks.id must be uuid';
  end if;
end $$;

alter table public.revenue_tasks
  add column if not exists due_at timestamptz,
  add column if not exists assigned_user_id uuid,
  add column if not exists assigned_role text,
  add column if not exists expected_outcome text,
  add column if not exists completion_outcome text,
  add column if not exists evidence_required boolean not null default false,
  add column if not exists approval_required boolean not null default false,
  add column if not exists sla_due_at timestamptz,
  add column if not exists estimated_minutes integer not null default 0,
  add column if not exists actual_minutes integer not null default 0,
  add column if not exists archived_at timestamptz,
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid,
  add column if not exists version integer not null default 1,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.revenue_tasks
set due_at = case when due_at is null and due_date is not null then due_date::timestamptz else due_at end,
    version = greatest(coalesce(version,1),1),
    metadata = coalesce(metadata,'{}'::jsonb)
where due_at is null or version is null or metadata is null;

create table if not exists public.revenue_task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  assignee_user_id uuid,
  assignee_name text not null,
  role text not null default 'owner',
  is_primary boolean not null default false,
  assigned_by uuid,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create unique index if not exists revenue_task_assignments_one_primary_idx on public.revenue_task_assignments(task_id) where is_primary and ended_at is null;
create index if not exists revenue_task_assignments_task_idx on public.revenue_task_assignments(task_id,created_at desc);
create index if not exists revenue_task_assignments_user_idx on public.revenue_task_assignments(assignee_user_id) where assignee_user_id is not null;

create table if not exists public.revenue_task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  correlation_id uuid not null default gen_random_uuid(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists revenue_task_status_history_task_idx on public.revenue_task_status_history(task_id,changed_at desc);

create table if not exists public.revenue_task_dependencies (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  dependency_type text not null default 'finish_to_start',
  description text,
  created_by uuid,
  created_at timestamptz not null default now(),
  satisfied_by uuid,
  satisfied_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint revenue_task_dependency_not_self check (task_id <> depends_on_task_id),
  constraint revenue_task_dependency_unique unique(task_id,depends_on_task_id)
);
create index if not exists revenue_task_dependencies_open_idx on public.revenue_task_dependencies(task_id) where satisfied_at is null;

create table if not exists public.revenue_task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  required boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  completed_by uuid,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists revenue_task_checklist_items_task_idx on public.revenue_task_checklist_items(task_id,position,created_at);

create table if not exists public.revenue_task_evidence (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  title text not null,
  description text,
  evidence_type text not null default 'note',
  evidence_url text,
  storage_path text,
  review_status text not null default 'submitted',
  submitted_by uuid,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists revenue_task_evidence_task_idx on public.revenue_task_evidence(task_id,created_at desc);
create index if not exists revenue_task_evidence_review_idx on public.revenue_task_evidence(review_status,submitted_at);

create table if not exists public.revenue_task_approval_requests (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  title text not null,
  reason text,
  business_consequence text,
  risk_level text not null default 'medium',
  status text not null default 'pending',
  requested_by uuid,
  requested_by_name text,
  requested_at timestamptz not null default now(),
  due_at timestamptz,
  decided_by uuid,
  decided_by_name text,
  decided_at timestamptz,
  decision_reason text,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists revenue_task_approval_requests_queue_idx on public.revenue_task_approval_requests(status,due_at,requested_at);
create index if not exists revenue_task_approval_requests_task_idx on public.revenue_task_approval_requests(task_id,created_at desc);

create table if not exists public.revenue_task_approval_steps (
  id uuid primary key default gen_random_uuid(),
  approval_request_id uuid not null references public.revenue_task_approval_requests(id) on delete cascade,
  step_order integer not null default 1,
  approver_user_id uuid,
  approver_role text,
  decision text,
  reason text,
  decided_by uuid,
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists revenue_task_approval_steps_request_idx on public.revenue_task_approval_steps(approval_request_id,step_order,decided_at);

create table if not exists public.revenue_task_blockers (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  category text not null default 'operational',
  reason text not null,
  impact text,
  owner_name text,
  severity text not null default 'high',
  opened_by uuid,
  opened_at timestamptz not null default now(),
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists revenue_task_blockers_open_idx on public.revenue_task_blockers(task_id,severity,opened_at desc) where resolved_at is null;

create table if not exists public.revenue_task_escalations (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  level text not null default 'manager',
  reason text not null,
  commercial_impact_mad numeric(18,2) not null default 0,
  escalated_to_user_id uuid,
  escalated_to_name text,
  status text not null default 'open',
  escalated_by uuid,
  escalated_at timestamptz not null default now(),
  due_at timestamptz,
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists revenue_task_escalations_open_idx on public.revenue_task_escalations(status,due_at,escalated_at) where resolved_at is null;
create index if not exists revenue_task_escalations_task_idx on public.revenue_task_escalations(task_id,created_at desc);

create table if not exists public.revenue_task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  body text not null,
  author_id uuid,
  author_name text,
  parent_comment_id uuid references public.revenue_task_comments(id) on delete cascade,
  edited_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists revenue_task_comments_task_idx on public.revenue_task_comments(task_id,created_at desc) where deleted_at is null;

create table if not exists public.revenue_task_time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  user_id uuid,
  user_name text,
  started_at timestamptz not null,
  ended_at timestamptz,
  minutes integer not null default 0,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists revenue_task_time_entries_task_idx on public.revenue_task_time_entries(task_id,started_at desc);

create table if not exists public.revenue_task_relations (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.revenue_tasks(id) on delete cascade,
  related_entity_type text not null,
  related_entity_id text not null,
  relation_role text not null default 'context',
  created_by uuid,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint revenue_task_relation_unique unique(task_id,related_entity_type,related_entity_id,relation_role)
);
create index if not exists revenue_task_relations_entity_idx on public.revenue_task_relations(related_entity_type,related_entity_id);

create or replace function public.revenue_task_control_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at=now();
  return new;
end $$;
drop trigger if exists revenue_task_approval_requests_touch on public.revenue_task_approval_requests;
create trigger revenue_task_approval_requests_touch before update on public.revenue_task_approval_requests for each row execute function public.revenue_task_control_touch();

create or replace function public.revenue_task_capture_status_history()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status is distinct from old.status then
    insert into public.revenue_task_status_history(task_id,from_status,to_status,reason,changed_by,metadata)
    values(new.id,old.status,new.status,'Captured by database trigger',new.updated_by,jsonb_build_object('source','trigger'));
  end if;
  return new;
end $$;
drop trigger if exists revenue_task_status_history_trigger on public.revenue_tasks;
create trigger revenue_task_status_history_trigger after update of status on public.revenue_tasks for each row execute function public.revenue_task_capture_status_history();

-- Build the portfolio view dynamically so legacy revenue_tasks schemas that already
-- contain entity_name do not produce duplicate output-column names.
do $migration$
declare
  task_columns text;
  view_sql text;
begin
  select string_agg(format('t.%I', column_name), ', ' order by ordinal_position)
  into task_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'revenue_tasks'
    and column_name <> 'entity_name';

  if task_columns is null then
    raise exception 'BLOCKED: no readable columns found for public.revenue_tasks';
  end if;

  view_sql := format($view$
    create or replace view public.revenue_execution_portfolio_view as
    select
      %s,
      coalesce(p.name,a.account_name,o.title,nullif(t.entity_name,''),t.entity_id,'Aucune entité') as entity_name,
      o.title as opportunity_title,
      coalesce(o.value_mad,p.value_mad,0)::numeric as commercial_value_mad,
      (select count(*) from public.revenue_task_checklist_items c where c.task_id=t.id)::integer as checklist_count,
      (select count(*) from public.revenue_task_checklist_items c where c.task_id=t.id and c.completed_at is not null)::integer as checklist_done_count,
      (select count(*) from public.revenue_task_dependencies d where d.task_id=t.id)::integer as dependency_count,
      (select count(*) from public.revenue_task_dependencies d where d.task_id=t.id and d.satisfied_at is null)::integer as unresolved_dependency_count,
      (select count(*) from public.revenue_task_evidence e where e.task_id=t.id)::integer as evidence_count,
      (select count(*) from public.revenue_task_approval_requests r where r.task_id=t.id and r.status in ('pending','requested','clarification_required'))::integer as pending_approval_count,
      (select count(*) from public.revenue_task_blockers b where b.task_id=t.id and b.resolved_at is null)::integer as blocker_count,
      (select count(*) from public.revenue_task_escalations x where x.task_id=t.id and x.resolved_at is null)::integer as escalation_count
    from public.revenue_tasks t
    left join public.revenue_prospects p on p.id::text=coalesce(t.prospect_id::text,case when t.entity_type='prospect' then t.entity_id::text end)
    left join public.revenue_accounts a on a.id::text=case when t.entity_type='account' then t.entity_id::text end
    left join public.revenue_opportunities o on o.id::text=case when t.entity_type='opportunity' then t.entity_id::text end
  $view$, task_columns);

  execute view_sql;
end
$migration$;

create or replace view public.revenue_task_workload_view as
select
 coalesce(nullif(owner,''),'Non attribué') as owner,
 count(*)::integer as total_tasks,
 count(*) filter(where status not in ('done','completed','cancelled','archived'))::integer as open_tasks,
 count(*) filter(where status in ('done','completed'))::integer as completed_tasks,
 count(*) filter(where status='blocked')::integer as blocked_tasks,
 count(*) filter(where status not in ('done','completed','cancelled','archived') and coalesce(due_at,due_date::timestamptz)<now())::integer as overdue_tasks,
 sum(coalesce(estimated_minutes,0))::integer as estimated_minutes,
 sum(coalesce(actual_minutes,0))::integer as actual_minutes
from public.revenue_tasks
group by coalesce(nullif(owner,''),'Non attribué');

create index if not exists revenue_tasks_execution_due_at_idx on public.revenue_tasks(due_at,status);
create index if not exists revenue_tasks_execution_due_date_idx on public.revenue_tasks(due_date,status);
create index if not exists revenue_tasks_assigned_user_idx on public.revenue_tasks(assigned_user_id,status) where assigned_user_id is not null;
create index if not exists revenue_tasks_execution_owner_idx on public.revenue_tasks(owner,status,priority);
create index if not exists revenue_tasks_execution_entity_idx on public.revenue_tasks(entity_type,entity_id);

-- New support tables are read-only to authenticated clients; writes are performed by protected server commands.
do $$ declare t text; begin
 foreach t in array array[
  'revenue_task_assignments','revenue_task_status_history','revenue_task_dependencies','revenue_task_checklist_items',
  'revenue_task_evidence','revenue_task_approval_requests','revenue_task_approval_steps','revenue_task_blockers',
  'revenue_task_escalations','revenue_task_comments','revenue_task_time_entries','revenue_task_relations'
 ] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists revenue_execution_authenticated_read on public.%I',t);
  execute format('create policy revenue_execution_authenticated_read on public.%I for select to authenticated using (true)',t);
 end loop;
end $$;

grant select on public.revenue_execution_portfolio_view,public.revenue_task_workload_view to authenticated;
do $$ declare t text; begin
 foreach t in array array[
  'revenue_task_assignments','revenue_task_status_history','revenue_task_dependencies','revenue_task_checklist_items',
  'revenue_task_evidence','revenue_task_approval_requests','revenue_task_approval_steps','revenue_task_blockers',
  'revenue_task_escalations','revenue_task_comments','revenue_task_time_entries','revenue_task_relations'
 ] loop execute format('grant select on public.%I to authenticated',t); end loop;
end $$;

commit;
