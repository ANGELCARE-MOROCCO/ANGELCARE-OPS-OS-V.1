export const ambassadorSupabaseSchemaSql = `
create table if not exists ambassadors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  city text not null,
  phone text,
  email text,
  status text not null default 'active',
  tier text not null default 'bronze',
  manager_id uuid,
  health_score integer not null default 75,
  revenue_mad numeric not null default 0,
  generated_leads integer not null default 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ambassador_proofs (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references ambassadors(id) on delete cascade,
  mission_id uuid,
  proof_url text not null,
  status text not null default 'pending',
  reviewer_id uuid,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ambassador_payouts (
  id uuid primary key default gen_random_uuid(),
  ambassador_id uuid references ambassadors(id) on delete cascade,
  amount_mad numeric not null,
  status text not null default 'pending',
  finance_owner_id uuid,
  approval_notes text,
  payment_reference text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ambassador_audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null,
  entity_id text not null,
  action text not null,
  actor_id uuid,
  actor_role text not null,
  summary text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
`;
