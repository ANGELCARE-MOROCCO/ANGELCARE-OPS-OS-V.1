create index if not exists idx_serviceos_blueprints_family on public.serviceos_blueprints(family);
create index if not exists idx_serviceos_blueprints_status on public.serviceos_blueprints(status);
create index if not exists idx_serviceos_missions_status on public.serviceos_missions(status);
create index if not exists idx_serviceos_audit_entity on public.serviceos_audit_events("entityType", "entityId");
-- Optional RLS activation: enable when your auth/roles table is finalized.
-- alter table public.serviceos_blueprints enable row level security;
