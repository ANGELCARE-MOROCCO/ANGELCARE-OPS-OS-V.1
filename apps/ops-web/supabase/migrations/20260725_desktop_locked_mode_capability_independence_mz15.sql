-- ANGELCARE Mega ZIP 15
-- Desktop 1.7.3 — Corporate Locked capability independence
-- AC+ and split availability are governed by their explicit enable flags,
-- independently of Standard, Focus or Corporate Locked station mode.

set statement_timeout = '5min';
set lock_timeout = '8s';

alter table public.desktop_station_policies
  alter column ac_plus_allowed_modes set default array['standard','focus','locked'],
  alter column split_allowed_modes set default array['standard','focus','locked'];

update public.desktop_station_policies
set
  ac_plus_allowed_modes = array['standard','focus','locked'],
  split_allowed_modes = array['standard','focus','locked']
where
  ac_plus_allowed_modes is distinct from array['standard','focus','locked']
  or split_allowed_modes is distinct from array['standard','focus','locked'];

comment on column public.desktop_station_policies.ac_plus_enabled is
  'Explicit AC+ capability switch. Applies independently in Standard, Focus and Corporate Locked modes.';
comment on column public.desktop_station_policies.split_enabled is
  'Explicit split-view capability switch. Applies independently in Standard, Focus and Corporate Locked modes.';
comment on column public.desktop_station_policies.ac_plus_allowed_modes is
  'Compatibility mode list. MZ15 standardizes all three station modes; ac_plus_enabled remains authoritative.';
comment on column public.desktop_station_policies.split_allowed_modes is
  'Compatibility mode list. MZ15 standardizes all three station modes; split_enabled remains authoritative.';

select
  count(*) filter (where ac_plus_enabled) as policies_with_ac_plus_enabled,
  count(*) filter (where split_enabled) as policies_with_split_enabled,
  count(*) filter (where 'locked' = any(ac_plus_allowed_modes)) as policies_allowing_locked_ac_plus,
  count(*) filter (where 'locked' = any(split_allowed_modes)) as policies_allowing_locked_split,
  'MZ15_LOCKED_MODE_CAPABILITY_INDEPENDENCE_APPLIED'::text as release_marker
from public.desktop_station_policies;
