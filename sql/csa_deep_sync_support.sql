-- Optional CSA Deep Sync support tables.
-- Run only if these tables do not exist and you want richer sync.

create table if not exists csa_followups (
  id uuid primary key default gen_random_uuid(),
  family_id uuid,
  lead_id uuid,
  owner_user_id uuid,
  title text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  source_module text not null default 'csa',
  due_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_scores (
  id uuid primary key default gen_random_uuid(),
  source_table text not null,
  source_id uuid,
  score numeric not null default 50,
  category text not null default 'opportunity',
  explanation text,
  created_at timestamptz not null default now()
);

alter table csa_followups enable row level security;
alter table ai_scores enable row level security;

drop policy if exists "csa followups select all" on csa_followups;
create policy "csa followups select all" on csa_followups for select using (true);

drop policy if exists "ai scores select all" on ai_scores;
create policy "ai scores select all" on ai_scores for select using (true);
