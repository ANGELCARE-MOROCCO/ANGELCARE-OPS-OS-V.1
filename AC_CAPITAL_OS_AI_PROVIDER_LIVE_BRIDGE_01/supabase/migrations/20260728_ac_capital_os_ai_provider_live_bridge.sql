begin;

-- AC CAPITAL OS ↔ AI Provider Control governed live bridge.
-- This migration is additive and assumes the already-installed AI Provider Control and AC CAPITAL OS foundations.

do $$
begin
  if to_regclass('public.ai_provider_dossiers') is null
     or to_regclass('public.ai_provider_module_assignments') is null
     or to_regclass('public.ai_provider_command_policies') is null
     or to_regclass('public.ac_capital_ai_agents') is null then
    raise exception 'AC_CAPITAL_AI_PROVIDER_PREREQUISITES_MISSING';
  end if;
end $$;

-- Register AC CAPITAL OS in the Phase 6 extensible module registry when available.
do $$
begin
  if to_regclass('public.ai_ops_module_registry') is not null then
    insert into public.ai_ops_module_registry
      (registry_key, display_name, status, description, contract, metadata, created_at, updated_at)
    values
      ('ac_capital_os', 'AC CAPITAL OS', 'active',
       'Governed capital intelligence, fundraising strategy, qualification, case production and founder-controlled decision support.',
       jsonb_build_object('route','/ac-capital-os','aiRoute','/ac-capital-os/ai-command','riskClass','financial_sensitive','externalActions',false),
       jsonb_build_object('source','AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01'), now(), now())
    on conflict (registry_key) do update set
      display_name=excluded.display_name,
      status='active',
      description=excluded.description,
      contract=coalesce(public.ai_ops_module_registry.contract,'{}'::jsonb)||excluded.contract,
      metadata=coalesce(public.ai_ops_module_registry.metadata,'{}'::jsonb)||excluded.metadata,
      updated_at=now();
  end if;
end $$;

-- Register capital-specific capabilities when the capability registry exists.
do $$
declare capability_row record;
begin
  if to_regclass('public.ai_ops_capability_registry') is not null then
    for capability_row in
      select * from (values
        ('capital_intelligence','Capital Intelligence','Source-aware capital readiness, opportunity and decision support.'),
        ('capital_strategy','Capital Strategy','Capital route, dilution, repayment, runway and founder-control scenario reasoning.'),
        ('capital_case_drafting','Capital Case Drafting','Human-controlled bank, grant, investor and funding case preparation.'),
        ('capital_risk_analysis','Capital Risk Analysis','Risk, missing evidence, pressure and Plan B/C/D preparation.')
      ) as x(registry_key, display_name, description)
    loop
      insert into public.ai_ops_capability_registry
        (registry_key, display_name, status, description, contract, metadata, created_at, updated_at)
      values
        (capability_row.registry_key, capability_row.display_name, 'active', capability_row.description,
         jsonb_build_object('moduleKey','ac_capital_os','humanApproval',true,'externalActions',false),
         jsonb_build_object('source','AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01'), now(), now())
      on conflict (registry_key) do update set
        display_name=excluded.display_name,
        status='active',
        description=excluded.description,
        contract=coalesce(public.ai_ops_capability_registry.contract,'{}'::jsonb)||excluded.contract,
        metadata=coalesce(public.ai_ops_capability_registry.metadata,'{}'::jsonb)||excluded.metadata,
        updated_at=now();
    end loop;
  end if;
end $$;

-- Resolve and activate the already validated dedicated AC Capital dossier and credential.
do $$
declare
  v_dossier_id uuid;
  v_pool_id uuid;
  v_credential_id uuid;
  v_assignment_id uuid;
