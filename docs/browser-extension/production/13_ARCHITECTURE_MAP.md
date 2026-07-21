# Architecture Map

Chrome MV3 shell → device-bound session → Extension Gateway → authorization and idempotency → domain services → Supabase persistence and audit. Production plane: telemetry endpoint → runtime health/performance/adapter tables → Production Control cockpit → release channels, feature flags, kill switches, incidents and device fleet. Server authority overrides cached extension state.
