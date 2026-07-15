-- P11 — CARELINK Mobile Dynamic Service-Type Checklists
-- Scope: mobile execution checklist enrichment only. No OPS UI change.

alter table public.carelink_mission_checklist_items
  add column if not exists service_type text null,
  add column if not exists service_family text null,
  add column if not exists item_key text null,
  add column if not exists check_group text null,
  add column if not exists evidence_required boolean not null default false,
  add column if not exists severity text not null default 'standard';

create index if not exists carelink_mission_checklist_items_service_idx
  on public.carelink_mission_checklist_items (mission_id, service_family, check_group, sort_order asc);

create index if not exists carelink_mission_checklist_items_required_open_idx
  on public.carelink_mission_checklist_items (mission_id, required, completed, severity);

create index if not exists carelink_mission_checklist_items_item_key_idx
  on public.carelink_mission_checklist_items (mission_id, item_key);

update public.carelink_mission_checklist_items
set
  service_type = coalesce(service_type, metadata->>'service_type'),
  service_family = coalesce(service_family, metadata->>'service_family'),
  item_key = coalesce(item_key, metadata->>'template_key'),
  check_group = coalesce(check_group, metadata->>'checklist_group'),
  evidence_required = coalesce(evidence_required, (metadata->>'evidence_required')::boolean, false),
  severity = coalesce(nullif(severity, ''), metadata->>'severity', 'standard')
where metadata is not null;
