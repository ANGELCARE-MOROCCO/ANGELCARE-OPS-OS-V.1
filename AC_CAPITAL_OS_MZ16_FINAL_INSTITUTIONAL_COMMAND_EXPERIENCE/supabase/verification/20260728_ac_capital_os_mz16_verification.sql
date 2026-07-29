\pset pager off
select
  table_name
from information_schema.tables
where table_schema='public'
  and table_name='ac_capital_command_activity';

select
  indexname
from pg_indexes
where schemaname='public'
  and tablename='ac_capital_command_activity'
order by indexname;

select
  relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname='ac_capital_command_activity';

select count(*) as remaining_exact_ambiguous_patterns
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and pg_get_functiondef(p.oid) ~* 'select[[:space:]]+decision[[:space:]]+into[[:space:]]+decision';
