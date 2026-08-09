# Quota and Schedule Governance Report

## Enforced windows

- Minute/hour controls remain provided by the Phase 4 reservation gateway.
- Phase 5 adds authoritative daily, weekly and monthly controls.

## Enforced measurements

- Request count
- Input tokens
- Output tokens
- Total tokens
- Estimated cost
- Concurrent reservations through Phase 4
- Command run frequency
- Retry/cooldown state

## Per-command policy

Every governed AI command can define manual/scheduled eligibility, minimum interval, daily/weekly/monthly run limits, per-run token and cost ceilings, daily/weekly cost ceilings, cache policy, duplicate window, retries, cooldown, provider/model allowances, triggers, approval class and forced-refresh permission.

## Schedule governance

Schedules remain centrally declarative and disabled by default. A module scheduler must call the gateway with the schedule identity; the gateway then enforces due time, enabled/status state, daily/weekly limits, freshness/reuse and budget. The control plane supports enable, pause, resume and suspension management. This package does not invent a background scheduler where none already exists.
