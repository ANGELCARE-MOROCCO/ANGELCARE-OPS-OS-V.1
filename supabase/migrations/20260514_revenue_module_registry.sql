-- REVENUE COMMAND CENTER CONSOLIDATION PHASE 01
-- Canonical module registry and production migration log.

create table if not exists public.revenue_module_registry (
  id text primary key,
  route text not null,
  canonical_component text not null,
  status text not null default 'canonical',
  source_of_truth text,
  notes text,
  updated_at timestamptz not null default now()
);

insert into public.revenue_module_registry(id, route, canonical_component, status, source_of_truth, notes)
values
('commandCenter', '/revenue-command-center', 'CentralRevenueCore', 'canonical', 'revenue_* tables', 'Main command center should not import old Max/Final/V11 routes.'),
('prospectsDirectory', '/revenue-command-center/prospects/directory', 'ProspectsDirectoryCommandCenter', 'canonical', 'revenue_prospects', 'Directory source of truth.'),
('prospectProfile', '/revenue-command-center/prospects/[id]', 'ProspectFullProfileCommandCenter', 'canonical', 'revenue_prospects + revenue controls', 'Profile source of truth.'),
('tasks', '/revenue-command-center/daily-tasks', 'RevenueDailyTasksV13McKinseyWorkspace', 'next-consolidation-target', 'revenue_tasks', 'Needs source-of-truth pass.'),
('appointments', '/revenue-command-center/appointments', 'RevenueAppointmentsV12MegaWorkspace', 'next-consolidation-target', 'revenue_appointments', 'Needs source-of-truth pass.'),
('partnerships', '/revenue-command-center/partnerships', 'RevenuePartnershipsV13ActionsWorkspace', 'next-consolidation-target', 'revenue_contacts + revenue_events', 'Needs source-of-truth pass.')
on conflict (id) do update set
  route = excluded.route,
  canonical_component = excluded.canonical_component,
  status = excluded.status,
  source_of_truth = excluded.source_of_truth,
  notes = excluded.notes,
  updated_at = now();

alter table public.revenue_module_registry enable row level security;

drop policy if exists authenticated_all_revenue_module_registry on public.revenue_module_registry;
create policy authenticated_all_revenue_module_registry
on public.revenue_module_registry
for all
to authenticated
using (true)
with check (true);
