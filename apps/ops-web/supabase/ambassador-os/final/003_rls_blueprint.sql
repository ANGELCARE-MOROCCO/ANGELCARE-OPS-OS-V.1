alter table ambassador_profiles enable row level security;
alter table ambassador_campaigns enable row level security;
alter table ambassador_missions enable row level security;
alter table ambassador_proofs enable row level security;
alter table ambassador_rewards enable row level security;
alter table ambassador_payouts enable row level security;
alter table ambassador_tasks enable row level security;
alter table ambassador_events enable row level security;
alter table ambassador_audit_logs enable row level security;
alter table ambassador_ai_memory enable row level security;
alter table ambassador_ai_actions enable row level security;
alter table ambassador_execution_jobs enable row level security;
alter table ambassador_notifications enable row level security;
alter table ambassador_telemetry enable row level security;

-- Adapt this blueprint to your real role table.
-- Do not run blind policies without confirming your auth/user_roles structure.
