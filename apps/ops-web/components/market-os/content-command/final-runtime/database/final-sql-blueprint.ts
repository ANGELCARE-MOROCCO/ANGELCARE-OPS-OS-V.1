export const finalSqlBlueprint = [
  {
    table: 'market_content_assets',
    sql: `create table if not exists market_content_assets (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      status text not null default 'draft',
      owner_id uuid,
      campaign_id uuid,
      metadata jsonb default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );`,
    reviewRequired: true,
  },
  {
    table: 'market_content_audit_log',
    sql: `create table if not exists market_content_audit_log (
      id uuid primary key default gen_random_uuid(),
      actor_id uuid,
      entity_table text not null,
      entity_id uuid not null,
      action text not null,
      payload jsonb default '{}'::jsonb,
      created_at timestamptz not null default now()
    );`,
    reviewRequired: true,
  },
];