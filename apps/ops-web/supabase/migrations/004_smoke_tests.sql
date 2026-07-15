-- Ambassador OS smoke tests after schema is installed.
-- Run carefully in Supabase SQL editor.

select count(*) as ambassador_profiles_count from ambassador_profiles;
select count(*) as ambassador_missions_count from ambassador_missions;
select count(*) as ambassador_events_count from ambassador_events;
select count(*) as ambassador_audit_logs_count from ambassador_audit_logs;
select count(*) as ambassador_execution_jobs_count from ambassador_execution_jobs;

-- Vector extension check:
select extname from pg_extension where extname = 'vector';
