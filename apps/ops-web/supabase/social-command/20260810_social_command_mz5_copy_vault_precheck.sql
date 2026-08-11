-- ANGELCARE SOCIAL COMMAND MZ5 · COPY VAULT PRECHECK
-- Read-only. No mutation.
select
  to_regclass('public.social_command_campaigns') as campaigns,
  to_regclass('public.social_command_publications') as publications,
  to_regclass('public.social_command_bulk_plans') as bulk_plans,
  to_regclass('public.social_command_audit_events') as audit_events,
  to_regclass('public.social_command_metric_snapshots') as metric_snapshots;
