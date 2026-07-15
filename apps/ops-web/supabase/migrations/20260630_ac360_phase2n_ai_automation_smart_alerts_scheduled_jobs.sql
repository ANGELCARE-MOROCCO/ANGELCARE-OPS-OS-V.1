-- AngelCare 360 Phase 2N - AI, Automation Builder, Smart Alerts & Scheduled Jobs Runtime
-- Ref: AC360-PH2N-AI-AUTOMATION-SMART-ALERTS-SCHEDULED-JOBS-2026-06-30
-- Scope: backend/system-only AI and automation runtime.
-- Strict rule: no AI/automation/smart-alert UI/front-end pages are introduced.
-- Depends on Phase 1 foundation/guard/policy/action wiring and Phase 2A-2M school ops runtime.

begin;

create extension if not exists pgcrypto;

alter table if exists public.ac360_app_action_wiring
  add column if not exists fallback_action_key text;

-- -----------------------------------------------------------------------------
-- 1. AI, automation, scheduled jobs and smart alert runtime tables
-- -----------------------------------------------------------------------------
create table if not exists public.ac360_school_ai_prompt_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  prompt_key text not null,
  label text not null,
  prompt_type text not null default 'message',
  target_module text not null default 'general',
  language text not null default 'fr',
  system_prompt text,
  user_prompt_template text not null,
  variables_json jsonb not null default '[]'::jsonb,
  safety_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, prompt_key),
  check (prompt_type in ('message','report','summary','translation','risk_detection','data_cleanup','recommendation','custom')),
  check (target_module in ('general','admissions','finance','communication','parenttrust','academy','hr','transport','health_safety','documents','reports','operations','custom')),
  check (language in ('fr','ar','en','mixed')),
  check (status in ('draft','published','paused','archived'))
);

create table if not exists public.ac360_school_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  prompt_template_id uuid references public.ac360_school_ai_prompt_templates(id) on delete set null,
  job_key text not null,
  job_type text not null default 'message',
  target_module text not null default 'general',
  target_entity_type text,
  target_entity_id uuid,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  requested_language text not null default 'fr',
  estimated_credit_cost numeric not null default 10,
  actual_credit_cost numeric not null default 0,
  status text not null default 'queued',
  requested_by uuid,
  started_at timestamptz,
  completed_at timestamptz,
  failed_reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, job_key),
  check (job_type in ('message','report','summary','translation','risk_detection','data_cleanup','recommendation','classification','custom')),
  check (requested_language in ('fr','ar','en','mixed')),
  check (status in ('queued','running','completed','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_ai_job_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  ai_job_id uuid not null references public.ac360_school_ai_jobs(id) on delete cascade,
  event_type text not null,
  severity text not null default 'info',
  message text,
  actor_app_user_id uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (severity in ('info','warning','critical'))
);

create table if not exists public.ac360_school_automation_blueprints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  blueprint_key text not null,
  label text not null,
  blueprint_type text not null default 'workflow',
  target_module text not null default 'general',
  trigger_schema_json jsonb not null default '{}'::jsonb,
  steps_json jsonb not null default '[]'::jsonb,
  default_conditions_json jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, blueprint_key),
  check (blueprint_type in ('workflow','reminder','escalation','scheduled_report','campaign_sequence','approval','custom')),
  check (status in ('draft','published','paused','archived'))
);

create table if not exists public.ac360_school_automation_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  blueprint_id uuid references public.ac360_school_automation_blueprints(id) on delete set null,
  rule_key text not null,
  label text not null,
  target_module text not null default 'general',
  trigger_event text not null,
  condition_json jsonb not null default '{}'::jsonb,
  action_json jsonb not null default '{}'::jsonb,
  credit_budget numeric not null default 1,
  priority text not null default 'medium',
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, rule_key),
  check (priority in ('low','medium','high','critical')),
  check (status in ('active','paused','draft','archived'))
);

create table if not exists public.ac360_school_automation_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  rule_id uuid references public.ac360_school_automation_rules(id) on delete set null,
  run_key text not null,
  trigger_event text not null,
  target_module text not null default 'general',
  target_entity_type text,
  target_entity_id uuid,
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  consumed_credits numeric not null default 0,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  failed_reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, run_key),
  check (status in ('queued','running','completed','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_automation_run_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  automation_run_id uuid references public.ac360_school_automation_runs(id) on delete cascade,
  event_type text not null,
  step_key text,
  severity text not null default 'info',
  message text,
  payload_json jsonb not null default '{}'::jsonb,
  actor_app_user_id uuid,
  created_at timestamptz not null default now(),
  check (severity in ('info','warning','critical'))
);

create table if not exists public.ac360_school_scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  schedule_key text not null,
  label text not null,
  job_type text not null default 'reconcile',
  target_module text not null default 'general',
  cron_expression text,
  run_interval text not null default 'daily',
  payload_json jsonb not null default '{}'::jsonb,
  next_run_at timestamptz,
  last_run_at timestamptz,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, schedule_key),
  check (job_type in ('reconcile','report','message','automation','ai','backup','snapshot','custom')),
  check (run_interval in ('hourly','daily','weekly','monthly','custom')),
  check (status in ('active','paused','draft','archived'))
);

create table if not exists public.ac360_school_scheduled_job_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  scheduled_job_id uuid not null references public.ac360_school_scheduled_jobs(id) on delete cascade,
  run_key text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  result_json jsonb not null default '{}'::jsonb,
  failed_reason text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, run_key),
  check (status in ('running','completed','failed','cancelled','archived'))
);

create table if not exists public.ac360_school_smart_alert_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  rule_key text not null,
  label text not null,
  target_module text not null default 'general',
  alert_type text not null default 'operational',
  severity text not null default 'warning',
  condition_json jsonb not null default '{}'::jsonb,
  recommendation_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique(org_id, rule_key),
  check (alert_type in ('operational','finance','attendance','parenttrust','admissions','hr','transport','safety','academy','ai','automation','custom')),
  check (severity in ('info','warning','critical')),
  check (status in ('active','paused','draft','archived'))
);

