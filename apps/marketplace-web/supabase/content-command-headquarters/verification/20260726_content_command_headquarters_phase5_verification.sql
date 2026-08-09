-- Read-only post-migration verification.
with expected(name) as (values
 ('market_content_signals'),('market_content_strategies'),('market_content_action_plans'),('market_content_missions'),('market_content_mission_tasks'),('market_content_dossiers'),('market_content_checkpoints'),('market_content_evidence'),('market_content_ai_reviews'),('market_content_human_reviews'),('market_content_source_objects'),('market_content_source_replacements'),('market_content_generation_credits'),('market_content_generated_samples'),('market_content_ai_directors'),('market_content_prompt_versions'),('market_content_taxonomy_nodes'),('market_content_publication_packages'),('market_content_performance_events'),('market_content_learning_records'),('market_content_audit')
), checks as(select name,to_regclass('public.'||name) is not null present from expected)
select name,present,case when bool_and(present) over() then 'PHASE5_TABLES_READY' else 'BLOCKED' end as gate from checks order by name;

select p.proname as function_name from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('market_content_next_code','market_content_next_content_code','market_content_register_initial_source','market_content_begin_source_replacement','market_content_commit_source_replacement','market_content_confirm_previous_source_deleted','market_content_fail_source_replacement','market_content_reserve_generation_credit','market_content_release_generation_credit','market_content_commit_generation_credit') order by p.proname;

select c.relname as table_name,c.relrowsecurity as rls_enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname like 'market_content_%' and c.relkind='r' order by c.relname;

select indexname,indexdef from pg_indexes where schemaname='public' and indexname='market_content_one_current_source_idx';
select count(*) as canonical_families from public.market_content_taxonomy_nodes where node_type='family' and stable_key in('digital','print_offline','corporate_document');