begin
  select id into v_dossier_id
  from public.ai_provider_dossiers
  where upper(code) in ('GEMINI_AC_CAPITAL_PROD','GEMINI_AC_CAPITAL_OS_PRODUCTION')
     or lower(name) = lower('Gemini AC CAPITAL OS Production')
  order by case when lower(name)=lower('Gemini AC CAPITAL OS Production') then 0 else 1 end, created_at desc
  limit 1;

  if v_dossier_id is null then
    raise exception 'DEDICATED_AC_CAPITAL_PROVIDER_DOSSIER_NOT_FOUND';
  end if;

  select id into v_pool_id
  from public.ai_provider_capacity_pools
  where dossier_id=v_dossier_id
  order by case when status='operating' then 0 else 1 end, created_at asc
  limit 1;

  select id into v_credential_id
  from public.ai_provider_credentials
  where dossier_id=v_dossier_id and status in ('active','validated','standby')
  order by case status when 'active' then 0 when 'validated' then 1 else 2 end, version_number desc
  limit 1;

  if v_credential_id is null then
    raise exception 'VALIDATED_AC_CAPITAL_CREDENTIAL_NOT_FOUND';
  end if;

  update public.ai_provider_credentials
  set status='standby', updated_at=now()
  where dossier_id=v_dossier_id and id<>v_credential_id and status='active';

  update public.ai_provider_credentials
  set status='active', activated_at=coalesce(activated_at,now()), updated_at=now(), failure_code=null
  where id=v_credential_id;

  update public.ai_provider_dossiers
  set status='operating', is_enabled=true, updated_at=now()
  where id=v_dossier_id;

  if v_pool_id is not null then
    update public.ai_provider_capacity_pools set status='operating', updated_at=now() where id=v_pool_id;
  end if;

  insert into public.ai_provider_models
    (dossier_id, model_code, display_name, capability, enabled, primary_for_capability, grounding_allowed, max_output_tokens, metadata, created_at, updated_at)
  values
    (v_dossier_id,'gemini-3.6-flash','Gemini 3.6 Flash — AC Capital','capital_intelligence',true,true,false,4096,jsonb_build_object('moduleKey','ac_capital_os','role','primary'),now(),now()),
    (v_dossier_id,'gemini-3.5-flash-lite','Gemini 3.5 Flash-Lite — AC Capital','capital_intelligence',true,false,false,4096,jsonb_build_object('moduleKey','ac_capital_os','role','fallback'),now(),now())
  on conflict (dossier_id,model_code,capability) do update set
    display_name=excluded.display_name,
    enabled=true,
    primary_for_capability=excluded.primary_for_capability,
    grounding_allowed=excluded.grounding_allowed,
    max_output_tokens=excluded.max_output_tokens,
    metadata=coalesce(public.ai_provider_models.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();

  insert into public.ai_provider_module_assignments
    (module_key,dossier_id,capacity_pool_id,assignment_mode,priority,enabled,capability_allowlist,primary_model,fallback_model,metadata,created_at,updated_at)
  values
    ('ac_capital_os',v_dossier_id,v_pool_id,'primary',10,true,
     array['capital_intelligence','capital_strategy','capital_case_drafting','capital_risk_analysis','structured_strategy','general']::text[],
     'gemini-3.6-flash','gemini-3.5-flash-lite',
     jsonb_build_object('exclusivePurpose','AC CAPITAL OS','externalActions',false,'humanAuthority','Founder / Managing Director'),now(),now())
  on conflict (module_key,dossier_id,assignment_mode) do update set
    capacity_pool_id=excluded.capacity_pool_id,
    priority=10,
    enabled=true,
    capability_allowlist=excluded.capability_allowlist,
    primary_model=excluded.primary_model,
    fallback_model=excluded.fallback_model,
    metadata=coalesce(public.ai_provider_module_assignments.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now()
  returning id into v_assignment_id;

  insert into public.ai_provider_routing_rules
    (module_key,capability,routing_mode,primary_assignment_id,fallback_assignment_ids,sticky_mission,enabled,metadata,created_at,updated_at)
  values
    ('ac_capital_os','capital_intelligence','primary_fallback',v_assignment_id,'{}'::uuid[],true,true,
     jsonb_build_object('manualOnly',true,'externalActions',false,'source','AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01'),now(),now())
  on conflict (module_key,capability) do update set
    routing_mode='primary_fallback',
    primary_assignment_id=excluded.primary_assignment_id,
    fallback_assignment_ids='{}'::uuid[],
    sticky_mission=true,
    enabled=true,
    metadata=coalesce(public.ai_provider_routing_rules.metadata,'{}'::jsonb)||excluded.metadata,
    updated_at=now();
end $$;

-- Conservative module quota: enough to feel alive without creating a request storm.
insert into public.ai_provider_quota_policies
  (scope_type,scope_key,max_requests_per_minute,max_requests_per_hour,max_requests_per_day,max_requests_per_week,max_requests_per_month,
   max_input_tokens_per_day,max_input_tokens_per_week,max_output_tokens_per_day,max_output_tokens_per_week,max_total_tokens_per_week,
   max_estimated_cost_usd_per_day,max_estimated_cost_usd_per_week,max_estimated_cost_usd_per_month,max_grounded_requests_per_day,
   max_concurrent_requests,emergency_reserve_requests,soft_threshold_percent,hard_limit,reset_timezone,enabled,metadata,created_at,updated_at)
values
  ('module','ac_capital_os',3,30,100,500,1800,250000,1200000,180000,850000,2000000,5,20,75,0,1,5,80,true,'Africa/Casablanca',true,
   jsonb_build_object('externalActions',false,'manualGovernedRuns',true,'source','AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01'),now(),now())
on conflict (scope_type,scope_key) do update set
  max_requests_per_minute=excluded.max_requests_per_minute,
  max_requests_per_hour=excluded.max_requests_per_hour,
  max_requests_per_day=excluded.max_requests_per_day,
  max_requests_per_week=excluded.max_requests_per_week,
  max_requests_per_month=excluded.max_requests_per_month,
  max_input_tokens_per_day=excluded.max_input_tokens_per_day,
  max_input_tokens_per_week=excluded.max_input_tokens_per_week,
  max_output_tokens_per_day=excluded.max_output_tokens_per_day,
  max_output_tokens_per_week=excluded.max_output_tokens_per_week,
  max_total_tokens_per_week=excluded.max_total_tokens_per_week,
  max_estimated_cost_usd_per_day=excluded.max_estimated_cost_usd_per_day,
  max_estimated_cost_usd_per_week=excluded.max_estimated_cost_usd_per_week,
  max_estimated_cost_usd_per_month=excluded.max_estimated_cost_usd_per_month,
  max_grounded_requests_per_day=0,
  max_concurrent_requests=1,
  emergency_reserve_requests=5,
  soft_threshold_percent=80,
  hard_limit=true,
  reset_timezone='Africa/Casablanca',
  enabled=true,
  metadata=coalesce(public.ai_provider_quota_policies.metadata,'{}'::jsonb)||excluded.metadata,
  updated_at=now();

-- Manual command policy for the AC Capital AI lab.
insert into public.ai_provider_command_policies
  (module_key,workspace_key,command_code,ai_mode,manual_allowed,scheduled_allowed,minimum_interval_seconds,
   max_runs_per_day,max_runs_per_week,max_runs_per_month,max_input_tokens_per_run,max_output_tokens_per_run,
   max_cost_usd_per_run,max_cost_usd_per_day,max_cost_usd_per_week,max_retries,cache_mode,cache_ttl_seconds,
   duplicate_window_seconds,force_refresh_allowed,approval_class,allowed_provider_types,allowed_models,allowed_trigger_types,
   execution_window,cooldown_after_failure_seconds,consecutive_failure_suspend_threshold,enabled,metadata,created_at,updated_at)
values
  ('ac_capital_os','ai-command-center','AC_CAPITAL_GOVERNED_RUN','ai_recommended',true,false,2,
   100,500,1800,120000,4096,1,5,20,1,'ttl',900,15,true,'route_enforced_sensitive_only',
   array['gemini']::text[],array['gemini-3.6-flash','gemini-3.5-flash-lite']::text[],array['manual','forced_refresh']::text[],
   '{}'::jsonb,300,3,true,
   jsonb_build_object('externalActions',false,'founderApprovalForFinancialSensitive',true,'source','AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01'),now(),now())
on conflict (module_key,workspace_key,command_code) do update set
  ai_mode='ai_recommended',manual_allowed=true,scheduled_allowed=false,minimum_interval_seconds=2,
  max_runs_per_day=100,max_runs_per_week=500,max_runs_per_month=1800,
  max_input_tokens_per_run=120000,max_output_tokens_per_run=4096,max_cost_usd_per_run=1,
  max_cost_usd_per_day=5,max_cost_usd_per_week=20,max_retries=1,cache_mode='ttl',cache_ttl_seconds=900,
  duplicate_window_seconds=15,force_refresh_allowed=true,approval_class='route_enforced_sensitive_only',
  allowed_provider_types=array['gemini']::text[],allowed_models=array['gemini-3.6-flash','gemini-3.5-flash-lite']::text[],
  allowed_trigger_types=array['manual','forced_refresh']::text[],cooldown_after_failure_seconds=300,
  consecutive_failure_suspend_threshold=3,enabled=true,
  metadata=coalesce(public.ai_provider_command_policies.metadata,'{}'::jsonb)||excluded.metadata,
  updated_at=now();

-- First governed capital agent.
insert into public.ac_capital_ai_agents
  (agent_name,agent_key,purpose,status,active_workspace,ai_confidence,doctrine_bound,prompts_bound,skills_bound,
   allowed_actions,forbidden_actions,human_approval_required,cost_usage_placeholder,created_at,updated_at)
values
  ('AC Capital Intelligence Director','ac_capital_intelligence_director',
   'Source-aware capital intelligence, funding opportunity analysis, strategy scenarios, case preparation and founder decision support.',
   'Active','AI Command Center',85,
   array['Founder-control policy','No fabricated capital claims','Evidence before recommendation']::text[],
   array['AC Capital Governed Intelligence V1']::text[],
   array['Capital intelligence','Capital strategy','Capital risk analysis','Case drafting']::text[],
   array['prepare_analysis','prepare_strategy','prepare_case_draft','identify_missing_evidence','recommend_human_actions']::text[],
   array['send_email','submit_application','approve_financial_claim','guarantee_financing','delete_evidence','change_provider_configuration']::text[],
   true,'Tracked by AI Provider Control usage ledger',now(),now())
on conflict (agent_key) do update set
  agent_name=excluded.agent_name,purpose=excluded.purpose,status='Active',active_workspace='AI Command Center',
  doctrine_bound=excluded.doctrine_bound,prompts_bound=excluded.prompts_bound,skills_bound=excluded.skills_bound,
  allowed_actions=excluded.allowed_actions,forbidden_actions=excluded.forbidden_actions,human_approval_required=true,
  cost_usage_placeholder=excluded.cost_usage_placeholder,updated_at=now();

insert into public.ac_capital_ai_prompts
  (prompt_name,target_agent,target_workspace,prompt_version,purpose,input_requirements,output_requirements,tone_rules,
   forbidden_claims,human_approval_requirement,risk_level,test_status,active,owner,change_history,created_at,updated_at)
select
  'AC Capital Governed Intelligence V1','ac_capital_intelligence_director','AI Command Center','v1.0',
  'Produce source-aware capital decision support through the central governed Gemini provider.',
  array['Prompt or selected capital record','Known evidence','Risk level','Human approval context']::text[],
  array['Confirmed facts','Missing data','Risks','Recommendations','Human actions','Confidence']::text[],
  array['Executive','Evidence-led','Direct','No inflated promises']::text[],
  array['Guaranteed financing','Invented eligibility','Invented deadline','Fabricated funder','Fabricated financial performance']::text[],
  'Founder approval is mandatory for financial-sensitive, bank, legal, investor or submission-facing output.',
  'Financial Sensitive','Validated',true,'Founder / Managing Director',
  jsonb_build_array(jsonb_build_object('version','v1.0','source','AC_CAPITAL_OS_AI_PROVIDER_LIVE_BRIDGE_01','createdAt',now())),now(),now()
where not exists (select 1 from public.ac_capital_ai_prompts where prompt_name='AC Capital Governed Intelligence V1' and prompt_version='v1.0');

insert into public.ac_capital_ai_skills
  (skill_name,expert_function,applicable_agents,applicable_workspaces,active_version,confidence_policy,input_expectations,
   output_standards,caution_rules,examples,active,review_status,created_at,updated_at)
select
  x.skill_name,x.expert_function,array['ac_capital_intelligence_director']::text[],array['AI Command Center']::text[],
  'v1.0','Below 65 block; 65-84 human review; 85+ recommendation with human authority retained.',
  array['Evidence','Objective','Constraints','Risk level']::text[],
  array['Source distinction','Missing evidence','Actionable recommendation','No external execution']::text[],
  array['Never invent a capital fact','Never guarantee financing','Never bypass founder approval']::text[],
  '[]'::jsonb,true,'Active',now(),now()
from (values
  ('Capital intelligence','Funding and capital opportunity intelligence'),
  ('Capital strategy','Capital route, dilution, repayment and runway reasoning'),
  ('Capital risk analysis','Risk pressure and Plan B/C/D analysis'),
  ('Case drafting','Bank, grant and investor case preparation')
) as x(skill_name,expert_function)
where not exists (select 1 from public.ac_capital_ai_skills s where s.skill_name=x.skill_name and s.active_version='v1.0');

insert into public.ac_capital_ai_safety_rules
  (rule_title,severity,affected_agents,affected_workspaces,trigger_condition,action_when_triggered,override_allowed,override_authority,audit_required,active,created_at,updated_at)
select x.rule_title,x.severity,array['ac_capital_intelligence_director']::text[],array['AI Command Center']::text[],x.trigger_condition,x.action_when_triggered,false,'Founder / Managing Director',true,true,now(),now()
from (values
 ('Never invent a funder','Critical','Output contains an unverified funder identity','Block output and create a human review issue'),
 ('Never invent eligibility','Critical','Eligibility is not supported by evidence','Block claim and list missing source'),
 ('Never invent a deadline','Critical','Deadline is not source-confirmed','Remove deadline and request verification'),
 ('Never guarantee financing','Critical','Output promises funding success','Block output and escalate'),
 ('Never fabricate financial performance','Critical','Financial claim lacks approved evidence','Block claim and require founder approval'),
 ('No autonomous submission','Critical','Run attempts external application or submission','Block external action'),
 ('No autonomous communication','High','Run attempts email or external message','Prepare draft only and require human send'),
 ('Facts assumptions recommendations separated','High','Output merges facts and assumptions','Return for structured correction'),
 ('Confidence and sources required','High','Output lacks confidence or evidence state','Mark incomplete and require review')
) as x(rule_title,severity,trigger_condition,action_when_triggered)
where not exists (select 1 from public.ac_capital_ai_safety_rules r where r.rule_title=x.rule_title);

insert into public.ac_capital_ai_confidence_policies
  (confidence_range,policy,risk_level,action_required,active,created_at)
select * from (values
 ('85-100','Recommendation may be displayed; human authority remains final.','Controlled','Show evidence and recommended action',true,now()),
 ('65-84','Mandatory human review before operational use.','Medium','Send to human review',true,now()),
 ('0-64','Output is blocked from operational use.','High','Create issue and request missing evidence',true,now())
) as x(confidence_range,policy,risk_level,action_required,active,created_at)
where not exists (select 1 from public.ac_capital_ai_confidence_policies p where p.confidence_range=x.confidence_range);

insert into public.ac_capital_ai_permissions (role_name,permissions,sensitive_permission,active,created_at)
select 'AC Capital Intelligence Director',array['read_capital_records','prepare_analysis','prepare_strategy','prepare_case_draft','create_human_approval_item']::text[],true,true,now()
where not exists (select 1 from public.ac_capital_ai_permissions where role_name='AC Capital Intelligence Director');

update public.ac_capital_ai_provider_bridge
set assignment_mode='primary',capability='capital_intelligence',dossier_strategy='Gemini AC CAPITAL OS Production',
    safety_boundary='AI Provider Control governed runtime; no exposed key; no autonomous external action',status='Connected',updated_at=now()
where module_key='ac_capital_os';

insert into public.ac_capital_ai_provider_bridge
  (module_key,provider_control_route,snapshot_api,action_api,assignment_mode,capability,dossier_strategy,safety_boundary,status,created_at,updated_at)
select 'ac_capital_os','/ai-provider-control','/api/ai-provider-control/snapshot','/api/ai-provider-control/action','primary','capital_intelligence',
       'Gemini AC CAPITAL OS Production','AI Provider Control governed runtime; no exposed key; no autonomous external action','Connected',now(),now()
where not exists (select 1 from public.ac_capital_ai_provider_bridge where module_key='ac_capital_os');

insert into public.ac_capital_ai_provider_settings
  (provider_name_placeholder,model_tier,usage_purpose,cost_sensitivity,monthly_budget_placeholder,fallback_model,max_output_risk_level,
   allowed_agents,blocked_agents,sensitive_output_approval_rule,status,created_at,updated_at)
select 'Gemini AC CAPITAL OS Production','Gemini 3.6 Flash','Capital intelligence and founder decision support','High',
       'Governed by AI Provider Control module quota','gemini-3.5-flash-lite','Financial Sensitive',
       array['ac_capital_intelligence_director']::text[],array[]::text[],
       'Founder / Managing Director approval required for financial-sensitive output','Active',now(),now()
where not exists (select 1 from public.ac_capital_ai_provider_settings where provider_name_placeholder='Gemini AC CAPITAL OS Production');

commit;
