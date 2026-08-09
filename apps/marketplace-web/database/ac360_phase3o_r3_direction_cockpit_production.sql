-- AngelCare 360 — Phase 3O-R3
-- Cockpit de Direction Production Wiring, CRUD Reality Pass & Sellable Runtime Foundation
-- Purpose: make the flagship Cockpit de Direction store real actions, decisions, risks, reports, exports and audit proof.

begin;

create extension if not exists pgcrypto;

create table if not exists public.ac360_direction_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  action_code text not null,
  title text not null,
  module_key text not null default 'cockpit_direction',
  source_view text not null default 'synthese',
  priority text not null default 'normal' check (priority in ('low','normal','medium','high','critical')),
  status text not null default 'open' check (status in ('open','planned','in_progress','waiting_validation','blocked','completed','cancelled','archived')),
  owner_label text null,
  due_at timestamptz null,
  impact_json jsonb not null default '{}'::jsonb,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, action_code)
);

create table if not exists public.ac360_direction_decisions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  decision_code text not null,
  title text not null,
  decision_type text not null default 'direction',
  module_key text not null default 'cockpit_direction',
  priority text not null default 'normal' check (priority in ('low','normal','medium','high','critical')),
  status text not null default 'pending' check (status in ('pending','waiting_proof','approved','rejected','escalated','cancelled','archived')),
  amount_mad numeric(14,2) null,
  requester_label text null,
  owner_label text null,
  due_at timestamptz null,
  decision_note text null,
  decided_by uuid null,
  decided_at timestamptz null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, decision_code)
);

create table if not exists public.ac360_direction_risks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  risk_code text not null,
  title text not null,
  risk_type text not null default 'operational',
  module_key text not null default 'cockpit_direction',
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  probability text not null default 'medium' check (probability in ('low','medium','high')),
  impact_score integer not null default 50 check (impact_score between 0 and 100),
  status text not null default 'open' check (status in ('open','watch','mitigating','resolved','accepted','archived')),
  owner_label text null,
  due_at timestamptz null,
  mitigation_json jsonb not null default '{}'::jsonb,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, risk_code)
);

create table if not exists public.ac360_direction_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  report_code text not null,
  title text not null,
  report_type text not null default 'executive_board_pack',
  period_label text null,
  format text not null default 'pdf' check (format in ('pdf','xlsx','csv','board_pack','a4_preview')),
  status text not null default 'queued' check (status in ('queued','processing','ready','failed','cancelled','archived')),
  artifact_url text null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, report_code)
);

create table if not exists public.ac360_direction_exports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  export_code text not null,
  title text not null,
  export_type text not null default 'executive_export',
  format text not null default 'pdf' check (format in ('pdf','xlsx','csv','board_pack','a4_preview')),
  status text not null default 'queued' check (status in ('queued','processing','ready','failed','cancelled','archived')),
  artifact_url text null,
  payload_json jsonb not null default '{}'::jsonb,
  result_json jsonb not null default '{}'::jsonb,
  proof_reference text null,
  created_by uuid null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, export_code)
);

create table if not exists public.ac360_direction_audit_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  campus_id uuid null references public.ac360_campuses(id) on delete set null,
  event_code text not null,
  event_type text not null,
  source_view text not null default 'cockpit_direction',
  entity_type text null,
  entity_id uuid null,
  actor_app_user_id uuid null,
  proof_reference text not null,
  event_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, event_code)
);

create index if not exists ac360_direction_actions_org_status_idx on public.ac360_direction_actions(org_id, status, priority, created_at desc);
create index if not exists ac360_direction_decisions_org_status_idx on public.ac360_direction_decisions(org_id, status, priority, created_at desc);
create index if not exists ac360_direction_risks_org_status_idx on public.ac360_direction_risks(org_id, status, severity, impact_score desc);
create index if not exists ac360_direction_reports_org_status_idx on public.ac360_direction_reports(org_id, status, created_at desc);
create index if not exists ac360_direction_exports_org_status_idx on public.ac360_direction_exports(org_id, status, created_at desc);
create index if not exists ac360_direction_audit_org_created_idx on public.ac360_direction_audit_events(org_id, created_at desc);

create or replace function public.ac360_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'ac360_direction_actions_touch_updated_at') then
    create trigger ac360_direction_actions_touch_updated_at before update on public.ac360_direction_actions for each row execute procedure public.ac360_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ac360_direction_decisions_touch_updated_at') then
    create trigger ac360_direction_decisions_touch_updated_at before update on public.ac360_direction_decisions for each row execute procedure public.ac360_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ac360_direction_risks_touch_updated_at') then
    create trigger ac360_direction_risks_touch_updated_at before update on public.ac360_direction_risks for each row execute procedure public.ac360_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ac360_direction_reports_touch_updated_at') then
    create trigger ac360_direction_reports_touch_updated_at before update on public.ac360_direction_reports for each row execute procedure public.ac360_touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'ac360_direction_exports_touch_updated_at') then
    create trigger ac360_direction_exports_touch_updated_at before update on public.ac360_direction_exports for each row execute procedure public.ac360_touch_updated_at();
  end if;
end $$;

alter table public.ac360_direction_actions enable row level security;
alter table public.ac360_direction_decisions enable row level security;
alter table public.ac360_direction_risks enable row level security;
alter table public.ac360_direction_reports enable row level security;
alter table public.ac360_direction_exports enable row level security;
alter table public.ac360_direction_audit_events enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_direction_actions',
    'ac360_direction_decisions',
    'ac360_direction_risks',
    'ac360_direction_reports',
    'ac360_direction_exports',
    'ac360_direction_audit_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_service_role_all_' || t, t);
    execute format('create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')', 'ac360_service_role_all_' || t, t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_direction_actions',
    'ac360_direction_decisions',
    'ac360_direction_risks',
    'ac360_direction_reports',
    'ac360_direction_exports',
    'ac360_direction_audit_events'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'ac360_member_read_' || t, t);
    execute format('create policy %I on public.%I for select using (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active''))', 'ac360_member_read_' || t, t, t);
    execute format('drop policy if exists %I on public.%I', 'ac360_member_write_' || t, t);
    execute format('create policy %I on public.%I for insert with check (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active''))', 'ac360_member_write_' || t, t, t);
    execute format('drop policy if exists %I on public.%I', 'ac360_member_update_' || t, t);
    execute format('create policy %I on public.%I for update using (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active'')) with check (exists (select 1 from public.ac360_user_memberships m where m.org_id = %I.org_id and m.app_user_id = auth.uid() and m.status = ''active''))', 'ac360_member_update_' || t, t, t, t);
  end loop;
end $$;

comment on table public.ac360_direction_actions is 'AC360 Phase 3O-R3: persisted direction cockpit actions with proof and guarded execution metadata.';
comment on table public.ac360_direction_decisions is 'AC360 Phase 3O-R3: persisted direction approvals/arbitrages/decision lifecycle.';
comment on table public.ac360_direction_risks is 'AC360 Phase 3O-R3: persisted direction risk register and mitigation lifecycle.';
comment on table public.ac360_direction_reports is 'AC360 Phase 3O-R3: governed executive reports and board-pack jobs.';
comment on table public.ac360_direction_exports is 'AC360 Phase 3O-R3: governed export jobs and artifacts.';
comment on table public.ac360_direction_audit_events is 'AC360 Phase 3O-R3: immutable proof events for direction cockpit actions.';

commit;
