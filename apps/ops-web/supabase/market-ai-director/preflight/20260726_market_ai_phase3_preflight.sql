-- ANGELCARE SANILA Marketing Operations Autopilot Phase 3 — read-only preflight
with required_tables(name) as (
  values
    ('market_ai_skills'),('market_ai_commands'),('market_ai_command_schedules'),('market_ai_mandates'),
    ('market_ai_runs'),('market_ai_action_queue'),('market_ai_bridge_objects'),('market_ai_doctrine_entries'),
    ('market_os_records')
), checks as (
  select name, to_regclass('public.' || name) is not null as present from required_tables
)
select
  name,
  present,
  case when bool_and(present) over () then 'READY' else 'BLOCKED' end as phase3_preflight
from checks
order by name;
