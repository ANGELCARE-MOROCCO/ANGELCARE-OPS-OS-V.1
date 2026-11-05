-- OPTIONAL PERFORMANCE INDEX (recommended for larger activity tables).
-- Run THIS STATEMENT ALONE outside a transaction, at a quiet time.
-- Do NOT combine with BEGIN/COMMIT; PostgreSQL forbids CONCURRENTLY inside a transaction.
-- No rows or event data are modified.
create index concurrently if not exists ac_kidflix_engagement_badges_r1_lookup
on public.ac_dce_activity_v2(record_id, action, subject_key)
where environment = 'production' and action in ('discover', 'start');