create table if not exists public.ac360_school_smart_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  rule_id uuid references public.ac360_school_smart_alert_rules(id) on delete set null,
  alert_key text not null,
  target_module text not null default 'general',
  alert_type text not null default 'operational',
  severity text not null default 'warning',
  title text not null,
  message text,
  target_entity_type text,
  target_entity_id uuid,
  recommendation_json jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('info','warning','critical')),
  check (status in ('open','in_progress','resolved','dismissed','archived'))
);

create table if not exists public.ac360_school_ai_automation_snapshots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  snapshot_date date not null default current_date,
  active_prompt_templates integer not null default 0,
  queued_ai_jobs integer not null default 0,
  failed_ai_jobs integer not null default 0,
  active_automation_rules integer not null default 0,
  running_automation_runs integer not null default 0,
  failed_automation_runs integer not null default 0,
  active_scheduled_jobs integer not null default 0,
  due_scheduled_jobs integer not null default 0,
  open_smart_alerts integer not null default 0,
  critical_smart_alerts integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(org_id, snapshot_date)
);

create table if not exists public.ac360_school_ai_automation_alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.ac360_organizations(id) on delete cascade,
  alert_key text not null,
  alert_type text not null default 'automation_runtime',
  severity text not null default 'warning',
  title text not null,
  message text,
  related_entity_type text,
  related_entity_id uuid,
  status text not null default 'open',
  resolved_at timestamptz,
  resolved_by uuid,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, alert_key),
  check (severity in ('info','warning','critical')),
  check (status in ('open','in_progress','resolved','dismissed','archived'))
);

-- -----------------------------------------------------------------------------
-- 2. Indexes and updated_at triggers
-- -----------------------------------------------------------------------------
create index if not exists idx_ac360_ai_prompts_org_status on public.ac360_school_ai_prompt_templates(org_id, status, target_module);
create index if not exists idx_ac360_ai_jobs_org_status on public.ac360_school_ai_jobs(org_id, status, job_type, created_at desc);
create index if not exists idx_ac360_automation_rules_org_status on public.ac360_school_automation_rules(org_id, status, target_module);
create index if not exists idx_ac360_automation_runs_org_status on public.ac360_school_automation_runs(org_id, status, created_at desc);
create index if not exists idx_ac360_scheduled_jobs_org_next on public.ac360_school_scheduled_jobs(org_id, status, next_run_at);
create index if not exists idx_ac360_smart_alerts_org_status on public.ac360_school_smart_alerts(org_id, status, severity, created_at desc);
create index if not exists idx_ac360_ai_auto_alerts_org_status on public.ac360_school_ai_automation_alerts(org_id, status, severity, created_at desc);

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_ai_prompt_templates','ac360_school_ai_jobs','ac360_school_automation_blueprints','ac360_school_automation_rules','ac360_school_automation_runs','ac360_school_scheduled_jobs','ac360_school_smart_alert_rules','ac360_school_smart_alerts','ac360_school_ai_automation_alerts'
  ] loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', t, t);
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.ac360_touch_updated_at()', t, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 3. RPC helpers
-- -----------------------------------------------------------------------------
create or replace function public.ac360_school_ai_automation_dashboard(p_org_id uuid, p_as_of_date date default current_date)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_snapshot jsonb;
begin
  perform public.ac360_school_ai_automation_reconcile(p_org_id, p_as_of_date, null, '{}'::jsonb);
  select to_jsonb(s) into v_snapshot
  from public.ac360_school_ai_automation_snapshots s
  where s.org_id = p_org_id and s.snapshot_date = coalesce(p_as_of_date, current_date);

  return jsonb_build_object(
    'ok', true,
    'phase', 'phase_2n_ai_automation_smart_alerts_scheduled_jobs',
    'uiBuildAllowed', false,
    'snapshot', coalesce(v_snapshot, '{}'::jsonb),
    'openSmartAlerts', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc), '[]'::jsonb) from public.ac360_school_smart_alerts a where a.org_id=p_org_id and a.status in ('open','in_progress') limit 50),
    'runtimeAlerts', (select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc), '[]'::jsonb) from public.ac360_school_ai_automation_alerts a where a.org_id=p_org_id and a.status in ('open','in_progress') limit 50)
  );
end $$;

