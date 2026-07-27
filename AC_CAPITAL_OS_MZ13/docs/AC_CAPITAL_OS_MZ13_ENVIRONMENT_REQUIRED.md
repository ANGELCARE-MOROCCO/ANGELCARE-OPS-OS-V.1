# AC CAPITAL OS MZ13 — Environment Required

Required for Supabase live/fallback reads and writes:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-side privileged operations, never exposed to browser.

AC CAPITAL OS AI flags:

- `AC_CAPITAL_AI_EXECUTION_MODE=dry-run`
- `AC_CAPITAL_AI_PROVIDER_MODE=provider-control`
- `AC_CAPITAL_AI_ALLOW_LIVE_RUNS=false`
- `AC_CAPITAL_AI_ALLOW_RESEARCH=false`
- `AC_CAPITAL_DATA_ROOM_BUCKET=ac-capital-data-room`

Safe default:

- dry-run
- manual mode
- no live provider execution
- no research
- no automatic submission
