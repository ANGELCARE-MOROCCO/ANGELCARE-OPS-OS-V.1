-- RLS blueprint. Review and adapt to your real auth/user profile tables.

alter table ambassador_profiles enable row level security;
alter table ambassador_missions enable row level security;
alter table ambassador_proofs enable row level security;
alter table ambassador_rewards enable row level security;
alter table ambassador_payouts enable row level security;
alter table ambassador_events enable row level security;
alter table ambassador_audit_logs enable row level security;
alter table ambassador_ai_memory enable row level security;
alter table ambassador_ai_actions enable row level security;
alter table ambassador_execution_jobs enable row level security;
alter table ambassador_notifications enable row level security;

-- Example placeholder policy.
-- Replace `public.user_roles` with your actual user profile/role table.

-- create policy "read ambassador profiles for authenticated users"
-- on ambassador_profiles
-- for select
-- to authenticated
-- using (true);

-- create policy "finance can update payouts"
-- on ambassador_payouts
-- for update
-- to authenticated
-- using (
--   exists (
--     select 1 from public.user_roles
--     where user_id = auth.uid()
--     and role in ('ceo', 'finance_operations')
--   )
-- );