create or replace function public.ac360_school_upsert_ai_prompt_template(
  p_org_id uuid,
  p_template_id uuid default null,
  p_prompt_key text default null,
  p_label text default null,
  p_prompt_type text default 'message',
  p_target_module text default 'general',
  p_language text default 'fr',
  p_system_prompt text default null,
  p_user_prompt_template text default null,
  p_variables_json jsonb default '[]'::jsonb,
  p_safety_json jsonb default '{}'::jsonb,
  p_status text default 'draft',
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_record public.ac360_school_ai_prompt_templates%rowtype;
begin
  if p_template_id is null then
    insert into public.ac360_school_ai_prompt_templates(org_id,prompt_key,label,prompt_type,target_module,language,system_prompt,user_prompt_template,variables_json,safety_json,status,created_by,metadata_json)
    values(p_org_id,coalesce(nullif(p_prompt_key,''),'prompt-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'AI Prompt'),coalesce(p_prompt_type,'message'),coalesce(p_target_module,'general'),coalesce(p_language,'fr'),p_system_prompt,coalesce(p_user_prompt_template,'{{input}}'),coalesce(p_variables_json,'[]'::jsonb),coalesce(p_safety_json,'{}'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
    on conflict(org_id,prompt_key) do update set label=excluded.label,prompt_type=excluded.prompt_type,target_module=excluded.target_module,language=excluded.language,system_prompt=excluded.system_prompt,user_prompt_template=excluded.user_prompt_template,variables_json=excluded.variables_json,safety_json=excluded.safety_json,status=excluded.status,metadata_json=public.ac360_school_ai_prompt_templates.metadata_json || excluded.metadata_json,updated_at=now()
    returning id into v_id;
  else
    update public.ac360_school_ai_prompt_templates set label=coalesce(nullif(p_label,''),label),prompt_type=coalesce(p_prompt_type,prompt_type),target_module=coalesce(p_target_module,target_module),language=coalesce(p_language,language),system_prompt=coalesce(p_system_prompt,system_prompt),user_prompt_template=coalesce(p_user_prompt_template,user_prompt_template),variables_json=coalesce(p_variables_json,variables_json),safety_json=coalesce(p_safety_json,safety_json),status=coalesce(p_status,status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_template_id and org_id=p_org_id returning id into v_id;
  end if;
  select * into v_record from public.ac360_school_ai_prompt_templates where id=v_id;
  return jsonb_build_object('ok',true,'promptTemplate',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_queue_ai_job(
  p_org_id uuid,
  p_prompt_template_id uuid default null,
  p_job_key text default null,
  p_job_type text default 'message',
  p_target_module text default 'general',
  p_target_entity_type text default null,
  p_target_entity_id uuid default null,
  p_input_json jsonb default '{}'::jsonb,
  p_requested_language text default 'fr',
  p_estimated_credit_cost numeric default 10,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_ai_jobs%rowtype;
begin
  insert into public.ac360_school_ai_jobs(org_id,prompt_template_id,job_key,job_type,target_module,target_entity_type,target_entity_id,input_json,requested_language,estimated_credit_cost,status,requested_by,metadata_json)
  values(p_org_id,p_prompt_template_id,coalesce(nullif(p_job_key,''),'AI-'||substr(gen_random_uuid()::text,1,10)),coalesce(p_job_type,'message'),coalesce(p_target_module,'general'),p_target_entity_type,p_target_entity_id,coalesce(p_input_json,'{}'::jsonb),coalesce(p_requested_language,'fr'),coalesce(p_estimated_credit_cost,10),'queued',p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb))
  returning * into v_record;
  insert into public.ac360_school_ai_job_events(org_id,ai_job_id,event_type,severity,message,actor_app_user_id,metadata_json) values(p_org_id,v_record.id,'queued','info','AI job queued.',p_actor_app_user_id,'{}'::jsonb);
  return jsonb_build_object('ok',true,'aiJob',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_complete_ai_job(
  p_org_id uuid,
  p_ai_job_id uuid,
  p_status text default 'completed',
  p_output_json jsonb default '{}'::jsonb,
  p_actual_credit_cost numeric default null,
  p_failed_reason text default null,
  p_actor_app_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_ai_jobs%rowtype;
begin
  update public.ac360_school_ai_jobs set status=coalesce(p_status,'completed'),output_json=coalesce(p_output_json,output_json),actual_credit_cost=coalesce(p_actual_credit_cost,actual_credit_cost),failed_reason=p_failed_reason,completed_at=case when coalesce(p_status,'completed') in ('completed','failed','cancelled') then now() else completed_at end,metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_ai_job_id and org_id=p_org_id returning * into v_record;
  if v_record.id is null then return jsonb_build_object('ok',false,'error','AI job not found.'); end if;
  insert into public.ac360_school_ai_job_events(org_id,ai_job_id,event_type,severity,message,actor_app_user_id,metadata_json) values(p_org_id,v_record.id,'completed',case when v_record.status='failed' then 'critical' else 'info' end,coalesce(p_failed_reason,'AI job completed.'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb));
  if v_record.status='failed' then
    insert into public.ac360_school_ai_automation_alerts(org_id,alert_key,alert_type,severity,title,message,related_entity_type,related_entity_id,metadata_json)
    values(p_org_id,'ai-job-failed-'||v_record.id,'ai_job_failed','critical','AI job failed',coalesce(p_failed_reason,'AI job failed.'),'ai_job',v_record.id,coalesce(p_metadata,'{}'::jsonb))
    on conflict(org_id,alert_key) do nothing;
  end if;
  return jsonb_build_object('ok',true,'aiJob',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_record_ai_job_event(p_org_id uuid,p_ai_job_id uuid,p_event_type text,p_severity text default 'info',p_message text default null,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_ai_job_events%rowtype;
begin
  insert into public.ac360_school_ai_job_events(org_id,ai_job_id,event_type,severity,message,actor_app_user_id,metadata_json) values(p_org_id,p_ai_job_id,coalesce(p_event_type,'event'),coalesce(p_severity,'info'),p_message,p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) returning * into v_record;
  return jsonb_build_object('ok',true,'event',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_upsert_automation_blueprint(p_org_id uuid,p_blueprint_id uuid default null,p_blueprint_key text default null,p_label text default null,p_blueprint_type text default 'workflow',p_target_module text default 'general',p_trigger_schema_json jsonb default '{}'::jsonb,p_steps_json jsonb default '[]'::jsonb,p_default_conditions_json jsonb default '{}'::jsonb,p_status text default 'draft',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_record public.ac360_school_automation_blueprints%rowtype;
begin
  if p_blueprint_id is null then
    insert into public.ac360_school_automation_blueprints(org_id,blueprint_key,label,blueprint_type,target_module,trigger_schema_json,steps_json,default_conditions_json,status,created_by,metadata_json) values(p_org_id,coalesce(nullif(p_blueprint_key,''),'blueprint-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'Automation Blueprint'),coalesce(p_blueprint_type,'workflow'),coalesce(p_target_module,'general'),coalesce(p_trigger_schema_json,'{}'::jsonb),coalesce(p_steps_json,'[]'::jsonb),coalesce(p_default_conditions_json,'{}'::jsonb),coalesce(p_status,'draft'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) on conflict(org_id,blueprint_key) do update set label=excluded.label,blueprint_type=excluded.blueprint_type,target_module=excluded.target_module,trigger_schema_json=excluded.trigger_schema_json,steps_json=excluded.steps_json,default_conditions_json=excluded.default_conditions_json,status=excluded.status,metadata_json=public.ac360_school_automation_blueprints.metadata_json||excluded.metadata_json,updated_at=now() returning id into v_id;
  else
    update public.ac360_school_automation_blueprints set label=coalesce(nullif(p_label,''),label),blueprint_type=coalesce(p_blueprint_type,blueprint_type),target_module=coalesce(p_target_module,target_module),trigger_schema_json=coalesce(p_trigger_schema_json,trigger_schema_json),steps_json=coalesce(p_steps_json,steps_json),default_conditions_json=coalesce(p_default_conditions_json,default_conditions_json),status=coalesce(p_status,status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_blueprint_id and org_id=p_org_id returning id into v_id;
  end if;
  select * into v_record from public.ac360_school_automation_blueprints where id=v_id;
  return jsonb_build_object('ok',true,'blueprint',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_upsert_automation_rule(p_org_id uuid,p_rule_id uuid default null,p_blueprint_id uuid default null,p_rule_key text default null,p_label text default null,p_target_module text default 'general',p_trigger_event text default 'manual',p_condition_json jsonb default '{}'::jsonb,p_action_json jsonb default '{}'::jsonb,p_credit_budget numeric default 1,p_priority text default 'medium',p_status text default 'active',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_record public.ac360_school_automation_rules%rowtype;
begin
  if p_rule_id is null then
    insert into public.ac360_school_automation_rules(org_id,blueprint_id,rule_key,label,target_module,trigger_event,condition_json,action_json,credit_budget,priority,status,created_by,metadata_json) values(p_org_id,p_blueprint_id,coalesce(nullif(p_rule_key,''),'rule-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'Automation Rule'),coalesce(p_target_module,'general'),coalesce(p_trigger_event,'manual'),coalesce(p_condition_json,'{}'::jsonb),coalesce(p_action_json,'{}'::jsonb),coalesce(p_credit_budget,1),coalesce(p_priority,'medium'),coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) on conflict(org_id,rule_key) do update set blueprint_id=excluded.blueprint_id,label=excluded.label,target_module=excluded.target_module,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,credit_budget=excluded.credit_budget,priority=excluded.priority,status=excluded.status,metadata_json=public.ac360_school_automation_rules.metadata_json||excluded.metadata_json,updated_at=now() returning id into v_id;
  else
    update public.ac360_school_automation_rules set blueprint_id=coalesce(p_blueprint_id,blueprint_id),label=coalesce(nullif(p_label,''),label),target_module=coalesce(p_target_module,target_module),trigger_event=coalesce(p_trigger_event,trigger_event),condition_json=coalesce(p_condition_json,condition_json),action_json=coalesce(p_action_json,action_json),credit_budget=coalesce(p_credit_budget,credit_budget),priority=coalesce(p_priority,priority),status=coalesce(p_status,status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_rule_id and org_id=p_org_id returning id into v_id;
  end if;
  select * into v_record from public.ac360_school_automation_rules where id=v_id;
  return jsonb_build_object('ok',true,'automationRule',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_trigger_automation_run(p_org_id uuid,p_rule_id uuid default null,p_run_key text default null,p_trigger_event text default 'manual',p_target_module text default 'general',p_target_entity_type text default null,p_target_entity_id uuid default null,p_input_json jsonb default '{}'::jsonb,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_automation_runs%rowtype;
begin
  insert into public.ac360_school_automation_runs(org_id,rule_id,run_key,trigger_event,target_module,target_entity_type,target_entity_id,input_json,status,started_at,metadata_json) values(p_org_id,p_rule_id,coalesce(nullif(p_run_key,''),'RUN-'||substr(gen_random_uuid()::text,1,10)),coalesce(p_trigger_event,'manual'),coalesce(p_target_module,'general'),p_target_entity_type,p_target_entity_id,coalesce(p_input_json,'{}'::jsonb),'running',now(),coalesce(p_metadata,'{}'::jsonb)) returning * into v_record;
  insert into public.ac360_school_automation_run_events(org_id,automation_run_id,event_type,severity,message,payload_json) values(p_org_id,v_record.id,'run_started','info','Automation run started.',coalesce(p_input_json,'{}'::jsonb));
  return jsonb_build_object('ok',true,'automationRun',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_record_automation_event(p_org_id uuid,p_automation_run_id uuid,p_event_type text,p_step_key text default null,p_severity text default 'info',p_message text default null,p_payload_json jsonb default '{}'::jsonb,p_actor_app_user_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_automation_run_events%rowtype;
begin
  insert into public.ac360_school_automation_run_events(org_id,automation_run_id,event_type,step_key,severity,message,payload_json,actor_app_user_id) values(p_org_id,p_automation_run_id,coalesce(p_event_type,'event'),p_step_key,coalesce(p_severity,'info'),p_message,coalesce(p_payload_json,'{}'::jsonb),p_actor_app_user_id) returning * into v_record;
  if p_event_type in ('completed','run_completed') then update public.ac360_school_automation_runs set status='completed',completed_at=now(),updated_at=now() where id=p_automation_run_id and org_id=p_org_id; end if;
  if p_event_type in ('failed','run_failed') then update public.ac360_school_automation_runs set status='failed',completed_at=now(),failed_reason=p_message,updated_at=now() where id=p_automation_run_id and org_id=p_org_id; end if;
  return jsonb_build_object('ok',true,'event',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_upsert_scheduled_job(p_org_id uuid,p_scheduled_job_id uuid default null,p_schedule_key text default null,p_label text default null,p_job_type text default 'reconcile',p_target_module text default 'general',p_cron_expression text default null,p_run_interval text default 'daily',p_payload_json jsonb default '{}'::jsonb,p_next_run_at timestamptz default null,p_status text default 'active',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_record public.ac360_school_scheduled_jobs%rowtype;
begin
  if p_scheduled_job_id is null then
    insert into public.ac360_school_scheduled_jobs(org_id,schedule_key,label,job_type,target_module,cron_expression,run_interval,payload_json,next_run_at,status,created_by,metadata_json) values(p_org_id,coalesce(nullif(p_schedule_key,''),'schedule-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'Scheduled Job'),coalesce(p_job_type,'reconcile'),coalesce(p_target_module,'general'),p_cron_expression,coalesce(p_run_interval,'daily'),coalesce(p_payload_json,'{}'::jsonb),p_next_run_at,coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) on conflict(org_id,schedule_key) do update set label=excluded.label,job_type=excluded.job_type,target_module=excluded.target_module,cron_expression=excluded.cron_expression,run_interval=excluded.run_interval,payload_json=excluded.payload_json,next_run_at=excluded.next_run_at,status=excluded.status,metadata_json=public.ac360_school_scheduled_jobs.metadata_json||excluded.metadata_json,updated_at=now() returning id into v_id;
  else
    update public.ac360_school_scheduled_jobs set label=coalesce(nullif(p_label,''),label),job_type=coalesce(p_job_type,job_type),target_module=coalesce(p_target_module,target_module),cron_expression=coalesce(p_cron_expression,cron_expression),run_interval=coalesce(p_run_interval,run_interval),payload_json=coalesce(p_payload_json,payload_json),next_run_at=coalesce(p_next_run_at,next_run_at),status=coalesce(p_status,status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_scheduled_job_id and org_id=p_org_id returning id into v_id;
  end if;
  select * into v_record from public.ac360_school_scheduled_jobs where id=v_id;
  return jsonb_build_object('ok',true,'scheduledJob',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_run_scheduled_job(p_org_id uuid,p_scheduled_job_id uuid,p_run_key text default null,p_status text default 'completed',p_result_json jsonb default '{}'::jsonb,p_failed_reason text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_run public.ac360_school_scheduled_job_runs%rowtype;
begin
  insert into public.ac360_school_scheduled_job_runs(org_id,scheduled_job_id,run_key,status,completed_at,result_json,failed_reason,metadata_json) values(p_org_id,p_scheduled_job_id,coalesce(nullif(p_run_key,''),'SJR-'||substr(gen_random_uuid()::text,1,10)),coalesce(p_status,'completed'),case when coalesce(p_status,'completed') in ('completed','failed','cancelled') then now() else null end,coalesce(p_result_json,'{}'::jsonb),p_failed_reason,coalesce(p_metadata,'{}'::jsonb)) returning * into v_run;
  update public.ac360_school_scheduled_jobs set last_run_at=now(),next_run_at=case run_interval when 'hourly' then now()+interval '1 hour' when 'weekly' then now()+interval '7 days' when 'monthly' then now()+interval '1 month' else now()+interval '1 day' end,updated_at=now() where id=p_scheduled_job_id and org_id=p_org_id;
  return jsonb_build_object('ok',true,'scheduledJobRun',to_jsonb(v_run));
end $$;

create or replace function public.ac360_school_upsert_smart_alert_rule(p_org_id uuid,p_rule_id uuid default null,p_rule_key text default null,p_label text default null,p_target_module text default 'general',p_alert_type text default 'operational',p_severity text default 'warning',p_condition_json jsonb default '{}'::jsonb,p_recommendation_json jsonb default '{}'::jsonb,p_status text default 'active',p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_record public.ac360_school_smart_alert_rules%rowtype;
begin
  if p_rule_id is null then
    insert into public.ac360_school_smart_alert_rules(org_id,rule_key,label,target_module,alert_type,severity,condition_json,recommendation_json,status,created_by,metadata_json) values(p_org_id,coalesce(nullif(p_rule_key,''),'smart-rule-'||substr(gen_random_uuid()::text,1,8)),coalesce(nullif(p_label,''),'Smart Alert Rule'),coalesce(p_target_module,'general'),coalesce(p_alert_type,'operational'),coalesce(p_severity,'warning'),coalesce(p_condition_json,'{}'::jsonb),coalesce(p_recommendation_json,'{}'::jsonb),coalesce(p_status,'active'),p_actor_app_user_id,coalesce(p_metadata,'{}'::jsonb)) on conflict(org_id,rule_key) do update set label=excluded.label,target_module=excluded.target_module,alert_type=excluded.alert_type,severity=excluded.severity,condition_json=excluded.condition_json,recommendation_json=excluded.recommendation_json,status=excluded.status,metadata_json=public.ac360_school_smart_alert_rules.metadata_json||excluded.metadata_json,updated_at=now() returning id into v_id;
  else
    update public.ac360_school_smart_alert_rules set label=coalesce(nullif(p_label,''),label),target_module=coalesce(p_target_module,target_module),alert_type=coalesce(p_alert_type,alert_type),severity=coalesce(p_severity,severity),condition_json=coalesce(p_condition_json,condition_json),recommendation_json=coalesce(p_recommendation_json,recommendation_json),status=coalesce(p_status,status),metadata_json=metadata_json||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_rule_id and org_id=p_org_id returning id into v_id;
  end if;
  select * into v_record from public.ac360_school_smart_alert_rules where id=v_id;
  return jsonb_build_object('ok',true,'smartAlertRule',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_emit_smart_alert(p_org_id uuid,p_rule_id uuid default null,p_alert_key text default null,p_target_module text default 'general',p_alert_type text default 'operational',p_severity text default 'warning',p_title text default null,p_message text default null,p_target_entity_type text default null,p_target_entity_id uuid default null,p_recommendation_json jsonb default '{}'::jsonb,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_smart_alerts%rowtype;
begin
  insert into public.ac360_school_smart_alerts(org_id,rule_id,alert_key,target_module,alert_type,severity,title,message,target_entity_type,target_entity_id,recommendation_json,metadata_json) values(p_org_id,p_rule_id,coalesce(nullif(p_alert_key,''),'smart-alert-'||substr(gen_random_uuid()::text,1,10)),coalesce(p_target_module,'general'),coalesce(p_alert_type,'operational'),coalesce(p_severity,'warning'),coalesce(nullif(p_title,''),'Smart alert'),p_message,p_target_entity_type,p_target_entity_id,coalesce(p_recommendation_json,'{}'::jsonb),coalesce(p_metadata,'{}'::jsonb)) on conflict(org_id,alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,recommendation_json=excluded.recommendation_json,status='open',metadata_json=public.ac360_school_smart_alerts.metadata_json||excluded.metadata_json,updated_at=now() returning * into v_record;
  return jsonb_build_object('ok',true,'smartAlert',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_resolve_smart_alert(p_org_id uuid,p_alert_id uuid,p_actor_app_user_id uuid default null,p_resolution_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_smart_alerts%rowtype;
begin
  update public.ac360_school_smart_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('resolution_note',p_resolution_note)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id returning * into v_record;
  return jsonb_build_object('ok',v_record.id is not null,'smartAlert',to_jsonb(v_record));
end $$;

create or replace function public.ac360_school_ai_automation_reconcile(p_org_id uuid,p_as_of_date date default current_date,p_actor_app_user_id uuid default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_snapshot public.ac360_school_ai_automation_snapshots%rowtype; v_due integer; v_failed_ai integer; v_failed_auto integer;
begin
  select count(*) into v_due from public.ac360_school_scheduled_jobs where org_id=p_org_id and status='active' and next_run_at is not null and next_run_at <= now();
  select count(*) into v_failed_ai from public.ac360_school_ai_jobs where org_id=p_org_id and status='failed' and created_at::date >= coalesce(p_as_of_date,current_date) - 7;
  select count(*) into v_failed_auto from public.ac360_school_automation_runs where org_id=p_org_id and status='failed' and created_at::date >= coalesce(p_as_of_date,current_date) - 7;

  insert into public.ac360_school_ai_automation_snapshots(org_id,snapshot_date,active_prompt_templates,queued_ai_jobs,failed_ai_jobs,active_automation_rules,running_automation_runs,failed_automation_runs,active_scheduled_jobs,due_scheduled_jobs,open_smart_alerts,critical_smart_alerts,metadata_json)
  values(
    p_org_id,coalesce(p_as_of_date,current_date),
    (select count(*) from public.ac360_school_ai_prompt_templates where org_id=p_org_id and status='published'),
    (select count(*) from public.ac360_school_ai_jobs where org_id=p_org_id and status in ('queued','running')),
    v_failed_ai,
    (select count(*) from public.ac360_school_automation_rules where org_id=p_org_id and status='active'),
    (select count(*) from public.ac360_school_automation_runs where org_id=p_org_id and status in ('queued','running')),
    v_failed_auto,
    (select count(*) from public.ac360_school_scheduled_jobs where org_id=p_org_id and status='active'),
    v_due,
    (select count(*) from public.ac360_school_smart_alerts where org_id=p_org_id and status in ('open','in_progress')),
    (select count(*) from public.ac360_school_smart_alerts where org_id=p_org_id and status in ('open','in_progress') and severity='critical'),
    coalesce(p_metadata,'{}'::jsonb)
  ) on conflict(org_id,snapshot_date) do update set active_prompt_templates=excluded.active_prompt_templates,queued_ai_jobs=excluded.queued_ai_jobs,failed_ai_jobs=excluded.failed_ai_jobs,active_automation_rules=excluded.active_automation_rules,running_automation_runs=excluded.running_automation_runs,failed_automation_runs=excluded.failed_automation_runs,active_scheduled_jobs=excluded.active_scheduled_jobs,due_scheduled_jobs=excluded.due_scheduled_jobs,open_smart_alerts=excluded.open_smart_alerts,critical_smart_alerts=excluded.critical_smart_alerts,metadata_json=public.ac360_school_ai_automation_snapshots.metadata_json||excluded.metadata_json,created_at=now() returning * into v_snapshot;

  if v_due > 0 then
    insert into public.ac360_school_ai_automation_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'scheduled-jobs-due-'||coalesce(p_as_of_date,current_date),'scheduled_jobs_due','warning','Scheduled jobs due',v_due::text || ' scheduled job(s) are due.','{}'::jsonb)
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,updated_at=now();
  end if;
  if v_failed_ai > 0 or v_failed_auto > 0 then
    insert into public.ac360_school_ai_automation_alerts(org_id,alert_key,alert_type,severity,title,message,metadata_json)
    values(p_org_id,'ai-automation-failures-'||coalesce(p_as_of_date,current_date),'runtime_failures','critical','AI / automation failures detected','Recent AI or automation failures require review.',jsonb_build_object('failed_ai_jobs',v_failed_ai,'failed_automation_runs',v_failed_auto))
    on conflict(org_id,alert_key) do update set status='open',message=excluded.message,metadata_json=excluded.metadata_json,updated_at=now();
  end if;

  return jsonb_build_object('ok',true,'snapshot',to_jsonb(v_snapshot));
end $$;

create or replace function public.ac360_school_resolve_ai_automation_alert(p_org_id uuid,p_alert_id uuid,p_actor_app_user_id uuid default null,p_resolution_note text default null,p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_record public.ac360_school_ai_automation_alerts%rowtype;
begin
  update public.ac360_school_ai_automation_alerts set status='resolved',resolved_at=now(),resolved_by=p_actor_app_user_id,metadata_json=metadata_json||jsonb_build_object('resolution_note',p_resolution_note)||coalesce(p_metadata,'{}'::jsonb),updated_at=now() where id=p_alert_id and org_id=p_org_id returning * into v_record;
  return jsonb_build_object('ok',v_record.id is not null,'alert',to_jsonb(v_record));
end $$;

-- -----------------------------------------------------------------------------
-- 4. Billing feature/action registry and route wiring
-- -----------------------------------------------------------------------------
insert into public.ac360_feature_registry(feature_key,module_key,family,label,description,billing_family,is_core,is_billable,is_enterprise_only,default_meter_key,default_credit_cost,metadata_json) values
('smart_automation_runtime','school_operations','automation_ai','AI, Automation Builder, Smart Alerts & Scheduled Jobs','Prompt templates, AI jobs, automation rules, scheduled jobs and smart alert runtime.','usage',false,true,false,'automation_credit',1,'{"phase":"phase_2n","growthMenu":"workflow_builder_ai_assistant"}'::jsonb)
on conflict(feature_key) do update set module_key=excluded.module_key,family=excluded.family,label=excluded.label,description=excluded.description,billing_family=excluded.billing_family,is_core=excluded.is_core,is_billable=excluded.is_billable,is_enterprise_only=excluded.is_enterprise_only,default_meter_key=excluded.default_meter_key,default_credit_cost=excluded.default_credit_cost,metadata_json=public.ac360_feature_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_action_registry(action_key,feature_key,engine_code,label,description,entitlement_key,meter_key,credit_cost,restriction_behavior,metadata_json) values
('school.ai.prompt.upsert','ai_assistant','AC360-ENG-33','Upsert AI prompt template','Create or update AI prompt template.','ai.prompt.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"ai_assistant"}'::jsonb),
('school.ai.job.queue','ai_assistant','AC360-ENG-33','Queue AI job','Queue AI generation job.','ai.job.queue','ai_credit',10,'require_topup','{"access_type":"usage","phase":"phase_2n_ai_automation","suggested_addon_key":"ai_assistant"}'::jsonb),
('school.ai.job.complete','ai_assistant','AC360-ENG-33','Complete AI job','Complete AI generation job with output.','ai.job.complete',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"ai_assistant"}'::jsonb),
('school.ai.job.event.record','ai_assistant','AC360-ENG-33','Record AI job event','Record AI runtime event.','ai.job.event.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"ai_assistant"}'::jsonb),
('school.automation.blueprint.upsert','automation_builder','AC360-ENG-52','Upsert automation blueprint','Create or update reusable automation blueprint.','automation.blueprint.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.automation.rule.upsert','automation_builder','AC360-ENG-52','Upsert automation rule','Create or update automation rule.','automation.rule.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.automation.run.trigger','automation_builder','AC360-ENG-33','Trigger automation run','Trigger an automation workflow run.','automation.run.trigger','automation_credit',1,'require_topup','{"access_type":"usage","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.automation.event.record','automation_builder','AC360-ENG-52','Record automation event','Record automation run event.','automation.event.record',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.scheduled_job.upsert','automation_builder','AC360-ENG-52','Upsert scheduled job','Create or update scheduled job.','scheduled_job.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.scheduled_job.run','automation_builder','AC360-ENG-33','Run scheduled job','Record scheduled job run.','scheduled_job.run','automation_credit',1,'require_topup','{"access_type":"usage","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.smart_alert.rule.upsert','automation_builder','AC360-ENG-52','Upsert smart alert rule','Create or update smart alert rule.','smart_alert.rule.upsert',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.smart_alert.emit','automation_builder','AC360-ENG-38','Emit smart alert','Emit smart alert from rule or reconciliation.','smart_alert.emit','automation_credit',1,'require_topup','{"access_type":"usage","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.smart_alert.resolve','automation_builder','AC360-ENG-38','Resolve smart alert','Resolve smart alert.','smart_alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.ai_automation.reconcile','automation_builder','AC360-ENG-38','Reconcile AI automation runtime','Refresh AI, automation, scheduled jobs and smart alert snapshots.','ai_automation.reconcile',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb),
('school.ai_automation.alert.resolve','automation_builder','AC360-ENG-38','Resolve AI automation alert','Resolve AI/automation runtime alert.','ai_automation.alert.resolve',null,0,'require_upgrade','{"access_type":"write","phase":"phase_2n_ai_automation","suggested_addon_key":"workflow_builder"}'::jsonb)
on conflict(action_key) do update set feature_key=excluded.feature_key,engine_code=excluded.engine_code,label=excluded.label,description=excluded.description,entitlement_key=excluded.entitlement_key,meter_key=excluded.meter_key,credit_cost=excluded.credit_cost,restriction_behavior=excluded.restriction_behavior,metadata_json=public.ac360_action_registry.metadata_json || excluded.metadata_json,updated_at=now();

insert into public.ac360_app_action_wiring(wiring_key,route_path,http_method,action_key,feature_key,engine_code,target_module,target_table,enforcement_mode,quantity_strategy,idempotency_strategy,current_capacity_strategy,fallback_action_key,status,description,metadata_json)
values
('ac360.school_automation.ai_prompt.upsert','/api/ac360/school-automation/ai-prompts/upsert','POST','school.ai.prompt.upsert','ai_assistant','AC360-ENG-33','angelcare_360_school_automation','ac360_school_ai_prompt_templates','strict','fixed_1','request_or_generated',null,null,'active','Upserts AI prompt template.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.ai_job.queue','/api/ac360/school-automation/ai-jobs/queue','POST','school.ai.job.queue','ai_assistant','AC360-ENG-33','angelcare_360_school_automation','ac360_school_ai_jobs','strict','ai_credit_cost','request_or_generated',null,null,'active','Queues AI job.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.ai_job.complete','/api/ac360/school-automation/ai-jobs/complete','POST','school.ai.job.complete','ai_assistant','AC360-ENG-33','angelcare_360_school_automation','ac360_school_ai_jobs','strict','fixed_1','request_or_generated',null,null,'active','Completes AI job.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.ai_job.event','/api/ac360/school-automation/ai-jobs/events/record','POST','school.ai.job.event.record','ai_assistant','AC360-ENG-33','angelcare_360_school_automation','ac360_school_ai_job_events','strict','fixed_1','request_or_generated',null,null,'active','Records AI job event.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.blueprint.upsert','/api/ac360/school-automation/automation-blueprints/upsert','POST','school.automation.blueprint.upsert','automation_builder','AC360-ENG-52','angelcare_360_school_automation','ac360_school_automation_blueprints','strict','fixed_1','request_or_generated',null,null,'active','Upserts automation blueprint.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.rule.upsert','/api/ac360/school-automation/automation-rules/upsert','POST','school.automation.rule.upsert','automation_builder','AC360-ENG-52','angelcare_360_school_automation','ac360_school_automation_rules','strict','fixed_1','request_or_generated',null,null,'active','Upserts automation rule.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.run.trigger','/api/ac360/school-automation/automation-runs/trigger','POST','school.automation.run.trigger','automation_builder','AC360-ENG-33','angelcare_360_school_automation','ac360_school_automation_runs','strict','fixed_1','request_or_generated',null,null,'active','Triggers automation run.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.event.record','/api/ac360/school-automation/automation-runs/events/record','POST','school.automation.event.record','automation_builder','AC360-ENG-52','angelcare_360_school_automation','ac360_school_automation_run_events','strict','fixed_1','request_or_generated',null,null,'active','Records automation run event.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.scheduled_job.upsert','/api/ac360/school-automation/scheduled-jobs/upsert','POST','school.scheduled_job.upsert','automation_builder','AC360-ENG-52','angelcare_360_school_automation','ac360_school_scheduled_jobs','strict','fixed_1','request_or_generated',null,null,'active','Upserts scheduled job.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.scheduled_job.run','/api/ac360/school-automation/scheduled-jobs/run','POST','school.scheduled_job.run','automation_builder','AC360-ENG-33','angelcare_360_school_automation','ac360_school_scheduled_job_runs','strict','fixed_1','request_or_generated',null,null,'active','Runs scheduled job.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.smart_alert_rule.upsert','/api/ac360/school-automation/smart-alert-rules/upsert','POST','school.smart_alert.rule.upsert','automation_builder','AC360-ENG-52','angelcare_360_school_automation','ac360_school_smart_alert_rules','strict','fixed_1','request_or_generated',null,null,'active','Upserts smart alert rule.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.smart_alert.emit','/api/ac360/school-automation/smart-alerts/emit','POST','school.smart_alert.emit','automation_builder','AC360-ENG-38','angelcare_360_school_automation','ac360_school_smart_alerts','strict','fixed_1','request_or_generated',null,null,'active','Emits smart alert.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.smart_alert.resolve','/api/ac360/school-automation/smart-alerts/resolve','POST','school.smart_alert.resolve','automation_builder','AC360-ENG-38','angelcare_360_school_automation','ac360_school_smart_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves smart alert.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.reconcile','/api/ac360/school-automation/reconcile','POST','school.ai_automation.reconcile','automation_builder','AC360-ENG-38','angelcare_360_school_automation','ac360_school_ai_automation_snapshots','strict','fixed_1','request_or_generated',null,null,'active','Reconciles AI automation runtime.','{"phase":"phase_2n"}'::jsonb),
('ac360.school_automation.alert.resolve','/api/ac360/school-automation/alerts/resolve','POST','school.ai_automation.alert.resolve','automation_builder','AC360-ENG-38','angelcare_360_school_automation','ac360_school_ai_automation_alerts','strict','fixed_1','request_or_generated',null,null,'active','Resolves AI automation runtime alert.','{"phase":"phase_2n"}'::jsonb)
on conflict(wiring_key) do update set route_path=excluded.route_path,http_method=excluded.http_method,action_key=excluded.action_key,feature_key=excluded.feature_key,engine_code=excluded.engine_code,target_module=excluded.target_module,target_table=excluded.target_table,enforcement_mode=excluded.enforcement_mode,quantity_strategy=excluded.quantity_strategy,idempotency_strategy=excluded.idempotency_strategy,current_capacity_strategy=excluded.current_capacity_strategy,fallback_action_key=excluded.fallback_action_key,status=excluded.status,description=excluded.description,metadata_json=public.ac360_app_action_wiring.metadata_json || excluded.metadata_json,updated_at=now();

-- Global automation rule seeds using canonical phase 1 table shape.
insert into public.ac360_automation_rules(rule_key, label, system_group, trigger_event, condition_json, action_json, sort_order, status, phase) values
('phase2n.ai.failures.raise_alert','AI failures raise alert','AI, Automation & Smart Alerts','ai.job.failed','{"failed_ai_jobs_gt":0}'::jsonb,'{"emit_smart_alert":"ai_job_failed"}'::jsonb,270,'active','phase_2n_ai_automation'),
('phase2n.scheduled.jobs.due','Scheduled jobs due alert','AI, Automation & Smart Alerts','scheduled_job.due','{"due_scheduled_jobs_gt":0}'::jsonb,'{"emit_runtime_alert":"scheduled_jobs_due"}'::jsonb,271,'active','phase_2n_ai_automation'),
('phase2n.automation.failures.raise_alert','Automation failures raise alert','AI, Automation & Smart Alerts','automation.run.failed','{"failed_automation_runs_gt":0}'::jsonb,'{"emit_smart_alert":"automation_failure"}'::jsonb,272,'active','phase_2n_ai_automation')
on conflict(rule_key) do update set label=excluded.label,system_group=excluded.system_group,trigger_event=excluded.trigger_event,condition_json=excluded.condition_json,action_json=excluded.action_json,sort_order=excluded.sort_order,status=excluded.status,phase=excluded.phase,updated_at=now();

insert into public.ac360_school_ops_modules(module_key, engine_code, feature_key, label, phase, status, data_tables, guarded_actions, metadata_json)
values('ai_automation_smart_alerts_scheduled_jobs','AC360-ENG-38','smart_automation_runtime','AI, Automation Builder, Smart Alerts & Scheduled Jobs Runtime','phase_2n_ai_automation_smart_alerts_scheduled_jobs','guarded',array['ac360_school_ai_prompt_templates','ac360_school_ai_jobs','ac360_school_automation_rules','ac360_school_automation_runs','ac360_school_scheduled_jobs','ac360_school_smart_alerts'],array['school.ai.prompt.upsert','school.ai.job.queue','school.ai.job.complete','school.automation.rule.upsert','school.automation.run.trigger','school.scheduled_job.upsert','school.scheduled_job.run','school.smart_alert.rule.upsert','school.smart_alert.emit','school.ai_automation.reconcile'],'{"phase":"phase_2n","uiBuildAllowed":false,"backendOnly":true}'::jsonb)
on conflict(module_key) do update set engine_code=excluded.engine_code,feature_key=excluded.feature_key,label=excluded.label,phase=excluded.phase,status=excluded.status,data_tables=excluded.data_tables,guarded_actions=excluded.guarded_actions,metadata_json=public.ac360_school_ops_modules.metadata_json || excluded.metadata_json,updated_at=now();

-- -----------------------------------------------------------------------------
-- 5. RLS service-role policies
-- -----------------------------------------------------------------------------
alter table public.ac360_school_ai_prompt_templates enable row level security;
alter table public.ac360_school_ai_jobs enable row level security;
alter table public.ac360_school_ai_job_events enable row level security;
alter table public.ac360_school_automation_blueprints enable row level security;
alter table public.ac360_school_automation_rules enable row level security;
alter table public.ac360_school_automation_runs enable row level security;
alter table public.ac360_school_automation_run_events enable row level security;
alter table public.ac360_school_scheduled_jobs enable row level security;
alter table public.ac360_school_scheduled_job_runs enable row level security;
alter table public.ac360_school_smart_alert_rules enable row level security;
alter table public.ac360_school_smart_alerts enable row level security;
alter table public.ac360_school_ai_automation_snapshots enable row level security;
alter table public.ac360_school_ai_automation_alerts enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'ac360_school_ai_prompt_templates','ac360_school_ai_jobs','ac360_school_ai_job_events','ac360_school_automation_blueprints','ac360_school_automation_rules','ac360_school_automation_runs','ac360_school_automation_run_events','ac360_school_scheduled_jobs','ac360_school_scheduled_job_runs','ac360_school_smart_alert_rules','ac360_school_smart_alerts','ac360_school_ai_automation_snapshots','ac360_school_ai_automation_alerts'
  ] loop
    if not exists (select 1 from pg_policies where schemaname='public' and tablename=t and policyname=t || '_service_role_all') then
      execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', t || '_service_role_all', t);
    end if;
  end loop;
end $$;

commit;
