-- GUARDED PHASE 3 ROLLBACK. CURRENT DATABASE BACKUP AND EXPLICIT APPROVAL REQUIRED.
begin;
delete from public.market_ai_doctrine_entries where code in ('DOCTRINE-PHASE3-IDEMPOTENCY','DOCTRINE-PHASE3-CANONICAL','DOCTRINE-PHASE3-HUMAN-GATE');
drop function if exists public.market_ai_claim_due_jobs(integer,text);
drop function if exists public.market_ai_phase3_set_updated_at();
drop table if exists public.market_ai_system_locks;
drop table if exists public.market_ai_learning_patterns;
drop table if exists public.market_ai_bridge_versions;
drop table if exists public.market_ai_dead_letters;
drop table if exists public.market_ai_sync_conflicts;
drop table if exists public.market_ai_sync_links;
drop table if exists public.market_ai_tool_executions;
drop table if exists public.market_ai_tool_registry;
drop table if exists public.market_ai_execution_steps;
drop table if exists public.market_ai_decisions;
drop table if exists public.market_ai_execution_jobs;
drop table if exists public.market_ai_compilation_items;
drop table if exists public.market_ai_compilations;
commit;
