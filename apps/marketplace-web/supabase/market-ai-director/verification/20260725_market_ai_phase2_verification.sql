-- ANGELCARE SANILA Marketing Director AI Phase 2 — post-migration verification
select count(*) as skill_count, min(catalog_order) as first_order, max(catalog_order) as last_order
from public.market_ai_skills;

select count(*) as command_count,
       count(distinct code) as unique_command_count,
       min(code) as first_command,
       max(code) as last_command
from public.market_ai_commands;

select case when count(*)=60 and min(catalog_order)=1 and max(catalog_order)=60 then 'PASS' else 'FAIL' end as skill_gate
from public.market_ai_skills;

select case when count(*)=3000 and count(distinct code)=3000 and min(code)='MKT-AI-0001' and max(code)='MKT-AI-3000' then 'PASS' else 'FAIL' end as command_gate
from public.market_ai_commands;

select category,count(*) from public.market_ai_skills group by category order by category;
select status,deployed,count(*) from public.market_ai_commands group by status,deployed order by status,deployed;
select name,command_code,frequency,timezone,enabled,next_run_at from public.market_ai_command_schedules order by name;
select count(*) as external_action_command_count
from public.market_ai_commands
where instruction ~* '(email\.send|whatsapp\.send|social\.publish|ads\.activate|public_statement)';

select tablename,rowsecurity
from pg_tables
where schemaname='public' and tablename like 'market_ai_%'
order by tablename;

select count(*) as bridge_object_count from public.market_ai_bridge_objects;
select count(*) as canonical_doctrine_count from public.market_ai_doctrine_entries where authority_state='canonical';
