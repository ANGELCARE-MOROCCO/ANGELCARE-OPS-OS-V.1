-- CareLink Mobile P1 operational execution hardening
-- Adds safe mission action tracking columns used by the canonical mobile action engine.

alter table public.missions
  add column if not exists arrival_confirmed_at timestamptz null,
  add column if not exists checked_in_at timestamptz null,
  add column if not exists delay_reported_at timestamptz null,
  add column if not exists replacement_requested_at timestamptz null,
  add column if not exists last_mobile_action text null,
  add column if not exists last_mobile_action_at timestamptz null;

create index if not exists idx_missions_last_mobile_action_at
  on public.missions(last_mobile_action_at);

create index if not exists idx_missions_delay_reported_at
  on public.missions(delay_reported_at);

create index if not exists idx_missions_replacement_requested_at
  on public.missions(replacement_requested_at);

alter table public.carelink_mobile_action_requests
  add column if not exists failed_at timestamptz null;

create index if not exists idx_carelink_mobile_action_requests_action_type
  on public.carelink_mobile_action_requests(action_type);
