-- ANGELCARE SANILA Marketing Operations Autopilot Phase 3 — post-migration verification
with expected(name) as (values
 ('market_ai_compilations'),('market_ai_compilation_items'),('market_ai_decisions'),('market_ai_execution_jobs'),
 ('market_ai_execution_steps'),('market_ai_tool_registry'),('market_ai_tool_executions'),('market_ai_sync_links'),
 ('market_ai_sync_conflicts'),('market_ai_dead_letters'),('market_ai_bridge_versions'),('market_ai_learning_patterns'),
 ('market_ai_system_locks')
), table_checks as (
 select e.name, p.tablename is not null as present, coalesce(p.rowsecurity,false) as rls_enabled
 from expected e left join pg_tables p on p.schemaname='public' and p.tablename=e.name
)
select * from table_checks order by name;

with tool_check as (
 select count(*) filter(where enabled and tool_name in (
  'campaign.prepare','brief.create','brief.update','content.create_draft','content.update_draft','task.create','task.assign','task.link_dependency',
  'asset.requirement_create','asset.classify','asset.link','review.request','approval_package.prepare','schedule.propose','publishing_package.prepare',
  'bridge.store','bridge.version','bridge.archive','learning.record')) as internal_tools,
  count(*) filter(where external_action or tool_name in ('email.send','whatsapp.send','social.publish','ads.activate','external_form.submit','external_contact.create','public_statement.issue')) as external_tools
 from public.market_ai_tool_registry
)
select internal_tools, external_tools,
  case when internal_tools=19 and external_tools=0 then 'PASS' else 'FAIL' end as tool_gate
from tool_check;

select
  to_regprocedure('public.market_ai_claim_due_jobs(integer,text)') is not null as claim_rpc_present,
  has_function_privilege('authenticated','public.market_ai_claim_due_jobs(integer,text)','EXECUTE') as authenticated_can_claim,
  has_function_privilege('service_role','public.market_ai_claim_due_jobs(integer,text)','EXECUTE') as service_role_can_claim;

select count(*) as compilation_key_column
from information_schema.columns
where table_schema='public' and table_name='market_ai_compilations' and column_name='compilation_key';
