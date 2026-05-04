create table if not exists sales_orchestrator_logs(
id uuid primary key default gen_random_uuid(),
deal_id uuid,
decision text,
context jsonb,
created_at timestamp default now());