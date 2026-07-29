begin;
drop table if exists public.ac_capital_command_activity;
commit;

-- Function-definition rollback is intentionally not automated because MZ16 performs
-- a compatibility repair only when the exact live ambiguity pattern is found.
-- The source installer backup and database function definitions should be archived
-- before production execution when organizational rollback policy requires it.
